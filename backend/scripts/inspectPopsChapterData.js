const fs = require('fs');

const filePath =
  'C:/Users/khanh/.cursor/projects/c-Users-khanh-Documents-CODE-ReaCom/agent-tools/a7b035bf-3e2b-45cc-ab03-53a5644a3f1d.txt';
const html = fs.readFileSync(filePath, 'utf8');
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
if (!m) {
  console.log('No NEXT_DATA');
  process.exit(0);
}
const data = JSON.parse(m[1]);
const txt = JSON.stringify(data);
console.log('has chapterId query', data?.query?.chapterId);
console.log('pops-comic-vn count', (txt.match(/pops-comic-vn\.akamaized\.net/g) || []).length);
console.log('cms_comic count', (txt.match(/cms_comic/g) || []).length);
console.log('image key count', (txt.match(/"image"|imageUrl|images/gi) || []).length);
console.log('purchaseType CHAPTER count', (txt.match(/"purchaseType":"CHAPTER"/g) || []).length);
console.log('isNeedLogin count', (txt.match(/needLogin|isLocked|lock|vip/gi) || []).length);
