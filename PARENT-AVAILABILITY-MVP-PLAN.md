# Parent Availability MVP - Implementation Plan

## Overview

Build a simple weekly recurring availability feature for parents to mark times when their kid is unavailable, with coach-side visibility during session scheduling.

## Current State

### Existing Features
- ✅ Session-specific availability (`sessionAvailability` table)
- ✅ Parent can mark yes/no/maybe for specific sessions
- ✅ Routes: `/api/parent/kids/:kidId/sessions` and `/api/parent/sessions/:sessionId/availability`
- ✅ Mobile-responsive schedule pages
- ✅ Unified session dialog with date/time pickers

### What's Missing
- ❌ Recurring weekly availability (e.g., "unavailable every Tuesday 3-5pm")
- ❌ Database schema for recurring availability
- ❌ Parent UI to set recurring availability
- ❌ Coach-side visibility of unavailable blocks
- ❌ API routes for recurring availability CRUD

## Implementation Plan

### Phase 1: Database Schema

**New Table: `player_recurring_availability`**
```sql
CREATE TABLE player_recurring_availability (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Migration File:** `db/migrations/XXX_add_recurring_availability.sql`

### Phase 2: Backend API

**File:** `server/routes/parent-availability.ts` (extend existing)

**New Routes:**

1. **GET `/api/parent/availability/:playerId`**
   - Get all recurring availability blocks for a player
   - Validate parent owns the player
   - Return array of availability blocks

2. **POST `/api/parent/availability`**
   - Create new recurring availability block
   - Validate:
     - Parent owns player
     - Day of week (0-6)
     - Start time < end time
     - Time format (HH:MM)
   - Return created block

3. **DELETE `/api/parent/availability/:id`**
   - Delete recurring availability block
   - Validate parent owns the player
   - Return success

**Validation Schema:**
```typescript
const recurringAvailabilitySchema = z.object({
  playerId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
});
```

### Phase 3: Parent UI

**File:** `client/src/pages/parent/PlayerAvailability.tsx` (new)

**Features:**
- Weekly calendar view showing 7 days
- Add availability block button
- List of existing blocks with delete option
- Mobile-responsive (stacked on mobile, grid on desktop)
- Toast notifications for success/error

**Components:**
- `AvailabilityCalendar` - Visual weekly view
- `AddAvailabilityDialog` - Form to add new block
- `AvailabilityBlockCard` - Display existing block with delete

**Responsive Design:**
```tsx
// Mobile: Stack days vertically
<div className="flex flex-col gap-2 sm:grid sm:grid-cols-7">
  {days.map(day => <DayColumn key={day} />)}
</div>
```

### Phase 4: Coach-Side Integration

**File:** `client/src/components/sessions/schedule-session-dialog.tsx` (extend)

**Features:**
- When selecting date/time, fetch unavailable blocks
- Show visual indicators (red overlay, warning icon)
- Display which players are unavailable
- Don't block scheduling, just warn

**API Call:**
```typescript
// GET /api/coach/availability/check?date=2025-11-20&startTime=14:00&endTime=16:00&ageGroup=5-8
// Returns: { unavailablePlayers: [{ id, name, reason }] }
```

### Phase 5: Testing

**E2E Tests:**

1. **`tests/e2e/parent-availability.spec.ts`**
   - Desktop (chromium)
   - Navigate to availability page
   - Add recurring block
   - Verify block appears
   - Delete block
   - Verify no 400/500 errors

2. **`tests/e2e/parent-availability-mobile.spec.ts`**
   - Mobile (webkit/iPhone)
   - Same flow as desktop
   - Verify responsive layout
   - Verify no horizontal scroll

3. **`tests/e2e/coach-availability-check.spec.ts`**
   - Coach creates session
   - Verify unavailable players shown
   - Verify warning displayed

**Unit Tests:**
- `server/routes/parent-availability.test.ts`
- Test all CRUD operations
- Test validation
- Test authorization

## Simplified MVP Scope

Given time constraints, implement a **minimal viable version**:

### What to Include
✅ Simple list-based UI (not calendar view)
✅ Add/delete recurring blocks
✅ Basic validation
✅ Mobile-responsive
✅ E2E tests for happy path
✅ Coach sees count of unavailable players (not detailed view)

### What to Defer
⏸️ Visual calendar view
⏸️ Edit existing blocks (delete + re-add)
⏸️ Bulk operations
⏸️ Advanced filtering
⏸️ Conflict detection

## File Structure

```
server/
  routes/
    parent-availability.ts (extend)
  migrations/
    XXX_add_recurring_availability.sql (new)

client/src/
  pages/parent/
    PlayerAvailability.tsx (new)
  components/availability/
    AddAvailabilityDialog.tsx (new)
    AvailabilityBlockCard.tsx (new)

tests/e2e/
  parent-availability.spec.ts (new)
  parent-availability-mobile.spec.ts (new)

shared/
  schema.ts (extend)
```

## Success Criteria

- ✅ Parent can add recurring unavailability
- ✅ Parent can delete recurring unavailability
- ✅ Data persists in database
- ✅ Mobile-responsive UI
- ✅ No 400/500 errors
- ✅ E2E tests pass on desktop and mobile
- ✅ Existing session scheduling still works
- ✅ No breaking changes to unified dialog

## Timeline Estimate

- Database schema: 30 min
- Backend API: 1 hour
- Parent UI: 2 hours
- Coach integration: 1 hour
- Testing: 1.5 hours
- **Total: ~6 hours**

## Next Steps

1. Create database migration
2. Extend schema.ts
3. Add API routes
4. Build parent UI
5. Add coach-side check
6. Write E2E tests
7. Run full test suite
8. Document changes

---

**Note:** This is a comprehensive plan. For immediate implementation, I recommend starting with the simplified MVP scope to deliver value quickly, then iterate based on feedback.
