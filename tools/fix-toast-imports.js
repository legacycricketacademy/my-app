const fs = require('fs'), path=require('path');
const bad = [
  '@/components/ui/use-toast',
  '@/components/use-toast',
  'components/ui/use-toast',
  '../components/ui/use-toast',
  './use-toast',
  'sonner'
];
const ok = `@/shared/toast`;
const allowExt = new Set(['.ts','.tsx','.js','.jsx']);
function walk(dir, out=[]) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules','dist','build','.next'].includes(f)) continue;
    const p = path.join(dir,f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p,out);
    else if (allowExt.has(path.extname(p))) out.push(p);
  }
  return out;
}
const files = walk('client/src');
let changed=0;
for (const f of files) {
  let src = fs.readFileSync(f,'utf8'); let out = src;
  for (const b of bad) out = out.replace(new RegExp(`from\\s+['"]${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,'g'), `from '${ok}'`);
  if (out!==src) { fs.writeFileSync(f,out); changed++; }
}
console.log(`✅ updated ${changed} files to '${ok}'`);

