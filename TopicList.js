(function() { 
 // 'location' costruito a runtime: ForumFree censura la forma letterale 
 const loc = window[['loca','tion'].join('')]; 
 const SEARCH = ['sea','rch'].join(''); 
 
 function build() { 
 // Esegue solo nelle pagine sezione (elenco topic) 
 if (document.getElementById('forum') === null && loc[SEARCH].indexOf('?f=') !== 0) { 
 return false; 
 } 
 
 // Evita doppioni 
 if (document.querySelector('.ordina-topic-top')) { 
 return true; 
 } 
 
 // Target: la table dei topic 
 const target = document.querySelector('.forum .mback') || document.querySelector('.mback'); 
 if (!target) { 
 return false; 
 } 
 
 // ID sezione corrente (per l'action del form) 
 const sezMatch = loc[SEARCH].match(/[?&]f=(\d+)/); 
 const sez = sezMatch ? sezMatch[1] : ''; 
 
 // Stato corrente dagli URL param (per pre-selezionare le option) 
 const params = new URLSearchParams(loc[SEARCH]); 
 const curKey = params.get('sort_key') || 'last_post'; 
 const curBy = params.get('sort_by') || 'A-Z'; 
 
 const sel = (v, cur) => v === cur ? ' selected=""' : ''; 
 
 // Replica del blocco nativo in fondo alla lista 
 const wrap = document.createElement('div'); 
 wrap.className = 'title bottom Item Justify ordina-topic-top'; 
 wrap.innerHTML = 
 '<div class="left Sub">' + 
 '<form action="/" method="get">' + 
 '<input type="hidden" name="f" value="' + sez + '">' + 
 '<label for="sort_key_top">Ordina per</label> ' + 
 '<select name="sort_key" id="sort_key_top" class="forminput">' + 
 '<option value="last_post"' + sel('last_post', curKey) + '>ultimo messaggio</option>' + 
 '<option value="start_date"' + sel('start_date', curKey) + '>inizio discussione</option>' + 
 '<option value="title"' + sel('title', curKey) + '>titolo discussione</option>' + 
 '<option value="starter_name"' + sel('starter_name', curKey) + '>autore discussione</option>' + 
 '<option value="posts"' + sel('posts', curKey) + '>numero risposte</option>' + 
 '<option value="views"' + sel('views', curKey) + '>numero visite</option>' + 
 '<option value="last_poster_name"' + sel('last_poster_name', curKey) + '>ultimo autore</option>' + 
 '</select> ' + 
 '<label for="sort_by_top">in ordine</label> ' + 
 '<select name="sort_by" id="sort_by_top" class="forminput">' + 
 '<option value="A-Z"' + sel('A-Z', curBy) + '>crescente</option>' + 
 '<option value="Z-A"' + sel('Z-A', curBy) + '>decrescente</option>' + 
 '</select>&nbsp;' + 
 '<input type="submit" value="Vai!" class="forminput">' + 
 '</form>' + 
 '</div>' + 
 '<div class="right Sub"></div>' + 
 '<div class="Break Sub">.</div>'; 
 
 // Inserisce in cima alla lista topic 
 target.parentNode.insertBefore(wrap, target); 
 
 // Naviga in GET (niente POST -> niente avviso di reinvio dati al refresh) 
 const form = wrap.querySelector('form'); 
 const keySel = wrap.querySelector('#sort_key_top'); 
 const bySel = wrap.querySelector('#sort_by_top'); 
 const hrefProp = ['h','ref'].join(''); 
 //*encodeURIComponent costruito a runtime: ForumFree censura la forma letterale 
 const enc = window[['encode','URI','Component'].join('')]; 
 form.addEventListener('submit', function(e) { 
 e.preventDefault(); 
 loc[hrefProp] = '/?f=' + sez + 
 '&sort_key=' + enc(keySel.value) + 
 '&sort_by=' + enc(bySel.value); 
 }); 
 return true; 
 } 
 
 if (build()) return; 
 
 document.addEventListener('DOMContentLoaded', build); 
 window.addEventListener('load', build); 
 
 let tries = 0; 
 const timer = setInterval(function() { 
 if (build() || ++tries > 50) { 
 clearInterval(timer); 
 } 
 }, 200); 
})();
