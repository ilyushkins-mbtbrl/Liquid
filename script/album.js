/* script/album.js — single-slide carousel with arrows, dots, swipe */
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
  this.startX = 0; this.isDown = false; this.dragStart = 0;

  // create dots
  this.dots = [];
  this.slides.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.addEventListener('click', ()=> this.goTo(i));
    this.dotsWrap.appendChild(btn);
    this.dots.push(btn);

    // click on slide -> lightbox (simplified)
    const img = s.querySelector('img');
    if (img){
      img.addEventListener('click', (e)=> {
        const lb = document.getElementById('lightbox');
        const lbImg = document.getElementById('lbImage');
        lbImg.src = e.target.src;
        lb.classList.add('show');
        lb.setAttribute('aria-hidden','false');
      });
    }
  });

  // close lightbox on background click
  const lb = document.getElementById('lightbox');
  lb?.addEventListener('click', (e)=> {
    if (e.target === lb) { lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); lb.querySelector('img').src=''; }
  });

  // events
  this.leftBtn?.addEventListener('click', ()=> this.prev());
  this.rightBtn?.addEventListener('click', ()=> this.next());
  window.addEventListener('resize', ()=> this.update());
  // touch
  this.track.addEventListener('touchstart', (e)=> this.onTouchStart(e));
  this.track.addEventListener('touchmove', (e)=> this.onTouchMove(e));
  this.track.addEventListener('touchend', (e)=> this.onTouchEnd(e));
  // mouse drag
  this.track.addEventListener('mousedown', (e)=> this.onMouseDown(e));
  window.addEventListener('mouseup', ()=> this.onMouseUp());
  window.addEventListener('mousemove', (e)=> this.onMouseMove(e));

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

Carousel.prototype.onTouchStart = function(e){
  this.isDown = true; this.startX = e.touches[0].pageX; this.dragStart = this.startX;
};
Carousel.prototype.onTouchMove = function(e){
  if(!this.isDown) return;
  const x = e.touches[0].pageX;
  const delta = x - this.startX;
  this.track.style.transition = 'none';
  this.track.style.transform = `translateX(${ -this.index * this.slideWidth + delta }px)`;
};
Carousel.prototype.onTouchEnd = function(){
  if(!this.isDown) return;
  this.isDown = false;
  this.track.style.transition = '';
  const delta = (event.changedTouches && event.changedTouches[0]) ? (event.changedTouches[0].pageX - this.dragStart) : 0;
  if (Math.abs(delta) > this.slideWidth * 0.15){
    if (delta < 0) this.next(); else this.prev();
  } else {
    this.setTranslate();
  }
};

Carousel.prototype.onMouseDown = function(e){
  e.preventDefault();
  this.isDown = true; this.startX = e.pageX; this.dragStart = this.startX;
};
Carousel.prototype.onMouseMove = function(e){
  if(!this.isDown) return;
  const x = e.pageX;
  const delta = x - this.startX;
  this.track.style.transition = 'none';
  this.track.style.transform = `translateX(${ -this.index * this.slideWidth + delta }px)`;
};
Carousel.prototype.onMouseUp = function(){
  if(!this.isDown) return;
  this.isDown = false; this.track.style.transition = '';
  const delta = event && event.pageX ? event.pageX - this.dragStart : 0;
  if (Math.abs(delta) > this.slideWidth * 0.15){
    if (delta < 0) this.next(); else this.prev();
  } else {
    this.setTranslate();
  }
};

document.addEventListener('DOMContentLoaded', ()=>{
  new Carousel('album-carousel');
  new Carousel('teachers-carousel');
});
