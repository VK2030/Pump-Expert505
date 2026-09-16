import { supabase } from "../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.json({});
    }

    const { data, error } = await supabase
      .from("question_views")
      .select("question_id, user_name")
      .neq("user_name", "admin")
      .neq("user_name", "Администратор");

    if (error) {
      console.error("[API] Error fetching question views for summary:", error);
      return res.status(500).json({ error: error.message });
    }

    const moduleCounts: Record<string, number> = {};
    const uniqueIdsByModule: Record<string, Set<string>> = {};

    if (data) {
      data.forEach((row: any) => {
        const qId = row.question_id;
        if (!qId) return;

        // Extract moduleId from question_id (e.g. "esp-selection-startup_3" -> "esp-selection-startup")
        const idx = qId.lastIndexOf('_');
        const moduleId = idx !== -1 ? qId.substring(0, idx) : qId;

        if (!uniqueIdsByModule[moduleId]) {
          uniqueIdsByModule[moduleId] = new Set<string>();
        }
        uniqueIdsByModule[moduleId].add(qId);
      });

      for (const [modId, set] of Object.entries(uniqueIdsByModule)) {
        moduleCounts[modId] = set.size;
      }
    }

    res.json(moduleCounts);
  } catch (err: any) {
    console.error("[API] question-views exception:", err);
    res.status(500).json({ error: err.message });
  }
}
