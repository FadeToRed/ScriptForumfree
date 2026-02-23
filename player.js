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
 try {
 ytPlayers[id].pauseVideo(); 
 } catch(e) {
 console.error('Errore pausa YouTube player:', e);
 }
 } 
 }); 
} 
 
function initAllPlayers() { 
 var buttons = document.querySelectorAll('.custom-player'); 
 
 console.log('Trovati ' + buttons.length + ' player da inizializzare');
 console.log('YT disponibile:', typeof YT !== 'undefined');
 console.log('YT.Player disponibile:', typeof YT !== 'undefined' && typeof YT.Player !== 'undefined');
 
 buttons.forEach(function(btn) { 
 // Cerca l'iframe nel modo più vicino possibile al button
 var iframe = null;
 
 // Prima cerca nei fratelli (siblings) diretti
 var currentElement = btn.nextElementSibling;
 while (currentElement && !iframe) {
 if (currentElement.tagName === 'IFRAME') {
 iframe = currentElement;
 break;
 }
 currentElement = currentElement.nextElementSibling;
 }
 
 // Se non trovato nei siblings, cerca nel parent diretto
 if (!iframe) {
 var parent = btn.parentElement;
 iframe = parent.querySelector('iframe');
 }
 
 // Se ancora non trovato, cerca nel container player-with-lyrics
 if (!iframe) {
 var playerContainer = btn.closest('.player-with-lyrics');
 if (playerContainer) {
 iframe = playerContainer.querySelector('iframe');
 }
 }
 
 if (!iframe) {
 console.log('Iframe non trovato per button:', btn);
 return; 
 }
 
 // Assegna ID univoci se non li hanno già 
 if (!btn.id) { 
 btn.id = 'btn-' + Math.random().toString(36).substr(2, 9); 
 } 
 if (!iframe.id) { 
 iframe.id = 'player-' + Math.random().toString(36).substr(2, 9); 
 } 
 
 // Determina il tipo in base all'URL dell'iframe 
 var iframeSrc = iframe.src || ''; 
 
 console.log('Iframe src:', iframeSrc);
 
 if (iframeSrc.includes('soundcloud.com')) { 
 console.log('Inizializzo SoundCloud player:', iframe.id);
 initSoundCloudPlayer(btn, iframe); 
 } else if (iframeSrc.includes('youtube.com')) { 
 console.log('Inizializzo YouTube player:', iframe.id);
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
 if (typeof YT === 'undefined' || !YT.Player) { 
 console.error('API YouTube non caricata! Verifica che youtube-api-2.js sia caricato correttamente');
 // Riprova dopo un secondo
 setTimeout(function() {
 initYouTubePlayer(btn, iframe);
 }, 1000);
 return; 
 } 
 
 var playerId = iframe.id; 
 
 // Controlla se il player esiste già
 if (ytPlayers[playerId]) {
 console.log('Player già esistente, salto:', playerId);
 return;
 }
 
 console.log('Creo nuovo YT.Player per:', playerId);
 
 try {
 var player = new YT.Player(iframe, { 
 events: { 
 'onReady': function() { 
 console.log('YouTube player ready:', playerId);
 
 btn.addEventListener('click', function() { 
 try {
 var state = player.getPlayerState(); 
 console.log('Stato player:', state);
 if (state === 1) { // Playing 
 player.pauseVideo(); 
 } else { 
 player.playVideo(); 
 } 
 } catch(e) {
 console.error('Errore click:', e);
 }
 }); 
 }, 
 'onStateChange': function(event) { 
 console.log('State change:', event.data);
 if (event.data === YT.PlayerState.PLAYING) { 
 stopAllPlayersExcept(playerId); 
 btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>'; 
 } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) { 
 btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>'; 
 } 
 },
 'onError': function(event) {
 console.error('Errore YouTube player:', event.data);
 console.error('Codici errore: 2=parametro non valido, 5=errore HTML5, 100=video non trovato, 101/150=video non disponibile');
 }
 } 
 }); 
 
 ytPlayers[playerId] = player;
 console.log('Player YouTube creato con successo');
 } catch(e) {
 console.error('Errore nella creazione del player YouTube:', e);
 }
}
