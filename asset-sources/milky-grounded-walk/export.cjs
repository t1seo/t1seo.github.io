const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createCanvas, loadImage } = require('/tmp/t1seo-refined-perf/node_modules/@napi-rs/canvas');

async function main() {
  const records = [];
  const destination = path.resolve(__dirname, '../../public/assets/cyberpunk/milky-grounded-walk');
  fs.mkdirSync(destination, { recursive: true });
  for (const id of ['torso', 'foreleg', 'hindleg']) {
    const revision = id === 'torso' ? '03' : '02';
    const source = path.join(__dirname, `${id}-prototype-${revision}.png`);
    const image = await loadImage(source);
    if (image.width !== 1536 || image.height !== 1024) throw new Error(`Unexpected source dimensions: ${id}`);
    const canvas = createCanvas(768, 512);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, 768, 512);
    const output = canvas.toBuffer('image/webp', 94);
    const target = path.join(destination, `${id}.webp`);
    fs.writeFileSync(target, output);
    records.push({ id, source: path.basename(source), target: path.relative(path.resolve(__dirname, '../..'), target), width: 768, height: 512, bytes: output.length, sha256: crypto.createHash('sha256').update(output).digest('hex') });
  }
  fs.writeFileSync(path.join(__dirname, 'runtime-exports.json'), JSON.stringify(records, null, 2) + '\n');
  console.log(JSON.stringify(records, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
