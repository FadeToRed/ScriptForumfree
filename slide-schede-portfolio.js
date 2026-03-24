function animaBarre(slide) { 
 slide.querySelectorAll('.barra-pg').forEach(function(barra) { 
 var target = barra.style.width; 
 barra.style.transition = 'none'; 
 barra.style.width = '0%'; 
 requestAnimationFrame(function() { 
 requestAnimationFrame(function() { 
 barra.style.transition = 'width 2s ease'; 
 barra.style.width = target; 
 }); 
 }); 
 }); 
} 
 
function mostraSlide(button, indice) { 
 var schedaContainer = button.closest('.scheda-pg-container'); 
 
 schedaContainer.querySelectorAll('.bottone-nav').forEach(function(b) { 
 b.classList.remove('attivo'); 
 }); 
 button.classList.add('attivo'); 
 
 var slides = schedaContainer.querySelectorAll('.slide-pg'); 
 for (var i = 0; i < slides.length; i++) { 
 slides[i].style.display = 'none'; 
 } 
 slides[indice].style.display = 'block'; 
 
 animaBarre(slides[indice]); 
} 
 
window.addEventListener('DOMContentLoaded', function() { 
 var tutteLeSchede = document.querySelectorAll('.scheda-pg-container'); 
 tutteLeSchede.forEach(function(scheda) { 
 var slides = scheda.querySelectorAll('.slide-pg'); 
 for (var i = 1; i < slides.length; i++) { 
 slides[i].style.display = 'none'; 
 } 
 var primoBottone = scheda.querySelector('.bottone-nav'); 
 if (primoBottone) primoBottone.classList.add('attivo'); 
 
 animaBarre(slides[0]); 
 }); 
}); 

function animaBarrePortfolio(slide) {
  slide.querySelectorAll('.portfolio-bc-fill').forEach(function(barra) {
    var target = barra.style.width;
    barra.style.transition = 'none';
    barra.style.width = '0%';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        barra.style.transition = 'width 2s ease';
        barra.style.width = target;
      });
    });
  });
}

function portfolioSlide(button, indice) {
  var container = button.closest('.portfolio-container');
  container.querySelectorAll('.portfolio-bottone').forEach(b => b.classList.remove('attivo'));
  button.classList.add('attivo');
  container.querySelectorAll('.portfolio-slide').forEach((s, i) => {
    s.style.display = i === indice ? 'block' : 'none';
  });
  animaBarrePortfolio(container.querySelectorAll('.portfolio-slide')[indice]);
}

window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.portfolio-container').forEach(function(c) {
    c.querySelectorAll('.portfolio-slide').forEach((s, i) => {
      s.style.display = i === 0 ? 'block' : 'none';
    });
    var primo = c.querySelector('.portfolio-bottone');
    if (primo) primo.classList.add('attivo');
    animaBarrePortfolio(c.querySelectorAll('.portfolio-slide')[0]);
  });
});
