const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      if (fullPath.includes('api.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('http://localhost:3000')) {
        let relativePath = '../utils/api';
        if (fullPath.includes('src\\pages') || fullPath.includes('src\\components') || fullPath.includes('src\\context')) {
           relativePath = '../utils/api';
        }
        
        if (!content.includes('apiFetch')) {
            content = `import { apiFetch } from '${relativePath}';\n` + content;
        }
        
        // Replace fetch('http://localhost:3000...')
        content = content.replace(/fetch\(['"`]http:\/\/localhost:3000(\/api\/[^'"`]+)['"`]/g, "apiFetch('$1'");
        // Replace fetch(`http://localhost:3000...`)
        content = content.replace(/fetch\(`http:\/\/localhost:3000(\/api\/[^`]+)`/g, "apiFetch(`$1`");
        
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInFiles(path.join(__dirname, 'src'));
console.log('Replaced localhost:3000 with apiFetch');
