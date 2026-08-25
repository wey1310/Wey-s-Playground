import re

with open('src/components/QuestionBankEditor.tsx', 'r') as f:
    content = f.read()

# Replace the block
old_block = """              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={fileImporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F3E5] hover:bg-[#E9D58F]/30 text-[#7A6218] border border-[#E9D58F] font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{fileImporting ? 'Đang Nạp...' : 'Nạp File'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />"""

new_block = """              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8F3E5] hover:bg-[#E9D58F]/30 text-[#7A6218] border border-[#E9D58F] font-bold text-xs shadow-sm transition"
              >
                <Upload className="w-4 h-4" />
                <span>Nhập Câu Hỏi</span>
              </button>"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/components/QuestionBankEditor.tsx', 'w') as f:
        f.write(content)
    print("Replaced!")
else:
    print("Block not found!")
