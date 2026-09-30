import type * as THREE from 'three';
import type { StudioState } from '../environment';
export type InteractionId = 'lamp' | 'monitor' | 'cup' | 'plant' | 'book' | 'curtain' | 'tree' | 'weather';
export interface InteractiveObject { id: InteractionId; label: string; object: THREE.Object3D; anchor: THREE.Vector3 }
export interface WorldPart { group: THREE.Group; interactives: InteractiveObject[]; update(state: StudioState): void; tick(elapsed: number, delta: number): void; react(id: InteractionId): void; dispose(): void }
