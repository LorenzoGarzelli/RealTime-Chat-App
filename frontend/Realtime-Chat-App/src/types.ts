import { User } from './util/db';
export type Friend = {
  status: ['bonded', 'pending'];
  user: User;
};

export type MessageReceived = {
  uuid: string;
  content: string;
  to: string;
  from: string;
  timestamp: string;
};
