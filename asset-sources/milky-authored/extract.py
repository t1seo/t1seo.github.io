"""Keep the original Quaternius skeleton and three clips, without model/materials.

Usage: python3 extract.py PATH_TO_SHIBA_INU_GLTF REPO_ROOT
Only container indices and buffer placement change. Node transforms, animation
samples, sample times, and interpolation modes remain authored source values.
"""
import base64
import copy
import hashlib
import json
from pathlib import Path
import struct
import sys

source, repo = map(Path, sys.argv[1:])
raw = source.read_bytes()
expected = '3236979b94a840eb72d9ce091b1361da327a96f5ce068e666680297480f30f6b'
assert hashlib.sha256(raw).hexdigest() == expected, 'Unexpected source version'
original = json.loads(raw)
source_buffers = [base64.b64decode(b['uri'].split(',', 1)[1]) for b in original['buffers']]
keep_nodes = [i for i, node in enumerate(original['nodes']) if 'mesh' not in node]
node_map = {old: new for new, old in enumerate(keep_nodes)}
nodes = [copy.deepcopy(original['nodes'][i]) for i in keep_nodes]
for node in nodes:
    if 'children' in node:
        node['children'] = [node_map[i] for i in node['children'] if i in node_map]
    node.pop('skin', None)

binary = bytearray()
views, accessors, animations = [], [], []
accessor_map, payload_map = {}, {}

def accessor_index(old):
    if old in accessor_map:
        return accessor_map[old]
    accessor = copy.deepcopy(original['accessors'][old])
    assert 'sparse' not in accessor
    view = copy.deepcopy(original['bufferViews'][accessor['bufferView']])
    start = view.get('byteOffset', 0)
    payload = source_buffers[view['buffer']][start:start + view['byteLength']]
    # Deduplicate identical accessor payloads/metadata, including common times.
    key = (payload, json.dumps({k: v for k, v in accessor.items() if k != 'bufferView'}, sort_keys=True), view.get('byteStride'))
    if key in payload_map:
        accessor_map[old] = payload_map[key]
        return accessor_map[old]
    binary.extend(b'\0' * (-len(binary) % 4))
    view.update(buffer=0, byteOffset=len(binary))
    view.pop('target', None)
    binary.extend(payload)
    accessor['bufferView'] = len(views)
    views.append(view)
    accessor_map[old] = len(accessors)
    payload_map[key] = len(accessors)
    accessors.append(accessor)
    return accessor_map[old]

for name in ['Walk', 'Gallop', 'Idle']:
    animation = copy.deepcopy(next(a for a in original['animations'] if a['name'] == name))
    for sampler in animation['samplers']:
        sampler['input'] = accessor_index(sampler['input'])
        sampler['output'] = accessor_index(sampler['output'])
    for channel in animation['channels']:
        channel['target']['node'] = node_map[channel['target']['node']]
    animations.append(animation)

document = {
    'asset': {'version': '2.0', 'generator': 'Milky skeleton-only container extraction; original Quaternius keyframes'},
    'scene': 0,
    'scenes': [{'name': 'Authored canine clips', 'nodes': [node_map[i] for i in original['scenes'][original.get('scene', 0)]['nodes']]}],
    'nodes': nodes, 'animations': animations, 'accessors': accessors,
    'bufferViews': views, 'buffers': [{'byteLength': len(binary)}],
}
encoded = json.dumps(document, separators=(',', ':')).encode()
encoded += b' ' * (-len(encoded) % 4)
binary.extend(b'\0' * (-len(binary) % 4))
glb = struct.pack('<III', 0x46546c67, 2, 12 + 8 + len(encoded) + 8 + len(binary))
glb += struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
glb += struct.pack('<II', len(binary), 0x004e4942) + binary
destination = repo / 'public/assets/cyberpunk/milky-authored'
destination.mkdir(parents=True, exist_ok=True)
(destination / 'canine-clips.glb').write_bytes(glb)
provenance = {
    'creator': 'Quaternius', 'pack': 'Ultimate Animated Animal Pack',
    'officialSource': 'https://quaternius.com/packs/ultimateanimatedanimals.html',
    'officialDownload': 'https://drive.google.com/uc?export=download&id=1XWUVbmMbiG9E90OqrumueD_pBdnYdyHZ',
    'downloadNote': 'Official archive was quota-limited; original ShibaInu.gltf and accompanying License.txt retrieved from a public pack mirror.',
    'retrievedFrom': 'https://raw.githubusercontent.com/agentkaerf/FreeModels/main/Ultimate%20Animated%20Animals%20-%20July%202021/glTF/ShibaInu.gltf',
    'license': 'CC0 1.0 Universal', 'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'sourceSha256': expected, 'sourceBytes': len(raw),
    'output': 'public/assets/cyberpunk/milky-authored/canine-clips.glb',
    'outputSha256': hashlib.sha256(glb).hexdigest(), 'outputBytes': len(glb),
    'clips': ['Walk', 'Gallop', 'Idle'], 'nodeCount': len(nodes),
    'modifications': ['Remove mesh node, meshes, skin, materials, textures, and images',
                      'Keep original node hierarchy and all three selected clips with original keyframes and interpolation',
                      'Remap container indices and deduplicate identical accessor payloads',
                      'Pack retained animation bytes in a self-contained GLB'],
}
(repo / 'asset-sources/milky-authored/provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
print(json.dumps({'bytes': len(glb), 'nodes': len(nodes), 'clips': provenance['clips'], 'sha256': provenance['outputSha256']}))
