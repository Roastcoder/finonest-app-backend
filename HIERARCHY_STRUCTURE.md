# New User Hierarchy Structure

## Hierarchy Levels (Top to Bottom)

```
Admin
├── Sales Manager
│   ├── Branch Manager
│   │   ├── Team Leader
│   │   │   ├── Executive
│   │   │   └── Executive
│   │   └── Team Leader
│   │       └── Executive
│   └── DSA (Direct Sales Agent)
│       ├── Team Leader
│       │   ├── Executive
│       │   └── Executive
│       └── Team Leader
│           └── Executive
```

## Role Definitions

### 1. Admin
- Full system access
- Can create: Sales Managers
- Can manage: All users and system configurations
- Reporting to: None

### 2. Sales Manager
- Manages multiple branch managers and DSAs
- Can create: Branch Managers, DSAs
- Can see: All users reporting to them
- Reporting to: Admin
- Fields: `reporting_to = admin_id`

### 3. Branch Manager (Same as DSA)
- Manages team leaders and executives in a specific branch
- Can create: Team Leaders, Executives
- Can see: Team leaders and executives reporting to them
- Reporting to: Sales Manager
- Fields: `reporting_to = sales_manager_id`, `branch_id = branch_id`

### 4. DSA (Direct Sales Agent)
- Manages team leaders and executives for direct sales
- Can create: Team Leaders, Executives
- Can see: Team leaders and executives reporting to them
- Reporting to: Sales Manager
- Fields: `reporting_to = sales_manager_id`

### 5. Team Leader
- Manages executives
- Can create: Executives
- Can see: Only their direct reports (executives)
- Reporting to: Branch Manager OR DSA
- Fields: `reporting_to = branch_manager_id OR dsa_id`, `dsa_id = dsa_id (if applicable)`

### 6. Executive
- Individual contributor
- Cannot create users
- Reporting to: Team Leader
- Fields: `reporting_to = team_leader_id`

## Database Schema

### Users Table Fields
```sql
id                  - Primary key
user_id             - Unique identifier (e.g., SM-0001, BM-0002)
full_name           - User's full name
email               - Unique email
password            - Hashed password
phone               - Contact number
role                - User role (admin, sales_manager, branch_manager, dsa, team_leader, executive)
reporting_to        - ID of direct manager
branch_id           - Associated branch (for branch managers)
dsa_id              - Associated DSA (for team leaders under DSA)
joining_date        - Date of joining
status              - active/inactive
created_at          - Creation timestamp
updated_at          - Last update timestamp
```

## Permission Matrix

| Role | Can Create | Can See |
|------|-----------|---------|
| Admin | Sales Managers | All users |
| Sales Manager | Branch Managers, DSAs | Direct reports |
| Branch Manager | Team Leaders, Executives | Direct reports |
| DSA | Team Leaders, Executives | Direct reports |
| Team Leader | Executives | Direct reports |
| Executive | None | Own profile |

## API Endpoints

### Create User
```
POST /api/users
Body: {
  full_name: string,
  email: string,
  password: string,
  phone: string,
  role: string,
  reporting_to: number (optional),
  branch_id: number (optional),
  dsa_id: number (optional)
}
```

### Update User
```
PUT /api/users/:id
Body: {
  full_name: string,
  email: string,
  password: string,
  phone: string,
  role: string,
  reporting_to: number,
  branch_id: number,
  dsa_id: number
}
```

### Get All Users
```
GET /api/users
Returns: Users based on role-based visibility
```

## Migration Steps

1. Run the migration script:
   ```bash
   node run-dsa-migration.js
   ```

2. This will:
   - Add `dsa_id` column to users table
   - Add foreign key constraint
   - Maintain existing data

## Example User Creation Flow

### Creating a Sales Manager (by Admin)
```json
{
  "full_name": "John Sales",
  "email": "john.sales@company.com",
  "password": "secure_password",
  "phone": "9876543210",
  "role": "sales_manager"
}
```

### Creating a Branch Manager (by Sales Manager)
```json
{
  "full_name": "Jane Branch",
  "email": "jane.branch@company.com",
  "password": "secure_password",
  "phone": "9876543211",
  "role": "branch_manager",
  "reporting_to": 2,
  "branch_id": 1
}
```

### Creating a Team Leader (by Branch Manager or DSA)
```json
{
  "full_name": "Bob Team",
  "email": "bob.team@company.com",
  "password": "secure_password",
  "phone": "9876543212",
  "role": "team_leader",
  "reporting_to": 3,
  "dsa_id": null
}
```

### Creating an Executive (by Team Leader)
```json
{
  "full_name": "Alice Executive",
  "email": "alice.exec@company.com",
  "password": "secure_password",
  "phone": "9876543213",
  "role": "executive",
  "reporting_to": 4
}
```
