import re

with open('src/components/GameSetupModal.tsx', 'r') as f:
    content = f.read()

# Add states for savedTopics
state_addition = """  const [wheelCustomPhrasesText, setWheelCustomPhrasesText] = useState<string>(
    'NĂNG LƯỢNG MẶT TRỜI\\nQUANG HỢP Ở THỰC VẬT\\nHỆ TUẦN HOÀN NGƯỜI'
  );
  
  // Custom Topics Storage
  const [savedTopics, setSavedTopics] = useState<{id: string, name: string, phrases: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('wey_saved_topics') || '[]'); } catch { return []; }
  });
  const handleSaveTopic = () => {
    if (!wheelTopicInput.trim() || !wheelCustomPhrasesText.trim()) {
      safeAlert('Vui lòng nhập tên chủ đề và danh sách cụm từ trước khi lưu!');
      return;
    }
    const newTopic = { id: `topic_${Date.now()}`, name: wheelTopicInput.trim(), phrases: wheelCustomPhrasesText.trim() };
    const newTopics = [...savedTopics, newTopic];
    setSavedTopics(newTopics);
    localStorage.setItem('wey_saved_topics', JSON.stringify(newTopics));
    safeAlert('Đã lưu chủ đề vào kho!');
  };
  const handleLoadTopic = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const t = savedTopics.find(x => x.id === id);
    if (t) {
      setWheelTopicInput(t.name);
      setWheelCustomPhrasesText(t.phrases);
    }
  };
"""

content = re.sub(r"  const \[wheelCustomPhrasesText, setWheelCustomPhrasesText\] = useState<string>\([\s\S]*?\);\n", state_addition, content)

new_ui = """                {(wheelPlayMode === 2 || wheelPlayMode === 3) && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Kho Chủ Đề Đã Lưu:</label>
                      <select onChange={handleLoadTopic} className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                        <option value="">-- Chọn chủ đề có sẵn --</option>
                        {savedTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Danh sách cụm từ (Mỗi dòng 1 cụm từ / câu đố):
                      </label>
                      <textarea
                        rows={4}
                        value={wheelCustomPhrasesText}
                        onChange={(e) => setWheelCustomPhrasesText(e.target.value)}
                        placeholder="NĂNG LƯỢNG MẶT TRỜI\\nQUANG HỢP Ở THỰC VẬT\\nHỆ TUẦN HOÀN NGƯỜI"
                        className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200">
                      <input
                        type="text"
                        value={wheelTopicInput}
                        onChange={(e) => setWheelTopicInput(e.target.value)}
                        placeholder="Nhập tên chủ đề (VD: Lịch sử, Tên loài vật...)"
                        className="flex-1 bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveTopic}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black shadow transition flex items-center gap-1"
                        >
                          Lưu Kho
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateWheelPhrasesAI}
                          disabled={isGeneratingWheelPhrases}
                          className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-black shadow transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>AI Sinh Từ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}"""

content = re.sub(r"                \{\(wheelPlayMode === 2 \|\| wheelPlayMode === 3\) && \([\s\S]*?                  <\/div>\n                \)\}", new_ui, content)

with open('src/components/GameSetupModal.tsx', 'w') as f:
    f.write(content)
print("Replaced with regex!")
