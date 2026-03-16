/**
 * ⚔️ Archivio Schede GDR
 *
 * @description Aggiunge un tab "Archivio Schede PG" al profilo utente,
 * mostrando tutte le schede GDR create dall'utente nelle sezioni configurate.
 *
 * @requires HxHFramework
 */

;(function() {
    'use strict';

    if (!window.HxHFramework) { console.warn('[GDRSheets] HxHFramework non trovato!'); return; }

    var F = window.HxHFramework;

    // Attende che GDRConfig sia disponibile
    F.utilities.waitFor(
        function() { return window.GDRConfig; },
        function() {

        var SETTINGS = {
            tabId:    window.GDRConfig.tabId,
            tabName:  window.GDRConfig.tabName,
            sections: window.GDRConfig.sections
        };

        class GDRSheetsTab {

            constructor() {
                this.currentProfileUserId = null;
                this.sheets = {};
                for (var key in SETTINGS.sections) {
                    this.sheets[key] = [];
                }
                this.init();
            }

            init() {
                if (!window.Commons || !window.Commons.location || !window.Commons.location.isProfile) return;

                this.currentProfileUserId = parseInt(window.Commons.location.profile.id);

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.injectTab());
                } else {
                    this.injectTab();
                }
            }

            // -----------------------------------------------
            //  CARICAMENTO TOPIC DA API
            // -----------------------------------------------

            loadTopicsFromAPI(sectionId) {
                var allTopics = [];
                var perPage   = 100;
                var page      = 0;
                var self      = this;

                function loadPage() {
                    var start  = page * perPage;
                    var apiUrl = 'https://' + location.hostname + '/api.php?f=' + sectionId
                               + '&a=2&n=' + perPage + '&st=' + start
                               + '&cook' + 'ie=1&_=' + new Date().getTime();

                    return fetch(apiUrl)
                        .then(function(r) {
                            if (!r.ok) throw new Error('Errore HTTP: ' + r.status);
                            return r.json();
                        })
                        .then(function(data) {
                            if (!data.threads || data.threads.length === 0) return allTopics;

                            for (var i = 0; i < data.threads.length; i++) {
                                var thread = data.threads[i];
                                if (!thread.info || !thread.info.start) continue;

                                var authorId = parseInt(thread.info.start.id);
                                if (authorId !== self.currentProfileUserId) continue;

                                allTopics.push({
                                    id:                  parseInt(thread.id),
                                    titolo:              decodeHTML(thread.title),
                                    url:                 'https://' + location.hostname + '/?t=' + thread.id,
                                    dataCreazione:       new Date(thread.info.start.date),
                                    dataUltimaModifica:  new Date(thread.info.last ? thread.info.last.date : thread.info.start.date),
                                    autore:              thread.info.start.name
                                });
                            }

                            if (data.threads.length === perPage) {
                                page++;
                                return loadPage();
                            }
                            return allTopics;
                        });
                }

                return loadPage();
            }

            // -----------------------------------------------
            //  CARICAMENTO TUTTE LE SEZIONI
            // -----------------------------------------------

            async loadAllSheets() {
                var progressElement = document.getElementById('gdr-progress');
                var keys            = Object.keys(SETTINGS.sections);
                var total           = keys.length;
                var loaded          = 0;

                for (var key in SETTINGS.sections) {
                    var section = SETTINGS.sections[key];

                    if (progressElement) progressElement.innerHTML = 'Caricamento ' + section.label + '...';

                    try {
                        this.sheets[key] = await this.loadTopicsFromAPI(section.id);
                    } catch(e) {
                        console.error('[GDRSheets] Errore sezione ' + section.label + ':', e);
                        this.sheets[key] = [];
                    }

                    loaded++;
                    if (progressElement) {
                        progressElement.innerHTML = 'Caricamento... ' + Math.round((loaded / total) * 100) + '%';
                    }
                }

                if (progressElement) progressElement.style.display = 'none';

                this.renderSheets();
            }

            // -----------------------------------------------
            //  RENDERING
            // -----------------------------------------------

            renderSheets() {
                var container = document.getElementById('gdr-custom-content');
                if (!container) return;

                var html = '';

                for (var key in SETTINGS.sections) {
                    var section = SETTINGS.sections[key];
                    var sheets  = this.sheets[key];

                    sheets.sort(function(a, b) { return b.dataCreazione - a.dataCreazione; });

                    html += '<div class="gdr-section">';
                    html += '<h4>' + section.label + ' <span class="count">(' + sheets.length + ')</span></h4>';

                    if (sheets.length === 0) {
                        html += '<p class="empty">Nessuna scheda</p>';
                    } else {
                        html += '<ul class="sheets-list">';
                        for (var i = 0; i < sheets.length; i++) {
                            var sheet = sheets[i];
                            html += '<li>';
                            html += '<div class="sheet-info">';
                            html += '<a href="' + sheet.url + '" class="sheet-title">' + sheet.titolo + '</a>';
                            html += '<div class="sheet-dates">';
                            html += '<span class="date-created">Creata: '         + F.utilities.dates.formatDate(sheet.dataCreazione,      'D/M/Y H:I') + '</span>';
                            html += '<span class="date-modified">Ultima modifica: ' + F.utilities.dates.formatDate(sheet.dataUltimaModifica, 'D/M/Y H:I') + '</span>';
                            html += '</div></div></li>';
                        }
                        html += '</ul>';
                    }

                    html += '</div>';
                }

                container.innerHTML = html;
            }

            // -----------------------------------------------
            //  INJECT TAB
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
                        + '<div id="gdr-tab-content">'
                        + '<h3>Archivio Schede PG</h3>'
                        + '<div id="gdr-progress" class="loading">Caricamento schede...</div>'
                        + '<div id="gdr-custom-content"></div>'
                        + '</div></li>'
                    );
                }

                this.loadAllSheets();
            }
        }

        new GDRSheetsTab();

        // -----------------------------------------------
        //  CSS
        // -----------------------------------------------

        var style = document.createElement('style');
        style.textContent = '#gdr-tab-content{padding:15px}#gdr-tab-content h3{margin-bottom:15px;color:#292354;border-bottom:2px solid #3B8686;padding-bottom:10px;font-weight:bold}.gdr-section{margin-bottom:30px;background:#E2F7C4;padding:15px;border-radius:8px;border-left:4px solid #3B8686}.gdr-section h4{color:#0B486B;margin-bottom:12px;font-size:17px;font-weight:bold}.gdr-section h4 .count{color:#3B8686;font-weight:normal;font-size:14px}.sheets-list{list-style:none;padding:0;margin:0}.sheets-list li{padding:12px;border-bottom:1px solid #CFF09E;background:#8FBEBA;margin-bottom:8px;border-radius:5px;transition:all 0.2s}.sheets-list li:hover{background:#79BD9A;transform:translateX(5px);box-shadow:0 2px 5px rgba(0,0,0,0.1)}.sheet-info{display:flex;flex-direction:column;gap:8px}.sheet-title{color:#292354;text-decoration:none;font-weight:600;font-size:15px}.sheet-title:hover{color:#0B486B;text-decoration:underline}.sheet-dates{display:flex;gap:15px;flex-wrap:wrap}.sheet-dates span{font-size:12px;color:#292354;background:#A8DBA8;padding:3px 8px;border-radius:3px}.date-created{background:#79BD9A!important;color:#FFF}.date-modified{background:#3B8686!important;color:#FFF}.empty{color:#3B8686;font-style:italic;padding:10px}.loading{text-align:center;color:#0B486B;padding:20px;font-size:14px}#gdr-progress{background:#3B8686;color:#FFF;padding:10px;border-radius:5px;margin-bottom:15px;text-align:center;font-weight:bold}';
        document.head.appendChild(style);

        }); // fine waitFor

})();

// -----------------------------------------------
//  HELPER (fuori dalla closure per evitare conflitti)
// -----------------------------------------------
function decodeHTML(text) {
    var textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}
