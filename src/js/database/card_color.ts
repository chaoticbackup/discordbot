import {Card} from '../definitions';

export default function (card: Card) {
    if (card.gsx$type == "Battlegear")
      return "#aebdce";
    if (card.gsx$type == "Locations")
      return "#419649";
    if (card.gsx$type == "Attacks")
      return "#586b81";
    switch (card.gsx$tribe) {
      case "OverWorld":
        return "#1994d1";
      case "UnderWorld":
        return "#ce344e";
      case "M'arrillian":
        return "#717981";
      case "Mipedian":
        return "#ba9626";
      case "Danian":
        return "#957167";
      case "Generic":
       if (card.gsx$type == "Creatures")
        return "#b5b5b5";
       else
        return "#4f545c";
    }
    return "#56687e"; // Default color
}