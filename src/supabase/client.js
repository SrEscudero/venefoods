import { createClient } from '@supabase/supabase-js';

// Ve a Supabase.com -> Settings (engranaje) -> API
// Copia la "Project URL" y pégala abajo:
const supabaseUrl = 'https://kdbujvofqpiqrfmxragm.supabase.co'; 

// Copia la "Project API Key" (la que dice anon/public) y pégala abajo:
const supabaseKey = 'sb_publishable_UEHlTPF4zE8RKOnJC4sg-g_igWXCfVd';

export const supabase = createClient(supabaseUrl, supabaseKey);