"""Read-only analysis of existing Milky rasters. No source image is modified."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[1]
SPRITES = ROOT / 'public/assets/cyberpunk'
NAMES = ['milky-forward-idle'] + [f'milky-forward-step-{i}' for i in range(8)] + [f'milky-trot-{i}' for i in range(4)]
BG = (111, 102, 94)
FONT = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 18)


def norm(name):
    return Image.open(SPRITES / (name + '.webp')).convert('RGBA').resize((768, 512), Image.Resampling.LANCZOS)


def bbox(mask):
    ys, xs = np.where(mask)
    return [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)] if len(xs) else None


def bounds_roi(mask, rect):
    x, y, xx, yy = rect
    b = bbox(mask[y:yy, x:xx])
    return [b[0]+x,b[1]+y,b[2]+x,b[3]+y] if b else None


frames = {name: norm(name) for name in NAMES}
records = []
for name, im in frames.items():
    a = np.asarray(im)[:, :, 3] >= 128
    # These are fixed image regions, not semantic keypoint recognition.
    rec = {
        'name': name,
        'sha256': hashlib.sha256((SPRITES / (name + '.webp')).read_bytes()).hexdigest(),
        'normalized_size': [768, 512],
        'alpha_bounds': bbox(a),
        'upper_head_region_bounds': bounds_roi(a, [490, 0, 768, 170]),
        'lowest_opaque_pixel_y': bbox(a)[3] - 1,
    }
    records.append(rec)

# Entire drawing grid at the same half-resolution scale. Cyan line is fixed y=480.
sheet = Image.new('RGB', (4 * 400, 4 * 290), BG)
d = ImageDraw.Draw(sheet)
for i, name in enumerate(NAMES):
    x, y = (i % 4)*400, (i // 4)*290
    d.text((x+10,y+5),name.replace('milky-', ''), fill='white', font=FONT)
    small = frames[name].resize((384,256),Image.Resampling.LANCZOS)
    sheet.paste(small,(x+8,y+28),small)
    d.line((x+8,y+268,x+392,y+268),fill=(105,203,220),width=1)
sheet.save(OUT/'full-frame-sheet.jpg',quality=94)

# Full-resolution fixed head and paw regions make shape changes visible.
for suffix, rect, tile in [('heads',(480,20,755,260),(295,270)), ('feet',(90,320,745,500),(675,215))]:
    cols = 4 if suffix == 'heads' else 2
    names = NAMES[:9]
    w,h=tile
    sheet=Image.new('RGB',(cols*w,((len(names)+cols-1)//cols)*h),BG)
    d=ImageDraw.Draw(sheet)
    for i,name in enumerate(names):
        x,y=(i%cols)*w,(i//cols)*h
        d.text((x+8,y+5),name.replace('milky-',''),font=FONT,fill='white')
        crop=frames[name].crop(rect)
        sheet.paste(crop,(x+10,y+28),crop)
        if suffix=='feet':
            d.line((x+10,y+28+160,x+665,y+28+160),fill=(105,203,220),width=1)
    sheet.save(OUT/f'{suffix}-sheet.jpg',quality=94)

# Crossfade is a diagnostic of why frame blending cannot create missing limb
# trajectories. It is deliberately not exported as a replacement game asset.
sheet=Image.new('RGB',(3*400,4*290),BG)
d=ImageDraw.Draw(sheet)
for row,(i,j) in enumerate([(0,1),(2,3),(5,6),(7,0)]):
    samples=[]
    for k in [i,j]:
        comp=Image.new('RGB',(768,512),BG)
        im=frames[f'milky-forward-step-{k}']
        comp.paste(im,(0,0),im)
        samples.append(comp)
    samples.append(Image.blend(samples[0],samples[1],.5))
    for col,sample in enumerate(samples):
        x,y=col*400,row*290
        label=[f'Frame {i}',f'Frame {j}','50% crossfade (diagnostic)'][col]
        d.text((x+8,y+5),label,fill='white',font=FONT)
        sheet.paste(sample.resize((384,256),Image.Resampling.LANCZOS),(x+8,y+28))
sheet.save(OUT/'crossfade-diagnostic.jpg',quality=94)

# Loop seam is analysed in exactly the same way as every adjacent pair.
pair_records=[]
for i in range(8):
    first=np.asarray(frames[f'milky-forward-step-{i}'])[:,:,3]>=128
    second=np.asarray(frames[f'milky-forward-step-{(i+1)%8}'])[:,:,3]>=128
    b1=bbox(first); b2=bbox(second)
    dy=(b1[3]-b2[3])
    # Rigid floor-height alignment: a diagnostic only, never written to a source.
    shifted=np.zeros_like(second)
    if dy>=0: shifted[dy:]=second[:512-dy]
    else: shifted[:dy]=second[-dy:]
    def iou(a,b): return round(float((a&b).sum()/(a|b).sum()),5)
    pair_records.append({'from':i,'to':(i+1)%8,'floor_alignment_dy':dy,'raw_alpha_iou':iou(first,second),'floor_aligned_alpha_iou':iou(first,shifted),'floor_aligned_head_iou':iou(first[:240,480:],shifted[:240,480:])})

report={'method':'Alpha >=128; idle downsampled to 768x512. Fixed ROIs are not semantic landmarks. Floor alignment uses global lowest alpha, which can belong to different paws. IoU measures image shape difference, not anatomical correctness.', 'frames':records,'walk_adjacent_pairs':pair_records}
(OUT/'measurements.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
