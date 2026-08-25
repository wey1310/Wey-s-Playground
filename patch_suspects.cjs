const fs = require('fs');
const file = 'src/components/games/detective/caseProceduralData.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `    const suspectFirstNames = ['Hùng', 'Cường', 'Lan', 'Bách', 'Tuấn', 'Mai', 'Hoa', 'Thành', 'Sơn'];
    c.suspects.forEach(s => {
      s.name = \`\${this.randomItem(['Trần', 'Nguyễn', 'Lê', 'Phạm', 'Hoàng', 'Vũ'])} \${this.randomItem(suspectFirstNames)}\`;
      s.age = 25 + Math.floor(this.rng() * 30);
    });`;

const replacement = target + `
    // Add 0 to 3 extra innocent suspects to make the list size variable
    const numExtraSuspects = Math.floor(this.rng() * 4);
    const jobs = ['Lái xe', 'Người hầu', 'Bảo vệ', 'Đầu bếp phụ', 'Khách mời', 'Kế toán', 'Hàng xóm'];
    for (let i = 0; i < numExtraSuspects; i++) {
      c.suspects.push({
        id: \`suspect_extra_\${i}_\${Math.floor(this.rng() * 1000)}\`,
        name: \`\${this.randomItem(['Trần', 'Nguyễn', 'Lê', 'Phạm', 'Hoàng', 'Vũ'])} \${this.randomItem(suspectFirstNames)}\`,
        title: this.randomItem(jobs),
        avatar: this.randomItem(['🧔', '👩', '🧑', '👱', '👨‍💼', '👩‍💼']),
        gender: this.randomItem(['male', 'female']),
        age: 20 + Math.floor(this.rng() * 40),
        personality: 'Bình thường, hơi lo sợ',
        relationshipToVictim: 'Không thân thiết lắm',
        initialQuote: '“Tôi không biết gì cả, lúc đó tôi đang làm việc của mình.”',
        statements: [
          { id: \`stmt_extra_\${i}\`, topic: 'Ngoại phạm', statementText: 'Tôi ở một mình, không ai làm chứng cả nhưng tôi vô tội.', isInitial: true, hasContradiction: false }
        ],
        claimedAlibi: { timeSlot: 'Không rõ', location: 'Xung quanh', claimedActivity: 'Làm việc', verified: false },
        motive: { apparent: 'Không có động cơ rõ ràng', hidden: '', isDecisive: false },
        isCulprit: false,
        isRedHerring: false
      });
    }
`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
