(function() {
	"use strict";

	var currentHash = window.location.hash || '';
	var isHashChanging = true;

	init();

	function init() {
		// Prevent annoying flicker/jump if we're able to avoid it
		if (window.history && window.history.replaceState) {
			interceptHashLinks();

			if (currentHash !== '') {
				window.location.hash = '';
			}

			window.history.replaceState({hash: currentHash}, null, currentHash);

			if (window.addEventListener) {
				window.addEventListener('popstate', onPopState);
			} else {
				// Improbably combination of browser features
				window.attachEvent('popstate', onPopState);
			}
		}

		if (window.addEventListener) {
			window.addEventListener('languagechange', update);
			window.addEventListener('hashchange', onHashChange);
		} else {
			window.attachEvent('languagechange', update);
			window.attachEvent('hashchange', onHashChange);
		}
		
		updateAndJump();
		isHashChanging = false;
	}

	/**
	 * Translate former ISO 639 tags to modern ones.
	 * 
	 * BCP 47 supports both old and new tags but prefers the newer tags.  We exclusively use new tags in our code, so we
	 * need to translate from old to new.
	 */
	function normalizeLangs(code) {
		var aliases = {
			iw: 'he',  // Changed in 1989
			ji: 'yi',  // Changed in 1989
			in: 'id',  // Changed in 1989
		};

		return aliases.hasOwnProperty(code) ? aliases[code] : code;
	}
	
	function toRootLangs(supportedLangs, langs) {
		var roots = [];
		
		for (var i in langs) {
			var lang = langs[i];
			
			if (lang === null || lang === undefined || lang === '') {
				continue;
			}

			var tok = lang.split(/[-_]/);
			var dialects = [];

			tok[0] = normalizeLangs(tok[0].toLowerCase());

			switch (tok.length) {
				case 2:
					tok[1] = tok[1].toUpperCase();
					dialects.push(tok[0] + '-' + tok[1]);
					break;

				case 3:
					tok[1] = tok[1].length === 0 ? '' : tok[1][0].toUpperCase() + tok[1].substring(1).toLowerCase();
					tok[2] = tok[2].toUpperCase();
					dialects.push(tok[0] + '-' + tok[1] + '-' + tok[2]);
					dialects.push(tok[0] + '-' + tok[1]);
					dialects.push(tok[0] + '-' + tok[2]);
					break;
			}

			dialects.push(tok[0]);

			for (var d in dialects) {
				var dialect = dialects[d];

				if (supportedLangs.indexOf(dialect) >= 0) {
					roots.push(dialect);
				}
			}
		}
		
		return roots;
	}

	function getBrowserLangs(supportedLangs) {
		return toRootLangs(supportedLangs, window.navigator.languages || [
			window.navigator.language,
			window.navigator.userLanguage,
			window.navigator.systemLanguage,
		]);
	}

	function getPreferredLangs(supportedLangs) {
		var i;
		var langs = getBrowserLangs(supportedLangs);
		var hash = currentHash;

		if (hash !== '') {
			if (hash[0] === '#') {
				hash = hash.substring(1);
			}

			var tok = hash.split('--');
			hash = tok[tok.length - 1];

			if (supportedLangs.indexOf(hash) >= 0) {
				langs.unshift(hash);
			}
		}
		
		var deduped = [];
		for (i in langs) {
			var lang = langs[i];
			if (deduped.indexOf(lang) < 0) {
				deduped.push(lang);
			}
		}
		langs = deduped;

		return langs;
	};

	function update() {
		var document = window.document;
		var parent = document.getElementById('questions');
		var i;

		var separator = document.getElementById('langs-list');
		var langDivs = document.getElementsByClassName('single-lang');

		var supportedLangs = [];
		for (i = 0; i < langDivs.length; i++) {
			var langDiv = langDivs[i];
			var lang = langDiv.id;

			supportedLangs.push(lang);
			langDivs[lang] = langDiv;
		}

		var preferredLangs = getPreferredLangs(supportedLangs);

		parent.setAttribute('aria-busy', 'true');

		if (parent.children[0] !== separator) {
			parent.removeChild(separator);
			parent.insertBefore(separator, parent.children[0]);
		}

		for (i in preferredLangs) {
			var lang = preferredLangs[i];
			var el = parent.removeChild(document.getElementById(lang));
			parent.insertBefore(el, separator);
		}

		parent.setAttribute('aria-busy', 'false');
	};

	function addClassName(el, className) {
		if (el.className !== '' && el.className !== null && el.className !== undefined) {
			el.className += ' ' + className;
		} else {
			el.className = className;
		}
	}

	// Warning: className must be regex-safe!
	function removeClassName(el, className) {
		if (el.className === '' || el.className === null || el.className === undefined) {
			return;
		}

		el.className = (' ' + el.className + ' ').replace(new RegExp(' ' + className + ' ', 'g'), ' ').trim();
	}

	function updateAndJump() {
		var i;

		update();

		var highlighted = document.getElementsByClassName('highlighted');
		for (i = 0; i < highlighted.length; i++) {
			removeClassName(highlighted[i], 'highlighted');
		}

		var hash = currentHash || '';
		if (hash !== '' && hash[0] === '#') {
			hash = hash.substring(1);

			var el = window.document.getElementById(hash);
			if (el) {
				addClassName(el, 'highlighted');

				if (el.scrollIntoView) {
					if (el.scrollIntoView) {
						el.scrollIntoView();
					}

					var focusable = el;

					while (focusable && !focusable.hasAttribute('tabindex') || focusable.getAttribute('tabindex') === '') {
						focusable = focusable.parentNode || null;
					}

					if (focusable && focusable.focus) {
						focusable.focus();
					}
				}
			}
		}
	}

	function onHashLinkClick(event) {
		var target = event.currentTarget;
		var hash = target.getAttribute('href');

		if (!hash || hash[0] !== '#') {
			// Logical error; non-standard, unsupported browser behavior
			return;
		}

		event.preventDefault();

		currentHash = hash;
		window.history.pushState({hash: hash}, null, hash);  // Support for this has already been tested.
		updateAndJump();
	}

	function interceptHashLinks() {
		var links = document.getElementsByTagName('a');

		for (var i = 0; i < links.length; i++) {
			var link = links[i];
			var href = link.getAttribute('href');

			if (href[0] === '#') {
				link.addEventListener('click', onHashLinkClick);
			}
		}
	}

	function onPopState(event) {
		if (isHashChanging || !event.state) {
			return;
		}
		isHashChanging = true;

		currentHash = event.state.hash || '';

		updateAndJump();
		isHashChanging = false;
	}

	function onHashChange() {
		if (isHashChanging || !window.location.hash || window.location.hash === currentHash) {
			return;
		}
		isHashChanging = true;

		currentHash = window.location.hash;

		if (window.history.replaceState) {
			window.history.replaceState({hash: currentHash}, null, currentHash);
		}

		updateAndJump();

		isHashChanging = false;
	}
})();