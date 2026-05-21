// lib/whoop.js
// Central WHOOP API client — handles token refresh automatically

const WHOOP_API = "https://api.prod.whoop.com/developer";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

/**
 * Refresh an expired WHOOP access token using the stored refresh token.
 * Returns { access_token, refresh_token, expires_at }
 */
export async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
    scope: "offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(code) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.WHOOP_REDIRECT_URI,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Code exchange failed: ${err}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Make an authenticated request to the WHOOP API.
 * Pass the session object — it will auto-refresh if needed and save.
 */
async function whoopFetch(session, path) {
  // Refresh if token expires within 60 seconds
  if (Date.now() > session.expires_at - 60_000) {
    const refreshed = await refreshAccessToken(session.refresh_token);
    session.access_token = refreshed.access_token;
    session.refresh_token = refreshed.refresh_token;
    session.expires_at = refreshed.expires_at;
    await session.save();
  }

  const res = await fetch(`${WHOOP_API}${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    throw new Error(`WHOOP API error ${res.status} on ${path}`);
  }

  return res.json();
}

/**
 * Fetch all the dashboard data in parallel.
 * Returns a normalized object ready for the frontend.
 */
export async function fetchWhoopDashboardData(session) {
  const [profile, recovery, sleep, cycles, workouts, body] = await Promise.all([
    whoopFetch(session, "/v2/user/profile/basic"),
    whoopFetch(session, "/v2/recovery?limit=1"),
    whoopFetch(session, "/v2/sleep?limit=7"),          // last 7 sleeps
    whoopFetch(session, "/v2/cycle?limit=7"),           // last 7 cycles (daily strain)
    whoopFetch(session, "/v2/workout?limit=7"),         // last 7 workouts
    whoopFetch(session, "/v2/user/measurement/body"),
  ]);

  // ── Latest recovery ──────────────────────────────────
  const latestRecovery = recovery?.records?.[0] ?? null;

  // ── Today's cycle (strain / calories) ───────────────
  const todayCycle = cycles?.records?.[0] ?? null;

  // ── Sleep summary (last 7 nights) ───────────────────
  const sleepRecords = (sleep?.records ?? []).map((s) => ({
    id: s.id,
    start: s.start,
    end: s.end,
    hours: parseFloat(((s.score?.total_in_bed_time_milli ?? 0) / 3_600_000).toFixed(1)),
    performance_pct: s.score?.sleep_performance_percentage ?? null,
    stages: {
      light_pct: s.score?.light_sleep_efficiency_percentage ?? null,
      slow_wave_pct: s.score?.slow_wave_sleep_efficiency_percentage ?? null,
      rem_pct: s.score?.rem_sleep_efficiency_percentage ?? null,
    },
    disturbances: s.score?.disturbances ?? null,
  }));

  // ── Last 7 workouts ──────────────────────────────────
  const workoutRecords = (workouts?.records ?? []).map((w) => ({
    id: w.id,
    start: w.start,
    sport_id: w.sport_id,
    strain: w.score?.strain ?? null,
    calories: w.score?.kilojoule ? Math.round(w.score.kilojoule / 4.184) : null,
    avg_hr: w.score?.average_heart_rate ?? null,
    max_hr: w.score?.max_heart_rate ?? null,
    zone_data: w.score?.zone_duration ?? null,
  }));

  // ── Daily strain / calories (cycles) ────────────────
  const cycleRecords = (cycles?.records ?? []).map((c) => ({
    id: c.id,
    start: c.start,
    end: c.end,
    strain: c.score?.strain ?? null,
    avg_hr: c.score?.average_heart_rate ?? null,
    max_hr: c.score?.max_heart_rate ?? null,
    kilojoule: c.score?.kilojoule ?? null,
    calories: c.score?.kilojoule ? Math.round(c.score.kilojoule / 4.184) : null,
  }));

  const todayCalories = cycleRecords[0]?.calories ?? null;
  const todayStrain = cycleRecords[0]?.strain ?? null;
  const avgHR = todayCycle?.score?.average_heart_rate ?? null;

  return {
    profile,
    body,
    recovery: {
      score: latestRecovery?.score?.recovery_score ?? null,
      hrv: latestRecovery?.score?.hrv_rmssd_milli ?? null,
      resting_hr: latestRecovery?.score?.resting_heart_rate ?? null,
      spo2: latestRecovery?.score?.spo2_percentage ?? null,
      skin_temp_celsius: latestRecovery?.score?.skin_temp_celsius ?? null,
    },
    today: {
      strain: todayStrain,
      calories_burned: todayCalories,
      avg_hr: avgHR,
    },
    sleep: sleepRecords,
    workouts: workoutRecords,
    cycles: cycleRecords,
    synced_at: new Date().toISOString(),
  };
}
