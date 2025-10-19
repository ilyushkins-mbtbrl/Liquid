/* script/script.js — Safari fixes: touchstart fallback for AudioContext, DPR-safe canvas handling */

/* Elements */
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const volumeSlider = document.getElementById('volume');
const volPlusBtn = document.getElementById('vol-plus');
const volMinusBtn = document.getElementById('vol-minus');
const volumeBubble = document.getElementById('volume-bubble');

const currentLyric = document.getElementById('currentLyric');
const nextLyric = document.getElementById('nextLyric');

const waveformCanvas = document.getElementById('waveform');
let waveformCtx = waveformCanvas && waveformCanvas.getContext ? waveformCanvas.getContext('2d') : null;

/* Lyrics array — как у тебя */
const lyrics = [
  { time: 16.75, text: "В аудитории свет, как на сцене," },
  { time: 20.75, text: "Курсоры танцуют в ритме идей." },
  { time: 24.75, text: "Мы строим будущее — не на арене," },
  { time: 28.75, text: "А в файлах .psd и строках вещей." },
  { time: 32.75, text: "Перо и мышка — наши мечи," },
  { time: 36.75, text: "В Figma рисуем мы чудо-ключи." },
  { time: 40.75, text: "Пусть кто-то не верит — мы знаем ответ:" },
  { time: 44.75, text: "Айти-дизайнер — это рассвет!" },

  { time: 48.75, text: "Айти Топ — мы мечтаем, горим," },
  { time: 52.75, text: "каждый проект — как сюжетный фильм." },
  { time: 56.75, text: "Кодим, рисуем, растём день за днём," },
  { time: 60.75, text: "Вместе мы к цели любой дойдём!" },

  { time: 64.75, text: "Айти Топ — это страсть и успех," },
  { time: 68.75, text: "Выбор наш — не для слабых и мех." },
  { time: 72.75, text: "Знания — сила, команда — опора," },
  { time: 76.75, text: "С нами вершины всегда будут скоро!" },

  { time: 88.75, text: "Тут начинается путь программиста," },
  { time: 90.75, text: "Логика — карта, мышление — чисто." },
  { time: 93.75, text: "Все интерфейсы, что видишь сейчас —" },
  { time: 95.75, text: "Это мы, это код, это высший класс!" },

  { time: 97.75, text: "Пишем мы класс, в нём решение дня," },
  { time: 99.75, text: "Каждая функция — как заклинанья." },
  { time: 101.75, text: "Дебаг, коммиты, ревью и релиз —" },
  { time: 103.75, text: "Собственный софт — вот главный приз!" },

  { time: 105.75, text: "Git мы освоим, как азбуку строк," },
  { time: 107.75, text: "Соберём билд — и поймаем поток." },
  { time: 109.75, text: "Сложные баги — как квест на ура," },
  { time: 111.75, text: "Чистый рефактор — и крутая игра!" },

  { time: 114.75, text: "Айти Топ — мы мечтаем, горим," },
  { time: 118.75, text: "Каждый проект — как сюжетный фильм." },
  { time: 122.75, text: "Кодим, рисуем, растём день за днём," },
  { time: 126.75, text: "Вместе мы к цели любой дойдём!" },

  { time: 130.75, text: "Айти Топ — это страсть и успех," },
  { time: 134.75, text: "Выбор наш — не для слабых и мех." },
  { time: 138.75, text: "Знания — сила, команда — опора," },
  { time: 142.75, text: "С нами вершины всегда будут скоро!" }
];

/* internal state */
let currentIndex = -1;

/* helpers */
function fmtTime(t){
  if (!t || isNaN(t)) return "0:00";
  const sec = Math.floor(t % 60);
  const min = Math.floor(t / 60);
  return `${min}:${sec.toString().padStart(2,'0')}`;
}

/* AudioContext + waveform cache */
let audioCtx = null;
let audioBufferCache = null;
let waveformBaseImageData = null;
let waveformBaseImg = null;
let waveformBaseWidth = 0;
let waveformBaseHeight = 0;
let pendingWaveform = false;

/* create AudioContext on first user gesture to avoid browser blocks */
/* Safari iOS often fires touchstart before pointerdown — add both */
function initAudioContextOnce(){
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // resume immediately if possible (Safari often requires resume to allow decoding)
    audioCtx.resume && audioCtx.resume().catch(()=>{});
    if (pendingWaveform) { setTimeout(()=> { drawWaveformFromAudio().catch(()=>{}); }, 120); pendingWaveform = false; }
  } catch(e){ console.warn('AudioContext init failed', e); }
}
document.addEventListener('pointerdown', initAudioContextOnce, { once: true, passive: true });
// touchstart fallback for older iOS Safari
document.addEventListener('touchstart', initAudioContextOnce, { once: true, passive: true });

