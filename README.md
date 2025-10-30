# Legacy Cricket Academy

A modern web platform for managing cricket coaching, player development, and parent engagement.

---

## 🚀 Features

- **Player Management** — Track player profiles, age groups, and progress.
- **Scheduling** — Create and manage coaching sessions with calendar integration.
- **Payments** — Stripe and manual payment support.
- **Parent Portal** — Parents can view schedules, announcements, and payments.
- **Admin Dashboard** — Manage all academy operations in one place.
- **Email Notifications** — Integrated with SendGrid.
- **Responsive Design** — Mobile-first UI using Tailwind CSS + Shadcn UI.

---

## 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React + TypeScript + Vite |
| Backend | Express.js (Node.js 20) |
| ORM | Drizzle ORM (PostgreSQL) |
| Database | PostgreSQL 16+ |
| Auth | Secure cookie/session-based (SameSite=None, Secure) |
| Deployment | Render |
| CI/CD | GitHub Actions + Playwright |
| Email | SendGrid |
| Payments | Stripe |

---

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js **v20+**
- PostgreSQL **v16+**
- Stripe account (optional, for payments)

### 2. Clone and Install
```bash
git clone https://github.com/legacycricketacademy/my-app.git
cd my-app
npm install
```

<<<<<<< HEAD
# Legacy Cricket Academy

Comprehensive cricket academy management system for player development, coaching workflows, and family engagement.

## Features

- **Player Management**: Complete player profiles, age groups, and team organization
- **Session Scheduling**: Training sessions with timezone support and calendar integration
- **Payment Processing**: Manual payment recording + Stripe integration for real-time payments
- **Parent Portal**: Dedicated interface for parents to view schedules, payments, and announcements
- **Admin Dashboard**: Comprehensive management tools for coaches and administrators
- **Real-time Notifications**: Email integration with SendGrid
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## Local PostgreSQL Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Stripe account (for payment processing)

### Installation

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb cricket_dev
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb cricket_dev
```

**Windows:**
Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)

### Stripe Setup

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: 
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy your **Publishable Key** (starts with `pk_`)
   - Copy your **Secret Key** (starts with `sk_`)
3. **Set up Webhook**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Webhook Secret** (starts with `whsec_`)

### Environment Setup

Create a `.env` file in the project root:
```bash
# Database
DATABASE_URL=postgres://localhost:5432/cricket_dev

# Session & Auth
SESSION_SECRET=dev-secret-change-me
NODE_ENV=development

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key
DEFAULT_FROM_EMAIL=your-email@example.com

# Keycloak (Optional - for email verification)
KEYCLOAK_URL=https://your-keycloak-domain.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_EMAIL_VERIFY_ENABLED=true
```

### Email Verification (Keycloak)

The app can display a dismissible banner for users with unverified emails and trigger Keycloak's built-in email verification flow:

**How it works:**
- Users with `email_verified === false` see a banner on authenticated pages
- Clicking "Resend verification email" calls `POST /api/keycloak/resend-verify`
- Server uses Keycloak Admin API to trigger the `VERIFY_EMAIL` required action
- Keycloak sends the verification email (no custom tokens needed)
- Once user clicks the link in the email, Keycloak marks email as verified
- Banner disappears on next login

**Configuration:**
- Requires Keycloak service account with `manage-users` permission
- Uses `KEYCLOAK_CLIENT_SECRET` for service account authentication
- Admin token is cached server-side with automatic refresh
- Feature can be disabled via `KEYCLOAK_EMAIL_VERIFY_ENABLED=false`

**Note:** This does not affect SendGrid integration for transactional emails.

### Development

```bash
# Install dependencies
npm install

# Generate and run database migrations
npm run db:generate
npm run db:migrate

# Seed the database with test data
npm run db:seed

# Start development server
npm run dev
```

### Database Management

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed
```

## Settings

### API Endpoints

The settings system provides persistent storage for user and academy configuration:

**Endpoints:**
- `GET /api/settings/:section` - Fetch settings for a specific section
- `PUT /api/settings/:section` - Update settings for a specific section

**Authentication:** All endpoints require authentication

**Available Sections:**
- `profile` - User profile (name, email, phone)
- `notifications` - Notification preferences (email, SMS, push)
- `payments` - Payment settings (Stripe, currency, receipt email)
- `support` - Support information (contact email, WhatsApp, FAQ)
- **Admin-only sections:**
  - `academy` - Academy configuration (name, timezone, logo)
  - `access` - Access control (invite-only mode)
  - `data` - Data management (export, anonymization)

