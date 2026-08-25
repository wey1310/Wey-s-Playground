const fs = require('fs');
const file = 'src/components/games/RandomCallGame.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the key issue in RandomCallGame
code = code.replace(/key=\{displayRollNames\[0\] \|\| '---\'\}/g, 'key={isRolling ? "rolling" : (displayRollNames[0] || "empty")}');
code = code.replace(/key=\{\`\$\{idx\}_\$\{name\}\`\}/g, 'key={isRolling ? `rolling_${idx}` : `final_${idx}_${name}`}');

fs.writeFileSync(file, code);
