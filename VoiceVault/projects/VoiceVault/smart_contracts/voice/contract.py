from algopy import (
    ARC4Contract,
    Global,
    UInt64,
    arc4,
    op,
)


class VoiceApp(ARC4Contract):
    """
    A contract that manages AI voice models, rights, and pricing.
    """

    @arc4.abimethod
    def register_voice(
        self,
        name: arc4.String,
        model_uri: arc4.String,
        rights: arc4.String,
        price_per_use: arc4.UInt64,
    ) -> None:
        # Use Global.creator_address bytes as part of the key
        addr_bytes = Global.creator_address.bytes
        
        op.AppGlobal.put(b"exists_" + addr_bytes, UInt64(1))
        # op.AppGlobal.put(b"id_" + addr_bytes, Global.round) # Global.round is fine
        op.AppGlobal.put(b"id_" + addr_bytes, Global.round)
        op.AppGlobal.put(b"name_" + addr_bytes, name.bytes)
        op.AppGlobal.put(b"uri_" + addr_bytes, model_uri.bytes)
        op.AppGlobal.put(b"rights_" + addr_bytes, rights.bytes)
        op.AppGlobal.put(b"price_" + addr_bytes, price_per_use.native)
        op.AppGlobal.put(b"created_" + addr_bytes, Global.latest_timestamp)

    @arc4.abimethod(readonly=True)
    def get_voice_id(self, owner: arc4.Address) -> arc4.UInt64:
        addr_bytes = owner.native.bytes
        val, exists = op.AppGlobal.get_ex_uint64(UInt64(0), b"id_" + addr_bytes)
        assert exists, "Voice ID not found for this owner"
        return arc4.UInt64(val)

    @arc4.abimethod(readonly=True)
    def voice_exists(self, owner: arc4.Address) -> arc4.Bool:
        addr_bytes = owner.native.bytes
        ignored_val, exists = op.AppGlobal.get_ex_uint64(UInt64(0), b"exists_" + addr_bytes)
        return arc4.Bool(exists)

    @arc4.abimethod
    def unregister_voice(self) -> None:
        # Assuming only creator can unregister their own voice for now based on previous logic
        addr_bytes = Global.creator_address.bytes
        op.AppGlobal.delete(b"exists_" + addr_bytes)
        op.AppGlobal.delete(b"id_" + addr_bytes)
        op.AppGlobal.delete(b"name_" + addr_bytes)
        op.AppGlobal.delete(b"uri_" + addr_bytes)
        op.AppGlobal.delete(b"rights_" + addr_bytes)
        op.AppGlobal.delete(b"price_" + addr_bytes)
        op.AppGlobal.delete(b"created_" + addr_bytes)
