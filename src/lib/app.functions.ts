import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { scoreAction, generateCode, QR_CODE_TTL_SECONDS, type ActionType } from "./carbon";

// ----- Log a verified green action -----
const logActionSchema = z.object({
  type: z.enum(["bike", "walk", "transit", "utility_saving", "food_waste"]),
  distanceKm: z.number().min(0).max(200).optional(),
  durationMin: z.number().min(0).max(600).optional(),
  kwhSaved: z.number().min(0).max(1000).optional(),
  mealsSaved: z.number().int().min(0).max(50).optional(),
  region: z.string().min(2).max(10).optional(),
  deviceFingerprint: z.string().max(128).optional(),
});

export const logGreenAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => logActionSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);

    // Fraud control: max 3 actions of the same type per day.
    const { data: limitRow } = await supabase
      .from("daily_action_limits")
      .select("count")
      .eq("user_id", userId)
      .eq("action_type", data.type)
      .eq("day", today)
      .maybeSingle();
    if (limitRow && limitRow.count >= 3) {
      throw new Error("Daily limit reached for this action type. Try a different action.");
    }

    const { carbonKg, points } = scoreAction({
      type: data.type as ActionType,
      distanceKm: data.distanceKm,
      durationMin: data.durationMin,
      kwhSaved: data.kwhSaved,
      mealsSaved: data.mealsSaved,
      region: data.region,
    });

    if (points <= 0) throw new Error("This action does not qualify for points.");

    // Insert action (server-only write)
    const { data: action, error } = await supabaseAdmin
      .from("green_actions")
      .insert({
        user_id: userId,
        action_type: data.type,
        distance_km: data.distanceKm ?? 0,
        duration_min: data.durationMin ?? 0,
        region_code: data.region ?? "US-CA",
        carbon_kg_saved: carbonKg,
        points_earned: points,
        device_fingerprint: data.deviceFingerprint ?? null,
        verified: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Wallet txn (server-only write)
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: userId,
      delta_points: points,
      kind: "earn",
      reference_id: action.id,
      description: `Earned for ${data.type}`,
    });

    // Update daily limit (server-only write)
    if (limitRow) {
      await supabaseAdmin
        .from("daily_action_limits")
        .update({ count: limitRow.count + 1 })
        .eq("user_id", userId)
        .eq("action_type", data.type)
        .eq("day", today);
    } else {
      await supabaseAdmin
        .from("daily_action_limits")
        .insert({ user_id: userId, action_type: data.type, day: today, count: 1 });
    }

    // Update profile totals + streak
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_carbon_kg,total_points,current_streak,last_action_date")
      .eq("id", userId)
      .single();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak =
      profile?.last_action_date === today
        ? profile.current_streak
        : profile?.last_action_date === yesterday
          ? (profile.current_streak ?? 0) + 1
          : 1;
    await supabase
      .from("profiles")
      .update({
        total_carbon_kg: (Number(profile?.total_carbon_kg) || 0) + carbonKg,
        total_points: (profile?.total_points ?? 0) + points,
        current_streak: streak,
        last_action_date: today,
      })
      .eq("id", userId);

    return { carbonKg, points, streak };
  });

// ----- Wallet balance + recent txns -----
export const getWalletSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: txns }, { data: profile }] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("id,delta_points,kind,description,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    ]);
    const balance = (txns ?? []).reduce((s, t) => s + (t.delta_points ?? 0), 0);
    return { balance, txns: txns ?? [], profile };
  });

// ----- Recent actions -----
export const getRecentActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("green_actions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

// ----- Marketplace browse -----
export const listRewards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("rewards")
      .select("*, partners ( id, business_name, location, category )")
      .eq("active", true)
      .order("cost_points", { ascending: true });
    return data ?? [];
  });

export const getReward = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: reward, error } = await context.supabase
      .from("rewards")
      .select("*, partners ( id, business_name, location, category, description )")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return reward;
  });

