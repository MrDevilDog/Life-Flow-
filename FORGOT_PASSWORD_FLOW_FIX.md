# Fix: Forgot Password Flow - 3-Step Implementation

## Problem Fixed
❌ **Before**: "Send Verification Code" doesn't send OTP  
❌ **Before**: Backend expects `newPassword` during OTP request  
❌ **Before**: Single endpoint with conflicting validation  

✅ **After**: Proper 3-step flow with separate endpoints  
✅ **After**: OTP actually sent via email  
✅ **After**: Clean UI: Email → OTP → New Password

## Complete Solution

### **Step 1: Request OTP**
```
POST /api/forgot-password/request
Input: { email: "test@example.com" }
Output: { success: true, message: "OTP sent to your email" }
```

### **Step 2: Verify OTP**
```
POST /api/forgot-password/verify  
Input: { email: "test@example.com", otp: "123456" }
Output: { success: true, verified: true }
```

### **Step 3: Reset Password**
```
POST /api/forgot-password/reset
Input: { email: "test@example.com", newPassword: "newpassword123" }
Output: { success: true, message: "Password reset successfully" }
```

## Backend Implementation

### **1. Updated Validation Schemas**
```javascript
// Step 1: Request OTP
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

// Step 2: Verify OTP  
export const forgotPasswordVerifySchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Step 3: Reset Password
export const forgotPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(255),
});
```

### **2. Separate API Endpoints**
- `/api/forgot-password/request/route.ts` - Send OTP
- `/api/forgot-password/verify/route.ts` - Verify OTP  
- `/api/forgot-password/reset/route.ts` - Reset password

### **3. OTP Logic**
```javascript
// Generate 6-digit OTP
const generatedOTP = generateOTP();

// Store in database
await storeOTP(email, generatedOTP, 'forgot_password');

// Send via email (Nodemailer)
await sendOTP(user.phone || '', user.email || '', generatedOTP, 'forgot_password');

// Log for development
console.log("🔢 Generated OTP:", generatedOTP);
```

## Frontend Implementation

### **Updated API Calls**
```javascript
// Step 1: Request OTP
fetch("/api/forgot-password/request", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email })
})

// Step 2: Verify OTP
fetch("/api/forgot-password/verify", {
  method: "POST", 
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, otp })
})

// Step 3: Reset Password
fetch("/api/forgot-password/reset", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, newPassword })
})
```

### **UI Flow**
1. **Email Input** → "Send Verification Code" 
2. **OTP Input** → "Verify Code"
3. **Password Fields** → "Reset Password"

## Key Features

### **✅ Proper Validation**
- Each step validates only required fields
- No more "newPassword required" during OTP request
- Field-specific error messages

### **✅ Real OTP Sending**
- Uses Nodemailer for email delivery
- Professional HTML email templates
- Development mode with console logging
- 5-minute expiry

### **✅ Security Features**
- Don't reveal if email exists (returns success either way)
- OTP verification with expiry
- Password hashing with bcrypt
- Rate limiting ready

### **✅ Error Handling**
- Structured field errors
- Network error handling
- User-friendly messages
- Graceful fallbacks

## Before vs After

### **❌ Before (Broken)**
```javascript
// Single endpoint with conflicting validation
POST /api/forgot-password
{ email, otp, newPassword, step: 'send_otp' }

// Error: newPassword required during OTP request
```

### **✅ After (Fixed)**
```javascript
// Step 1: Only email required
POST /api/forgot-password/request
{ email }

// Step 2: Email + OTP
POST /api/forgot-password/verify  
{ email, otp }

// Step 3: Email + newPassword
POST /api/forgot-password/reset
{ email, newPassword }
```

## Testing

### **Manual Testing**
1. Enter email → Click "Send Verification Code"
2. Check email (or console) for OTP
3. Enter OTP → Click "Verify Code"  
4. Enter new password → Click "Reset Password"
5. Try login with new password

### **Expected Results**
✅ OTP actually sent to email  
✅ Each step validates correctly  
✅ Clean UI progression  
✅ Password reset works  
✅ No validation conflicts  

## Files Created/Updated

### **New Files**
- `app/api/forgot-password/request/route.ts`
- `app/api/forgot-password/verify/route.ts` 
- `app/api/forgot-password/reset/route.ts`

### **Updated Files**
- `lib/validators.ts` - Added new schemas
- `components/auth/forgot-password.tsx` - Updated API calls

## Configuration Required

Make sure email is configured for OTP sending:
```bash
# In .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

## Migration Notes

The old `/api/forgot-password` endpoint is kept for backward compatibility but the new 3-step flow should be used.

## Expected User Experience

1. **User enters email** → "Send Verification Code"
2. **System sends OTP** to email (real email, not mock)
3. **User enters OTP** → "Verify Code" 
4. **User sets new password** → "Reset Password"
5. **Success message** → Can login with new password

The forgot password flow now works correctly with real OTP sending and proper validation!
