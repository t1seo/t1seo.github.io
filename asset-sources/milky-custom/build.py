"""Original photo-guided Milky model. Run with Blender --background --python.

No purchased mesh, source photograph, or reconstructed private texture is used.
The native file remains editable; the GLB is an opt-in local review asset.
"""
import bpy
import sys
import math
import json
import random
import bisect
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / 'public/assets/milky-custom'
NATIVE = HERE / 'milky-master.blend'
CONFIG = json.loads((HERE / 'character.json').read_text())
random.seed(712)
bpy.context.preferences.filepaths.temporary_directory='/Volumes/Nebula/Developer/Temp/'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials):
    bpy.data.materials.remove(d)
OUT.mkdir(parents=True, exist_ok=True)


def material(name, color, roughness=.65):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bs = mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = (*color, 1)
    return mat


coat = material('Milky ivory undercoat', (.83, .815, .77), .85)
ear_skin = material('Milky warm inner ear', (.48, .28, .25), .92)
dark = material('Milky charcoal nose and lips', (.012, .009, .007), .36)
eye_mat = material('Milky deep brown eyes', (.017, .008, .0035), .25)
nostril_mat = material('Milky nostril', (.0015, .001, .001), .9)
objects = []


def sphere(name, center, scale, mat=coat, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=center)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    for face in ob.data.polygons:
        face.use_smooth = True
    return ob


def segment(name, a, b, radius_a, radius_b=None):
    a, b = Vector(a), Vector(b)
    ob = sphere(name, (a+b)/2, (radius_a, radius_a, (b-a).length/2+radius_a*.75))
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = (b-a).to_track_quat('Z', 'Y')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return ob


def join_remesh(parts, name, voxel=.014):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts: p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    rem = ob.modifiers.new('Connected anatomical surface', 'REMESH')
    rem.mode = 'VOXEL'; rem.voxel_size = voxel; rem.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=rem.name)
    smooth = ob.modifiers.new('Soft anatomical transitions', 'SMOOTH')
    smooth.factor = 1.15; smooth.iterations = 5
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    dec = ob.modifiers.new('Review topology', 'DECIMATE'); dec.ratio = .42
    bpy.ops.object.modifier_apply(modifier=dec.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for p in ob.data.polygons: p.use_smooth = True
    objects.append(ob)
    return ob


# Light, shallow torso; separately shaped rib cage, waist, rump and rising neck.
parts = [sphere('Rib cage', (.02,0,.704), (.45,.190,.186)),
         sphere('Rump', (-.40,0,.699), (.215,.167,.163)),
         sphere('Chest', (.33,0,.683), (.205,.179,.214)),
         segment('Ascending neck',(.37,0,.755),(.60,0,1.065),.143),
         sphere('Cranium',(.69,0,1.12),(.216,.194,.196)),
         sphere('Forehead',(.772,0,1.135),(.151,.173,.123)),
         sphere('Short squared muzzle',(.887,0,1.026),(.162,.131,.080)),
         sphere('Chin',(.873,0,.968),(.126,.112,.043)),
         sphere('Cheek L',(.83,.108,1.055),(.112,.080,.077)),
         sphere('Cheek R',(.83,-.108,1.055),(.112,.080,.077))]
for s,y in [('L',.165),('R',-.165)]:
    for label,radius in [('fore.upper',.066),('fore.lower',.045),('hind.upper',.070),('hind.lower',.053),('hind.paw',.041)]:
        bone = CONFIG['bones'][label+'.'+s]
        parts.append(segment(label+s,bone['head'],bone['tail'],radius))
    parts.extend([sphere('Fore paw '+s,(.452,y,.056),(.102,.067,.053)),
                  sphere('Hind paw '+s,(-.456,y,.055),(.094,.066,.052)),
                  sphere('Shoulder '+s,(.335,y*.85,.70),(.112,.092,.150)),
                  sphere('Thigh '+s,(-.405,y*.84,.578),(.095,.083,.151))])
body = join_remesh(parts,'Milky connected body',.012)
for v in body.data.vertices:
    if v.co.x>.49 and v.co.z>1.17: v.co.z=1.17+(v.co.z-1.17)*.70

# The nose narrows below; nostrils and a central furrow prevent a black-bead nose.
nose = sphere('Milky nose', (1.038,0,1.040),(.030,.062,.045),dark,36,24)
for v in nose.data.vertices:
    relative = v.co.z/.049
    v.co.y *= .70 + .30*(relative+1)/2
objects.append(nose)
for sign in [-1,1]:
    nostril = sphere('Nostril', (1.061,sign*.034,1.043),(.008,.016,.013),nostril_mat,20,12)
    objects.append(nostril)


def tube(name, coords, radius, mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=8
    curve.bevel_depth=radius;curve.bevel_resolution=2
    sp=curve.splines.new('BEZIER');sp.bezier_points.add(len(coords)-1)
    for p,co in zip(sp.bezier_points,coords):
        p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat);bpy.context.view_layer.objects.active=ob
    ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
    objects.append(ob);return ob

tube('Philtrum',[(1.07,0,1.025),(1.039,0,1.000),(1.013,0,.979)],.0027,dark)
for sign in [-1,1]:
    tube('Quiet mouth line',[(1.016,0,.981),(.988,sign*.060,.974),(.938,sign*.096,.980)],.002,dark)
    center=Vector((.866,sign*.112,1.144))
    ob=sphere('Milky eye '+str(sign),center,(.034,.042,.041),eye_mat,40,24)
    objects.append(ob)
    # No white sclera; an understated lid sits flush with the face.
    tube('Upper eyelid',[(.887,sign*.087,1.160),(.883,sign*.114,1.173),(.865,sign*.140,1.157)],.0025,dark)

# Thin pendulous ears made directly, rather than folding a pointed stock-dog ear.
ears=[]
for s,sign in [('L',1),('R',-1)]:
    ear=sphere('Milky drop ear '+s,(.590,sign*.218,1.091),(.115,.034,.117),coat,32,24)
    for v in ear.data.vertices:
        if v.co.z < -.039:
            v.co.x *= 1-.15*min(1,(-v.co.z-.039)/.078)
    ear.rotation_euler.x = sign*.21
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    objects.append(ear); ears.append((ear,s))
    patch=sphere('Warm ear inset '+s,(.606,sign*.191,1.108),(.059,.005,.067),ear_skin,24,16)
    objects.append(patch)

# A narrow curled tail core with flowing plume; no bulky torus.
tail=tube('Milky curved tail',[(-.57,0,.810),(-.72,0,.887),(-.80,0,.987),(-.70,0,1.041),(-.55,0,1.035),(-.43,0,.994)],.036,coat)
bpy.context.view_layer.objects.active=tail
tail.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);tail.select_set(False)

