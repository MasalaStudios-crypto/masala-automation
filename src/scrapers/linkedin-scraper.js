/**
 * LinkedIn Company & Contact Scraper
 * Masala Studios - Client Research Engine
 * 
 * Extracts company data and key decision-makers from LinkedIn
 * Focus: European companies with high audiovisual production capacity
 */

const puppeteer = require('puppeteer');
const winston = require('winston');
require('dotenv').config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/scraper.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class LinkedInScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  async init() {
    try {
      logger.info('Initializing LinkedIn scraper...');
      
      this.browser = await puppeteer.launch({
        headless: process.env.HEADLESS === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set realistic user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      logger.info('Browser initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async login() {
    try {
      if (!process.env.LINKEDIN_EMAIL || !process.env.LINKEDIN_PASSWORD) {
        throw new Error('LinkedIn credentials not found in environment variables');
      }

      logger.info('Attempting LinkedIn login...');
      
      await this.page.goto('https://www.linkedin.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Fill login form
      await this.page.type('#username', process.env.LINKEDIN_EMAIL, { delay: 100 });
      await this.page.type('#password', process.env.LINKEDIN_PASSWORD, { delay: 100 });
      
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);

      // Verify login success
      const currentUrl = this.page.url();
      if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
        this.isLoggedIn = true;
        logger.info('LinkedIn login successful');
        return true;
      } else {
        throw new Error('Login verification failed');
      }
    } catch (error) {
      logger.error('LinkedIn login failed:', error);
      throw error;
    }
  }

  async scrapeCompanyPage(companyUrl) {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      logger.info(`Scraping company: ${companyUrl}`);
      
      await this.page.goto(companyUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for key elements
      await this.page.waitForSelector('h1', { timeout: 10000 });

      // Extract company data
      const companyData = await this.page.evaluate(() => {
        const getData = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          name: getData('h1'),
          tagline: getData('.org-top-card-summary__tagline'),
          industry: getData('.org-top-card-summary__industry'),
          size: getData('.org-top-card-summary__company-size'),
          website: getData('a[data-tracking-control-name="about_website"]'),
          headquarters: getData('.org-top-card-summary__headquarters'),
          specialties: getData('.org-about-us-organization-description__specialties')
        };
      });

      logger.info(`Company data extracted: ${companyData.name}`);
      return companyData;
    } catch (error) {
      logger.error(`Failed to scrape company ${companyUrl}:`, error);
      return null;
    }
  }

  async searchPeople(companyName, role) {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      const searchQuery = `${role} at ${companyName}`;
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
      
      logger.info(`Searching for: ${searchQuery}`);
      
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for results
      await this.page.waitForSelector('.reusable-search__result-container', { timeout: 10000 });

      // Extract top 5 results
      const people = await this.page.evaluate(() => {
        const results = [];
        const containers = document.querySelectorAll('.reusable-search__result-container');
        
        containers.forEach((container, index) => {
          if (index < 5) {
            const name = container.querySelector('.entity-result__title-text a')?.textContent.trim();
            const title = container.querySelector('.entity-result__primary-subtitle')?.textContent.trim();
            const location = container.querySelector('.entity-result__secondary-subtitle')?.textContent.trim();
            const profileUrl = container.querySelector('.entity-result__title-text a')?.href;
            
            if (name && profileUrl) {
              results.push({ name, title, location, profileUrl });
            }
          }
        });
        
        return results;
      });

      logger.info(`Found ${people.length} people for ${role} at ${companyName}`);
      return people;
    } catch (error) {
      logger.error(`Failed to search people for ${companyName}:`, error);
      return [];
    }
  }

  async scrapeProfile(profileUrl) {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      logger.info(`Scraping profile: ${profileUrl}`);
      
      await this.page.goto(profileUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Extract profile data
      const profileData = await this.page.evaluate(() => {
        const getData = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          name: getData('h1.text-heading-xlarge'),
          headline: getData('.text-body-medium'),
          location: getData('.text-body-small.inline'),
          about: getData('#about + div .inline-show-more-text'),
          currentPosition: getData('.experience-item:first-child .t-bold'),
          currentCompany: getData('.experience-item:first-child .t-normal')
        };
      });

      logger.info(`Profile data extracted: ${profileData.name}`);
      return profileData;
    } catch (error) {
      logger.error(`Failed to scrape profile ${profileUrl}:`, error);
      return null;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}

// Export for use in other modules
module.exports = LinkedInScraper;

// CLI usage
if (require.main === module) {
  (async () => {
    const scraper = new LinkedInScraper();
    
    try {
      await scraper.init();
      await scraper.login();
      
      // Example: Scrape ING Group
      const companyData = await scraper.scrapeCompanyPage('https://www.linkedin.com/company/ing/');
      console.log('Company Data:', JSON.stringify(companyData, null, 2));
      
      // Search for decision-makers
      const contacts = await scraper.searchPeople('ING Group', 'Chief Marketing Officer');
      console.log('Contacts:', JSON.stringify(contacts, null, 2));
      
    } catch (error) {
      logger.error('Script execution failed:', error);
    } finally {
      await scraper.close();
    }
  })();
}
