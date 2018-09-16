
(function() {
	"use strict";

	var supportedLanguages;
	
	function toRootLangs(langs) {
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

				if (supportedLanguages.indexOf(dialect) >= 0) {
					roots.push(dialect);
				}
			}
		}
		
		return roots;
	}

	function getBrowserLangs() {
		return toRootLangs(window.navigator.languages || [
			window.navigator.language,
			window.navigator.userLanguage,
			window.navigator.systemLanguage,
		]);
	}

	function getPreferredLangs() {
		var i;
		var langs = getBrowserLangs();

		var hash = window.location.hash || '';
		if (hash !== '') {
			if (hash[0] === '#') {
				hash = hash.substr(1);
			}

			var tok = hash.split('--');
			hash = tok[tok.length - 1];

			if (supportedLanguages.indexOf(hash) >= 0) {
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

		var separator = document.getElementById('lang-list');
		var langDivs = document.getElementsByClassName('lang');

		supportedLanguages = [];
		for (i = 0; i < langDivs.length; i++) {
			var langDiv = langDivs[i];
			var lang = langDiv.id;

			supportedLanguages.push(lang);
			langDivs[lang] = langDiv;
		}

		var preferredLangs = getPreferredLangs();

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

	var oldClassName = '';

	function updateAndJump() {
		var i;

		update();

		var highlighted = document.getElementsByClassName('highlighted');
		for (i = 0; i < highlighted.length; i++) {
			highlighted[i].className = oldClassName;
		}

		var hash = window.location.hash || '';
		if (hash !== '' && hash[0] === '#') {
			hash = hash.substr(1);

			var el = window.document.getElementById(hash);
			if (el) {
				oldClassName = el.className || '';
				el.className = (oldClassName ? oldClassName + ' ' : '') + 'highlighted';

				if (el.scrollIntoView) {
					el.scrollIntoView();
				}
			}
		}
	}

	window.addEventListener('languagechange', update);
	window.addEventListener('hashchange', updateAndJump);
	updateAndJump();
})();