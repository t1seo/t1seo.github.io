/** Geometry-only verification of the actual exported Milky GLB.
 * Run: node asset-sources/milky-custom/verify-export.mjs [model.glb] [report.json]
 * No browser, rendering, photo upload, source-model mutation or temporary file.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimationMixer, LoopOnce, Matrix4, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const modelPath = resolve(process.argv[2] ?? resolve(root, 'public/assets/milky-custom/milky.glb'));
const reportPath = resolve(process.argv[3] ?? resolve(here, 'export-validation.json'));
const hash = data => createHash('sha256').update(data).digest('hex');
const [binary, configBytes] = await Promise.all([
  readFile(modelPath), readFile(resolve(here, 'character.json')),
]);
const config = JSON.parse(configBytes);
if (binary.readUInt32LE(0) !== 0x46546c67 || binary.readUInt32LE(4) !== 2) {
  throw new Error('Expected a glTF 2 GLB');
}
if (binary.readUInt32LE(8) !== binary.length) throw new Error('Incomplete GLB read');
const jsonLength = binary.readUInt32LE(12);
const original = JSON.parse(binary.subarray(20, 20 + jsonLength).toString('utf8'));
const modified = structuredClone(original);
// Keep every actual position, weight, bind matrix, node and animation byte.
// Removing materials prevents image decoding in Node; this is not a texture test.
delete modified.images;
delete modified.textures;
delete modified.materials;
delete modified.samplers;
for (const mesh of modified.meshes ?? []) {
  for (const primitive of mesh.primitives) delete primitive.material;
}
const encoded = Buffer.from(JSON.stringify(modified));
const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
encoded.copy(padded);
const tail = binary.subarray(20 + jsonLength);
const clean = Buffer.alloc(20 + padded.length + tail.length);
clean.writeUInt32LE(0x46546c67, 0);
clean.writeUInt32LE(2, 4);
clean.writeUInt32LE(clean.length, 8);
clean.writeUInt32LE(padded.length, 12);
clean.writeUInt32LE(0x4e4f534a, 16);
padded.copy(clean, 20);
tail.copy(clean, 20 + padded.length);
const gltf = await new GLTFLoader().parseAsync(clean.buffer.slice(clean.byteOffset, clean.byteOffset + clean.byteLength), '');
const mixer = new AnimationMixer(gltf.scene);
const nodeObjects = await Promise.all(original.nodes.map((_, index) => gltf.parser.getDependency('node', index)));
const nodes = new Map(original.nodes.map((node, index) => [node.name, nodeObjects[index]]));
const problems = [];
const warnings = [];
const checkFinite = (values, label) => {
  if (Array.from(values).some(value => !Number.isFinite(value))) problems.push(`${label}: non-finite value`);
};
const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  model: { path: relative(root, modelPath), sha256: hash(binary), bytes: binary.length },
  character_config_sha256: hash(configBytes),
  method: 'Actual GLB loaded with Three.js GLTFLoader; AnimationMixer sampled at 120 Hz; all exported skinned vertices evaluated at 60 Hz on CPU.',
  excluded: [
    'Images/materials are removed in memory only: no texture, alpha, lighting or visual likeness check.',
    'Floor bounds include geometry vertices, not visibility after alpha testing.',
    'Finite geometry and correct contact trajectories do not establish natural-looking movement.',
  ],
  counts: {},
  clips: {},
  tolerances: {
    duration_seconds: 0.00001,
    maximum_contact_position_error: 0.002,
    maximum_walk_stance_velocity_error: 0.01,
    maximum_idle_stance_velocity_error: 0.001,
    maximum_vertex_loop_seam: 0.00001,
  },
  problems,
  warnings,
};

const meshData = [];
let vertices = 0;
let triangles = 0;
let maxWeightError = 0;
let unweightedVertices = 0;
const footLabels = ['hind.L', 'fore.L', 'hind.R', 'fore.R'];
const phases = { 'hind.L': 0, 'fore.L': 0.34, 'hind.R': 0.5, 'fore.R': 0.84 };
const nodeLabel = object => {
  const association = gltf.parser.associations.get(object);
  return original.nodes[association?.nodes]?.name ?? object.name;
};
gltf.scene.traverse(mesh => {
  if (!mesh.isMesh) return;
  if (!mesh.isSkinnedMesh) {
    problems.push(`${nodeLabel(mesh)}: expected a skinned mesh`);
    return;
  }
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position');
  const joints = geometry.getAttribute('skinIndex');
  const weights = geometry.getAttribute('skinWeight');
  if (!position || !joints || !weights) {
    problems.push(`${nodeLabel(mesh)}: missing position/skin attributes`);
    return;
  }
  const p = Float64Array.from(position.array);
  const j = Uint16Array.from(joints.array);
  const w = new Float64Array(weights.count * 4);
  const feet = new Int8Array(position.count).fill(-1);
  checkFinite(p, `${nodeLabel(mesh)} positions`);
  for (let i = 0; i < weights.count; i++) {
    const values = [weights.getX(i), weights.getY(i), weights.getZ(i), weights.getW(i)];
    let sum = 0;
    for (let k = 0; k < 4; k++) {
      const value = values[k];
      w[i * 4 + k] = value;
      sum += value;
      if (!Number.isFinite(value) || value < 0) problems.push(`${nodeLabel(mesh)} vertex ${i}: invalid skin weight`);
      if (value > 0 && j[i * 4 + k] >= mesh.skeleton.bones.length) problems.push(`${nodeLabel(mesh)} vertex ${i}: invalid joint index`);
    }
    maxWeightError = Math.max(maxWeightError, Math.abs(sum - 1));
    if (sum === 0) unweightedVertices++;
    // Only opaque body vertices near the neutral floor are candidate paw pads.
    // This avoids reporting long transparent fur-card tips as solid floor penetration.
    if (nodeLabel(mesh) === 'Milky connected body' && p[i * 3 + 1] < 0.15) {
      const label = `${p[i * 3] > 0 ? 'fore' : 'hind'}.${p[i * 3 + 2] < 0 ? 'L' : 'R'}`;
      feet[i] = footLabels.indexOf(label);
    }
  }
  for (const inverse of mesh.skeleton.boneInverses) checkFinite(inverse.elements, `${nodeLabel(mesh)} inverse bind`);
  vertices += position.count;
  triangles += (geometry.index?.count ?? position.count) / 3;
  meshData.push({ mesh, name: nodeLabel(mesh), p, j, w, feet });
});
report.counts = {
  skinned_meshes: meshData.length,
  vertices,
  triangles,
  unique_bones: new Set(meshData.flatMap(data => data.mesh.skeleton.bones)).size,
  maximum_loaded_weight_sum_error: maxWeightError,
  unweighted_vertices: unweightedVertices,
};
if (maxWeightError > 1e-5 || unweightedVertices) problems.push('Invalid loaded skin weights');

// Verify raw exported weight values too: GLTFLoader normalizes on loading.
const componentRead = {
  5120: ['getInt8', 1], 5121: ['getUint8', 1],
  5122: ['getInt16', 2], 5123: ['getUint16', 2],
  5125: ['getUint32', 4], 5126: ['getFloat32', 4],
};
const binHeader = 20 + jsonLength;
const rawView = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
let rawWeightError = 0;
for (const mesh of original.meshes) for (const primitive of mesh.primitives) {
  const accessor = original.accessors[primitive.attributes.WEIGHTS_0];
  if (!accessor || accessor.sparse) throw new Error('Raw weight check requires a dense weight accessor');
  const view = original.bufferViews[accessor.bufferView];
  const [method, size] = componentRead[accessor.componentType];
  const start = binHeader + 8 + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? size * 4;
  for (let vertex = 0; vertex < accessor.count; vertex++) {
    let sum = 0;
    for (let k = 0; k < 4; k++) {
      let value = rawView[method](start + vertex * stride + k * size, true);
      if (accessor.normalized) value /= accessor.componentType === 5121 ? 255 : 65535;
      if (!Number.isFinite(value) || value < 0) problems.push('Non-finite or negative raw weight');
      sum += value;
    }
    rawWeightError = Math.max(rawWeightError, Math.abs(sum - 1));
  }
}
report.counts.maximum_raw_weight_sum_error = rawWeightError;
if (rawWeightError > 1e-5) problems.push('Exported weights are not normalized');

const smooth5 = value => value ** 3 * (10 + value * (-15 + 6 * value));
function contactTarget(label, phase, walking) {
  const [kind, side] = label.split('.');
  const originalPoint = config.bones[`${kind}.paw.${side}`].tail;
  let dx = 0, height = 0;
  const local = ((phase - phases[label]) % 1 + 1) % 1;
  if (walking) {
    const { stride, stance, clearance } = config.walk;
    const extent = stride * stance / 2;
    if (local < stance) dx = extent - stride * local;
    else {
      const swing = (local - stance) / (1 - stance);
      dx = -extent - stride * (1 - stance) * swing + stride * smooth5(swing);
      height = clearance * 64 * swing ** 3 * (1 - swing) ** 3;
    }
  }
  return { point: new Vector3(originalPoint[0] + dx, originalPoint[2] + height, -originalPoint[1]),
    phase: local, planted: !walking || local < config.walk.stance };
}

const connectedSpans = [];
for (const [name, bone] of Object.entries(config.bones)) {
  const child = Object.entries(config.bones).find(([, candidate]) => candidate.parent === name
    && candidate.head.every((coordinate, axis) => Math.abs(coordinate - bone.tail[axis]) < 1e-7));
  if (child) connectedSpans.push({ start: nodes.get(name), end: nodes.get(child[0]),
    rest: new Vector3(...bone.head).distanceTo(new Vector3(...bone.tail)) });
}

try {
  for (const name of ['Idle', 'Walk']) {
    const clip = gltf.animations.find(candidate => candidate.name === name);
    if (!clip) { problems.push(`Missing ${name} clip`); continue; }
    const intendedDuration = name === 'Walk' ? config.walk.duration : 3.2;
    if (Math.abs(clip.duration - intendedDuration) > report.tolerances.duration_seconds) {
      problems.push(`${name}: exported duration ${clip.duration} differs from ${intendedDuration} seconds`);
    }
    for (const track of clip.tracks) {
      checkFinite(track.times, `${name}/${track.name} times`);
      checkFinite(track.values, `${name}/${track.name} values`);
      for (let i = 1; i < track.times.length; i++) {
        if (track.times[i] <= track.times[i - 1]) problems.push(`${name}/${track.name}: non-increasing key times`);
      }
    }
    mixer.stopAllAction();
    const action = mixer.clipAction(clip).setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    const halfFrames = Math.round(clip.duration * 120);
    const firstVertices = new Map();
    const meshMinimumY = new Map(meshData.map(data => [data.name, Infinity]));
    const pawMinimumY = Object.fromEntries(footLabels.map(label => [label, Infinity]));
    const pawStanceBottom = Object.fromEntries(footLabels.map(label => [label, { minimum: Infinity, maximum: -Infinity, vertices: 0 }]));
    const bounds = { minimum: [Infinity, Infinity, Infinity], maximum: [-Infinity, -Infinity, -Infinity] };
    let nonfiniteVertices = 0;
    let maxLoopError = 0;
    let maxContactError = 0;
    let maxStanceVelocityError = 0;
    let maxBoneSpanError = 0;
    let priorContacts;
    const bonePoint = new Vector3();
    const spanStart = new Vector3();
    const spanEnd = new Vector3();
    for (let sample = 0; sample <= halfFrames; sample++) {
      const phase = sample / halfFrames;
      const time = phase * clip.duration;
      action.reset().play();
      mixer.setTime(time);
      gltf.scene.updateMatrixWorld(true);
      const contacts = {};
      for (const label of footLabels) {
        const [kind, side] = label.split('.');
        const target = contactTarget(label, phase === 1 ? 0 : phase, name === 'Walk');
        nodes.get(`${kind}.toe.${side}`).getWorldPosition(bonePoint);
        maxContactError = Math.max(maxContactError, bonePoint.distanceTo(target.point));
        contacts[label] = { ...target, actual: bonePoint.clone() };
        if (sample && target.planted && priorContacts[label].planted && target.phase > priorContacts[label].phase) {
          const velocity = bonePoint.clone().sub(priorContacts[label].actual).multiplyScalar(halfFrames / clip.duration);
          const expected = new Vector3(name === 'Walk' ? -config.walk.stride / config.walk.duration : 0, 0, 0);
          maxStanceVelocityError = Math.max(maxStanceVelocityError, velocity.distanceTo(expected));
        }
      }
      priorContacts = contacts;
      for (const span of connectedSpans) {
        span.start.getWorldPosition(spanStart);
        span.end.getWorldPosition(spanEnd);
        maxBoneSpanError = Math.max(maxBoneSpanError, Math.abs(spanStart.distanceTo(spanEnd) - span.rest));
      }
      // Skin every vertex at full exported key cadence; half frames above check
      // real quaternion interpolation and contact trajectory between keys.
      if (sample % 2 && sample !== halfFrames) continue;
      const framePawMin = [Infinity, Infinity, Infinity, Infinity];
      for (const data of meshData) {
        const { mesh, p, j, w, feet } = data;
        const prefix = new Matrix4().multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse);
        const transforms = mesh.skeleton.bones.map((bone, index) => new Matrix4()
          .multiplyMatrices(prefix, bone.matrixWorld)
          .multiply(mesh.skeleton.boneInverses[index])
          .multiply(mesh.bindMatrix).elements);
        const first = firstVertices.get(data) ?? new Float64Array(p.length);
        if (!firstVertices.has(data)) firstVertices.set(data, first);
        for (let vertex = 0; vertex < p.length / 3; vertex++) {
          const x = p[vertex * 3], y = p[vertex * 3 + 1], z = p[vertex * 3 + 2];
          let px = 0, py = 0, pz = 0;
          for (let k = 0; k < 4; k++) {
            const weight = w[vertex * 4 + k];
            if (weight === 0) continue;
            const e = transforms[j[vertex * 4 + k]];
            px += weight * (e[0] * x + e[4] * y + e[8] * z + e[12]);
            py += weight * (e[1] * x + e[5] * y + e[9] * z + e[13]);
            pz += weight * (e[2] * x + e[6] * y + e[10] * z + e[14]);
          }
          if (![px, py, pz].every(Number.isFinite)) nonfiniteVertices++;
          if (sample === 0) { first[vertex * 3] = px; first[vertex * 3 + 1] = py; first[vertex * 3 + 2] = pz; }
          if (sample === halfFrames) maxLoopError = Math.max(maxLoopError, Math.hypot(
            px - first[vertex * 3], py - first[vertex * 3 + 1], pz - first[vertex * 3 + 2]));
          for (const [axis, value] of [px, py, pz].entries()) {
            bounds.minimum[axis] = Math.min(bounds.minimum[axis], value);
            bounds.maximum[axis] = Math.max(bounds.maximum[axis], value);
          }
          meshMinimumY.set(data.name, Math.min(meshMinimumY.get(data.name), py));
          if (feet[vertex] >= 0) framePawMin[feet[vertex]] = Math.min(framePawMin[feet[vertex]], py);
          if (sample === 0 && feet[vertex] >= 0) pawStanceBottom[footLabels[feet[vertex]]].vertices++;
        }
      }
      for (let foot = 0; foot < footLabels.length; foot++) {
        const label = footLabels[foot];
        pawMinimumY[label] = Math.min(pawMinimumY[label], framePawMin[foot]);
        if (contacts[label].planted) {
          pawStanceBottom[label].minimum = Math.min(pawStanceBottom[label].minimum, framePawMin[foot]);
          pawStanceBottom[label].maximum = Math.max(pawStanceBottom[label].maximum, framePawMin[foot]);
        }
      }
    }
    report.clips[name] = {
      duration: clip.duration,
      tracks: clip.tracks.length,
      pose_samples: halfFrames + 1,
      all_vertex_samples: Math.floor(halfFrames / 2) + 1,
      nonfinite_skinned_vertices: nonfiniteVertices,
      maximum_vertex_loop_seam: maxLoopError,
      maximum_expected_contact_error: maxContactError,
      maximum_stance_velocity_error: maxStanceVelocityError,
      maximum_connected_bone_span_error: maxBoneSpanError,
      skinned_bounds: bounds,
      minimum_y_by_mesh: Object.fromEntries(meshMinimumY),
      minimum_y_by_paw_region: pawMinimumY,
      stance_paw_bottom_ranges: pawStanceBottom,
    };
    if (nonfiniteVertices) problems.push(`${name}: non-finite skinning`);
    if (maxLoopError > report.tolerances.maximum_vertex_loop_seam) problems.push(`${name}: visible-size loop geometry seam (${maxLoopError})`);
    if (maxContactError > report.tolerances.maximum_contact_position_error) problems.push(`${name}: exported contact differs from the intended trajectory (${maxContactError})`);
    const velocityTolerance = name === 'Walk' ? report.tolerances.maximum_walk_stance_velocity_error
      : report.tolerances.maximum_idle_stance_velocity_error;
    if (maxStanceVelocityError > velocityTolerance) problems.push(`${name}: stance velocity error exceeds ${velocityTolerance} (${maxStanceVelocityError})`);
    if (maxBoneSpanError > 1e-5) problems.push(`${name}: connected bone length drift (${maxBoneSpanError})`);
    const solidMinimum = meshMinimumY.get('Milky connected body');
    if (solidMinimum < -0.005) warnings.push(`${name}: opaque body vertices extend ${(-solidMinimum).toFixed(6)} below the floor; inspect paw weights/shape.`);
    for (const [label, range] of Object.entries(pawStanceBottom)) {
      if (!range.vertices) warnings.push(`${name}: no candidate body paw vertices for ${label}`);
      else if (range.maximum > 0.015) warnings.push(`${name}/${label}: planted paw geometry lifts ${(range.maximum).toFixed(6)} above the floor.`);
    }
  }
} finally {
  mixer.stopAllAction();
  mixer.uncacheRoot(gltf.scene);
  const geometries = new Set();
  const materials = new Set();
  gltf.scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
report.status = problems.length ? 'FAIL' : warnings.length ? 'PASS_WITH_GEOMETRY_WARNINGS' : 'PASS';
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, sha256: report.model.sha256, counts: report.counts,
  clips: Object.fromEntries(Object.entries(report.clips).map(([name, clip]) => [name, {
    duration: clip.duration, vertex_loop_seam: clip.maximum_vertex_loop_seam,
    contact_error: clip.maximum_expected_contact_error,
    stance_velocity_error: clip.maximum_stance_velocity_error,
    opaque_body_minimum_y: clip.minimum_y_by_mesh['Milky connected body'],
  }])), problems, warnings, report: reportPath }, null, 2));
if (problems.length) process.exitCode = 1;
