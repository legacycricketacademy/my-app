declare namespace NodeJS {
  interface ProcessEnv {
    STRIPE_SECRET_KEY?: string;
    VITE_STRIPE_PUBLISHABLE_KEY?: string;
  }
}
