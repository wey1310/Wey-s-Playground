import re

with open('src/components/api/ApiSelectModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace handleSelectAndVerify
new_handle = """  const handleSelectAndProceed = (config: GeminiApiConfig) => {
    apiManager.setActiveApiId(config.id);
    setVerifyMessage({
      id: config.id,
      text: `✓ Đã chọn API. Bắt đầu thực thi AI...`,
    });
    setTimeout(() => {
      onSelectAndProceed(config);
      onClose();
    }, 400);
  };
"""

content = re.sub(
    r"const handleSelectAndVerify = async.*?};",
    new_handle,
    content,
    flags=re.DOTALL
)

content = content.replace("handleSelectAndVerify(", "handleSelectAndProceed(")

with open('src/components/api/ApiSelectModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
