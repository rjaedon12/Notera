# Deploying Koda to Vercel

Step-by-step guide for deploying the Koda study app with a Neon PostgreSQL database.

---

## 1. Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the **pooled connection string** — it looks like:
   ```
   postgresql://user:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   This is your `DATABASE_URL`.

## 2. Apply the Schema

Run this locally to push the Prisma schema to your Neon database:

```bash
# Set the DATABASE_URL in your terminal (or in .env)
export DATABASE_URL="postgresql://..."

npx prisma db push
```

Optionally seed the demo data:

```bash
npx prisma db seed
```

## 3. Push Code to GitHub

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/Koda.git
git branch -M main
git push -u origin main
```

## 4. Import Repo in Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. Select **Next.js** as the framework (Vercel auto-detects this).

## 5. Add Environment Variables

In the Vercel project settings → **Environment Variables**, add:

| Variable               | Value                                      |
| :--------------------- | :----------------------------------------- |
| `DATABASE_URL`         | Your Neon pooled connection string          |
| `AUTH_SECRET`          | *(generate below)*                         |
| `NEXTAUTH_URL`        | `https://your-project.vercel.app`          |
| `GOOGLE_CLIENT_ID`    | *(optional — Google OAuth client ID)*      |
| `GOOGLE_CLIENT_SECRET` | *(optional — Google OAuth client secret)*  |
| `GITHUB_CLIENT_ID`    | *(optional — GitHub OAuth client ID)*      |
| `GITHUB_CLIENT_SECRET` | *(optional — GitHub OAuth client secret)*  |

## 6. Generate `AUTH_SECRET`

Run this in your terminal and paste the output into Vercel:

```bash
openssl rand -base64 32
```

## 7. Set `NEXTAUTH_URL`

Set this to your Vercel production URL, e.g.:

```
https://koda-app.vercel.app
```

## 8. Deploy

Click **Deploy** in Vercel. The build will automatically run:

```
prisma generate && next build
```

Vercel also runs `npm install` which triggers the `postinstall` script (`prisma generate`), ensuring the Prisma client is always up to date.

---

## Troubleshooting

- **Database connection errors**: Ensure `DATABASE_URL` uses the **pooled** connection string from Neon (includes `?sslmode=require`).
- **Build failures**: Check the Vercel build logs. Most issues come from missing environment variables.
- **Auth not working**: Make sure `AUTH_SECRET` is set and `NEXTAUTH_URL` matches your production domain.
- **Schema changes**: After editing `prisma/schema.prisma`, run `npx prisma db push` against your Neon DB, then redeploy.
