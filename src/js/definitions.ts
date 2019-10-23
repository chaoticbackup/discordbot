import Discord, {RichEmbed, StringResolvable, MessageOptions, Attachment} from 'discord.js';

export interface Channel extends Discord.Channel {
    send(arg0: string | RichEmbed, arg1?:any): Promise<any>;
  };
  
export interface SendFunction extends Function {
    (msg?: StringResolvable, options?: MessageOptions | RichEmbed | Attachment): Promise<any>
}