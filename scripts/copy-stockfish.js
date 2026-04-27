const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../node_modules/stockfish/src');
const destDir = path.resolve(__dirname, '../public/stockfish');

if (!fs.existsSync(srcDir)) {
  console.error('stockfish not installed — run npm install first');
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

let copied = 0;
for (const file of fs.readdirSync(srcDir)) {
  const src = path.join(srcDir, file);
  if (!fs.statSync(src).isFile()) continue; // skip subdirectories
  fs.copyFileSync(src, path.join(destDir, file));
  copied++;
}
console.log(`Stockfish files copied to public/stockfish/ (${copied} files)`);
