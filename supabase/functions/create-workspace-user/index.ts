import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Authentication required" }, 401);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  let publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  if (!publicKey) {
    try {
      const keyMap = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
      if (keyMap.default) publicKey = Deno.env.get(keyMap.default) ?? "";
    } catch {
      // Do not fall back to a privileged key.
    }
  }
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !publicKey || !serviceKey) {
    return reply({ error: "Server authentication configuration is missing" }, 500);
  }

  const caller = createClient(url, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await caller.auth.getUser(authorization.slice(7));
  if (authError || !authData.user) return reply({ error: "Invalid session" }, 401);

  const { data: actor, error: actorError } = await admin
    .from("profiles")
    .select("organization_id, is_owner, status")
    .eq("user_id", authData.user.id)
    .single();
  if (actorError || !actor || actor.status !== "active" || actor.is_owner !== true) {
    return reply({ error: "Only the active workspace owner can add users" }, 403);
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const roleId = String(body.role_id ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Enter a valid email address" }, 400);
    if (password.length < 8 || password.length > 128) return reply({ error: "Password must contain 8 to 128 characters" }, 400);
    if (fullName.length < 2 || fullName.length > 120) return reply({ error: "Name must contain 2 to 120 characters" }, 400);
    if (phone.length > 40) return reply({ error: "Phone number is too long" }, 400);
    if (!roleId) return reply({ error: "Choose a role" }, 400);

    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("id, organization_id")
      .eq("id", roleId)
      .eq("organization_id", actor.organization_id)
      .single();
    if (roleError || !role) return reply({ error: "The selected role does not belong to this workspace" }, 400);

    const { data: owners, error: ownersError } = await admin
      .from("profiles")
      .select("role_id")
      .eq("organization_id", actor.organization_id)
      .eq("is_owner", true);
    if (ownersError) return reply({ error: "Could not validate the owner role" }, 500);
    if ((owners ?? []).some((profile: { role_id: string | null }) => profile.role_id === roleId)) {
      return reply({ error: "The owner role cannot be assigned to another user" }, 403);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) return reply({ error: createError?.message ?? "Could not create user" }, 400);

    const { error: profileError } = await admin.from("profiles").insert({
      user_id: created.user.id,
      organization_id: actor.organization_id,
      role_id: roleId,
      full_name: fullName,
      phone: phone || null,
      status: "active",
      is_owner: false,
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return reply({ error: profileError.message }, 400);
    }

    return reply({ user: { id: created.user.id, email, full_name: fullName, role_id: roleId, status: "active" } }, 201);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Unexpected server error" }, 500);
  }
});