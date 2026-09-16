import { supabase } from "../_lib/supabase.js";

console.log("[API] config.ts loaded");

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      if (!supabase) {
        console.warn("Supabase client is null in /api/config. Returning default config.");
        return res.json({ isHistoryAnswersEnabled: true });
      }
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");
      
      if (error) {
        if (error.message && (error.message.includes("fetch failed") || error.code === 'ENOTFOUND')) {
          console.warn("[API] Supabase is unreachable. Returning default config.");
          return res.json({ isHistoryAnswersEnabled: true });
        }
        console.error("Supabase error fetching config:", JSON.stringify(error));
        return res.status(500).json({ 
          error: "Supabase Error", 
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }
      
      const config: Record<string, any> = {};
      data.forEach((item: any) => {
        if (!item.key.endsWith('_password')) {
          config[item.key] = item.value;
        }
      });
      
      res.json(config);
    } catch (error: any) {
      console.error("Internal Server Error in /api/config:", error);
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error.message || String(error)
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value } = req.body;
      const adminPassword = req.headers['x-admin-password'];
      if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
      
      const { data: authData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_password")
        .maybeSingle();
      
      const correctPassword = authData?.value || '2026';
      if (adminPassword !== String(correctPassword)) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value }, { onConflict: 'key' });
        
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