# Armature kept editable in the native source. Explicit rest transforms make
# sampling/export reproducible, unlike a stock rig fitted by object scaling.
arm=bpy.data.armatures.new('Milky anatomical skeleton');rig=bpy.data.objects.new('MilkyRig',arm)
bpy.context.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig
rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,b in CONFIG['bones'].items():
    eb=arm.edit_bones.new(name);eb.head=b['head'];eb.tail=b['tail']
    if b['parent']: eb.parent=arm.edit_bones[b['parent']]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True


def distance_segment(p,a,b):
    a,b=Vector(a),Vector(b);ab=b-a;t=max(0,min(1,(p-a).dot(ab)/ab.length_squared))
    return (p-a-t*ab).length


def weights(p, forced=None):
    if forced:
        if forced.startswith('ear.') and not forced.startswith('ear.tip.'):
            w=max(0,min(.85,(1.07-p.z)/.15))
            return [(forced,1-w),('ear.tip.'+forced[-1],w)]
        return [(forced,1.)]
    if p.x>.58 and p.z>.90: return [('head',1.)]
    names=['pelvis','spine','chest','neck','head']
    if p.z<.68:
        side='L' if p.y>0 else 'R'
        names+=['fore.upper.'+side,'fore.lower.'+side,'fore.paw.'+side,'fore.toe.'+side] if p.x>-.05 else ['hind.upper.'+side,'hind.lower.'+side,'hind.paw.'+side,'hind.toe.'+side]
    ds=sorted((distance_segment(p,CONFIG['bones'][n]['head'],CONFIG['bones'][n]['tail']),n) for n in names)[:4]
    vals=[(n,math.exp(-max(0,d-ds[0][0])*22)) for d,n in ds]
    total=sum(w for n,w in vals)
    return [(n,w/total) for n,w in vals]


def bind(ob, forced=None, root_weights=None):
    for b in CONFIG['bones']: ob.vertex_groups.new(name=b)
    for v in ob.data.vertices:
        p=ob.matrix_world@v.co
        ws=root_weights[v.index] if root_weights else weights(p,forced)
        for n,w in ws: ob.vertex_groups[n].add([v.index],w,'REPLACE')
    mod=ob.modifiers.new('Milky skin', 'ARMATURE');mod.object=rig;ob.parent=rig


