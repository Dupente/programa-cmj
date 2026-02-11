
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmlljmbbsstecdolfaqg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kzFvKbTRbdQF-Sj7V71I1w_otAKaAeM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugUpdate() {
    console.log("🔍 Buscando uma impressora existente...");

    const { data: printers, error: fetchError } = await supabase.from('printers').select('*').limit(1);

    if (fetchError) {
        console.error("❌ Erro ao buscar:", fetchError);
        return;
    }

    if (!printers || printers.length === 0) {
        console.log("⚠️ Nenhuma impressora encontrada. Criando uma de teste...");
        const { data: stringData, error: insertError } = await supabase.from('printers').insert([{
            id: 'debug-printer-' + Date.now(),
            name: 'Debug Printer',
            status: 'Online',
            initialCounter: 100,
            readings: []
        }]).select().single();

        if (insertError) {
            console.error('❌ Falha ao criar impressora de debug:', insertError);
            return;
        }
        printers[0] = stringData; // Use created printer
    }

    const targetPrinter = printers[0];
    console.log("🎯 Alvo:", targetPrinter.name, "(", targetPrinter.id, ")");
    console.log("📊 Dados atuais:", JSON.stringify(targetPrinter, null, 2));

    // Tentar atualizar readings
    console.log("🔄 Tentando atualizar readings...");
    const newReadings = [...(targetPrinter.readings || []), { date: '2026-02', value: 999 }];

    const { data, error } = await supabase
        .from('printers')
        .update({ readings: newReadings })
        .eq('id', targetPrinter.id)
        .select();

    if (error) {
        console.error("❌ ERRO NO UPDATE:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Update com sucesso!");
        console.log("📊 Retorno:", JSON.stringify(data, null, 2));
    }
}

debugUpdate();
