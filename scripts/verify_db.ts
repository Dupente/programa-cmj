
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmlljmbbsstecdolfaqg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kzFvKbTRbdQF-Sj7V71I1w_otAKaAeM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyIntegration() {
    console.log("🔍 Verificando integração com Supabase...");

    const testPrinter = {
        id: "test-integration-" + Date.now(), // Fixed: Provide ID
        name: "INTEGRATION_TEST_PRINTER",
        ip: "255.255.255.255",
        status: "Offline",
        supplies: { label: "TestToner", level: 99 },
        location: "TestLab",
        subLocation: "Bench1",
        model: "TestModel X1",
        type: "Color",
        initialCounter: 12345,
        readings: [{ date: "2023-01", value: 12345 }]
    };

    console.log("📤 Tentando inserir impressora de teste com TODOS os campos novos...");

    // 1. Insert
    const { data: insertData, error: insertError } = await supabase
        .from('printers')
        .insert([testPrinter])
        .select();

    if (insertError) {
        console.error("❌ FALHA NA INSERÇÃO:", JSON.stringify(insertError, null, 2));
        if (insertError.message?.includes('initialCounter')) {
            console.error("👉 A coluna 'initialCounter' parece não existir.");
        }
        return;
    }

    console.log("✅ Inserção com sucesso!");

    // 2. Select
    const { data: selectData, error: selectError } = await supabase
        .from('printers')
        .select('*')
        .eq('id', testPrinter.id)
        .single();

    if (selectError) {
        console.error("❌ FALHA NA CONSULTA:", selectError);
        return;
    }

    // 3. Verify Fields
    console.log("🔍 Verificando campos retornados:");
    const p = selectData;
    let success = true;

    if (p.model !== testPrinter.model) { console.error(`❌ Model incorreto: ${p.model}`); success = false; }
    else console.log("   ✅ Model: OK");

    if (p.type !== testPrinter.type) { console.error(`❌ Type incorreto: ${p.type}`); success = false; }
    else console.log("   ✅ Type: OK");

    // Check initialCounter case sensitivity
    const returnedCounter = p.initialCounter ?? p.initialcounter;
    if (Number(returnedCounter) === testPrinter.initialCounter) {
        console.log(`   ✅ InitialCounter: OK (Campo: ${p.initialCounter !== undefined ? 'initialCounter' : 'initialcounter'})`);
    } else {
        console.error(`❌ InitialCounter incorreto or Missing. Retorno:`, p);
        success = false;
    }

    // Check readings
    if (!Array.isArray(p.readings) || p.readings.length === 0) { console.error("❌ Readings incorreto"); success = false; }
    else console.log("   ✅ Readings: OK");


    // 4. Cleanup
    console.log("🧹 Limpando dados de teste...");
    await supabase.from('printers').delete().eq('id', testPrinter.id);

    if (success) {
        console.log("🎉 INTEGRAÇÃO 100% CONFIRMADA!");
    } else {
        console.log("⚠️ Integração parcial. Verifique os erros.");
    }
}

verifyIntegration();
