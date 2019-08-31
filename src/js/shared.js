export function cleantext(string) {
  //strip comma and apostrophy
  return string.toLowerCase().replace(/[,\'’\-]/g, '');
}

export function escape_text(text) {
  return text
    .replace(/\(|\)/g, (match) => {return ("\\"+match)})
    .replace(/’/g, '\'');
}

export function tribeplural(tribe) {
    switch (tribe) {
        case 'Danian':
            return "Danians";
        case 'Mipedian':
            return "Mipedians";
        case `M'arrillian`:
            return `M'arrillians`;
        case "OverWorld":
        case "OverWorlder":
            return "OverWorlders";
        case "UnderWorld":
        case "UnderWorlder":
            return "UnderWorlders";
        default:
            return tribe;
    }
}

export function moderator(message) {
  return Boolean(
    message.member.roles.find(role => role.name==="Administrator") ||
    message.member.roles.find(role => role.name==="Moderator")
  );
}

let sr = {}; // stored responses
export function rndrsp(items, command) {
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

export function reload(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}
