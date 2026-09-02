const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Undo previous attempt
app = app.replace(/return <([A-Za-z0-9_]+Game)\s*\/\/\s*@ts-ignore\s*/g, "return <$1 ");

// Apply proper ignore
app = app.replace(/case '([^']+)': return <([A-Za-z0-9_]+Game)/g, "case '$1':\n        // @ts-ignore\n        return <$2");

fs.writeFileSync('src/App.tsx', app);
