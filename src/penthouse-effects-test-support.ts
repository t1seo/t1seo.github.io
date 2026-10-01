import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mountPenthouseEffects } from './penthouse-effects.ts';

export function compositor(t: TestContext, reducedMotion = false, textureSupport: 'available' | 'missing' | 'no-context' = 'available') {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string,value: unknown) => { originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key)); Object.defineProperty(globalThis,key,{configurable:true,writable:true,value}); };
  const page = Object.assign(new EventTarget(),{hidden:false});
  const media = Object.assign(new EventTarget(),{matches:reducedMotion});
  const frames = new Map<number,FrameRequestCallback>(); let id = 0, draws = 0;
  const text: string[] = [];
  const paintCommands: string[] = [];
  const liveFilters: string[] = [];
  const textureSizes: number[] = [];
  const fallbackCanvases: Array<{ width: number; height: number }> = [];
  const colorFilters: string[] = [];
  let texturePaints = 0, gradients = 0;
  const context = new Proxy({}, { get(_target,key) {
    if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => { gradients++; return {addColorStop() {}}; };
    if (key === 'measureText') return (value: string) => ({width:value.length * 2});
    if (key === 'fillText') return (value: string) => text.push(value);
    return (...args: unknown[]) => {
      if (key === 'clearRect') draws++;
      if (key === 'clearRect' || key === 'fillRect' || key === 'drawImage') paintCommands.push(key);
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg));
    };
  }, set(_target,key,value) {
    if ((key === 'filter' && String(value).includes('blur')) || (key === 'shadowBlur' && Number(value) > 0)) liveFilters.push(`${String(key)}=${String(value)}`);
    if (key === 'filter' && String(value).includes('brightness')) colorFilters.push(String(value));
    return true;
  } });
  Object.assign(page, { createElement() {
    const surface = { width: 0, height: 0, getContext: () => context };
    fallbackCanvases.push(surface); return surface;
  } });
  install('document',page); install('matchMedia',() => media);
  install('OffscreenCanvas', textureSupport === 'missing' ? undefined : class {
    width: number; height: number;
    constructor(width: number,height: number) { this.width = width; this.height = height; textureSizes.push(width * height); }
    getContext() { return textureSupport === 'no-context' ? null : this.width === 912 || this.width === 360 ? context : { fillRect() {}, beginPath() {}, rect() {}, fill() {}, clearRect() {}, drawImage() { texturePaints++; } }; }
  });
  const images: Array<EventTarget & { src: string; complete: boolean; naturalWidth: number }> = [];
  install('Image', class extends EventTarget {
    src = ''; complete = false; naturalWidth = 0; naturalHeight = 941;
    constructor() { super(); images.push(this); }
  });
  install('requestAnimationFrame',(cb: FrameRequestCallback) => { frames.set(++id,cb); return id; });
  install('cancelAnimationFrame',(n: number) => frames.delete(n));
  const canvas = { getContext: () => context } as unknown as HTMLCanvasElement;
  const effects = mountPenthouseEffects(canvas,null);
  t.after(() => { effects.destroy(); for (const [key,value] of originals) { if (value) Object.defineProperty(globalThis,key,value); else Reflect.deleteProperty(globalThis,key); } });
  return {effects,canvas,page,media,frames,text,images,paintCommands,liveFilters,textureSizes,fallbackCanvases,colorFilters,gradients:()=>gradients,texturePaints:()=>texturePaints,draws:()=>draws,run(now:number) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn=>fn(now)); }};
}
