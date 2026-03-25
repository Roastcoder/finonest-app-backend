import pool from '../config/database.js';

async function deleteApplication(applicationId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete related records first (foreign key constraints)
    await client.query('DELETE FROM loan_documents WHERE loan_id IN (SELECT id FROM loans WHERE application_id = $1)', [applicationId]);
    await client.query('DELETE FROM loan_timeline WHERE loan_id IN (SELECT id FROM loans WHERE application_id = $1)', [applicationId]);
    await client.query('DELETE FROM loans WHERE application_id = $1', [applicationId]);
    await client.query('DELETE FROM leads WHERE application_id = $1', [applicationId]);
    
    // Delete the application
    const result = await client.query('DELETE FROM applications WHERE id = $1 RETURNING *', [applicationId]);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteApplicationsByStatus(status) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const applications = await client.query('SELECT id FROM applications WHERE status = $1', [status]);
    
    for (const app of applications.rows) {
      await client.query('DELETE FROM loan_documents WHERE loan_id IN (SELECT id FROM loans WHERE application_id = $1)', [app.id]);
      await client.query('DELETE FROM loan_timeline WHERE loan_id IN (SELECT id FROM loans WHERE application_id = $1)', [app.id]);
      await client.query('DELETE FROM loans WHERE application_id = $1', [app.id]);
      await client.query('DELETE FROM leads WHERE application_id = $1', [app.id]);
      await client.query('DELETE FROM applications WHERE id = $1', [app.id]);
    }
    
    await client.query('COMMIT');
    return applications.rows.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { deleteApplication, deleteApplicationsByStatus };
