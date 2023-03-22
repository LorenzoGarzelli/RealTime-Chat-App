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
  status?: MessageStatus;
};
export type MessageSent = {
  uuid: string;
  content: string;
  to: string;
  timestamp: string;
  status?: MessageStatus;
};

export type MessageAck = {
  uuid: string;
  to: string;
  from: string;
  status: MessageStatus;
};

export type MessageStatus = 'read' | 'to read' | 'sent' | 'sending';

export type MessageType = 'received' | 'sent';
