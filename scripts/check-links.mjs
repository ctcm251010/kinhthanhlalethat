import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const distDir = resolve('dist');
if (!existsSync(distDir)) {
  console.error('Không tìm thấy dist. Hãy chạy npm run build trước.');
  process.exit(1);
}

const htmlFiles = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.html')) htmlFiles.push(path);
  }
};
walk(distDir);

const missing = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const href = match[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const pathOnly = href.split(/[?#]/)[0];
    if (!pathOnly || pathOnly === '/') continue;
    const target = resolve(distDir, `.${pathOnly}`);
    const candidates = [target, `${target}.html`, join(target, 'index.html')];
    if (!candidates.some(existsSync)) missing.push(`${file}: ${href}`);
  }
}

if (missing.length > 0) {
  console.error('Phát hiện internal link không có file đích:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Đã kiểm tra ${htmlFiles.length} trang HTML: không có internal link bị thiếu.`);
