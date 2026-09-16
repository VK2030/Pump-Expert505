import { supabase } from "../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  try {
    if (!supabase) {
      return res.status(500).json({ error: "Supabase not initialized" });
    }

    const start = Date.now();
    const { data, error } = await supabase.from("results").select("count");
    const duration = Date.now() - start;

    if (error) {
       return res.status(500).json({ 
         error: "Supabase Ping Failed", 
         message: error.message,
         details: error.details,
         duration: `${duration}ms`
       });
    }

    res.json({ 
      status: "connected", 
      duration: `${duration}ms`,
      sample: data
    });
  } catch (err: any) {
    res.status(500).json({ 
      error: "Exception during Supabase Test", 
      message: err.message,
      stack: err.stack
    });
  }
}
