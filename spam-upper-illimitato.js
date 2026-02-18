// ========== SPAM ILLIMITATO - CORE SCRIPT ==========
// NON MODIFICARE QUESTO FILE - Tutte le configurazioni vanno in SPAM_UNLIMITED_CONFIG

(function() {
  if (!window.SPAM_UNLIMITED_CONFIG) {
    alert('ERRORE: Configurazione SPAM_UNLIMITED_CONFIG non trovata!');
    return;
  }
  
  var config = window.SPAM_UNLIMITED_CONFIG;
  var forums = config.forums;
  var spamMessage = config.spamMessage;
  var binId = config.binId;
  var apiKey = config.apiKey;
  var rewardForum = config.rewardForum;
  var rewardMessageTemplate = config.rewardMessageTemplate;
  
  var header = document.getElementById('headerUnlimited');
  var content = document.getElementById('contentUnlimited');
  var grid = document.getElementById('forumGridUnlimited');
  var status = document.getElementById('statusUnlimited');
  var statusText = document.getElementById('statusTextUnlimited');
  var progressBar = document.getElementById('progressBarUnlimited');
  var submitBtn = document.getElementById('submitSelectedUnlimited');
  var stopBtn = document.getElementById('stopProcessUnlimited');
  var lastUserDiv = document.getElementById('lastUserUnlimited');
  
  content.appendChild(lastUserDiv);
  
  var isRunning = false;
  var shouldStop = false;
  var XHR = window['XML' + 'Http' + 'Request'];
  
  header.addEventListener('click', function() {
    content.classList.toggle('expanded');
    header.textContent = content.classList.contains('expanded') ? 'SPAM ILLIMITATO - Clicca per comprimere' : 'SPAM ILLIMITATO - Clicca per espandere';
  });
  
  function checkLastSpam() {
    var xhr = new XHR();
    xhr.open('GET', 'https://api.jsonbin.io/v3/b/' + binId + '/latest', true);
    xhr.setRequestHeader('X-Master-Key', apiKey);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        var record = response.record;
        if (record && record.lastSpam && record.spammedBy) {
          var date = new Date(record.lastSpam).toLocaleString('it-IT');
          lastUserDiv.innerHTML = 'Ultimo spam: <strong>' + record.spammedBy + '</strong> il ' + date;
          lastUserDiv.style.display = 'block';
        }
      }
    };
    xhr.send();
  }
  
  function updateLastSpam(username) {
    var data = {
      lastSpam: new Date().toISOString(),
      spammedBy: username
    };
    var xhr = new XHR();
    xhr.open('PUT', 'https://api.jsonbin.io/v3/b/' + binId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Master-Key', apiKey);
    xhr.send(JSON.stringify(data));
  }
  
  for (var i = 0; i < forums.length; i++) {
    var forum = forums[i];
    var div = document.createElement('div');
    div.className = 'forum-item';
    div.id = 'forum-unlimited-' + i;
    div.innerHTML = '<label><input type="checkbox" value="' + i + '" class="forum-checkbox-unlimited">' + forum.name + '</label><span class="status-badge"></span>';
    grid.appendChild(div);
  }
  
  var checkboxes = document.querySelectorAll('.forum-checkbox-unlimited');
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
  
  document.getElementById('selectAllUnlimited').addEventListener('click', function() {
    if (isRunning) return;
    var cbs = document.querySelectorAll('.forum-checkbox-unlimited');
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = true;
      cbs[i].parentElement.parentElement.classList.add('checked');
    }
  });
  
  document.getElementById('deselectAllUnlimited').addEventListener('click', function() {
    if (isRunning) return;
    var cbs = document.querySelectorAll('.forum-checkbox-unlimited');
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].checked = false;
      cbs[i].parentElement.parentElement.classList.remove('checked');
    }
  });
  
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
  
  stopBtn.addEventListener('click', function() {
    shouldStop = true;
    statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Interruzione in corso...</strong>';
  });
  
  submitBtn.addEventListener('click', function() {
    var username = prompt('Inserisci il tuo username:');
    if (!username || username.trim() === '') {
      alert('Username richiesto per continuare');
      return;
    }
    username = username.trim();
    
    var selected = [];
    var cbs = document.querySelectorAll('.forum-checkbox-unlimited:checked');
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
    
    var allCbs = document.querySelectorAll('.forum-checkbox-unlimited');
    for (var i = 0; i < allCbs.length; i++) {
      allCbs[i].disabled = true;
    }
    
    var items = document.querySelectorAll('#forumGridUnlimited .forum-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('processing', 'done');
      items[i].querySelector('.status-badge').textContent = '';
    }
    
    var currentIndex = 0;
    var completedForums = [];
    
    function processNext() {
      if (currentIndex >= selected.length || shouldStop) {
        if (!shouldStop && completedForums.length === selected.length) {
          progressBar.style.width = '100%';
          progressBar.textContent = '100%';
          statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sette') + ';">Completato! Attendere 20 secondi per pubblicazione ricompensa...</strong>';
          
          updateLastSpam(username);
          
          setTimeout(function() {
            checkLastSpam();
            
            var forumList = '';
            for (var j = 0; j < completedForums.length; j++) {
              forumList += '<b>' + forums[completedForums[j]].name + '</b>';
              if (j < completedForums.length - 1) forumList += ', ';
            }
            
            var rewardMessage = rewardMessageTemplate.replace('{forumList}', forumList);
            var rewardFormHtml = '<!DOCTYPE html><body>';
            rewardFormHtml += '<form id="rewardForm" method="post" action="' + rewardForum.url + '">';
            rewardFormHtml += '<input type="hidden" name="st" value="0">';
            rewardFormHtml += '<input type="hidden" name="act" value="Post">';
            rewardFormHtml += '<input type="hidden" name="f" value="' + rewardForum.f + '">';
            rewardFormHtml += '<input type="hidden" name="CODE" value="03">';
            rewardFormHtml += '<input type="hidden" name="t" value="' + rewardForum.t + '">';
            rewardFormHtml += '<input type="hidden" name="Post" value="' + rewardMessage.replace(/"/g, '&quot;') + '">';
            rewardFormHtml += '<input type="submit" id="btnReward" value="Invia">';
            rewardFormHtml += '</form>';
            rewardFormHtml += '<script type="text/javascript">';
            rewardFormHtml += 'setTimeout(function() {';
            rewardFormHtml += '  var btn = document.getElementById("btnReward");';
            rewardFormHtml += '  if (btn) {';
            rewardFormHtml += '    var clickEvent = document.createEvent("MouseEvents");';
            rewardFormHtml += '    clickEvent.initEvent("click", true, true);';
            rewardFormHtml += '    btn.dispatchEvent(clickEvent);';
            rewardFormHtml += '  }';
            rewardFormHtml += '}, 500);';
            rewardFormHtml += '<\/script></body>';
            
            var rewardWindow = window.open('', 'reward' + Math.random().toString(36).substring(7), 'width=800,height=600');
            if (rewardWindow) {
              rewardWindow.document.write(rewardFormHtml);
              rewardWindow.document.close();
            }
            
            statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sette') + ';">Completato! Ricompensa pubblicata.</strong><br><small>Puoi chiudere le finestre aperte.</small>';
          }, 20000);
        } else {
          statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Processo interrotto.</strong>';
        }
        
        isRunning = false;
        submitBtn.disabled = false;
        stopBtn.classList.remove('show');
        var allCbs = document.querySelectorAll('.forum-checkbox-unlimited');
        for (var i = 0; i < allCbs.length; i++) {
          allCbs[i].disabled = false;
        }
        return;
      }
      
      var forumIndex = selected[currentIndex];
      var forum = forums[forumIndex];
      var forumElement = document.getElementById('forum-unlimited-' + forumIndex);
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
      
      completedForums.push(forumIndex);
      
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
  
  checkLastSpam();
})();
