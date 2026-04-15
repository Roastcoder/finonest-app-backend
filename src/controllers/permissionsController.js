import db from '../config/database.js';

const DEFAULT_PERMISSIONS = {
  admin: {
    dashboard: { 
      view: true, 
      export: true,
      components: {
        loginVolume: true,
        disbursement: true,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: true,
        statusDistribution: true,
        criticalNodes: true,
        globalTraffic: true,
        applicationBreakdown: true,
        financierPerformance: true,
        timer: true
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: true, export: true, assign: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: true }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: true, export: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: true, approve: true, reject: true, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: true, export: true },
      actions: { changeStage: true, addNotes: true }
    },
    users: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true, create: true },
    settings: { view: true, edit: true }
  },
  manager: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: true,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: true,
        statusDistribution: true,
        criticalNodes: true,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: true
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: true, assign: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: true, approve: true, reject: true, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: true },
      actions: { changeStage: true, addNotes: true }
    },
    users: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, export: true, create: false },
    settings: { view: false, edit: false }
  },
  sales_manager: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: false,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: true,
        statusDistribution: false,
        criticalNodes: false,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: false
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: true, assign: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: false, approve: false, reject: false, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: true },
      actions: { changeStage: true, addNotes: true }
    },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false, create: false },
    settings: { view: false, edit: false }
  },
  branch_manager: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: true,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: true,
        statusDistribution: true,
        criticalNodes: true,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: true
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: true, assign: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: false, approve: true, reject: true, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: true },
      actions: { changeStage: true, addNotes: true }
    },
    users: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, export: true, create: false },
    settings: { view: false, edit: false }
  },
  team_leader: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: false,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: true,
        statusDistribution: false,
        criticalNodes: false,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: false
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: false, assign: true, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: false, changeStatus: true },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: false, approve: false, reject: false, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: false },
      actions: { changeStage: true, addNotes: true }
    },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false, create: false },
    settings: { view: false, edit: false }
  },
  executive: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: false,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: false,
        statusDistribution: false,
        criticalNodes: false,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: false
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: false, assign: false, changeStatus: false },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: false, changeStatus: false },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: false, approve: false, reject: false, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: false },
      actions: { changeStage: false, addNotes: true }
    },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, export: false, create: false },
    settings: { view: false, edit: false }
  },
  dsa: {
    dashboard: { 
      view: true, 
      export: false,
      components: {
        loginVolume: true,
        disbursement: false,
        approvedLoans: true,
        performanceChart: true,
        stageDistribution: true,
        bankDistribution: false,
        statusDistribution: false,
        criticalNodes: false,
        globalTraffic: false,
        applicationBreakdown: true,
        financierPerformance: false
      }
    },
    leads: {
      list: { view: true, create: true, edit: true, delete: false, export: false, assign: false, changeStatus: false },
      form: { allFields: true, requiredFields: ['customer_name', 'phone', 'current_address', 'pincode', 'city', 'state', 'vehicle_number', 'loan_amount_required', 'case_type', 'lead_type'] },
      documents: { upload: true, view: true, delete: false }
    },
    loans: {
      list: { view: true, create: true, edit: true, delete: false, export: false, changeStatus: false },
      form: { allFields: true, requiredFields: ['customer_name', 'loan_amount', 'bank_id', 'case_type'] },
      actions: { disburse: false, approve: false, reject: false, addNotes: true }
    },
    applications: {
      list: { view: true, create: true, edit: true, delete: false, export: false },
      actions: { changeStage: false, addNotes: true }
    },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: false, export: false, create: false },
    settings: { view: false, edit: false }
  }
};

export const getDashboardPermissions = async (req, res) => {
  try {
    // Ensure role_permissions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await db.query('SELECT role, permissions FROM role_permissions ORDER BY role');
    
    const allPermissions = {};
    result.rows.forEach(row => {
      allPermissions[row.role] = row.permissions;
    });

    // Fill in missing roles with defaults
    Object.keys(DEFAULT_PERMISSIONS).forEach(role => {
      if (!allPermissions[role]) {
        allPermissions[role] = DEFAULT_PERMISSIONS[role];
      }
    });

    res.json(allPermissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPermissions = async (req, res) => {
  try {
    const role = req.user.role || 'executive';
    
    // Ensure role_permissions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await db.query(
      'SELECT permissions FROM role_permissions WHERE role = $1',
      [role]
    );

    let permissions = result.rows[0]?.permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.executive;
    
    res.json({
      role,
      permissions,
      dashboardVisibility: getDashboardVisibility(permissions),
      leadPermissions: permissions.leads,
      loanPermissions: permissions.loans,
      applicationPermissions: permissions.applications
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePermissions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update permissions' });
    }

    const { role, permissions } = req.body;

    if (!role || !permissions) {
      return res.status(400).json({ error: 'Role and permissions are required' });
    }

    // Ensure role_permissions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(
      `INSERT INTO role_permissions (role, permissions, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (role) DO UPDATE SET permissions = $2, updated_at = CURRENT_TIMESTAMP`,
      [role, JSON.stringify(permissions)]
    );

    res.json({ message: 'Permissions updated successfully', role, permissions });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllRolePermissions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all permissions' });
    }

    // Ensure role_permissions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await db.query('SELECT role, permissions FROM role_permissions ORDER BY role');
    
    const allPermissions = {};
    result.rows.forEach(row => {
      allPermissions[row.role] = row.permissions;
    });

    // Fill in missing roles with defaults
    Object.keys(DEFAULT_PERMISSIONS).forEach(role => {
      if (!allPermissions[role]) {
        allPermissions[role] = DEFAULT_PERMISSIONS[role];
      }
    });

    res.json(allPermissions);
  } catch (error) {
    console.error('Get all permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const resetPermissions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reset permissions' });
    }

    const { role } = req.body;

    if (!role || !DEFAULT_PERMISSIONS[role]) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Ensure role_permissions table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL UNIQUE,
        permissions JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(
      `INSERT INTO role_permissions (role, permissions) 
       VALUES ($1, $2)
       ON CONFLICT (role) DO UPDATE SET permissions = $2, updated_at = CURRENT_TIMESTAMP`,
      [role, JSON.stringify(DEFAULT_PERMISSIONS[role])]
    );

    res.json({ message: 'Permissions reset to defaults', role, permissions: DEFAULT_PERMISSIONS[role] });
  } catch (error) {
    console.error('Reset permissions error:', error);
    res.status(500).json({ error: error.message });
  }
};

function getDashboardVisibility(permissions) {
  return {
    loginVolume: permissions.dashboard?.components?.loginVolume || false,
    disbursement: permissions.dashboard?.components?.disbursement || false,
    approvedLoans: permissions.dashboard?.components?.approvedLoans || false,
    performanceChart: permissions.dashboard?.components?.performanceChart || false,
    stageDistribution: permissions.dashboard?.components?.stageDistribution || false,
    bankDistribution: permissions.dashboard?.components?.bankDistribution || false,
    statusDistribution: permissions.dashboard?.components?.statusDistribution || false,
    criticalNodes: permissions.dashboard?.components?.criticalNodes || false,
    globalTraffic: permissions.dashboard?.components?.globalTraffic || false,
    applicationBreakdown: permissions.dashboard?.components?.applicationBreakdown || false,
    financierPerformance: permissions.dashboard?.components?.financierPerformance || false
  };
}
