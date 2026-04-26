-- Create permissions system tables

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- User specific permissions table (overrides role permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Insert basic permissions
INSERT INTO permissions (permission_name, resource, action, description) VALUES
-- Dashboard permissions
('dashboard.view', 'dashboard', 'view', 'View dashboard'),
('dashboard.export', 'dashboard', 'export', 'Export dashboard data'),
('dashboard.loginVolume', 'dashboard', 'loginVolume', 'View login volume component'),
('dashboard.disbursement', 'dashboard', 'disbursement', 'View disbursement component'),
('dashboard.approvedLoans', 'dashboard', 'approvedLoans', 'View approved loans component'),
('dashboard.performanceChart', 'dashboard', 'performanceChart', 'View performance chart component'),
('dashboard.stageDistribution', 'dashboard', 'stageDistribution', 'View stage distribution component'),
('dashboard.bankDistribution', 'dashboard', 'bankDistribution', 'View bank distribution component'),
('dashboard.statusDistribution', 'dashboard', 'statusDistribution', 'View status distribution component'),
('dashboard.timer', 'dashboard', 'timer', 'View timer component'),

-- Loan permissions
('loans.create', 'loans', 'create', 'Create new loans'),
('loans.read', 'loans', 'read', 'View loans'),
('loans.update', 'loans', 'update', 'Update loan details'),
('loans.delete', 'loans', 'delete', 'Delete loans'),
('loans.updateStage', 'loans', 'updateStage', 'Update loan application stage'),
('loans.viewAll', 'loans', 'viewAll', 'View all loans in system'),

-- Lead permissions
('leads.create', 'leads', 'create', 'Create new leads'),
('leads.read', 'leads', 'read', 'View leads'),
('leads.update', 'leads', 'update', 'Update lead details'),
('leads.delete', 'leads', 'delete', 'Delete leads'),
('leads.assign', 'leads', 'assign', 'Assign leads to users'),
('leads.viewAll', 'leads', 'viewAll', 'View all leads in system'),

-- User permissions
('users.create', 'users', 'create', 'Create new users'),
('users.read', 'users', 'read', 'View user details'),
('users.update', 'users', 'update', 'Update user details'),
('users.delete', 'users', 'delete', 'Delete users'),
('users.viewAll', 'users', 'viewAll', 'View all users in system'),

-- Report permissions
('reports.view', 'reports', 'view', 'View reports'),
('reports.export', 'reports', 'export', 'Export reports'),
('reports.viewAll', 'reports', 'viewAll', 'View all reports in system')

ON CONFLICT (permission_name) DO NOTHING;

-- Insert default role permissions
INSERT INTO role_permissions (role, permission_id, granted) 
SELECT 'admin', id, true FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Sales Manager permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'sales_manager', id, true FROM permissions 
WHERE permission_name IN (
    'dashboard.view', 'dashboard.loginVolume', 'dashboard.approvedLoans', 'dashboard.performanceChart', 'dashboard.timer',
    'loans.create', 'loans.read', 'loans.update', 'loans.updateStage',
    'leads.create', 'leads.read', 'leads.update', 'leads.assign'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Branch Manager permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'branch_manager', id, true FROM permissions 
WHERE permission_name IN (
    'dashboard.view', 'dashboard.loginVolume', 'dashboard.disbursement', 'dashboard.approvedLoans', 'dashboard.stageDistribution', 'dashboard.timer',
    'loans.create', 'loans.read', 'loans.update', 'loans.updateStage',
    'leads.create', 'leads.read', 'leads.update'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Executive permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'executive', id, true FROM permissions 
WHERE permission_name IN (
    'dashboard.view', 'dashboard.disbursement', 'dashboard.approvedLoans', 'dashboard.statusDistribution', 'dashboard.bankDistribution',
    'loans.create', 'loans.read', 'loans.update',
    'leads.create', 'leads.read', 'leads.update'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Team Leader permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'team_leader', id, true FROM permissions 
WHERE permission_name IN (
    'dashboard.view', 'dashboard.loginVolume', 'dashboard.approvedLoans', 'dashboard.performanceChart', 'dashboard.timer',
    'loans.create', 'loans.read', 'loans.update'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- DSA permissions
INSERT INTO role_permissions (role, permission_id, granted)
SELECT 'dsa', id, true FROM permissions 
WHERE permission_name IN (
    'dashboard.view', 'dashboard.approvedLoans', 'dashboard.performanceChart',
    'loans.create', 'loans.read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);