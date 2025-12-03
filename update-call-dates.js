import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://fqhwjrpsvsigwlfukxcn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxaHdqcnBzdnNpZ3dsZnVreGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzE5NzgsImV4cCI6MjA0NzI0Nzk3OH0.Eykil-K6C1hMVv5v-LBrJBbvJvHLDcTHD7QUPm2wlYY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Date mapping: Previous week -> This week
const dateMapping = {
  // Monday
  '2024-11-17': '2024-11-24',
  '2024-11-18': '2024-11-25', // Tuesday
  '2024-11-19': '2024-11-26', // Wednesday
  '2024-11-20': '2024-11-27', // Thursday
  '2024-11-21': '2024-11-28', // Friday
};

async function updateCallDates() {
  try {
    console.log('🔄 Starting to update call dates...');

    // Fetch all calls from last week (Nov 17-21)
    const { data: calls, error: fetchError } = await supabase
      .from('call_history')
      .select('*')
      .gte('created_at', '2024-11-17T00:00:00')
      .lt('created_at', '2024-11-22T00:00:00');

    if (fetchError) {
      console.error('❌ Error fetching calls:', fetchError);
      return;
    }

    console.log(`📊 Found ${calls?.length || 0} calls to update`);

    if (!calls || calls.length === 0) {
      console.log('✅ No calls to update');
      return;
    }

    // Update each call
    let updatedCount = 0;
    for (const call of calls) {
      const oldDate = call.created_at.split('T')[0];
      const newDate = dateMapping[oldDate];

      if (!newDate) {
        console.log(`⏭️  Skipping call ${call.id} - date ${oldDate} not in mapping`);
        continue;
      }

      // Preserve the time part
      const timePart = call.created_at.split('T')[1];
      const newDateTime = `${newDate}T${timePart}`;

      // Update call_date if it exists
      const newCallDate = call.call_date ? `${newDate}T${call.call_date.split('T')[1]}` : null;

      const { error: updateError } = await supabase
        .from('call_history')
        .update({
          created_at: newDateTime,
          call_date: newCallDate || newDateTime,
        })
        .eq('id', call.id);

      if (updateError) {
        console.error(`❌ Error updating call ${call.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✅ Updated call ${call.id}: ${oldDate} -> ${newDate}`);
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${calls.length} calls`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateCallDates();
