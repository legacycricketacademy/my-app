export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'players' | 'parents' | 'coaches';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  createdBy: string; // userId
  publishAt?: string; // optional schedule
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  audience?: 'all' | 'players' | 'parents' | 'coaches';
  priority?: 'low' | 'normal' | 'high';
  publishAt?: string;
}

export interface ListAnnouncementsParams {
  audience?: string;
}
