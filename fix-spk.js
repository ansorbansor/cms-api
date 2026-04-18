const fs = require('fs');
const path = 'src/entities/spk.entity.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/@Column\(\)\s+(\w+)\?\:/g, '@Column({ nullable: true })\n  $1?:');
fs.writeFileSync(path, content);
console.log('SPK Entity patched with \s+!');
