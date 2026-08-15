const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'games', 'definitions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let converted = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Match import { SomeName } from "../path/SomeFile";
  const importRegex = /import\s+\{\s*([a-zA-Z0-9_]+)\s*\}\s+from\s+["'](\.\.\/[^"']+)["'];?/g;
  let match;
  let hasChanges = false;
  
  // Find all imports first to isolate the game class one
  const matches = [...content.matchAll(importRegex)];
  for (const m of matches) {
    const className = m[1];
    const importPath = m[2];
    
    // We only care if the file has createGame: () => new ClassName()
    const createRegex = new RegExp(`createGame:\\s*\\(\\)\\s*=>\\s*new\\s+${className}\\(\\)`);
    if (createRegex.test(content)) {
      // Remove import line (handle line break)
      const importLineRegex = new RegExp(`import\\s+\\{\\s*${className}\\s*\\}\\s+from\\s+["']${importPath}["'];?[\\r\\n]*`);
      content = content.replace(importLineRegex, '');
      
      // Replace createGame
      content = content.replace(createRegex, `createGame: async () => {\n    const { ${className} } = await import("${importPath}");\n    return new ${className}();\n  }`);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
    converted++;
  }
}

console.log(`Converted ${converted} files`);
