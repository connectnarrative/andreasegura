const viewer = document.querySelector('#viewer');
const image = document.querySelector('#view-image');
const counter = document.querySelector('#count');
const closeViewer = document.querySelector('#close');
const card = document.querySelector('#face-card');
const langButton = document.querySelector('#language');
const profileUrl = document.body.dataset.profileUrl;
const form = document.querySelector('#casting-form');
const brief = document.querySelector('#brief');
const downloadBrief = document.querySelector('#download-brief');
const result = document.querySelector('#brief-result');
const texts = {
  es: { viewer: 'Visor de fotografías', categories: 'Categorías del portafolio', language: 'Cambiar a inglés', link: 'Enlace copiado.', copied: 'Solicitud copiada.', subject: 'Casting · Andrea Segura', labels: ['Marca o productora', 'Fechas y ciudad', 'Alcance y uso de las imágenes'] },
  en: { viewer: 'Photo viewer', categories: 'Portfolio categories', language: 'Switch to Spanish', link: 'Link copied.', copied: 'Inquiry copied.', subject: 'Casting · Andrea Segura', labels: ['Brand or producer', 'Dates and city', 'Scope and intended usage'] },
};

let language = 'es';
let activePhotos = [];
let selected = 0;
let opener;
let downloadUrl;

function displayPhoto(index) {
  selected = (index + activePhotos.length) % activePhotos.length;
  const link = activePhotos[selected];
  image.src = link.href;
  image.alt = link.querySelector('img').alt;
  counter.textContent = activePhotos.length > 1 ? `${selected + 1} / ${activePhotos.length}` : '';
}

document.querySelectorAll('[data-photo]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const collection = link.closest('.collection');
    activePhotos = collection ? [...collection.querySelectorAll('[data-photo]')] : [link];
    opener = link;
    viewer.querySelector('.viewer-nav').hidden = activePhotos.length < 2;
    displayPhoto(activePhotos.indexOf(link));
    viewer.showModal();
    closeViewer.focus();
  });
});
closeViewer.addEventListener('click', () => viewer.close());
document.querySelector('#previous').addEventListener('click', () => displayPhoto(selected - 1));
document.querySelector('#next').addEventListener('click', () => displayPhoto(selected + 1));
viewer.addEventListener('close', () => {
  image.removeAttribute('src');
  opener.focus();
});
viewer.addEventListener('keydown', event => {
  if (activePhotos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  displayPhoto(selected + (event.key === 'ArrowLeft' ? -1 : 1));
});

function updateBrief() {
  const info = new FormData(form);
  const values = ['brand', 'schedule', 'scope'].map(key => info.get(key).trim());
  const { subject, labels } = texts[language];
  brief.value = [subject, '', ...values.map((value, index) => `${labels[index]}: ${value}`), '', profileUrl].join('\n');
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = URL.createObjectURL(new Blob([brief.value], { type: 'text/plain;charset=utf-8' }));
  downloadBrief.href = downloadUrl;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  updateBrief();
  result.hidden = false;
  brief.focus();
});

langButton.addEventListener('click', () => {
  language = language === 'es' ? 'en' : 'es';
  document.documentElement.lang = language;
  langButton.textContent = language === 'es' ? 'EN' : 'ES';
  langButton.setAttribute('aria-label', texts[language].language);
  viewer.setAttribute('aria-label', texts[language].viewer);
  document.querySelector('.collections').setAttribute('aria-label', texts[language].categories);
  document.querySelectorAll('[data-en]').forEach(node => { node.textContent = node.dataset[language]; });
  document.querySelectorAll('[data-alt-en]').forEach(img => {
    img.alt = language === 'es' ? img.dataset.altEs : img.dataset.altEn;
  });
  if (!result.hidden) updateBrief();
});

const cardTrigger = document.querySelector('#show-card');
cardTrigger.addEventListener('click', () => card.showModal());
document.querySelector('#close-card').addEventListener('click', () => card.close());
card.addEventListener('close', () => cardTrigger.focus());
document.querySelector('#print-card').addEventListener('click', () => window.print());

let feedbackTimer;
async function copy(value, button, message) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(value);
    copied = true;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    button.parentElement.append(field);
    field.select();
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
    button.focus();
  }
  const feedback = button.closest('dialog')?.querySelector('[role="status"]') ?? document.querySelector('#feedback');
  feedback.textContent = copied ? message : value;
  feedback.hidden = false;
  clearTimeout(feedbackTimer);
  if (copied) feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 3500);
}
document.querySelector('#copy-link').addEventListener('click', event => copy(profileUrl, event.currentTarget, texts[language].link));
document.querySelector('#copy-brief').addEventListener('click', event => copy(brief.value, event.currentTarget, texts[language].copied));