const fs = require('fs');
const filePath = 'src/data/khtn8CurriculumBanks.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Function to find matching bracket
function clearQuestionsArray(str) {
  let result = '';
  let i = 0;
  while (i < str.length) {
    const idx = str.indexOf('questions: [', i);
    if (idx === -1) {
      result += str.substring(i);
      break;
    }
    result += str.substring(i, idx + 'questions: ['.length);
    
    // Find matching ']'
    let bracketCount = 1;
    let j = idx + 'questions: ['.length;
    while (j < str.length && bracketCount > 0) {
      if (str[j] === '[') bracketCount++;
      else if (str[j] === ']') bracketCount--;
      j++;
    }
    result += ']';
    i = j;
  }
  return result;
}

code = clearQuestionsArray(code);
fs.writeFileSync(filePath, code);
