import type { AlbumPhoto } from './penthouse-album-data';
import { albumDecoration, albumStickerSource } from './penthouse-album-decorations';

function button(label: string, className: string) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  return element;
}

export function createAlbumView() {
  const dialog = document.createElement('dialog');
  dialog.className = 'ph-album-dialog';
  dialog.setAttribute('aria-label', 'Milky’s Photo Album');
  const shell = document.createElement('div');
  shell.className = 'ph-album-shell';
  const header = document.createElement('header');
  header.className = 'ph-album-header';
  const title = document.createElement('h1');
  title.textContent = 'Milky’s Photo Album';
  const coverLink = button('Cover', 'ph-album-cover-link');
  const close = button('×', 'ph-album-close');
  close.setAttribute('aria-label', 'Close photo album');
  header.append(title, coverLink, close);
  const stage = document.createElement('div');
  stage.className = 'ph-album-stage';
  const footer = document.createElement('footer');
  footer.className = 'ph-album-footer';
  const previous = button('← Previous', 'ph-album-previous');
  const next = button('Next →', 'ph-album-next');
  const counter = document.createElement('p');
  counter.className = 'ph-album-counter';
  counter.setAttribute('role', 'status');
  counter.setAttribute('aria-atomic', 'true');
  footer.append(previous, counter, next);
  shell.append(header, stage, footer);
  dialog.append(shell);

  function showCover(onOpen: () => void) {
    const cover = button('', 'ph-album-cover');
    cover.setAttribute('aria-label', 'Open Milky’s photo album');
    const inscription = document.createElement('span');
    inscription.className = 'ph-album-inscription';
    const name = document.createElement('span');
    name.className = 'ph-album-cover-name';
    name.textContent = 'Milky';
    inscription.append(name);
    const invitation = document.createElement('span');
    invitation.className = 'ph-album-invitation';
    invitation.textContent = 'Open album';
    const binding = document.createElement('span');
    binding.className = 'ph-album-binding';
    binding.setAttribute('aria-hidden', 'true');
    const frame = document.createElement('span');
    frame.className = 'ph-album-cover-frame';
    frame.setAttribute('aria-hidden', 'true');
    const ornament = document.createElement('span');
    ornament.className = 'ph-album-ornament';
    ornament.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 3; index += 1) ornament.append(document.createElement('span'));
    cover.append(binding, frame, inscription, ornament, invitation);
    cover.addEventListener('click', onOpen);
    stage.replaceChildren(cover);
    stage.classList.remove('ph-album-stage--open', 'ph-album-stage--letter');
    coverLink.hidden = true;
    previous.disabled = true;
    next.disabled = false;
    next.textContent = 'Open album →';
    counter.textContent = 'Photo album';
    return cover;
  }

  function showLetter() {
    const letter = document.createElement('article');
    letter.className = 'ph-album-letter';
    letter.tabIndex = 0;
    letter.setAttribute('aria-labelledby', 'ph-album-letter-title');
    const cutout = document.createElement('figure');
    cutout.className = 'ph-album-letter-cutout';
    const photograph = document.createElement('img');
    photograph.alt = 'Milky sitting and smiling.';
    photograph.width = 427;
    photograph.height = 600;
    photograph.loading = 'lazy';
    photograph.decoding = 'async';
    photograph.draggable = false;
    photograph.addEventListener('error', () => { cutout.hidden = true; }, { once: true });
    photograph.src = '/assets/penthouse/milky-album/milky-letter-cutout.webp';
    const tape = document.createElement('span');
    tape.className = 'ph-album-letter-cutout-tape';
    tape.setAttribute('aria-hidden', 'true');
    cutout.append(photograph, tape);
    const greeting = document.createElement('h2');
    greeting.id = 'ph-album-letter-title';
    greeting.textContent = 'Dear Milky,';
    letter.append(cutout, greeting);
    for (const text of [
      'You were my family and my very best friend. Thank you for always being by my side.',
      'I hope you are happy and at peace, wherever you are. I will keep you close in my heart until the day we meet again.',
      'With all my love, always.',
    ]) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      letter.append(paragraph);
    }
    const signature = document.createElement('footer');
    signature.className = 'ph-album-letter-signature';
    signature.textContent = 'Milky 2011-2026';
    letter.append(signature);
    stage.replaceChildren(letter);
    stage.classList.remove('ph-album-stage--open');
    stage.classList.add('ph-album-stage--letter');
    coverLink.hidden = false;
    previous.disabled = false;
    previous.textContent = '← Previous';
    next.disabled = true;
    next.textContent = 'The end';
    counter.textContent = 'A letter to Milky';
    return letter;
  }

  function showMessage(message: string, retry?: () => void) {
    const card = document.createElement('div');
    card.className = 'ph-album-message';
    const text = document.createElement('p');
    text.textContent = message;
    text.setAttribute('role', 'status');
    card.append(text);
    if (retry) {
      const action = button('Try again', 'ph-album-retry');
      action.addEventListener('click', retry);
      card.append(action);
    }
    stage.replaceChildren(card);
    stage.classList.remove('ph-album-stage--open', 'ph-album-stage--letter');
    previous.disabled = true;
    next.disabled = true;
    coverLink.hidden = true;
    counter.textContent = '';
  }

  return { dialog, stage, close, coverLink, previous, next, counter, showCover, showLetter, showMessage };
}

