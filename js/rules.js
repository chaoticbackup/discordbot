const PdfReader = require('PdfReader');
const {reload, rndrsp} = require('./shared.js');

module.exports = function(rule) {
	var rules = reload('../config/rules.json');
	var sass = reload('../config/sass.json');

	if (!rule) return rndrsp(sass["!providerule"]);

	// if (rules.hasOwnProperty(rule)) return `${rules[rule]}`;

	// return rndrsp(sass["!norule"]);

	new PdfReader().parseFileItems("../ComprehensiveRules.pdf", function(err, item){
	  if (err)
	    callback(err);
	  else if (!item)
	    callback();
	  else if (item.text)
	    console.log(item.text);
	});
}
