
;(function() {

    if (!window.HxHFramework) { console.warn('[BGR] HxHFramework non trovato!'); return; }

    var F  = window.HxHFramework;
    var ST = F.utilities.storage;

    if (!window.BGR_SETTINGS) { console.warn('[BGR] BGR_SETTINGS non trovato!'); return; }
    var SETTINGS = window.BGR_SETTINGS;

    window.addEventListener('load', function() {

        // Solo sulla homepage
        if (!F.location.isHome()) return;

        // Solo se loggato
        if (F.groups.isGuest()) return;

        F.requests.fetchToken(function(token) {

            var today = new Date().toDateString();

            // Legge i compleanni dal DOM
            var BIRTHDAYS = [];
            var container = document.querySelector('.birthday');
            if (container) {
                var links = container.querySelectorAll('dd a');
                for (var i = 0; i < links.length; i++) {
                    var a    = links.item(i);
                    var href = a.getAttribute('href') || '';
                    var match = href.match(/MID=(\d+)/);
                    BIRTHDAYS.push({ id: match ? match[1] : null, nickname: a.textContent.trim(), url: href });
                }
            }

            if (!BIRTHDAYS.length) return;

            // Non mostrare se è il compleanno dell'utente connesso
            for (var i = 0; i < BIRTHDAYS.length; i++) {
                if (BIRTHDAYS[i].id == Commons.user.id) return;
            }

            injectFA();
            injectStyles();

            // Auguri già fatti oggi → nulla
            if (ST.get('bgr-done') === today) return;

            // Card già vista oggi → solo bubble
            if (ST.get('bgr-lastcheck') === today) {
                showBubble(BIRTHDAYS);
                return;
            }

            // Prima visita della giornata → card
            ST.set('bgr-lastcheck', today);
            showCard(BIRTHDAYS);

            // --- Pubblica gli auguri nel topic ---
            function postWish(birthdays, callback) {
                var tags = '';
                for (var i = 0; i < birthdays.length; i++) {
                    if (i > 0) tags += ', ';
                    tags += '<mark data-uid="' + birthdays[i].id + '">' + birthdays[i].nickname + '</mark>';
                }

                var intro = 'Tanti auguri a ' + tags + ' da parte di tutti noi di <strong style="color:#E2F7C4;font-weight:800;">' + F.constants.FORUM_NAME + '</strong>!';

                var msg = '<div style="background:linear-gradient(135deg,#1a1040 0%,#0d3b52 100%);border-radius:16px;padding:28px 28px 24px;font-family:Montserrat,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.2);position:relative;overflow:hidden;">'
                    + '<div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(207,240,158,.07);pointer-events:none;"></div>'
                    + '<div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:rgba(121,189,154,.07);pointer-events:none;"></div>'
                    + '<div style="text-align:center;margin-bottom:20px;">'
                    + '<div style="font-size:36px;margin-bottom:8px;color:#79BD9A;"><i class="fa fa-birthday-cake"></i></div>'
                    + '<div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;background:linear-gradient(90deg,#79BD9A,#CFF09E,#79BD9A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Buon Compleanno!</div>'
                    + '</div>'
                    + '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(207,240,158,.15);border-radius:12px;padding:16px 18px;text-align:center;margin-bottom:18px;">'
                    + '<p style="font-size:14px;font-weight:500;color:#8FBEBA;line-height:1.7;margin:0;">' + intro + ' <span class="mdi mdi-party-popper" style="color:#CFF09E;"></span></p>'
                    + '</div>'
                    + '<div style="text-align:center;border-top:1px solid rgba(143,190,186,.15);padding-top:14px;">'
                    + '<span style="font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(143,190,186,.5);">' + F.constants.FORUM_NAME + '</span>'
                    + '</div>'
                    + '</div>';

                F.requests.postComment(token, SETTINGS.sez, SETTINGS.topic, msg, function(ok) {
                    callback(ok);
                });
            }

            // --- Card principale ---
            function showCard(birthdays) {
                renderCard(birthdays, true);
            }

            // --- Card riaperta dal bubble ---
            function showCardFromBubble(birthdays) {
                renderCard(birthdays, false);
            }

            // --- Render card (con o senza auto-dismiss) ---
            function renderCard(birthdays, autoDismiss) {
                var namesList = buildNamesList(birthdays);
                var verb = birthdays.length === 1 ? 'compie gli anni oggi!' : 'compiono gli anni oggi!';

                var cardHTML = '<div id="bgr-card">'
                    + '<button class="bgr-close" title="Chiudi"><i class="fa fa-times"></i></button>'
                    + '<div class="bgr-icon"><i class="fa fa-birthday-cake"></i></div>'
                    + '<div class="bgr-body">'
                    + '<p class="bgr-title">Compleanni di oggi!</p>'
                    + '<p class="bgr-subtitle">' + namesList + ' ' + verb + '</p>'
                    + '<button class="bgr-btn" id="bgr-wish-btn"><i class="fa fa-heart"></i> Fai gli auguri!</button>'
                    + '</div>'
                    + '</div>';

                document.body.insertAdjacentHTML('beforeend', cardHTML);

                var card     = document.getElementById('bgr-card');
                var wishBtn  = document.getElementById('bgr-wish-btn');
                var closeBtn = card.querySelector('.bgr-close');

                wishBtn.addEventListener('click', function() {
                    wishBtn.disabled = true;
                    wishBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Invio...';
                    postWish(birthdays, function(ok) {
                        ST.set('bgr-done', today);
                        setTimeout(function() {
                            document['loca'+'tion']['hre'+'f'] = 'https://' + location.hostname + '/?t=' + SETTINGS.topic + '#newpost';
                        }, 2000);
                    });
                });

                if (autoDismiss) {
                    closeBtn.addEventListener('click', function() { minimizeToBubble(card, birthdays); });
                    setTimeout(function() { minimizeToBubble(card, birthdays); }, SETTINGS.toast_duration);
                } else {
                    closeBtn.addEventListener('click', function() {
                        if (card.parentNode) card.parentNode.removeChild(card);
                        showBubble(birthdays);
                    });
                }
            }

            // --- Minimizza a bubble ---
            function minimizeToBubble(card, birthdays) {
                if (!card || card._minimizing) return;
                card._minimizing = true;
                card.style.animation = 'bgr-shrink .4s forwards';
                setTimeout(function() {
                    if (card.parentNode) card.parentNode.removeChild(card);
                    if (ST.get('bgr-done') === today) return;
                    showBubble(birthdays);
                }, 400);
            }

            // --- Bubble ---
            function showBubble(birthdays) {
                document.body.insertAdjacentHTML('beforeend', '<button id="bgr-bubble" title="Compleanni di oggi!"><i class="fa fa-birthday-cake"></i></button>');
                var bubble = document.getElementById('bgr-bubble');
                bubble.addEventListener('click', function() {
                    if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
                    showCardFromBubble(birthdays);
                });
            }

            // --- Helpers ---
            function buildNamesList(birthdays) {
                var html = '';
                for (var i = 0; i < birthdays.length; i++) {
                    if (i > 0) html += ', ';
                    html += '<a class="bgr-name" href="https://' + location.hostname + birthdays[i].url + '">' + birthdays[i].nickname + '</a>';
                }
                return html;
            }

        }); // fine fetchToken

    }); // fine load

    // --- Font Awesome ---
    function injectFA() {
        if (document.getElementById('bgr-fa')) return;
        var link = document.createElement('link');
        link.id  = 'bgr-fa';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
        document.head.appendChild(link);
    }

    // --- CSS ---
    function injectStyles() {
        if (document.getElementById('bgr-styles')) return;
        var css = '@keyframes bgr-slideIn {from {opacity:0;transform:translateY(20px) scale(.95)} to {opacity:1;transform:translateY(0) scale(1)}}'
            + '@keyframes bgr-shrink {from {opacity:1;transform:scale(1)} to {opacity:0;transform:scale(.5)}}'
            + '@keyframes bgr-bubbleIn {from {opacity:0;transform:scale(0)} to {opacity:1;transform:scale(1)}}'
            + '#bgr-card {position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;align-items:flex-start;gap:14px;background:linear-gradient(135deg,#292354 0%,#0B486B 100%);border-radius:20px;box-shadow:0 16px 48px rgba(11,72,107,.5);padding:22px 24px;max-width:320px;animation:bgr-slideIn .4s cubic-bezier(.22,1,.36,1) forwards;border-top:3px solid #79BD9A;border-bottom:3px solid #79BD9A;font-family:Montserrat,inherit}'
            + '#bgr-card .bgr-close {position:absolute;top:10px;right:12px;background:none;border:none;font-size:11px;color:rgba(143,190,186,.4);cursor:pointer;padding:2px 4px}'
            + '#bgr-card .bgr-close:hover {color:#79BD9A}'
            + '#bgr-card .bgr-icon {width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#79BD9A,#CFF09E);display:flex;align-items:center;justify-content:center;font-size:21px;color:#0B486B;flex-shrink:0}'
            + '#bgr-card .bgr-body {display:flex;flex-direction:column;gap:6px;padding-right:14px}'
            + '#bgr-card .bgr-title {margin:0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(90deg,#79BD9A,#CFF09E);-webkit-background-clip:text;-webkit-text-fill-color:transparent}'
            + '#bgr-card .bgr-subtitle {margin:0;font-size:13px;font-weight:500;color:#8FBEBA;line-height:1.55}'
            + '#bgr-card .bgr-name {font-weight:800;color:#CFF09E;text-decoration:none;-webkit-text-fill-color:#CFF09E}'
            + '#bgr-card .bgr-name:hover {text-decoration:underline}'
            + '#bgr-card .bgr-btn {margin-top:10px;padding:9px 20px;background:transparent;color:#CFF09E;border:1.5px solid #CFF09E;border-radius:50px;font-family:Montserrat,inherit;font-weight:700;font-size:11px;letter-spacing:.5px;cursor:pointer;align-self:flex-start;transition:.2s}'
            + '#bgr-card .bgr-btn:hover {background:#CFF09E;color:#0B486B;transform:translateY(-2px)}'
            + '#bgr-card .bgr-btn:disabled {opacity:.5;cursor:default}'
            + '#bgr-bubble {position:fixed;bottom:24px;left:24px;z-index:9999;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#292354,#0B486B);color:#79BD9A;border:2px solid #79BD9A;font-size:22px;cursor:pointer;box-shadow:0 4px 20px rgba(11,72,107,.5);animation:bgr-bubbleIn .3s cubic-bezier(.22,1,.36,1) forwards;transition:.3s ease}'
            + '#bgr-bubble:hover {transform:scale(1.1)}';
        var style = document.createElement('style');
        style.id = 'bgr-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

})();
