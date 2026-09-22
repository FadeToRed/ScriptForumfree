(function () {
  // ============================================================
  // OVERLAY MANUTENZIONE FORUM (versione GitHub / jsDelivr)
  // Legge la configurazione da window.MNT_CONFIG (blocco inline su ForumFree).
  //   mode 0 = overlay disattivato
  //   mode 1 = accesso solo allo staff (admin, g1-g4)
  //   mode 2 = accesso solo agli amministratori (admin, g1)
  // Vanilla JS ES5, compatibile ForumFree.
  // ============================================================

  if (window.__mntLoaded) return;
  window.__mntLoaded = true;

  var cfg = window.MNT_CONFIG || {};
  var mode = parseInt(cfg.mode, 10) || 0;

  // Rimuove il pre-hide messo dal blocco config
  function unhide() {
    var h = document.documentElement;
    if (h) h.className = h.className.replace(/(^|\s)mnt-pre(?=\s|$)/g, " ");
  }

  if (mode !== 1 && mode !== 2) { unhide(); return; }

  // --- Frasi che scorrono in loop (modificale come vuoi) ---
  var frasi = [
    "Aggiornando il sistema di combattimento...",
    "Sistemando le schede personaggio...",
    "Approvando gli Hatsu...",
    "Contando gli HunterCoin...",
    "Lucidando Arena Forge...",
    "Preparando l'Esame Hunter...",
    "Schiavizzando il Founder...",
    "Incenerendo gli Hatsu troppo OP...",
    "Corrompendo gli Esaminatori...",
    "Abolendo il font Sriracha...",
    "Cercando Ging (ancora)...",
    "Bilanciando le Stats...",
    "Fingendo che sia tutto sotto controllo...",
    "Rimescolando i dadi...",
    "Negoziando con il Ragno...",
    "Sacrificando uno staffer agli d\u00e8i del codice...",
    "Sincronizzando il database...",
    "Ricalibrando i ritardi nelle Quest...",
    "OK...",
    "La Galleria contiene le straordinarie creazioni dei Simmini come te!... Ah, no...",
    "Non voglio auricolari gratuiti"
  ];

  var IMG_URL = "https://upload.forumfree.net/i/ff13982804/Hunter/loading.svg";

  // ------------------------------------------------------------
  // CHI PUO' ENTRARE
  // mode 1 -> admin, g1, g2, g3, g4
  // mode 2 -> admin, g1
  // Override di test via localStorage: mntForceUser / mntForceStaff
  // ------------------------------------------------------------
  function canEnter() {
    var cls = (document.body && document.body.className) || "";
    try {
      if (window.localStorage && localStorage.getItem("mntForceUser") === "1") return false;
      if (window.localStorage && localStorage.getItem("mntForceStaff") === "1") return true;
    } catch (e) {}
    var re = (mode === 2) ? /\b(admin|g1)\b/ : /\b(admin|g1|g2|g3|g4)\b/;
    return re.test(cls);
  }

  function build() {
    if (canEnter()) { unhide(); return; }
    if (document.getElementById("mnt-overlay")) { unhide(); return; }

    // --- Wrapper ---
    var ov = document.createElement("div");
    ov.id = "mnt-overlay";

    // --- Stili iniettati ---
    var st = document.createElement("style");
    st["innerHTML".toString()] =
      "body.mnt-lock *{z-index:auto!important;}" +
      "html.mnt-lock,body.mnt-lock{overflow:hidden!important;height:100%!important;" +
      "position:relative!important;}" +
      "#mnt-overlay{position:fixed;top:0;left:0;right:0;bottom:0;" +
      "width:100vw;height:100vh;min-height:100%;" +
      "z-index: 9;background:#ffffff;color:#000000;" +
      "font-family:'Montserrat',sans-serif;overflow:auto;" +
      "text-align:center;margin:0;padding:0;}" +
      "#mnt-overlay .mnt-box{position:absolute;top:0;left:0;right:0;bottom:0;" +
      "display:flex;flex-direction:column;align-items:center;" +
      "box-sizing:border-box;padding:6vh 20px 8vh;}" +
      "#mnt-overlay .mnt-head{width:100%;max-width:900px;}" +
      "#mnt-overlay h1{font-family:'Calistoga',serif;color:#000000;" +
      "font-size:42px;margin:0 0 14px;line-height:1.2;}" +
      "#mnt-overlay p.mnt-sub{color:#333333;font-size:19px;margin:0;" +
      "line-height:1.5;}" +
      "#mnt-overlay .mnt-load{flex:1 1 auto;width:100%;display:flex;" +
      "flex-direction:column;align-items:center;justify-content:center;}" +
      "#mnt-overlay .mnt-spinner{width:520px;height:416px;max-width:80vw;" +
      "margin:0 auto 18px;}" +
      "#mnt-overlay .mnt-spinner img{display:block;width:100%;height:100%;}" +
      "#mnt-overlay .mnt-ticker{margin-top: -80px;position:relative;width:100%;max-width:640px;" +
      "height:72px;overflow:hidden;}" +
      "#mnt-overlay .mnt-ticker span{position:absolute;top:0;left:0;right:0;" +
      "height:72px;display:flex;align-items:center;justify-content:center;" +
      "color:#555555;font-size:22px;font-style:italic;line-height:1.3;" +
      "opacity:0;}" +
      "#mnt-overlay .mnt-ticker span.on{" +
      "animation:mntSlide 5s ease-in-out forwards;}" +
      "@keyframes mntSlide{" +
      "0%{opacity:0;transform:translateX(-60px);}" +
      "12%{opacity:1;transform:translateX(0);}" +
      "88%{opacity:1;transform:translateX(0);}" +
      "100%{opacity:0;transform:translateX(60px);}}";
    document.head.appendChild(st);

    // --- Contenuto ---
    var box = document.createElement("div");
    box.className = "mnt-box";

    var head = document.createElement("div");
    head.className = "mnt-head";

    var h1 = document.createElement("h1");
    h1["innerHTML".toString()] = "Stiamo aggiornando il forum";

    var sub = document.createElement("p");
    sub.className = "mnt-sub";
    sub["innerHTML".toString()] =
      "Il forum \u00e8 temporaneamente offline per un grosso aggiornamento.<br>" +
      "Tutto dovrebbe tornare operativo entro un paio di giorni. Grazie per la pazienza!";

    head.appendChild(h1);
    head.appendChild(sub);

    var load = document.createElement("div");
    load.className = "mnt-load";

    var spinner = document.createElement("div");
    spinner.className = "mnt-spinner";
    var img = document.createElement("img");
    img.src = IMG_URL;
    img.alt = "";
    spinner.appendChild(img);

    var ticker = document.createElement("div");
    ticker.className = "mnt-ticker";

    var spans = [];
    for (var i = 0; i < frasi.length; i++) {
      var s = document.createElement("span");
      s["innerHTML".toString()] = frasi[i];
      ticker.appendChild(s);
      spans.push(s);
    }

    load.appendChild(spinner);
    load.appendChild(ticker);
    box.appendChild(head);
    box.appendChild(load);
    ov.appendChild(box);

    // ------------------------------------------------------------
    // INIEZIONE + BLOCCO (overlay appeso a <html>, fuori dal body)
    // ------------------------------------------------------------
    function lock() {
      var h = document.documentElement, b = document.body;
      if (h && !/\bmnt-lock\b/.test(h.className)) h.className += " mnt-lock";
      if (b && !/\bmnt-lock\b/.test(b.className)) b.className += " mnt-lock";
    }

    document.documentElement.appendChild(ov);
    lock();
    unhide();

    // --- Guardia ---
    var mo = new MutationObserver(function () {
      if (!document.getElementById("mnt-overlay")) {
        document.documentElement.appendChild(ov);
      }
      lock();
    });
    mo.observe(document.documentElement, { childList: true });

    // --- Loop frasi in ordine casuale (durata = animazione mntSlide, 5s) ---
    function shuffle(arr) {
      for (var j = arr.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = arr[j];
        arr[j] = arr[k];
        arr[k] = tmp;
      }
      return arr;
    }

    if (!spans.length) return;

    var order = [];
    for (var n = 0; n < spans.length; n++) order.push(n);
    shuffle(order);

    var pos = 0;
    var current = order[0];
    spans[current].className = "on";

    setInterval(function () {
      spans[current].className = "";
      pos++;
      if (pos >= order.length) {
        var last = order[order.length - 1];
        shuffle(order);
        if (order.length > 1 && order[0] === last) {
          var swap = order[0];
          order[0] = order[1];
          order[1] = swap;
        }
        pos = 0;
      }
      current = order[pos];
      var next = spans[current];
      void next.offsetWidth; // reflow: riavvia l'animazione
      next.className = "on";
    }, 5000);
  }

  // Aspetta il body: le classi admin/gX stanno li'
  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
