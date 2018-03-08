function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function rndrsp(items) {
  return items[Math.floor(Math.random()*items.length)];
}

function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/,|\'/g, '');
}

module.exports = {
	reload,
	rndrsp,
	cleantext
}
