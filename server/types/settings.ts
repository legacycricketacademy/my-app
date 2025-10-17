export type ProfileSettings = {
  academyName?: string;
  contactEmail?: string;
  phone?: string;
  timezone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type NotificationsSettings = {
  emailAnnouncements?: boolean;
  emailReminders?: boolean;
  smsReminders?: boolean;
  defaultReminderHours?: number;
};

export type PaymentSettings = {
  currency?: string;
  invoicePrefix?: string;
  dueDays?: number;
  paymentGateway?: 'none' | 'stripe' | 'razorpay';
  gatewayKey?: string;
  notifyOnOverdue?: boolean;
};

export type SupportInfo = {
  supportEmail?: string;
  docsUrl?: string;
  issueTrackerUrl?: string;
};

export type AcademyConfig = {
  ageGroups?: string[];
  maxPlayersPerSession?: number;
  allowParentSelfSignup?: boolean;
};

export type RolePermission = 'managePlayers' | 'manageSessions' | 'managePayments' | 'manageAnnouncements' | 'manageSettings';

export type AccessRole = {
  role: 'admin' | 'coach' | 'parent';
  permissions: RolePermission[];
};

export type AccessRolesSettings = {
  roles: AccessRole[];
};

// Parent variants
export type ParentProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  preferredContact?: 'email' | 'sms';
  timezone?: string;
};

export type ParentNotifications = {
  sessionReminders?: boolean;
  announcements?: boolean;
  paymentReminders?: boolean;
};

export type ParentPayments = {
  preferredMethod?: 'card' | 'upi' | 'bank';
  savePaymentMethod?: boolean;
  billingAddress?: string;
};
