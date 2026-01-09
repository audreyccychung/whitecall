# Supabase Setup Guide

This guide will help you set up Supabase for the Shift Calendar application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: shift-calendar
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free tier works for development

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your credentials:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...your-anon-key
```

**Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

## Step 4: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** should be enabled by default
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email if desired

### Email Confirmation Settings

By default, Supabase requires email confirmation. For development:

1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. **Option 1 (Recommended for Production):** Keep "Enable email confirmations" ON
   - Users will receive a confirmation email
   - They must click the link to verify
4. **Option 2 (Development Only):** Turn OFF "Enable email confirmations"
   - Users can sign in immediately without email verification
   - **Don't use this in production!**

## Step 5: Enable OAuth Providers (Optional)

### Google OAuth

1. Go to **Authentication** → **Providers** → **Google**
2. Toggle "Enable Sign in with Google"
3. Follow Supabase's guide to:
   - Create a Google Cloud Project
   - Enable Google+ API
   - Create OAuth credentials
   - Add authorized redirect URIs
4. Copy Client ID and Client Secret into Supabase

### Apple OAuth

1. Go to **Authentication** → **Providers** → **Apple**
2. Toggle "Enable Sign in with Apple"
3. Follow Supabase's guide to:
   - Create an App ID in Apple Developer
   - Create a Service ID
   - Configure Sign in with Apple
   - Generate a private key
4. Add credentials to Supabase

## Step 6: Test the Connection

1. Start your dev server:
```bash
npm run dev
```

2. Open http://localhost:5173
3. Try to sign up with an email
4. Check for errors in the browser console
5. Verify the user appears in **Authentication** → **Users** in Supabase

## Troubleshooting

### "Invalid API key" or "Missing Supabase environment variables"
- Double-check your `.env.local` file
- Restart the dev server after changing `.env.local`
- Make sure the file is named `.env.local` (not `.env`)

### Email not sending
- Check **Authentication** → **Settings** → **SMTP Settings**
- For development, consider disabling email confirmation
- Check spam folder for confirmation emails

### OAuth not working
- Verify redirect URIs match exactly
- For local development, add `http://localhost:5173` to allowed redirect URIs
- Check OAuth credentials are correct

## Next Steps

Once authentication is working, you'll need to:

1. Create database tables for shifts, templates, and groups
2. Set up Row Level Security (RLS) policies
3. Create database migrations

See `DATABASE_SCHEMA.md` (coming soon) for database setup.

## Security Best Practices

1. **Never commit** `.env.local` or `.env` files
2. **Rotate keys** if they're accidentally exposed
3. **Use RLS policies** to protect user data
4. **Enable email confirmation** in production
5. **Set up rate limiting** to prevent abuse

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
