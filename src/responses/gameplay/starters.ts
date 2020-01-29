const starters = require('../config/starters.json');

export default function (options: string[]): string {
  if (options.includes('metal'))
  { return display_starter('metal'); }
  else if (options.includes('king'))
  { return display_starter('king'); }
  return display_starter('metal');
}

function display_starter(name: string) {
  const starter = starters[name];
  let resp = '';
  Object.keys(starter).forEach((tribe) => {
    resp += `${icon(tribe)}${tribe}: <${starter[tribe]}>\n`;
  });
  return resp;
}

function icon(tribe: string): string {
  switch (tribe) {
    case 'OverWorld':
      return '<:OW:294939978897555457>';
    case 'UnderWorld':
      return '<:UW:294943282943885313>';
    case 'Mipedian':
      return '<:Mip:294941790052679690>';
    case 'Danian':
      return '<:Dan:294942889337683968>';
    case "M'arrillian":
      return '<:Mar:294942283273601044>';
    default:
      return '<:TL:294945357392248833>';
  }
}
