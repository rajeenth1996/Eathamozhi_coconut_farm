import { z } from 'zod';

// ─── Format Helpers ──────────────────────────────────────────────────────────
const phoneRegex = /^[6-9]\d{9}$/;
const pinCodeRegex = /^\d{6}$/;

// ─── Booking Validation ──────────────────────────────────────────────────────
export const BookingCreateSchema = z.object({
  batchCode: z.string().trim().min(1, 'Batch selection is required'),
  customerName: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(80, 'Customer name cannot exceed 80 characters'),
  mobile: z
    .string()
    .trim()
    .refine((val) => /^\d{10}$/.test(val.replace(/\D/g, '')), {
      message: 'Mobile number must be a valid 10-digit phone number',
    }),
  whatsapp: z
    .string()
    .trim()
    .refine((val) => !val || /^\d{10}$/.test(val.replace(/\D/g, '')), {
      message: 'WhatsApp number must be a valid 10-digit number',
    })
    .optional()
    .default(''),
  address: z
    .string()
    .trim()
    .max(250, 'Delivery address is too long (max 250 characters)')
    .optional()
    .default(''),
  district: z.string().trim().min(2, 'District is required').max(60),
  state: z.string().trim().min(2, 'State is required').max(60),
  pinCode: z
    .string()
    .trim()
    .regex(pinCodeRegex, 'PIN code must be exactly 6 digits'),
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(5000, 'Orders above 5,000 saplings require direct bulk contract via phone'),
  subtotal: z.coerce.number().nonnegative('Subtotal cannot be negative'),
  deliveryCharge: z.coerce.number().nonnegative('Delivery charge cannot be negative'),
  totalAmount: z.coerce.number().positive('Total amount must be greater than zero'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  farmLocation: z.string().trim().max(100).optional().or(z.literal('')),
  specialInstructions: z.string().trim().max(300).optional().or(z.literal('')),
  expectedDeliveryDate: z.string().optional().or(z.literal('')),
  deliveryService: z.string().optional().or(z.literal('')),
  nearestHub: z.string().optional().or(z.literal('')),
  paymentScreenshotUrl: z.string().optional().or(z.literal('')),
});

// ─── Enquiry Validation ──────────────────────────────────────────────────────
export const EnquiryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  mobile: z
    .string()
    .trim()
    .refine((val) => /^\d{10}$/.test(val.replace(/\D/g, '')), {
      message: 'Mobile number must be a valid 10-digit phone number',
    }),
  location: z.string().trim().max(100).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(1000, 'Message cannot exceed 1000 characters'),
});

// ─── Farmer Review Validation ─────────────────────────────────────────────────
export const ReviewCreateSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Farmer name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  location: z.string().trim().min(2, 'Location is required').max(100),
  batchCode: z.string().trim().min(1, 'Batch code is required').default('EM-0126-A'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(20),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .trim()
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
  verified: z.boolean().default(true),
  date: z.string().optional(),
});

// ─── Batch Creation / Update Validation ──────────────────────────────────────
export const BatchCreateSchema = z.object({
  batchCode: z
    .string()
    .trim()
    .min(3, 'Batch code must be at least 3 characters')
    .max(30, 'Batch code cannot exceed 30 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Batch code can only contain letters, numbers, hyphens, and underscores'),
  name: z.string().trim().min(3, 'Batch name must be at least 3 characters').max(100),
  harvestDate: z.string().min(1, 'Harvest date is required'),
  seededDate: z.string().min(1, 'Seeded date is required'),
  totalQuantity: z.coerce.number().int().min(1, 'Total quantity must be at least 1'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  parentPalmCodes: z.array(z.string()).min(1, 'At least one Mother Tree must be tagged'),
  description: z.string().trim().max(1000).optional().default(''),
  images: z.array(z.string()).optional(),
});

// ─── Inventory Adjustment Validation ──────────────────────────────────────────
export const InventoryAdjustmentSchema = z.object({
  batchCode: z.string().trim().min(1, 'Batch code is required'),
  quantityChange: z.coerce
    .number()
    .int('Quantity adjustment must be a whole number')
    .refine((n) => n !== 0, { message: 'Quantity change cannot be zero' }),
  reason: z
    .string()
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(300, 'Reason cannot exceed 300 characters'),
  adminName: z.string().trim().min(2, 'Admin name is required').max(60),
});

// ─── Login Validation ────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ─── 2FA OTP Code Validation ──────────────────────────────────────────────────
export const VerifyOtpSchema = z.object({
  preAuthToken: z.string().min(10, 'Invalid authentication session'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

// ─── Reusable Validation Helper ──────────────────────────────────────────────
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path.join('.') || 'general';
    issues[field] = issue.message;
  });

  const firstMessage = result.error.issues[0]?.message || 'Invalid input data';
  return {
    success: false,
    error: firstMessage,
    issues,
  };
}
