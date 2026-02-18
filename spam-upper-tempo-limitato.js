// ========== SPAM LIMITATO - CORE SCRIPT ==========
// NON MODIFICARE QUESTO FILE - Tutte le configurazioni vanno in SPAM_LIMITED_CONFIG

(function() {
  if (!window.SPAM_LIMITED_CONFIG) {
    alert('ERRORE: Configurazione SPAM_LIMITED_CONFIG non trovata!');
    return;
  }
  
  var config = window.SPAM_LIMITED_CONFIG;
  var forums = config.forums;
  var spamMessage = config.spamMessage;
  var binId = config.binId;
  var apiKey = config.apiKey;
  var cooldownMinutes = config.cooldownMinutes;
  var rewardForum = config.rewardForum;
  var rewardMessageTemplate = config.rewardMessageTemplate;
  
  var header = document.getElementById('headerLimited');
  var content = document.getElementById('contentLimited');
  var grid = document.getElementById('forumGridLimited');
  var status = document.getElementById('statusLimited');
  var statusText = document.getElementById('statusTextLimited');
  var progressBar = document.getElementById('progressBarLimited');
  var submitBtn = document.getElementById('submitSelectedLimited');
  var stopBtn = document.getElementById('stopProcessLimited');
  var cooldownDisplay = document.getElementById('cooldownDisplayLimited');
  var lastUserDiv = document.getElementById('lastUserLimited');
  
  content.insertBefore(lastUserDiv, cooldownDisplay);
  
  var isRunning = false;
  var shouldStop = false;
  var countdownInterval = null;
  var XHR = window['XML' + 'Http' + 'Request'];
  
  header.addEventListener('click', function() {
    content.classList.toggle('expanded');
    header.textContent = content.classList.contains('expanded') ? 'SPAM Ogni 3 giorni - Clicca per comprimere' : 'SPAM Ogni 3 giorni - Clicca per espandere';
  });
  
  function checkSpamStatus(callback) {
    var xhr = new XHR();
    xhr.open('GET', 'https://api.jsonbin.io/v3/b/' + binId + '/latest', true);
    xhr.setRequestHeader('X-Master-Key', apiKey);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        callback(response.record);
      }
    };
    xhr.send();
  }
  
  function updateSpamStatus(data, callback) {
    var xhr = new XHR();
    xhr.open('PUT', 'https://api.jsonbin.io/v3/b/' + binId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Master-Key', apiKey);
    xhr.onload = function() {
      if (xhr.status === 200) {
        callback(true);
      } else {
        callback(false);
      }
    };
    xhr.send(JSON.stringify(data));
  }
  
  function getRemainingTime(lastSpamDate) {
    var now = new Date();
    var lastSpam = new Date(lastSpamDate);
    var cooldownMs = cooldownMinutes * 60 * 1000;
    var elapsed = now - lastSpam;
    var remaining = cooldownMs - elapsed;
    return remaining > 0 ? remaining : 0;
  }
  
  function formatTime(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    
    if (days > 0) {
      hours = hours % 24;
      minutes = minutes % 60;
      return days + 'd ' + hours + 'h ' + minutes + 'm';
    } else if (hours > 0) {
      minutes = minutes % 60;
      seconds = seconds % 60;
      return hours + 'h ' + minutes + 'm ' + seconds + 's';
    } else if (minutes > 0) {
      seconds = seconds % 60;
      return minutes + 'm ' + seconds + 's';
    } else {
      return seconds + 's';
    }
  }
  
  function updateCountdown(record) {
    if (record && record.spammedBy) {
      var date = record.lastSpam ? new Date(record.lastSpam).toLocaleString('it-IT') : 'in corso...';
      lastUserDiv.innerHTML = 'Ultimo spam: <strong>' + record.spammedBy + '</strong> il ' + date;
      lastUserDiv.style.display = 'block';
    }
    
    if (record && record.inProgress && !isRunning) {
      submitBtn.disabled = true;
      cooldownDisplay.style.display = 'block';
      cooldownDisplay.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Spam in corso</strong><br>' +
        '<strong>' + record.spammedBy + '</strong> sta gia effettuando lo spam. Attendi che finisca.';
      return;
    }
    
    if (!record || !record.lastSpam || !record.allCompleted) {
      cooldownDisplay.style.display = 'none';
      submitBtn.disabled = record && record.inProgress ? true : false;
      return;
    }
    
    var remaining = getRemainingTime(record.lastSpam);
    
    if (remaining > 0) {
      cooldownDisplay.style.display = 'block';
      var lastSpamDate = new Date(record.lastSpam).toLocaleString('it-IT');
      cooldownDisplay.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Spam bloccato</strong><br>' +
        'Ultimo spam effettuato da <strong>' + record.spammedBy + '</strong> il ' + lastSpamDate + '<br>' +
        'Tempo rimanente: <span style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--due') + '; font-size: 18px; font-weight: bold;">' + formatTime(remaining) + '</span>';
      submitBtn.disabled = true;
    } else {
      cooldownDisplay.style.display = 'none';
      submitBtn.disabled = false;
      
      var resetData = {
        lastSpam: null,
        spammedBy: null,
        completedForums: [],
        inProgress: false,
        allCompleted: false
      };
      updateSpamStatus(resetData, function() {
        updateUIBasedOnStatus(resetData);
      });
    }
  }
  
  function updateUIBasedOnStatus(record) {
    var completedForums = record && record.completedForums ? record.completedForums : [];
    
    var checkboxes = document.querySelectorAll('.forum-checkbox-limited');
    for (var i = 0; i < checkboxes.length; i++) {
      var forumIndex = parseInt(checkboxes[i].value);
      var isCompleted = completedForums.indexOf(forumIndex) !== -1;
      
      if (isCompleted) {
        checkboxes[i].disabled = true;
        checkboxes[i].checked = false;
        checkboxes[i].parentElement.parentElement.style.opacity = '0.5';
        checkboxes[i].parentElement.parentElement.style.pointerEvents = 'none';
      } else {
        checkboxes[i].disabled = false;
        checkboxes[i].parentElement.parentElement.style.opacity = '1';
        checkboxes[i].parentElement.parentElement.style.pointerEvents = 'auto';
      }
    }
  }
  
  function startCountdownLoop() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    checkSpamStatus(function(record) {
      updateCountdown(record);
      updateUIBasedOnStatus(record);
      
      countdownInterval = setInterval(function() {
        checkSpamStatus(function(record) {
          updateCountdown(record);
          updateUIBasedOnStatus(record);
        });
      }, 1000);
    });
  }
  
  for (var i = 0; i < forums.length; i++) {
    var forum = forums[i];
    var div = document.createElement('div');
    div.className = 'forum-item';
    div.id = 'forum-limited-' + i;
    div.innerHTML = '<label><input type="checkbox" value="' + i + '" class="forum-checkbox-limited">' + forum.name + '</label><span class="status-badge"></span>';
    grid.appendChild(div);
  }
  
  var checkboxes = document.querySelectorAll('.forum-checkbox-limited');
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
  
  document.getElementById('selectAllLimited').addEventListener('click', function() {
    if (isRunning) return;
    var cbs = document.querySelectorAll('.forum-checkbox-limited');
    for (var i = 0; i < cbs.length; i++) {
      if (!cbs[i].disabled) {
        cbs[i].checked = true;
        cbs[i].parentElement.parentElement.classList.add('checked');
      }
    }
  });
  
  document.getElementById('deselectAllLimited').addEventListener('click', function() {
    if (isRunning) return;
    var cbs = document.querySelectorAll('.forum-checkbox-limited');
    for (var i = 0; i < cbs.length; i++) {
      if (!cbs[i].disabled) {
        cbs[i].checked = false;
        cbs[i].parentElement.parentElement.classList.remove('checked');
      }
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
    checkSpamStatus(function(record) {
      if (record && record.inProgress) {
        alert('Spam in corso!\n\n' + record.spammedBy + ' sta gia effettuando lo spam. Attendi che finisca.');
        return;
      }
      
      if (record && record.lastSpam && record.allCompleted) {
        var remaining = getRemainingTime(record.lastSpam);
        if (remaining > 0) {
          var lastSpamDate = new Date(record.lastSpam).toLocaleString('it-IT');
          alert('Spam bloccato!\n\n' + record.spammedBy + ' ha gia spammato il ' + lastSpamDate + '.\n\nTempo rimanente: ' + formatTime(remaining));
          return;
        }
      }
      
      var username = prompt('Inserisci il tuo username:');
      if (!username || username.trim() === '') {
        alert('Username richiesto per continuare');
        return;
      }
      username = username.trim();
      
      var selected = [];
      var cbs = document.querySelectorAll('.forum-checkbox-limited:checked');
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
      
      var completedForums = record && record.completedForums ? record.completedForums : [];
      
      var progressData = {
        lastSpam: null,
        spammedBy: username,
        completedForums: completedForums,
        inProgress: true,
        allCompleted: false
      };
      
      updateSpamStatus(progressData, function(success) {
        if (!success) {
          alert('Errore nel registrare lo spam. Riprova.');
          return;
        }
        
        startCountdownLoop();
        
        isRunning = true;
        shouldStop = false;
        submitBtn.disabled = true;
        stopBtn.classList.add('show');
        status.classList.add('show');
        
        var allCbs = document.querySelectorAll('.forum-checkbox-limited');
        for (var i = 0; i < allCbs.length; i++) {
          allCbs[i].disabled = true;
        }
        
        var items = document.querySelectorAll('#forumGridLimited .forum-item');
        for (var i = 0; i < items.length; i++) {
          items[i].classList.remove('processing', 'done');
          items[i].querySelector('.status-badge').textContent = '';
        }
        
        var currentIndex = 0;
        var hadError = false;
        
        function processNext() {
          var allForumsCompleted = true;
          for (var j = 0; j < forums.length; j++) {
            if (completedForums.indexOf(j) === -1) {
              allForumsCompleted = false;
              break;
            }
          }
          
          if (currentIndex >= selected.length || shouldStop) {
            if (!shouldStop && !hadError && allForumsCompleted) {
              var finalData = {
                lastSpam: new Date().toISOString(),
                spammedBy: username,
                completedForums: completedForums,
                inProgress: false,
                allCompleted: true
              };
              
              updateSpamStatus(finalData, function(success) {
                if (success) {
                  progressBar.style.width = '100%';
                  progressBar.textContent = '100%';
                  statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sette') + ';">Completato! Attendere 20 secondi per pubblicazione ricompensa...</strong>';
                  
                  setTimeout(function() {
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
                    startCountdownLoop();
                  }, 20000);
                }
              });
            } else {
              var incompleteData = {
                lastSpam: null,
                spammedBy: username,
                completedForums: completedForums,
                inProgress: false,
                allCompleted: false
              };
              
              updateSpamStatus(incompleteData, function() {
                if (hadError) {
                  statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Processo interrotto per errore. Alcuni forum non sono stati uppati.</strong>';
                } else {
                  statusText.innerHTML = '<strong style="color: ' + getComputedStyle(document.documentElement).getPropertyValue('--sei') + ';">Processo interrotto. Alcuni forum non sono stati uppati.</strong>';
                }
                startCountdownLoop();
              });
            }
            
            isRunning = false;
            stopBtn.classList.remove('show');
            return;
          }
          
          var forumIndex = selected[currentIndex];
          var forum = forums[forumIndex];
          var forumElement = document.getElementById('forum-limited-' + forumIndex);
          var progress = Math.round(((currentIndex + 1) / selected.length) * 100);
          
          forumElement.classList.add('processing');
          forumElement.querySelector('.status-badge').textContent = '';
          
          progressBar.style.width = progress + '%';
          progressBar.textContent = progress + '%';
          statusText.innerHTML = '<strong>Uppando ' + forum.name + '...</strong> (' + (currentIndex + 1) + '/' + selected.length + ')';
          
          var opened = submitToForum(forum);
          
          if (!opened) {
            hadError = true;
            alert('Popup bloccato! Autorizza i popup e riprova.');
            shouldStop = true;
            processNext();
            return;
          }
          
          if (completedForums.indexOf(forumIndex) === -1) {
            completedForums.push(forumIndex);
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
    });
  });
  
  startCountdownLoop();
})();
