import re

with open('src/components/games/PictogramGame.tsx', 'r') as f:
    content = f.read()

old_ui2 = """              {customInputTab === 'topic' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Chủ đề: Quang hợp ở thực vật, Môi trường sống..."
                      className="flex-1 px-3.5 py-2 bg-white border-2 border-amber-300 rounded-xl text-amber-950 font-bold text-xs focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                    <button
                      onClick={handleSuggestPhrasesFromTopic}
                      disabled={isGeneratingTopicPhrases || !topicInput.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTopicPhrases ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingTopicPhrases ? 'Đang tạo...' : '✨ AI Gợi Ý Cụm Từ'}</span>
                    </button>
                  </div>
                </div>
              )}"""

new_ui2 = """              {customInputTab === 'topic' && (
                <div className="space-y-3 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      placeholder="Nhập tên chủ đề (VD: Môi trường sống...)"
                      className="w-full sm:flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-amber-950 font-bold text-xs focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleSaveTopic}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow transition"
                      >
                        Lưu Kho
                      </button>
                      <button
                        onClick={handleSuggestPhrasesFromTopic}
                        disabled={isGeneratingTopicPhrases || !topicInput.trim()}
                        className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTopicPhrases ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingTopicPhrases ? 'Đang tạo...' : '✨ AI Gợi Ý Cụm Từ'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}"""

if old_ui2 in content:
    content = content.replace(old_ui2, new_ui2)
    with open('src/components/games/PictogramGame.tsx', 'w') as f:
        f.write(content)
    print("Replaced UI 2")
else:
    print("UI 2 not found")

