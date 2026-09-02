const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement logic:
app = app.replace(/return <([A-Za-z0-9_]+Game) /g, "return <$1\n        // @ts-ignore\n        ");

fs.writeFileSync('src/App.tsx', app);
