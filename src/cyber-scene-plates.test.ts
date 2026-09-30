import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLatestScene } from './cyber-scene-plates.ts';

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('rapid season selections only display the latest decoded scene', async () => {
  const spring = deferred(), winter = deferred();
  const shown: string[] = [];
  const loader = createLatestScene(source => source === 'spring' ? spring.promise : winter.promise, value => shown.push(value), () => assert.fail('unexpected error'));
  const a = loader.request('spring'), b = loader.request('winter');
  winter.resolve('winter-night');
  assert.equal(await b, true);
  spring.resolve('spring-noon');
  assert.equal(await a, false);
  assert.deepEqual(shown, ['winter-night']);
});

test('failed and superseded images leave the current scene intact and can retry', async () => {
  let attempts = 0;
  const shown: string[] = [], errors: string[] = [];
  const loader = createLatestScene(async source => {
    if (source === 'snow' && ++attempts === 1) throw new Error('offline');
    return source;
  }, value => shown.push(value), (_, source) => errors.push(source));
  await loader.request('sun');
  assert.equal(await loader.request('snow'), false);
  assert.deepEqual(shown, ['sun']);
  assert.deepEqual(errors, ['snow']);
  assert.equal(await loader.request('snow'), true);
  assert.deepEqual(shown, ['sun', 'snow']);
});

test('returning to the displayed season invalidates an in-flight selection', async () => {
  const later = deferred();
  const shown: string[] = [];
  const loader = createLatestScene(source => source === 'current' ? Promise.resolve(source) : later.promise, value => shown.push(value), () => {});
  await loader.request('current');
  const request = loader.request('later');
  await loader.request('current');
  later.resolve('later');
  assert.equal(await request, false);
  assert.deepEqual(shown, ['current']);
});

test('repeated pending requests deduplicate downloads and destruction suppresses callbacks', async () => {
  const pending = deferred();
  let loads = 0, calls = 0;
  const loader = createLatestScene(() => { loads++; return pending.promise; }, () => calls++, () => calls++);
  const a = loader.request('one'), b = loader.request('one');
  await Promise.resolve();
  assert.equal(loads, 1);
  loader.destroy();
  pending.resolve('one');
  await Promise.all([a, b]);
  assert.equal(calls, 0);
});
