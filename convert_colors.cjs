const fs = require('fs');
const path = require('path');

const colorMap = {
  '#FEF9F5': 'w-bg-main',
  '#F8F3E5': 'w-bg-main',
  '#FEF6F5': 'w-bg-card',
  '#FFFDF5': 'w-bg-card',
  '#FDF2E9': 'w-bg-alt',
  '#FAF7EE': 'w-bg-alt',
  '#FDEDEC': 'w-bg-tag',
  '#F8F4E8': 'w-bg-tag',
  '#FADBD8': 'w-border',
  '#DED5B8': 'w-border',
  '#E8F8F5': 'w-accent-light',
  '#E9F0D9': 'w-accent-light',
  '#D1F2EB': 'w-accent-muted',
  '#DCEBCB': 'w-accent-muted',
  '#A3E4D7': 'w-accent-border',
  '#B9CDA0': 'w-accent-border',
  '#F1948A': 'w-primary',
  '#6F8F55': 'w-primary',
  '#E08283': 'w-primary-dark',
  '#4F683C': 'w-primary-dark',
  '#D98880': 'w-primary-hover',
  '#3D522B': 'w-primary-hover',
  '#5F7E4B': 'w-primary-hover',
  '#2C3E50': 'w-text-main',
  '#35452E': 'w-text-main',
  '#7F8C8D': 'w-text-muted',
  '#74806B': 'w-text-muted',
  '#717D7E': 'w-text-muted',
  '#55644E': 'w-text-muted'
};

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const newContent = content.replace(/([a-z]+)-\[(#[A-Fa-f0-9]{6})\](\/[0-9]+)?/gi, (match, prefix, hex, opacity) => {
        let hexUpper = hex.toUpperCase();
        if(colorMap[hexUpper]) {
            return `${prefix}-${colorMap[hexUpper]}${opacity || ''}`;
        }
        return match;
      });

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated colors in ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done converting colors!');