/* Volume */
function changeVolume(){
  const v = parseFloat(volumeSlider.value);
  audio.volume = v;
  volumeBubble.textContent = `${Math.round(v * 100)}%`;
  volumeBubble.style.opacity = 1;
  volumeBubble.style.transform = 'translateY(-12px)';
  clearTimeout(volumeBubble._hideTimer);
  volumeBubble._hideTimer = setTimeout(()=> {
    volumeBubble.style.opacity = 0;
    volumeBubble.style.transform = 'translateY(-6px)';
  }, 800);
}
function saveVolume(v){ try { localStorage.setItem('lc_volume', String(v)); } catch(_){} }
function loadVolume(){ try { const v = localStorage.getItem('lc_volume'); return v !== null ? parseFloat(v) : null; } catch(_) { return null; } }

volumeSlider.addEventListener('input', ()=>{ changeVolume(); saveVolume(parseFloat(volumeSlider.value)); });
volPlusBtn?.addEventListener('click', ()=> { volumeSlider.value = Math.min(parseFloat(volumeSlider.value) + 0.05, 1); changeVolume(); saveVolume(parseFloat(volumeSlider.value)); });
volMinusBtn?.addEventListener('click', ()=> { volumeSlider.value = Math.max(parseFloat(volumeSlider.value) - 0.05, 0); changeVolume(); saveVolume(parseFloat(volumeSlider.value)); });

const savedV = loadVolume();
if (savedV !== null) { volumeSlider.value = savedV; }
changeVolume();

/* Player basic */
audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = fmtTime(audio.duration);
  progress.max = audio.duration;
  const savedTime = (()=>{ try { const t = localStorage.getItem('lc_last_time'); return t ? parseFloat(t) : null; } catch(_) { return null; } })();
  if (savedTime && !isNaN(savedTime) && savedTime < audio.duration - 2) {
    audio.currentTime = savedTime;
  }
  if (!audioCtx) pendingWaveform = true;
  else setTimeout(()=> { drawWaveformFromAudio().catch(()=>{}); }, 80);
});
audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration)) {
    progress.value = audio.currentTime;
    timeCurrent.textContent = fmtTime(audio.currentTime);
  }
  updateLyricsByTime();
  highlightWaveformAtCurrent();
  // save occasionally
  if (Math.floor(audio.currentTime) % 5 === 0) {
    try { localStorage.setItem('lc_last_time', String(audio.currentTime)); } catch(_) {}
  }
});
audio.addEventListener('play', ()=> { playBtn.textContent = 'Пауза'; });
audio.addEventListener('pause', ()=> { playBtn.textContent = 'Старт'; });

playBtn.addEventListener('click', async ()=> {
  initAudioContextOnce();
  try {
    if (audio.paused) audio.play().catch(async (err) => {
      // try resume audio context then play
      try { await audioCtx?.resume(); await audio.play(); } catch(e){ console.warn('play failed', e); }
    });
    else audio.pause();
  } catch(err){
    try { await audioCtx?.resume(); await audio.play(); } catch(e) { console.warn('play failed', e); }
  }
});

/* Seek via progress range */
progress.addEventListener('input', (e)=> {
  audio.currentTime = parseFloat(e.target.value);
  updateLyricsByTime(true);
});

/* Lyrics sync logic */
function updateLyricsByTime(force=false){
  const t = (audio.currentTime || 0);
  let idx = -1;
  for (let i=0;i<lyrics.length;i++){
    if (t >= lyrics[i].time - 0.0001) idx = i;
    else break;
  }
  if (idx !== currentIndex || force){
    currentIndex = idx;
    renderLyrics();
  }
}
function renderLyrics(){
  if (currentIndex < 0){
    currentLyric.textContent = lyrics[0] ? lyrics[0].text : '';
    nextLyric.textContent = lyrics[1] ? lyrics[1].text : '';
    return;
  }
  currentLyric.textContent = lyrics[currentIndex] ? lyrics[currentIndex].text : '';
  const nxt = lyrics[currentIndex + 1];
  nextLyric.textContent = nxt ? nxt.text : '';
}

/* Waveform decode & draw */
async function decodeAudio(url){
  try {
    const res = await fetch(url, { mode: 'cors' });
    const arrayBuffer = await res.arrayBuffer();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    return buffer;
  } catch(err){
    console.warn('Waveform decode failed', err);
    return null;
  }
}

