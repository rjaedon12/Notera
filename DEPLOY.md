# Deploying StudyApp to Vercel

This guide outlines the steps to deploy the `studyapp` to Vercel with a PostgreSQL database.

## Prerequisites

1.  **Vercel Account**: [Sign up for Vercel](https://vercel.com/signup).
2.  **GitHub Repository**: Push your code to a GitHub repository.

## Step 0: Push to GitHub

Since you have the code ready locally, follow these steps to push it to GitHub:

1.  **Create a Repository**: Go to [GitHub - New Repository](https://github.com/new) and name it `studyapp` (or whatever you prefer). Do **NOT** initialize with README, license, or .gitignore.
2.  **Push Code**: Run the following commands in your terminal:
    ```bash
    # Replace <YOUR_USERNAME> with your actual GitHub username
    git remote add origin https://github.com/<YOUR_USERNAME>/studyapp.git
    git branch -M main
    git push -u origin main
    ```

## Step 1: Database Setup (PostgreSQL)

Use a cloud Postgres database.

1.  **Create a Database**: Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com/), or [Neon](https://neon.tech/).
2.  **Get Connection String**: Copy the `DATABASE_URL` (e.g., `postgres://user:pass@host:5432/db`).

## Step 2: Configure Project for Production

1.  **Update `schema.prisma`**:
    Ensure your `datasource` provider is `postgresql`.

    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```

2.  **Generate Migration**:
    Run this locally to create the initial migration for Postgres.
    ```bash
    # IMPORTANT: You need a .env file with DATABASE_URL pointing to your NEW Postgres DB for this to work
    npx prisma migrate dev --name init
    ```

## Step 3: Deploy to Vercel

You can deploy using the Vercel CLI or via the Vercel Dashboard (recommended for first time).

### Option A: Vercel Dashboard (Recommended)

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Environment Variables**:
    Add the following environment variables in the **"Environment Variables"** section:

    | Name | Value | Description |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | `postgres://...` | Your full Postgres connection string |
    | `AUTH_SECRET` | `...` | Generate with `openssl rand -base64 32` |
    | `NEXTAUTH_URL`| `https://your-project.vercel.app` | Your production URL (Vercel will provide one, or set this later) |

5.  Click **"Deploy"**.

### Option B: Vercel CLI

The project now includes a `deploy` script.

1.  Run the deploy command:
    ```bash
    npm run deploy
    ```
2.  Follow the prompts to link your project and deploy.

## Troubleshooting

-   **Database Errors**: Ensure your `DATABASE_URL` is correct and accessible from Vercel (allow 0.0.0.0/0 IP addresses if using an external provider).
-   **Build Failures**: Check the "Build Logs" in the Vercel dashboard.
