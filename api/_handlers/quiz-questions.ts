import { supabase } from "../_lib/supabase.js";
import { createRequire } from "module";
import dns from "node:dns";

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const require = createRequire(import.meta.url);
const questionsData = require("../_lib/questions.json");

console.log("[API] questions handler starting");

export default async function handler(req: any, res: any) {
  const { moduleId } = req.query;
  const { userName } = req.query;

  console.log(`[API] Request for module: ${moduleId}, user: ${userName}`);

  try {
    if (!questionsData) {
      console.error(`[API] Questions data is missing`);
      return res.status(500).json({ error: "Questions data missing" });
    }

    const questionsForModule = (questionsData as any)[moduleId] || [];
    console.log(`[API] Found ${questionsForModule.length} questions for module: ${moduleId}`);
    
    // Форматируем вопросы с ID
    const formattedQuestions = questionsForModule.map((q: any, i: number) => ({
      ...q,
      id: `${moduleId}_${i}`,
      viewCount: 0
    }));

    if (userName && supabase) {
      try {
        const { data: views, error: viewsError } = await supabase
          .from("question_views")
          .select("question_id, view_count")
          .eq("user_name", userName);
        
        if (viewsError) {
          console.error("Supabase error fetching question views:", JSON.stringify(viewsError));
        } else if (views) {
          const viewMap = new Map(views.map((v: any) => [v.question_id, v.view_count]));
          const enrichedQuestions = formattedQuestions.map((q: any) => ({
            ...q,
            viewCount: viewMap.get(q.id) || 0
          }));
          return res.json(enrichedQuestions);
        }
      } catch (e: any) {
        console.error("Exception fetching question views from Supabase:", e);
      }
    }

    res.json(formattedQuestions);
  } catch (error: any) {
    console.error("Internal Server Error in /api/quiz/questions:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || String(error)
    });
  }
}
