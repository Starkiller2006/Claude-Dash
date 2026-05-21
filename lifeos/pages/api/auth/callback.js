// pages/api/auth/callback.js
// WHOOP redirects here with ?code=... after the user authorizes

import { exchangeCodeForTokens } from "../../../lib/whoop";
import { getSession } from "../../../lib/session";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`/?error=${error || "no_code"}`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const session = await getSession(req, res);

    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token;
    session.expires_at = tokens.expires_at;
    await session.save();

    res.redirect("/dashboard");
  } catch (err) {
    console.error("WHOOP callback error:", err);
    res.redirect(`/?error=token_exchange_failed`);
  }
}
