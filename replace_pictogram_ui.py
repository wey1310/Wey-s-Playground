import re

with open('src/components/games/PictogramGame.tsx', 'r') as f:
    content = f.read()

# Add savedTopics states to PictogramGame
state_addition = """  const [customInputTab, setCustomInputTab] = useState<'direct' | 'topic'>('direct');
  
  // Custom Topics Storage
  const [savedTopics, setSavedTopics] = useState<{id: string, name: string, phrases: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('wey_saved_topics') || '[]'); } catch { return []; }
  });
  const handleSaveTopic = () => {
    if (!topicInput.trim() || !rawPhrasesInput.trim()) {
      safeAlert('Vui lòng nhập tên chủ đề và danh sách cụm từ trước khi lưu!');
      return;
    }
    const newTopic = { id: `topic_${Date.now()}`, name: topicInput.trim(), phrases: rawPhrasesInput.trim() };
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
      setTopicInput(t.name);
      setRawPhrasesInput(t.phrases);
      const lines = t.phrases.split('\\n').map((l) => l.trim().toUpperCase()).filter((l) => l.length > 0);
      if (lines.length > 0) setInputPhrase(lines[0]);
    }
  };
"""

content = re.sub(r"  const \[customInputTab, setCustomInputTab\] = useState<'direct' \| 'topic'>\('direct'\);\n", state_addition, content)


old_ui = """                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={rawPhrasesInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawPhrasesInput(val);
                      const lines = val.split('\\n').map((l) => l.trim().toUpperCase()).filter((l) => l.length > 0);
                      if (lines.length > 0) {
                        setInputPhrase(lines[0]);
                      }
                    }}
                    placeholder={`Ví dụ:\\nNĂNG LƯỢNG MẶT TRỜI\\nQUANG HỢP Ở THỰC VẬT`}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-black text-base focus:outline-none focus:border-amber-500 uppercase shadow-inner resize-y"
                  />"""

new_ui = """                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-amber-100/50 p-2 rounded-xl border border-amber-200">
                    <label className="block text-xs font-bold text-amber-900">Kho Chủ Đề Đã Lưu:</label>
                    <select onChange={handleLoadTopic} className="bg-white border border-amber-200 text-amber-900 font-bold rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">-- Chọn chủ đề có sẵn --</option>
                      {savedTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    value={rawPhrasesInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawPhrasesInput(val);
                      const lines = val.split('\\n').map((l) => l.trim().toUpperCase()).filter((l) => l.length > 0);
                      if (lines.length > 0) {
                        setInputPhrase(lines[0]);
                      }
                    }}
                    placeholder={`Ví dụ:\\nNĂNG LƯỢNG MẶT TRỜI\\nQUANG HỢP Ở THỰC VẬT`}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-black text-base focus:outline-none focus:border-amber-500 uppercase shadow-inner resize-y"
                  />"""

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    with open('src/components/games/PictogramGame.tsx', 'w') as f:
        f.write(content)
    print("Replaced UI 1")
else:
    print("UI 1 not found")

old_ui2 = """              {customInputTab === 'topic' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Nhập tên chủ đề (VD: Lịch sử Việt Nam, Con vật...)"
                      className="flex-1 px-3.5 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleSuggestPhrasesFromTopic}
                      disabled={isGeneratingTopicPhrases}
                      className="shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      {isGeneratingTopicPhrases ? 'Đang tạo...' : 'AI Gợi Ý'}
                    </button>
                  </div>
                </div>
              )}"""

new_ui2 = """              {customInputTab === 'topic' && (
                <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Nhập tên chủ đề (VD: Lịch sử Việt Nam, Con vật...)"
                      className="w-full sm:flex-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-amber-950 font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex w-full sm:w-auto gap-2">
                      <button
                        onClick={handleSaveTopic}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow transition"
                      >
                        Lưu Kho
                      </button>
                      <button
                        onClick={handleSuggestPhrasesFromTopic}
                        disabled={isGeneratingTopicPhrases}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        {isGeneratingTopicPhrases ? 'Đang tạo...' : 'AI Gợi Ý'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 italic px-1">
                    Mẹo: Bấm "Lưu Kho" để cất chủ đề này dùng lại lần sau.
                  </p>
                </div>
              )}"""

if old_ui2 in content:
    content = content.replace(old_ui2, new_ui2)
    with open('src/components/games/PictogramGame.tsx', 'w') as f:
        f.write(content)
    print("Replaced UI 2")
else:
    print("UI 2 not found")

