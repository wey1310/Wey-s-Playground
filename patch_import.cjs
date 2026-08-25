const fs = require('fs');
const file = 'src/components/games/AICameraCallGame.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('FileSpreadsheet')) {
  code = code.replace("import { Users, Video, XCircle, Settings, ChevronRight, Hand, Trophy } from 'lucide-react';", "import { Users, Video, XCircle, Settings, ChevronRight, Hand, Trophy, FileSpreadsheet } from 'lucide-react';");
  fs.writeFileSync(file, code);
}
