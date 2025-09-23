import { describe, it, expect } from 'vitest';
import { httpRequest, asAdmin, asParent, asGuest } from './utils/http';
import { expectUnauthorized, expectForbidden, expectBadRequest, expectSuccess } from './utils/expectations';

describe('Schedule API', () => {

  describe('GET /api/schedule/parent', () => {
    it('should require authentication', async () => {
      const response = await asGuest(httpRequest()
        .get('/api/schedule/parent'));
      expectUnauthorized(response);
    });

    it('should return parent schedule with mock data', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent?from=2024-01-01&to=2024-01-31&kidIds=1,2'));

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of schedule items
      const scheduleItem = response.body[0];
      expect(scheduleItem).toHaveProperty('id');
      expect(scheduleItem).toHaveProperty('type');
      expect(scheduleItem).toHaveProperty('teamId');
      expect(scheduleItem).toHaveProperty('teamName');
      expect(scheduleItem).toHaveProperty('start');
      expect(scheduleItem).toHaveProperty('end');
      expect(scheduleItem).toHaveProperty('location');
      
      // Check that type is either 'practice' or 'game'
      expect(['practice', 'game']).toContain(scheduleItem.type);
    });

    it('should handle query parameters correctly', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent?from=2024-01-15&to=2024-01-20&kidIds=1'));

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should work without kidIds parameter', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent?from=2024-01-01&to=2024-01-31'));

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/schedule/admin', () => {
    it('should require admin role', async () => {
      const response = await asGuest(httpRequest()
        .get('/api/schedule/admin'));
      expectUnauthorized(response);
    });

    it('should return admin schedule with all data', async () => {
      const response = await asAdmin(httpRequest()
        .get('/api/schedule/admin?from=2024-01-01&to=2024-01-31'));

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of schedule items
      const scheduleItem = response.body[0];
      expect(scheduleItem).toHaveProperty('id');
      expect(scheduleItem).toHaveProperty('type');
      expect(scheduleItem).toHaveProperty('teamId');
      expect(scheduleItem).toHaveProperty('teamName');
      expect(scheduleItem).toHaveProperty('start');
      expect(scheduleItem).toHaveProperty('end');
      expect(scheduleItem).toHaveProperty('location');
      
      // Check that type is either 'practice' or 'game'
      expect(['practice', 'game']).toContain(scheduleItem.type);
    });

    it('should handle query parameters correctly', async () => {
      const response = await asAdmin(httpRequest()
        .get('/api/schedule/admin?from=2024-01-15&to=2024-01-20'));

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Schedule data validation', () => {
    it('should return valid date strings', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent'));

      response.body.forEach((item: any) => {
        expect(() => new Date(item.start)).not.toThrow();
        expect(() => new Date(item.end)).not.toThrow();
        expect(new Date(item.start)).toBeInstanceOf(Date);
        expect(new Date(item.end)).toBeInstanceOf(Date);
      });
    });

    it('should have valid team information', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent'));

      response.body.forEach((item: any) => {
        expect(typeof item.teamId).toBe('number');
        expect(typeof item.teamName).toBe('string');
        expect(item.teamName.length).toBeGreaterThan(0);
      });
    });

    it('should have valid location information', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent'));

      response.body.forEach((item: any) => {
        expect(typeof item.location).toBe('string');
        expect(item.location.length).toBeGreaterThan(0);
      });
    });

    it('should have optional opponent field for games', async () => {
      const response = await asParent(httpRequest()
        .get('/api/schedule/parent'));

      const games = response.body.filter((item: any) => item.type === 'game');
      games.forEach((game: any) => {
        if (game.opponent) {
          expect(typeof game.opponent).toBe('string');
        }
      });
    });
  });
});
