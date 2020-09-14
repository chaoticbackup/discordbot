import { lang_type } from '../../../common/languages';

declare module 'compliments.json' {
  const value: string[];
  export default value;
}

declare module 'insults.json' {
  const value: string[];
  export default value;
}

declare module 'episodes.json' {
  const value: Partial<Record<lang_type, Record<string, string>>>;
  export default value;
}

declare module 'help.json' {
  const value: Record<string, {
    cmd?: string
    short?: string
    long?: string
  }>;
  export default value;
}
