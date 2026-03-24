# 🚀 Beginner Setup Guide: Neon Database + Vercel Deployment

This guide walks you through deploying your app with a **Neon** PostgreSQL database and **Vercel** hosting. No prior experience required.

---

## Part 1 — Set Up Your Neon Database

### Step 1: Create a Neon Account

1. Go to **[neon.tech](https://neon.tech)** and click **Sign Up**.
2. Sign up with GitHub (easiest) or with an email address.
3. After signing in you land on the **Neon Console**.

### Step 2: Create a Project

1. Click **"New Project"**.
2. Fill in the form:
   - **Project name**: anything you like, e.g. `notera-db`
   - **Database name**: leave as `neondb` (the default)
   - **Region**: choose the one closest to your users (e.g. *US East – N. Virginia* for the US)
3. Click **"Create Project"**.
4. Neon shows a **connection string** immediately. Keep this page open — you'll copy this string in the next step.

### Step 3: Copy Your Connection String

1. On the project page click the **"Connection Details"** tab (or it may open automatically).
2. In the **"Connection string"** box, select the **"Prisma"** format from the dropdown (so the URL includes `?sslmode=require`).
3. The string looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **Copy**. This is your `DATABASE_URL`.

> ⚠️ Keep this string secret — it contains your database password.

---

## Part 2 — Set Up Your Local Environment

### Step 4: Create the `.env` File

1. In your project folder, duplicate `.env.example` and rename the copy to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in each value:

   ```env
   # Paste your Neon connection string here
   DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # For Next.js + NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="run the command below to generate this"

   # Optional — Google/GitHub OAuth (leave blank to skip)
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   ```

3. Generate a secure `NEXTAUTH_SECRET` by running this in your terminal:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as the value of `NEXTAUTH_SECRET`.

### Step 5: Push the Database Schema

This creates all the tables in your Neon database:

```bash
npx prisma db push
```

You should see output like:
```
✔  Your database is now in sync with your Prisma schema.
```

> 💡 `db push` is great for development. For production, see the [Prisma migrations docs](https://www.prisma.io/docs/concepts/components/prisma-migrate).

### Step 6: (Optional) Seed with Sample Data

To add sample flashcard sets to the database:

```bash
npm run db:seed
```

### Step 7: Run Locally to Test

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the app loads and you can sign up / log in, your database connection is working. ✅

---

## Part 3 — Deploy to Vercel

### Step 8: Push Your Code to GitHub

If you haven't already:

1. Create a new repository on [github.com](https://github.com).
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

> ⚠️ Make sure `.env` is in your `.gitignore` — never commit it.

### Step 9: Create a Vercel Account

1. Go to **[vercel.com](https://vercel.com)** and click **Sign Up**.
2. Sign up with GitHub (recommended — makes importing your repo easy).

### Step 10: Import Your Project

1. On the Vercel dashboard, click **"Add New → Project"**.
2. Under **"Import Git Repository"**, find your repository and click **"Import"**.
3. Vercel detects it's a Next.js project automatically.
4. **Do not click Deploy yet** — you need to add environment variables first.

### Step 11: Add Environment Variables

This is the most important step. In the **"Configure Project"** screen (or later under **Settings → Environment Variables**):

Click **"Environment Variables"** to expand the section, then add each variable one by one:

| Variable Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | From Step 3 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your actual Vercel URL (you can update this after first deploy) |
| `NEXTAUTH_SECRET` | The 32-char random string | From Step 4 |
| `GOOGLE_CLIENT_ID` | *(optional)* | Leave blank if not using |
| `GOOGLE_CLIENT_SECRET` | *(optional)* | Leave blank if not using |
| `GITHUB_CLIENT_ID` | *(optional)* | Leave blank if not using |
| `GITHUB_CLIENT_SECRET` | *(optional)* | Leave blank if not using |

**How to add each variable:**
1. Type the **name** in the "Name" field (e.g. `DATABASE_URL`)
2. Paste the **value** in the "Value" field
3. Make sure **all three environments** are checked: Production, Preview, Development
4. Click **"Add"**
5. Repeat for each variable

### Step 12: Deploy

1. Click **"Deploy"**.
2. Vercel builds and deploys your app. This takes 1-3 minutes.
3. When it's done you'll see **"Congratulations! Your project has been deployed."**
4. Click the preview URL (e.g. `your-app.vercel.app`) to open your live app.

---

## Part 4 — Post-Deploy Steps

### Step 13: Update NEXTAUTH_URL

After your first deploy you know your real Vercel URL:

1. Go to your project's **Settings → Environment Variables**.
2. Find `NEXTAUTH_URL` and click **Edit**.
3. Change the value from `http://localhost:3000` to `https://your-app.vercel.app` (your actual URL).
4. Click **Save**, then **Redeploy** (top-right menu → "Redeploy").

### Step 14: Verify the Database

1. Open your live app and try to **sign up** for an account.
2. If sign-up works, log into [Neon Console](https://console.neon.tech), open your project, click **"Tables"** in the left sidebar, and you should see a `User` row.

### Step 15: (Optional) Set Up OAuth

**Google:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **APIs & Services → Credentials → Create OAuth Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret** to Vercel environment variables.

**GitHub:**
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Homepage URL: `https://your-app.vercel.app`
3. Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`
4. Copy the **Client ID** and **Client Secret** to Vercel environment variables.

---

## Troubleshooting

### "Application error" on Vercel

→ Check **Vercel → Deployments → [latest] → View Function Logs** for the real error message.

### "Error: Environment variable not found: DATABASE_URL"

→ You forgot to add it in Step 11. Go to Settings → Environment Variables and add it, then redeploy.

### "PrismaClientInitializationError"

→ Your `DATABASE_URL` is wrong or the database is sleeping. Go to Neon Console and check that the project is active.

### Sign-in not working

→ Make sure `NEXTAUTH_URL` matches your actual deployment URL exactly (no trailing slash).

### "NEXTAUTH_SECRET is not set"

→ Add the `NEXTAUTH_SECRET` environment variable in Vercel (Step 11).

---

## Quick Reference

```bash
# Local setup
cp .env.example .env          # Create your env file
openssl rand -base64 32        # Generate NEXTAUTH_SECRET
npx prisma db push             # Create tables in Neon
npm run db:seed                # (optional) add sample data
npm run dev                    # Run locally

# After making schema changes
npx prisma db push             # Sync schema to Neon
npx prisma generate            # Regenerate Prisma client
```

Need to re-deploy after environment variable changes?  
Go to Vercel → Your Project → **Deployments** → the latest one → **⋯ menu → Redeploy**.
