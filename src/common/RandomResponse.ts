export default class RandomResponse {
  sr: {[key: string]: any[]} = {}; // stored responses

  rndrsp = <T>(items: T[], command?: string): T => {
    const { sr } = this;

    if (items.length === 1) return items[0];

    if (!command) {
      return items[Math.floor(Math.random() * items.length)];
    }

    if (!sr[command]) sr[command] = [];

    let rand = Math.floor(Math.random() * items.length);

    // Check if most response already used, then skip
    if (items.length > sr[command].length) {
      // otherwise, don't repeat recently used response
      while (sr[command].includes(rand)) {
        rand = Math.floor(Math.random() * items.length);
      }
      sr[command].push(rand); // add to just used array
      setTimeout(
        () => { sr[command].shift(); },
        Math.max(items.length * 2, 30) * 1000
      );
    }

    return items[rand];
  };
}