**Example:**
```bash
# Get profile settings
curl -X GET http://localhost:3000/api/settings/profile \
  -H "Cookie: sid=..." \
  --include

# Update profile settings
curl -X PUT http://localhost:3000/api/settings/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: sid=..." \
  -d '{"fullName": "John Doe", "email": "john@example.com", "phone": "+1234567890"}' \
  --include
```

### How Settings Are Stored

Settings use a **file-based JSON store** (`.data-settings.json`) for persistence:

**Key Strategy:**
- **Admin users**: Settings stored under key `"academy"` (organization-wide)
- **Parent/Coach users**: Settings stored under key `userId` (user-specific)

**Persistence:**
- All settings changes are automatically saved to `.data-settings.json`
- File survives server restarts
- Safe for development and small-scale production use
- **Note:** Add `.data-settings.json` to `.gitignore` to avoid committing sensitive data

**Example file structure:**
```json
{
  "academy": {
    "profile": { "fullName": "Admin User", "email": "admin@academy.com" },
    "academy": { "name": "Elite Cricket Academy", "timezone": "Asia/Kolkata" }
  },
  "user-123": {
    "profile": { "fullName": "Parent Name", "email": "parent@example.com" },
    "notifications": { "email": true, "sms": false, "push": true }
  }
}
```

**Migration Path:**
To migrate to database storage (Postgres), replace `server/storage/settingsStore.ts` with a DB-backed implementation. The API routes remain unchanged.

## Build

```bash
# Build client and server
npm run build

# Start production server
node dist/index.js
```

## Testing

### E2E Tests (Playwright)

**Local Development (with local server):**
```bash
# Run all tests with UI (interactive)
npm run test:e2e:ui

# Run tests in headed mode (watch in browser)
npm run test:e2e:headed

# Run all tests headless
npm run test:e2e

# View last test report
npm run test:e2e:report
```

**Against Render Deployment:**
```bash
# Run tests against live Render app
npm run test:e2e:render
```

**Test Structure:**
- `tests/e2e/smoke.login.spec.ts` - Login flow and authentication
- `tests/e2e/smoke.nav.spec.ts` - Dashboard navigation and sidebar checks
- `tests/e2e/smoke.parent.spec.ts` - Parent portal routes and layout
- `tests/e2e/smoke.schedule-modal.spec.ts` - Schedule dialog scrolling and modals
- `tests/e2e/smoke.session.spec.ts` - Session API and persistence

**Test Credentials:**
- Admin: `admin@test.com` / `Test1234!`
- Parent: `parent@test.com` / `Test1234!`

**CI/CD:**
- Tests run automatically on push to `main` (GitHub Actions)
- Tests run against Render after successful deployment
- Reports and traces saved as artifacts

## Deploy on Render

### Configuration

**Build Command:**
```bash
npm ci --include=dev && npm run build
```

**Pre-Deploy Command:**
```bash
npm run db:migrate
```

**Start Command:**
```bash
node dist/index.js
```

### Environment Variables

Set the following in Render Dashboard:

- `DATABASE_URL` - PostgreSQL connection string (automatically provided by Render Database)
- `NODE_ENV` - Set to `production`
- `SESSION_SECRET` - Generate a random secret (required for sessions)
- `PORT` - Set to `10000` (or use Render's default)

### Session Configuration

The app uses PostgreSQL for session storage in production:
- Sessions are stored in the `session` table (created automatically)
- Cookies are configured with `secure: true` and `sameSite: 'none'` for HTTPS
- Trust proxy is enabled for Render's load balancer

### Why devDependencies are Required

Our build process uses `vite` and `esbuild` which are intentionally kept in `devDependencies`:
- `vite` is used at build-time to bundle the React client
- `esbuild` is used at build-time to bundle the Node.js server
- These tools are NOT needed at runtime, only during the build phase

The `--include=dev` flag ensures these build tools are available during Render's build phase, while keeping the production runtime lean.

### Database Setup

Render will automatically:
1. Create a PostgreSQL database
2. Provide `DATABASE_URL` to your app
3. Run migrations during build via `npm run db:push`

### Troubleshooting

**Build fails with "vite: not found":**
- Ensure Build Command includes `--include=dev` flag
- OR set environment variable `NPM_CONFIG_PRODUCTION=false`

**502 Bad Gateway:**
- Check Render logs for startup errors
- Verify `DATABASE_URL` is set correctly
- Ensure migrations ran successfully

## Testing

```bash
# Run end-to-end tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## Database

```bash
# Push schema changes to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

=======
# Here are your Instructions
>>>>>>> origin/conflict_301025_0703
