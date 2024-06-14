import { Message, GuildMember } from 'discord.js';

import { donate, msgCatch } from '../../common';
import { SendFunction } from '../../definitions';
import ScanQuestDB from '../database/ScanQuestDB';

export default async (db: ScanQuestDB, message: Message, mentions: string[], send: SendFunction) => {
  if (message.guild) {
    let guildMember: GuildMember;

    if (mentions.length > 0) {
      guildMember = await message.guild.fetchMember(mentions[0]);
    }
    else {
      if (await db.is_receive_channel(message.guild.id, message.channel.id)) {
        return await send(help())
          .then(async () => { await send(donate()); });
      }
      guildMember = (message.member)
        ? message.member
        : await message.guild.fetchMember(message.author);
    }

    return await guildMember.send(help())
      .then(async () => {
        await send('I messaged you the help for the scanquest');
        await guildMember.send(donate());
      })
      // if can't dm, send to channel
      .catch(async (e) => { msgCatch(e); await send(help()); });
  }
  return await send(help())
    .then(async () => { await send(donate()); });
};

const emote_help = `
**List Options:**
:arrow_backward: - Go one page backwards
:arrow_upper_right: - Go to a specific page (type which one in chat after pressing the button)
:arrow_right: - Go one page forwards
:wastebasket: - Clear your use of the command when you're done
:arrow_down: - Sort your scans alphabetically instead of in the order you scanned them
`;

const help = () => `
\`\`\`md
!scan [<card name>]
\`\`\`Scans the latest active scanquest card or the specified one.

\`\`\`md
!list <type|tribe|name|>\n!scans <type|tribe|name|>
\`\`\`Shows a list of your scans. You can specify a name: \`\`!scans Maxxor\`\`, a type or tribe: \`\`!scans Creatures\`\` \`\`!scans OverWorld Creatures\`\`.
You can download your list as .txt with \`\`--download\`\` option.

\`\`\`md
!trade <@user> [<ids>]...
\`\`\`To start a trade use \`\`!trade \`\`<@279331985955094529> and tag the player you want to trade with.
After the other person has accepted, you can both update the trade by the ids. \`\`!trade \`\`<@279331985955094529>\`\` 0 1 ...\`\`
(The scan id\'s are the numbers found on the left when you list your scans.)
${emote_help}
`;
// TODO trade
export const first_scan = (perim: string) => `
Hi there! It looks like this is your first time scanning something, so here's some extra info! This collection of cards is not related to recode. Different cards will spawn based on how active the server is, and can be scanned for the amount of time listed above them in <#${perim}>.
You can see a full list of your scans by typing \`\`!list\`\`,  and navigate it with the buttons at the bottom (the buttons are explained at the bottom of this message). 
${false && 'You can also trade with another person by typing \`!trade <@user>\` and following the prompts.'}
All of this is just for fun, but we hope you enjoy! If you have any other questions, we'll be happy to help in <#135657678633566208>. That's where most of the server hangs out. 
If you need the list of commands again, you can type \`\`!perim help\`\`.
${emote_help}
`;
