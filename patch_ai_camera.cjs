const fs = require('fs');
const file = 'src/components/games/AICameraCallGame.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('isEditingList')) {
  // 1. Add state
  const stateTarget = `  const [isStarted, setIsStarted] = useState(false);`;
  const stateReplacement = `  const [isStarted, setIsStarted] = useState(false);\n  const [isEditingList, setIsEditingList] = useState(false);\n  const [studentsText, setStudentsText] = useState(students.join('\\n'));\n\n  // Sync textarea\n  useEffect(() => {\n    const parsed = studentsText.split('\\n').map(s => s.trim()).filter(s => s.length > 0);\n    setStudents(parsed);\n  }, [studentsText]);\n`;
  code = code.replace(stateTarget, stateReplacement);

  // 2. Add button
  const btnTarget = `<div className="text-xs text-white/50 bg-black/50 px-3 py-1 rounded-lg">`;
  const btnReplacement = `
            <button
              onClick={() => setIsEditingList(true)}
              className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-2 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Sửa Danh Sách
            </button>
            <div className="text-xs text-white/50 bg-black/50 px-3 py-1 rounded-lg">
  `.trim();
  code = code.replace(btnTarget, btnReplacement);

  // 3. Add modal
  const modalTarget = `        {/* Instructions */}`;
  const modalReplacement = `
        <AnimatePresence>
          {isEditingList && (
            <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border-2 border-cyan-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-cyan-400">Chỉnh sửa danh sách học sinh</h3>
                  <button onClick={() => setIsEditingList(false)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <textarea
                  className="w-full h-64 bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-cyan-400 outline-none resize-none"
                  value={studentsText}
                  onChange={(e) => setStudentsText(e.target.value)}
                  placeholder="Mỗi dòng một tên học sinh..."
                />
                <button
                  onClick={() => setIsEditingList(false)}
                  className="w-full mt-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors"
                >
                  Xác nhận
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Instructions */}
  `.trim();
  code = code.replace(modalTarget, modalReplacement);

  fs.writeFileSync(file, code);
  console.log("Patched AICameraCallGame.tsx");
}
