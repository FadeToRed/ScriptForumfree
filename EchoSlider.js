/**
 *  Echo Slider
 *
 * @description Topic slider per ForumFree — mostra gli ultimi topic attivi
 * con autoplay, navigazione manuale e modalità espansa.
 *
 * @requires HxHFramework
 */

;(function() {
    'use strict';

    if (!window.HxHFramework) { console.warn('[Echo] HxHFramework non trovato!'); return; }
    if (!window.ECHO_CONFIG)   { console.warn('[Echo] ECHO_CONFIG non trovato!');   return; }

    var F      = window.HxHFramework;
    var ST     = F.utilities.storage;
    var config = window.ECHO_CONFIG;

    // -----------------------------------------------
    //  STATO
    // -----------------------------------------------
    var echoTopicsData    = [];
    var echoCurrentIndex  = 0;
    var echoSliderInterval = null;
    var echoSliderElement  = null;

    // -----------------------------------------------
    //  CARICAMENTO TOPIC
    // -----------------------------------------------
    function echoLoadTopics(callback) {
        var sezioniParam = '';
        if (config.sezioniEscluse && config.sezioniEscluse.length > 0) {
            sezioniParam = '&nosez=' + config.sezioniEscluse.join(',');
        }

        var apiUrl = 'https://' + location.hostname + '/api.php?a=1&n=' + config.numTopics
                   + sezioniParam + '&cook' + 'ie=1&_=' + new Date().getTime();

        fetch(apiUrl)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(function(text) {
                var data;
                try {
                    data = JSON.parse(text.replace(/[\n\r\t]/g, ' ').trim());
                } catch(e) {
                    try {
                        data = JSON.parse(text.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}').replace(/[\n\r\t]/g, ' ').trim());
                        console.log('[Echo] JSON riparato con successo');
                    } catch(e2) {
                        throw new Error('JSON non valido: ' + e2.message);
                    }
                }

                if (!data.threads || data.threads.length === 0) {
                    console.warn('[Echo] Nessun topic ricevuto');
                    if (callback) callback(false);
                    return;
                }

                var newTopicsData = [];
                for (var i = 0; i < data.threads.length; i++) {
                    var thread   = data.threads[i];
                    var lastPost = thread.info.last;
                    var datetime = F.utilities.dates.formatDate(new Date(lastPost.date), 'D/M/Y');
                    var time     = F.utilities.dates.formatDate(new Date(lastPost.date), 'H:I');

                    newTopicsData.push({
                        id:          thread.id,
                        title:       thread.title,
                        url:         'https://' + location.hostname + '/?t=' + thread.id + '&view=getlastpost#lastpost',
                        author:      lastPost.name,
                        authorId:    lastPost.id,
                        authorUrl:   'https://' + location.hostname + '/?act=Profile&MID=' + lastPost.id,
                        avatar:      lastPost.avatar,
                        date:        datetime,
                        time:        time,
                        timestamp:   lastPost.date,
                        sectionName: thread.section_name || 'N/A',
                        sectionId:   thread.section_id   || ''
                    });
                }

                // Salva in cache
                var dataToStore = {};
                for (var j = 0; j < newTopicsData.length; j++) {
                    dataToStore['t' + newTopicsData[j].id] = newTopicsData[j];
                }
                ST.set('EchoSliderData', dataToStore);

                echoTopicsData = newTopicsData;
                console.log('[Echo] Caricati ' + echoTopicsData.length + ' topic');
                if (callback) callback(true);
            })
            .catch(function(error) {
                console.error('[Echo] Errore API:', error.message);

                var cached = ST.get('EchoSliderData', true);
                if (cached) {
                    echoTopicsData = [];
                    for (var key in cached) {
                        if (cached.hasOwnProperty(key)) echoTopicsData.push(cached[key]);
                    }
                    console.log('[Echo] Caricati ' + echoTopicsData.length + ' topic dalla cache');
                    if (callback) callback(true);
                } else {
                    if (callback) callback(false);
                }
            });
    }

    // -----------------------------------------------
    //  COSTRUZIONE SLIDER
    // -----------------------------------------------
    function echoCreateSlider() {
        var targetElement = document.querySelector(config.posizionamento);
        if (!targetElement) {
            console.error('[Echo] Elemento target non trovato: ' + config.posizionamento);
            return false;
        }

        var sliderDiv = document.createElement('div');
        sliderDiv.id  = 'echo-slider';
        sliderDiv.innerHTML =
            '<div class="echo-wrapper"><div class="echo-container"><div class="echo-loading">Caricamento ultimi topic...</div></div></div>'
            + '<div class="echo-nav">'
            + '<button class="echo-btn echo-prev" aria-label="Slide precedente"><i class="fa fa-chevron-left"></i></button>'
            + '<button class="echo-btn echo-next" aria-label="Slide successiva"><i class="fa fa-chevron-right"></i></button>'
            + '<button class="echo-btn echo-expand" aria-label="Espandi lista"><i class="fa fa-chevron-down"></i></button>'
            + '</div>';

        targetElement.parentNode.insertBefore(sliderDiv, targetElement);
        echoSliderElement = sliderDiv;

        sliderDiv.querySelector('.echo-prev').addEventListener('click',   function(e) { e.preventDefault(); echoPrevSlide(); });
        sliderDiv.querySelector('.echo-next').addEventListener('click',   function(e) { e.preventDefault(); echoNextSlide(); });
        sliderDiv.querySelector('.echo-expand').addEventListener('click', function(e) { e.preventDefault(); echoToggleExpand(); });

        return true;
    }

    function echoBuildAllSlides() {
        if (!echoSliderElement) return;

        var container = echoSliderElement.querySelector('.echo-container');
        var html      = '';

        for (var i = 0; i < config.numTopics; i++) {
            if (i < echoTopicsData.length) {
                var topic      = echoTopicsData[i];
                var avatarHtml = topic.avatar
                    ? '<img src="' + topic.avatar + '" class="echo-avatar" alt="' + topic.author + '">'
                    : '<div class="echo-avatar echo-avatar-default"></div>';
                var sectionUrl = topic.sectionId
                    ? 'https://' + location.hostname + '/?f=' + topic.sectionId
                    : '#';

                var sectionStyle = '';
                if (topic.sectionId) {
                    var topicSecId = String(topic.sectionId);
                    outer: for (var gruppo in config.coloriSezioni) {
                        if (!config.coloriSezioni.hasOwnProperty(gruppo)) continue;
                        var grp = config.coloriSezioni[gruppo];
                        for (var j = 0; j < grp.ids.length; j++) {
                            if (grp.ids[j] === topicSecId) {
                                sectionStyle = ' style="background:' + grp.color + ' !important"';
                                break outer;
                            }
                        }
                    }
                }

                html += '<div class="echo-item">'
                    + '<a href="' + sectionUrl + '" class="echo-section"' + sectionStyle + ' target="_blank" title="' + topic.sectionName + '">' + topic.sectionName + '</a>'
                    + '<a href="' + topic.authorUrl + '" class="echo-avatar-wrap" target="_blank">' + avatarHtml + '</a>'
                    + '<div class="echo-content">'
                    + '<div class="echo-meta">'
                    + '<a href="' + topic.authorUrl + '" class="echo-author" target="_blank">' + topic.author + '</a>'
                    + '<span class="echo-action">dice:</span>'
                    + '<a href="' + topic.url + '" class="echo-topic" target="_blank">' + topic.title + '</a>'
                    + '</div>'
                    + '<div class="echo-time">alle <span class="echo-hour">' + topic.time + '</span> del <span class="echo-date">' + topic.date + '</span></div>'
                    + '</div>'
                    + '</div>';
            } else {
                html += '<div class="echo-item echo-placeholder">'
                    + '<div class="echo-section" style="background:#000!important">N/A</div>'
                    + '<div class="echo-avatar-wrap"><img src="https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png" class="echo-avatar" alt="Nessun topic"></div>'
                    + '<div class="echo-content"><div class="echo-meta">'
                    + '<span class="echo-author" style="color:#ebeadd">Nessun topic</span>'
                    + '<span class="echo-action" style="color:#6d5b7a">disponibile</span>'
                    + '</div></div>'
                    + '</div>';
            }
        }

        container.innerHTML = html;
    }

    // -----------------------------------------------
    //  NAVIGAZIONE
    // -----------------------------------------------
    function echoShowTopic(index) {
        if (!echoSliderElement) return;
        var container    = echoSliderElement.querySelector('.echo-container');
        var scrollPosition = -(index * echoSliderElement.offsetWidth);
        container.style.transform = 'translateX(' + scrollPosition + 'px)';
    }

    function echoPrevSlide() {
        echoCurrentIndex = (echoCurrentIndex - 1 + config.numTopics) % config.numTopics;
        echoShowTopic(echoCurrentIndex);
        echoResetAutoplay();
    }

    function echoNextSlide() {
        echoCurrentIndex = (echoCurrentIndex + 1) % config.numTopics;
        echoShowTopic(echoCurrentIndex);
        echoResetAutoplay();
    }

    function echoResetAutoplay() {
        if (echoSliderInterval) clearInterval(echoSliderInterval);
        echoSliderInterval = setInterval(function() {
            echoCurrentIndex = (echoCurrentIndex + 1) % config.numTopics;
            echoShowTopic(echoCurrentIndex);
        }, config.intervalloSlide);
    }

    // -----------------------------------------------
    //  ESPANDI / COMPRIMI
    // -----------------------------------------------
    function echoToggleExpand() {
        if (!echoSliderElement) return;

        var wrapper   = echoSliderElement.querySelector('.echo-wrapper');
        var container = echoSliderElement.querySelector('.echo-container');
        var expandBtn = echoSliderElement.querySelector('.echo-expand');
        var prevBtn   = echoSliderElement.querySelector('.echo-prev');
        var nextBtn   = echoSliderElement.querySelector('.echo-next');
        var icon      = expandBtn.querySelector('i');
        var isExpanded = echoSliderElement.classList.contains('echo-expanded');
        var allItems  = container.querySelectorAll('.echo-item');

        if (isExpanded) {
            for (var i = 0; i < allItems.length; i++) {
                allItems[i].style.display = 'flex';
            }
            echoSliderElement.classList.remove('echo-expanded');
            wrapper.style.overflow    = 'hidden';
            container.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            icon.className = 'fa fa-chevron-down';
            expandBtn.setAttribute('aria-label', 'Espandi lista');
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            echoResetAutoplay();
        } else {
            for (var i = 0; i < allItems.length; i++) {
                allItems[i].style.display = i < config.maxExpanded ? 'flex' : 'none';
            }
            container.style.transition = 'none';
            container.style.transform  = 'translateX(0)';
            echoSliderElement.classList.add('echo-expanded');
            wrapper.style.overflow = 'visible';
            icon.className = 'fa fa-chevron-up';
            expandBtn.setAttribute('aria-label', 'Comprimi lista');
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            if (echoSliderInterval) clearInterval(echoSliderInterval);
        }
    }

    // -----------------------------------------------
    //  AVVIO
    // -----------------------------------------------
    function echoStartSlider() {
        if (echoSliderInterval) clearInterval(echoSliderInterval);
        echoBuildAllSlides();
        echoCurrentIndex = 0;
        echoShowTopic(echoCurrentIndex);
        echoSliderInterval = setInterval(function() {
            echoCurrentIndex = (echoCurrentIndex + 1) % config.numTopics;
            echoShowTopic(echoCurrentIndex);
        }, config.intervalloSlide);
    }

    function echoInitSlider() {
        var init = function() {
            if (!echoCreateSlider()) return;
            echoLoadTopics(function() {
                echoStartSlider();
                console.log('[Echo] Pronto');
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            setTimeout(init, 100);
        }
    }

    echoInitSlider();

})();
