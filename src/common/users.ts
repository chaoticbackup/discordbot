type User = {
    id: string;
    name: string;
}

export default function (name: string): User {
  const user = users.find(user => user.name === name);
  if (user === undefined) return { name: '', id: '' };
  return user;
}

const users: User[] = [
  {
    name: 'me',
    id: '279331985955094529'
  },
  {
    name: 'daddy',
    id: '140143063711481856'
  },
  {
    name: 'afjak',
    id: '279788856285331457'
  }
];
