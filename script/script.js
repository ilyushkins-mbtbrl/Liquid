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

let currentIndex = -1;

function fmtTime(t){
  if (!t || isNaN(t)) return "0:00";
  const sec = Math.floor(t % 60);
  const min = Math.floor(t / 60);
  return `${min}:${sec.toString().padStart(2,'0')}`;
}

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
});
audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration)) {
    progress.value = audio.currentTime;
    timeCurrent.textContent = fmtTime(audio.currentTime);
  }
  updateLyricsByTime();
  if (Math.floor(audio.currentTime) % 5 === 0) {
    try { localStorage.setItem('lc_last_time', String(audio.currentTime)); } catch(_) {}
  }
});
audio.addEventListener('play', ()=> { playBtn.textContent = 'Пауза'; });
audio.addEventListener('pause', ()=> { playBtn.textContent = 'Старт'; });

playBtn.addEventListener('click', ()=> {
  if (audio.paused) audio.play().catch(()=>{});
  else audio.pause();
});

progress.addEventListener('input', (e)=> {
  audio.currentTime = parseFloat(e.target.value);
  updateLyricsByTime(true);
});

/* Lyrics sync */
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

/* Keyboard shortcuts */
document.addEventListener('keydown', (e)=>{
  const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  if (e.code === 'Space') { e.preventDefault(); if (audio.paused) audio.play().catch(()=>{}); else audio.pause(); }
  if (e.code === 'ArrowRight') { audio.currentTime = Math.min(audio.duration||0, audio.currentTime + 5); }
  if (e.code === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); }
  if (e.code === 'ArrowUp') { volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.05); changeVolume(); }
  if (e.code === 'ArrowDown') { volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.05); changeVolume(); }
});

/* initial render */
renderLyrics();
