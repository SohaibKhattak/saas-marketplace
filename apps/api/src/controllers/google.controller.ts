import { Request, Response } from "express";
import { supabase, createAuthClient } from "../config/supabase.js";
import { env } from "../config/env.js";

// 1. Redirect user to Supabase Google OAuth
export async function googleAuthStart(req: Request, res: Response) {
  const redirectTo = typeof req.query.redirectTo === "string"
    ? req.query.redirectTo
    : `${env.FRONTEND_URL}/auth/google/callback`;
  // Use an ephemeral client to avoid contaminating the shared service-role client's session.
  const authClient = createAuthClient();
  const { data, error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });
  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
  // Supabase returns a URL to redirect the user to
  res.redirect(data.url);
}

// 2. Handle Supabase OAuth callback
export async function googleAuthCallback(req: Request, res: Response) {
  // Supabase will redirect here with access_token, refresh_token, etc. in the URL fragment
  // The backend cannot access fragments, so you must use a custom redirect page on the frontend
  // that parses the fragment and sends tokens to the backend for session creation/profile completion
  // For now, just redirect to frontend with a message
  res.redirect(`${env.FRONTEND_URL}/auth/google/callback?raw=1`);
}
