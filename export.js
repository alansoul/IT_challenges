const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'all_codes.txt';

// Folders to completely ignore
const IGNORE_DIRS = ['node_modules', '.git', '.next', 'public', '.vscode'];

// Specific files to ignore
const IGNORE_FILES = ['package-lock.json', '.env', '.env.local', 'export.js', OUTPUT_FILE];

// Allowed file extensions (prevents exporting images or binary files)
const ALLOWED_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.md', '.mjs'];

let structureStr = "================ PROJECT STRUCTURE ================\n\n";
let codeStr = "\n\n================ SOURCE CODES ================\n";

function generate(dir, prefix = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                structureStr += `${prefix}📂 ${file}\n`;
                generate(fullPath, prefix + '  ');
            }
        } else {
            const ext = path.extname(file);
            
            if (!IGNORE_FILES.includes(file) && (ALLOWED_EXTS.includes(ext) || file === '.env.example')) {
                structureStr += `${prefix}📄 ${file}\n`;

                const relativePath = path.relative(__dirname, fullPath);
                const content = fs.readFileSync(fullPath, 'utf8');

                codeStr += `\n\n================================================================================\n`;
                codeStr += `FILE: ${relativePath}\n`;
                codeStr += `================================================================================\n\n`;
                codeStr += content + `\n`;
            }
        }
    });
}

try {
    console.log('Scanning project files...');
    generate(__dirname);
    fs.writeFileSync(OUTPUT_FILE, structureStr + codeStr);
    console.log(`✅ Success! Project structure and code exported to "${OUTPUT_FILE}"`);
} catch (err) {
    console.error('[-] Error generating file:', err);
}