async function drawWaveformFromAudio(){
  const src = audio.currentSrc || audio.src;
  if (!src) return;
  if (audioBufferCache && audioBufferCache.src === src && waveformBaseImageData) return;
  try {
    const buf = await decodeAudio(src);
    if (!buf) { drawFlatWave(); return; }
    audioBufferCache = { src, buffer: buf };

    const raw = buf.getChannelData(0);
    const width = Math.max(400, waveformCanvas.clientWidth || 800);
    const height = waveformCanvas.height || 80;
    const dpr = window.devicePixelRatio || 1;

    // set proper canvas size and reset transform to avoid accumulation
    waveformCanvas.width = Math.floor(width * dpr);
    waveformCanvas.height = Math.floor(height * dpr);
    waveformCanvas.style.width = width + 'px';
    waveformCanvas.style.height = height + 'px';
    if (!waveformCtx) waveformCtx = waveformCanvas.getContext('2d');
    // reset transform explicitly (works in Safari)
    waveformCtx.setTransform(1,0,0,1,0,0);
    waveformCtx.scale(dpr, dpr);
    waveformCtx.clearRect(0,0,width,height);

    const step = Math.ceil(raw.length / width);
    const amp = height / 2;
    waveformCtx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < width; i++){
      let min = 1.0, max = -1.0;
      const start = i * step;
      for (let j = 0; j < step && (start + j) < raw.length; j++){
        const v = raw[start + j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;
      waveformCtx.fillRect(i, Math.min(y1,y2), 1, Math.max(1, Math.abs(y2-y1)));
    }

    waveformCtx.fillStyle = 'rgba(46,144,98,0.06)';
    waveformCtx.fillRect(0,0,width,height);

    try {
      waveformBaseImageData = waveformCtx.getImageData(0,0,width,height);
      waveformBaseWidth = width; waveformBaseHeight = height;
    } catch(e){
      try {
        const dataUrl = waveformCanvas.toDataURL();
        const img = new Image();
        img.src = dataUrl;
        img.onload = ()=> { waveformBaseImageData = null; waveformBaseImg = img; waveformBaseWidth = width; waveformBaseHeight = height; };
      } catch(_) {}
    }

    highlightWaveformAtCurrent();
  } catch(e){ console.warn('drawWaveformFromAudio error', e); drawFlatWave(); }
}

function drawFlatWave(){
  const width = Math.max(400, waveformCanvas.clientWidth || 800);
  const height = waveformCanvas.height || 80;
  const dpr = window.devicePixelRatio || 1;
  waveformCanvas.width = Math.floor(width * dpr);
  waveformCanvas.height = Math.floor(height * dpr);
  waveformCanvas.style.width = width + 'px';
  waveformCanvas.style.height = height + 'px';
  if (!waveformCtx) waveformCtx = waveformCanvas.getContext('2d');
  waveformCtx.setTransform(1,0,0,1,0,0);
  waveformCtx.scale(dpr, dpr);
  waveformCtx.clearRect(0,0,width,height);
  waveformCtx.fillStyle = 'rgba(255,255,255,0.04)';
  waveformCtx.fillRect(0, height/2 - 1, width, 2);
  try { waveformBaseImageData = waveformCtx.getImageData(0,0,width,height); waveformBaseWidth = width; waveformBaseHeight = height; }
  catch(e){ waveformBaseImageData = null; }
}

function highlightWaveformAtCurrent(){
  const width = waveformCanvas.clientWidth || Math.max(400,800);
  const height = waveformCanvas.height || 80;
  const ctx = waveformCtx;
  if (!ctx) return;
  if (waveformBaseImageData && waveformBaseWidth === width && waveformBaseHeight === height){
    ctx.putImageData(waveformBaseImageData, 0, 0);
  } else if (waveformBaseImg) {
    ctx.setTransform(1,0,0,1,0,0);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(waveformBaseImg, 0,0, width, height);
  } else {
    drawFlatWave();
  }
  if (!audio.duration) return;
  const played = (audio.currentTime || 0) / audio.duration;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(46,144,98,0.14)';
  ctx.fillRect(0,0, Math.max(1, width * played), height);
  ctx.restore();
}

/* waveform seek - pointer + touch/mouse fallback */
if (window.PointerEvent) {
  waveformCanvas.addEventListener('pointerdown', (e)=>{
    const rect = waveformCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  });
} else {
  waveformCanvas.addEventListener('touchstart', (e)=>{
    if (!e.touches || !e.touches[0]) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const ratio = x / rect.width;
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  }, { passive: true });

  waveformCanvas.addEventListener('mousedown', (e)=>{
    const rect = waveformCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    if (audio.duration) audio.currentTime = ratio * audio.duration;
  });
}

/* responsive redraw debounce */
window.addEventListener('resize', ()=> {
  clearTimeout(window._wfResize);
  window._wfResize = setTimeout(()=> {
    if (audio.currentSrc) setTimeout(()=> drawWaveformFromAudio().catch(()=>{}), 120);
  }, 180);
});

/* keyboard shortcuts (no changes) */
document.addEventListener('keydown', (e)=>{
  const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.code === 'Space') { e.preventDefault(); if (audio.paused) audio.play().catch(()=>{}); else audio.pause(); }
  if (e.code === 'ArrowRight') { audio.currentTime = Math.min(audio.duration||0, audio.currentTime + 5); }
  if (e.code === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); }
  if (e.code === 'ArrowUp') { volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.05); changeVolume(); }
  if (e.code === 'ArrowDown') { volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.05); changeVolume(); }
});

/* initial draw scheduling */
setTimeout(()=> {
  if (audio.readyState >= 1) {
    if (audioCtx) drawWaveformFromAudio().catch(()=>{});
    else pendingWaveform = true;
  }
}, 300);

/* initial render */
renderLyrics();
