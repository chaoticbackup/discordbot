function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function rndrsp(items) {
	if (items.length == 1) return items[0];
  return items[Math.floor(Math.random()*items.length)];
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
