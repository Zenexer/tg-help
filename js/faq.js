
(function() {
	"use strict";

	var currentHash = window.location.hash || '';
	var isHashChanging = true;

	init();

	function init() {
		// Prevent annoying flicker/jump if we're able to avoid it
		if (window.history.replaceState) {
			interceptHashLinks();

			if (currentHash !== '') {
				window.location.hash = '';
			}

			window.history.replaceState({hash: currentHash}, null, currentHash);

			window.addEventListener('popstate', onPopState);
		}

		window.addEventListener('languagechange', update);
		window.addEventListener('hashchange', onHashChange);
		
		updateAndJump();
		isHashChanging = false;
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

			tok[0] = tok[0].toLowerCase();

			switch (tok.length) {
				case 2:
					tok[1] = tok[1].toUpperCase();
					dialects.push(tok[0] + '-' + tok[1]);
					break;

				case 3:
					tok[1] = tok[1].length === 0 ? '' : tok[1][0].toUpperCase() + tok[1].substr(1).toLowerCase();
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
		console.debug("Preferred hash: " + hash);
		if (hash !== '') {
			if (hash[0] === '#') {
				hash = hash.substr(1);
			}

			var tok = hash.split('--');
			hash = tok[tok.length - 1];

			if (supportedLangs.indexOf(hash) >= 0) {
				langs.unshift(hash);
			} else {
				console.warn("Preferred language doesn't exist: " + hash);
				console.warn("Supported languages: " + supportedLangs.join(','))
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

		console.debug("Preferred langs: " + langs.join(", "));

		return langs;
	};

	function update() {
		var document = window.document;
		var parent = document.getElementById('questions');
		var i;

		var separator = document.getElementById('lang-list');
		var langDivs = document.getElementsByClassName('lang');

		var supportedLangs = [];
		for (i = 0; i < langDivs.length; i++) {
			var langDiv = langDivs[i];
			var lang = langDiv.id;

			supportedLangs.push(lang);
			langDivs[lang] = langDiv;
		}

		var preferredLangs = getPreferredLangs(supportedLangs);

		if (parent.children[0] !== separator) {
			parent.removeChild(separator);
			parent.insertBefore(separator, parent.children[0]);
		}

		for (i in preferredLangs) {
			var lang = preferredLangs[i];
			var el = parent.removeChild(document.getElementById(lang));
			parent.insertBefore(el, separator);
		}
	};

	var oldClassName = null;

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
			hash = hash.substr(1);

			var el = window.document.getElementById(hash);
			if (el) {
				addClassName(el, 'highlighted');

				if (el.scrollIntoView) {
					console.log("Scrolling into view: " + hash);
					el.scrollIntoView();
				}
			}
		}
	}

	function onHashLinkClick(event) {
		var target = event.currentTarget;
		var hash = target.getAttribute('href');

		if (!hash || hash[0] !== '#') {
			// Logical error; non-standard, unsupported browser behavior
			console.error("Logical error: " + target);
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
		if (isHashChanging) {
			console.debug("popstate: Hash is changing");
			return;
		}
		if (!event.state) {
			console.debug("popstate: On page load");
			return;
		}
		isHashChanging = true;

		currentHash = event.state.hash || '';
		console.log("Normal: " + currentHash);

		updateAndJump();
		isHashChanging = false;
	}

	function onHashChange() {
		if (isHashChanging || !window.location.hash || window.location.hash === currentHash) {
			return;
		}
		isHashChanging = true;

		currentHash = window.location.hash;
		console.log("Overriding: " + currentHash);

		if (window.history.replaceState) {
			window.history.replaceState({hash: currentHash}, null, currentHash);
		}

		updateAndJump();

		isHashChanging = false;
	}
})();