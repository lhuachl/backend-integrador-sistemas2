import type { MockUser } from './db';

const memory: {
  users: MockUser[];
} = {
  users: [
    {
      id: 'web-sofia',
      email: 'sofia@flowstate.app',
      name: 'Sofia Chen',
      handle: 'sofia',
      avatar_url: null,
      role: 'user',
      password_hash: 'mockhash',
      verified: 1,
      created_at: new Date().toISOString(),
    },
  ],
};

export function findUserByEmail(email: string): MockUser | null {
  return memory.users.find((u) => u.email === email) ?? null;
}

export function createUser(data: {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  verified?: number;
}): MockUser {
  const user: MockUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    handle: null,
    avatar_url: null,
    role: 'user',
    password_hash: data.password_hash,
    verified: data.verified ?? 0,
    created_at: new Date().toISOString(),
  };
  memory.users.push(user);
  return user;
}

export function verifyUser(_id: string) {
  const user = memory.users.find((u) => u.id === _id);
  if (user) user.verified = 1;
}

export function initDb() {}
export function resetDb() {}
