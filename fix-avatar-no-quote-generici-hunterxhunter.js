// Fix Per gli Avatar nelle Citazioni 
(function() { 
 setTimeout(function() { 
 const defaultAvatar = "https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png"; 
 
 // NON rimuovere gli avatar esistenti se sono già corretti 
 // Rimuovi solo quelli con immagini rotte o generiche 
 document.querySelectorAll('.quoteentry').forEach(el => { 
 const img = el.querySelector('img'); 
 // Rimuovi solo se l'immagine è quella di default o è rotta 
 if (img && (img.src.includes('default_avatar') || img.src.includes('RDGkT8W'))) { 
 el.remove(); 
 } 
 }); 
 
 const styleId = 'ffav-quote-fix-styles'; 
 if (!document.getElementById(styleId)) { 
 const style = document.createElement('style'); 
 style.id = styleId; 
 style.textContent = ` 
 #ffav_quote { 
 padding-left: 83px !important; 
 padding-bottom: 5px !important; 
 } 
 #ffav_quote .quote {padding-left: 83px; min-height: 85px} 
 #ffav_quote.quote {padding-left: 83px; min-height: 85px} 
 .quote#ffav_quote {padding-left: 83px; min-height: 85px} 
 .quoteentry img { 
 width: 60px; 
 box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1); 
 height: 60px; 
 float: left; 
 margin-top: 10px; 
 margin-left: 30px; 
 padding: 1px; 
 border: 1px solid #D5D5D5; 
 background: #FFF; 
 } 
 `; 
 document.head.appendChild(style); 
 } 
 
 const quoteTops = document.querySelectorAll('.quote_top'); 
 
 quoteTops.forEach((quoteTop) => { 
 // CONTROLLA se esiste già un avatar corretto 
 const existingAvatar = quoteTop.nextElementSibling; 
 if (existingAvatar && existingAvatar.classList.contains('quoteentry')) { 
 const existingImg = existingAvatar.querySelector('img'); 
 // Se l'avatar esiste ed è valido (non default e non rotto), SALTALO 
 if (existingImg && !existingImg.src.includes('default_avatar') && !existingImg.src.includes('RDGkT8W')) { 
 return; // Skip questo quote, l'avatar è già corretto 
 } 
 } 
 
 const quoteLink = quoteTop.querySelector('a[href*="#entry"]'); 
 
 // Se non c'è un link a un entry, è un quote esterno 
 if (!quoteLink) { 
 // Rimuovi avatar esistente se presente 
 const existingAvatar = quoteTop.nextElementSibling; 
 if (existingAvatar && existingAvatar.classList.contains('quoteentry')) { 
 existingAvatar.remove(); 
 } 
 
 // Il .quote è il nextElementSibling dopo aver rimosso eventuali avatar 
 // Oppure è già il nextElementSibling se non c'erano avatar 
 let quote = quoteTop.nextElementSibling; 
 // Se abbiamo appena rimosso un avatar, il quote è ora il nextElementSibling 
 if (quote && quote.classList.contains('quote')) { 
 quote.id = 'quote_generico'; 
 } 
 
 return; // Skip questo quote 
 } 
 
 // Per i quote interni, cerca il .quote 
 let quote = quoteTop.nextElementSibling; 
 // Salta eventuali .quoteentry 
 while (quote && quote.classList.contains('quoteentry')) { 
 quote = quote.nextElementSibling; 
 } 
 
 if (quote && quote.classList.contains('quote')) { 
 quote.id = 'ffav_quote'; 
 } 
 
 let avatarUrl = defaultAvatar; 
 const href = quoteLink.getAttribute('href'); 
 const entryMatch = href.match(/#entry(\d+)/); 
 
 if (entryMatch) { 
 const entryNumber = entryMatch[1]; 
 const fullEntryId = 'ee' + entryNumber; 
 const targetPost = document.getElementById(fullEntryId); 
 
 if (targetPost) { 
 // PRIORITÀ: cerca prima in .post .avatar img 
 let avatarImg = targetPost.querySelector('.post .avatar img'); 
 
 // Fallback agli altri selettori 
 if (!avatarImg) { 
 avatarImg = targetPost.querySelector('.details .avatar img'); 
 } 
 
 if (!avatarImg) { 
 avatarImg = targetPost.querySelector('.details img[alt="Avatar"]'); 
 } 
 
 if (!avatarImg) { 
 avatarImg = targetPost.querySelector('.post .details img'); 
 } 
 
 if (avatarImg && avatarImg.src) { 
 avatarUrl = avatarImg.src; 
 } 
 } 
 } 
 
 const avatarDiv = document.createElement('div'); 
 avatarDiv.className = 'quoteentry'; 
 
 const img = document.createElement('img'); 
 img.src = avatarUrl; 
 img.alt = 'Avatar'; 
 img.onerror = function() { 
 this.src = defaultAvatar; 
 }; 
 
 avatarDiv.appendChild(img); 
 quoteTop.insertAdjacentElement('afterend', avatarDiv); 
 }); 
 
 // CLEANUP FINALE - esegui DOPO che lo script originale ha finito 
 setTimeout(function() { 
 document.querySelectorAll('.quote_top').forEach(function(quoteTop) { 
 const quoteLink = quoteTop.querySelector('a[href*="#entry"]'); 
 if (!quoteLink) { 
 // Per i quote esterni usa nextElementSibling 
 let quote = quoteTop.nextElementSibling; 
 // Salta eventuali .quoteentry che potrebbero essere rimasti 
 while (quote && quote.classList.contains('quoteentry')) { 
 quote = quote.nextElementSibling; 
 } 
 if (quote && quote.classList.contains('quote')) { 
 quote.id = 'quote_generico'; 
 } 
 } 
 }); 
 }, 800); 
 
 }, 500); 
})();
