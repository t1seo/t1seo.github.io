import { createEnvironment } from './environment';
import { mountImmersiveShell } from './paper-immersive-shell';
import { mountPaperScene } from './paper-scene';
import { createPaperMusic } from './paper-music';
import { mountPaperPortfolio } from './paper-portfolio';
import type { PaperInteractionId } from './paper-types';

const environment = createEnvironment();
// A saved preference cannot substitute for a fresh gesture to start audio.
if (environment.getState().soundOn) environment.toggleSound();
const app = document.querySelector<HTMLElement>('#app')!;
const navigation = new AbortController();
const music = createPaperMusic(environment.getState(), { onError: musicFailed });
let audioRevision = 0;
let destroyed = false;
let activePage: 'studio' | 'portfolio' = 'studio';
let scene: ReturnType<typeof mountPaperScene> | undefined;
let portfolio: ReturnType<typeof mountPaperPortfolio> | undefined;
let portfolioMount: HTMLDivElement | undefined;
const shell = mountImmersiveShell(app, environment, onAction, { onPortfolio: openPortfolio });
scene = mountPaperScene(shell.sceneMount, { state: environment.getState(), onAction, onMessage: shell.say });
const unsubscribe = environment.subscribe(state => {
  scene?.update(state);
  music.setScene(state);
  if (portfolioMount) portfolioMount.dataset.motion = state.motionOn ? 'on' : 'off';
  const track = music.getTrack();
  shell.setMusicLabel(state.soundOn ? `Now playing: ${track.title} — ${track.artist}` : '');
});

function musicFailed() {
  if (destroyed) return;
  audioRevision += 1;
  if (environment.getState().soundOn) environment.toggleSound();
  shell.say('The music could not be played. Please try the radio again.');
}

function openPortfolio() {
  if (destroyed || activePage === 'portfolio') return;
  history.pushState({ paperFromStudio: true }, '', '#portfolio');
  renderRoute();
}

function backToStudio() {
  if (destroyed) return;
  if (history.state?.paperFromStudio === true) {
    history.back();
  } else {
    history.replaceState(null, '', '#studio');
    renderRoute();
  }
}

function renderRoute() {
  if (destroyed) return;
  const nextPage = location.hash === '#portfolio' ? 'portfolio' : 'studio';
  if (nextPage === activePage) return;
  activePage = nextPage;
  const studioActive = nextPage === 'studio';
  // The scene's own lifecycle pauses parallax, typewriting and discovery timers.
  scene?.setActive(studioActive);
  if (!studioActive) {
    audioRevision += 1;
    void music.setEnabled(false);
    if (environment.getState().soundOn) environment.toggleSound();
    shell.setActive(false);
    portfolioMount = document.createElement('div');
    portfolioMount.className = 'paper-portfolio-page';
    portfolioMount.dataset.motion = environment.getState().motionOn ? 'on' : 'off';
    app.append(portfolioMount);
    portfolio = mountPaperPortfolio(portfolioMount, { onBack: backToStudio });
    document.title = 'Jieun Jeon — Selected Work';
  } else {
    portfolio?.destroy();
    portfolio = undefined;
    portfolioMount?.remove();
    portfolioMount = undefined;
    shell.setActive(true);
    document.title = 'Jieun Jeon — The Paper Studio';
  }
}

window.addEventListener('popstate', renderRoute, { signal: navigation.signal });
window.addEventListener('hashchange', renderRoute, { signal: navigation.signal });
renderRoute();

function onAction(id: PaperInteractionId) {
  if (destroyed || activePage !== 'studio') return;
  if (id === 'calendar') { shell.openSettings(); return; }
  const before = environment.getState();
  if ((id === 'weather' || id === 'bird') && !before.curtainOpen) return;
  if (id === 'lamp') environment.toggleLamp();
  if ((id === 'monitor' || id === 'keyboard') && !before.monitorOn) environment.toggleMonitor();
  if (id === 'curtain') environment.toggleCurtain();
  if (id === 'music') {
    const revision = ++audioRevision;
    environment.toggleSound();
    const enabled = environment.getState().soundOn;
    // This call stays in the original click stack, preserving browser user activation.
    void music.setEnabled(enabled).then(() => {
      if (destroyed || revision !== audioRevision || !enabled) return;
      const track = music.getTrack();
      shell.say(`Now playing ${track.title} by ${track.artist}.`);
    }).catch(() => {
      if (destroyed || revision !== audioRevision) return;
      musicFailed();
    });
  }
  const discoveredMessage = scene?.react(id);
  const state = environment.getState();
  const cupNotes = {
    spring: '꽃이 피는 계절, 따뜻한 차 한 잔.',
    summer: '여름의 작은 커피 브레이크. 잠시 쉬어 가세요.',
    autumn: '커피가 식기 전에, 잠깐 쉬어 가세요.',
    winter: '겨울의 작은 사치, 따뜻한 코코아 한 잔.',
  };
  const messages: Record<Exclude<PaperInteractionId, 'calendar'>, string> = {
    lamp: state.lampOn ? '작은 불 하나로 더 포근해졌어요.' : '조명을 껐어요. 창밖의 빛을 느껴 보세요.',
    monitor: '한 글자씩, 작은 코드를 만들고 있어요.',
    keyboard: '키보드 소리 대신 작은 불빛으로 코딩합니다.',
    curtain: state.curtainOpen ? '창밖의 계절을 다시 들여왔어요.' : '커튼을 닫고, 나만의 시간.',
    cup: cupNotes[state.season],
    plant: '초록 친구에게 물을 조금 주었어요.',
    book: '책 속에 작은 메모가 끼워져 있네요.',
    tree: state.season === 'winter' ? '크리스마스 전구를 바꿨어요.' : '계절의 작은 장식도 인사를 건넵니다.',
    weather: '종이 숲 사이로 바람이 지나갑니다.',
    music: state.soundOn ? `Starting ${music.getTrack().title} by ${music.getTrack().artist}.` : 'The radio is off.',
    frame: '좋아하는 작은 그림을 바꿨어요.',
    bird: '작은 새가 창가에 찾아왔어요.',
    lights: '벽 조명의 불빛을 바꿨어요.',
    shelf: '책장 사이에 숨은 메모를 찾았어요.',
    cat: '고양이가 러그 위에서 조용히 골골거립니다.',
    globe: 'A little travel note, from somewhere you might go next.',
    pencils: 'Every good idea starts with a little scribble.',
  };
  shell.say(discoveredMessage || messages[id]);
}

if (import.meta.env.DEV) Object.assign(window, { __paperStudio: { environment } });
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroyed = true;
  audioRevision += 1;
  navigation.abort();
  unsubscribe();
  music.destroy();
  portfolio?.destroy();
  portfolioMount?.remove();
  scene?.destroy();
  shell.destroy();
  environment.destroy();
});
