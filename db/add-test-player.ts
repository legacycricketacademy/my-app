import { db } from './index';
import { players } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function addTestPlayer() {
  try {
    // Get a parent ID - assuming the first user with 'parent' role
    const [parentUser] = await db.query.users.findMany({
      where: eq(users.role, 'parent'),
      limit: 1
    });

    if (!parentUser) {
      console.error('No parent user found');
      return;
    }

    // Check if we already have a test pending player
    const existingPendingPlayers = await db.query.players.findMany({
      where: eq(players.pendingCoachReview, true)
    });

    if (existingPendingPlayers.length > 0) {
      console.log(`Found ${existingPendingPlayers.length} existing pending players:`);
      existingPendingPlayers.forEach(player => {
        console.log(`- ${player.firstName} ${player.lastName} (ID: ${player.id})`);
      });
      return;
    }

    // Create a test player with pending coach review
    const newPlayer = await db.insert(players).values({
      firstName: 'Test',
      lastName: 'PendingPlayer',
      dateOfBirth: new Date('2015-01-15'),
      ageGroup: 'Under 10',
      parentId: parentUser.id,
      pendingCoachReview: true,
      healthNotes: 'Has asthma, requires inhaler during intense activities',
      parentNotes: 'Loves cricket, has been practicing at home regularly'
    }).returning();

    console.log('Test player added successfully:', newPlayer[0]);
  } catch (error) {
    console.error('Error adding test player:', error);
  }
}

// Import users to fix the typescript error
import { users } from '../shared/schema';

// Run the function
addTestPlayer()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });