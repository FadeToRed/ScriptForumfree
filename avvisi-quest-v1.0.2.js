/**
 * HxH — Avvisi quest su Telegram
 *
 * Quando l'utente pubblica una risposta in un topic, avvisa il primo bot
 * Telegram. È il bot a decidere se quel topic è una quest attiva (scheda
 * Quest del foglio): per le altre discussioni non succede nulla.
 *
 * Funziona da solo, senza HxHFramework, così si può caricare sia nella
 * versione desktop sia in quella mobile.
 *
 * Come funziona:
 *  1. all'invio del modulo di risposta (completa o rapida) segna il topic
 *     in sessionStorage;
 *  2. al caricamento successivo, se si è tornati in quel topic entro pochi
 *     minuti, il post è stato pubblicato: parte l'avviso.
 *  Anteprime, modifiche e nuovi topic non generano avvisi.
 *
 * @version 1.0.1
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

var CHIAVE   = 'hxh-avviso-quest';
var VALIDITA = 3 * 60 * 1000; // il ritorno al topic deve avvenire entro 3 minuti

function log(testo) {
    if (DEBUG) console.log('[HxH avvisi quest] ' + testo);
}

function campo(form, nome) {
    var el = form && form.elements ? form.elements[nome] : null;
    if (el && el.length !== undefined && el.value === undefined) el = el[0]; // più campi con lo stesso nome
    return el && el.value !== undefined ? String(el.value) : '';
}

// ----- 1. Invio del modulo

function segnaInvio(form, pulsante) {
    try {
        if (!form || campo(form, 'act').toLowerCase() !== 'post') return;
        if (campo(form, 'CODE') !== '03') return;           // 03 = nuova risposta
        var t = campo(form, 't');
        if (!/^\d+$/.test(t)) return;
        if (pulsante && /preview|anteprima/i.test((pulsante.name || '') + ' ' + (pulsante.value || ''))) {
            log('anteprima, nessun avviso');
            return;
        }
        sessionStorage.setItem(CHIAVE, JSON.stringify({ t: t, ts: Date.now() }));
        log('risposta inviata nel topic ' + t);
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

// ----- 2. Ritorno nel topic

function idTopicCorrente() {
    var m = location.search.match(/[?&]t=(\d+)/) || (document.body.className || '').match(/\bt(\d+)\b/);
    return m ? m[1] : null;
}

function utente() {
    var u = (window.Commons && window.Commons.user) || {};
    return {
        id:   String(u.id || ''),
        nome: String(u.nickname || u.name || u.username || '')
    };
}

function controlla() {
    var dato = null;
    try { dato = JSON.parse(sessionStorage.getItem(CHIAVE) || 'null'); } catch (e) {}
    if (!dato) return;

    if (Date.now() - dato.ts > VALIDITA) {
        sessionStorage.removeItem(CHIAVE);
        log('troppo tempo dall\'invio, annullato');
        return;
    }
    if (document.body.id !== 'topic' || idTopicCorrente() !== dato.t) {
        log('non ancora nel topic, in attesa');
        return;
    }
    sessionStorage.removeItem(CHIAVE);

    var u = utente();
    if (!u.nome) {
        log('nome utente non trovato');
        return;
    }

    fetch(BOT_URL + '?f=' + BOT_CHIAVE, {
        method: 'POST',
        mode:   'no-cors',
        body:   JSON.stringify({ t: dato.t, utente: u.nome, uid: u.id, forum: location.hostname, id: dato.ts })
    }).then(function() {
        log('avviso inviato per ' + u.nome + ' nel topic ' + dato.t);
    }).catch(function(e) {
        log('errore di invio: ' + e);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', controlla);
} else {
    controlla();
}

})();
