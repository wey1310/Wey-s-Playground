import fs from 'fs';

let content = fs.readFileSync('src/data/khtn8CurriculumBanks.ts', 'utf8');

// We will just add a notification/console log.
console.log("Banks file is ready.");