for ob in objects:
    forced='head' if ob not in [body,tail]+[e[0] for e in ears] else None
    if 'ear inset' in ob.name: forced='ear.'+ob.name[-1]
    for ear,s in ears:
        if ob==ear: forced='ear.'+s
    if ob==tail:
        ws=[]
        for v in ob.data.vertices:
            p=ob.matrix_world@v.co
            name=min(['tail.01','tail.02','tail.03','tail.04'],key=lambda n:distance_segment(p,CONFIG['bones'][n]['head'],CONFIG['bones'][n]['tail']))
            ws.append([(name,1.)])
        bind(ob,root_weights=ws)
    else: bind(ob,forced)

# A hand-authored directional tuft texture (not derived from a photograph).
# Individual antialiased filaments are grouped into a tapered, irregular lock.
size=256
alpha=[0.]*(size*size)
for i in range(31):
    base=random.uniform(.12,.88);length=random.uniform(.58,.98);bend=random.uniform(-.15,.15)
    for j in range(244):
        t=j/243
        if t>length: break
        x=(base+(0.5-base)*t*.62 + bend*t*t + math.sin(t*8+i)*.009)*size
        y=(.025+t*.96)*size
        strength=min(1,t*15)*min(1,(length-t)*18)*random.uniform(.8,1.)
        ix=int(x);iy=int(y)
        for dx in [-1,0,1]:
            if 0<=ix+dx<size and 0<=iy<size:
                idx=iy*size+ix+dx;alpha[idx]=max(alpha[idx],strength*(.35 if dx else 1))
image=bpy.data.images.new('Original directional Milky fur atlas',width=size,height=size,alpha=True)
pixels=[]
for a in alpha:pixels.extend((.94,.927,.897,a))
image.pixels=pixels;image.filepath_raw=str(HERE/'fur-atlas.png');image.file_format='PNG';image.save();image.pack()
fur=material('Milky directional silk fur',(.9,.88,.84),.88)
bs=fur.node_tree.nodes.get('Principled BSDF');tex=fur.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
fur.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);fur.node_tree.links.new(tex.outputs['Alpha'],bs.inputs['Alpha'])
fur.surface_render_method='DITHERED'


def groom(source,count,kind,forced=None):
    source.data.calc_loop_triangles()
    tris=list(source.data.loop_triangles)
    cumulative=[];total=0
    for tri in tris:total+=tri.area;cumulative.append(total)
    verts=[];faces=[];uvs=[];wts=[];normals=[]
    normal_matrix=source.matrix_world.to_3x3().inverted().transposed()
    for i in range(count):
        tri=tris[bisect.bisect_left(cumulative,random.random()*total)]
        a,b,c=[source.matrix_world@source.data.vertices[v].co for v in tri.vertices]
        u,v=random.random(),random.random()
        if u+v>1:u,v=1-u,1-v
        p=a+u*(b-a)+v*(c-a)
        va,vb,vc=[source.data.vertices[index] for index in tri.vertices]
        normal=(normal_matrix@((1-u-v)*va.normal+u*vb.normal+v*vc.normal)).normalized()
        if kind=='body':
            if p.z<.045:continue
            # Leave the nose, lips and visible eye openings free.
            if p.x>.97 and .975<p.z<1.098:continue
            if min((p-Vector((.892,s*.112,1.145))).length for s in [-1,1])<.037:continue
            if p.x>.6 and p.z>.9:
                direction=Vector((-.18, p.y*2.5,-.8 if p.z<1.18 else .24))
                length=random.uniform(.035,.072);width=.021
            elif p.z<.53:
                direction=Vector((-.12,0,-1));length=random.uniform(.027,.055);width=.021
            else:
                direction=Vector((-.65,p.y*.5,-.5));length=random.uniform(.035,.065);width=.026
        elif kind=='ear':direction=Vector((.12,0,-1));length=random.uniform(.028,.060);width=.018
        else:direction=Vector((.45,p.y*.7,-.8));length=random.uniform(.11,.20);width=.023
        tangent=direction-normal*direction.dot(normal)
        if tangent.length<.01:tangent=normal.cross(Vector((0,1,0)))
        tangent.normalize();side=normal.cross(tangent).normalized()
        ws=weights(p,forced)
        if kind=='tail':
            n=min(['tail.01','tail.02','tail.03','tail.04'],key=lambda n:distance_segment(p,CONFIG['bones'][n]['head'],CONFIG['bones'][n]['tail']));ws=[(n,1.)]
        base=len(verts)
        for k in range(3):
            t=k/2
            mid=p+normal*(.002+math.sin(t*math.pi*.85)*length*.23)+tangent*t*length
            half=width*.5*(1-.30*t)
            for sign in [-1,1]:
                verts.append(mid+side*half*sign);uvs.append(((sign+1)/2,t));wts.append(ws);normals.append(tuple(normal))
        # Winding matches the outward emitter normals. With reversed winding,
        # a two-sided renderer flips custom normals and darkens the whole coat.
        faces.extend([(base,base+2,base+3,base+1),(base+2,base+4,base+5,base+3)])
    mesh=bpy.data.meshes.new('Directional groom '+kind);mesh.from_pydata(verts,[],faces);mesh.update()
    uv=mesh.uv_layers.new(name='Tuft coordinates')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for loop in poly.loop_indices:uv.data[loop].uv=uvs[mesh.loops[loop].vertex_index]
    # Keep coat lighting continuous with the skin beneath each tuft, rather
    # than shading every narrow card like a separate opaque feather.
    mesh.normals_split_custom_set_from_vertices(normals)
    ob=bpy.data.objects.new('Milky fur '+kind,mesh);bpy.context.collection.objects.link(ob);mesh.materials.append(fur)
    bind(ob,root_weights=wts);objects.append(ob)
    return ob

