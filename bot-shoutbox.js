(function () {
    const BOT_AVATAR_ORIGINAL = "https://img.forumfree.net/home/img/logo_full.png";

    // Attende che la configurazione sia disponibile
    if (!window.GDRBotConfig) {
        console.warn("[GDRBot] Configurazione non trovata. Assicurati che gdrbot-config.js sia caricato prima.");
        return;
    }

    const config = window.GDRBotConfig;

    // Inietta il bot nell'array interno della shoutbox
    const proto = "proto" + "type";
    const _find = Array[proto].find;
    Array[proto].find = function (fn) {
        if (
            this.length > 0 &&
            this[0] &&
            typeof this[0].startWord === "string" &&
            !this.__gdrBotInjected
        ) {
            this.__gdrBotInjected = true;
            if (!this.some(b => b.startWord === config.startWord)) {
                this.push({
                    name: config.name,
                    startWord: config.startWord,
                    messages: config.messages
                });
            }
            Array[proto].find = _find;
        }
        return _find.apply(this, arguments);
    };

    // Sostituisce gli avatar bot già presenti nel DOM
    function fixAvatars(root) {
        const imgs = root.querySelectorAll ? root.querySelectorAll("img") : [];
        imgs.forEach(img => {
            if (img.src === BOT_AVATAR_ORIGINAL) {
                img.src = config.avatar;
            }
        });
    }

    // Osserva il DOM e corregge gli avatar ogni volta che la shoutbox si aggiorna
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.tagName === "IMG" && node.src === BOT_AVATAR_ORIGINAL) {
                        node.src = config.avatar;
                    }
                    fixAvatars(node);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log("[GDRBot] Pronto.");
})();
