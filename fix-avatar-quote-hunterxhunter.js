
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
 padding-left: 83px !important; padding-bottom: 5px !important; 
 
 } 
 .quote {padding-left: 83px; min-height: 85px} 
 .quoteentry img { 
 width: 60px; 
 box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1); 
 height: 60px; 
 float: left ; 
 margin-top: 10px ; 
 margin-left: 30px ; 
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
 
 const quote = quoteTop.closest('.quote'); 
 if (quote) { 
 quote.classList.add('ffav_quote'); 
 } 
 
 const quoteLink = quoteTop.querySelector('a[href*="#entry"]'); 
 let avatarUrl = defaultAvatar; 
 
 if (quoteLink) { 
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
 }, 1000); 
})();
