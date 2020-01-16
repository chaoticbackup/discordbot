export default class RandomResponse {
    sr: any = {}; // stored responses

    rndrsp = <T>(items: T[], command?: string): T => {
      const sr: any = this.sr;

      if (items.length == 1) return items[0];

      if (!command) {
        return items[Math.floor(Math.random() * items.length)];
      }

      if (!sr[command]) sr[command] = [];

      let rand = Math.floor(Math.random() * items.length);

      // if all response already used, repeat
      if (items.length < sr[command].length + 2) {
        // don't repeat recently used response
        while (sr[command].includes(rand)) {
          rand = Math.floor(Math.random() * items.length);
        }
        sr[command].push(rand); // add to just used array

        setTimeout(
          () => { sr[command].shift() },
          Math.ceil(items.length / 5) * 1000
        );
      }

      return items[rand];
    }
}
