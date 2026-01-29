// Caricamento a cascata nei Summary & Details 
document.addEventListener('DOMContentLoaded', function() { 
 document.querySelectorAll('details').forEach(detail => { 
 
 detail.addEventListener('toggle', () => { 
 if (detail.open) { 
 const content = detail.querySelectorAll('summary ~ *'); 
 
 content.forEach(el => { 
 const listItems = el.querySelectorAll('li'); 
 
 if (listItems.length > 0) { 
 // Mostra il contenitore della lista 
 el.style.opacity = '1'; 
 
 // Nascondi tutti i li inizialmente 
 listItems.forEach((li) => { 
 li.style.opacity = '0'; 
 }); 
 
 // Mostra ogni li con delay 
 listItems.forEach((li, index) => { 
 setTimeout(() => { 
 li.style.animation = 'sweep .5s ease-in-out forwards'; 
 }, index * 200); 
 }); 
 } else { 
 // Per elementi normali (p, div, etc), usa la classe animate 
 el.classList.remove('animate'); 
 void el.offsetWidth; 
 el.classList.add('animate'); 
 } 
 }); 
 } else { 
 // Reset quando chiudi 
 const content = detail.querySelectorAll('summary ~ *'); 
 content.forEach(el => { 
 el.classList.remove('animate'); 
 el.style.opacity = ''; 
 el.querySelectorAll('li').forEach(li => { 
 li.style.animation = ''; 
 li.style.opacity = ''; 
 }); 
 }); 
 } 
 }); 
 }); 
}); 

