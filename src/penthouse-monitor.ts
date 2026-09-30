import type { ClimateState } from './cyber-climate.ts';

export const SCREEN_SIZE = [912, 540] as const;
const colors = { plain: '#d5e1ec', keyword: '#c4a4e7', string: '#b6d9aa', comment: '#829497' };

/** Vector screen art: one composition for the room and the sharp Desk close-up. */
export function drawStudioScreen(c: CanvasRenderingContext2D, seconds: number, still: boolean, state: ClimateState, plate: HTMLImageElement | null) {
  const rect = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x,y,w,h); };
  const text = (value: string, x: number, y: number, color = colors.plain, size = 17) => { c.fillStyle = color; c.font = `${size}px ui-monospace, SFMono-Regular, monospace`; c.fillText(value,x,y); };
  rect(0,0,912,540,'#17202d');
  rect(0,0,912,34,'#283340');
  ['#df8b83','#d9b878','#86bda5'].forEach((color,i) => { c.fillStyle = color; c.beginPath(); c.arc(20+i*20,17,5,0,Math.PI*2); c.fill(); });
  text('SEOUL STUDIO',377,23,'#cbd5de',15);
  rect(0,34,132,484,'#1b2633');
  text('EXPLORER',15,62,'#879aaa',13);
  text('⌄ studio',12,97,'#c2d0db',16);
  rect(0,110,132,32,'#314458');
  text('  room.ts',11,133,'#b8d6e3',16);
  text('  mood.css',11,165,'#9bafbc',15);
  text('  milky.ts',11,197,'#9bafbc',15);
  text('  assets/',11,229,'#9bafbc',15);
  text('main',15,489,'#a3b2bc',14);
  rect(132,34,495,38,'#202c3a');
  rect(132,34,144,2,'#a1c9d4');
  text('room.ts  ×',151,59,'#d2e1ec',16);
  text('src / studio / room.ts',151,94,'#748999',13);

  const lines = [
    '// A little light. A late idea.',
    'const studio = {',
    '  city: "Seoul",',
    '  companion: "Milky",',
    `  season: "${state.season}",`,
    `  weather: "${state.weather}",`,
    '};',
    '',
    'function slowDown() {',
    '  return studio.companion;',
    '}',
    '',
    'slowDown();',
  ];
  let remaining = still ? Infinity : Math.floor(seconds * 38);
  c.save(); c.beginPath(); c.rect(132,103,495,397); c.clip();
  lines.forEach((line,i) => {
    const y = 128+i*27;
    text(String(i+1).padStart(2,' '),147,y,'#607688',14);
    const visible = line.slice(0,Math.max(0,remaining));
    if (remaining >= 0 && remaining < line.length) rect(182,y-19,428,26,'#253549');
    let x = 187;
    // Small fixed sketch, not a general-purpose syntax highlighter.
    for (const token of visible.match(/\/\/.*|"[^"]*"?|\b(?:const|function|return)\b|[^"\s]+|\s+/g) ?? []) {
      const color = token.startsWith('//') ? colors.comment : token.startsWith('"') ? colors.string : /^(const|function|return)$/.test(token) ? colors.keyword : colors.plain;
      text(token,x,y,color,18); x += c.measureText(token).width;
    }
    if (!still && remaining >= 0 && remaining < line.length && Math.floor(seconds*2)%2 === 0) rect(x,y-17,2,21,'#d5e6d7');
    remaining -= line.length;
  });
  c.restore();

  rect(627,34,285,484,'#111a25');
  text('LIVE PREVIEW',647,61,'#9bafbc',14);
  rect(646,82,247,365,'#e7e2d8');
  if (plate?.complete && plate.naturalWidth) {
    // Show the actual current Seoul window, so the preview follows atmosphere.
    c.drawImage(plate,194/1672*plate.naturalWidth,34/941*plate.naturalHeight,1290/1672*plate.naturalWidth,580/941*plate.naturalHeight,646,82,247,155);
  } else rect(646,82,247,155,'#344e67');
  text('AFTER HOURS',666,276,'#353c3c',23);
  text('Seoul, in view.',666,309,'#66716f',15);
  rect(666,332,75,2,'#b7a187');
  text('A quiet place.',666,363,'#707775',14);
  text('A little company.',666,388,'#707775',14);
  text(`${state.season.toUpperCase()} / ${state.time.toUpperCase()}`,646,481,'#9eb4bd',12);
  rect(0,518,912,22,'#31515c');
  text('main  •  TypeScript',14,534,'#c3d7d8',12);
  text('UTF-8    Spaces: 2    Seoul Studio',599,534,'#c3d7d8',12);
}
