function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

let sr = {}; // stored responses
function rndrsp(items, command) {
	if (items.length == 1) return items[0];
	
	if (!command) {
		return items[Math.floor(Math.random()*items.length)];
	}

	if (!sr[command]) sr[command] = [];

	let rand = Math.floor(Math.random()*items.length);
	// if all response already used, repeat
	if (items.length < sr[command].length + 2) {
		// don't repeat recently used response
		while (sr[command].includes(rand)) {
			rand = Math.floor(Math.random()*items.length);
		}
		sr[command].push(rand); // add to just used array

		setTimeout(
			(() => sr[command].shift()).bind(this), 
			Math.ceil(items.length / 5) * 1000
		);
	}

	return items[rand];
}


function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/[,\'’\-]/g, '');
}

module.exports = {
	reload,
	rndrsp,
	cleantext
}
