import { supabaseUrl, supabaseServiceKey, supabase as globalSupabase } from "../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  // Simple GET for testing
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: "Login API is alive. Use POST to login.",
      version: "1.0.6" 
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = Math.random().toString(36).substring(7);
  console.log(`[API][${requestId}] Login attempt started`);

  try {
    let body = req.body;
    
    // Handle Buffer from Vercel Serverless
    if (Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf8'));
      } catch (e) {
        console.warn(`[API][${requestId}] Failed to parse body buffer:`, e);
      }
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn(`[API][${requestId}] Failed to parse body string:`, e);
      }
    }
    
    const { role, password } = body || {};
    
    if (!role || !password) {
      console.error(`[API][${requestId}] Missing role or password. Received body:`, JSON.stringify(body || {}), `Headers:`, JSON.stringify(req.headers));
      return res.status(400).json({ error: "Role and password are required", receivedKeys: Object.keys(body || {}) });
    }

    const defaultPasswords: Record<string, string> = {
      contestant: '1777',
      contestant_operator: '2888',
      admin: '2026'
    };

    let correctPassword = defaultPasswords[role];

    if (globalSupabase) {
      try {
        const { data, error } = await globalSupabase
          .from("app_settings")
          .select("value")
          .eq("key", `${role}_password`)
          .maybeSingle();
        
        if (error) {
          console.error(`[API][${requestId}] Supabase error fetching password for ${role}:`, error.message);
        } else if (data?.value) {
          if (role === 'contestant' && data.value === '7777') {
            console.log(`[API][${requestId}] Migrating contestant_password to 1777 in Supabase Database`);
            await globalSupabase
              .from("app_settings")
              .update({ value: '1777' })
              .eq("key", "contestant_password");
            correctPassword = '1777';
          } else {
            correctPassword = data.value;
          }
        } else {
          // If key is missing in Supabase, seed default password
          try {
            await globalSupabase
              .from("app_settings")
              .insert([{ key: `${role}_password`, value: defaultPasswords[role] }]);
          } catch (seedErr) {
            console.warn(`[API][${requestId}] Could not seed ${role}_password:`, seedErr);
          }
        }
      } catch (supabaseErr: any) {
        console.error(`[API][${requestId}] Supabase exception:`, supabaseErr.message);
      }
    } else {
      console.warn(`[API][${requestId}] globalSupabase is null. Using default password.`);
    }

    if (String(password).trim() === String(correctPassword).trim()) {
      return res.status(200).json({ success: true, role, version: "1.0.6" });
    }
    
    return res.status(401).json({ 
      success: false, 
      error: "Invalid password",
      diagnostics: {
        supabaseConfigured: !!supabaseUrl && !!supabaseServiceKey,
        usingDefault: String(correctPassword).trim() === String(defaultPasswords[role]).trim(),
        role: role,
        hasGlobalSupabase: !!globalSupabase
      }
    });
  } catch (error: any) {
    console.error(`[API][${requestId}] CRITICAL ERROR:`, error);
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      requestId 
    });
  }
}
