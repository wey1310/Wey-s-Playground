const fs = require('fs');

const filePath = 'src/data/khtn8CurriculumBanks.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Replace all questions arrays with empty arrays
let out = code.replace(/questions:\s*\[([^\[\]]*\{[^]*?\}[^\[\]]*)*\]/g, (match) => {
    // This regex might be fragile if there are nested arrays. Let's use a simpler approach.
    return match;
});
fs.writeFileSync('src/data/khtn8CurriculumBanks.ts', out);
