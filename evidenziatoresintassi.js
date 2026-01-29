
// Syntax Highlighting personalizzato 
(function() { 
 function applySyntaxColors() { 
 document.querySelectorAll('.code span[style*="rgb(0, 51, 204)"], .code span[style*="#03C"]').forEach(el => { 
 el.style.setProperty('color', 'var(--tag)', 'important'); 
 }); 
 document.querySelectorAll('.code span[style*="rgb(0, 51, 153)"], .code span[style*="#039"]').forEach(el => { 
 el.style.setProperty('color', 'var(--attributi)', 'important'); 
 }); 
 document.querySelectorAll('.code span[style*="rgb(0, 102, 0)"], .code span[style*="#060"]').forEach(el => { 
 el.style.setProperty('color', 'var(--stringhe)', 'important'); 
 el.style.setProperty('font-style', 'italic', 'important'); 
 }); 
 } 
 if (document.readyState === 'loading') { 
 document.addEventListener('DOMContentLoaded', applySyntaxColors); 
 } else { 
 applySyntaxColors(); 
 } 
 // piccolo delay per essere sicuri che abbia finito 
 setTimeout(applySyntaxColors, 1); 
} 
)(); 
