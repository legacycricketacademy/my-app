import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/routes';

describe('RSVP API', () => {
  describe('GET /api/rsvps', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/rsvps')
        .expect(401);

      expect(response.body.error).toBe('JWT verification not configured');
    });

    it('should require sessionId parameter', async () => {
      const response = await request(app)
        .get('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .expect(400);

      expect(response.body.error).toBe('sessionId is required');
    });

    it('should return RSVP data for valid session', async () => {
      const response = await request(app)
        .get('/api/rsvps?sessionId=1')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('counts');
      expect(response.body).toHaveProperty('byPlayer');
      
      expect(response.body.counts).toHaveProperty('going');
      expect(response.body.counts).toHaveProperty('maybe');
      expect(response.body.counts).toHaveProperty('no');
      
      expect(Array.isArray(response.body.byPlayer)).toBe(true);
    });

    it('should return different data for admin vs parent', async () => {
      // Admin response
      const adminResponse = await request(app)
        .get('/api/rsvps?sessionId=1')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      // Parent response
      const parentResponse = await request(app)
        .get('/api/rsvps?sessionId=1')
        .set('Authorization', 'Bearer parent-token')
        .expect(200);

      // Admin should see more players
      expect(adminResponse.body.byPlayer.length).toBeGreaterThan(parentResponse.body.byPlayer.length);
    });
  });

  describe('POST /api/rsvps', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .send({ sessionId: 1, playerId: 1, status: 'going' })
        .expect(401);

      expect(response.body.error).toBe('JWT verification not configured');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .send({ sessionId: 1 })
        .expect(400);

      expect(response.body.error).toBe('sessionId, playerId, and status are required');
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .send({ sessionId: 1, playerId: 1, status: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('status must be one of: going, maybe, no');
    });

    it('should create RSVP for authorized player', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .send({ sessionId: 1, playerId: 1, status: 'going', comment: 'Looking forward to it!' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('sessionId', 1);
      expect(response.body).toHaveProperty('playerId', 1);
      expect(response.body).toHaveProperty('status', 'going');
      expect(response.body).toHaveProperty('comment', 'Looking forward to it!');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should reject RSVP for unauthorized player', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .send({ sessionId: 1, playerId: 999, status: 'going' })
        .expect(403);

      expect(response.body.error).toBe('Not authorized to RSVP for this player');
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['going', 'maybe', 'no'];
      
      for (const status of validStatuses) {
        const response = await request(app)
          .post('/api/rsvps')
          .set('Authorization', 'Bearer mock-token')
          .send({ sessionId: 1, playerId: 1, status })
          .expect(200);

        expect(response.body.status).toBe(status);
      }
    });
  });

  describe('Admin Session CRUD', () => {
    describe('POST /api/admin/sessions', () => {
      it('should require admin role', async () => {
        const response = await request(app)
          .post('/api/admin/sessions')
          .send({
            type: 'practice',
            teamId: 1,
            teamName: 'Test Team',
            start: '2024-01-15T10:00:00Z',
            end: '2024-01-15T12:00:00Z',
            location: 'Test Field'
          })
          .expect(401);

        expect(response.body.error).toBe('JWT verification not configured');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/admin/sessions')
          .set('Authorization', 'Bearer admin-token')
          .send({ type: 'practice' })
          .expect(400);

        expect(response.body.error).toBe('type, teamId, teamName, start, end, and location are required');
      });

      it('should validate type enum', async () => {
        const response = await request(app)
          .post('/api/admin/sessions')
          .set('Authorization', 'Bearer admin-token')
          .send({
            type: 'invalid',
            teamId: 1,
            teamName: 'Test Team',
            start: '2024-01-15T10:00:00Z',
            end: '2024-01-15T12:00:00Z',
            location: 'Test Field'
          })
          .expect(400);

        expect(response.body.error).toBe('type must be either "practice" or "game"');
      });

      it('should create session with valid data', async () => {
        const sessionData = {
          type: 'practice',
          teamId: 1,
          teamName: 'Test Team',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T12:00:00Z',
          location: 'Test Field',
          opponent: 'Test Opponent',
          notes: 'Test notes'
        };

        const response = await request(app)
          .post('/api/admin/sessions')
          .set('Authorization', 'Bearer admin-token')
          .send(sessionData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.type).toBe('practice');
        expect(response.body.teamName).toBe('Test Team');
        expect(response.body.location).toBe('Test Field');
        expect(response.body.opponent).toBe('Test Opponent');
        expect(response.body.notes).toBe('Test notes');
        expect(response.body).toHaveProperty('createdAt');
      });
    });

    describe('PATCH /api/admin/sessions/:id', () => {
      it('should require admin role', async () => {
        const response = await request(app)
          .patch('/api/admin/sessions/1')
          .send({ teamName: 'Updated Team' })
          .expect(401);

        expect(response.body.error).toBe('JWT verification not configured');
      });

      it('should update session', async () => {
        const response = await request(app)
          .patch('/api/admin/sessions/1')
          .set('Authorization', 'Bearer admin-token')
          .send({ teamName: 'Updated Team', notes: 'Updated notes' })
          .expect(200);

        expect(response.body.id).toBe(1);
        expect(response.body.teamName).toBe('Updated Team');
        expect(response.body.notes).toBe('Updated notes');
        expect(response.body).toHaveProperty('updatedAt');
      });
    });

    describe('DELETE /api/admin/sessions/:id', () => {
      it('should require admin role', async () => {
        const response = await request(app)
          .delete('/api/admin/sessions/1')
          .expect(401);

        expect(response.body.error).toBe('JWT verification not configured');
      });

      it('should delete session', async () => {
        const response = await request(app)
          .delete('/api/admin/sessions/1')
          .set('Authorization', 'Bearer admin-token')
          .expect(204);

        expect(response.body).toEqual({});
      });
    });
  });

  describe('Data validation', () => {
    it('should handle invalid sessionId format', async () => {
      const response = await request(app)
        .get('/api/rsvps?sessionId=invalid')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.sessionId).toBe(NaN);
    });

    it('should handle missing optional fields in RSVP creation', async () => {
      const response = await request(app)
        .post('/api/rsvps')
        .set('Authorization', 'Bearer mock-token')
        .send({ sessionId: 1, playerId: 1, status: 'going' })
        .expect(200);

      expect(response.body.comment).toBeNull();
    });

    it('should handle optional fields in session creation', async () => {
      const sessionData = {
        type: 'practice',
        teamId: 1,
        teamName: 'Test Team',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T12:00:00Z',
        location: 'Test Field'
      };

      const response = await request(app)
        .post('/api/admin/sessions')
        .set('Authorization', 'Bearer admin-token')
        .send(sessionData)
        .expect(201);

      expect(response.body.opponent).toBeNull();
      expect(response.body.notes).toBeNull();
    });
  });
});
