import re

with open('src/components/QuestionBankEditor.tsx', 'r') as f:
    content = f.read()

old_end = """        </div>
      </div>
  );
};"""

new_end = """        </div>
      </div>
      
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(parsedQuestions) => {
          if (handleUpdate) {
            handleUpdate({
              ...currentBank,
              questions: [...currentBank.questions, ...parsedQuestions],
            });
          }
          safeAlert(`Đã nạp thành công ${parsedQuestions.length} câu hỏi!`);
        }}
      />
  );
};"""

if old_end in content:
    content = content.replace(old_end, new_end)
    with open('src/components/QuestionBankEditor.tsx', 'w') as f:
        f.write(content)
    print("Added Modal!")
else:
    print("End block not found!")
