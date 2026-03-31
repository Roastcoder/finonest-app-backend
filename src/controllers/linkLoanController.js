import axios from 'axios';
import db from '../config/database.js';

const CACHE_DAYS = 90;
const SUREPASS_API_URL = 'https://kyc-api.surepass.io/api/v1/credit-report-v2/fetch-report';
const SUREPASS_TOKEN = process.env.SUREPASS_TOKEN || '';
const ALLOWED_ROLES = ['admin', 'sales_manager', 'branch_manager'];

// Ensure tables exist
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS experian_credit_cache (
      id SERIAL PRIMARY KEY,
      rc_number VARCHAR(20) UNIQUE NOT NULL,
      mobile VARCHAR(15),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      credit_data JSONB NOT NULL,
      fetched_at TIMESTAMP DEFAULT NOW(),
      fetched_by INTEGER
    )
  `);
  await db.query(`ALTER TABLE experian_credit_cache ALTER COLUMN mobile DROP NOT NULL`).catch(() => {});
  await db.query(`ALTER TABLE experian_credit_cache ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20)`).catch(() => {});
  await db.query(`
    CREATE TABLE IF NOT EXISTS link_loan_audit (
      id SERIAL PRIMARY KEY,
      rc_number VARCHAR(20),
      action VARCHAR(50),
      performed_by INTEGER,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE loans ADD COLUMN IF NOT EXISTS link_loan_checked VARCHAR(10) DEFAULT NULL`);
  await db.query(`ALTER TABLE loans ADD COLUMN IF NOT EXISTS link_loan_tag VARCHAR(50) DEFAULT NULL`);
  await db.query(`ALTER TABLE loans ADD COLUMN IF NOT EXISTS link_loan_data JSONB DEFAULT NULL`);
  await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS link_loan_checked VARCHAR(10) DEFAULT NULL`);
  await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS link_loan_tag VARCHAR(50) DEFAULT NULL`);
  await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS link_loan_data JSONB DEFAULT NULL`);
};
ensureTables().catch(console.error);

