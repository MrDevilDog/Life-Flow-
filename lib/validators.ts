import { z } from "zod";
import { phoneSchema } from "./phone";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address").max(255),
  phone: phoneSchema, // Uses standardization and validation
  password: z.string().min(6, "Password must be at least 6 characters").max(255),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
  errorMap: () => ({ message: "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-" })
  }),
  city: z.string().min(1, "City is required"),
  district: z.string().optional(), // Optional district field
  age: z.coerce.number().int().min(18).max(100).optional(),
  lastDonationDate: z.string().optional(),
  availability: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  verification_type: z.enum(["email", "phone"]), // NEW: Track verification method
}).passthrough();

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone is required").max(255),
  password: z.string().min(1).max(255),
  role: z.enum(["donor", "hospital"]).default("donor"),
});

export const otpVerifySchema = z.object({
  email: z.string().email().max(255).optional(),
  phone: z.string().min(10).max(20).optional(), // Keep simple for OTP verification
  otp: z.string().length(6, "OTP must be 6 digits"),
  type: z.enum(["email", "phone", "forgot_password"]),
  flow: z.enum(["registration", "post_registration"]).default("registration"),
});

export const otpSendSchema = z.object({
  email: z.string().email().max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  type: z.enum(["email", "phone", "forgot_password"]),
});

// Forgot Password - Step 1: Request OTP (Dual Mode)
export const forgotPasswordRequestSchema = z.object({
  method: z.enum(["email", "phone"]),
  email: z.string().email("Invalid email address").max(255).optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20).optional(),
}).refine((data) => {
  if (data.method === "email" && !data.email) {
    return false;
  }
  if (data.method === "phone" && !data.phone) {
    return false;
  }
  return true;
}, {
  message: "Email is required for email method, phone is required for phone method",
  path: ["method"]
});

// Forgot Password - Step 2: Verify OTP (Dual Mode)
export const forgotPasswordVerifySchema = z.object({
  method: z.enum(["email", "phone"]),
  email: z.string().email("Invalid email address").max(255).optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20).optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
}).refine((data) => {
  if (data.method === "email" && !data.email) {
    return false;
  }
  if (data.method === "phone" && !data.phone) {
    return false;
  }
  return true;
}, {
  message: "Email is required for email method, phone is required for phone method",
  path: ["method"]
});

// Forgot Password - Step 3: Reset Password (Dual Mode)
export const forgotPasswordResetSchema = z.object({
  method: z.enum(["email", "phone"]),
  email: z.string().email("Invalid email address").max(255).optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20).optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(255),
}).refine((data) => {
  if (data.method === "email" && !data.email) {
    return false;
  }
  if (data.method === "phone" && !data.phone) {
    return false;
  }
  return true;
}, {
  message: "Email is required for email method, phone is required for phone method",
  path: ["method"]
});

// Legacy schema for backward compatibility
export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(255).optional(),
  step: z.enum(["send_otp", "reset_password"]).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  blood_group: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    errorMap: () => ({ message: "Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-" })
  }).optional(),
  location: z.string().min(1).max(255).optional(),
  availability: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const donorUpsertSchema = z.object({
  user_id: z.coerce.number().int().positive().optional(),
  blood_group: z.string().min(1).max(5),
  location: z.string().min(1).max(255),
  phone: z.string().min(10).max(30),
  availability: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const donorUpdateSchema = z.object({
  blood_group: z.string().min(1).max(5).optional(),
  location: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).max(30).optional(),
  availability: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const requestCreateSchema = z.object({
  patient_name: z.string().min(1),
  blood_group: z.string().min(1),
  units: z.number().min(1),
  city: z.string().min(1),
  contact_number: z.string().min(10),
  urgency: z.enum(["normal", "urgent", "critical"]),
  notes: z.string().optional()
});

export const requestStatusPatchSchema = z.object({
  status: z.enum(["fulfilled", "cancelled"]),
});

