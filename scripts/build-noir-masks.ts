import { writeFileSync } from 'node:fs';
import { DESK_FOREGROUND } from '../src/cyber-desk-layout.ts';

// Registered on the unchanged 1672 × 941 scene. This is a vector compositing
// mask, not a replacement city image. Black exposes the original seasonal art.
const window = [[425, 26], [948, 0], [1672, 0], [1672, 565], [1555, 565], [1555, 593], [425, 586]];
// Preserve the complete original winter tree and presents, including branches
// outside the window. Follow the chair edge so its new leather stays in front.
const winterTree = [
  [354, 128], [367, 148], [380, 152], [372, 169], [380, 190],
  [393, 201], [388, 216], [405, 223], [402, 238], [420, 249],
  [420, 270], [437, 281], [430, 297], [446, 313], [445, 329],
  [460, 347], [451, 362], [466, 377], [464, 395], [481, 408],
  [474, 429], [490, 447], [486, 466], [503, 480], [498, 501],
  [512, 520], [507, 542], [528, 563], [523, 592], [538, 612],
  [531, 637], [533, 717], [490, 724], [449, 737], [393, 739],
  [392, 686], [379, 668], [375, 651], [351, 632], [312, 615],
  [284, 601], [258, 582], [243, 568], [220, 548], [204, 540],
  [213, 523], [205, 507], [224, 491], [215, 475], [232, 458],
  [224, 443], [239, 428], [233, 410], [254, 393], [247, 376],
  [268, 363], [261, 347], [278, 332], [269, 316], [290, 301],
  [283, 286], [301, 272], [299, 253], [314, 240], [309, 225],
  [330, 211], [325, 196], [344, 183], [338, 174], [322, 155],
  [346, 154],
];
const polygon = (points: number[][], fill: string) => `<polygon fill="${fill}" points="${points.map(p => p.join(',')).join(' ')}"/>`;
// Keep the original standing plant in the window. The first ten registrations
// are the desktop, monitor and small desk objects; the later ones are leaves.
const desk = DESK_FOREGROUND.slice(0, 10).map(points => points.map(([x, y]) => [x * 1672, y * 941]));
for (const winter of [false, true]) {
  const name = winter ? 'winter' : 'room';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941"><defs><mask id="interior" maskUnits="userSpaceOnUse" x="0" y="0" width="1672" height="941" style="mask-type:luminance"><rect width="1672" height="941" fill="white"/>${polygon(window, 'black')}${desk.map(points => polygon(points, 'white')).join('')}${winter ? polygon(winterTree, 'black') : ''}</mask></defs><rect width="1672" height="941" fill="white" mask="url(#interior)"/></svg>\n`;
  writeFileSync(new URL(`../public/assets/cyberpunk/noir/${name}-mask.svg`, import.meta.url), svg);
}
