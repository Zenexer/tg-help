
(function() {
	"use strict";

	var supportedLanguages = window.i18n.supportedLanguages;
	var faqs = window.i18n.faqs;
	
	function toRootLangs(langs) {
		var roots = [];
		
		for (var i in langs) {
			var lang = langs[i];
			
			if (lang === null || lang === undefined || lang === '') {
				continue;
			}
			
			var tok = lang.split(/[-_]/);
			lang = tok[0].toLowerCase();
			
			if (supportedLanguages.indexOf(lang) >= 0) {
				roots.push(lang);
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

	function getLangs() {
		var i;
		var langs = getBrowserLangs();

		var hash = window.location.hash || '';
		console.log(hash);
		if (hash !== '') {
			if (hash[0] === '#') {
				hash = hash.substr(1);
			}

			var tok = hash.split('-');
			hash = tok[tok.length - 1];
			hash = hash.toLowerCase();
			console.log(hash);

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
		
		for (i in supportedLanguages) {
			var lang = supportedLanguages[i];
			if (langs.indexOf(lang) < 0) {
				langs.push(lang);
			}
		}

		return langs;
	};

	function appendLang(main, lang) {
		var document = window.document;

		for (var i in faqs) {
			var faq = faqs[i];
			var id = faq.key + '-' + lang;
			var question = faq.question[lang];
			var answer = faq.answer[lang];

			var dt = document.createElement('dt');
			var dd = document.createElement('dd');
			var a = document.createElement('a');
			var span = document.createElement('span');

			span.appendChild(document.createTextNode(question));

			a.href = '#' + id;
			a.appendChild(document.createTextNode('¶'));

			dt.id = id;
			dt.appendChild(span);
			dt.appendChild(document.createTextNode(' '));
			dt.appendChild(a);

			dd.appendChild(document.createTextNode(answer));

			main.appendChild(dt);
			main.appendChild(dd);
		}
	};

	function update() {
		var document = window.document;
		var parent = document.body;
		var main = document.createElement('dl');

		var langs = getLangs();
		for (var l in langs) {
			appendLang(main, langs[l]);
		}

		var oldMain = document.getElementById('main');
		main.id = 'main';
		if (oldMain) {
			parent.replaceChild(main, oldMain);
		} else {
			parent.appendChild(main);
		}
	};

	window.addEventListener('languagechange', update);
	window.addEventListener('hashchange', update);
	update();
})();