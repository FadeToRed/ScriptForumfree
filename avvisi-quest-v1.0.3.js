/**
 * HxH — Avvisi forum su Telegram (quest e presentazioni)
 *
 * QUEST: quando l'utente pubblica una risposta in un topic, avvisa il primo
 * bot Telegram. È il bot a decidere se quel topic è una quest attiva
 * (scheda Quest del foglio): per le altre discussioni non succede nulla.
 *
 * PRESENTAZIONI: quando l'utente apre un topic nella sezione Benvenuti,
 * avvisa il bot che un nuovo utente si è presentato. Le altre sezioni
 * vengono ignorate già qui.
 *
 * Funziona da solo, senza HxHFramework. Il bundle mobile ne contiene una copia.
 *
 * Come funziona:
 *  1. all'invio del modulo (risposta o nuova discussione) segna cosa è
 *     stato inviato in sessionStorage;
 *  2. al caricamento successivo, se si è arrivati nel topic entro pochi
 *     minuti, il post è stato pubblicato: parte l'avviso.
 *  Anteprime e modifiche non generano avvisi.
 *
 * @version 1.1.0
 */

;(function() {

var DOMINI = [
    'graficaxskinxelaborazione.forumfree.it',  // Forum di prova
    'hxhforumgdr.forumcommunity.net'           // Forum reale
];
if (DOMINI.indexOf(location.hostname) === -1) return;

// Se anche il bundle mobile è caricato nella pagina, gira una sola copia
if (window.__hxhAvvisiQuest) return;
window.__hxhAvvisiQuest = true;

// ----- Configurazione
var BOT_URL    = 'https://script.google.com/macros/s/AKfycbz5wsCc8_65goInXEQ50yoN3_eU4EIWE61vgRYy--3OTmrWEiF44qUZvn6plyE3YsU/exec';      // proprietà WEBAPP_URL del primo bot
var BOT_CHIAVE = '0000000123:ASDFkqN9qDbhS_kgjsPcGDlsie2YLdgwm1Q'; // proprietà SEGRETO_FORUM del primo bot
var DEBUG      = false;                       // true per vedere i passaggi nella console

// Sezione "Benvenuti" di ciascun forum
var SEZIONE_BENVENUTI = {
    'graficaxskinxelaborazione.forumfree.it': '65073496',
    'hxhforumgdr.forumcommunity.net':         '9046710'
};

var CHIAVE_QUEST = 'hxh-avviso-quest';
var CHIAVE_PRES  = 'hxh-avviso-presentazione';
var VALIDITA     = 3 * 60 * 1000; // l'arrivo nel topic deve avvenire entro 3 minuti

function log(testo) {
    if (DEBUG) console.log('[HxH avvisi forum] ' + testo);
}

function campo(form, nome) {
    var el = form && form.elements ? form.elements[nome] : null;
    if (el && el.length !== undefined && el.value === undefined) el = el[0]; // più campi con lo stesso nome
    return el && el.value !== undefined ? String(el.value) : '';
}

function leggi(chiave) {
    try { return JSON.parse(sessionStorage.getItem(chiave) || 'null'); } catch (e) { return null; }
}

function inviaAlBot(dati) {
    fetch(BOT_URL + '?f=' + BOT_CHIAVE, {
        method: 'POST',
        mode:   'no-cors',
        body:   JSON.stringify(dati)
    }).then(function() {
        log('avviso inviato: ' + JSON.stringify(dati));
    }).catch(function(e) {
        log('errore di invio: ' + e);
    });
}

// ----- 1. Invio del modulo

function segnaInvio(form, pulsante) {
    try {
        if (!form || campo(form, 'act').toLowerCase() !== 'post') return;
        if (pulsante && /preview|anteprima/i.test((pulsante.name || '') + ' ' + (pulsante.value || ''))) {
            log('anteprima, nessun avviso');
            return;
        }
        var code = campo(form, 'CODE');

        if (code === '03') {                                   // risposta
            var t = campo(form, 't');
            if (!/^\d+$/.test(t)) return;
            sessionStorage.setItem(CHIAVE_QUEST, JSON.stringify({ t: t, ts: Date.now() }));
            log('risposta inviata nel topic ' + t);

        } else if (code === '01') {                            // nuova discussione
            var f = campo(form, 'f');
            if (!f || f !== SEZIONE_BENVENUTI[location.hostname]) return;
            sessionStorage.setItem(CHIAVE_PRES, JSON.stringify({ f: f, ts: Date.now() }));
            log('nuova presentazione inviata');
        }
    } catch (e) {}
}

// Invio con il pulsante...
document.addEventListener('submit', function(ev) {
    segnaInvio(ev.target, ev.submitter);
}, true);

// ...e invio fatto da script (form.submit() non genera l'evento submit)
var submitOriginale = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function() {
    segnaInvio(this, null);
    return submitOriginale.apply(this, arguments);
};

// ----- 2. Arrivo nel topic

function utente() {
    var u = (window.Commons && window.Commons.user) || {};
    return {
        id:   String(u.id || ''),
        nome: String(u.nickname || u.name || u.username || '')
    };
}

function idTopicCorrente() {
    var m = location.search.match(/[?&]t=(\d+)/) || (document.body.className || '').match(/\bt(\d+)\b/);
    return m ? m[1] : null;
}

function controllaQuest() {
    var dato = leggi(CHIAVE_QUEST);
    if (!dato) return;

    if (Date.now() - dato.ts > VALIDITA) {
        sessionStorage.removeItem(CHIAVE_QUEST);
        log('quest: troppo tempo dall\'invio, annullato');
        return;
    }
    if (document.body.id !== 'topic' || idTopicCorrente() !== dato.t) {
        log('quest: non ancora nel topic, in attesa');
        return;
    }
    sessionStorage.removeItem(CHIAVE_QUEST);

    var u = utente();
    if (!u.nome) { log('quest: nome utente non trovato'); return; }

    inviaAlBot({ t: dato.t, utente: u.nome, uid: u.id, forum: location.hostname, id: dato.ts });
}

function controllaPresentazione() {
    var dato = leggi(CHIAVE_PRES);
    if (!dato) return;

    if (Date.now() - dato.ts > VALIDITA) {
        sessionStorage.removeItem(CHIAVE_PRES);
        log('presentazione: troppo tempo dall\'invio, annullato');
        return;
    }
    var loc = window.Commons && window.Commons.location;
    if (document.body.id !== 'topic' || !loc || !loc.topic || !loc.section ||
        String(loc.section.id) !== dato.f) {
        log('presentazione: non ancora nel topic, in attesa');
        return;
    }
    sessionStorage.removeItem(CHIAVE_PRES);

    // Deve essere un topic nuovo dell'utente: prima pagina, primo post suo
    var u = utente();
    var primo = loc.posts && loc.posts[0];
    if (!loc.isFirstPage || !primo || !primo.author || String(primo.author.id) !== u.id) {
        log('presentazione: il primo post non è dell\'utente, nessun avviso');
        return;
    }
    if (!u.nome) { log('presentazione: nome utente non trovato'); return; }

    inviaAlBot({
        tipo:   'presentazione',
        t:      String(loc.topic.id),
        titolo: String(loc.topic.title || ''),
        utente: u.nome,
        uid:    u.id,
        forum:  location.hostname,
        id:     dato.ts
    });
}

function controlla() {
    controllaQuest();
    controllaPresentazione();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', controlla);
} else {
    controlla();
}

})();
