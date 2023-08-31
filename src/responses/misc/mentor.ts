import { Message, Role } from 'discord.js';

const mentor_list = async (message: Message) => {
  if (!message.guild) return;

  const { guild, member: { user, nickname } } = message;

  const role: Role = guild.roles.find(role => role.name === 'mentor');

  const members = (await guild.fetchMembers()).members.filter(m => (
    m.roles.has(role.id) &&
    (m.user.presence.status === 'online' || m.user.presence.status === 'idle')
  )).array();

  const list = members.map(m => `<@${m.id}>`).join(' ');

  return (list === '') ?
    'No mentors are online' :
    `${list}\n${nickname ?? user.username} is looking for help`;
};

export default mentor_list;
