const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');
content = content.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant light (&:is(.light *));');
fs.writeFileSync('src/index.css', content);
