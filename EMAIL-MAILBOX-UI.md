# Email Mailbox UI - Development Feature

## Overview
A development-only email mailbox UI that displays all emails captured by the email sandbox during development. This allows you to test email functionality without sending real emails.

## Features

### 1. Email Inbox
- Lists all captured emails with timestamp, type, subject, and recipient
- Shows email count badge
- Auto-refreshes every 5 seconds
- Click any email to preview it

### 2. Email Preview
- View full email details (from, to, subject, type, timestamp)
- Toggle between HTML and plain text views
- Renders HTML emails in a sandboxed iframe
- Shows plain text fallback

### 3. Management Actions
- **Refresh**: Manually refresh the email list
- **Clear All**: Delete all captured emails (with confirmation)
- **Auto-refresh**: Automatically updates every 5 seconds

### 4. Floating Dev Button
- Fixed button in bottom-right corner (development only)
- Shows email count badge when emails are captured
- Quick access to email mailbox from any page
- Only visible in development mode

## Access

### Direct URL
Navigate to: `http://localhost:5000/dev/emails`

### Floating Button
Click the "Dev Emails" button in the bottom-right corner of any page (development only)

## Requirements

Make sure your `.env.local` has:
```env
EMAIL_SANDBOX=true
NODE_ENV=development
```

## Usage Examples

### Testing Registration Emails
1. Go to `/register` and create a new account
2. Click the "Dev Emails" button or navigate to `/dev/emails`
3. See the welcome email captured in the inbox
4. Click the email to preview the HTML content

### Testing Email Content
1. Trigger any email-sending action (registration, password reset, etc.)
2. Open the email mailbox
3. Click the email to preview
4. Toggle between HTML and Text views
5. Verify email content and formatting

### Clearing Test Data
1. Open email mailbox
2. Click "Clear All" button
3. Confirm the action
4. All emails are deleted from the sandbox

## Technical Details

### Components
- **EmailMailbox.tsx**: Main mailbox page component
- **DevEmailButton.tsx**: Floating button for quick access

### API Endpoints Used
- `GET /api/dev/test-emails`: Fetch all captured emails
- `DELETE /api/dev/test-emails`: Clear all emails

### Email Data Structure
```typescript
interface SandboxEmail {
  timestamp: string;      // ISO timestamp
  to: string;            // Recipient email
  subject: string;       // Email subject
  body: string;          // Plain text body
  html?: string;         // HTML body (optional)
  type: string;          // Email type (e.g., 'registration_welcome')
}
```

## Testing

Run the E2E tests:
```bash
npm run test:e2e -- tests/email-mailbox-ui.e2e.spec.ts
```

Tests cover:
- Page display and layout
- Empty state
- Email capture after registration
- Email preview functionality
- Clear all functionality
- Auto-refresh behavior
- HTML/Text view toggle

## Production Behavior

In production builds:
- The floating dev button is automatically hidden
- The `/dev/emails` route still exists but will show an error if accessed
- The API endpoints return 404 in production mode

## Troubleshooting

### "Failed to load emails" error
- Check that `EMAIL_SANDBOX=true` in `.env.local`
- Verify the server is running in development mode
- Check browser console for API errors

### No emails showing
- Trigger an email action (e.g., register a new user)
- Click the "Refresh" button
- Check that the email sandbox is enabled in server logs

### HTML preview not working
- Some emails may only have plain text content
- Toggle to "Text" view to see the content
- Check browser console for iframe errors

## Future Enhancements

Potential improvements:
- Search/filter emails by type or recipient
- Delete individual emails
- Export email content
- Email template preview gallery
- Resend email functionality
