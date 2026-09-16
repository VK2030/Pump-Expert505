import { supabase } from "../_lib/supabase.js";
import dns from "node:dns";

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userName, questionIds } = req.body;
    if (!supabase) return res.status(500).json({ error: "Supabase not initialized" });
    if (!userName || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Fetch current counts in one go
    const { data: existingViews, error: selectError } = await supabase
      .from("question_views")
      .select("question_id, view_count")
      .eq("user_name", userName)
      .in("question_id", questionIds);
    
    if (selectError) throw selectError;

    const viewMap = new Map<any, number>(existingViews?.map((v: any) => [v.question_id, Number(v.view_count) || 0]) || []);
    
    const upsertData = questionIds.map(qId => ({
      user_name: userName,
      question_id: qId,
      view_count: (viewMap.get(qId) || 0) + 1,
      updated_at: new Date().toISOString()
    }));

    const { error: upsertError } = await supabase
      .from("question_views")
      .upsert(upsertData, { onConflict: 'user_name,question_id' });

    if (upsertError) throw upsertError;

    res.json({ success: true, count: upsertData.length });
  } catch (error: any) {
    console.error("[API] Views increment error:", error);
    res.status(500).json({ error: error.message });
  }
}
