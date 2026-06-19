// Carbon + reward math. Pure functions, fully unit-testable.
// Conditional logic that varies by action type AND regional grid carbon intensity.

export type ActionType = "bike" | "walk" | "transit" | "utility_saving" | "food_waste";

// Avoided emission factor (kg CO2 per km) if user would otherwise have driven a typical ICE car.
const BASE_KG_PER_KM = 0.21;

// Regional grid carbon intensity multiplier. Higher = displacing dirtier electricity matters more.
// US-CA = clean grid, US-WV = coal-heavy, EU-NO = hydro, IN-MH = coal.
export const REGION_MULTIPLIERS: Record<string, number> = {
  "US-CA": 0.85,
  "US-NY": 0.95,
  "US-TX": 1.15,
  "US-WV": 1.45,
  "EU-NO": 0.6,
  "EU-DE": 1.05,
  "IN-MH": 1.4,
  GLOBAL: 1.0,
};

export function regionFactor(region: string | undefined): number {
  if (!region) return 1;
  return REGION_MULTIPLIERS[region] ?? 1;
}

export interface ActionInput {
  type: ActionType;
  distanceKm?: number;
  durationMin?: number;
  kwhSaved?: number;
  mealsSaved?: number;
  region?: string;
}

export interface ActionResult {
  carbonKg: number;
  points: number;
}

/**
 * Compute carbon saved + reward points for a verified green action.
 * Reward = round(carbonKg * 100). Carbon scales by action type AND region.
 */
export function scoreAction(input: ActionInput): ActionResult {
  const r = regionFactor(input.region);
  let carbonKg = 0;
  switch (input.type) {
    case "bike":
      carbonKg = (input.distanceKm ?? 0) * BASE_KG_PER_KM * 1.0 * r;
      break;
    case "walk":
      // Walking displaces shorter trips; cap distance at 5km to discourage gaming.
      carbonKg = Math.min(input.distanceKm ?? 0, 5) * BASE_KG_PER_KM * 0.9 * r;
      break;
    case "transit":
      // Transit still emits, so net avoidance ≈ 60% of driving same distance.
      carbonKg = (input.distanceKm ?? 0) * BASE_KG_PER_KM * 0.6 * r;
      break;
    case "utility_saving":
      // Each kWh saved counts as 0.4kg CO2 baseline, scaled by region grid intensity.
      carbonKg = (input.kwhSaved ?? 0) * 0.4 * r;
      break;
    case "food_waste":
      // Each rescued meal ≈ 1.5kg CO2-eq.
      carbonKg = (input.mealsSaved ?? 0) * 1.5;
      break;
  }
  carbonKg = Math.max(0, Math.round(carbonKg * 100) / 100);
  const points = Math.round(carbonKg * 100);
  return { carbonKg, points };
}

// ---------- Wallet math ----------

export interface WalletTxn {
  delta: number;
  kind: "earn" | "redeem" | "adjust";
}

export function computeBalance(txns: WalletTxn[]): number {
  return txns.reduce((b, t) => b + t.delta, 0);
}

export function canRedeem(balance: number, cost: number): boolean {
  return Number.isFinite(balance) && Number.isFinite(cost) && cost > 0 && balance >= cost;
}

// ---------- QR / redemption codes ----------

export const QR_CODE_TTL_SECONDS = 60;

export function generateCode(rand: () => number = Math.random): string {
  // 12-char URL-safe random code. Enough entropy for short TTL one-time codes.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(rand() * alphabet.length)];
  }
  return out;
}

export function isCodeExpired(expiresAtIso: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(expiresAtIso).getTime();
}

// ---------- Impact equivalents ----------

export function impactEquivalents(totalKg: number) {
  // 1 mature tree absorbs ~21 kg CO2/yr. 1 km of driving avoided ≈ 0.21 kg CO2.
  return {
    treesPlanted: +(totalKg / 21).toFixed(1),
    kmNotDriven: Math.round(totalKg / BASE_KG_PER_KM),
    showerMinutes: Math.round(totalKg / 0.06),
  };
}

// ---------- Streak ----------

export function computeStreak(actionDates: Date[], today: Date = new Date()): number {
  if (actionDates.length === 0) return 0;
  const set = new Set(actionDates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
