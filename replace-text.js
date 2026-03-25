const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'app', 'dashboard'),
  path.join(__dirname, 'src', 'components')
];

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      filelist.push(filePath);
    }
  });
  return filelist;
};

const files = targetDirs.flatMap(dir => walkSync(dir));

let filesModified = 0;
let replacements = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // We look for className="..." or class="..." (just in case)
  // Inside the quotes, if we find text-white, we check if it has strong backgrounds
  const classNameRegex = /className=(['"`])(.*?)\1/g;
  
  content = content.replace(classNameRegex, (match, quote, classNames) => {
    if (!classNames.includes('text-white')) return match;

    // Strong backgrounds where text MUST be white:
    const hasStrongBg = /\bbg-(primary|red|amber|green|blue|emerald)\b/.test(classNames);
    
    if (!hasStrongBg) {
      // Safe to replace
      const newClassNames = classNames.replace(/\btext-white\b/g, 'text-foreground');
      replacements++;
      return `className=${quote}${newClassNames}${quote}`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified++;
  }
});

console.log(`Modified ${filesModified} files. Made ${replacements} replacements of text-white to text-foreground.`);
