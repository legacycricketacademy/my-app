export const flags = {
  featureGoLive: process.env.FEATURE_GO_LIVE === 'true',
  emailEnabled: process.env.EMAIL_NOTIFICATIONS === 'true' && !!process.env.SENDGRID_API_KEY,
  testMailbox: process.env.FEATURE_TEST_MAILBOX === 'true' || process.env.NODE_ENV === 'test',
  requireAdminForParents: process.env.REQUIRE_ADMIN_APPROVAL_FOR_PARENTS === 'true',
};
