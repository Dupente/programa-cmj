
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmlljmbbsstecdolfaqg.supabase.co';
// Using the key found in lib/supabaseClient.ts
const SUPABASE_ANON_KEY = 'sb_publishable_kzFvKbTRbdQF-Sj7V71I1w_otAKaAeM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing connection...");
    const { data, error } = await supabase.from('printers').select('*').limit(1);
    if (error) {
        // Determine if it is an auth error or something else
        console.error("Select Error:", JSON.stringify(error, null, 2));
        return;
    }
    console.log("Connection success. Row 1 keys:", data && data[0] ? Object.keys(data[0]) : "No data found");

    console.log("Attempting insert with new fields...");
    const { error: insertError } = await supabase.from('printers').insert([{
        name: "Test Printer",
        ip: "0.0.0.0",
        status: "Offline",
        supplies: { label: "Test", level: 0 },
        location: "Test",
        subLocation: "Test",
        // New fields
        model: "Test Model",
        type: "PB",
        initialCounter: 0,
        readings: []
    }]);

    if (insertError) {
        console.error("Insert Error:", JSON.stringify(insertError, null, 2));
    } else {
        console.log("Insert Success!");
        // Cleanup
        await supabase.from('printers').delete().eq('ip', '0.0.0.0');
    }
}

test();
