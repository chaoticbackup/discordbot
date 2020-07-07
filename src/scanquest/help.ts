export default function help() {
  let message = '';

  message += '```md\n!scan <card-name|>\n```'
    + 'Scans the latest active scanquest card or the specified one.\n';

  message += '```md\n!list <type|>\n!scans <type|>\n```'
    + 'Shows a list of your scans. Can be sorted alphabetically 🔽, by type ``!scans Creatures`` or by name 🔎.\n';

  message += '```md\n!trade <@user> [ids]\n```'
    + 'To start a trade use ``!trade @KingRaimusa4`` and tag the player you want to trade with.\n'
    + 'After the other person has accepted, you can both update the trade by the ids. ``!trade @KingRaimusa4 0 1 ...``\n'
    + '(The scan id\'s are the numbers found on the left when you list your scans.)';

  return message;
}
