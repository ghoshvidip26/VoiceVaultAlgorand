from beaker import *
from pyteal import *

def voice_exists_key(addr):
    return Concat(Bytes("voice_exists_"), addr)

def voice_id_key(addr):
    return Concat(Bytes("voice_id_"), addr)

def voice_name_key(addr):
    return Concat(Bytes("voice_name_"), addr)

def voice_uri_key(addr):
    return Concat(Bytes("voice_uri_"), addr)

def voice_rights_key(addr):
    return Concat(Bytes("voice_rights_"), addr)

def voice_price_key(addr):
    return Concat(Bytes("voice_price_"), addr)

def voice_created_key(addr):
    return Concat(Bytes("voice_created_"), addr)