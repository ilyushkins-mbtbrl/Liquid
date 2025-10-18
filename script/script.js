/* script/script.js — финальная версия (убраны offset/marks/import/export/keyboard shortcuts) */

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
const waveformCtx = waveformCanvas.getContext('2d');

/* Lyrics array — каждое время увеличено на +0.75s */
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

/* AudioContext + waveform cache (lightweight) */
let audioCtx = null;
let audioBufferCache = null;
let waveformBaseImageData = null;
let waveformBaseImg = null;
let waveformBaseWidth = 0;
let waveformBaseHeight = 0;
let pendingWaveform = false;

/* create AudioContext on first user gesture to avoid browser blocks */
function initAudioContextOnce(){
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (pendingWaveform) { setTimeout(()=> { drawWaveformFromAudio().catch(()=>{}); }, 120); pendingWaveform = false; }
  } catch(e){ console.warn('AudioContext init failed', e); }
}
document.addEventListener('pointerdown', initAudioContextOnce, { once: true, passive: true });

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
volumeSlider.addEventListener('input', changeVolume);
volPlusBtn?.addEventListener('click', ()=> { volumeSlider.value = Math.min(parseFloat(volumeSlider.value) + 0.05, 1); changeVolume(); });
volMinusBtn?.addEventListener('click', ()=> { volumeSlider.value = Math.max(parseFloat(volumeSlider.value) - 0.05, 0); changeVolume(); });
volumeSlider.value = 0.8;
changeVolume();

/* Player basic */
audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = fmtTime(audio.duration);
  progress.max = audio.duration;
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
});
audio.addEventListener('play', ()=> {
  playBtn.textContent = 'Пауза';
});
audio.addEventListener('pause', ()=> {
  playBtn.textContent = 'Старт';
});

playBtn.addEventListener('click', ()=> {
  initAudioContextOnce();
  if (audio.paused) audio.play().catch(()=>{});
  else audio.pause();
});

/* Seek via progress range (mouse/touch only) */
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

/* Waveform decode & draw: decode once, cache, overlay progress fast */
async function decodeAudio(url){
  try {
    const res = await fetch(url);
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
    waveformCanvas.width = width * devicePixelRatio;
    waveformCanvas.height = height * devicePixelRatio;
    waveformCtx.scale(devicePixelRatio, devicePixelRatio);
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
  waveformCanvas.width = width * devicePixelRatio;
  waveformCanvas.height = height * devicePixelRatio;
  waveformCtx.scale(devicePixelRatio, devicePixelRatio);
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
  if (waveformBaseImageData && waveformBaseWidth === width && waveformBaseHeight === height){
    ctx.putImageData(waveformBaseImageData, 0, 0);
  } else if (waveformBaseImg) {
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

/* waveform click => seek */
waveformCanvas.addEventListener('click', (e)=>{
  const rect = waveformCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const ratio = x / rect.width;
  if (audio.duration) audio.currentTime = ratio * audio.duration;
});

/* responsive redraw debounce */
window.addEventListener('resize', ()=> {
  clearTimeout(window._wfResize);
  window._wfResize = setTimeout(()=> {
    if (audio.currentSrc) setTimeout(()=> drawWaveformFromAudio().catch(()=>{}), 120);
  }, 180);
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
