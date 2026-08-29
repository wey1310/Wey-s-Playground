const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

content = content.replace(
  `onClick={() => {
                          const newTheme = th.id as any;
                          setLocalConfig({ ...localConfig, primaryTheme: newTheme });
                          onUpdateWebConfig({ ...webConfig, primaryTheme: newTheme });
                        }}`,
  `onClick={() => {
                          const newTheme = th.id as any;
                          setLocalConfig({ ...localConfig, primaryTheme: newTheme });
                          
                          // Preview theme immediately
                          const themeClass = newTheme && newTheme !== 'pastel' ? \`theme-\${newTheme}\` : '';
                          Array.from(document.body.classList).forEach(c => {
                            if (c.startsWith('theme-')) {
                              document.body.classList.remove(c);
                            }
                          });
                          if (themeClass) {
                            document.body.classList.add(themeClass);
                          }
                        }}`
);

fs.writeFileSync('src/components/AdminView.tsx', content);
console.log('updated AdminView.tsx');
