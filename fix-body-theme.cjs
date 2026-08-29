const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the activeThemeClass from root div
content = content.replace(
  /  const activeThemeClass = webConfig.primaryTheme && webConfig.primaryTheme !== 'pastel' \? \`theme-\$\{webConfig.primaryTheme\}\` : '';\n\n  return \(\n    <div\n      className=\{\`\$\{activeThemeClass\} min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 \$\{/,
  `  return (
    <div
      className={\`min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 \${`
);

// 2. Put back the document.body logic in the useEffect
content = content.replace(
  /    document\.title = webConfig\.siteTitle \|\| "WEY'S PLAYGROUND";\n/,
  `    document.title = webConfig.siteTitle || "WEY'S PLAYGROUND";
    
    // Apply dynamic theme to body
    const themeClass = webConfig.primaryTheme && webConfig.primaryTheme !== 'pastel' ? \`theme-\${webConfig.primaryTheme}\` : '';
    // Remove all theme classes first
    Array.from(document.body.classList).forEach(c => {
      if (c.startsWith('theme-')) {
        document.body.classList.remove(c);
      }
    });
    // Add the selected theme if any
    if (themeClass) {
      document.body.classList.add(themeClass);
    }
`
);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed body theme application');
