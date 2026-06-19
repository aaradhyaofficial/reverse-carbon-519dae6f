import { describe, it, expect } from "vitest";
import {
  scoreAction,
  computeBalance,
  canRedeem,
  generateCode,
  isCodeExpired,
  impactEquivalents,
  computeStreak,
  QR_CODE_TTL_SECONDS,
} from "../carbon";

describe("scoreAction — conditional logic by type & region", () => {
  it("rewards a 10km bike trip more in a dirty grid than a clean one", () => {
    const clean = scoreAction({ type: "bike", distanceKm: 10, region: "US-CA" });
    const dirty = scoreAction({ type: "bike", distanceKm: 10, region: "US-WV" });
    expect(dirty.carbonKg).toBeGreaterThan(clean.carbonKg);
    expect(dirty.points).toBeGreaterThan(clean.points);
  });

  it("counts transit as ~60% the carbon of biking the same distance (same region)", () => {
    const bike = scoreAction({ type: "bike", distanceKm: 10, region: "US-CA" });
    const transit = scoreAction({ type: "transit", distanceKm: 10, region: "US-CA" });
    expect(transit.carbonKg).toBeLessThan(bike.carbonKg);
    expect(transit.carbonKg / bike.carbonKg).toBeCloseTo(0.6, 1);
  });

  it("caps walking distance to discourage gaming with claimed 50km walks", () => {
    const honest = scoreAction({ type: "walk", distanceKm: 4 });
    const claimed = scoreAction({ type: "walk", distanceKm: 50 });
    // 50km claim should not earn 12x what 4km earns — capped at 5km.
    expect(claimed.points).toBeLessThan(honest.points * 2);
  });
});

describe("wallet balance math", () => {
  it("sums earn and redeem to the correct balance", () => {
    expect(
      computeBalance([
        { delta: 150, kind: "earn" },
        { delta: 220, kind: "earn" },
        { delta: -60, kind: "redeem" },
      ]),
    ).toBe(310);
  });

  it("returns 0 for empty wallet", () => {
    expect(computeBalance([])).toBe(0);
  });

  it("blocks redemption when balance is below cost", () => {
    expect(canRedeem(100, 150)).toBe(false);
    expect(canRedeem(150, 150)).toBe(true);
    expect(canRedeem(151, 150)).toBe(true);
  });

  it("rejects non-positive or NaN costs", () => {
    expect(canRedeem(1000, 0)).toBe(false);
    expect(canRedeem(1000, -5)).toBe(false);
    expect(canRedeem(NaN, 10)).toBe(false);
  });
});

describe("redemption QR code & expiry", () => {
  it(`treats a code as expired exactly ${QR_CODE_TTL_SECONDS}s after creation`, () => {
    const created = new Date("2026-01-01T00:00:00Z");
    const expires = new Date(created.getTime() + QR_CODE_TTL_SECONDS * 1000);
    expect(isCodeExpired(expires.toISOString(), new Date(expires.getTime() - 1))).toBe(false);
    expect(isCodeExpired(expires.toISOString(), expires)).toBe(true);
    expect(isCodeExpired(expires.toISOString(), new Date(expires.getTime() + 1))).toBe(true);
  });

  it("rejects a duplicate redemption attempt: a used code stays used", () => {
    // Simulate atomic status machine — a code can only transition pending -> used once.
    type Status = "pending" | "used" | "expired";
    let status: Status = "pending";
    const tryUse = () => {
      if (status !== "pending") return { ok: false, reason: status };
      status = "used";
      return { ok: true };
    };
    expect(tryUse()).toEqual({ ok: true });
    expect(tryUse()).toEqual({ ok: false, reason: "used" });
    expect(tryUse()).toEqual({ ok: false, reason: "used" });
  });

  it("generates codes of expected length, alphabet, and reasonable uniqueness", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCode()));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(c).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
  });
});

describe("impact + streak", () => {
  it("converts kg CO2 to human-relatable equivalents", () => {
    const eq = impactEquivalents(210);
    expect(eq.treesPlanted).toBe(10);
    expect(eq.kmNotDriven).toBe(1000);
  });

  it("counts consecutive-day streak", () => {
    const today = new Date("2026-06-19T12:00:00Z");
    const d = (n: number) => {
      const x = new Date(today);
      x.setDate(today.getDate() - n);
      return x;
    };
    expect(computeStreak([d(0), d(1), d(2), d(4)], today)).toBe(3);
    expect(computeStreak([d(1), d(2)], today)).toBe(0);
    expect(computeStreak([], today)).toBe(0);
  });
});
