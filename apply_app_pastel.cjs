const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Background creams -> Warm Cream/Pink
  { from: /#FFFDF5/g, to: '#FEF6F5' }, // Very light warm pinkish-cream
  { from: /#FAF7EE/g, to: '#FDF2E9' }, // Light peach
  { from: /#F8F4E8/g, to: '#FDEDEC' }, // Very light pink for tags
  
  // Borders
  { from: /#DED5B8/g, to: '#FADBD8' }, // Soft pink border
  
  // Greens -> Pastel Mint Greens
  { from: /#E9F0D9/g, to: '#E8F8F5' }, // Light mint
  { from: /#DCEBCB/g, to: '#D1F2EB' }, // Slightly deeper mint
  { from: /#B9CDA0/g, to: '#A3E4D7' }, // Mint border
  
  // Dark Greens -> Pastel Coral/Pink & Slate
  { from: /#6F8F55/g, to: '#F1948A' }, // Button background (coral)
  { from: /#4F683C/g, to: '#E08283' }, // Text/Icons highlight (rose pink)
  { from: /#3D522B/g, to: '#D98880' }, // Button hover
  { from: /#5F7E4B/g, to: '#D98880' }, // Another button hover
  
  // Texts
  { from: /#35452E/g, to: '#2C3E50' }, // Dark text
  { from: /#74806B/g, to: '#7F8C8D' }, // Muted text
  { from: /#55644E/g, to: '#717D7E' }, // Muted text
];

let changed = false;
for (const rule of replacements) {
  const newContent = content.replace(rule.from, rule.to);
  if (newContent !== content) {
    changed = true;
    content = newContent;
  }
}

if (changed) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
} else {
  console.log('No changes needed.');
}
