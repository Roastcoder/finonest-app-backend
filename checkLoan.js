import db from './src/config/database.js';

async function checkLoan() {
  try {
    console.log('🔍 Checking loan CL-2026-4836...\n');
    
    const result = await db.query(
      `SELECT 
        loan_number,
        applicant_name,
        income_source,
        -- Salaried fields
        company_name,
        designation,
        net_monthly_salary,
        salary_credit_mode,
        salary_slip_available,
        current_job_years,
        total_work_exp,
        -- Self Employed fields
        profile,
        business_name,
        business_type,
        business_vintage,
        professional_subtype,
        practice_experience,
        freelancer_subtype,
        other_income_type,
        -- Common
        itr_available,
        annual_income_itr
      FROM loans 
      WHERE loan_number = $1`,
      ['CL-2026-4836']
    );

    if (result.rows.length === 0) {
      console.log('❌ Loan CL-2026-4836 not found in database!');
      process.exit(0);
    }

    const loan = result.rows[0];
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 LOAN DETAILS FOR CL-2026-4836');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('👤 Applicant Name:', loan.applicant_name || 'N/A');
    console.log('💼 Income Source:', loan.income_source || 'N/A');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SALARIED FIELDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Company Name:', loan.company_name || 'NULL');
    console.log('Designation:', loan.designation || 'NULL');
    console.log('Net Monthly Salary:', loan.net_monthly_salary || 'NULL');
    console.log('Salary Credit Mode:', loan.salary_credit_mode || 'NULL');
    console.log('Salary Slip Available:', loan.salary_slip_available || 'NULL');
    console.log('Current Job Years:', loan.current_job_years || 'NULL');
    console.log('Total Work Exp:', loan.total_work_exp || 'NULL');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 SELF EMPLOYED FIELDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Profile:', loan.profile || 'NULL');
    console.log('Business Name:', loan.business_name || 'NULL');
    console.log('Business Type:', loan.business_type || 'NULL');
    console.log('Business Vintage:', loan.business_vintage || 'NULL');
    console.log('Professional Subtype:', loan.professional_subtype || 'NULL');
    console.log('Practice Experience:', loan.practice_experience || 'NULL');
    console.log('Freelancer Subtype:', loan.freelancer_subtype || 'NULL');
    console.log('Other Income Type:', loan.other_income_type || 'NULL');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 COMMON FIELDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ITR Available:', loan.itr_available || 'NULL');
    console.log('Annual Income ITR:', loan.annual_income_itr || 'NULL');

    // Analysis
    const hasSalariedData = !!(
      loan.company_name || 
      loan.designation || 
      loan.net_monthly_salary || 
      loan.salary_credit_mode ||
      loan.current_job_years ||
      loan.total_work_exp
    );
    
    const hasProfessionalData = !!(
      loan.professional_subtype || 
      loan.practice_experience
    );
    
    const hasBusinessData = !!(
      loan.business_name || 
      loan.business_type || 
      loan.business_vintage
    );
    
    const hasFreelancerData = !!loan.freelancer_subtype;
    const hasOtherIncomeData = !!loan.other_income_type;

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 ANALYSIS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('Has Salaried Data:', hasSalariedData ? '✅ YES' : '❌ NO');
    console.log('Has Professional Data:', hasProfessionalData ? '✅ YES' : '❌ NO');
    console.log('Has Business Data:', hasBusinessData ? '✅ YES' : '❌ NO');
    console.log('Has Freelancer Data:', hasFreelancerData ? '✅ YES' : '❌ NO');
    console.log('Has Other Income Data:', hasOtherIncomeData ? '✅ YES' : '❌ NO');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 VERDICT');
    console.log('═══════════════════════════════════════════════════════\n');

    const multipleTypesCount = [
      hasSalariedData, 
      hasProfessionalData, 
      hasBusinessData, 
      hasFreelancerData, 
      hasOtherIncomeData
    ].filter(Boolean).length;

    if (multipleTypesCount > 1) {
      console.log('⚠️  ISSUE FOUND!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Multiple income type data exists in the database.');
      console.log('This means old data was NOT cleared when income source changed.');
      console.log('\n💡 Solution:');
      console.log('1. Edit this loan in the UI');
      console.log('2. Select the correct Income Source');
      console.log('3. The old fields will auto-clear (with new fix)');
      console.log('4. Fill in the correct data');
      console.log('5. Click Update Application');
    } else if (multipleTypesCount === 1) {
      console.log('✅ NO ISSUE FOUND!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Only one income type data exists.');
      console.log('The loan data is clean and correct.');
    } else {
      console.log('⚠️  WARNING!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('No income data found at all.');
      console.log('This loan may be incomplete.');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkLoan();
