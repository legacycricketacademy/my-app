import { Router } from 'express';
import crypto from 'node:crypto';
import { createAuthMiddleware } from '../auth.js';

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  ageGroup: 'Under 10s' | 'Under 12s' | 'Under 14s' | 'Under 16s' | 'Under 19s' | 'Open';
  playerType: string;
  emergencyContact?: string;
  medicalInformation?: string;
  parentName: string;
  parentEmail: string;
  createdAt: string;
  createdBy: string;
};

// In-memory store for now (can be replaced with database)
const players: Player[] = [];

const router = Router();
router.use(createAuthMiddleware());

// GET /api/players - List all players
router.get('/', (req: any, res) => {
  console.log('PLAYERS_LIST', { userId: req.user?.id, count: players.length });
  
  // Filter by age group if provided
  const ageGroup = req.query.ageGroup;
  let filteredPlayers = players;
  
  if (ageGroup && ageGroup !== 'all') {
    filteredPlayers = players.filter(p => p.ageGroup === ageGroup);
  }
  
  // Sort by newest first
  const sortedPlayers = [...filteredPlayers].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  res.json({ ok: true, data: sortedPlayers });
});

// POST /api/players - Create new player
router.post('/', (req: any, res) => {
  const { 
    firstName, 
    lastName, 
    dateOfBirth, 
    ageGroup, 
    playerType, 
    emergencyContact, 
    medicalInformation, 
    parentName, 
    parentEmail 
  } = req.body;

  console.log('PLAYERS_CREATE', { 
    userId: req.user?.id, 
    body: { firstName, lastName, ageGroup } 
  });

  // Validation
  if (!firstName || !lastName) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'First name and last name are required' 
    });
  }

  if (!parentName || !parentEmail) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Parent name and email are required' 
    });
  }

  if (!dateOfBirth) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Date of birth is required' 
    });
  }

  // Validate date of birth
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Invalid date of birth' 
    });
  }

  // Check if date is in the future
  const now = new Date();
  if (dob.getTime() > now.getTime()) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Date of birth cannot be in the future' 
    });
  }

  // Validate age group
  const validAgeGroups = ['Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open'];
  if (!ageGroup || !validAgeGroups.includes(ageGroup)) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Valid age group is required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(parentEmail)) {
    return res.status(400).json({ 
      ok: false, 
      error: 'validation_error', 
      message: 'Invalid parent email format' 
    });
  }

  try {
    // Create new player
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      dateOfBirth: dob.toISOString(),
      ageGroup,
      playerType: playerType || 'Batsman',
      emergencyContact,
      medicalInformation,
      parentName,
      parentEmail,
      createdAt: new Date().toISOString(),
      createdBy: String(req.user?.id ?? 'system'),
    };

    players.push(newPlayer);

    console.log('PLAYERS_CREATE_SUCCESS', { 
      playerId: newPlayer.id, 
      name: `${firstName} ${lastName}` 
    });

    res.status(201).json({ ok: true, data: { id: newPlayer.id } });
  } catch (error) {
    console.error('PLAYERS_CREATE_ERROR', error);
    res.status(500).json({ 
      ok: false, 
      error: 'server_error', 
      message: 'Failed to create player' 
    });
  }
});

export default router;
