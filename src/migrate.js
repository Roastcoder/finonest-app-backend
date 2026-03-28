import pool from './config/database.js';

const migrate = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS branches(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN('active', 'inactive')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'executive' CHECK(role IN('admin', 'ops_team', 'manager', 'dsa', 'team_leader', 'executive')),
      phone VARCHAR(20),
      reporting_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
      joining_date DATE,
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN('active', 'inactive')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS banks(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      address TEXT,
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN('active', 'inactive')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS brokers(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE,
      email VARCHAR(255),
      phone VARCHAR(20),
      commission_rate DECIMAL(5, 2) DEFAULT 0,
      address TEXT,
      status VARCHAR(20) DEFAULT 'active' CHECK(status IN('active', 'inactive')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loans(
      id SERIAL PRIMARY KEY,
      loan_number VARCHAR(50) UNIQUE NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20),
      customer_email VARCHAR(255),
      loan_amount DECIMAL(15, 2) NOT NULL,
      bank_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
      broker_id INTEGER REFERENCES brokers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'approved', 'rejected', 'disbursed', 'closed')),
      application_date DATE,
      approval_date DATE,
      disbursement_date DATE,
      vehicle_model VARCHAR(255),
      vehicle_price DECIMAL(15, 2),
      down_payment DECIMAL(15, 2),
      tenure_months INTEGER,
      interest_rate DECIMAL(5, 2),
      emi_amount DECIMAL(15, 2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // Ensure all required columns exist in loans table
    await client.query(`
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL;
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(255);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS co_applicant_name VARCHAR(255);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(255);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS case_type VARCHAR(50);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS financier_name VARCHAR(255);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS sourcing_person_name VARCHAR(255);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS vertical VARCHAR(100);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS scheme VARCHAR(100);
      ALTER TABLE loans ADD COLUMN IF NOT EXISTS emi DECIMAL(15, 2);
    `);

    // Backfill case_type from leads for existing loans
    await client.query(`
      UPDATE loans l
      SET case_type = le.case_type
      FROM leads le
      WHERE l.lead_id = le.id AND l.case_type IS NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads(
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      current_address TEXT,
      pincode VARCHAR(10),
      pan_number VARCHAR(20),
      vehicle_number VARCHAR(50),
      loan_amount_required DECIMAL(15, 2),
      case_type VARCHAR(50) CHECK(case_type IN('Purchase', 'Refinance', 'BT')),
      lead_type VARCHAR(50) CHECK(lead_type IN('Branch Visit', 'Direct Login')),
      financier_id INTEGER REFERENCES banks(id) ON DELETE SET NULL,
      source VARCHAR(100),
      status VARCHAR(20) DEFAULT 'new' CHECK(status IN('new', 'contacted', 'qualified', 'converted', 'lost')),
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      follow_up_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS commissions(
      id SERIAL PRIMARY KEY,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      broker_id INTEGER REFERENCES brokers(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      amount DECIMAL(15, 2) NOT NULL,
      commission_type VARCHAR(20) NOT NULL CHECK(commission_type IN('broker', 'sales', 'referral')),
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'approved', 'paid')),
      payment_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
       CREATE TABLE IF NOT EXISTS pdd_tracking(
      id SERIAL PRIMARY KEY,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      document_type VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'received', 'verified', 'rejected')),
      received_date DATE,
      verified_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // --- NEW PRD TABLES ---

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses(
      id SERIAL PRIMARY KEY,
      expense_type VARCHAR(100) NOT NULL,
      employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      description TEXT,
      amount DECIMAL(15, 2) NOT NULL,
      document_url TEXT,
      expense_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'approved', 'rejected')),
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_ledger(
      id SERIAL PRIMARY KEY,
      dsa_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      payout_percentage DECIMAL(5, 2) NOT NULL,
      calculated_amount DECIMAL(15, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'processed', 'on_hold')),
      utr_reference VARCHAR(100),
      clawback_flag BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rc_limits(
      id SERIAL PRIMARY KEY,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      dsa_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      approved_limit DECIMAL(15, 2) NOT NULL,
      current_balance DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS folio_entries(
      id SERIAL PRIMARY KEY,
      rc_limit_id INTEGER NOT NULL REFERENCES rc_limits(id) ON DELETE CASCADE,
      entry_type VARCHAR(50) NOT NULL CHECK(entry_type IN('payment_request', 'customer_payment', 'rto_payment', 'suspense_clearance')),
      amount DECIMAL(15, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN('pending', 'approved', 'rejected')),
      utr_reference VARCHAR(100),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS insurance_policies(
      id SERIAL PRIMARY KEY,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      insurance_company VARCHAR(255) NOT NULL,
      policy_type VARCHAR(50) NOT NULL CHECK(policy_type IN('Comprehensive', 'TP')),
      policy_number VARCHAR(100),
      premium DECIMAL(15, 2) NOT NULL,
      policy_start DATE NOT NULL,
      policy_expiry DATE NOT NULL,
      idv DECIMAL(15, 2),
      ncb_percentage DECIMAL(5, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs(
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      role VARCHAR(50) NOT NULL,
      action VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id INTEGER,
      before_state JSONB,
      after_state JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications(
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      delivery_method VARCHAR(50) NOT NULL CHECK(delivery_method IN('in-app', 'sms', 'whatsapp', 'email')),
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'unread' CHECK(status IN('unread', 'read', 'sent', 'failed')),
      related_entity_type VARCHAR(100),
      related_entity_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config(
      id SERIAL PRIMARY KEY,
      config_key VARCHAR(100) UNIQUE NOT NULL,
      config_value JSONB NOT NULL,
      description TEXT,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_branches(
      id SERIAL PRIMARY KEY,
      bank_id INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      branch_name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      geo_limit VARCHAR(50),
      product VARCHAR(255),
      sales_manager_name VARCHAR(255),
      sales_manager_mobile VARCHAR(20),
      area_sales_manager_name VARCHAR(255),
      area_sales_manager_mobile VARCHAR(20),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions(
      id SERIAL PRIMARY KEY,
      role VARCHAR(50) NOT NULL UNIQUE,
      permissions JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