// Call Surepass Credit Report API
async function callSurepassAPI(name, id_number, id_type, mobile, consent = 'Y') {
  try {
    const response = await axios.post(
      SUREPASS_API_URL,
      {
        name: name,
        id_number: id_number,
        id_type: id_type || 'aadhaar',
        mobile: mobile,
        consent: consent
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUREPASS_TOKEN}`
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Surepass API error:', error.response?.status, error.response?.data);
    throw error;
  }
}

// RC Lookup — DB only, no external RC API call
export const rcLookup = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const { rc_number } = req.body;
    if (!rc_number) return res.status(400).json({ error: 'RC number is required' });

    const rcUpper = rc_number.toUpperCase().trim();
    const rcStripped = rcUpper.replace(/\s/g, '');

    const cached = await db.query('SELECT rc_data FROM rc_cache WHERE rc_number = $1', [rcUpper]);
    if (cached.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found in database. Please run RC Verification first.' });
    }

    const rc = cached.rows[0].rc_data;
    const ownerName = rc.owner_name || '';
    const nameParts = ownerName.trim().split(/\s+/).filter(Boolean);
    let first_name = nameParts[0] || '';
    let last_name = nameParts.slice(1).join(' ') || '';
    let mobile = rc.mobile_number || '';

    // Fallback mobile from leads/loans
    if (!mobile) {
      const r = await db.query(
        `SELECT phone FROM leads WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND phone IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [rcStripped]
      );
      if (r.rows.length > 0) mobile = r.rows[0].phone;
    }
    if (!mobile) {
      const r = await db.query(
        `SELECT mobile FROM loans WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND mobile IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [rcStripped]
      );
      if (r.rows.length > 0) mobile = r.rows[0].mobile;
    }

    // Fallback name from leads/loans
    if (!first_name) {
      const r = await db.query(
        `SELECT customer_name FROM leads WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND customer_name IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [rcStripped]
      );
      if (r.rows.length > 0) {
        const p = (r.rows[0].customer_name || '').trim().split(/\s+/).filter(Boolean);
        first_name = p[0] || ''; last_name = p.slice(1).join(' ') || '';
      }
    }
    if (!first_name) {
      const r = await db.query(
        `SELECT applicant_name FROM loans WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND applicant_name IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [rcStripped]
      );
      if (r.rows.length > 0) {
        const p = (r.rows[0].applicant_name || '').trim().split(/\s+/).filter(Boolean);
        first_name = p[0] || ''; last_name = p.slice(1).join(' ') || '';
      }
    }

    await db.query(
      'INSERT INTO link_loan_audit (rc_number, action, performed_by, details) VALUES ($1,$2,$3,$4)',
      [rcUpper, 'RC_LOOKUP', req.user.id, JSON.stringify({ rc_number: rcUpper })]
    ).catch(() => {});

    // Try to fetch PAN from leads/loans
    let pan = '';
    const panR = await db.query(
      `SELECT pan_number FROM leads WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND pan_number IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      [rcStripped]
    );
    if (panR.rows.length > 0) pan = panR.rows[0].pan_number;
    if (!pan) {
      const panR2 = await db.query(
        `SELECT pan_number FROM loans WHERE UPPER(REPLACE(vehicle_number,' ','')) = $1 AND pan_number IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
        [rcStripped]
      );
      if (panR2.rows.length > 0) pan = panR2.rows[0].pan_number;
    }

    res.json({
      rc_number: rcUpper,
      first_name,
      last_name,
      mobile,
      pan,
      maker_name: rc.maker_description || '',
      model_name: rc.maker_model || '',
      finance_status: rc.finance_status || (rc.financer ? 'Active' : 'Not Financed'),
      financer: rc.financer || '',
      owner_name: ownerName || `${first_name} ${last_name}`.trim(),
      mobile_missing: !mobile,
      name_missing: !first_name,
    });
  } catch (error) {
    console.error('RC lookup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Credit Report — 90-day cache, using Surepass API
export const getCreditReport = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const { name, id_number, id_type, mobile, rc_number, force_refresh, pan } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!id_number || !id_type) {
      return res.status(400).json({ error: 'ID number and ID type are required' });
    }
    if (force_refresh && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Admin can repull fresh credit data' });
    }

    const rcUpper = (rc_number || '').toUpperCase().trim();
    const panUpper = (pan || '').toUpperCase().trim();
    const cacheKey = rcUpper || panUpper || id_number;

    // Check 90-day cache
    if (!force_refresh && cacheKey) {
      const cached = await db.query(
        `SELECT credit_data, fetched_at FROM experian_credit_cache 
         WHERE (rc_number = $1 OR pan_number = $2) 
         AND fetched_at > NOW() - INTERVAL '${CACHE_DAYS} days'
         LIMIT 1`,
        [rcUpper, panUpper]
      );
      if (cached.rows.length > 0) {
        const ageDays = Math.floor((Date.now() - new Date(cached.rows[0].fetched_at).getTime()) / 86400000);
        return res.json({
          from_cache: true,
          cache_age: `${ageDays} day${ageDays !== 1 ? 's' : ''} ago`,
          credit_score: extractCreditScore(cached.rows[0].credit_data),
          auto_loans: extractAutoLoans(cached.rows[0].credit_data),
          full_report: extractFullReport(cached.rows[0].credit_data),
        });
      }
    }

    // Call Surepass API
    let creditData;
    try {
      creditData = await callSurepassAPI(
        name.trim(),
        id_number.trim(),
        id_type || 'aadhaar',
        (mobile || '').trim(),
        'Y'
      );
    } catch (err) {
      console.error('Surepass API error:', err.response?.status, JSON.stringify(err.response?.data));
      return res.status(502).json({
        error: `Credit bureau API failed (${err.response?.status || err.code}): ${err.response?.data?.message || err.message}`,
      });
    }

    // Cache result
    await db.query(
      `INSERT INTO experian_credit_cache (rc_number, pan_number, mobile, first_name, last_name, credit_data, fetched_at, fetched_by)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       ON CONFLICT (rc_number) DO UPDATE SET credit_data=$6, fetched_at=NOW(), fetched_by=$7`,
      [rcUpper || `ID_${id_number}`, panUpper || null, (mobile || '').trim(), name.trim(), '', JSON.stringify(creditData), req.user.id]
    ).catch(err => console.error('Cache insert error:', err));

    await db.query(
      'INSERT INTO link_loan_audit (rc_number, action, performed_by, details) VALUES ($1, $2, $3, $4)',
      [rcUpper, force_refresh ? 'CREDIT_REPULL' : 'CREDIT_FETCH', req.user.id, JSON.stringify({ name, id_number, id_type, mobile })]
    ).catch(() => {});

    res.json({
      from_cache: false,
      cache_age: null,
      credit_score: extractCreditScore(creditData),
      auto_loans: extractAutoLoans(creditData),
      full_report: extractFullReport(creditData)
    });
  } catch (error) {
    console.error('Credit report error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Tag lead as LINK LOAN EXIST
export const tagLead = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const { rc_number, lender, link_loans } = req.body;
    if (!rc_number) return res.status(400).json({ error: 'rc_number is required' });

    const rcUpper = rc_number.toUpperCase().trim();
    const rcStripped = rcUpper.replace(/\s/g, '');
    const tagData = { lender, link_loans, tagged_at: new Date().toISOString(), tagged_by: req.user.id };

    const leadR = await db.query(
      `SELECT id FROM leads WHERE UPPER(REPLACE(vehicle_number,' ',''))=$1 ORDER BY created_at DESC LIMIT 1`,
      [rcStripped]
    );
    const loanR = await db.query(
      `SELECT id FROM loans WHERE UPPER(REPLACE(vehicle_number,' ',''))=$1 ORDER BY created_at DESC LIMIT 1`,
      [rcStripped]
    );

    if (leadR.rows.length > 0)
      await db.query(`UPDATE leads SET link_loan_tag='LINK LOAN EXIST', link_loan_data=$1 WHERE id=$2`, [JSON.stringify(tagData), leadR.rows[0].id]);
    if (loanR.rows.length > 0)
      await db.query(`UPDATE loans SET link_loan_tag='LINK LOAN EXIST', link_loan_data=$1 WHERE id=$2`, [JSON.stringify(tagData), loanR.rows[0].id]);

    await db.query('INSERT INTO link_loan_audit (rc_number,action,performed_by,details) VALUES ($1,$2,$3,$4)',
      [rcUpper, 'TAG_LINK_LOAN', req.user.id, JSON.stringify(tagData)]).catch(() => {});

    res.json({ success: true, message: 'Lead tagged as LINK LOAN EXIST' });
  } catch (error) {
    console.error('Tag lead error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update link_loan_checked on a loan
export const updateLinkLoanChecked = async (req, res) => {
  try {
    const { loan_id, checked } = req.body;
    if (!loan_id || !checked) return res.status(400).json({ error: 'loan_id and checked (Yes/No) are required' });
    if (!['Yes', 'No'].includes(checked)) return res.status(400).json({ error: 'checked must be Yes or No' });

    await db.query(`UPDATE loans SET link_loan_checked=$1, updated_at=NOW() WHERE id=$2`, [checked, loan_id]);
    await db.query('INSERT INTO link_loan_audit (rc_number,action,performed_by,details) VALUES ($1,$2,$3,$4)',
      ['N/A', 'LINK_LOAN_CHECKED', req.user.id, JSON.stringify({ loan_id, checked })]).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Auto-trigger on APPROVED stage
export const autoCheckForLoan = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });

    const { loan_id } = req.params;
    const loanR = await db.query('SELECT vehicle_number, mobile, applicant_name FROM loans WHERE id=$1', [loan_id]);
    if (loanR.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

    const loan = loanR.rows[0];
    if (!loan.vehicle_number) return res.json({ skipped: true, reason: 'No vehicle number on loan' });

    const rcUpper = loan.vehicle_number.toUpperCase().trim();
    const rcR = await db.query('SELECT rc_data FROM rc_cache WHERE rc_number=$1', [rcUpper]);
    if (rcR.rows.length === 0) return res.json({ skipped: true, reason: 'RC not in cache' });

    const rc = rcR.rows[0].rc_data;
    if (!rc.financer && (!rc.finance_status || rc.finance_status === 'Not Financed'))
      return res.json({ skipped: true, reason: 'Vehicle not financed' });

    const ownerName = rc.owner_name || loan.applicant_name || '';
    const parts = ownerName.trim().split(/\s+/).filter(Boolean);
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || '';
    const mobile = rc.mobile_number || loan.mobile || '';

    if (!first_name) return res.json({ skipped: true, reason: 'No customer name available' });

    // Check cache first
    const cacheR = await db.query(
      `SELECT credit_data FROM experian_credit_cache WHERE rc_number=$1 AND fetched_at > NOW() - INTERVAL '${CACHE_DAYS} days'`,
      [rcUpper]
    );

    let creditData, fromCache = false;
    if (cacheR.rows.length > 0) {
      creditData = cacheR.rows[0].credit_data;
      fromCache = true;
    } else {
      try {
        creditData = await callSurepassAPI(first_name, rcUpper, 'vehicle_rc', mobile, 'Y');
        await db.query(
          `INSERT INTO experian_credit_cache (rc_number, mobile, first_name, last_name, credit_data, fetched_at, fetched_by)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)
           ON CONFLICT (rc_number) DO UPDATE SET credit_data=$5, fetched_at=NOW(), fetched_by=$6`,
          [rcUpper, mobile, first_name, last_name, JSON.stringify(creditData), req.user.id]
        );
      } catch (err) {
        console.error('Auto-check Surepass error:', err.response?.status, err.message);
        return res.json({ skipped: true, reason: 'Credit API unavailable' });
      }
    }

    res.json({ success: true, from_cache: fromCache, auto_loans: extractAutoLoans(creditData), credit_score: extractCreditScore(creditData), vehicle_financed: true });
  } catch (error) {
    console.error('Auto check error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Extract active loans from Experian response
// Response path: data.result.CAIS_Account.CAIS_Account_DETAILS
// Account_Status "11" = Active
const ALLOWED_ACCOUNT_TYPES = new Set([
  '1','5','6','9','11','12','13','16','17','32','33','34',
  '45','46','47','51','52','53','54','55','56','57','58',
  '59','61','69','71','00'
]);

const ACCOUNT_TYPE_NAMES = {
  '1':'AUTO LOAN','5':'PERSONAL LOAN','6':'CONSUMER LOAN','9':'LOAN TO PROFESSIONAL',
  '11':'LEASING','12':'OVERDRAFT','13':'TWO-WHEELER LOAN','16':'FLEET CARD',
  '17':'Commercial Vehicle Loan','32':'Used Car Loan','33':'Construction Equipment Loan',
  '34':'Tractor Loan','45':'P2P Personal Loan','46':'P2P Auto Loan','47':'P2P Education Loan',
  '51':'BUSINESS LOAN - GENERAL','52':'BUSINESS LOAN - PRIORITY SECTOR - SMALL BUSINESS',
  '53':'BUSINESS LOAN - PRIORITY SECTOR - AGRICULTURE','54':'BUSINESS LOAN - PRIORITY SECTOR - OTHERS',
  '55':'BUSINESS NON-FUNDED CREDIT FACILITY - GENERAL',
  '56':'BUSINESS NON-FUNDED CREDIT FACILITY - PRIORITY SECTOR - SMALL BUSINESS',
  '57':'BUSINESS NON-FUNDED CREDIT FACILITY - PRIORITY SECTOR - AGRICULTURE',
  '58':'BUSINESS NON-FUNDED CREDIT FACILITY - PRIORITY SECTOR - OTHERS',
  '59':'BUSINESS LOANS AGAINST BANK DEPOSITS','61':'Business Loan - Unsecured',
  '69':'Short Term Personal Loan [Unsecured]','71':'Temporary Overdraft [Unsecured]','00':'Others'
};

function extractCreditScore(creditData) {
  try {
    const score =
      creditData?.data?.credit_score ||
      creditData?.credit_score ||
      null;
    const n = Number(score);
    return (!isNaN(n) && n > 0) ? n : null;
  } catch { return null; }
}

function extractAutoLoans(creditData) {
  try {
    const creditReport = creditData?.data?.credit_report || creditData?.credit_report || {};
    const ccrResponse = creditReport?.CCRResponse || {};
    const cirReportDataLst = ccrResponse?.CIRReportDataLst || [];
    
    const autoLoans = [];
    
    cirReportDataLst.forEach(report => {
      const cirData = report?.CIRReportData || {};
      const retailAccountDetails = cirData?.RetailAccountDetails || [];
      const retailArr = Array.isArray(retailAccountDetails) ? retailAccountDetails : [retailAccountDetails];
      
      retailArr.forEach(acc => {
        if (!acc) return;
        const accountType = String(acc.AccountType || '').toLowerCase();
        
        // Check if it's ONLY an auto loan (not credit card or other)
        if (accountType.includes('auto loan')) {
          autoLoans.push({
            account_number: acc.AccountNumber || '',
            subscriber_name: acc.Institution || '',
            account_type: acc.AccountType || 'AUTO LOAN',
            account_type_code: '1',
            sanctioned_amount: Number(acc.SanctionAmount || 0),
            current_balance: Number(acc.Balance || 0),
            open_date: acc.DateOpened || '',
            close_date: acc.DateClosed || '',
            account_holder_type: acc.OwnershipType || 'Individual',
            account_status: acc.Open === 'Yes' ? 'Active' : 'Closed',
            date_reported: acc.DateReported || '',
          });
        }
      });
    });
    
    return autoLoans;
  } catch (e) {
    console.error('extractAutoLoans error:', e);
    return [];
  }
}

function fmtDate(raw) {
  if (!raw || String(raw).length !== 8) return raw || '';
  return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
}

function extractFullReport(creditData) {
  try {
    const creditReport = creditData?.data?.credit_report || creditData?.credit_report || {};
    const ccrResponse = creditReport?.CCRResponse || {};
    const cirReportDataLst = ccrResponse?.CIRReportDataLst || [];
    
    let personal = {};
    let allAccounts = [];
    let enquiries = [];
    
    cirReportDataLst.forEach(report => {
      const cirData = report?.CIRReportData || {};
      const idInfo = cirData?.IDAndContactInfo || {};
      const personalInfo = idInfo?.PersonalInfo || {};
      
      // Extract personal info from first report
      if (!personal.name && personalInfo.Name) {
        personal = {
          name: `${personalInfo.Name?.FirstName || ''} ${personalInfo.Name?.LastName || ''}`.trim() || null,
          dob: personalInfo.DateOfBirth || null,
          gender: personalInfo.Gender || null,
          pan: idInfo?.IdentityInfo?.PANId?.[0]?.IdNumber || null,
          mobile: idInfo?.PhoneInfo?.[0]?.Number || null,
          email: idInfo?.EmailAddressInfo?.[0]?.Email || null,
        };
      }
      
      // Extract accounts
      const accounts = cirData?.CAIS_Account?.CAIS_Account_DETAILS || [];
      const accountsArr = Array.isArray(accounts) ? accounts : [accounts];
      
      accountsArr.forEach(acc => {
        if (!acc) return;
        allAccounts.push({
          account_number: acc.Account_Number || '',
          subscriber_name: acc.Subscriber_Name || '',
          account_type: String(acc.Account_Type || ''),
          account_status: String(acc.Account_Status) === '11' ? 'Active' : 'Closed',
          sanctioned_amount: Number(acc.Highest_Credit_or_Original_Loan_Amount || 0),
          current_balance: Number(acc.Current_Balance || 0),
          amount_overdue: Number(acc.Amount_Past_Due || 0),
          emi_amount: Number(acc.Scheduled_Monthly_Payment_Amount || 0),
          open_date: fmtDate(String(acc.Open_Date || '')),
          close_date: acc.Date_Closed ? fmtDate(String(acc.Date_Closed).replace(/-/g, '')) : '',
          date_of_last_payment: acc.Date_of_Last_Payment ? fmtDate(String(acc.Date_of_Last_Payment).replace(/-/g, '')) : '',
          date_reported: fmtDate(String(acc.Date_Reported || '')),
          account_holder_type: String(acc.AccountHoldertypeCode) === '1' ? 'Individual' : String(acc.AccountHoldertypeCode || ''),
          payment_history: (() => {
            const hist = acc.CAIS_Account_History || [];
            const histArr = Array.isArray(hist) ? hist : [hist];
            return histArr.map(h => ({
              month: `${String(h.Month || '').padStart(2, '0')}/${h.Year || ''}`,
              days_past_due: Number(h.Days_Past_Due || 0),
              asset_classification: h.Asset_Classification || '',
            }));
          })(),
        });
      });
    });
    
    return { personal, accounts: allAccounts, enquiries };
  } catch (e) {
    console.error('extractFullReport error:', e);
    return { personal: {}, accounts: [], enquiries: [] };
  }
}
