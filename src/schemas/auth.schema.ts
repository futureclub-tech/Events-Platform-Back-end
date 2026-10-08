import { z } from 'zod';

const phoneSchema = z.string().trim().min(1, 'Phone is required');
const optionalRequestParts = {
  query: z.unknown().optional(),
  params: z.unknown().optional(),
};

export const registerBodySchema = z.object({
  fullname: z.string().trim().min(1, 'Full name is required'),
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
  email: z.string().trim().email().nullable().optional(),
});

export const registerSchema = z.object({
  body: registerBodySchema,
  ...optionalRequestParts,
});

export const loginBodySchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

export const loginSchema = z.object({
  body: loginBodySchema,
  ...optionalRequestParts,
});

export const verifyOtpBodySchema = z.object({
  phone: phoneSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const verifyOtpSchema = z.object({
  body: verifyOtpBodySchema,
  ...optionalRequestParts,
});

export const resendOtpBodySchema = z.object({
  phone: phoneSchema,
});

export const resendOtpSchema = z.object({
  body: resendOtpBodySchema,
  ...optionalRequestParts,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type VerifyOtpBody = z.infer<typeof verifyOtpBodySchema>;
export type ResendOtpBody = z.infer<typeof resendOtpBodySchema>;
