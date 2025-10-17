import type { Announcement, CreateAnnouncementRequest, ListAnnouncementsParams } from '../types/announcements.js';

export class AnnouncementsStore {
  private announcements: Announcement[] = [];
  private nextId = 1;

  async list(params: ListAnnouncementsParams = {}): Promise<Announcement[]> {
    let filtered = [...this.announcements];

    if (params.audience) {
      filtered = filtered.filter(a => a.audience === params.audience || a.audience === 'all');
    }

    // Sort by creation date, newest first
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(dto: CreateAnnouncementRequest, userId: string): Promise<Announcement> {
    const announcement: Announcement = {
      id: `announcement_${this.nextId++}`,
      title: dto.title,
      body: dto.body,
      audience: dto.audience || 'all',
      priority: dto.priority || 'normal',
      createdAt: new Date().toISOString(),
      createdBy: userId,
      publishAt: dto.publishAt,
    };

    this.announcements.push(announcement);
    return announcement;
  }

  async getById(id: string): Promise<Announcement | null> {
    return this.announcements.find(a => a.id === id) || null;
  }

  async update(id: string, updates: Partial<Announcement>): Promise<Announcement | null> {
    const index = this.announcements.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.announcements[index] = { ...this.announcements[index], ...updates };
    return this.announcements[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.announcements.findIndex(a => a.id === id);
    if (index === -1) return false;

    this.announcements.splice(index, 1);
    return true;
  }
}
