export type Audience = 'all' | 'players' | 'parents' | 'coaches';
export type Priority = 'low' | 'normal' | 'high';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  priority: Priority;
  createdAt: string;
  createdBy: string;
  publishAt?: string; // ISO optional
}
