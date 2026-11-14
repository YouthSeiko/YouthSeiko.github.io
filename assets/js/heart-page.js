(function(){
 'use strict';
 const video=document.getElementById('ex-trailer');
 if(!video)return;
 const players=[...document.querySelectorAll('[data-ex-trailer]')];
 players.forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();video.pause();
  const source=video.querySelector('source'),track=video.querySelector('track');
  source.src=link.href;video.poster=link.dataset.poster;
  if(track){track.src=link.dataset.track;track.srclang=link.dataset.exTrailer;track.label=link.textContent.trim();}
  players.forEach(item=>item.setAttribute('aria-current',String(item===link)));
  video.load();
 }));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
 window.addEventListener('pagehide',()=>video.pause());
 const actors=[...document.querySelectorAll('[data-ex-character]')],cast=document.querySelector('.ex-cast'),note=document.getElementById('ex-character-note');
 actors.forEach(button=>button.addEventListener('click',()=>{
  cast.classList.add('has-selection');actors.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  document.querySelectorAll('[data-ex-actor]').forEach(figure=>figure.classList.toggle('is-active',figure.dataset.exActor===button.dataset.exCharacter));
  note.textContent=button.textContent.trim()+' · '+button.dataset.note;
 }));
 const motion=document.querySelector('[data-ex-motion]');
 if(motion){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)motion.hidden=true;
  motion.addEventListener('click',()=>{const paused=document.body.classList.toggle('ex-motion-paused');motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?motion.dataset.enable:motion.dataset.reduce;});
 }
 const links=[...document.querySelectorAll('[data-ex-lightbox]')],dialog=document.getElementById('ex-lightbox'),image=document.getElementById('ex-lightbox-image'),caption=document.getElementById('ex-lightbox-caption'),position=document.getElementById('ex-lightbox-position');
 let current=0,opener=null,previousOverflow='';
 function show(index){current=(index+links.length)%links.length;const link=links[current];image.src=link.href;image.alt=link.querySelector('img').alt;const label=link.closest('figure').querySelector('figcaption');caption.textContent=label.querySelector('h3').textContent+' — '+label.querySelector('p').textContent;position.textContent=(current+1)+' / '+links.length;}
 links.forEach((link,index)=>link.addEventListener('click',event=>{
  if(!dialog||typeof dialog.showModal!=='function')return;
  event.preventDefault();opener=link;show(index);video.pause();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();dialog.querySelector('[data-ex-close]').focus();
 }));
 if(dialog){
  dialog.querySelector('[data-ex-close]').addEventListener('click',()=>dialog.close());
  dialog.querySelector('[data-ex-previous]').addEventListener('click',()=>show(current-1));dialog.querySelector('[data-ex-next]').addEventListener('click',()=>show(current+1));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}else if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;image.removeAttribute('src');if(opener)opener.focus({preventScroll:true});});
 }
})();
