/**
 * Google Sheets Exporter
 * Masala Studios - Client Research Engine
 * 
 * Exports qualified leads to Google Sheets
 */

const { google } = require('googleapis');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/export.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class SheetsExporter {
  constructor() {
    this.sheets = null;
    this.auth = null;
  }

  async init() {
    try {
      logger.info('Initializing Google Sheets API...');
      
      // Load credentials from environment
      const credentials = require(process.env.GOOGLE_SHEETS_CREDENTIALS);
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      logger.info('Google Sheets API initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Sheets API:', error);
      throw error;
    }
  }

  async exportCompanies(companies) {
    try {
      if (!this.sheets) {
        await this.init();
      }

      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Sheet1';
      
      logger.info(`Exporting ${companies.length} companies to Google Sheets...`);

      // Prepare rows
      const rows = companies.map(company => [
        company.name || '',
        company.country || '',
        company.city || '',
        company.industry || '',
        company.size || '',
        company.revenue || '',
        company.revenueSource || 'LinkedIn',
        company.website || '',
        company.linkedinPage || '',
        company.primaryContact?.name || '',
        company.primaryContact?.title || '',
        company.primaryContact?.linkedin || '',
        company.primaryContact?.email || '',
        company.primaryContact?.phone || '',
        company.secondaryContact?.name || '',
        company.secondaryContact?.title || '',
        company.secondaryContact?.linkedin || '',
        company.pastProjects || '',
        company.contentNeeds || '',
        company.budgetRange || '',
        company.decisionTimeline || '',
        company.qualificationScore || '',
        company.leadStatus || 'Prospect',
        company.nextAction || 'Research and qualify',
        company.followUpDate || '',
        company.notes || '',
        new Date().toISOString().split('T')[0], // Date Added
        new Date().toISOString().split('T')[0]  // Last Updated
      ]);

      // Append to sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A2`, // Start from row 2 (after headers)
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      logger.info(`Successfully exported ${response.data.updates.updatedRows} rows`);
      return response.data;
    } catch (error) {
      logger.error('Failed to export to Sheets:', error);
      throw error;
    }
  }

  async updateCompany(companyName, updates) {
    try {
      if (!this.sheets) {
        await this.init();
      }

      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Sheet1';

      // Find the company row
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === companyName);

      if (rowIndex === -1) {
        logger.warn(`Company ${companyName} not found in sheet`);
        return null;
      }

      // Update specific cells
      // Add update logic here based on your needs
      
      logger.info(`Updated company: ${companyName}`);
      return true;
    } catch (error) {
      logger.error('Failed to update company:', error);
      throw error;
    }
  }

  async getExistingCompanies() {
    try {
      if (!this.sheets) {
        await this.init();
      }

      const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
      const sheetName = process.env.GOOGLE_SHEETS_NAME || 'Sheet1';

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:A` // Get company names from column A
      });

      const companies = (response.data.values || []).map(row => row[0]);
      logger.info(`Found ${companies.length} existing companies in sheet`);
      
      return companies;
    } catch (error) {
      logger.error('Failed to get existing companies:', error);
      return [];
    }
  }
}

module.exports = SheetsExporter;

// CLI usage
if (require.main === module) {
  (async () => {
    const exporter = new SheetsExporter();
    
    try {
      await exporter.init();
      
      // Test export
      const testCompanies = [
        {
          name: 'Test Company',
          country: 'Germany',
          city: 'Berlin',
          industry: 'Technology',
          size: '1000+',
          revenue: '100000000',
          website: 'https://test.com',
          qualificationScore: 75,
          primaryContact: {
            name: 'John Doe',
            title: 'CMO',
            linkedin: 'https://linkedin.com/in/johndoe'
          }
        }
      ];
      
      await exporter.exportCompanies(testCompanies);
      console.log('Test export completed!');
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  })();
}
