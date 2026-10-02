import { AnimationMixer, LoopRepeat, Quaternion, Vector3 } from 'three';
import type { AnimationAction, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type AuthoredMode = 'walk' | 'run' | 'idle';
export interface AuthoredBone {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
}
export interface AuthoredPose { bones: Record<string, AuthoredBone> }
export interface AuthoredCanine {
  readonly durations: Readonly<Record<AuthoredMode, number>>;
  /** Bind/rest pose, separate from the mutable sample buffer. Do not mutate it. */
  readonly rest: AuthoredPose;
  /** Reuses one pose buffer. Copy values before calling sample again. */
  sample(mode: AuthoredMode, seconds: number): AuthoredPose;
  dispose(): void;
}

export const AUTHORED_CANINE_URL = '/assets/cyberpunk/milky-authored/canine-clips.glb';
const CLIPS = { walk: 'Walk', run: 'Gallop', idle: 'Idle' } as const;

/** Play the original authored animation through Three.js; no renderer or RAF. */
export async function loadAuthoredCanine(source: string | ArrayBuffer = AUTHORED_CANINE_URL): Promise<AuthoredCanine> {
  const loader = new GLTFLoader();
  const gltf = typeof source === 'string' ? await loader.loadAsync(source) : await loader.parseAsync(source, '');
  const scene = gltf.scene;
  const mixer = new AnimationMixer(scene);
  const actions: Partial<Record<AuthoredMode, AnimationAction>> = {};
  const durations = {} as Record<AuthoredMode, number>;
  const named: [string, Object3D][] = [];
  scene.traverse(node => {
    // GLTFLoader sanitizes '.' in Object3D.name; userData retains the source name.
    const name = node.userData.name as string | undefined;
    if (name) named.push([name, node]);
  });
  for (const mode of Object.keys(CLIPS) as AuthoredMode[]) {
    const clip = gltf.animations.find(candidate => candidate.name === CLIPS[mode]);
    if (!clip || !(clip.duration > 0)) throw new Error(`Missing authored canine clip: ${CLIPS[mode]}`);
    durations[mode] = clip.duration;
    actions[mode] = mixer.clipAction(clip).setLoop(LoopRepeat, Infinity);
  }
  const makePose = (): AuthoredPose => ({ bones: Object.fromEntries(named.map(([name]) => [name, {
    position: { x: 0, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 },
  }])) });
  const position = new Vector3(), quaternion = new Quaternion();
  const capture = (pose: AuthoredPose) => {
    scene.updateMatrixWorld(true);
    for (const [name, node] of named) {
      node.getWorldPosition(position);
      node.getWorldQuaternion(quaternion);
      const bone = pose.bones[name];
      bone.position.x = position.x; bone.position.y = position.y; bone.position.z = position.z;
      bone.quaternion.x = quaternion.x; bone.quaternion.y = quaternion.y;
      bone.quaternion.z = quaternion.z; bone.quaternion.w = quaternion.w;
    }
    return pose;
  };
  const rest = capture(makePose()), sampled = makePose();
  let active: AuthoredMode | undefined;
  let disposed = false;
  return {
    durations, rest,
    sample(mode, seconds) {
      if (disposed) throw new Error('Authored canine has been disposed');
      if (!Number.isFinite(seconds)) throw new RangeError('Animation time must be finite');
      if (active !== mode) {
        mixer.stopAllAction();
        actions[mode]!.reset().play();
        active = mode;
      }
      const duration = durations[mode];
      // Absolute sampling remains deterministic during seeks and mode changes.
      mixer.setTime(((seconds % duration) + duration) % duration);
      return capture(sampled);
    },
    dispose() {
      if (disposed) return;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      scene.clear();
      named.length = 0;
      for (const mode of Object.keys(actions) as AuthoredMode[]) delete actions[mode];
      disposed = true;
    },
  };
}
