# Liquid Calculus — Караоке (iOS26 glass style)

## Структура
karaoke-site/
├─ index.html
├─ style/
│   ├─ style.css
│   ├─ album.css
│   └─ footer.css
├─ script/
│   ├─ script.js
│   └─ album.js
├─ music/
│   └─ track.mp3   (НЕ пушить!)
├─ assets/
│   ├─ images/album/1.jpg ... 10.jpg
│   └─ images/teachers/1.jpg ... 6.jpg
└─ README.md

## Запуск локально
1. Положи `music/track.mp3` (локальный трек).
2. Скачай изображения и положи в `assets/images/...`.
3. Открой `index.html` через Live Server (VSCode) или любой локальный сервер.
4. Waveform строится автоматически (WebAudio API) — требуется доступ к файлу.

## Работа с таймингами
- Автоматический sync: нажми **Mark** во время проигрывания — отметка сохранится.
- Export — сохранит marks в JSON.
- Import — поддерживает JSON или простой `.lrc` (формат [mm:ss.xx] текст).
- Для ручной правки таймингов отредактируй `script/script.js` массив `lyrics` или используй Import.

## Деплой (GitHub Pages)
- Не пушь mp3.
- В настройках Pages укажи ветку `main`/root или используй `docs/`.

