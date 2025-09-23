/**
 * Central registry for all data-testid attributes used in UI tests
 * 
 * This ensures consistency and prevents string drift across components.
 * All components should import and use these constants instead of hardcoded strings.
 */
export const TID = {
  header: {
    roleBadge: 'role-badge',
    userMenuTrigger: 'user-menu-trigger',
    userMenuProfile: 'user-menu-profile',
    userMenuSettings: 'user-menu-settings',
    userMenuSignout: 'user-menu-signout',
  },
  dashboard: {
    title: 'dashboard-title',
    stats: 'stats-card',
    players: 'players-card',
    fitness: 'fitness-card',
    meal: 'meal-plan-card',
    payments: 'payment-card',
    schedule: 'schedule-card',
    announcements: 'announcements-card',
  },
  schedule: {
    page: 'schedule-page',
    tabs: 'schedule-tabs',
    tabAll: 'tab-all',
    tabPractices: 'tab-practices',
    tabGames: 'tab-games',
    viewSelect: 'view-mode-select',
    viewWeek: 'view-week',
    viewMonth: 'view-month',
    kidFilter: 'kid-filter',
    rsvpGoing: 'rsvp-going',
    rsvpMaybe: 'rsvp-maybe',
    rsvpNo: 'rsvp-no',
  },
  admin: {
    page: 'admin-sessions-page',
    createBtn: 'create-session',
    list: 'session-list',
    row: (id: string | number) => `session-row-${id}`,
    save: 'session-save',
    cancel: 'session-cancel',
  },
  account: {
    page: 'account-page',
    tabProfile: 'account-tab-profile',
    tabSecurity: 'account-tab-security',
    tabNotifications: 'account-tab-notifications',
    tabChildren: 'account-tab-children',
    tabOrg: 'account-tab-organization',
  },
  common: { 
    empty: 'empty-state', 
    skeleton: 'skeleton' 
  }
} as const;

// Type helper for testid values
export type TestId = typeof TID[keyof typeof TID][keyof typeof TID[keyof typeof TID]];
