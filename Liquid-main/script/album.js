/* script/album.js — pointer events + touch/mouse fallback, no global `event` usage */
function Carousel(el){
  this.root = (typeof el === 'string') ? document.getElementById(el) : el;
  if(!this.root) return;
  this.track = this.root.querySelector('.carousel-track');
  this.slides = Array.from(this.track.children);
  this.leftBtn = this.root.querySelector('.carousel-arrow.left');
  this.rightBtn = this.root.querySelector('.carousel-arrow.right');
  this.dotsWrap = this.root.querySelector('.carousel-dots');
  this.viewport = this.root.querySelector('.carousel-viewport');
  this.index = 0;

  // pointer drag state
  this.isDown = false; this.startX = 0; this.dragStart = 0;

  // create dots
  this.dots = [];
  this.slides.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Слайд ${i+1} из ${this.slides.length}`);
    btn.setAttribute('role','tab');
    btn.addEventListener('click', (e)=> { e.preventDefault(); this.goTo(i); });
    this.dotsWrap.appendChild(btn);
    this.dots.push(btn);

    // click on slide -> lightbox
    const img = s.querySelector('img');
    if (img){
      img.addEventListener('click', (e)=> {
        const lb = document.getElementById('lightbox');
        const lbImg = document.getElementById('lbImage');
        lbImg.src = e.target.currentSrc || e.target.src;
        lb.classList.add('show');
        lb.setAttribute('aria-hidden','false');
        document.getElementById('lbCloseBtn')?.focus();
      });
    }
    s.setAttribute('tabindex', '-1');
  });

  // close lightbox
  const lb = document.getElementById('lightbox');
  const lbClose = document.getElementById('lbCloseBtn');

  const closeLightbox = () => {
    lb.classList.remove('show');
    lb.setAttribute('aria-hidden','true');
    const lbImg = document.getElementById('lbImage');
    if (lbImg) lbImg.src = '';
    this.root && this.root.querySelector('.carousel-arrow.left')?.focus();
  };

  lb?.addEventListener('click', (e)=> {
    if (e.target === lb) { closeLightbox(); }
  });
  lbClose?.addEventListener('click', (e)=> { e.preventDefault(); closeLightbox(); });

  // events
  this.leftBtn?.addEventListener('click', ()=> this.prev());
  this.rightBtn?.addEventListener('click', ()=> this.next());
  window.addEventListener('resize', ()=> this.update());

  // Attach pointer events if supported, otherwise fallback to touch/mouse
  if (window.PointerEvent) {
    this.track.addEventListener('pointerdown', (e)=> this.onPointerDown(e));
    window.addEventListener('pointerup', (e)=> this.onPointerUp(e));
    window.addEventListener('pointermove', (e)=> this.onPointerMove(e));
    this.track.addEventListener('pointercancel', (e)=> this.onPointerCancel(e));
  } else {
    // touch fallback
    this.track.addEventListener('touchstart', (e)=> {
      if (!e.touches || e.touches.length === 0) return;
      const fake = { clientX: e.touches[0].clientX, pointerType: 'touch', pointerId: 1, target: e.target };
      this.onPointerDown(fake);
    }, { passive: true });

    window.addEventListener('touchmove', (e)=> {
      if (!e.touches || e.touches.length === 0) return;
      const fake = { clientX: e.touches[0].clientX };
      this.onPointerMove(fake);
    }, { passive: true });

    window.addEventListener('touchend', (e)=> {
      // changedTouches might be empty on some platforms; use last known position
      const last = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
      const fake = last ? { clientX: last.clientX } : {};
      this.onPointerUp(fake);
    }, { passive: true });

    // mouse fallback for desktop Safari older versions
    this.track.addEventListener('mousedown', (e)=> this.onPointerDown(e));
    window.addEventListener('mouseup', (e)=> this.onPointerUp(e));
    window.addEventListener('mousemove', (e)=> this.onPointerMove(e));
  }

  this.update();
  this.goTo(0);
}

Carousel.prototype.update = function(){
  this.slideWidth = this.viewport.clientWidth;
  this.track.style.width = `${this.slideWidth * this.slides.length}px`;
  this.slides.forEach(sl => sl.style.width = `${this.slideWidth}px`);
  this.setTranslate();
};

Carousel.prototype.setTranslate = function(){
  const x = -this.index * this.slideWidth;
  this.track.style.transform = `translateX(${x}px)`;
  this.updateButtons();
  this.updateDots();
};

Carousel.prototype.goTo = function(i){
  if(i < 0) i = 0;
  if(i > this.slides.length -1) i = this.slides.length -1;
  this.index = i; this.setTranslate();
  this.dots.forEach((d, idx) => d.setAttribute('aria-pressed', idx === this.index ? 'true' : 'false'));
};

Carousel.prototype.prev = function(){ this.goTo(this.index - 1); };
Carousel.prototype.next = function(){ this.goTo(this.index + 1); };

Carousel.prototype.updateButtons = function(){
  if(this.leftBtn) this.leftBtn.disabled = this.index === 0;
  if(this.rightBtn) this.rightBtn.disabled = this.index === this.slides.length -1;
};

Carousel.prototype.updateDots = function(){
  this.dots.forEach((d, idx) => d.classList.toggle('active', idx === this.index));
};

// Pointer handlers (work with real pointer events and with our fake objects from touch fallback)
Carousel.prototype.onPointerDown = function(e){
  // ignore right click
  if (e.pointerType === 'mouse' && e.button !== undefined && e.button !== 0) return;
  this.isDown = true; this.startX = e.clientX; this.dragStart = this.startX;
  try { e.target && e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch(_) {}
};
Carousel.prototype.onPointerMove = function(e){
  if(!this.isDown) return;
  const x = e.clientX;
  const delta = x - this.startX;
  this.track.style.transition = 'none';
  this.track.style.transform = `translateX(${ -this.index * this.slideWidth + delta }px)`;
};
Carousel.prototype.onPointerUp = function(e){
  if(!this.isDown) return;
  this.isDown = false; this.track.style.transition = '';
  const delta = (e && typeof e.clientX === 'number') ? (e.clientX - this.dragStart) : 0;
  const threshold = this.slideWidth * 0.15;
  if (Math.abs(delta) > threshold){
    if (delta < 0) this.next(); else this.prev();
  } else {
    this.setTranslate();
  }
};
Carousel.prototype.onPointerCancel = function(){ this.isDown = false; this.setTranslate(); };

document.addEventListener('DOMContentLoaded', ()=>{
  new Carousel('album-carousel');
  new Carousel('teachers-carousel');
});
