const fs = require('fs');
const file = 'src/components/games/WheelGame.tsx';
let code = fs.readFileSync(file, 'utf8');

// The original import
const importTarget = `import { Disc, XCircle, PenLine } from 'lucide-react';`;
const importReplacement = `import { Disc } from 'lucide-react';`;
code = code.replace(importTarget, importReplacement);
code = code.replace(`import { Disc, XCircle, ListEdit } from 'lucide-react';`, `import { Disc } from 'lucide-react';`);

// Remove state (and it might not have been fully added since items didn't exist)
code = code.replace(/  const \[items, setItems\](.|\n)*?\}, \[itemsText\]\);\n/, '');

// Remove button
code = code.replace(/<div className="flex gap-2 items-center">(.|\n)*?<\/button>\s*<\/div>/, '');

// Remove mt-2 from h2
code = code.replace(/<h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-2">/, '<h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">');

// Remove modal
code = code.replace(/\{isEditingList && \((.|\n)*?<\/div>\s*\}\)/, '');

// Remove winner popup
code = code.replace(/\{\/\* Winner Popup \*\/}(.|\n)*?\{\/\* Result Modals \*\/}/, '{/* Result Modals */}');

fs.writeFileSync(file, code);
