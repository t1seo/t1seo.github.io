/**
 * Lazy, atomic loading for the photo-motion frame groups. Nothing is requested at
 * mount: a group's files are fetched only on first intent (explicit request or a rare
 * autonomous opportunity), at most two decodes in flight globally, with exactly one
 * cached image element per file (15 total, so the cache is inherently bounded). A group
 * becomes usable only when every frame decoded as the contracted 3:2 art; any failure
 * fails the whole group so a motion can never mix a decoded body with a missing one.
 *
 * A failed group is not permanently dead: a later DELIBERATE ensure() (an explicit user
 * request) restarts exactly the frames that failed, deduplicating against any sibling
 * fetch still in flight. There is no automatic retry loop — autonomous opportunities
 * never re-request a failed group — and per-frame attempt tokens keep superseded
 * load/error/decode callbacks from corrupting a newer attempt.
 */
import {
  MILKY_PHOTO_FRAMES, MILKY_PHOTO_GROUPS, MILKY_PHOTO_KINDS, MILKY_PHOTO_PREFIX,
  type MilkyPhotoFrameName, type MilkyPhotoMotion,
} from './cyber-pet-photo-art.ts';

export type MilkyPhotoGroupState = 'idle' | 'loading' | 'ready' | 'failed';

export interface MilkyPhotoLoaderHost {
  /** Creates (and mounts) the frame's image element, already registered to the floor. */
  readonly createImage: (frame: MilkyPhotoFrameName) => HTMLImageElement;
  readonly validRatio: (image: HTMLImageElement) => boolean;
  readonly signal: AbortSignal;
  readonly onGroupSettled: (kind: MilkyPhotoMotion, ready: boolean) => void;
}

export interface MilkyPhotoLoader {
  readonly state: (kind: MilkyPhotoMotion) => MilkyPhotoGroupState;
  /**
   * Begins loading an idle group — or deliberately retries a failed one — and returns
   * the state after the request. Loading/ready groups are left untouched (dedupe).
   */
  readonly ensure: (kind: MilkyPhotoMotion) => MilkyPhotoGroupState;
  readonly image: (frame: MilkyPhotoFrameName) => HTMLImageElement | undefined;
  /** Permanently disables the loader (art demotion or destroy); late loads are ignored. */
  readonly disable: () => void;
}

const MAX_CONCURRENT_DECODES = 2;

interface FrameEntry {
  image?: HTMLImageElement;
  state: 'idle' | 'fetching' | 'done' | 'failed';
  /** Bumped per fetch start; stale callbacks from an older attempt are discarded. */
  attempt: number;
}

export function createMilkyPhotoLoader(host: MilkyPhotoLoaderHost): MilkyPhotoLoader {
  const frames = new Map<MilkyPhotoFrameName, FrameEntry>();
  const states: Record<MilkyPhotoMotion, MilkyPhotoGroupState> = {
    tilt: 'idle', 'chin-rest': 'idle', 'sleepy-peek': 'idle',
    'paws-rest': 'idle', 'belly-up': 'idle', pant: 'idle',
  };
  const queue: MilkyPhotoFrameName[] = [];
  let inFlight = 0;
  let disabled = false;

  const groupOf = (frame: MilkyPhotoFrameName): MilkyPhotoMotion | undefined =>
    MILKY_PHOTO_KINDS.find((kind) => MILKY_PHOTO_GROUPS[kind].includes(frame));

  function settleFrame(frame: MilkyPhotoFrameName, ok: boolean, attempt: number) {
    if (disabled) return;
    const entry = frames.get(frame);
    if (!entry || entry.state !== 'fetching' || entry.attempt !== attempt) return;
    inFlight = Math.max(0, inFlight - 1);
    entry.state = ok ? 'done' : 'failed';
    const kind = groupOf(frame);
    if (kind !== undefined && states[kind] === 'loading') {
      const group = MILKY_PHOTO_GROUPS[kind];
      if (!ok) {
        states[kind] = 'failed';
        // Unfetched siblings of a failed group never start; fetched ones stay cached.
        for (const name of group) {
          const queued = queue.indexOf(name);
          if (queued >= 0) queue.splice(queued, 1);
        }
        host.onGroupSettled(kind, false);
      } else if (group.every((name) => frames.get(name)?.state === 'done')) {
        states[kind] = 'ready';
        host.onGroupSettled(kind, true);
      }
    }
    pump();
  }

  function start(frame: MilkyPhotoFrameName) {
    const entry = frames.get(frame);
    if (!entry || entry.state !== 'idle') return;
    entry.state = 'fetching';
    entry.attempt++;
    inFlight++;
    const url = `${MILKY_PHOTO_PREFIX}${MILKY_PHOTO_FRAMES[frame].file}`;
    if (!entry.image) {
      const image = host.createImage(frame);
      entry.image = image;
      image.addEventListener('load', async () => {
        const current = frames.get(frame);
        if (!current) return;
        const attempt = current.attempt;
        const loadedSrc = image.src;
        try { await image.decode(); } catch (error: unknown) {
          if (!(error instanceof Error)) throw error;
          if (!disabled && image.src === loadedSrc) settleFrame(frame, false, attempt);
          return;
        }
        if (disabled || image.src !== loadedSrc) return;
        settleFrame(frame, host.validRatio(image), attempt);
      }, { signal: host.signal });
      image.addEventListener('error', () => {
        const current = frames.get(frame);
        if (current) settleFrame(frame, false, current.attempt);
      }, { signal: host.signal });
    } else if (entry.image.src === url) {
      // A retried frame reuses its cached element; clearing src forces a real refetch.
      entry.image.src = '';
    }
    entry.image.src = url;
  }

  function pump() {
    while (!disabled && inFlight < MAX_CONCURRENT_DECODES) {
      const frame = queue.shift();
      if (frame === undefined) return;
      start(frame);
    }
  }

  return {
    state: (kind) => states[kind],
    ensure(kind) {
      if (disabled) return states[kind];
      if (states[kind] === 'loading' || states[kind] === 'ready') return states[kind];
      states[kind] = 'loading';
      for (const frame of MILKY_PHOTO_GROUPS[kind]) {
        let entry = frames.get(frame);
        if (!entry) {
          entry = { state: 'idle', attempt: 0 };
          frames.set(frame, entry);
        }
        // Retry only what actually failed; done frames stay cached and an in-flight
        // sibling fetch keeps running — its settlement counts for this new attempt.
        if (entry.state === 'failed') entry.state = 'idle';
        if (entry.state === 'idle' && !queue.includes(frame)) queue.push(frame);
      }
      pump();
      return states[kind];
    },
    image: (frame) => frames.get(frame)?.image,
    disable() {
      disabled = true;
      queue.length = 0;
      for (const kind of MILKY_PHOTO_KINDS) if (states[kind] !== 'idle') states[kind] = 'failed';
    },
  };
}
