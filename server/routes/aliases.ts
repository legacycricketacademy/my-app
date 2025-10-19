// server/routes/aliases.ts
import { Router } from 'express';
import { okArray, okObject } from '../utils/ok.js';

const r = Router();

// Announcements: recent
r.get('/announcements/recent', (req, res) => {
  res.json(okArray([]));
});

// Payments: pending summary
r.get('/payments/pending', (req, res) => {
  res.json(okArray([]));
});

// Fitness: team-progress?period=week|month
r.get('/fitness/team-progress', (req, res) => {
  const period = (req.query.period as string) ?? 'week';
  res.json(okObject({ period, progress: [] })); // keep object for charting
});

// Meal plans by age group
r.get('/meal-plans/age-group/:age', (req, res) => {
  res.json(okArray([]));
});

// Sessions: today
r.get('/sessions/today', (req, res) => {
  res.json(okArray([]));
});

export default r;
