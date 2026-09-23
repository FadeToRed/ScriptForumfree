function fgReadConfig() {
  var cfgEl = document.querySelector('fg-config');
  if (cfgEl) {
    try { window.filterGridConfig = JSON.parse(cfgEl.textContent); } catch (e) {}
  }
  var res = window.filterGridConfig || {};
  return res;
}

function fgParseList(str) {
  var out = [], parts, i, p, eq;
  if (!str) return out;
  parts = str.split(',');
  for (i = 0; i < parts.length; i++) {
    p = parts[i].trim();
    if (!p) continue;
    eq = p.indexOf('=');
    if (eq > -1) {
      out.push({ value: p.slice(0, eq).trim(), label: p.slice(eq + 1).trim() });
    } else {
      out.push({ value: p, label: p });
    }
  }
  return out;
}

function filterGrid(opts) {
  var cfg = fgReadConfig();
  var o = Object.assign({
    itemSelector:     '[data-group]',
    gridSelector:     '#filter-grid',
    controlsSelector: '#filter-controls',
    allLabel:         'Tutti',
    groupLabels:      {},
    hiddenClass:      'fg-hidden',
    activeClass:      'fg-active',
    emptyClass:       'fg-empty'
  }, opts || {});

  var controls = document.querySelector(o.controlsSelector);
  var items    = document.querySelectorAll(o.itemSelector);
  if (!controls || !items.length) return;

  var allLabel  = controls.getAttribute('data-fg-all') || o.allLabel;
  var emptyMode = (controls.getAttribute('data-fg-empty') || 'disable').toLowerCase();
  var declared  = fgParseList(controls.getAttribute('data-fg-groups'));

  var count = {}, found = [], i, g;
  for (i = 0; i < items.length; i++) {
    g = items[i].getAttribute('data-group');
    if (!g) continue;
    if (!count[g]) { count[g] = 0; found.push(g); }
    count[g]++;
  }

  var groups = [], used = {};
  for (i = 0; i < declared.length; i++) {
    if (used[declared[i].value]) continue;
    used[declared[i].value] = true;
    groups.push(declared[i]);
  }
  for (i = 0; i < found.length; i++) {
    if (used[found[i]]) continue;
    used[found[i]] = true;
    groups.push({ value: found[i], label: o.groupLabels[found[i]] || found[i] });
  }

  function setActive(btn) {
    btn.style.background  = cfg.activeBackground || '#000';
    btn.style.color       = cfg.activeColor      || '#fff';
    btn.style.borderColor = cfg.activeBorder     || '#000';
  }
  function setInactive(btn) {
    btn.style.background  = cfg.inactiveBackground || 'transparent';
    btn.style.color       = cfg.inactiveColor      || '#000';
    btn.style.borderColor = cfg.inactiveBorder     || '#000';
  }
  function makePill(f, label, active, empty) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute('data-f', f);
    btn.style.cssText = cfg.pillCss || '';
    if (empty) {
      btn.className = o.emptyClass;
      if (emptyMode === 'disable') { btn.disabled = true; btn.style.opacity = '0.45'; btn.style.cursor = 'default'; }
    }
    if (active) { btn.className += (btn.className ? ' ' : '') + o.activeClass; setActive(btn); }
    else { setInactive(btn); }
    return btn;
  }

  if (cfg.controlsCss) controls.style.cssText = cfg.controlsCss;

  var pills = [], isEmpty;
  pills.push(makePill('__all__', allLabel, true, false));
  for (i = 0; i < groups.length; i++) {
    isEmpty = !count[groups[i].value];
    if (isEmpty && emptyMode === 'hide') continue;
    pills.push(makePill(groups[i].value, groups[i].label, false, isEmpty));
  }
  for (i = 0; i < pills.length; i++) controls.appendChild(pills[i]);

  var hoverStyle = document.createElement('style');
  hoverStyle.textContent =
    o.controlsSelector + ' button:not(:disabled):hover { background:' + (cfg.activeBackground || '#000') + ' !important; color:' + (cfg.activeColor || '#fff') + ' !important; border-color:' + (cfg.activeBorder || '#000') + ' !important; }\n' +
    '.' + o.hiddenClass + ' { display:none !important; }';
  document.head.appendChild(hoverStyle);

  controls.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || btn.disabled || !btn.getAttribute('data-f')) return;
    var j, f = btn.getAttribute('data-f');
    for (j = 0; j < pills.length; j++) { pills[j].classList.remove(o.activeClass); setInactive(pills[j]); }
    btn.classList.add(o.activeClass);
    setActive(btn);
    for (j = 0; j < items.length; j++) {
      var match = f === '__all__' || items[j].getAttribute('data-group') === f;
      items[j].classList.toggle(o.hiddenClass, !match);
    }
  });
}

(function wait() {
  if (document.querySelector('#filter-controls') && document.querySelector('[data-group]')) {
    try { filterGrid(); } catch (err) { if (window.console) console.error('filterGrid:', err); }
  } else {
    setTimeout(wait, 50);
  }
})();
