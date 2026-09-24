(function () {
  var O = {
    itemSelector:     '[data-group]',
    controlsSelector: '#filter-controls',
    allLabel:         'Tutti',
    hiddenClass:      'fg-hidden',
    activeClass:      'fg-active',
    emptyClass:       'fg-empty'
  };

  function readConfig() {
    var el = document.querySelector('fg-config');
    if (el) {
      try { window.filterGridConfig = JSON.parse(el.textContent); } catch (e) {}
    }
    var res = window.filterGridConfig || {};
    return res;
  }

  function parseList(str) {
    var out = [], parts, i, p, eq;
    if (!str) return out;
    parts = str.split(',');
    for (i = 0; i < parts.length; i++) {
      p = parts[i].trim();
      if (!p) continue;
      eq = p.indexOf('=');
      if (eq > -1) out.push({ value: p.slice(0, eq).trim(), label: p.slice(eq + 1).trim() });
      else out.push({ value: p, label: p });
    }
    return out;
  }

  function countGroups() {
    var items = document.querySelectorAll(O.itemSelector), count = {}, found = [], i, g;
    for (i = 0; i < items.length; i++) {
      g = items[i].getAttribute('data-group');
      if (!g) continue;
      if (!count[g]) { count[g] = 0; found.push(g); }
      count[g]++;
    }
    return { items: items, count: count, found: found };
  }

  function paint(btn, active) {
    var cfg = readConfig();
    if (active) {
      btn.style.background  = cfg.activeBackground || '#000';
      btn.style.color       = cfg.activeColor      || '#fff';
      btn.style.borderColor = cfg.activeBorder     || '#000';
    } else {
      btn.style.background  = cfg.inactiveBackground || 'transparent';
      btn.style.color       = cfg.inactiveColor      || '#000';
      btn.style.borderColor = cfg.inactiveBorder     || '#000';
    }
  }

  function injectStyle() {
    if (document.getElementById('fg-style')) return;
    var cfg = readConfig();
    var s = document.createElement('style');
    s.id = 'fg-style';
    s.textContent =
      O.controlsSelector + ' button:not(:disabled):hover { background:' + (cfg.activeBackground || '#000') + ' !important; color:' + (cfg.activeColor || '#fff') + ' !important; border-color:' + (cfg.activeBorder || '#000') + ' !important; }\n' +
      '.' + O.hiddenClass + ' { display:none !important; }';
    (document.head || document.documentElement).appendChild(s);
  }

  function build(controls) {
    var cfg = readConfig();
    var data = countGroups();
    if (!data.items.length) return false;
    var emptyMode = (controls.getAttribute('data-fg-empty') || 'disable').toLowerCase();
    var declared  = parseList(controls.getAttribute('data-fg-groups'));
    var groups = [], used = {}, i, btn, isEmpty;

    for (i = 0; i < declared.length; i++) {
      if (used[declared[i].value]) continue;
      used[declared[i].value] = true;
      groups.push(declared[i]);
    }
    for (i = 0; i < data.found.length; i++) {
      if (used[data.found[i]]) continue;
      used[data.found[i]] = true;
      groups.push({ value: data.found[i], label: data.found[i] });
    }

    while (controls.firstChild) controls.removeChild(controls.firstChild);
    if (cfg.controlsCss) controls.style.cssText = cfg.controlsCss;

    function pill(f, label, active, empty) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('data-f', f);
      b.style.cssText = cfg.pillCss || '';
      if (empty) {
        b.className = O.emptyClass;
        if (emptyMode === 'disable') { b.disabled = true; b.style.opacity = '0.45'; b.style.cursor = 'default'; }
      }
      if (active) b.className += (b.className ? ' ' : '') + O.activeClass;
      paint(b, active);
      controls.appendChild(b);
    }

    pill('__all__', controls.getAttribute('data-fg-all') || O.allLabel, true, false);
    for (i = 0; i < groups.length; i++) {
      isEmpty = !data.count[groups[i].value];
      if (isEmpty && emptyMode === 'hide') continue;
      pill(groups[i].value, groups[i].label, false, isEmpty);
    }
    for (i = 0; i < data.items.length; i++) data.items[i].classList.remove(O.hiddenClass);
    controls.setAttribute('data-fg-built', data.items.length);
    return true;
  }

  function ensure() {
    var controls = document.querySelector(O.controlsSelector);
    if (!controls) return;
    injectStyle();
    var hasPills = controls.querySelector('button[data-f]');
    var built = controls.getAttribute('data-fg-built');
    var now = document.querySelectorAll(O.itemSelector).length;
    if (!hasPills || String(now) !== built) build(controls);
  }

  function onClick(e) {
    var t = e.target;
    var btn = t && t.closest ? t.closest(O.controlsSelector + ' button[data-f]') : null;
    if (!btn || btn.disabled) return;
    var controls = btn.parentNode;
    var pills = controls.querySelectorAll('button[data-f]');
    var items = document.querySelectorAll(O.itemSelector);
    var f = btn.getAttribute('data-f'), i;
    for (i = 0; i < pills.length; i++) { pills[i].classList.remove(O.activeClass); paint(pills[i], false); }
    btn.classList.add(O.activeClass);
    paint(btn, true);
    for (i = 0; i < items.length; i++) {
      items[i].classList.toggle(O.hiddenClass, f !== '__all__' && items[i].getAttribute('data-group') !== f);
    }
  }

  function safeEnsure() {
    try { ensure(); } catch (err) { if (window.console) console.error('filterGrid:', err); }
  }

  if (window.__fgBound) return;
  window.__fgBound = true;
  document.addEventListener('click', onClick);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeEnsure);
  else safeEnsure();
  window.addEventListener('load', safeEnsure);

  var ticks = 0;
  (function watch() {
    safeEnsure();
    if (++ticks < 30) setTimeout(watch, 500);
  })();

  window.filterGrid = safeEnsure;
})();
