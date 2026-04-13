from beaker import *
from pyteal import *

from hello_world.helpers import voice_created_key, voice_exists_key, voice_id_key, voice_name_key, voice_price_key, voice_rights_key, voice_uri_key

app = Application("Voice")

@app.external
def registerVoice(name: abi.String,modelUri: abi.String,rights: abi.String,pricePerUse: abi.Uint64): 
    sender = Txn.sender()
    voice_exists = App.globalGetEx(Global.current_application_id(), voice_exists_key(sender))
    return Seq(
        voice_exists,
        # Ensure voice does not already exist
        Assert(voice_exists.hasValue()==Int(0)),
        
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
    voice_id = App.globalGetEx(Global.current_application_id(), key)
    return Seq(
        voice_id,
        Assert(voice_id.hasValue()),
        output.set(voice_id.value())
    )
    
@app.external(read_only=True)
def voice_exists(owner: abi.Address, *, output: abi.Bool):
    voice_exists_value = App.globalGetEx(Global.current_application_id(), voice_exists_key(owner.get()))
    return Seq(
        voice_exists_value,
        output.set(voice_exists_value.hasValue())
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