groom(body,4800,'body')
for ob,s in ears:groom(ob,520,'ear','ear.'+s)
groom(tail,700,'tail')

# Actions are authored against this exact anatomy, independently of stock dogs.
sys.path.insert(0,str(HERE))
metadata={}
if (HERE/'animate.py').exists():
    from animate import author_actions
    metadata=author_actions(rig,CONFIG)
else:
    bpy.context.scene.render.fps=60
    rig.animation_data_create()
    idle=bpy.data.actions.new('Idle');rig.animation_data.action=idle
    rig.pose.bones['head'].rotation_mode='XYZ'
    for f,a in [(0,0),(96,.008),(192,0)]:
        rig.pose.bones['head'].rotation_euler.z=a;rig.pose.bones['head'].keyframe_insert(data_path='rotation_euler',frame=f)

scene=bpy.context.scene;scene.frame_set(0)
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.45,.45,.45)
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.42,.38,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
for name,location,energy,scale in [('Softbox',(2,-3,5),300,4),('Fill',(-2,3,3),150,3),('Rim',(-3,-1,4),200,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=scale
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=location;ob.rotation_euler=(Vector((0,0,.65))-ob.location).to_track_quat('-Z','Y').to_euler()
camera_data=bpy.data.cameras.new('Milky review camera');camera=bpy.data.objects.new('Milky review camera',camera_data);bpy.context.collection.objects.link(camera);camera.location=(3.3,-5,2.5);camera.rotation_euler=(Vector((.1,0,.69))-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.type='ORTHO';camera_data.ortho_scale=2.45;scene.camera=camera
scene.render.film_transparent=True
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for ob in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(NATIVE))
bpy.ops.export_scene.gltf(filepath=str(OUT/'milky.glb'),export_format='GLB',use_selection=True,export_animations=True,export_skins=True,export_yup=True,export_force_sampling=True,export_frame_range=False,export_animation_mode='ACTIONS',export_def_bones=True)

# glTF MASK gives stable overlapping fur cards rather than blended-sort artifacts.
import struct
path=OUT/'milky.glb';raw=path.read_bytes();length,kind=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+length]);rest=raw[20+length:]
for m in doc.get('materials',[]):
    # Narrow filaments average to ~.106 alpha in distant mip levels; .28
    # discarded almost the entire coat at normal browser review distances.
    if m.get('name')=='Milky directional silk fur':m['alphaMode']='MASK';m['alphaCutoff']=.08;m['doubleSided']=True
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(rest))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+rest)
stats={'name':'Milky original photo-guided prototype','status':'local review, not deployed','vertices':sum(len(o.data.vertices) for o in objects),'polygons':sum(len(o.data.polygons) for o in objects),'bones':len(arm.bones),'glb_bytes':path.stat().st_size,'animations':[a['name'] for a in doc.get('animations',[])],'motion':metadata}
(OUT/'model-info.json').write_text(json.dumps(stats,indent=2)+'\n')
print('MILKY_MODEL_INFO',json.dumps(stats))
if '--render' in sys.argv:
    scene.render.filepath=str(HERE/'preview.png');bpy.ops.render.render(write_still=True)
