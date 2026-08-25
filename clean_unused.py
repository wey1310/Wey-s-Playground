import re

with open('src/components/QuestionBankEditor.tsx', 'r') as f:
    content = f.read()

# Remove fileInputRef
content = re.sub(r"  const fileInputRef = useRef<HTMLInputElement>\(null\);\n", "", content)

# Remove handleFileUpload
content = re.sub(r"  const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?  \};\n\n", "", content)

with open('src/components/QuestionBankEditor.tsx', 'w') as f:
    f.write(content)
print("Cleaned!")
