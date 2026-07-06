import os
import json
import urllib.request
import urllib.error
import time

brain_dir = r"C:\Users\Jonatan Agustín\Desktop\Proyectos\Juegos\Cook Gatos Kiwii"
dest_path = r"C:\Users\Jonatan Agustín\.gemini\antigravity\brain\ab05ab45-a515-4bb6-bd98-976a4c3a6829\customer_5_draft_v2.png"

# Corrected Prompt
prompt = "A cute Chibi 2D gamer boy with large gaming headphones on his ears. He is holding a handheld gaming console up in front of him, with the screen facing his face (pointing away from the camera, showing the back of the console to the camera) as he looks down at it. Chibi cartoon/kawaii style, flat 2D vector style, clean medium-thick dark brown outlines (#4e3629), soft desaturated pastel colors, front-facing. Plain solid white background. No frames, no borders, no text."

token = "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"
url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

data = json.dumps({"inputs": prompt}).encode("utf-8")

print("Connecting to Hugging Face via FLUX.1-schnell...")
req = urllib.request.Request(url, data=data, headers=headers, method="POST")

# Retry up to 3 times in case the model is loading
for attempt in range(4):
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            image_data = response.read()
            with open(dest_path, "wb") as f:
                f.write(image_data)
            print(f"Success! Saved image to {dest_path}")
            break
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Response: {err_body}")
        if "currently loading" in err_body and attempt < 3:
            print("Model is loading. Waiting 15 seconds before retry...")
            time.sleep(15)
        else:
            break
    except Exception as e:
        print(f"Error occurred: {e}")
        break
