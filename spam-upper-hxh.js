// spam-upper.js
(function(config) {
  var forums = config.forums;
  var spamMessage = config.spamMessage;
  
  var grid = document.getElementById('forumGrid'); 
  var status = document.getElementById('status'); 
  var statusText = document.getElementById('statusText'); 
  var progressBar = document.getElementById('progressBar'); 
  var submitBtn = document.getElementById('submitSelected'); 
  var stopBtn = document.getElementById('stopProcess'); 
  
  var isRunning = false; 
  var shouldStop = false; 
  
  // Crea la griglia dei forum 
  for (var i = 0; i < forums.length; i++) { 
    var forum = forums[i]; 
    var div = document.createElement('div'); 
    div.className = 'forum-item'; 
    div.id = 'forum-' + i; 
    div.innerHTML = '<label><input type="checkbox" value="' + i + '" class="forum-checkbox">' + forum.name + '</label><span class="status-badge"></span>'; 
    grid.appendChild(div); 
  } 
  
  // Gestione checkbox visuale 
  var checkboxes = document.querySelectorAll('.forum-checkbox'); 
  for (var i = 0; i < checkboxes.length; i++) { 
    checkboxes[i].addEventListener('change', function() { 
      var item = this.parentElement.parentElement; 
      if (this.checked) { 
        item.classList.add('checked'); 
      } else { 
        item.classList.remove('checked'); 
      } 
    }); 
  } 
  
  // Seleziona tutti 
  document.getElementById('selectAll').addEventListener('click', function() { 
    if (isRunning) return; 
    var cbs = document.querySelectorAll('.forum-checkbox'); 
    for (var i = 0; i < cbs.length; i++) { 
      cbs[i].checked = true; 
      cbs[i].parentElement.parentElement.classList.add('checked'); 
    } 
  }); 
  
  // Deseleziona tutti 
  document.getElementById('deselectAll').addEventListener('click', function() { 
    if (isRunning) return; 
    var cbs = document.querySelectorAll('.forum-checkbox'); 
    for (var i = 0; i < cbs.length; i++) { 
      cbs[i].checked = false; 
      cbs[i].parentElement.parentElement.classList.remove('checked'); 
    } 
  }); 
  
  // Funzione per creare e inviare il form 
  function submitToForum(forum) { 
    var formHtml = '<!DOCTYPE html><body>'; 
    formHtml += '<h3>Uppando ' + forum.name + '...</h3>'; 
    formHtml += '<form id="upForm" method="post" action="' + forum.url + '">'; 
    formHtml += '<input type="hidden" name="st" value="0">'; 
    formHtml += '<input type="hidden" name="act" value="Post">'; 
    formHtml += '<input type="hidden" name="f" value="' + forum.f + '">'; 
    formHtml += '<input type="hidden" name="CODE" value="03">'; 
    formHtml += '<input type="hidden" name="t" value="' + forum.t + '">'; 
    formHtml += '<input type="hidden" name="Post" value="' + spamMessage.replace(/"/g, '&quot;') + '">'; 
    formHtml += '<input type="submit" id="btnSubmit" value="Invia" style="padding:10px 20px; font-size:16px;">'; 
    formHtml += '</form>'; 
    formHtml += '<script type="text/javascript">'; 
    formHtml += 'setTimeout(function() {'; 
    formHtml += '  var btn = document.getElementById("btnSubmit");'; 
    formHtml += '  if (btn) {'; 
    formHtml += '    var clickEvent = document.createEvent("MouseEvents");'; 
    formHtml += '    clickEvent.initEvent("click", true, true);'; 
    formHtml += '    btn.dispatchEvent(clickEvent);'; 
    formHtml += '  }'; 
    formHtml += '}, 500);'; 
    formHtml += '<\/script></body>'; 
    
    var windowName = 'forum' + Math.random().toString(36).substring(7); 
    var newWindow = window.open('', windowName, 'width=800,height=600'); 
    if (newWindow) { 
      newWindow.document.write(formHtml); 
      newWindow.document.close(); 
      return true; 
    } 
    return false; 
  } 
  
  // Ferma il processo 
  stopBtn.addEventListener('click', function() { 
    shouldStop = true; 
    statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Interruzione in corso...</strong>'; 
  }); 
  
  // Submit selezionati 
  submitBtn.addEventListener('click', function() { 
    var selected = []; 
    var cbs = document.querySelectorAll('.forum-checkbox:checked'); 
    for (var i = 0; i < cbs.length; i++) { 
      selected.push(parseInt(cbs[i].value)); 
    } 
    
    if (selected.length === 0) { 
      alert('Seleziona almeno un forum!'); 
      return; 
    } 
    
    if (!confirm('Vuoi uppare ' + selected.length + ' forum?\n\nVerranno aperte ' + selected.length + ' nuove finestre con un intervallo di 20 secondi.\n\nAssicurati di aver autorizzato i popup!')) { 
      return; 
    } 
    
    isRunning = true; 
    shouldStop = false; 
    submitBtn.disabled = true; 
    stopBtn.classList.add('show'); 
    status.classList.add('show'); 
    
    var allCbs = document.querySelectorAll('.forum-checkbox'); 
    for (var i = 0; i < allCbs.length; i++) { 
      allCbs[i].disabled = true; 
    } 
    
    var items = document.querySelectorAll('.forum-item'); 
    for (var i = 0; i < items.length; i++) { 
      items[i].classList.remove('processing', 'done'); 
      items[i].querySelector('.status-badge').textContent = ''; 
    } 
    
    var currentIndex = 0; 
    
    function processNext() { 
      if (currentIndex >= selected.length || shouldStop) { 
        if (!shouldStop) { 
          progressBar.style.width = '100%'; 
          progressBar.textContent = '100%'; 
          statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sette') + ';">Completato! Tutti i forum selezionati sono stati uppati.</strong><br><small>Puoi chiudere le finestre aperte.</small>'; 
        } else { 
          statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Processo interrotto dall\'utente.</strong>'; 
        } 
        
        isRunning = false; 
        submitBtn.disabled = false; 
        stopBtn.classList.remove('show'); 
        var allCbs = document.querySelectorAll('.forum-checkbox'); 
        for (var i = 0; i < allCbs.length; i++) { 
          allCbs[i].disabled = false; 
        } 
        return; 
      } 
      
      var forumIndex = selected[currentIndex]; 
      var forum = forums[forumIndex]; 
      var forumElement = document.getElementById('forum-' + forumIndex); 
      var progress = Math.round(((currentIndex + 1) / selected.length) * 100); 
      
      forumElement.classList.add('processing'); 
      forumElement.querySelector('.status-badge').textContent = ''; 
      
      progressBar.style.width = progress + '%'; 
      progressBar.textContent = progress + '%'; 
      statusText.innerHTML = '<strong>Uppando ' + forum.name + '...</strong> (' + (currentIndex + 1) + '/' + selected.length + ')'; 
      
      var opened = submitToForum(forum); 
      
      if (!opened) { 
        alert('Popup bloccato! Autorizza i popup e riprova.'); 
        shouldStop = true; 
        processNext(); 
        return; 
      } 
      
      setTimeout(function() { 
        forumElement.classList.remove('processing'); 
        forumElement.classList.add('done'); 
        forumElement.querySelector('.status-badge').textContent = ''; 
      }, 500); 
      
      currentIndex++; 
      
      if (currentIndex < selected.length && !shouldStop) { 
        var countdown = 20; 
        var countInterval = setInterval(function() { 
          if (shouldStop) { 
            clearInterval(countInterval); 
            processNext(); 
            return; 
          } 
          statusText.innerHTML = '<strong>Uppato ' + forum.name + '!</strong><br>Prossimo forum tra <span style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--due') + '; font-size: 18px;">' + countdown + '</span> secondi...'; 
          countdown--; 
          if (countdown < 0) { 
            clearInterval(countInterval); 
            processNext(); 
          } 
        }, 1000); 
      } else { 
        processNext(); 
      } 
    } 
    
    processNext(); 
  }); 
})(window.SPAM_CONFIG);
