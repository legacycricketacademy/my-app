// client/src/pages/settings/schemas.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
});
export type ProfileValues = z.infer<typeof ProfileSchema>;

export const NotificationsSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(false),
});
export type NotificationsValues = z.infer<typeof NotificationsSchema>;

export const PaymentsSchema = z.object({
  stripeEnabled: z.boolean().default(false),
  currency: z.enum(['INR','USD']).default('INR'),
  receiptEmail: z.string().email().optional().or(z.literal('')),
});
export type PaymentsValues = z.infer<typeof PaymentsSchema>;

export const SupportSchema = z.object({
  contactEmail: z.string().email(),
  whatsapp: z.string().optional(),
  faqUrl: z.string().url().optional().or(z.literal('')),
});
export type SupportValues = z.infer<typeof SupportSchema>;

// admin-only
export const AcademySchema = z.object({
  name: z.string().min(2),
  timezone: z.string().default('Asia/Kolkata'),
  logoUrl: z.string().url().optional().or(z.literal('')),
});
export type AcademyValues = z.infer<typeof AcademySchema>;

export const AccessSchema = z.object({
  inviteOnly: z.boolean().default(false),
});
export type AccessValues = z.infer<typeof AccessSchema>;

export const DataSchema = z.object({
  exportRequestedAt: z.string().datetime().nullable().optional(),
  anonymize: z.boolean().default(false),
});
export type DataValues = z.infer<typeof DataSchema>;
