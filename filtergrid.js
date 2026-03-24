function filterGrid(opts) {
  var cfg = window.filterGridConfig || {};

  var o = Object.assign({
    itemSelector:     '[data-group]',
    gridSelector:     '#filter-grid',
    controlsSelector: '#filter-controls',
    allLabel:         'Tutti',
    groupLabels:      {},
    hiddenClass:      'fg-hidden',
    activeClass:      'fg-active',
  }, opts || {});

  var controls = document.querySelector(o.controlsSelector);
  var items    = document.querySelectorAll(o.itemSelector);
  if (!controls || !items.length) return;

  var seen = {}, groups = [];
  items.forEach(function(el) {
    var g = el.getAttribute('data-group');
    if (g && !seen[g]) { seen[g] = true; groups.push(g); }
  });

  function setActive(btn) {
    btn.style.background  = cfg.activeBackground  || '#000';
    btn.style.color       = cfg.activeColor       || '#fff';
    btn.style.borderColor = cfg.activeBorder      || '#000';
  }

  function setInactive(btn) {
    btn.style.background  = cfg.inactiveBackground || 'transparent';
    btn.style.color       = cfg.inactiveColor      || '#000';
    btn.style.borderColor = cfg.inactiveBorder     || '#000';
  }

  function makePill(f, label, active) {
    var btn = document.createElement('button');
    btn.textContent   = label;
    btn.dataset.f     = f;
    btn.style.cssText = cfg.pillCss || '';
    if (active) { btn.classList.add(o.activeClass); setActive(btn); }
    else { setInactive(btn); }
    return btn;
  }

  if (cfg.controlsCss) controls.style.cssText = cfg.controlsCss;

  var pills = [];
  pills.push(makePill('__all__', o.allLabel, true));
  groups.forEach(function(g) {
    pills.push(makePill(g, o.groupLabels[g] || g, false));
  });
  pills.forEach(function(p) { controls.appendChild(p); });

  var hoverStyle = document.createElement('style');
  hoverStyle.textContent = [
    o.controlsSelector + ' button:hover { background:' + (cfg.activeBackground || '#000') + ' !important; color:' + (cfg.activeColor || '#fff') + ' !important; border-color:' + (cfg.activeBorder || '#000') + ' !important; }',
    '.' + o.hiddenClass + ' { display:none !important; }',
  ].join('\n');
  document.head.appendChild(hoverStyle);

  controls.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn || !btn.dataset.f) return;
    pills.forEach(function(p) { p.classList.remove(o.activeClass); setInactive(p); });
    btn.classList.add(o.activeClass);
    setActive(btn);
    var f = btn.dataset.f;
    items.forEach(function(el) {
      var match = f === '__all__' || el.getAttribute('data-group') === f;
      el.classList.toggle(o.hiddenClass, !match);
    });
  });
}

(function wait() {
  if (document.querySelector('#filter-controls') && document.querySelector('[data-group]')) {
    filterGrid();
  } else {
    setTimeout(wait, 50);
  }
})();
