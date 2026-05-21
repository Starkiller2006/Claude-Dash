// pages/api/whoop/data.js
// Single endpoint the frontend calls to get all live WHOOP metrics

import { getSession } from "../../../lib/session";
import { fetchWhoopDashboardData } from "../../../lib/whoop";

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (!session.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const data = await fetchWhoopDashboardData(session);
    return res.status(200).json(data);
  } catch (err) {
    console.error("WHOOP data fetch error:", err.message);

    // If it's an auth error, clear the session so user can re-login
    if (err.message.includes("401")) {
      session.destroy();
      return res.status(401).json({ error: "Session expired. Please reconnect WHOOP." });
    }

    return res.status(500).json({ error: err.message });
  }
}
