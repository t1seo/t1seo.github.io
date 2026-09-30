# Real-time studio v2

The user rejected the first prototype as dated Flash-like, flat, poorly composed, and using a static outdoor image. We are replacing its complete visual renderer, not polishing the old composite. Retain original interactive badge and tested environment state only.

## Artistic direction
A cinematic Scandinavian/Japandi lakeside cabin workspace: walnut/oak, softly textured lime plaster, cream linen, moss/sage, warm practical lamps, real bevels/contact shadows. Three-quarter perspective with foreground/midground/background depth. A beautiful habitable interior, not a front-on dollhouse or a floating isometric toy. No gaudy neon, thick outlines, polygonal cartoon props, raw rectangles, pasted scene photos or outdoor image planes.

## World coordinates and shared contract
Units roughly meters, Y up, +Z towards viewer. Floor y=0. Room x=-5..5; z=-3.6..4; height4.8. Back wall z=-3.6 with LARGE window aperture x=-2.9..3.25, y=1.25..4.35. Left wall x=-5. Right wall optional and must not occlude camera [4.8,3.2,6.8] looking at[-.3,1.75,-1.8]. Desk centered [0.5,1.12,-1.85], width5.3/depth1.55. Outside lives beyond z<-3.8; near ground y=-.18, lake y=-.32, terrain to z=-120. All exterior objects are real geometry/shaders, no landscape image.

`src/world/types.ts` shared contract:
type InteractionId='lamp'|'monitor'|'cup'|'plant'|'book'|'curtain'|'tree'|'weather';
interface InteractiveObject { id:InteractionId; label:string; object:THREE.Object3D; anchor:THREE.Vector3 }
interface WorldPart { group:THREE.Group; interactives:InteractiveObject[]; update(state:StudioState):void; tick(elapsed:number,delta:number):void; react(id:InteractionId):void; dispose():void }

## Interior worker ownership
Only src/world/interior.ts. Export `createInterior(): WorldPart`. Own geometry/materials for walls, floor, large beveled window frame, desk, monitor/keyboard/mouse, chair/rug/cloth, lamp with actual localized light, plants, shelves/books, curtains, all 4 seasons interior decor. No renderer/camera/global directional lights. Root supplies shadow renderer + hemisphere/sun/environment. Group names and interactive meshes as above. Quality materials and curved/bent geometry; procedural canvas material textures allowed. Winter: prominent decorated Christmas tree around[3.9,0,-1.5], emissive fairy lights, gifts, red/cream fabrics, garland, cocoa. Spring vase/flowers; summer icedglass/fan/linen; autumn amber branch/pumpkin/books/throw. Seasons switch group visibility, never duplicate entire room. Expose lamp+screen+curtain state via update, react effects on tick. Respects motionOn. No 2D furniture planes except proper monitor screen texture/physical labels. No badge geometry: root overlays preserved badge at world hook. Dispose only ownedresources.

## Exterior worker ownership
Only src/world/exterior.ts. Export `createExterior(): WorldPart`. Dynamic sky atmosphere, dimensional mountain contours, forest with detailed varied pine and broadleaf geometry, lake with procedural animated reflection/ripple shader (no image sky/landscape), seasonal leaf/snow changes, falling snow/petals, stars/moon, fireflies. Place all outdoors z<-3.8 with horizon z=-50..-140. Window eye height about y2.7. Near trees frame aperture without blockingcenterlake. State controls 5 day phases4 seasons. Real sunlight-compatible materials. Forest efficient instancing, no thousands ofdrawcalls. No global renderer or modifySceneBackground: own sky dome/backdrop within group. Interactive optional weather id overoutsideground. Return WorldPart. Root supplies room sunlight and scene fog. Dynamic water should freeze motionOn false. Dispose ownresources.

## Root ownership
src/world/types.ts, world renderer, main.ts, global style, material/postprocessing decisions, projected preserved badge placement, responsive camera, controls redesign, accessibility helpers, tests/build/docs, integration and visual feedback loops. Root coordinates native Chrome; workers MUST NOT open preview tabs or touch the user's browser. Report private component checks via messages.

## Quality gate
Worktree commits -> integrate -> inspect actual full-screen desktop/night/winter/mobile -> concrete defects back to owners -> repeat. Do not claim wow/premium quality until actual browser review. Visual composition must feel unified, not old prototype replacement badges.