export function createAlbumPage(photo: AlbumPhoto, number: number) {
  const page = document.createElement('figure');
  page.className = 'ph-album-page';
  page.dataset.photoId = photo.id;
  page.dataset.collage = String((number - 1) % 4);
  const collage = document.createElement('div');
  collage.className = 'ph-album-collage';
  collage.setAttribute('aria-hidden', 'true');
  for (const className of ['ph-album-scrap ph-album-scrap--rose', 'ph-album-scrap ph-album-scrap--grid', 'ph-album-scrap ph-album-scrap--note', 'ph-album-stamp']) {
    const scrap = document.createElement('span');
    scrap.className = className;
    collage.append(scrap);
  }
  const mount = document.createElement('div');
  mount.className = 'ph-album-photo-mount';
  const loading = document.createElement('span');
  loading.className = 'ph-album-photo-status';
  loading.textContent = 'Loading photograph…';
  mount.append(loading);
  const folio = document.createElement('span');
  folio.className = 'ph-album-folio';
  folio.textContent = String(number).padStart(2, '0');
  folio.setAttribute('aria-hidden', 'true');
  page.append(collage, mount, folio);
  const decoration = albumDecoration(photo.id);
  if (decoration) {
    page.classList.add('ph-album-page--noted');
    const note = document.createElement('figcaption');
    note.className = 'ph-album-note';
    note.textContent = decoration.note;
    page.append(note);
    decoration.stickers.forEach((sticker, index) => {
      const image = document.createElement('img');
      image.className = `ph-album-sticker ph-album-sticker--${index === 0 ? 'primary' : 'secondary'}`;
      image.alt = '';
      image.width = 160;
      image.height = 160;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.draggable = false;
      image.addEventListener('error', () => { image.hidden = true; }, { once: true });
      image.src = albumStickerSource(sticker);
      collage.append(image);
    });
  }
  return {
    page,
    ready(url: string) {
      const image = document.createElement('img');
      image.alt = photo.alt;
      image.width = photo.width;
      image.height = photo.height;
      image.style.maxWidth = `${photo.width}px`;
      image.style.maxHeight = `${photo.height}px`;
      image.decoding = 'async';
      image.draggable = false;
      image.src = url;
      const print = document.createElement('div');
      print.className = 'ph-album-print';
      print.style.setProperty('--print-width', `${photo.width + 22}px`);
      print.style.setProperty('--print-ratio', String((photo.width + 22) / (photo.height + 50)));
      const tape = document.createElement('span');
      tape.className = 'ph-album-tape';
      tape.setAttribute('aria-hidden', 'true');
      const clip = document.createElement('span');
      clip.className = 'ph-album-paperclip';
      clip.setAttribute('aria-hidden', 'true');
      print.append(image, tape, clip);
      mount.replaceChildren(print);
    },
    failed(retry: () => void) {
      const action = button('Retry photograph', 'ph-album-photo-retry');
      action.setAttribute('aria-label', `Retry photograph ${number}`);
      action.addEventListener('click', () => { mount.replaceChildren(loading); retry(); });
      mount.replaceChildren(action);
    },
  };
}
