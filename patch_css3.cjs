const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/:where\(\.light\) \.text-slate-300,/g, ':where(.light) .text-slate-300');

fs.writeFileSync('src/index.css', css);
