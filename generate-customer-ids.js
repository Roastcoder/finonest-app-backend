import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgres://Board:Sanam%4028@72.61.238.231:3000/board'
});

async function generateCustomerIds() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all leads without customer_id
    const leadsResult = await client.query(`
      SELECT l.id, l.customer_name, l.created_by, u.full_name 
      FROM leads l 
      LEFT JOIN users u ON l.created_by = u.id 
      WHERE l.customer_id IS NULL 
      ORDER BY l.id
    `);

    console.log(`Found ${leadsResult.rows.length} leads without customer_id`);

    for (const lead of leadsResult.rows) {
      // Get user initials
      const userName = lead.full_name || 'User';
      const userInitials = userName.substring(0, 2).toUpperCase();
      
      // Get customer initial
      const customerInitial = (lead.customer_name || 'C').charAt(0).toUpperCase();
      
      // Get count of leads for this user (including current one)
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM leads WHERE created_by = $1 AND id <= $2',
        [lead.created_by, lead.id]
      );
      const leadCount = parseInt(countResult.rows[0].count);
      
      // Generate customer_id
      const customerId = `${userInitials}${customerInitial}${leadCount.toString().padStart(3, '0')}`;
      
      // Update the lead
      await client.query(
        'UPDATE leads SET customer_id = $1 WHERE id = $2',
        [customerId, lead.id]
      );
      
      console.log(`Updated lead ${lead.id} with customer_id: ${customerId}`);
    }
    
    console.log('Customer ID generation completed successfully');
  } catch (error) {
    console.error('Customer ID generation failed:', error);
  } finally {
    await client.end();
  }
}

generateCustomerIds();