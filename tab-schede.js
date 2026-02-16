(function() { 
    'use strict'; 
    
    // Attendi che la configurazione sia disponibile
    function waitForConfig(callback) {
        if (window.GDRConfig) {
            callback();
        } else {
            setTimeout(function() { waitForConfig(callback); }, 100);
        }
    }
    
    waitForConfig(function() {
        var scriptInfo = {
            sid: "200",
            name: "Archivio Schede GDR",
            tabId: window.GDRConfig.tabId,
            tabName: window.GDRConfig.tabName,
            sections: window.GDRConfig.sections
        };
        
        class GDRSheetsTab { 
            constructor() { 
                this.currentProfileUserId = null;
                this.sheets = {
                    attive: [],
                    nonApprovate: [],
                    congelate: [],
                    inattive: []
                };
                this.init(); 
            } 
            
            init() { 
                if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) { 
                    return; 
                } 
                
                this.currentProfileUserId = parseInt(window.Commons.location.profile.id);
                
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.injectTab());
                } else {
                    this.injectTab();
                }
            } 
            
            loadTopicsFromAPI(sectionId) {
                var allTopics = [];
                var perPage = 100;
                var page = 0;
                var self = this;
                
                function loadPage() {
                    var start = page * perPage;
                    var apiUrl = 'https://' + location.hostname + '/api.php?f=' + sectionId + 
                               '&a=2&n=' + perPage + '&st=' + start + '&*cookie=1&_=' + new Date().getTime();
                    
                    return fetch(apiUrl)
                        .then(function(response) {
                            if (!response.ok) throw new Error('Errore HTTP: ' + response.status);
                            return response.json();
                        })
                        .then(function(data) {
                            if (!data.threads || data.threads.length === 0) {
                                return allTopics;
                            }
                            
                            for (var i = 0; i < data.threads.length; i++) {
                                var thread = data.threads[i];
                                
                                if (!thread.info || !thread.info.start) continue;
                                
                                var authorId = parseInt(thread.info.start.id);
                                var authorName = thread.info.start.name;
                                var createdDate = thread.info.start.date;
                                var lastModDate = thread.info.last ? thread.info.last.date : createdDate;
                                
                                if (authorId === self.currentProfileUserId) {
                                    allTopics.push({
                                        id: parseInt(thread.id),
                                        titolo: self.decodeHTML(thread.title),
                                        url: 'https://' + location.hostname + '/?t=' + thread.id,
                                        dataCreazione: new Date(createdDate),
                                        dataUltimaModifica: new Date(lastModDate),
                                        autore: authorName
                                    });
                                }
                            }
                            
                            if (data.threads.length === perPage) {
                                page++;
                                return loadPage();
                            } else {
                                return allTopics;
                            }
                        });
                }
                
                return loadPage();
            }
            
            decodeHTML(text) {
                var textarea = document.createElement('textarea');
                textarea.innerHTML = text;
                return textarea.value;
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
            
            async loadAllSheets() {
                var progressElement = document.getElementById('gdr-progress');
                var total = Object.keys(scriptInfo.sections).length;
                var loaded = 0;
                
                for (var key in scriptInfo.sections) {
                    var section = scriptInfo.sections[key];
                    
                    if (progressElement) {
                        progressElement.innerHTML = 'Caricamento ' + section.label + '...';
                    }
                    
                    try {
                        var topics = await this.loadTopicsFromAPI(section.id);
                        this.sheets[key] = topics;
                    } catch (error) {
                        this.sheets[key] = [];
                    }
                    
                    loaded++;
                    if (progressElement) {
                        var percent = Math.round((loaded / total) * 100);
                        progressElement.innerHTML = 'Caricamento... ' + percent + '%';
                    }
                }
                
                if (progressElement) {
                    progressElement.style.display = 'none';
                }
                
                this.renderSheets();
            }
            
            renderSheets() {
                var container = document.getElementById('gdr-custom-content');
                if (!container) return;
                
                var html = '';
                var self = this;
                
                for (var key in scriptInfo.sections) {
                    var section = scriptInfo.sections[key];
                    var sheets = this.sheets[key];
                    
                    html += '<div class="gdr-section">';
                    html += '<h4>' + section.label + ' <span class="count">(' + sheets.length + ')</span></h4>';
                    
                    if (sheets.length === 0) {
                        html += '<p class="empty">Nessuna scheda</p>';
                    } else {
                        html += '<ul class="sheets-list">';
                        
                        sheets.sort(function(a, b) {
                            return b.dataCreazione - a.dataCreazione;
                        });
                        
                        for (var i = 0; i < sheets.length; i++) {
                            var sheet = sheets[i];
                            html += '<li>';
                            html += '<div class="sheet-info">';
                            html += '<a href="' + sheet.url + '" class="sheet-title">' + sheet.titolo + '</a>';
                            html += '<div class="sheet-dates">';
                            html += '<span class="date-created">Creata: ' + self.formatDate(sheet.dataCreazione) + '</span>';
                            html += '<span class="date-modified">Ultima modifica: ' + self.formatDate(sheet.dataUltimaModifica) + '</span>';
                            html += '</div>';
                            html += '</div>';
                            html += '</li>';
                        }
                        
                        html += '</ul>';
                    }
                    
                    html += '</div>';
                }
                
                container.innerHTML = html;
            }
            
            injectTab() {
                var tabsContainer = document.querySelector('.profile .tabs');
                if (tabsContainer) {
                    var tabHTML = '<li id="t' + scriptInfo.tabId + '" class="Sub"><a href="#" onclick="javascript:tab(' + scriptInfo.tabId + ');return false" rel="nofollow">' + scriptInfo.tabName + '</a></li>';
                    tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
                }
                
                var mainList = document.querySelector('.profile .main_list');
                if (mainList) {
                    var contentHTML = '<li id="tab' + scriptInfo.tabId + '" class="list nascosta">' +
                        '<div id="gdr-tab-content">' +
                        '<h3>Archivio Schede PG</h3>' +
                        '<div id="gdr-progress" class="loading">Caricamento schede...</div>' +
                        '<div id="gdr-custom-content"></div>' +
                        '</div>' +
                        '</li>';
                    mainList.insertAdjacentHTML('beforeend', contentHTML);
                }
                
                this.loadAllSheets();
            } 
        } 
        
        new GDRSheetsTab(); 
        
        var style = document.createElement('style');
        style.textContent = '#gdr-tab-content{padding:15px}#gdr-tab-content h3{margin-bottom:15px;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:10px;font-weight:bold}.gdr-section{margin-bottom:30px;background:#E2F7C4;padding:15px;border-radius:8px;border-left:4px solid #3B8686}.gdr-section h4{color:#0B486B;margin-bottom:12px;font-size:17px;font-weight:bold}.gdr-section h4 .count{color:#3B8686;font-weight:normal;font-size:14px}.sheets-list{list-style:none;padding:0;margin:0}.sheets-list li{padding:12px;border-bottom:1px solid #CFF09E;background:#8FBEBA;margin-bottom:8px;border-radius:5px;transition:all 0.2s}.sheets-list li:hover{background:#79BD9A;transform:translateX(5px);box-shadow:0 2px 5px rgba(0,0,0,0.1)}.sheet-info{display:flex;flex-direction:column;gap:8px}.sheet-title{color:#292354;text-decoration:none;font-weight:600;font-size:15px}.sheet-title:hover{color:#0B486B;text-decoration:underline}.sheet-dates{display:flex;gap:15px;flex-wrap:wrap}.sheet-dates span{font-size:12px;color:#292354;background:#A8DBA8;padding:3px 8px;border-radius:3px}.date-created{background:#79BD9A!important;color:#FFF}.date-modified{background:#3B8686!important;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:10px}.loading{text-align:center;color:#0B486B;padding:20px;font-size:14px}#gdr-progress{background:#3B8686;color:#FFF;padding:10px;border-radius:5px;margin-bottom:15px;text-align:center;font-weight:bold}';
        document.head.appendChild(style);
    });
    
})();
