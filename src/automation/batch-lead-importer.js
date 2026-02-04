/**
 * Batch Lead Importer for European Target Companies
 * Automates the process of adding multiple leads to Google Sheets
 * Uses Google Sheets API for bulk data entry
 */

const { google } = require('googleapis');
const path = require('path');

// Configuration
const SPREADSHEET_ID = '1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM';
const SHEET_NAME = 'Sheet1';
const RANGE = `${SHEET_NAME}!A:AB`; // All columns from A to AB

/**
 * Lead data structure template
 */
const LEAD_TEMPLATE = {
  companyName: '',
  country: '',
  city: '',
  industrySector: '',
  companySize: '',
  lastYearRevenue: '',
  revenueSource: '',
  website: '',
  linkedinPage: '',
  primaryContactName: '',
  primaryContactTitle: '',
  primaryContactCompanyPage: '',
  primaryContactEmail: '',
  secondaryContactPrimary: '',
  secondaryContactSecondary: '',
  secondaryContactCategory: '',
  secondaryContactLinkedin: '',
  secondaryContactNeed: '',
  budgetRange: '',
  decisionTimeline: ''
};

/**
 * Authenticate with Google Sheets API
 */
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return await auth.getClient();
}

/**
 * Convert lead object to row array
 */
function leadToRow(lead) {
  return [
    lead.companyName,
    lead.country,
    lead.city,
    lead.industrySector,
    lead.companySize,
    lead.lastYearRevenue,
    lead.revenueSource,
    lead.website,
    lead.linkedinPage,
    lead.primaryContactName,
    lead.primaryContactTitle,
    lead.primaryContactCompanyPage,
    lead.primaryContactEmail,
    lead.secondaryContactPrimary,
    lead.secondaryContactSecondary,
    lead.secondaryContactCategory,
    lead.secondaryContactLinkedin,
    lead.secondaryContactNeed,
    lead.budgetRange,
    lead.decisionTimeline
  ];
}

/**
 * Batch import leads to Google Sheets
 */
async function batchImportLeads(leads) {
  try {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Get current row count
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const currentRows = response.data.values || [];
    const nextRow = currentRows.length + 1;

    // Convert leads to rows
    const rows = leads.map(leadToRow);

    // Batch update
    const updateRange = `${SHEET_NAME}!A${nextRow}:T${nextRow + rows.length - 1}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      resource: {
        values: rows,
      },
    });

    console.log(`✓ Successfully imported ${rows.length} leads`);
    console.log(`  Starting at row ${nextRow}`);
    return { success: true, count: rows.length, startRow: nextRow };
  } catch (error) {
    console.error('✗ Error importing leads:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Example: Import sample leads
 */
async function importSampleLeads() {
  const sampleLeads = [
    {
      companyName: 'Example Corp',
      country: 'Germany',
      city: 'Berlin',
      industrySector: 'Technology',
      companySize: '50000000000',
      lastYearRevenue: '48000000000',
      revenueSource: 'Annual Report',
      website: 'https://www.example.com',
      linkedinPage: 'https://linkedin.com/in/contact',
      primaryContactName: 'Max Mustermann',
      primaryContactTitle: 'Head of Marketing',
      primaryContactCompanyPage: 'https://www.example.com',
      primaryContactEmail: 'max.mustermann@example.com',
      secondaryContactPrimary: '#ESDE03',
      secondaryContactSecondary: 'Berlin',
      secondaryContactCategory: 'Brand Marketing',
      secondaryContactLinkedin: 'https://linkedin.com/in/contact',
      secondaryContactNeed: 'Corporate video production',
      budgetRange: '€500K - €1M',
      decisionTimeline: 'Q3 2025'
    }
  ];

  await batchImportLeads(sampleLeads);
}

// Export functions
module.exports = {
  batchImportLeads,
  importSampleLeads,
  LEAD_TEMPLATE
};

// Run if called directly
if (require.main === module) {
  importSampleLeads()
    .then(() => console.log('Import complete'))
    .catch(err => console.error('Import failed:', err));
}
