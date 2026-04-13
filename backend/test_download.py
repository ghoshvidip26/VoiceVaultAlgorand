import requests
import json

url = "http://localhost:3000/api/shelby/download"

payload1 = {
    "uri": "shelby://0x123/voices/voice_abc",
    "filename": "preview.wav",
    "requesterAccount": "0x123"
}

payload2 = {
    "uri": "something_else",
    "filename": "preview.wav",
    "requesterAccount": "0x123"
}

print("Testing valid shelby URI:")
r1 = requests.post(url, json=payload1)
print(r1.status_code, r1.text)

print("\nTesting invalid shelby URI:")
r2 = requests.post(url, json=payload2)
print(r2.status_code, r2.text)
