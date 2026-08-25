const fs = require('fs');
const file = 'src/components/games/WheelGame.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('isEditingList')) {
  // Add state
  const stateTarget = `  const [items, setItems] = useState<string[]>(config.teams.map(t => t.name));`;
  const stateReplacement = `  const [items, setItems] = useState<string[]>(config.teams.map(t => t.name));\n  const [isEditingList, setIsEditingList] = useState(false);\n  const [itemsText, setItemsText] = useState(items.join('\\n'));\n\n  // Sync textarea\n  useEffect(() => {\n    const parsed = itemsText.split('\\n').map(s => s.trim()).filter(s => s.length > 0);\n    if (parsed.length > 0) setItems(parsed);\n  }, [itemsText]);\n`;
  code = code.replace(stateTarget, stateReplacement);

  // Add import XCircle
  const importTarget = `import { Disc } from 'lucide-react';`;
  const importReplacement = `import { Disc, XCircle, ListEdit } from 'lucide-react';`;
  code = code.replace(importTarget, importReplacement);

  // Add button in header
  const btnTarget = `            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">`;
  const btnReplacement = `
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setIsEditingList(true)}
                className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 rounded-lg font-bold flex items-center gap-1.5 text-xs text-white"
              >
                <ListEdit className="w-4 h-4" /> Sửa danh sách
              </button>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-2">
  `.trim();
  code = code.replace(btnTarget, btnReplacement);

  // Add modal
  const modalTarget = `      {/* Wheel Arena */}`;
  const modalReplacement = `
        {isEditingList && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm pointer-events-auto">
            <div className="bg-slate-900 border-2 border-indigo-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-400">Danh sách trên vòng quay</h3>
                <button onClick={() => setIsEditingList(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <textarea
                className="w-full h-64 bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:border-indigo-400 outline-none resize-none"
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                placeholder="Mỗi dòng một mục..."
              />
              <button
                onClick={() => setIsEditingList(false)}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      {/* Wheel Arena */}
  `.trim();
  code = code.replace(modalTarget, modalReplacement);

  // For Wheel winner logic
  // The user says "doesn't show random student name result"
  // Let's add an alert or a small popup after spinning
  
  const winnerPopupTarget = `      {/* Result Modals */}`;
  const winnerPopupReplacement = `
      {/* Winner Popup */}
      {selectedSliceIdx !== null && !showQuestionModal && config.mode !== 'bank' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center border-4 border-amber-400 animate-in zoom-in duration-300">
               <div className="text-5xl mb-4 animate-bounce">🎉</div>
               <h3 className="text-lg text-slate-500 font-bold mb-1">Kết quả quay:</h3>
               <div className="text-3xl font-black text-amber-600 mb-6">{items[selectedSliceIdx % items.length]}</div>
               <button onClick={() => setSelectedSliceIdx(null)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Đóng</button>
            </div>
         </div>
      )}
      {/* Result Modals */}
  `.trim();
  code = code.replace(winnerPopupTarget, winnerPopupReplacement);

  fs.writeFileSync(file, code);
  console.log("Patched WheelGame.tsx");
}
