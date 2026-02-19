export type RoomVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
export type RoomType = 'COMMUNITY' | 'USER';
export type RoomPersistence = 'EPHEMERAL' | 'PERSISTENT';
export type ParticipantRole = 'HOST' | 'PARTICIPANT';

export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  color?: string;
}

export interface RoomParticipant {
  userId: string;
  role: ParticipantRole;
  isOnline: boolean;
  joinedAt: string;
  user: User;
}

export interface Room {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  visibility: RoomVisibility;
  roomType: RoomType;
  persistence: RoomPersistence;
  tags: string[];
  createdBy: string;
  isActive: boolean;
  liveCount: number;
  expiresAt: string | null;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  participants?: RoomParticipant[];
  _count?: {
    participants: number;
  };
}

export interface CreateRoomData {
  title: string;
  description?: string;
  visibility: RoomVisibility;
  persistence: RoomPersistence;
  tags?: string[];
  expiresIn?: number;
}

export interface UpdateRoomData {
  title?: string;
  description?: string;
  visibility?: RoomVisibility;
  thumbnail?: string;
  tags?: string[];
}
