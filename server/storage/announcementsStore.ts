import { Announcement } from '../types/announcements.js';
import { randomUUID } from 'crypto';

const _anncs: Announcement[] = [];

export function listAnnouncements(params?: { audience?: string }): Announcement[] {
  let out = [..._anncs];
  if (params?.audience && params.audience !== 'all') out = out.filter(a => a.audience === params.audience);
  return out.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAnnouncement(dto: Omit<Announcement,'id'|'createdAt'|'createdBy'>, userId: string): Announcement {
  const created: Announcement = { ...dto, id: randomUUID(), createdAt: new Date().toISOString(), createdBy: userId };
  _anncs.push(created);
  return created;
}

// Create announcement with user object (for consistency with other stores)
export function createAnnouncementWithUser(dto: Omit<Announcement,'id'|'createdAt'|'createdBy'>, user: { id: string; role: string }): Announcement {
  const created: Announcement = { ...dto, id: randomUUID(), createdAt: new Date().toISOString(), createdBy: user.id };
  _anncs.push(created);
  return created;
}

// Export the store instance for consistency
export const announcementsStore = {
  list: listAnnouncements,
  create: createAnnouncementWithUser
};
