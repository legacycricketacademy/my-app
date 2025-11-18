import { db } from './index.js';
import { players, users } from '../shared/schema.js';
import { battingMetrics, bowlingMetrics, fieldingMetrics, disciplineMetrics, coachNotes } from './kid-metrics-schema.js';
import { eq } from 'drizzle-orm';

async function seedKidData() {
  try {
    console.log('Seeding kid dashboard data...');

    // Find a parent user (or create one for testing)
    const parentUsers = await db.select().from(users).where(eq(users.role, 'parent')).limit(1);
    
    if (parentUsers.length === 0) {
      console.log('No parent users found. Please create a parent user first.');
      process.exit(1);
    }

    const parentId = parentUsers[0].id;
    console.log(`Using parent ID: ${parentId}`);

    // Check if this parent already has kids
    const existingKids = await db.select().from(players).where(eq(players.parentId, parentId));
    
    let kidId: number;
    
    if (existingKids.length > 0) {
      kidId = existingKids[0].id;
      console.log(`Using existing kid ID: ${kidId}`);
    } else {
      // Create a demo kid
      const newKid = await db.insert(players).values({
        academyId: 1,
        firstName: 'Rahul',
        lastName: 'Sharma',
        dateOfBirth: '2012-05-15',
        ageGroup: 'U13',
        location: 'Strongsville',
        parentId: parentId,
        emergencyContact: '555-0123',
      }).returning();
      
      kidId = newKid[0].id;
      console.log(`Created new kid ID: ${kidId}`);
    }

    // Add batting metrics
    await db.insert(battingMetrics).values({
      academyId: 1,
      playerId: kidId,
      recordDate: '2024-11-01',
      footwork: 4,
      shotSelection: 3,
      batSwingPath: 4,
      balancePosture: 4,
      notes: 'Good progress on footwork. Need to work on shot selection.',
    }).onConflictDoNothing();

    // Add bowling metrics
    await db.insert(bowlingMetrics).values({
      academyId: 1,
      playerId: kidId,
      recordDate: '2024-11-01',
      runUpRhythm: 3,
      loadGather: 4,
      releaseConsistency: 3,
      lineLength: 4,
      notes: 'Consistent line and length. Work on rhythm.',
    }).onConflictDoNothing();

    // Add fielding metrics
    await db.insert(fieldingMetrics).values({
      academyId: 1,
      playerId: kidId,
      recordDate: '2024-11-01',
      throwingAccuracy: 4,
      catching: 5,
      groundFielding: 4,
      notes: 'Excellent catching skills. Strong fielder.',
    }).onConflictDoNothing();

    // Add discipline metrics
    await db.insert(disciplineMetrics).values({
      academyId: 1,
      playerId: kidId,
      recordDate: '2024-11-01',
      focus: 4,
      teamwork: 5,
      coachability: 5,
      notes: 'Great attitude and team player.',
    }).onConflictDoNothing();

    // Add coach notes
    const coachUsers = await db.select().from(users).where(eq(users.role, 'coach')).limit(1);
    const coachId = coachUsers.length > 0 ? coachUsers[0].id : 1;

    await db.insert(coachNotes).values([
      {
        academyId: 1,
        playerId: kidId,
        coachId: coachId,
        noteDate: '2024-11-15',
        content: 'Excellent session today. Showed great improvement in batting technique.',
        category: 'batting',
      },
      {
        academyId: 1,
        playerId: kidId,
        coachId: coachId,
        noteDate: '2024-11-10',
        content: 'Working on bowling action. Good progress on run-up rhythm.',
        category: 'bowling',
      },
      {
        academyId: 1,
        playerId: kidId,
        coachId: coachId,
        noteDate: '2024-11-05',
        content: 'Great team player. Always encouraging teammates.',
        category: 'general',
      },
    ]).onConflictDoNothing();

    console.log('✅ Kid dashboard data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedKidData();
