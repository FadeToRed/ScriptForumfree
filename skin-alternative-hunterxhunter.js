// Aspetta che il DOM sia caricato 
document.addEventListener('DOMContentLoaded', function() { 
 var menu = document.querySelector('.menuwrap .right'); 
 
 if (!menu) return; // Se non trova il menu, esce 
 
 // Se skinAttive = 0, forza la skin base e rimuovi la preferenza salvata 
 if (skinAttive === 0) { 
 def(); 
 localStorage.setItem('skin', 'def'); 
 return; // Non creare nessun pulsante 
 } 
 
 if (skinAttive === 1) { 
 // Mostra Base + Halloween 
 var baseBtn = document.createElement('span'); 
 baseBtn.className = 'skin-switcher skin-base'; 
 baseBtn.onclick = function() { def(); localStorage.setItem('skin','def'); }; 
 
 var halloweenBtn = document.createElement('span'); 
 halloweenBtn.className = 'skin-switcher skin-halloween'; 
 halloweenBtn.onclick = function() { halloween(); localStorage.setItem('skin','halloween'); }; 
 
 menu.appendChild(baseBtn); 
 menu.appendChild(halloweenBtn); 
 
 } else if (skinAttive === 2) { 
 // Mostra Base + Natale 
 var baseBtn = document.createElement('span'); 
 baseBtn.className = 'skin-switcher skin-base'; 
 baseBtn.onclick = function() { def(); localStorage.setItem('skin','def'); }; 
 
 var nataleBtn = document.createElement('span'); 
 nataleBtn.className = 'skin-switcher skin-natale'; 
 nataleBtn.onclick = function() { natale(); localStorage.setItem('skin','natale'); }; 
 
 menu.appendChild(baseBtn); 
 menu.appendChild(nataleBtn); 
 
 } else if (skinAttive === 3) { 
 // Mostra TUTTI i pulsanti (DEBUG MODE) 
 var baseBtn = document.createElement('span'); 
 baseBtn.className = 'skin-switcher skin-base'; 
 baseBtn.onclick = function() { def(); localStorage.setItem('skin','def'); }; 
 
 var halloweenBtn = document.createElement('span'); 
 halloweenBtn.className = 'skin-switcher skin-halloween'; 
 halloweenBtn.onclick = function() { halloween(); localStorage.setItem('skin','halloween'); }; 
 
 var nataleBtn = document.createElement('span'); 
 nataleBtn.className = 'skin-switcher skin-natale'; 
 nataleBtn.onclick = function() { natale(); localStorage.setItem('skin','natale'); }; 
 
 menu.appendChild(baseBtn); 
 menu.appendChild(halloweenBtn); 
 menu.appendChild(nataleBtn); 
 } 
}); 

 
//CARICAMENTO SKIN INIZIALE

function def() { 
 document.body.classList.remove('bodynatale', 'bodyhalloween'); 
 document.body.classList.add('bodydef'); 
} 
function natale() { 
 document.body.classList.remove('bodydef', 'bodyhalloween'); 
 document.body.classList.add('bodynatale'); 
} 
function halloween() { 
 document.body.classList.remove('bodydef', 'bodynatale'); 
 document.body.classList.add('bodyhalloween'); 
} 
 
if (localStorage.getItem('skin') === null) { 
 localStorage.setItem('skin','def'); 
} 
else if (localStorage.getItem('skin') === 'def') { 
 def(); 
} 
else if(localStorage.getItem('skin') == "natale") { 
 natale(); 
} 
else if(localStorage.getItem('skin') == "halloween") { 
 halloween(); 
} 
