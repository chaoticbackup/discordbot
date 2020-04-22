import { Card } from '../definitions';

export default class API {
  private constructor();
  static getInstance(): API;
  static base_url: string;
  static base_spreadsheet: string;
  get base_image(): string;
  get card_back(): string;
  data: '' | 'local' | 'api';
  rebuild(): Promise<API>;
  find_card_name(text: string): Card[];
  find_cards_by_name(name: string, options?: string[]): Card[];
  cardImage(card: Card): string;
}
