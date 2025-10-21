export const flags = {
  roleRedirects: Boolean(import.meta.env.VITE_ENABLE_ROLE_REDIRECTS === 'true'),
  e2eFakePayments: Boolean(import.meta.env.VITE_E2E_FAKE_PAYMENTS === 'true'),
};

