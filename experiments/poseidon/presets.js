export const presets = {
  'sun-glitter': {
    title: 'Sun glitter', number: '01',
    description: 'The last light, scattered across the sea.',
    camera: { position: [0, 6, 0], fov: 60, sunChase: true },
    foamThreshold: 0.32,
  },
  whitecaps: {
    title: 'Whitecaps', number: '02',
    description: 'Wind-shaped crests. A trace of white on deep water.',
    camera: { position: [0, 16, 68], target: [0, 2, -20], fov: 55 },
    foamThreshold: 0.34,
  },
};

export function presetFromPath(path) {
  return path.split('/').includes('whitecaps') ? 'whitecaps' : 'sun-glitter';
}

export function aimCamera(camera, preset, params) {
  const view = preset.camera;
  camera.position.fromArray(view.position);
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  if (view.sunChase) {
    const az = params.sunAzimuth * Math.PI / 180;
    const el = Math.min(params.sunElevation * Math.PI / 180, 0.30);
    camera.lookAt(
      view.position[0] + Math.cos(el) * Math.sin(az) * 100,
      view.position[1] + Math.sin(el) * 100,
      view.position[2] + Math.cos(el) * Math.cos(az) * 100,
    );
  } else camera.lookAt(...view.target);
}
