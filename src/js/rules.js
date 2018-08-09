var pdfjsLib = require('pdfjs-dist');
const {reload, rndrsp, cleantext} = require('./shared.js');
const glossary = require('../config/glossary');

module.exports = function(rule) {
	let commands = reload('../config/commands.json');

	if (rule.length < 1) return rndrsp(commands["providerule"]);

	let rules = reload('../config/rules.json');
	let merge = Object.assign({}, rules, glossary);

	for (var key in merge) {
	  if (cleantext(key).indexOf(rule) === 0)
	    return `*${key}*:\n${merge[key]}`;
	}

	return rndrsp(commands["norule"]);

/* This is ignored */
	pdfjsLib.getDocument("./ComprehensiveRules.pdf").then((doc) => {
	  var numPages = doc.numPages;
	  // console.log('# Document Loaded');
	  // console.log('Number of Pages: ' + numPages);
	  // console.log();

	  var lastPromise; // will be used to chain promises
	  lastPromise = doc.getMetadata().then(function (data) {
	    console.log('# Metadata Is Loaded');
	    console.log('## Info');
	    console.log(JSON.stringify(data.info, null, 2));
	    console.log();
	    if (data.metadata) {
	      console.log('## Metadata');
	      console.log(JSON.stringify(data.metadata.getAll(), null, 2));
	      console.log();
	    }
	  });

	  var loadPage = function (pageNum) {
	    return doc.getPage(pageNum).then(function(page) {
	      // console.log('# Page ' + pageNum);
	      // var viewport = page.getViewport(1.0 /* scale */);
	      // console.log('Size: ' + viewport.width + 'x' + viewport.height);
	      // console.log();
	      return page.getTextContent().then(function(content) {
	        // Content contains lots of informationabout the text layout and
	        // styles, but we need only strings at the moment
	        var strings = content.items.map(function(item) {
	          return item.str;
	        });
	        // console.log('## Text Content');
	        var text =strings.join(' ');
	        console.log(text);
	      }).then(function() {
	        console.log();
	      });
	    })
	  };
	  // Loading of the first page will wait on metadata and subsequent loadings
	  // will wait on the previous pages.
	  for (var i = 1; i <= numPages; i++) {
	    lastPromise = lastPromise.then(loadPage.bind(null, i));
	  }
	  return lastPromise;
	}).then(function() {
	  // console.log('# End of Document');
	}, function(err) {
	  console.error('Error: ' + err);
	});

	return rndrsp(commands["norule"]);
}
