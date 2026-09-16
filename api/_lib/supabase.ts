import { createClient } from "@supabase/supabase-js";
import dns from "node:dns";

// Fix for Node.js 18+ fetch failed issues
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

console.log("[API] supabase.ts initializing");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let supabase: any = null;

try {
  if (supabaseUrl && supabaseServiceKey) {
    // Ensure URL is valid and handle trailing slashes
    let normalizedUrl = supabaseUrl.trim();
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }
    
    if (!normalizedUrl.startsWith('http')) {
      console.error("[API] Invalid SUPABASE_URL format. Must start with http:// or https://. Current value starts with:", normalizedUrl.substring(0, 10));
      supabase = null;
    } else {
      console.log(`[API] Initializing Supabase client with URL: ${normalizedUrl.substring(0, 15)}...`);
      supabase = createClient(normalizedUrl, supabaseServiceKey, {
        auth: {
          persistSession: false
        }
      });
    }
  } else {
    console.warn("[API] Supabase credentials missing. Table storage will be disabled.");
  }
} catch (e: any) {
  console.error("[API] Failed to initialize Supabase client:", e.message || e);
}

export { supabase, supabaseUrl, supabaseServiceKey };
