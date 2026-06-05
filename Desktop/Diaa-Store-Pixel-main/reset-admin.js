require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetAdmin() {
    const username = 'admin';
    const password = 'Hub2030@';
    const hash = bcrypt.hashSync(password, 10);

    // Delete all existing admins
    await supabase.from('admins').delete().neq('id', 0);

    // Insert fresh admin
    const { data, error } = await supabase.from('admins').insert({
        username,
        password_hash: hash
    }).select().single();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Admin reset successfully!');
        console.log('   Username:', username);
        console.log('   Password:', password);
    }
    process.exit(0);
}

resetAdmin();
