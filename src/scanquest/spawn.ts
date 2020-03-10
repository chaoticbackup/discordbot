  /**
     * Sends a card image to the configed channel
     */
    private sendCard() {
        let lastScan: Scannable;
        let image: RichEmbed;
    
        // Creatures spawn more often than locations and battlegear
        const rnd = Math.floor(Math.random() * 20);
        if (rnd < 4) {
          [lastScan, image] = this.scan_locations.generate();
        }
        else if (rnd < 5) {
          [lastScan, image] = this.scan_battlegear.generate();
        }
        else {
          [lastScan, image] = this.scan_creature.generate();
        }
    
        (this.bot.channels.get(this.send_channel) as Channel).send(image).catch(() => {});
    
        const lastSpawn = JSON.stringify({
          type: lastScan.card.type,
          info: lastScan.toString()
        });
      }

export default function () {
    
}
