// === SCRIPT LYRICS SCROLLER === 
 
document.addEventListener('DOMContentLoaded', function() { 
 setTimeout(function() { 
 initLyricsScrollers(); 
 }, 1500); 
}); 
 
function initLyricsScrollers() { 
 var playersWithLyrics = document.querySelectorAll('.player-with-lyrics'); 
 
 playersWithLyrics.forEach(function(container) { 
 // Cerca gli elementi in modo più flessibile, anche se annidati in altri div/span 
 var btn = container.querySelector('.custom-player'); 
 var lyricsBox = container.querySelector('.lyrics-box'); 
 var iframe = container.querySelector('iframe'); 
 
 if (!btn || !lyricsBox || !iframe) return; 
 
 var lyricsContent = lyricsBox.querySelector('.lyrics-content'); 
 var iframeSrc = iframe.src || ''; 
 
 var scroller = createLyricsScroller(lyricsBox, lyricsContent); 
 
 if (!scroller) return; 
 
 if (iframeSrc.includes('soundcloud.com')) { 
 attachSoundCloudLyrics(iframe, scroller); 
 } else if (iframeSrc.includes('youtube.com')) { 
 attachYouTubeLyrics(iframe, scroller); 
 } 
 }); 
} 
 
function createLyricsScroller(lyricsBox, lyricsContent) { 
 var boxHeight = lyricsBox.offsetHeight; 
 var contentHeight = lyricsContent.offsetHeight; 
 var scrollDistance = contentHeight - boxHeight; 
 
 if (scrollDistance <= 0) return null; 
 
 // Inizia con la prima riga visibile (0 invece di boxHeight) 
 lyricsContent.style.transform = 'translateY(0px)'; 
 
 return { 
 content: lyricsContent, 
 scrollDistance: scrollDistance, 
 boxHeight: boxHeight, 
 duration: 0, 
 durationReady: false, 
 startTime: null, 
 pausedElapsed: 0, 
 animationId: null, 
 isFinished: false, 
 isPaused: true, 
 
 setDuration: function(dur) { 
 this.duration = dur; 
 this.durationReady = true; 
 }, 
 
 start: function() { 
 if (!this.durationReady || this.duration === 0) return; 
 if (this.isFinished) return; 
 
 this.isPaused = false; 
 this.startTime = Date.now() - this.pausedElapsed; 
 this.animate(); 
 }, 
 
 animate: function() { 
 var self = this; 
 
 if (self.isPaused) { 
 self.animationId = null; 
 return; 
 } 
 
 var elapsed = Date.now() - this.startTime; 
 var progress = Math.min(elapsed / (this.duration * 1000), 1); 
 
 // Scorre da 0 a -scrollDistance (solo scrollDistance, non più boxHeight) 
 var currentPosition = -(progress * this.scrollDistance); 
 this.content.style.transform = 'translateY(' + currentPosition + 'px)'; 
 
 if (progress < 1) { 
 this.animationId = requestAnimationFrame(function() { 
 self.animate(); 
 }); 
 } else { 
 this.isFinished = true; 
 this.animationId = null; 
 } 
 }, 
 
 pause: function() { 
 this.isPaused = true; 
 
 if (this.animationId) { 
 cancelAnimationFrame(this.animationId); 
 this.animationId = null; 
 } 
 
 if (this.startTime !== null) { 
 this.pausedElapsed = Date.now() - this.startTime; 
 } 
 }, 
 
 reset: function() { 
 this.pause(); 
 this.content.style.transform = 'translateY(0px)'; 
 this.startTime = null; 
 this.pausedElapsed = 0; 
 this.isFinished = false; 
 } 
 }; 
} 
 
function attachSoundCloudLyrics(iframe, scroller) { 
 var playerId = iframe.id; 
 var isPlaying = false; 
 
 var checkInterval = setInterval(function() { 
 if (window.scPlayers && window.scPlayers[playerId]) { 
 clearInterval(checkInterval); 
 
 var widget = window.scPlayers[playerId]; 
 
 widget.bind(SC.Widget.Events.READY, function() { 
 widget.getDuration(function(duration) { 
 scroller.setDuration(duration / 1000); 
 
 if (isPlaying) { 
 scroller.start(); 
 } 
 }); 
 }); 
 
 widget.bind(SC.Widget.Events.PLAY, function() { 
 isPlaying = true; 
 scroller.start(); 
 }); 
 
 widget.bind(SC.Widget.Events.PAUSE, function() { 
 isPlaying = false; 
 scroller.pause(); 
 }); 
 
 widget.bind(SC.Widget.Events.FINISH, function() { 
 isPlaying = false; 
 }); 
 
 widget.bind(SC.Widget.Events.SEEK, function() { 
 widget.getPosition(function(position) { 
 var positionSeconds = position / 1000; 
 scroller.pausedElapsed = positionSeconds * 1000; 
 scroller.startTime = Date.now() - scroller.pausedElapsed; 
 scroller.isFinished = false; 
 }); 
 }); 
 } 
 }, 100); 
} 
 
function attachYouTubeLyrics(iframe, scroller) { 
 var playerId = iframe.id; 
 
 var checkInterval = setInterval(function() { 
 if (window.ytPlayers && window.ytPlayers[playerId]) { 
 clearInterval(checkInterval); 
 
 var player = window.ytPlayers[playerId]; 
 
 var readyCheck = setInterval(function() { 
 try { 
 var duration = player.getDuration(); 
 if (duration > 0) { 
 clearInterval(readyCheck); 
 scroller.setDuration(duration); 
 
 var lastState = -1; 
 setInterval(function() { 
 var state = player.getPlayerState(); 
 
 if (state === 1 && lastState !== 1) { 
 scroller.start(); 
 } else if (state === 2 && lastState === 1) { 
 scroller.pause(); 
 } else if (state === 0) { 
 // Finito 
 } 
 
 lastState = state; 
 }, 200); 
 } 
 } catch(e) {} 
 }, 200); 
 } 
 }, 100); 
}
