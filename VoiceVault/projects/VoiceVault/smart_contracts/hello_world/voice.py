from beaker import *
from pyteal import *

from hello_world.helpers import voice_created_key, voice_exists_key, voice_id_key, voice_name_key, voice_price_key, voice_rights_key, voice_uri_key

app = Application("Voice")

@app.external
def registerVoice(name: abi.String,modelUri: abi.String,rights: abi.String,pricePerUse: abi.Uint64): 
    sender = Txn.sender()
    return Seq(
        # Ensure voice does not already exist
        Assert(App.globalGetEx(Global.current_application_id(),voice_exists_key(sender)).hasValue()==Int(0)),
        
        # Store data
        App.globalPut(voice_exists_key(sender),Int(1)),
        App.globalPut(voice_id_key(sender), Global.round()),  # simple id substitute

        App.globalPut(voice_name_key(sender), name.get()),
        App.globalPut(voice_uri_key(sender), modelUri.get()),
        App.globalPut(voice_rights_key(sender), rights.get()),
        App.globalPut(voice_price_key(sender), pricePerUse.get()),
        App.globalPut(voice_created_key(sender), Global.latest_timestamp()),
    )

@app.external(read_only=True)
def getVoiceId(owner: abi.Address,*,output: abi.Uint64): 
    key = voice_id_key(owner.get())
    return Seq(
        Assert(App.globalGetEx(Global.current_application_id(), key).hasValue()),
        output.set(App.globalGet(key))
    )
    
@app.external(read_only=True)
def getMetadata(owner: abi.Address,*,output: abi.Tuple[
    abi.Address,
    abi.Uint64,
    abi.String,
    abi.String,
    abi.String,
    abi.Uint64,
    abi.Uint64
]): 
    addr = owner.get()

    return Seq(
        Assert(App.globalGet(voice_exists_key(addr)) == Int(1)),

        output.set(
            addr,
            App.globalGet(voice_id_key(addr)),
            App.globalGet(voice_name_key(addr)),
            App.globalGet(voice_uri_key(addr)),
            App.globalGet(voice_rights_key(addr)),
            App.globalGet(voice_price_key(addr)),
            App.globalGet(voice_created_key(addr)),
        )
    )

@app.external(read_only=True)
def voice_exists(owner: abi.Address, *, output: abi.Bool):
    return output.set(
        App.globalGetEx(Global.current_application_id(), voice_exists_key(owner.get())).hasValue()
    )

def counter_key(addr):
    return Concat(Bytes("counter_"), addr)

@app.external
def unregister_voice():
    sender = Txn.sender()

    return Seq(
        Assert(App.globalGet(voice_exists_key(sender)) == Int(1)),

        App.globalDel(voice_exists_key(sender)),
        App.globalDel(voice_id_key(sender)),
        App.globalDel(voice_name_key(sender)),
        App.globalDel(voice_uri_key(sender)),
        App.globalDel(voice_rights_key(sender)),
        App.globalDel(voice_price_key(sender)),
        App.globalDel(voice_created_key(sender)),
    )