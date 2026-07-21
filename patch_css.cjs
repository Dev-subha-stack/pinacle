const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace .light with :where(.light)
css = css.replace(/\.light /g, ':where(.light) ');
// .light, .light body -> :where(.light), :where(.light) body
css = css.replace(/\.light,/g, ':where(.light),');

// Remove all !important
css = css.replace(/!important/g, '');

// Fix .text-white being overridden
css = css.replace(/:where\(\.light\) \.text-slate-100,:where\(\.light\) \.text-slate-200,:where\(\.light\) \.text-slate-300,:where\(\.light\) \.text-white/g, 
':where(.light) .text-slate-100, :where(.light) .text-slate-200, :where(.light) .text-slate-300');

fs.writeFileSync('src/index.css', css);
