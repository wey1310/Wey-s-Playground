const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components/games');

const replacements = [
  { from: /bg-slate-950(\/[0-9]+)?/g, to: 'bg-[#FFFDF5]' },
  { from: /bg-slate-900(\/[0-9]+)?/g, to: 'bg-[#FAF7EE]' },
  { from: /bg-slate-800(\/[0-9]+)?/g, to: 'bg-[#E9F0D9]' },
  { from: /text-slate-300(\/[0-9]+)?/g, to: 'text-[#4F683C]' },
  { from: /text-slate-400(\/[0-9]+)?/g, to: 'text-[#74806B]' },
  { from: /text-white/g, to: 'text-[#35452E]' },
  { from: /border-slate-800(\/[0-9]+)?/g, to: 'border-[#DED5B8]' },
  { from: /border-slate-700(\/[0-9]+)?/g, to: 'border-[#B9CDA0]' },
  { from: /bg-black\/[0-9]+/g, to: 'bg-white/70 backdrop-blur-sm' },
  { from: /bg-indigo-950(\/[0-9]+)?/g, to: 'bg-[#FAF7EE]' },
  { from: /bg-indigo-900(\/[0-9]+)?/g, to: 'bg-indigo-50' },
  { from: /text-amber-400(\/[0-9]+)?/g, to: 'text-amber-600' },
  { from: /text-amber-300(\/[0-9]+)?/g, to: 'text-amber-600' },
  { from: /text-blue-400(\/[0-9]+)?/g, to: 'text-blue-700' },
  { from: /text-blue-300(\/[0-9]+)?/g, to: 'text-blue-800' },
  { from: /border-indigo-500\/40/g, to: 'border-indigo-200' },
  { from: /border-amber-400\/[0-9]+/g, to: 'border-amber-400' },
  { from: /bg-slate-950/g, to: 'bg-white' },
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rule of replacements) {
        const newContent = content.replace(rule.from, rule.to);
        if (newContent !== content) {
          changed = true;
          content = newContent;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(dir);
console.log('Done pastelizing games!');
