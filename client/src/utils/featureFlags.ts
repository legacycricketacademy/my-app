export const flags = {
  featureGoLive: Boolean(import.meta.env.VITE_FEATURE_GO_LIVE === 'true'),
  emailEnabled: Boolean(import.meta.env.VITE_EMAIL_NOTIFICATIONS === 'true'),
};
