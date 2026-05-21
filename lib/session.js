// lib/session.js
import { getIronSession } from "iron-session";

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "lifeos_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}
