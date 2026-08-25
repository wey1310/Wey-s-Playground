import re

with open('src/components/api/ApiSelectModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Quick Add section from JSX
content = re.sub(
    r"\{\s*showQuickAdd && \(.*?\)\s*\}",
    "",
    content,
    flags=re.DOTALL
)

# Remove the quick add toggle button
content = re.sub(
    r"<button[^>]*onClick=\{\(\) => setShowQuickAdd\(!showQuickAdd\)\}[^>]*>.*?</button>",
    "",
    content,
    flags=re.DOTALL
)

# Remove form state definitions
content = re.sub(r"const \[showQuickAdd, setShowQuickAdd\] = useState\(false\);\s*// Quick Add Form State.*?\n.*?\n.*?\n.*?\n.*?\n.*?\n", "", content, flags=re.DOTALL)

with open('src/components/api/ApiSelectModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

