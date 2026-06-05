require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixAdmin() {
    console.log('🔍 Checking admins table...');
    
    // Check what's there
    const { data: admins, error: fetchErr } = await supabase.from('admins').select('*');
    if (fetchErr) {
        console.log('❌ Table error:', fetchErr.message);
        console.log('👉 Please run the SQL setup first from Supabase dashboard.');
        process.exit(1);
    }
    
    console.log('Found admins:', JSON.stringify(admins, null, 2));
    
    const username = 'admin';
    const password = 'Hub2030@';
    const hash = bcrypt.hashSync(password, 10);
    
    if (admins && admins.length > 0) {
        // Update all existing admins
        const { error: updateErr } = await supabase
            .from('admins')
            .update({ username, password_hash: hash })
            .eq('id', admins[0].id);
        
        if (updateErr) {
            console.log('❌ Update error:', updateErr.message);
        } else {
            console.log('✅ Admin updated!');
            console.log('   Username:', username);
            console.log('   Password:', password);
        }
    } else {
        // Insert new admin
        const { error: insertErr } = await supabase
            .from('admins')
            .insert({ username, password_hash: hash });
        
        if (insertErr) {
            console.log('❌ Insert error:', insertErr.message);
        } else {
            console.log('✅ Admin created!');
            console.log('   Username:', username);
            console.log('   Password:', password);
        }
    }
    
    process.exit(0);
}

fixAdmin();
