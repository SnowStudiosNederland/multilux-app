import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(200).json({ error: "Use POST" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(200).json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { email, naam, bedrijf, telefoon, wefact_code, redirectTo } = req.body || {};

    if (!email) {
      return res.status(200).json({ error: "email is required" });
    }

    // Invite user via Supabase admin API
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTo || process.env.SITE_URL || "https://multilux-app.vercel.app",
      data: {
        naam: naam || "",
        rol: "klant",
        telefoon: telefoon || "",
        bedrijf: bedrijf || "",
      },
    });

    if (error) {
      return res.status(200).json({ error: error.message });
    }

    // Update profiel with wefact_code and goedkeuring
    if (data?.user?.id && wefact_code) {
      // Wait for the trigger to create the profile
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from("profielen").update({
        wefact_code,
        goedgekeurd: true,
        bedrijf: bedrijf || "",
        telefoon: telefoon || "",
      }).eq("id", data.user.id);
    }

    return res.status(200).json({
      success: true,
      userId: data?.user?.id,
      email: data?.user?.email,
    });
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}
