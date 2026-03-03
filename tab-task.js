(function() { 
 'use strict'; 
 
 function waitForConfig(callback) { 
 if (window.StaffTasksConfig) { 
 callback(); 
 } else { 
 setTimeout(function() { waitForConfig(callback); }, 100); 
 } 
 } 
 
 waitForConfig(function() { 
 // 1. Verifica che l'utente loggato SIA staff (può vedere/usare il tab) 
 function checkIfUserIsStaff() { 
 var body = document.body; 
 var classList = body.className; 
 
 return classList.indexOf('admin') !== -1 || 
 classList.indexOf('globalmod') !== -1 || 
 classList.indexOf('admin_user') !== -1 || 
 classList.indexOf('admin_graphic') !== -1 || 
 classList.indexOf('mod_sez') !== -1; 
 } 
 
 var userIsStaff = checkIfUserIsStaff(); 
 
 // Se l'utente loggato non è staff, esci subito 
 if (!userIsStaff) { 
 return; 
 } 
 
 // 2. Verifica se il PROFILO VISITATO è staff (deve avere il tab) 
 function isProfileStaff() { 
 // Cerca il div che contiene il profilo con le classi box_* 
 var profileContainer = document.querySelector('div[class*="box_"]'); 
 if (!profileContainer) return false; 
 
 var classList = profileContainer.className; 
 
 // Controlla se ha classi di staff 
 return classList.indexOf('box_amministratore') !== -1 || 
 classList.indexOf('box_founder') !== -1 || 
 classList.indexOf('box_globalmod') !== -1 || 
 classList.indexOf('box_gruppo1') !== -1 || 
 classList.indexOf('box_gruppo2') !== -1; 
 } 
 
 // Se il profilo visitato non è staff, esci 
 if (!isProfileStaff()) { 
 return; 
 } 
 
 var config = { 
 binId: window.StaffTasksConfig.binId, 
 apiKey: window.StaffTasksConfig.apiKey, 
 tabId: window.StaffTasksConfig.tabId || 1013, 
 tabName: window.StaffTasksConfig.tabName || 'Task Staff' 
 }; 
 
 var API_URL = 'https://api.jsonbin.io/v3/b/' + config.binId; 
 
 class StaffTasksTab { 
 constructor() { 
 this.currentUserId = null; 
 this.currentUserName = null; 
 this.userIsStaff = userIsStaff; 
 this.tasks = []; 
 this.init(); 
 } 
 
 init() { 
 if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) { 
 return; 
 } 
 
 this.currentUserId = parseInt(window.Commons.location.profile.id); 
 this.currentUserName = this.getCurrentUserName(); 
 
 if (document.readyState === 'loading') { 
 document.addEventListener('DOMContentLoaded', () => this.injectTab()); 
 } else { 
 this.injectTab(); 
 } 
 } 
 
 getCurrentUserName() { 
 if (window.Commons && window.Commons.user && window.Commons.user.nickname) { 
 return window.Commons.user.nickname; 
 } 
 return 'Sconosciuto'; 
 } 
 
 getProfileUserName() { 
 var nameElement = document.querySelector('.profile .nick'); 
 
 if (nameElement) { 
 return nameElement.textContent.trim(); 
 } 
 return 'questo utente'; 
 } 
 
 async loadTasks() { 
 try { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 
 'X-Master-Key': config.apiKey 
 } 
 }); 
 
 if (!response.ok) throw new Error('Errore caricamento task'); 
 
 var data = await response.json(); 
 var tasksData = data.record.tasks || {}; 
 
 this.tasks = tasksData[this.currentUserId] || []; 
 
 this.renderTasks(); 
 } catch (error) { 
 console.error('[Staff Tasks] Errore:', error); 
 this.showError('Errore nel caricamento delle task'); 
 } 
 } 
 
 async saveTasks(allTasksData) { 
 try { 
 var response = await fetch(API_URL, { 
 method: 'PUT', 
 headers: { 
 'Content-Type': 'application/json', 
 'X-Master-Key': config.apiKey 
 }, 
 body: JSON.stringify({ 
 tasks: allTasksData 
 }) 
 }); 
 
 if (!response.ok) throw new Error('Errore salvataggio task'); 
 
 return true; 
 } catch (error) { 
 console.error('[Staff Tasks] Errore salvataggio:', error); 
 this.showError('Errore nel salvataggio'); 
 return false; 
 } 
 } 
 
 async addTask(userId, taskTitle) { 
 try { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 
 'X-Master-Key': config.apiKey 
 } 
 }); 
 
 var data = await response.json(); 
 var allTasks = data.record.tasks || {}; 
 
 if (!allTasks[userId]) { 
 allTasks[userId] = []; 
 } 
 
 var newTask = { 
 id: 'task_' + Date.now(), 
 title: taskTitle, 
 assignedBy: this.currentUserName, 
 assignedById: String(window.Commons.user.id), 
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
 } catch (error) { 
 console.error('[Staff Tasks] Errore aggiunta task:', error); 
 this.showError('Errore nell\'aggiunta della task'); 
 } 
 } 
 
 async toggleTask(taskId) { 
 try { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 
 'X-Master-Key': config.apiKey 
 } 
 }); 
 
 var data = await response.json(); 
 var allTasks = data.record.tasks || {}; 
 
 if (!allTasks[this.currentUserId]) return; 
 
 var taskIndex = -1; 
 for (var i = 0; i < allTasks[this.currentUserId].length; i++) { 
 if (allTasks[this.currentUserId][i].id === taskId) { 
 taskIndex = i; 
 break; 
 } 
 } 
 
 if (taskIndex === -1) return; 
 
 var task = allTasks[this.currentUserId][taskIndex]; 
 task.completed = !task.completed; 
 task.completedAt = task.completed ? new Date().toISOString() : null; 
 
 var saved = await this.saveTasks(allTasks); 
 
 if (saved) { 
 await this.loadTasks(); 
 } 
 } catch (error) { 
 console.error('[Staff Tasks] Errore toggle task:', error); 
 this.showError('Errore nell\'aggiornamento della task'); 
 } 
 } 
 
 async deleteTask(taskId) { 
 try { 
 var response = await fetch(API_URL + '/latest', { 
 method: 'GET', 
 headers: { 
 'X-Master-Key': config.apiKey 
 } 
 }); 
 
 var data = await response.json(); 
 var allTasks = data.record.tasks || {}; 
 
 if (!allTasks[this.currentUserId]) return; 
 
 allTasks[this.currentUserId] = allTasks[this.currentUserId].filter(function(t) { 
 return t.id !== taskId; 
 }); 
 
 var saved = await this.saveTasks(allTasks); 
 
 if (saved) { 
 await this.loadTasks(); 
 } 
 } catch (error) { 
 console.error('[Staff Tasks] Errore eliminazione task:', error); 
 this.showError('Errore nell\'eliminazione della task'); 
 } 
 } 
 
 renderTasks() { 
 var container = document.getElementById('staff-tasks-content'); 
 if (!container) return; 
 
 var html = ''; 
 
 var activeTasks = this.tasks.filter(function(t) { return !t.completed; }); 
 var completedTasks = this.tasks.filter(function(t) { return t.completed; }); 
 
 var isOwnProfile = this.currentUserId == window.Commons.user.id; 
 
 html += '<div class="tasks-section">'; 
 html += '<h4>Task Attive <span class="count">(' + activeTasks.length + ')</span></h4>'; 
 
 if (activeTasks.length === 0) { 
 html += '<p class="empty">Nessuna task attiva</p>'; 
 } else { 
 html += '<ul class="tasks-list">'; 
 for (var i = 0; i < activeTasks.length; i++) { 
 html += this.renderTask(activeTasks[i], isOwnProfile); 
 } 
 html += '</ul>'; 
 } 
 html += '</div>'; 
 
 if (completedTasks.length > 0) { 
 html += '<div class="tasks-section completed-section">'; 
 html += '<h4>Task Completate <span class="count">(' + completedTasks.length + ')</span></h4>'; 
 html += '<ul class="tasks-list">'; 
 for (var i = 0; i < completedTasks.length; i++) { 
 html += this.renderTask(completedTasks[i], isOwnProfile); 
 } 
 html += '</ul>'; 
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
 html += '<span class="task-date">' + this.formatDate(new Date(task.assignedAt)) + '</span>'; 
 html += '</div>'; 
 html += '</div>'; 
 
 if (isOwnProfile && task.completed) { 
 html += '<button class="task-delete" title="Elimina task">&#10005;</button>'; 
 } 
 
 html += '</li>'; 
 
 return html; 
 } 
 
 attachEventListeners() { 
 var self = this; 
 var isOwnProfile = this.currentUserId == window.Commons.user.id; 
 
 if (isOwnProfile) { 
 var checkboxes = document.querySelectorAll('.task-checkbox'); 
 for (var i = 0; i < checkboxes.length; i++) { 
 checkboxes[i].addEventListener('change', function() { 
 var taskId = this.closest('.task-item').getAttribute('data-task-id'); 
 self.toggleTask(taskId); 
 }); 
 } 
 
 var deleteButtons = document.querySelectorAll('.task-delete'); 
 for (var i = 0; i < deleteButtons.length; i++) { 
 deleteButtons[i].addEventListener('click', function() { 
 var taskId = this.closest('.task-item').getAttribute('data-task-id'); 
 if (confirm('Sei sicuro di voler eliminare questa task?')) { 
 self.deleteTask(taskId); 
 } 
 }); 
 } 
 } 
 } 
 
 renderAddTaskForm() { 
 var container = document.getElementById('staff-tasks-add'); 
 if (!container) return; 
 
 var profileUserName = this.getProfileUserName(); 
 
 var html = '<div class="add-task-form">'; 
 html += '<h4>Aggiungi Task a ' + profileUserName + '</h4>'; 
 html += '<input type="text" id="task-title-input" placeholder="Titolo della task..." />'; 
 html += '<button id="add-task-btn">Aggiungi Task</button>'; 
 html += '</div>'; 
 
 container.innerHTML = html; 
 
 var self = this; 
 var addButton = document.getElementById('add-task-btn'); 
 
 addButton.addEventListener('click', function() { 
 var title = document.getElementById('task-title-input').value.trim(); 
 
 if (!title) { 
 alert('Inserisci un titolo per la task'); 
 return; 
 } 
 
 self.addTask(self.currentUserId, title); 
 
 document.getElementById('task-title-input').value = ''; 
 }); 
 
 document.getElementById('task-title-input').addEventListener('keypress', function(e) { 
 if (e.key === 'Enter') { 
 addButton.dispatchEvent(new Event('click')); 
 } 
 }); 
 } 
 
 formatDate(date) { 
 var day = date.getDate(); 
 var month = date.getMonth() + 1; 
 var year = date.getFullYear(); 
 var hours = date.getHours(); 
 var minutes = date.getMinutes(); 
 
 if (day < 10) day = '0' + day; 
 if (month < 10) month = '0' + month; 
 if (hours < 10) hours = '0' + hours; 
 if (minutes < 10) minutes = '0' + minutes; 
 
 return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes; 
 } 
 
 escapeHtml(text) { 
 var map = { 
 '&': '&amp;', 
 '<': '&lt;', 
 '>': '&gt;', 
 '"': '&quot;', 
 "'": '&#039;' 
 }; 
 return text.replace(/[&<>"']/g, function(m) { return map[m]; }); 
 } 
 
 showError(message) { 
 var container = document.getElementById('staff-tasks-message'); 
 if (container) { 
 container.innerHTML = '<div class="message error">' + message + '</div>'; 
 setTimeout(function() { 
 container.innerHTML = ''; 
 }, 3000); 
 } 
 } 
 
 showSuccess(message) { 
 var container = document.getElementById('staff-tasks-message'); 
 if (container) { 
 container.innerHTML = '<div class="message success">' + message + '</div>'; 
 setTimeout(function() { 
 container.innerHTML = ''; 
 }, 3000); 
 } 
 } 
 
 injectTab() { 
 var tabsContainer = document.querySelector('.profile .tabs'); 
 if (tabsContainer) { 
 var tabHTML = '<li id="t' + config.tabId + '" class="Sub"><a href="#" onclick="javascript:tab(' + config.tabId + ');return false" rel="nofollow">' + config.tabName + '</a></li>'; 
 tabsContainer.insertAdjacentHTML('beforeend', tabHTML); 
 } 
 
 var mainList = document.querySelector('.profile .main_list'); 
 if (mainList) { 
 var contentHTML = '<li id="tab' + config.tabId + '" class="list nascosta">' + 
 '<div id="staff-tasks-container">' + 
 '<h3>Task Staff</h3>' + 
 '<div id="staff-tasks-message"></div>' + 
 '<div id="staff-tasks-content"><p class="loading">Caricamento task...</p></div>' + 
 '<div id="staff-tasks-add"></div>' + 
 '</div>' + 
 '</li>'; 
 mainList.insertAdjacentHTML('beforeend', contentHTML); 
 } 
 
 this.loadTasks(); 
 this.renderAddTaskForm(); 
 } 
 } 
 
 new StaffTasksTab(); 
 
 var style = document.createElement('style'); 
 style.textContent = '#staff-tasks-container{padding:10px}#staff-tasks-container h3{margin:0 0 10px 0;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:8px;font-weight:bold}.tasks-section{margin-bottom:15px;background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #3B8686}.tasks-section.completed-section{background:#e2f7c4;border-left-color:#0b486b}.tasks-section h4{color:#0B486B;margin:0 0 8px 0;font-size:15px;font-weight:bold}.tasks-section h4 .count{color:#3B8686;font-weight:normal;font-size:13px}.tasks-list{list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto;overflow-x:hidden}.task-item{display:flex;align-items:flex-start;gap:8px;padding:8px;background:#8FBEBA;margin-bottom:6px;border-radius:5px;transition:all 0.2s;position:relative}.task-item:hover{background:#79BD9A;transform:translateX(3px)}.task-item.completed{opacity:0.6}.task-item.completed .task-title{text-decoration:line-through}.task-checkbox{width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px}.task-content{flex:1;min-width:0}.task-title{color:#292354;font-weight:600;font-size:14px;margin-bottom:4px;word-wrap:break-word}.task-meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px}.task-assigned{color:#292354;background:#A8DBA8;padding:2px 6px;border-radius:3px}.task-date{color:#FFF;background:#3B8686;padding:2px 6px;border-radius:3px}.task-delete{position:absolute;top:8px;right:8px;background:#d9534f;color:#FFF;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0}.task-delete:hover{background:#c9302c}.add-task-form{background:#E2F7C4;padding:10px;border-radius:8px;border-left:4px solid #79BD9A}.add-task-form h4{color:#0B486B;margin:0 0 8px 0;font-size:14px;font-weight:bold}.add-task-form input{width:100%;padding:8px;margin-bottom:8px;border:2px solid #3B8686;border-radius:5px;font-size:13px;box-sizing:border-box}.add-task-form input:focus{outline:none;border-color:#0B486B}.add-task-form button{width:100%;padding:10px;background:#3B8686;color:#FFF;border:none;border-radius:5px;font-size:14px;font-weight:bold;cursor:pointer;transition:background 0.2s}.add-task-form button:hover{background:#0B486B}.message{padding:8px;border-radius:5px;margin-bottom:10px;text-align:center;font-weight:bold;font-size:12px}.message.error{background:#d9534f;color:#FFF}.message.success{background:#79BD9A;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:8px;text-align:left;font-size:13px}.loading{text-align:center;color:#0B486B;padding:15px;font-size:13px}'; 
 document.head.appendChild(style); 
 }); 
})();
