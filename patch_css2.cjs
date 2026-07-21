const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// The CSS currently has:
// :where(.light) .text-slate-100,
// :where(.light) .text-slate-200,
// :where(.light) .text-slate-300,
// :where(.light) .text-white {
//   color: #0F172A ;
// }

css = css.replace(/:where\(\.light\) \.text-white/g, '/* removed */');
css = css.replace(/@custom-variant light \(&:is\(:where\(\.light\) \*\)\);/, '@custom-variant light (&:is(.light *));');

// Also remove :where(.light) .bg-slate-800:hover { ... } so Tailwind hover can work fully
css = css.replace(/:where\(\.light\) \.bg-slate-800:hover\s*{[\s\S]*?}/g, '');

fs.writeFileSync('src/index.css', css);
