const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src/components/games');
const files = fs.readdirSync(gamesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(gamesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix bank mode out of questions
  const bankRegex = /if \(available\.length === 0\) \{\s*available = (?:questions|Array\.from.*)\.map(?:[^;]*);\s*setUsedQuestionIndices\(\[\]\);\s*\}/g;
  
  content = content.replace(bankRegex, `if (available.length === 0) {
        if (onOutOfQuestions) {
          onOutOfQuestions();
          return;
        }
        available = questions.map((_, i) => i);
        setUsedQuestionIndices([]);
      }`);

  // Also replace WheelGame specific message
  const wheelBankRegex = /if \(available\.length === 0\) \{\s*safeAlert\('Tất cả vạch trên vòng quay đã được chọn! Đang kết thúc game\.'\);\s*setTimeout\(\(\) => onGameEnd\(answerLogs\), 500\);\s*return;\s*\}/g;
  content = content.replace(wheelBankRegex, `if (available.length === 0) {
      if (onOutOfQuestions) {
        onOutOfQuestions();
        return;
      }
      safeAlert('Tất cả vạch trên vòng quay đã được chọn! Đang kết thúc game.');
      setTimeout(() => onGameEnd(answerLogs), 500);
      return;
    }`);

  // Fix Mancala specifically
  const mancalaBankRegex = /if \(availableIndices\.length === 0\) \{\s*safeAlert\('Đã quay hết câu hỏi! Đang lặp lại ngân hàng câu hỏi\.'\);\s*availableIndices = questions\.map\(\(_, idx\) => idx\);\s*setUsedQuestionIndices\(\[\]\);\s*\}/g;
  content = content.replace(mancalaBankRegex, `if (availableIndices.length === 0) {
        if (onOutOfQuestions) {
          onOutOfQuestions();
          return;
        }
        safeAlert('Đã quay hết câu hỏi! Đang lặp lại ngân hàng câu hỏi.');
        availableIndices = questions.map((_, idx) => idx);
        setUsedQuestionIndices([]);
      }`);
      
  const openBoxBankRegex = /const handlePickBox = \(index: number\) => \{\s*if \(openedBoxes\[index\]\) return;\s*soundFx\.cardPower\(\);\s*setSelectedBoxIndex\(index\);\s*const boxNum = index \+ 1;\s*setCurrentQuestionNum\(boxNum\);/g;
  // OpenBox has a predefined number of boxes. It doesn't use `usedQuestionIndices` in the same way. We don't really run out of questions mid-game, because total boxes = total questions. 
  
  // Let's add number mode check for common games
  // find: `} else {\n      let randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;`
  const numberModeRegex = /\} else \{\s*let randNum = Math\.floor\(Math\.random\(\) \* config\.totalQuestionsNumber\) \+ 1;/g;
  
  content = content.replace(numberModeRegex, `} else {
      if (usedQuestionIndices.length >= config.totalQuestionsNumber) {
        if (onOutOfQuestions) {
          onOutOfQuestions();
          return;
        }
        setUsedQuestionIndices([]); // Fallback
      }
      let randNum = Math.floor(Math.random() * config.totalQuestionsNumber) + 1;`);

  // Let's handle the mode === 'none' case by bypassing questions.
  // Actually, mode 'none' might be too hard to add if the games expect questions.
  // If mode === 'none', let's just make it so that setCurrentQuestion(null) and we don't show the question modal, we just show "Answer correct" automatically?
  // Wait, if we just set `config.totalQuestionsNumber = 9999` and `mode = 'number'`, they can play forever.

  fs.writeFileSync(filePath, content);
}

console.log('Done');
