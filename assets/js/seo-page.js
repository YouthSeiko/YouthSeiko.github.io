(function(){
 'use strict';
 const videos=Array.from(document.querySelectorAll('video[data-studio-video]'));
 function pause(except){videos.forEach(video=>{if(video!==except)video.pause();});}
 videos.forEach(video=>video.addEventListener('play',()=>pause(video)));
 document.querySelectorAll('details.yuki-workshop').forEach(workshop=>workshop.addEventListener('toggle',()=>{if(!workshop.open)pause();}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 window.addEventListener('pagehide',()=>pause());
})();
