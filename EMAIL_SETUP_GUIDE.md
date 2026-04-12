# Email OTP Setup Guide

## Problem Fixed
✅ **Before**: System showed "OTP sent successfully" but users never received emails  
✅ **After**: Real OTP emails are sent to users with verification codes

## Quick Setup (Gmail)

### Step 1: Enable Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **Security** → **App passwords**
4. Generate a new app password:
   - Select "Mail" for the app
   - Select "Other (Custom name)" and enter "LifeFlow"
   - Copy the generated password (16 characters)

### Step 2: Configure Environment
Create/update your `.env.local` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
```

### Step 3: Test Email Sending
```bash
npm run dev
# Try to register a new user
# Check your email for the OTP
```

## Alternative Email Services

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### SendGrid (Recommended for Production)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key
SMTP_PASS=your_aws_secret_key
```

## Testing Email Setup

### Development Mode (No SMTP Required)
If you don't have SMTP configured yet, the system will:
- Log the OTP to console for testing
- Show "DEVELOPMENT MODE" message
- Still allow the registration flow to work

### Production Mode
With proper SMTP configuration:
- ✅ Real emails are sent
- ✅ Professional HTML email templates
- ✅ Welcome emails after registration
- ✅ Error handling for failed emails

## Email Templates

### OTP Email Template
- Beautiful HTML design with LifeFlow branding
- Clear OTP display with large font
- 5-minute expiry notice
- Security warning about unauthorized requests

### Welcome Email Template  
- Personalized welcome message
- Next steps for new users
- Call-to-action to visit dashboard
- Professional branding

## Troubleshooting

### "Email transporter not configured"
**Solution**: Add SMTP_USER and SMTP_PASS to `.env.local`

### "Gmail authentication failed"  
**Solution**: 
1. Enable 2-Step Verification on your Google account
2. Generate an App Password (not your regular password)
3. Use the 16-character app password in SMTP_PASS

### "Connection timeout"
**Solution**: Check SMTP_HOST and SMTP_PORT values

### "Too many login attempts" (Gmail)
**Solution**: 
1. Wait a few hours
2. Use an App Password instead of regular password
3. Consider using SendGrid for high volume

## Security Notes

### Gmail App Password vs Regular Password
- ✅ **App Password**: Secure, designed for apps, 16 characters
- ❌ **Regular Password**: Less secure, may trigger Google security alerts

### Environment Variables
- Never commit `.env.local` to version control
- Use different credentials for development vs production
- Rotate passwords periodically

## SMS OTP (Optional)

To implement SMS OTP, you can add:

### Twilio Setup
```bash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token  
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Fast2SMS (India)
```bash
FAST2SMS_API_KEY=your_api_key
FAST2SMS_SENDER_ID=your_sender_id
```

Then update `lib/otp.ts` to use these services for phone OTP.

## Verification

After setup:
1. ✅ Try registering with email verification
2. ✅ Check your email inbox for OTP
3. ✅ Enter OTP to verify it works
4. ✅ Check console for success/error logs

The system now sends real emails instead of fake success messages!
