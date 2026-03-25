const fs = require('fs');
const files = [
  'src/app/portal/contratista/[token]/page.tsx',
  'src/app/dashboard/(planear)/paso18/page.tsx',
  'src/app/dashboard/(planear)/paso18/gestion-cambio/page.tsx',
  'src/app/dashboard/(hacer)/viajes/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/@\/components\/ui\/use-toast/g, '@/hooks/use-toast');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed imports in ${file}`);
  }
});
