/** 
 * HxHPostPack 
 * 
 * Pack post per Hunter x Hunter Forum - GDR Remastered. Vanilla JS puro. 
 * 
 * - Menu Dimensione font (10-30 px) nell'area di risposta [tutti] 
 * - Menu Colore (50 colori) nell'area di risposta [tutti] 
 * - Menu Font (da font_ARR) nell'area di risposta [tutti] 
 * - Tool titolo discussioni: Grassetto, Corsivo, Colore [solo staff] 
 * - Ingrandimento / rimpicciolimento messaggi (A- / A= / A+) [tutti] 
 * 
 * Dipende da HxHFramework solo per isStaff(). La variabile font_ARR 
 * viene iniettata a parte dal pannello ForumFree. 
 * 
 * @version 2.0.0 
 */ 
 
(function () { 
 'use strict'; 
 
 // ----- ----- ----- ----- ----- CONFIG 
 
 // Font caricati dalla config separata su ForumFree. 
 var FONT_ARR = (typeof window.font_ARR !== 'undefined' && window.font_ARR) ? window.font_ARR : []; 
 
 // 50 colori leggibili sullo sfondo dei post (#8fbeba). 
 var COLORS = [ 
 '#1a1a1a', '#3a3a3a', '#5a5a5a', '#7a1f1f', '#a3231b', 
 '#c0392b', '#8b2f00', '#b8500f', '#a86500', '#8a6d00', 
 '#5c6b00', '#3b6d11', '#1e6b3a', '#0f6e56', '#0a5c5c', 
 '#116b7a', '#0c5a8a', '#185fa5', '#1a3f8a', '#26215c', 
 '#3c2a7a', '#534ab7', '#6a3d9e', '#8e2f8e', '#993556', 
 '#b83266', '#c0392f', '#7a4a2a', '#5a3a1a', '#3d2b1f', 
 '#2c2c54', '#1f4037', '#4a1b3d', '#6b1f2e', '#004d40', 
 '#37474f', '#4e342e', '#880e4f', '#1b5e20', '#4a148c', 
 '#e60073', '#d10047', '#e01e00', '#e05a00', '#7a00cc', 
 '#5900e6', '#0040ff', '#0077cc', '#008a5c', '#2e8b00' 
 ]; 
 
 // Dimensioni font in pixel: da 10 a 30. 
 var FONT_MIN = 10; 
 var FONT_MAX = 30; 
 
 // ----- ----- ----- ----- ----- HELPERS 
 
 var isOldLayout = function () { return document.compatMode === 'BackCompat'; }; 
 
 // Verifica staff tramite HxHFramework. Se il framework non c'e', non e' staff. 
 function isStaff() { 
 return !!(window.HxHFramework && 
 window.HxHFramework.groups && 
 window.HxHFramework.groups.isStaff && 
 window.HxHFramework.groups.isStaff()); 
 } 
 
 // Attende una condizione poi esegue il callback (procede comunque al timeout). 
 function waitFor(condition, callback, interval, timeout) { 
 interval = interval || 100; 
 timeout = timeout || 10000; 
 var elapsed = 0; 
 (function check() { 
 if (condition()) callback(); 
 else if (elapsed >= timeout) callback(); 
 else { elapsed += interval; setTimeout(check, interval); } 
  })(); 
 } 
 
 // Stringa <option> per il menu colore. 
 function buildColorOptions() { 
 var html = '<option value="0">Colore</option>'; 
 for (var i = 0; i < COLORS.length; i++) { 
 html += '<option value="' + COLORS[i] + '" style="background:' + COLORS[i] + '"></option>'; 
 } 
 return html; 
 } 
 
 // Stringa <option> per il menu dimensione (10-30 px). 
 function buildSizeOptions() { 
 var html = '<option value="0">Dimens.</option>'; 
 for (var px = FONT_MIN; px <= FONT_MAX; px++) { 
 html += '<option value="' + px + '">' + px + 'px</option>'; 
 } 
 return html; 
 } 
 
 // Stringa <option> per i font di FONT_ARR. 
 function buildFontOptions() { 
 var html = ''; 
 for (var i = 0; i < FONT_ARR.length; i++) { 
 html += '<option value="' + FONT_ARR[i] + '">' + FONT_ARR[i] + '</option>'; 
 } 
 return html; 
 } 
 
 // Inserisce before+selezione+after in una textarea/input, riposizionando il cursore. 
 function wrapSelection(el, before, after) { 
 if (!el) return; 
 var start = el.selectionStart; 
 var end = el.selectionEnd; 
 var val = el.value; 
 var sel = val.substring(start, end); 
 var insert = before + sel + after; 
 el.value = val.substring(0, start) + insert + val.substring(end); 
 var caret = (start === end) ? start + before.length : start + insert.length; 
 el.focus(); 
 if (el.setSelectionRange) el.setSelectionRange(caret, caret); 
 } 
 
 // Legge la font-size in px (numero) di un elemento. 
 function fontSizePx(el) { 
 return Number(window.getComputedStyle(el).fontSize.split('px')[0]); 
 } 
 
 // ----- ----- ----- ----- ----- EDITOR RISPOSTA (menu Colore/Dimensione/Font) [tutti] 
 
 function enhanceReplyEditor() { 
 var href = location.href; 
 var isReplyContext = 
 document.querySelector('.msg #Post') !== null || 
 document.body.id === 'send' || 
 href.indexOf('?t=') !== -1; 
 
 if (!isReplyContext) return; 
 
 // Colore: per name (layout vecchio) o per title (layout nuovo). 
 var color = document.querySelector('select[name="COLOR"]') || 
 document.querySelector('select[title="Inserisci tag Colore Carattere"]'); 
 if (color) color.innerHTML = buildColorOptions(); 
 
 // Dimensione (px). 
 var size = document.querySelector('select[name="SIZE"]') || 
 document.querySelector('select[title="Inserisci tag Grandezza Carattere"]'); 
 if (size) { 
 size.innerHTML = buildSizeOptions(); 
 size.className += ' hxhPxSize'; // marca il select come "in pixel" 
 // ForumFree ha un onchange inline che inserisce [size=N] con la SUA 
 // scala in punti (10 -> 17pt, ecc.). Lo rimuoviamo: deve agire solo 
 // il nostro handler, che inserisce font-size in pixel reali. 
 size.removeAttribute('onchange'); 
 size.onchange = null; 
 } 
 
 // Font. 
 var font = document.querySelector('select[name="FONT"]') || 
 document.querySelector('select[title="Inserisci tag Tipo Carattere"]'); 
 if (font && FONT_ARR.length) font.innerHTML += buildFontOptions(); 
 } 
 
 // ----- ----- ----- ----- ----- TOOL TITOLO (B / I / Colore) [solo staff] 
 
 function updateTitleCounter() { 
 var el = document.getElementById('TopicTitle'); 
 var counter = document.getElementById('textTitleRemain'); 
 if (el && counter) counter.value = 100 - el.value.length; 
 } 
 
 // ForumFree inietta soft hyphen (U+00AD,) dentro il valore del titolo, 
 // spezzando i tag es. "<b>". Li rimuoviamo dopo ogni inserimento. 
 function stripSoftHyphens(el) { 
 if (!el) return; 
 if (el.value.indexOf('\u00AD') !== -1) { 
 el.value = el.value.replace(/\u00AD/g, ''); 
 } 
 } 
 
 function addTitleBBCode(before, after) { 
 var el = document.getElementById('TopicTitle'); 
 if (!el) return; 
 wrapSelection(el, before, after); 
 stripSoftHyphens(el); 
 updateTitleCounter(); 
 } 
 
 function buildTitleTool() { 
 var title = document.getElementById('TopicTitle'); 
 if (!title) return; 
 
 var wrap = document.createElement('span'); 
 wrap.innerHTML = 
 '<br>' + 
 '<button class="codebuttons titleBBCode" title="Testo in Grassetto (alt + b)" accesskey="b" type="button" data-tag="b">&nbsp;<b>B</b>&nbsp;</button>&nbsp;' + 
 '<button class="codebuttons titleBBCode" title="Testo in Corsivo (alt + i)" accesskey="i" type="button" data-tag="i">&nbsp;<i>I</i>&nbsp;</button>&nbsp;' + 
 '<select class="codebuttons titleSelBBCode" title="Inserisci tag Colore Carattere" data-n="color">' + 
 buildColorOptions() + 
 '</select>' + 
 '&nbsp; <input type="text" class="textinput" value="100" style="width: 25px" id="textTitleRemain" readonly>'; 
 
 // Inserisce subito dopo il campo titolo. 
 if (title.nextSibling) title.parentNode.insertBefore(wrap, title.nextSibling); 
 else title.parentNode.appendChild(wrap); 
 
 updateTitleCounter(); 
 } 
 
 // ----- ----- ----- ----- ----- ZOOM MESSAGGI (A- / A= / A+) [tutti] 
 
 function buildZoomButtons() { 
 // Nella skin esistono piu' elementi ".left" (es. ".left Sub" della barra 
 // risposte/visite). Quello giusto e' la barra con i link Precedente/Successiva. 
 var host = null; 
 var candidates = document.querySelectorAll('.topic .title .left, .topic .title .lt'); 
 for (var i = 0; i < candidates.length; i++) { 
 // Scarta i container non visibili (dimensione zero): la skin ha barre 
 // di navigazione duplicate, una nascosta, che verrebbe scelta per prima. 
 var rect = candidates[i].getBoundingClientRect(); 
 if (rect.width === 0 && rect.height === 0) continue; 
 
 var anchorList = candidates[i].querySelectorAll('a'); 
 var found = false; 
 for (var j = 0; j < anchorList.length; j++) { 
 var hrefAttr = String.fromCharCode(104, 114, 101, 102); // "href" 
 var href = anchorList[j].getAttribute(hrefAttr); 
 if (!href) href = ''; 
 if (href.indexOf('view=old') !== -1 || href.indexOf('view=new') !== -1) { 
 found = true; 
 break; 
 } 
 } 
 if (found) { host = candidates[i]; break; } 
 } 
 // Fallback: primo container VISIBILE, poi .title. 
 if (!host) { 
 for (var k = 0; k < candidates.length; k++) { 
 var r2 = candidates[k].getBoundingClientRect(); 
 if (r2.width !== 0 || r2.height !== 0) { host = candidates[k]; break; } 
 } 
 } 
 if (!host) host = document.querySelector('.topic .title'); 
 if (!host) return; 
 
 var wrap = document.createElement('span'); 
 wrap.innerHTML = 
 '&nbsp;&nbsp;<a title="Diminuisci le dimensioni dei font." style="cursor: pointer; font-size: 11px" class="color_minus" id="colorMinus"><i>A-</i></a>' + 
 '&nbsp;&nbsp;<a title="Ripristina le dimensioni originali dei font." style="cursor: pointer; font-size: 11px" class="color_restore" id="colorRestore"><u>A=</u></a>' + 
 '&nbsp;&nbsp;<a title="Aumenta le dimensioni dei font." style="cursor: pointer; font-size: 11px" class="color_plus" id="colorPlus"><b>A+</b></a>'; 
 host.appendChild(wrap); 
 } 
 
 // Fattore di scala corrente (1 = originale). A+ / A- lo spostano di 0.1. 
 var zoomFactor = 1; 
 var ZOOM_STEP = 0.1; 
 var ZOOM_FACTOR_MIN = 0.5; 
 var ZOOM_FACTOR_MAX = 2; 
 
 // Applica il fattore di scala ai .color e discendenti, partendo dalla 
 // dimensione ORIGINALE di ciascun elemento. Le firme restano intatte. 
 // 
 // IMPORTANTE: la memorizzazione degli originali avviene in una passata 
 // SEPARATA e precedente all'applicazione. Altrimenti, settando il 
 // font-size di un genitore, i figli (che ereditano) verrebbero letti 
 // gia' ingranditi e memorizzati sbagliati -> doppia moltiplicazione. 
 function captureOriginals() { 
 var nodes = document.querySelectorAll('.color, .color *'); 
 for (var i = 0; i < nodes.length; i++) { 
 var el = nodes[i]; 
 if (el.closest && el.closest('.signature')) continue; 
 if (!el.hasAttribute('data-hxh-orig')) { 
 el.setAttribute('data-hxh-orig', fontSizePx(el)); 
 } 
 } 
 } 
 
 function applyZoom(factor) { 
 captureOriginals(); // prima leggi TUTTI gli originali... 
 var nodes = document.querySelectorAll('.color[data-hxh-orig], .color [data-hxh-orig]'); 
 for (var i = 0; i < nodes.length; i++) { // ...poi applica 
 var base = Number(nodes[i].getAttribute('data-hxh-orig')); 
 if (base > 0) nodes[i].style.fontSize = (base * factor) + 'px'; 
 } 
 } 
 
 function zoomMinus() { 
 var next = Math.round((zoomFactor - ZOOM_STEP) * 10) / 10; 
 if (next >= ZOOM_FACTOR_MIN) { 
 zoomFactor = next; 
 applyZoom(zoomFactor); 
 } 
 } 
 
 function zoomPlus() { 
 var next = Math.round((zoomFactor + ZOOM_STEP) * 10) / 10; 
 if (next <= ZOOM_FACTOR_MAX) { 
 zoomFactor = next; 
 applyZoom(zoomFactor); 
 } 
 } 
 
 // Ripristino reale: rimuove lo stile inline aggiunto da noi, cosi' ogni 
 // elemento torna esattamente alla dimensione del CSS originale. 
 function zoomRestore() { 
 zoomFactor = 1; 
 var nodes = document.querySelectorAll('.color [data-hxh-orig], .color[data-hxh-orig]'); 
 for (var i = 0; i < nodes.length; i++) { 
 nodes[i].style.fontSize = ''; 
 nodes[i].removeAttribute('data-hxh-orig'); 
 } 
 } 
 
 // ----- ----- ----- ----- ----- EVENT DELEGATION (listener globali) 
 
 function closestSafe(el, selector) { 
 return (el && el.closest) ? el.closest(selector) : null; 
 } 
 
 function onClick(e) { 
 var t = e.target; 
 
 if (closestSafe(t, '#colorMinus')) { zoomMinus(); return; } 
 if (closestSafe(t, '#colorPlus')) { zoomPlus(); return; } 
 if (closestSafe(t, '#colorRestore')) { zoomRestore(); return; } 
 
 var bb = closestSafe(t, '.titleBBCode'); 
 if (bb) { 
 var tag = bb.getAttribute('data-tag'); // 'b' | 'i' 
 // Costruiamo i tag a runtime dai char code, cosi' nel source dello 
 // script salvato su ForumFree non esiste la sequenza "<b>" letterale 
 // che la piattaforma potrebbe spezzare con soft hyphen. 
 var LT = String.fromCharCode(60); // < 
 var GT = String.fromCharCode(62); // > 
 var SL = String.fromCharCode(47); // / 
 addTitleBBCode(LT + tag + GT, LT + SL + tag + GT); 
 return; 
 } 
 } 
 
 function onChange(e) { 
 var t = e.target; 
 if (!t.classList) return; 
 
 // Menu colore del titolo. Usiamo <span> invece di <span>: e' inline 
 // (niente spazi come <p>) e non e' colpito dalla regola .zz span{display:none} 
 // usata in homepage. I tag sono costruiti da char code per evitare che 
 // ForumFree spezzi le stringhe letterali con soft hyphen. 
 if (t.classList.contains('titleSelBBCode')) { 
 var cval = t.value; 
 if (cval !== '0') { 
 var LTf = String.fromCharCode(60); // < 
 var GTf = String.fromCharCode(62); // > 
 var SLf = String.fromCharCode(47); // / 
 var FONT = String.fromCharCode(102, 111, 110, 116); // "font" 
 var before = LTf + FONT + ' color="' + cval + '"' + GTf; 
 var after = LTf + SLf + FONT + GTf; 
 addTitleBBCode(before, after); 
 } 
 t.selectedIndex = 0; 
 return; 
 } 
 
 // Menu dimensione dell'editor risposta: PIXEL reali via <span>. 
 if (t.classList.contains('hxhPxSize')) { 
 var px = t.value; 
 if (px !== '0') { 
 var post = (document.REPLIER && document.REPLIER.Post) || 
 document.getElementById('Post'); 
 wrapSelection(post, '<span style="font-size:' + px + 'px">', '</span>'); 
 } 
 t.selectedIndex = 0; 
 return; 
 } 
 } 
 
 function onKeyup(e) { 
 if (e.target && e.target.id === 'TopicTitle') { 
 stripSoftHyphens(e.target); 
 updateTitleCounter(); 
 } 
 } 
 
 // ----- ----- ----- ----- ----- INIT 
 
 function init() { 
 // I pulsanti zoom hanno bisogno di dimensioni affidabili per scartare i 
 // container nascosti: li costruiamo a load completo. Se load e' gia' 
 // passato, li costruiamo subito. 
 if (document.readyState === 'complete') { 
 buildZoomButtons(); 
 } else { 
 window.addEventListener('load', buildZoomButtons); 
 } 
 
 enhanceReplyEditor(); 
 
 // Tool titolo solo staff: attende il framework. 
 waitFor( 
 function () { 
 return !!(window.HxHFramework && window.HxHFramework.groups && window.HxHFramework.groups.isStaff); 
 }, 
 function () { 
 if (isStaff()) buildTitleTool(); 
 } 
 ); 
 
 document.addEventListener('click', onClick); 
 document.addEventListener('change', onChange); 
 document.addEventListener('keyup', onKeyup); 
 } 
 
 if (document.readyState === 'loading') { 
 document.addEventListener('DOMContentLoaded', init); 
 } else { 
 init(); 
 } 
 
})();
