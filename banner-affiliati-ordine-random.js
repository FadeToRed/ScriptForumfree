window.onload = function() { 
 
 function randomizzaBanner(containerId) { 
 var container = document.getElementById(containerId); 
 if (!container) return; 
 
 var links = container.querySelectorAll('a'); 
 var linksArray = []; 
 
 for (var i = 0; i < links.length; i++) { 
 linksArray[i] = links.item(i).cloneNode(true); 
 } 
 
 // Fisher-Yates shuffle 
 for (var i = linksArray.length - 1; i > 0; i--) { 
 var j = Math.floor(Math.random() * (i + 1)); 
 var temp = linksArray[i]; 
 linksArray[i] = linksArray[j]; 
 linksArray[j] = temp; 
 } 
 
 container.innerHTML = ''; 
 for (var i = 0; i < linksArray.length; i++) { 
 container.appendChild(linksArray[i]); 
 } 
 } 
 
 randomizzaBanner('affiliati-container'); 
 randomizzaBanner('gemellati-container'); 
 
}; 
