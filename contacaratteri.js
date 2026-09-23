(function() { 
	// 
	// CONTATORE CARATTERI/PAROLE — DESKTOP autonomo (v8) 
	// 
	// Cicla al click: caratteri -> parole -> caratteri validi -> parole valide. 
	window.__toggleCharCountVersion = 8; 
 
	var MODES = ['chars', 'words', 'vchars', 'vwords']; 
	var LABEL = { 
		chars: ' caratteri', 
		words: ' parole', 
		vchars: ' caratteri validi', 
		vwords: ' parole valide' 
	}; 
 
	//selettori DESKTOP (standard vs quirks) &#9472;&#9472; 
	var isStd = (document.compatMode != "BackCompat"); 
	var POST_SEL = isStd ? '.topic .skin_tbl li.post' : '.topic td.post'; 
	var COLOR_SEL= isStd ? '.right > .color' : '.right .color'; 
	// punto di iniezione (default originale: in alto). Per metterlo in basso, 
	// cambia ANCHOR_SEL in quello commentato. 
	var ANCHOR_SEL = isStd ? '.top .mini_buttons.rt' : '.right_top td[align="right"]'; 
	// var ANCHOR_SEL = isStd ? '.bottom .mini_buttons.rt' : '.right_bottom td[align="right"]'; 
 
	// CONTEGGIO 
 
	// LORDO: nodo-contenuto (ultimo td) ripulito, innerHTML. 
	function contentNode(cleanBase) { 
		var tds = cleanBase.querySelectorAll('td'); 
		var host = tds.length ? tds[tds.length - 1] : cleanBase; 
		var d = host.cloneNode(true); 
		d.querySelectorAll('.bottomborder, br').forEach(function(el) { el.remove(); }); 
		return d; 
	} 
	function countGross(cleanBase, countWords) { 
		if (cleanBase == null) return 0; 
		var node = contentNode(cleanBase); 
		var html = (node.innerHTML || '').replace(/\r\n|\r|\n/g, ' '); 
		if (countWords) return countWordsIn(html); 
		return html.replace(/\s/g, '').length; 
	} 
 
	// NETTO: solo testo visibile. 
	function countNet(n, countWords) { 
		if (n == null) return 0; 
		var a, b; 
		if (countWords) { 
			var nb = n.cloneNode(true); 
			nb.innerHTML = nb.innerHTML 
				.replace(/<\/(\w+)[(\s+)]?>/gim, "</$1> ") 
				.replace(/&lt;(.*?)\/(\w+)(.*?)[(\s+)]?&gt;/gim, "&lt;$1/$2$3&gt; "); 
			a = (typeof(nb.innerText) == 'string') ? nb.innerText.trim().replace(/<(.*?) >/gim, "<$1>").replace(/>(\s+)<\//gim, "></") : ''; 
			b = (typeof(nb.textContent) == 'string') ? nb.textContent.trim().replace(/<(.*?) >/gim, "<$1>").replace(/>(\s+)<\//gim, "></") : ''; 
			a = a.split(/\r\n|\r|\n/).join(' '); 
			b = b.split(/\r\n|\r|\n/).join(' '); 
			a = countWordsIn(a); 
			b = countWordsIn(b); 
		} else { 
			a = (typeof(n.innerText) == 'string') ? n.innerText : ''; 
			b = (typeof(n.textContent) == 'string') ? n.textContent : ''; 
			a = a.split(/\r\n|\r|\n/).join(' '); 
			b = b.split(/\r\n|\r|\n/).join(' '); 
			a = a.replace(/\s/g, '').length; 
			b = b.replace(/\s/g, '').length; 
		} 
		return (a > b) ? a : b; 
	} 
 
	function countWordsIn(s) { 
		s = s.replace(/\s+/g, ' ').trim(); 
		if (s === '') return 0; 
		return s.split(' ').length; 
	} 
 
	// COSTRUZIONE NODI 
 
	function buildCleanNode(post) { 
		var src = post.querySelector(COLOR_SEL); 
		if (src == null) return null; 
		var d = src.cloneNode(true); 
		['span.edit', 'div.signature', 'dl.tags'].forEach(function(sel) { 
			d.querySelectorAll(sel).forEach(function(el) { el.remove(); }); 
		}); 
		return d; 
	} 
 
	function buildValidNode(baseNode) { 
		var d = baseNode.cloneNode(true); 
		d.querySelectorAll('.spoiler').forEach(function(el) { el.remove(); }); 
		d.querySelectorAll('.quote_top, .quote').forEach(function(el) { el.remove(); }); 
		d.querySelectorAll('.code_top, .code').forEach(function(el) { el.remove(); }); 
		removeQuoteBoxes(d); 
		return d; 
	} 
 
	function removeQuoteBoxes(root) { 
		var MARKERS = ['\u275D', '\u275E']; 
		var toRemove = []; 
		root.querySelectorAll('div').forEach(function(el) { 
			var txt = el.textContent || ''; 
			if (MARKERS.some(function(m) { return txt.indexOf(m) !== -1; })) { 
				var box = findBoxAncestor(el, root); 
				if (box && toRemove.indexOf(box) === -1) toRemove.push(box); 
			} 
		}); 
		toRemove.forEach(function(el) { if (el.parentNode) el.remove(); }); 
	} 
 
	function findBoxAncestor(el, root) { 
		var cur = el; 
		while (cur && cur !== root) { 
			var style = (cur.getAttribute && cur.getAttribute('style')) || ''; 
			if (/border-radius/i.test(style) && /border-(left|right|top|bottom)\s*:\s*\d/i.test(style)) return cur; 
			cur = cur.parentNode; 
		} 
		return null; 
	} 
 
	// VALORI 
 
	// calcola i 4 valori da un post e li mette nel dataset del link 
	function computeInto(link, post) { 
		var base = buildCleanNode(post); 
		if (base == null) return false; 
		var valid = buildValidNode(base); 
		link.dataset.chars = countGross(base, false); 
		link.dataset.words = countGross(base, true); 
		link.dataset.vchars = countNet(valid, false); 
		link.dataset.vwords = countNet(valid, true); 
		return true; 
	} 
 
	function valueFor(link, mode) { 
		if (mode === 'chars') return link.dataset.chars; 
		if (mode === 'words') return link.dataset.words; 
		if (mode === 'vchars') return link.dataset.vchars; 
		return link.dataset.vwords; 
	} 
 
	// GENERAZIONE CONTATORI 
 
	function inTopic() { return location.search.indexOf('t=') != -1; } 
 
	function generate() { 
		if (!inTopic()) return; 
		var posts = document.querySelectorAll(POST_SEL); 
		posts.forEach(function(post) { 
			var anchor = post.querySelector(ANCHOR_SEL); 
			if (!anchor) return; 
			// gia' presente? salta 
			if (anchor.querySelector('a.ffcharcount')) return; 
 
			var link = document.createElement('a'); 
			link.href = 'javascript:void(0);'; 
			link.className = 'ffcharcount'; 
			link.style.cursor = 'pointer'; 
			link.title = 'Clicca: caratteri / parole / caratteri validi / parole valide'; 
 
			if (!computeInto(link, post)) return; 
			link.dataset.mode = 'chars'; 
			link.textContent = valueFor(link, 'chars') + LABEL.chars; 
 
			anchor.insertAdjacentElement('afterbegin', link); 
		}); 
	} 
 
	// CLICK: cicla le 4 modalita' 
 
	document.addEventListener('click', function(e) { 
		var link = e.target.closest ? e.target.closest('a.ffcharcount') : null; 
		if (!link) return; 
		e.preventDefault(); 
		e.stopPropagation(); 
		var idx = MODES.indexOf(link.dataset.mode); 
		if (idx === -1) idx = 0; 
		var next = MODES[(idx + 1) % MODES.length]; 
		link.dataset.mode = next; 
		link.textContent = valueFor(link, next) + LABEL[next]; 
	}, true); 
 
	// AVVIO 
 
	if (document.readyState === 'loading') { 
		document.addEventListener('DOMContentLoaded', generate); 
	} else { 
		generate(); 
	} 
	// ForumFree a volte popola i post in ritardo: riprova. 
	setTimeout(generate, 500); 
	setTimeout(generate, 1500); 
})();
