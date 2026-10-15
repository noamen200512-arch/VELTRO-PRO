import { createClient } from "npm:@supabase/supabase-js@2";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:cors});
  if (req.method !== "POST") return reply({error:"Method not allowed"},405);
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return reply({error:"Authentication required"},401);
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !anon || !service) return reply({error:"Server configuration missing"},500);
  const caller = createClient(url, anon, {global:{headers:{Authorization:auth}},auth:{persistSession:false}});
  const admin = createClient(url, service, {auth:{persistSession:false}});
  const token = auth.slice(7);
  const {data:{user},error:userError} = await caller.auth.getUser(token);
  if (userError || !user) return reply({error:"Invalid session"},401);
  const {data:actor,error:actorError} = await admin.from("profiles").select("organization_id,is_owner,status").eq("user_id",user.id).single();
  if (actorError || !actor || actor.status !== "active" || actor.is_owner !== true) return reply({error:"Only the active workspace owner can add users"},403);
  try {
    const b = await req.json();
    const email = String(b.email ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const full_name = String(b.full_name ?? "").trim();
    const phone = String(b.phone ?? "").trim();
    const role_id = String(b.role_id ?? "");
    if (!email || password.length < 8 || full_name.length < 2 || !role_id) return reply({error:"Enter a valid email, name, password (8+ characters), and role"},400);
    const {data:role,error:roleError} = await admin.from("roles").select("id,organization_id").eq("id",role_id).eq("organization_id",actor.organization_id).single();
    if (roleError || !role) return reply({error:"Invalid role for this workspace"},400);
    const {data:ownerProfiles} = await admin.from("profiles").select("role_id").eq("organization_id",actor.organization_id).eq("is_owner",true);
    if ((ownerProfiles ?? []).some((p:{role_id:string}) => p.role_id === role_id)) return reply({error:"Owner role cannot be assigned to another user"},403);
    const {data:created,error:createError} = await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name}});
    if (createError || !created.user) return reply({error:createError?.message ?? "Could not create user"},400);
    const {error:profileError} = await admin.from("profiles").insert({user_id:created.user.id,organization_id:actor.organization_id,role_id,full_name,phone:phone || null,status:"active",is_owner:false});
    if (profileError) { await admin.auth.admin.deleteUser(created.user.id); return reply({error:profileError.message},400); }
    return reply({user:{id:created.user.id,email,full_name,role_id,status:"active"}},201);
  } catch (e) { return reply({error:e instanceof Error ? e.message : "Unexpected error"},500); }
});