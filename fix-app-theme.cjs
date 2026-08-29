const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the document.body.classList manipulation
content = content.replace(
  /    \/\/ Apply dynamic theme to body[\s\S]*?    if \(themeClass\) \{\n      document\.body\.classList\.add\(themeClass\);\n    \}\n/,
  ''
);

// 2. Add theme class to the root div
const rootDivSearch = /className=\{\`min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 \$\{/;

const themeClassInjection = `
  const activeThemeClass = webConfig.primaryTheme && webConfig.primaryTheme !== 'pastel' ? \`theme-\${webConfig.primaryTheme}\` : '';

  return (
    <div
      className={\`\${activeThemeClass} min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 \${`;

content = content.replace(
  /  return \(\n    <div\n      className=\{\`min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 \$\{/,
  themeClassInjection
);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx theme application');
