import { RichEmbed } from 'discord.js';

export function donate(): RichEmbed {
  return (
    new RichEmbed()
      .setDescription('[Support the development of Chaotic BackTalk](https://www.paypal.me/ChaoticBackup)')
      .setTitle('Donate')
  );
}
