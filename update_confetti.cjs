const fs = require('fs');

// 1. Update AdminView.tsx
let adminView = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const sliderCode = `                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-100">
                    <div className="flex flex-col gap-1 w-full max-w-sm">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-700">Cường độ pháo hoa (Số lượng hạt)</span>
                        <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg">{localConfig.randomCallConfettiIntensity ?? 50}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="300"
                        step="10"
                        value={localConfig.randomCallConfettiIntensity ?? 50}
                        onChange={(e) => {
                          const nextVal = parseInt(e.target.value, 10);
                          const updated = { ...localConfig, randomCallConfettiIntensity: nextVal };
                          setLocalConfig(updated);
                          onUpdateWebConfig(updated);
                        }}
                        className="w-full accent-rose-500 h-2 bg-rose-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center justify-between gap-2">`;

adminView = adminView.replace(/                  <\/div>\n\n                  <div className="pt-2 border-t border-rose-200\/60 flex flex-wrap items-center justify-between gap-2">/, sliderCode);

adminView = adminView.replace(/particleCount: 150,/, "particleCount: localConfig.randomCallConfettiIntensity ?? 50,");

fs.writeFileSync('src/components/AdminView.tsx', adminView);


// 2. Update RandomCallGame.tsx
let game = fs.readFileSync('src/components/games/RandomCallGame.tsx', 'utf8');

game = game.replace(/confetti\({[\s\S]*?particleCount: 120 \+ effectiveCount \* 25,[\s\S]*?}\);/, `confetti({\n            particleCount: config.randomCallConfettiIntensity ?? 50,\n            spread: 80 + effectiveCount * 10,\n            origin: { y: 0.6 },\n            colors: ['#E08283', '#E9D58F', '#F59E0B', '#3B82F6', '#EC4899']\n          });`);

game = game.replace(/confetti\({ particleCount: 50, spread: 60, origin: { y: 0.7 } }\);/, "confetti({ particleCount: config.randomCallConfettiIntensity ?? 50, spread: 60, origin: { y: 0.7 } });");

game = game.replace(/confetti\({ particleCount: 80, spread: 70, origin: { y: 0.7 } }\);/, "confetti({ particleCount: config.randomCallConfettiIntensity ?? 50, spread: 70, origin: { y: 0.7 } });");

fs.writeFileSync('src/components/games/RandomCallGame.tsx', game);
