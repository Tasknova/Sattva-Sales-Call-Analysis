import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnyapsjvazxuuhrxwrtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduemFwc2p2YXp4dXVocnh3cnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1ODU3MDAsImV4cCI6MjA0NzE2MTcwMH0.tQ_q6Xkm1tnhW3wj8J-QTb9BVZ1jxMQ_QKxBDMvEP8M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertJobs() {
  try {
    console.log('Fetching clients...');
    
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company_id')
      .eq('is_active', true)
      .limit(5);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return;
    }

    if (!clients || clients.length === 0) {
      console.error('No clients found in the database');
      return;
    }

    console.log(`Found ${clients.length} clients`);
    
    // Job titles to create for each client
    const jobTitles = [
      'Senior Software Developer',
      'DevOps Engineer',
      'Data Analyst',
      'Project Manager',
      'UI/UX Designer'
    ];

    const jobsToInsert = [];

    // Create 5 jobs for each client with 2 openings each
    for (const client of clients) {
      console.log(`Creating jobs for client: ${client.name}`);
      
      for (const title of jobTitles) {
        jobsToInsert.push({
          company_id: client.company_id,
          client_id: client.id,
          title: title,
          description: `We are looking for an experienced ${title} to join our team.`,
          location: 'Remote',
          employment_type: 'full-time',
          experience_level: title.includes('Senior') ? 'senior' : 'mid',
          salary_range: '$80,000 - $120,000',
          requirements: 'Bachelor\'s degree and 3+ years of experience',
          responsibilities: 'Lead projects and mentor junior team members',
          benefits: 'Health insurance, 401k, flexible hours',
          status: 'open',
          positions_available: 2, // 2 openings per job
          is_active: true
        });
      }
    }

    console.log(`Inserting ${jobsToInsert.length} jobs (${clients.length} clients × 5 job titles)...`);
    
    // Insert all jobs
    const { data: insertedJobs, error: insertError } = await supabase
      .from('jobs')
      .insert(jobsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting jobs:', insertError);
      return;
    }

    console.log(`✅ Successfully inserted ${insertedJobs?.length || 0} jobs!`);
    console.log(`Total openings: ${(insertedJobs?.length || 0) * 2} positions`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Jobs per client: 5`);
    console.log(`   - Total jobs: ${insertedJobs?.length || 0}`);
    console.log(`   - Openings per job: 2`);
    console.log(`   - Total openings: ${(insertedJobs?.length || 0) * 2}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
insertJobs();
