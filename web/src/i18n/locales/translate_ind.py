import requests
import json
from time import sleep

def make_bhashini_batch_request(texts, target_lang):
    url = "https://anuvaad-backend.bhashini.co.in/v1/pipeline"
    headers = {"Content-Type": "application/json"}
    data = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": "en",
                        "targetLanguage": target_lang
                    },
                    "serviceId": "ai4bharat/indictrans-v2-all-gpu--t4"
                }
            }
        ],
        "inputData": {
            "input": [{"source": t} for t in texts],
            "audio": [],
        },
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        outputs = result["pipelineResponse"][0]["output"]
        return [o["target"] for o in outputs]
    except Exception as e:
        print(f"Error translating batch to {target_lang}: {e}")
        return [""] * len(texts)

def translate_json(input_file, target_lang):
    with open(input_file, "r", encoding="utf-8") as f:
        en_data = json.load(f)

    keys = list(en_data.keys())
    values = list(en_data.values())
    translated = {}

    batch_size = 5
    for i in range(0, len(values), batch_size):
        batch_keys = keys[i:i+batch_size]
        batch_values = values[i:i+batch_size]
        batch_translations = make_bhashini_batch_request(batch_values, target_lang)
        for k, v, t in zip(batch_keys, batch_values, batch_translations):
            translated[k] = t
            print(f"{k}: {v} -> {t}")
        sleep(1)  # To avoid hitting rate limits

    return translated

if __name__ == "__main__":
    lang_code = input("Enter target language code (e.g., hi, ta, bn, etc.): ").strip()
    translated_dict = translate_json("en.json", lang_code)
    with open(f"indic/{lang_code}.json", "w", encoding="utf-8") as f:
        json.dump(translated_dict, f, ensure_ascii=False, indent=2)
    print(f"Saved translated file: indic/{lang_code}.json")