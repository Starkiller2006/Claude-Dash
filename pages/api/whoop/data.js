// pages/api/whoop/data.js
import { getSession } from "../../../lib/session";
import { fetchWhoopDashboardData } from "../../../lib/whoop";

export default async function handler(req, res) {
  const session = await getSession(req, res);

  if (!session.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const data = await fetchWhoopDashboardData(session);
    res.status(200).json(data);
  } catch (err) {
    console.error("WHOOP data error:", err);
    res.status(500).json({ error: err.message });
  }
}
