import json

# The original dictionary with English keys and Chinese values
original_dict = {
  "Only the first key file will be retained, and the remaining files will be removed. Continue?": "将仅保留第一个密钥文件，其余文件将被移除，是否继续？",
  "Custom model name": "自定义模型名称",
  "Enable all keys": "启用全部密钥",
  "Show with recharge price": "以充值价格显示",
  "USD exchange rate (not recharge rate, only used for pricing page conversion)": "美元汇率（非充值汇率，仅用于定价页面换算）",
  "USD exchange rate": "USD exchange rate"
}

# Create an empty dictionary to store the result
with open('en-zh.json', 'r', encoding="utf-8") as file:
    json_string = file.read()
# Load the JSON string into a Python dictionary
original_dict= json.loads(json_string)

english_only_dict = {}

# Loop through each key in the original dictionary
for key in original_dict:
    # Split the key at the first parenthesis '(' and take the first part
    # .strip() removes any accidental leading or trailing whitespace
    english_text = key.split('(')[0].strip()
    
    # Assign the cleaned English text to be both the key and the value
    english_only_dict[english_text] = english_text

# Convert the final dictionary to a nicely formatted JSON string
final_json = json.dumps(english_only_dict, indent=4)

# Print the result
with open('en.json', 'w', encoding="utf-8") as file:
    file.write(final_json)