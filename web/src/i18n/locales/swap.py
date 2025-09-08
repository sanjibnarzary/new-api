import json

# Original JSON string
json_string = '{"eng": "hindi", "bodo": "asm"}'
# open en.json file and read its content
with open('en.json', 'r', encoding="utf-8") as file:
    json_string = file.read()
# Load the JSON string into a Python dictionary
lang_dict = json.loads(json_string)

# Swap keys and values using a dictionary comprehension
swapped_dict = {value: key for key, value in lang_dict.items()}

# Convert the swapped dictionary back to a JSON string
swapped_json_string = json.dumps(swapped_dict, indent=4, ensure_ascii=False)

# Print the original and swapped JSON strings
print("Original JSON:")
print(json.dumps(lang_dict, indent=4))

print("\nSwapped JSON:")
print(swapped_json_string)

#write the swapped JSON string to swap.json file
with open('eng-zh.json', 'w', encoding="utf-8") as file:
    file.write(swapped_json_string)
