import httpx
import json

def test_inference_request():
    url = "http://localhost:8000/v1/voices/OWRNER_ADDRESS/infer"
    payload = {"prompt": "Hello World"}
    
    print(f"Making request to {url}...")
    try:
        response = httpx.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 402:
            print("Received 402 Payment Required!")
            print("Headers:")
            for k, v in response.headers.items():
                if k.lower().startswith("p-"):
                    print(f"  {k}: {v}")
            try:
                print("Body:", json.dumps(response.json(), indent=2))
            except:
                print("Body:", response.text)
        else:
            print("Response:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_inference_request()