// ----- Redeem a reward (creates a single-use code expiring in 60s) -----
export const createRedemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ rewardId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reward, error: rerr } = await supabase
      .from("rewards")
      .select("id,cost_points,active,title")
      .eq("id", data.rewardId)
      .maybeSingle();
    if (rerr || !reward) throw new Error("Reward not found");
    if (!reward.active) throw new Error("Reward is inactive");

    // Server-side balance check
    const { data: txns } = await supabase
      .from("wallet_transactions")
      .select("delta_points")
      .eq("user_id", userId);
    const balance = (txns ?? []).reduce((s, t) => s + (t.delta_points ?? 0), 0);
    if (balance < reward.cost_points) throw new Error("Insufficient points");

    const code = generateCode();
    const expiresAt = new Date(Date.now() + QR_CODE_TTL_SECONDS * 1000).toISOString();

    const { data: redemption, error } = await supabase
      .from("redemptions")
      .insert({
        user_id: userId,
        reward_id: reward.id,
        code,
        code_expires_at: expiresAt,
        status: "pending",
        cost_points: reward.cost_points,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Deduct from wallet (server-only write)
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: userId,
      delta_points: -reward.cost_points,
      kind: "redeem",
      reference_id: redemption.id,
      description: `Redeemed: ${reward.title}`,
    });
    const { data: prof } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", userId)
      .single();
    await supabase
      .from("profiles")
      .update({ total_points: (prof?.total_points ?? 0) - reward.cost_points })
      .eq("id", userId);

    return { redemptionId: redemption.id, code, expiresAt };
  });

// ----- My coupons (redemption history) -----
export const listMyCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("redemptions")
      .select("id,code,status,created_at,code_expires_at,cost_points,used_at,rewards(title,description,category,location,partners(business_name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

// ----- Leaderboard (anonymous by default) -----
export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    // Use admin client to read aggregated leaderboard data; expose only anonymized fields.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id,display_name,anonymous_on_leaderboard,total_carbon_kg,total_points,current_streak")
      .order("total_carbon_kg", { ascending: false })
      .limit(50);
    return (data ?? []).map((p, i) => ({
      rank: i + 1,
      handle: p.anonymous_on_leaderboard ? `Anon-${p.id.slice(0, 4)}` : (p.display_name ?? "Member"),
      carbonKg: Number(p.total_carbon_kg ?? 0),
      points: p.total_points ?? 0,
      streak: p.current_streak ?? 0,
    }));
  });

// ----- Profile updates -----
export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        display_name: z.string().min(1).max(60).optional(),
        region_code: z.string().min(2).max(10).optional(),
        anonymous_on_leaderboard: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Export & delete (privacy) -----
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, actions, txns, redemptions] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("green_actions").select("*").eq("user_id", userId),
      supabase.from("wallet_transactions").select("*").eq("user_id", userId),
      supabase.from("redemptions").select("*").eq("user_id", userId),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      actions: actions.data,
      walletTransactions: txns.data,
      redemptions: redemptions.data,
    };
  });

export const deleteMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("wallet_transactions").delete().eq("user_id", userId);
    await supabase.from("green_actions").delete().eq("user_id", userId);
    await supabase.from("redemptions").delete().eq("user_id", userId);
    await supabase.from("daily_action_limits").delete().eq("user_id", userId);
    await supabase
      .from("profiles")
      .update({ total_carbon_kg: 0, total_points: 0, current_streak: 0, last_action_date: null })
      .eq("id", userId);
    return { ok: true };
  });

// ----- Partner: create + manage rewards -----
export const becomePartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        business_name: z.string().min(2).max(120),
        category: z.string().min(2).max(60),
        location: z.string().max(120).optional(),
        description: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("partners")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyPartner = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: partner } = await context.supabase
      .from("partners")
      .select("*")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!partner) return { partner: null, rewards: [], redemptions: [] };
    const [{ data: rewards }, { data: redemptions }] = await Promise.all([
      context.supabase
        .from("rewards")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("redemptions")
        .select("id,code,status,created_at,reward_id,cost_points")
        .in(
          "reward_id",
          (
            await context.supabase.from("rewards").select("id").eq("partner_id", partner.id)
          ).data?.map((r) => r.id) ?? [],
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { partner, rewards: rewards ?? [], redemptions: redemptions ?? [] };
  });

export const createPartnerReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(2).max(120),
        description: z.string().max(500).optional(),
        category: z.string().min(2).max(60),
        location: z.string().max(120).optional(),
        cost_points: z.number().int().positive(),
        stock: z.number().int().nonnegative().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: partner } = await context.supabase
      .from("partners")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!partner) throw new Error("Create a partner profile first.");
    const { error } = await context.supabase
      .from("rewards")
      .insert({ ...data, partner_id: partner.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Admin overview -----
export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) return { forbidden: true as const };
    const [users, partners, rewards, redemptions, actions] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("partners").select("id", { count: "exact", head: true }),
      context.supabase.from("rewards").select("id", { count: "exact", head: true }),
      context.supabase.from("redemptions").select("id", { count: "exact", head: true }),
      context.supabase.from("green_actions").select("id", { count: "exact", head: true }),
    ]);
    return {
      forbidden: false as const,
      users: users.count ?? 0,
      partners: partners.count ?? 0,
      rewards: rewards.count ?? 0,
      redemptions: redemptions.count ?? 0,
      actions: actions.count ?? 0,
    };
  });
