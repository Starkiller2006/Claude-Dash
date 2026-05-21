// pages/api/auth/login.js
// Redirects the user to WHOOP's OAuth authorization page

export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    response_type: "code",
    scope: [
      "offline",
      "read:recovery",
      "read:cycles",
      "read:workout",
      "read:sleep",
      "read:profile",
      "read:body_measurement",
    ].join(" "),
  });

  const authURL = `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
  res.redirect(authURL);
}
