import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Files to convert
const patterns = [
  'src/routes/*.js',
  'src/controllers/*.js',
  'src/models/*.js'
];

// Exclude index files
const excludeFiles = ['src/models/index.js', 'src/routes/index.js', 'src/controllers/index.js'];

function convertFile(filePath) {
  console.log(`Converting ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Convert require statements to import
  // Pattern: const { something } = require('...');
  if (content.match(/const\s+{\s*[^}]+\s*}\s*=\s*require\(/)) {
    content = content.replace(
      /const\s+{\s*([^}]+)\s*}\s*=\s*require\('([^']+)'\);?/g,
      (match, imports, path) => {
        modified = true;
        // Add .js extension if it's a relative path and doesn't have one
        if (path.startsWith('.') && !path.endsWith('.js')) {
          path += '.js';
        }
        return `import { ${imports} } from '${path}';`;
      }
    );
  }
  
  // Pattern: const something = require('...');
  if (content.match(/const\s+\w+\s*=\s*require\(/)) {
    content = content.replace(
      /const\s+(\w+)\s*=\s*require\('([^']+)'\);?/g,
      (match, varName, path) => {
        modified = true;
        // Add .js extension if it's a relative path and doesn't have one
        if (path.startsWith('.') && !path.endsWith('.js')) {
          path += '.js';
        }
        return `import ${varName} from '${path}';`;
      }
    );
  }
  
  // Convert module.exports to export default or export
  if (content.includes('module.exports = {')) {
    // If it's an object with multiple exports, convert to named exports
    content = content.replace(/module\.exports\s*=\s*{/, 'export {');
    modified = true;
  } else if (content.includes('module.exports =')) {
    // Single export becomes export default
    content = content.replace(/module\.exports\s*=\s*/, 'export default ');
    modified = true;
  }
  
  if (modified) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Converted ${filePath}`);
  } else {
    console.log(`  ⏭️  Skipped ${filePath} (no changes needed)`);
  }
}

// Main execution
async function main() {
  for (const pattern of patterns) {
    const files = glob.sync(pattern);
    for (const file of files) {
      if (!excludeFiles.includes(file)) {
        try {
          convertFile(file);
        } catch (error) {
          console.error(`Error converting ${file}:`, error.message);
        }
      }
    }
  }
  console.log('\n✅ Conversion complete!');
}

main();
