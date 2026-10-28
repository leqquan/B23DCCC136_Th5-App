import {NavigatorScreenParams} from '@react-navigation/native';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  avatarColor: string;
  createdAt?: number;
}

export type PresenceState = 'online' | 'offline';

export interface UserStatus {
  state: PresenceState;
  lastChanged: number;
}

export type MessageType = 'text' | 'location';

export interface Message {
  id: string;
  senderId: string;
  type: MessageType;
  text?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
}

/** Một dòng trong userChats/{uid}/{otherUid} */
export interface ChatSummary {
  otherUid: string;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: number;
  unread: number;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Chat: {otherUser: AppUser};
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};
