// Variabile globale per i player YouTube 
var ytPlayers = {}; 
var scPlayers = {}; 
var ytApiReady = false; 
 
// Callback chiamato dall'API YouTube quando è pronta 
function onYouTubeIframeAPIReady() { 
 ytApiReady = true; 
 console.log('YouTube API pronta'); 
} 
 
document.addEventListener('DOMContentLoaded', function() { 
 // Aspetta un po' per dare tempo all'API YouTube di caricarsi 
 setTimeout(function() { 
 initAllPlayers(); 
 }, 1000); 
}); 
 
// Funzione per fermare tutti i player tranne quello specificato 
function stopAllPlayersExcept(currentPlayerId) { 
 // Ferma tutti i player SoundCloud 
 Object.keys(scPlayers).forEach(function(id) { 
 if (id !== currentPlayerId) { 
 scPlayers[id].pause(); 
 } 
 }); 
 
 // Ferma tutti i player YouTube 
 Object.keys(ytPlayers).forEach(function(id) { 
 if (id !== currentPlayerId) { 
 ytPlayers[id].pauseVideo(); 
 } 
 }); 
} 
 
function initAllPlayers() { 
 var buttons = document.querySelectorAll('.custom-player'); 
 
 buttons.forEach(function(btn) { 
 var iframe = btn.nextElementSibling; 
 
 if (!iframe || iframe.tagName !== 'IFRAME') { 
 var parent = btn.parentElement; 
 iframe = parent.querySelector('iframe'); 
 } 
 
 if (!iframe) return; 
 
 // Assegna ID univoci se non li hanno già 
 if (!btn.id) { 
 btn.id = 'btn-' + Math.random().toString(36).substr(2, 9); 
 } 
 if (!iframe.id) { 
 iframe.id = 'player-' + Math.random().toString(36).substr(2, 9); 
 } 
 
 // Determina il tipo in base all'URL dell'iframe 
 var iframeSrc = iframe.src || ''; 
 
 if (iframeSrc.includes('soundcloud.com')) { 
 initSoundCloudPlayer(btn, iframe); 
 } else if (iframeSrc.includes('youtube.com')) { 
 initYouTubePlayer(btn, iframe); 
 } 
 }); 
} 
 
// === SOUNDCLOUD === 
function initSoundCloudPlayer(btn, iframe) { 
 var widget = SC.Widget(iframe); 
 var playerId = iframe.id; 
 
 // Salva il widget nella lista globale 
 scPlayers[playerId] = widget; 
 
 btn.addEventListener('click', function() { 
 widget.toggle(); 
 }); 
 
 widget.bind(SC.Widget.Events.PLAY, function() { 
 stopAllPlayersExcept(playerId); 
 btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>'; 
 }); 
 
 widget.bind(SC.Widget.Events.PAUSE, function() { 
 btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>'; 
 }); 
 
 widget.bind(SC.Widget.Events.FINISH, function() { 
 btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>'; 
 }); 
} 
 
// === YOUTUBE === 
function initYouTubePlayer(btn, iframe) { 
 if (!window.YT || !window.YT.Player) { 
 console.log('API YouTube non ancora caricata'); 
 return; 
 } 
 
 var playerId = iframe.id; 
 
 var player = new YT.Player(iframe, { 
 events: { 
 'onReady': function() { 
 btn.addEventListener('click', function() { 
 var state = player.getPlayerState(); 
 if (state === 1) { // Playing 
 player.pauseVideo(); 
 } else { 
 player.playVideo(); 
 } 
 }); 
 }, 
 'onStateChange': function(event) { 
 if (event.data === YT.PlayerState.PLAYING) { 
 stopAllPlayersExcept(playerId); 
 btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>'; 
 } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) { 
 btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>'; 
 } 
 } 
 } 
 }); 
 
 ytPlayers[playerId] = player; 
}
