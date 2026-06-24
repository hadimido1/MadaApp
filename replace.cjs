const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const newContent = content.replace(/blue-[456]00/g, 'accent');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('src');
