;(function() { 
 'use strict'; 
 
 if (!window.HxHFramework) { console.warn('[StaffTasks] HxHFramework non trovato!'); return; } 
 
 var F = window.HxHFramework; 
 
 // Attende che sia StaffTasksConfig che la master key siano disponibili 
 F.utilities.waitFor( 
 function() { return window.StaffTasksConfig && F.constants.JSONBIN_MASTER_KEY !== null; }, 
 function() { 
 
 var SETTINGS = { 
 binId: window.StaffTasksConfig.binId, 
 tabId: window.StaffTasksConfig.tabId || 1013, 
 tabName: window.StaffTasksConfig.tabName || 'Task Staff' 
 }; 
 
 // Chiave API dal framework (iniettata da hxh-keys.js) 
 var API_KEY = F.constants.JSONBIN_MASTER_KEY; 
 var API_URL = 'https://api.jsonbin.io/v3/b/' + SETTINGS.binId; 
 
 if (!SETTINGS.binId || !API_KEY) { 
 console.warn('[StaffTasks] binId o JSONBIN_MASTER_KEY mancanti!'); 
 return; 
 } 
 
 // Solo staff può vedere e usare il tab 
 if (!F.groups.isStaff() && !F.groups.isAdmin()) return; 
 
 // Il profilo visitato deve essere staff 
 function isProfileStaff() { 
 var profileContainer = document.querySelector('div[class*="box_"]'); 
 if (!profileContainer) return false; 
 var cls = profileContainer.className; 
 return cls.indexOf('box_amministratore') !== -1 || 
 cls.indexOf('box_founder') !== -1 || 
 cls.indexOf('box_globalmod') !== -1 || 
 cls.indexOf('box_gruppo1') !== -1 || 
 cls.indexOf('box_gruppo2') !== -1 || 
 cls.indexOf('box_gruppo3') !== -1 || 
 cls.indexOf('box_gruppo4') !== -1; 
 } 
 
 if (!isProfileStaff()) return; 
 
 // ----------------------------------------------- 
 // CLASSE PRINCIPALE 
 // ----------------------------------------------- 
 
 class StaffTasksTab { 
 
 constructor() { 
 this.currentUserId = null; 
 this.currentUserName = Commons.user.nickname || 'Sconosciuto'; 
 this.tasks = []; 
 this.init(); 
 } 
 
 init() { 
 if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return; 
 
 this.currentUserId = parseInt(window.Commons.location.profile.id); 
 
 if (document.readyState === 'loading') { 
 document.addEventListener('DOMContentLoaded', () => this.injectTab()); 
 } else { 
 this.injectTab(); 
 } 
 } 
 
 getProfileUserName() { 
 var el = document.querySelector('.profile .nick'); 
 return el ? el.textContent.trim() : 'questo utente'; 
 } 
 
 // ----------------------------------------------- 
 // API jsonBin 
 // ----------------------------------------------- 
 
 async loadTasks() { 
 try { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 'X-Master-Key': API_KEY } 
 }); 
 if (!response.ok) throw new Error('Errore caricamento task'); 
 
 var data = await response.json(); 
 var tasksData = data.record.tasks || {}; 
 this.tasks = tasksData[this.currentUserId] || []; 
 this.renderTasks(); 
 } catch(e) { 
 console.error('[StaffTasks] Errore loadTasks:', e); 
 this.showError('Errore nel caricamento delle task'); 
 } 
 } 
 
 async saveTasks(allTasksData) { 
 try { 
 var response = await fetch(API_URL, { 
 method: 'PUT', 
 headers: { 
 'Content-Type': 'application/json', 
 'X-Master-Key': API_KEY 
 }, 
 body: JSON.stringify({ tasks: allTasksData }) 
 }); 
 if (!response.ok) throw new Error('Errore salvataggio task'); 
 return true; 
 } catch(e) { 
 console.error('[StaffTasks] Errore saveTasks:', e); 
 this.showError('Errore nel salvataggio'); 
 return false; 
 } 
 } 
 
 async fetchAllTasks() { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 'X-Master-Key': API_KEY } 
 }); 
 var data = await response.json(); 
 return data.record.tasks || {}; 
 } 
 
 async addTask(userId, taskTitle) { 
 try { 
 var allTasks = await this.fetchAllTasks(); 
 
 if (!allTasks[userId]) allTasks[userId] = []; 
 
 var newTask = { 
 id: 'task_' + Date.now(), 
 title: taskTitle, 
 assignedBy: this.currentUserName, 
 assignedById: String(Commons.user.id), 
 assignedAt: new Date().toISOString(), 
 completed: false, 
 completedAt: null 
 }; 
 
 allTasks[userId].push(newTask); 
 
 var saved = await this.saveTasks(allTasks); 
 if (saved) { 
 if (userId == this.currentUserId) { 
 this.tasks.push(newTask); 
 this.renderTasks(); 
 } 
 this.showSuccess('Task aggiunta con successo!'); 
 } 
 } catch(e) { 
 console.error('[StaffTasks] Errore addTask:', e); 
 this.showError("Errore nell'aggiunta della task"); 
 } 
 } 
 
 async toggleTask(taskId) { 
 try { 
 var allTasks = await this.fetchAllTasks(); 
 var userTasks = allTasks[this.currentUserId]; 
 if (!userTasks) return; 
 
 for (var i = 0; i < userTasks.length; i++) { 
 if (userTasks[i].id === taskId) { 
 userTasks[i].completed = !userTasks[i].completed; 
 userTasks[i].completedAt = userTasks[i].completed ? new Date().toISOString() : null; 
 break; 
 } 
 } 
 
 var saved = await this.saveTasks(allTasks); 
 if (saved) await this.loadTasks(); 
 } catch(e) { 
 console.error('[StaffTasks] Errore toggleTask:', e); 
 this.showError("Errore nell'aggiornamento della task"); 
 } 
 } 
 
 async deleteTask(taskId) { 
 try { 
 var allTasks = await this.fetchAllTasks(); 
 if (!allTasks[this.currentUserId]) return; 
 
 allTasks[this.currentUserId] = allTasks[this.currentUserId].filter(function(t) { 
 return t.id !== taskId; 
 }); 
 
 var saved = await this.saveTasks(allTasks); 
 if (saved) await this.loadTasks(); 
 } catch(e) { 
 console.error('[StaffTasks] Errore deleteTask:', e); 
 this.showError("Errore nell'eliminazione della task"); 
 } 
 } 
 
 // ----------------------------------------------- 
 // RENDERING 
 // ----------------------------------------------- 
 
 renderTasks() { 
 var container = document.getElementById('staff-tasks-content'); 
 if (!container) return; 
 
 var activeTasks = this.tasks.filter(function(t) { return !t.completed; }); 
 var completedTasks = this.tasks.filter(function(t) { return t.completed; }); 
 var isOwnProfile = this.currentUserId == Commons.user.id; 
 
 var html = '<div class="tasks-section">'; 
 html += '<h4>Task Attive <span class="count">(' + activeTasks.length + ')</span></h4>'; 
 html += activeTasks.length === 0 
 ? '<p class="empty">Nessuna task attiva</p>' 
 : '<ul class="tasks-list">' + activeTasks.map(t => this.renderTask(t, isOwnProfile)).join('') + '</ul>'; 
 html += '</div>'; 
 
 if (completedTasks.length > 0) { 
 html += '<div class="tasks-section completed-section">'; 
 html += '<h4>Task Completate <span class="count">(' + completedTasks.length + ')</span></h4>'; 
 html += '<ul class="tasks-list">' + completedTasks.map(t => this.renderTask(t, isOwnProfile)).join('') + '</ul>'; 
 html += '</div>'; 
 } 
 
 container.innerHTML = html; 
 this.attachEventListeners(); 
 } 
 
 renderTask(task, isOwnProfile) { 
 var html = '<li class="task-item ' + (task.completed ? 'completed' : '') + '" data-task-id="' + task.id + '">'; 
 if (isOwnProfile) { 
 html += '<input type="checkbox" class="task-checkbox" ' + (task.completed ? 'checked' : '') + '>'; 
 } 
 html += '<div class="task-content">'; 
 html += '<div class="task-title">' + this.escapeHtml(task.title) + '</div>'; 
 html += '<div class="task-meta">'; 
 html += '<span class="task-assigned">Assegnata da: <strong>' + this.escapeHtml(task.assignedBy) + '</strong></span>'; 
 html += '<span class="task-date">' + F.utilities.dates.formatDate(new Date(task.assignedAt), 'D/M/Y H:I') + '</span>'; 
 html += '</div></div>'; 
 if (isOwnProfile && task.completed) { 
 html += '<button class="task-delete" title="Elimina task">&#10005;</button>'; 
 } 
 html += '</li>'; 
 return html; 
 } 
 
 attachEventListeners() { 
 var self = this; 
 var isOwnProfile = this.currentUserId == Commons.user.id; 
 if (!isOwnProfile) return; 
 
 document.querySelectorAll('.task-checkbox').forEach(function(cb) { 
 cb.addEventListener('change', function() { 
 self.toggleTask(this.closest('.task-item').getAttribute('data-task-id')); 
 }); 
 }); 
 
 document.querySelectorAll('.task-delete').forEach(function(btn) { 
 btn.addEventListener('click', function() { 
 var taskId = this.closest('.task-item').getAttribute('data-task-id'); 
 if (confirm('Sei sicuro di voler eliminare questa task?')) { 
 self.deleteTask(taskId); 
 } 
 }); 
 }); 
 } 
 
 renderAddTaskForm() { 
 var container = document.getElementById('staff-tasks-add'); 
 if (!container) return; 
 
 var profileUserName = this.getProfileUserName(); 
 var self = this; 
 
 container.innerHTML = '<div class="add-task-form">' 
 + '<h4>Aggiungi Task a ' + profileUserName + '</h4>' 
 + '<input type="text" id="task-title-input" placeholder="Titolo della task..." />' 
 + '<button id="add-task-btn">Aggiungi Task</button>' 
 + '</div>'; 
 
 var addButton = document.getElementById('add-task-btn'); 
 
 addButton.addEventListener('click', function() { 
 var title = document.getElementById('task-title-input').value.trim(); 
 if (!title) { alert('Inserisci un titolo per la task'); return; } 
 self.addTask(self.currentUserId, title); 
 document.getElementById('task-title-input').value = ''; 
 }); 
 
 document.getElementById('task-title-input').addEventListener('keypress', function(e) { 
 if (e.key === 'Enter') addButton.dispatchEvent(new Event('click')); 
 }); 
 } 
 
 // ----------------------------------------------- 
 // FEEDBACK 
 // ----------------------------------------------- 
 
 showMessage(message, type) { 
 var container = document.getElementById('staff-tasks-message'); 
 if (!container) return; 
 container.innerHTML = '<div class="message ' + type + '">' + message + '</div>'; 
 setTimeout(function() { container.innerHTML = ''; }, 3000); 
 } 
 
 showError(message) { this.showMessage(message, 'error'); } 
 showSuccess(message) { this.showMessage(message, 'success'); } 
 
 escapeHtml(text) { 
 return text.replace(/[&<>"']/g, function(m) { 
 return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; 
 }); 
 } 
 
 // ----------------------------------------------- 
 // INJECT TAB 
 // ----------------------------------------------- 
 
 injectTab() { 
 var tabsContainer = document.querySelector('.profile .tabs'); 
 if (tabsContainer) { 
 tabsContainer.insertAdjacentHTML('beforeend', 
 '<li id="t' + SETTINGS.tabId + '" class="Sub">' 
 + '<a href="#" onclick="javascript:tab(' + SETTINGS.tabId + ');return false" rel="nofollow">' 
 + SETTINGS.tabName + '</a></li>' 
 ); 
 } 
 
 var mainList = document.querySelector('.profile .main_list'); 
 if (mainList) { 
 mainList.insertAdjacentHTML('beforeend', 
 '<li id="tab' + SETTINGS.tabId + '" class="list nascosta">' 
 + '<div id="staff-tasks-container">' 
 + '<h3>Task Staff</h3>' 
 + '<div id="staff-tasks-message"></div>' 
 + '<div id="staff-tasks-content"><p class="loading">Caricamento task...</p></div>' 
 + '<div id="staff-tasks-add"></div>' 
 + '</div></li>' 
 ); 
 } 
 
 this.loadTasks(); 
 this.renderAddTaskForm(); 
 } 
 } 
 
 new StaffTasksTab(); 
 
 // ----------------------------------------------- 
 // CSS 
 // ----------------------------------------------- 
 
 var style = document.createElement('style'); 
 style.textContent = '#staff-tasks-container{padding:10px}#staff-tasks-container h3{margin:0 0 10px 0;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:8px;font-weight:bold}.tasks-section{margin-bottom:15px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.tasks-section.completed-section{background:#e2f7c4;border-left-color:#0b486b}.tasks-section h4{color:#0B486B;margin:0 0 8px 0;font-size:15px;font-weight:bold}.tasks-section h4 .count{color:#3B8686;font-weight:normal;font-size:13px}.tasks-list{list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto;overflow-x:hidden}.task-item{display:flex;align-items:flex-start;gap:8px;padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px;transition:all 0.2s;position:relative}.task-item:hover{background:#79BD9A;transform:translateX(3px)}.task-item.completed{opacity:0.6}.task-item.completed .task-title{text-decoration:line-through}.task-checkbox{width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px}.task-content{flex:1;min-width:0}.task-title{color:#292354;font-weight:600;font-size:14px;margin-bottom:4px;word-wrap:break-word}.task-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px}.task-assigned{color:#292354;background:#A8DBA8;padding:2px 6px;border-radius:3px}.task-date{color:#FFF;background:#3B8686;padding:2px 6px;border-radius:3px}.task-delete{position:absolute;top:8px;right:8px;background:#d9534f;color:#FFF;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0}.task-delete:hover{background:#c9302c}.add-task-form{background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #79BD9A}.add-task-form h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.add-task-form input{width:100%;padding:8px;margin-bottom:8px;border:2px solid #3B8686;border-radius:5px;font-size:13px;box-sizing:border-box}.add-task-form input:focus{outline:none;border-color:#0B486B}.add-task-form button{width:100%;padding:10px;background:#3B8686;color:#FFF;border:none;border-radius:5px;font-size:14px;font-weight:bold;cursor:pointer;transition:background 0.2s}.add-task-form button:hover{background:#0B486B}.message{padding:8px;border-radius:5px;margin-bottom:10px;text-align:center;font-weight:bold;font-size:12px}.message.error{background:#d9534f;color:#FFF}.message.success{background:#79BD9A;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:8px;text-align:left;font-size:13px}.loading{text-align:center;color:#0B486B;padding:15px;font-size:13px}'; 
 document.head.appendChild(style); 
 
 }); // fine waitFor 
 
})();
