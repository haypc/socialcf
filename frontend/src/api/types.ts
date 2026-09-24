export type User = { id: string; username: string; email?: string; displayName: string; bio?: string; avatarKey?: string | null; followersCount?: number; followingCount?: number; isFollowing?: boolean };
export type Post = { id: string; caption: string; mediaKey?: string | null; mediaUrl?: string | null; createdAt: string; author: User; likesCount: number; commentsCount: number; liked: boolean };
export type Comment = { id: string; body: string; createdAt: string; author: User };
export type Chat = { id: string; name?: string | null; type: 'direct' | 'group'; createdAt: string; members?: User[]; lastMessage?: { body: string; createdAt: string; author: User } | null };
export type Message = { id: string; chatId: string; body: string; createdAt: string; author: User };
