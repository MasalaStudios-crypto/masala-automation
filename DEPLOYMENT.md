# 🚀 Masala Automation Deployment Guide

## Overview
Complete deployment instructions for the Masala Group automation infrastructure. This guide covers n8n setup, Google Sheets integration, Gmail configuration, and automated workflow deployment.

---

## 📋 Prerequisites

### Required Software
- Docker & Docker Compose (v2.0+)
- Git
- Node.js 18+ (for local development)
- A domain name (for production n8n setup)

### Required Accounts & API Access
1. **Google Cloud Project**
   - Enable Google Sheets API
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   
2. **n8n Account** (optional for cloud)
   - Or use self-hosted Docker setup (recommended)

3. **LinkedIn Account**
   - For manual profile research (automation workflows)

---

## 🛠️ Step 1: Environment Configuration

### 1.1 Clone Repository
```bash
git clone https://github.com/MasalaStudios-crypto/masala-automation.git
cd masala-automation
```

### 1.2 Create Environment File
Copy the example environment file:
```bash
cp .env.example .env
```

### 1.3 Configure Environment Variables
Edit `.env` with your credentials:

```env
# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=your_secure_password_here
N8N_HOST=your-domain.com
N8N_PORT=5678

# PostgreSQL Configuration
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=n8n

# Google Sheets Configuration
GOOGLE_SHEET_ID=1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Gmail Configuration
GMAIL_USER=masalaheadindia@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Business Configuration
COLLABORATOR_RATE=1000
TARGET_PROJECT_VALUE=6000
MINIMUM_COMPANY_REVENUE=10000000
```

---

## 🐳 Step 2: Docker Deployment

### 2.1 Start Services
```bash
docker-compose up -d
```

This will start:
- **n8n** on port 5678
- **PostgreSQL** database for n8n

### 2.2 Verify Services
```bash
docker-compose ps
```

All services should show "Up" status.

### 2.3 Access n8n Interface
Open your browser:
```
http://localhost:5678
```

Login with credentials from `.env`:
- Username: `admin`
- Password: `your_secure_password_here`

---

## 🔗 Step 3: Google Cloud Setup

### 3.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Masala Automation"
3. Enable APIs:
   - Google Sheets API
   - Gmail API

### 3.2 Create Service Account
1. Navigate to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `masala-automation-service`
4. Grant role: **Editor**
5. Create and download JSON key
6. Save as `google-credentials.json` in project root

### 3.3 Share Google Sheet
1. Open [European Target Companies Sheet](https://docs.google.com/spreadsheets/d/1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM)
2. Click **Share**
3. Add service account email: `your-service-account@project.iam.gserviceaccount.com`
4. Grant **Editor** permission

### 3.4 Gmail App Password
1. Enable 2-Factor Authentication on `masalaheadindia@gmail.com`
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate new app password for "n8n automation"
4. Save password to `.env` file

---

## 📥 Step 4: Import n8n Workflows

### 4.1 Access n8n Workflows Directory
All workflow JSON files are in: `n8n-workflows/`

### 4.2 Import Each Workflow
1. Open n8n interface (http://localhost:5678)
2. Click **Import from File**
3. Import in this order:
   - `01-daily-lead-research.json`
   - `02-email-sequence.json`
   - `03-follow-up-automation.json`
   - `04-lead-status-tracker.json`

### 4.3 Configure Workflow Credentials
For each workflow, configure:

#### Google Sheets Credential:
- Click **Credentials** > **New**
- Select **Google Sheets API**
- Upload `google-credentials.json`
- Test connection

#### Gmail Credential:
- Click **Credentials** > **New**
- Select **Gmail**
- Enter email: `masalaheadindia@gmail.com`
- Enter app password from `.env`
- Test connection

### 4.4 Activate Workflows
1. Open each workflow
2. Click **Active** toggle (top right)
3. Verify trigger is enabled (webhook or schedule)

---

## ⚙️ Step 5: Configure Automation Schedule

Based on **DAILY-OPERATIONS-PLAYBOOK.md**, workflows run:

| Time | Workflow | Description |
|------|----------|-------------|
| 09:00 AM | Lead Research | Find 2 new qualified leads on LinkedIn |
| 11:00 AM | Email Sequence | Send initial outreach emails |
| 03:00 PM | Follow-up | Check responses, send follow-ups |
| 05:00 PM | Status Update | Update sheet with day's progress |

### Configure Schedules in n8n:
1. Open each workflow
2. Find **Schedule Trigger** node
3. Set cron expression:
   - 09:00 AM: `0 9 * * *`
   - 11:00 AM: `0 11 * * *`
   - 03:00 PM: `0 15 * * *`
   - 05:00 PM: `0 17 * * *`

---

## 🧪 Step 6: Testing & Validation

### 6.1 Test Lead Addition
```bash
node src/automation/batch-lead-importer.js
```

This should:
- Connect to Google Sheets
- Add test lead data
- Verify all columns populated

### 6.2 Test Email Sequence
1. Manually trigger "Email Sequence" workflow
2. Check Gmail "Sent" folder
3. Verify email uses template from `templates/email-templates.md`

### 6.3 Verify Sheet Updates
1. Open Google Sheet
2. Check "Lead Status" column (AC)
3. Confirm "Contact Date" is populated (AD)

---

## 📊 Step 7: Monitoring & Maintenance

### Daily Checklist
- [ ] Check n8n execution log for errors
- [ ] Review new leads added to sheet
- [ ] Monitor email response rate
- [ ] Update lead status manually if needed

### Weekly Tasks
- [ ] Review 40-lead pipeline health
- [ ] Send reminder emails to non-responders
- [ ] Research new leads to replace rejected ones
- [ ] Update revenue data for existing leads

### Monthly Goals
- [ ] Close 4-6 paid projects
- [ ] Maintain 40 active leads in pipeline
- [ ] €6000+ project value per deal
- [ ] 50% payment upfront secured

---

## 🔧 Troubleshooting

### Issue: n8n won't start
**Solution:**
```bash
docker-compose down
docker-compose up --build -d
docker-compose logs -f n8n
```

### Issue: Google Sheets API error
**Solution:**
1. Verify service account email has Editor access
2. Check `google-credentials.json` is valid
3. Confirm Sheet ID in `.env` is correct

### Issue: Gmail sending fails
**Solution:**
1. Verify 2FA is enabled on Gmail
2. Regenerate App Password
3. Update `.env` with new password
4. Restart n8n: `docker-compose restart n8n`

### Issue: Workflows not triggering
**Solution:**
1. Check workflow is Active (toggle in top-right)
2. Verify schedule trigger cron expression
3. Check n8n timezone: `Europe/Madrid` in docker-compose.yml

---

## 🚀 Production Deployment

### Recommended: DigitalOcean/AWS

1. **Provision VPS:**
   - 2 GB RAM minimum
   - Ubuntu 22.04 LTS
   - Docker pre-installed

2. **Domain Setup:**
   - Point A record to VPS IP
   - Configure SSL with Let's Encrypt

3. **Update docker-compose.yml:**
```yaml
services:
  n8n:
    environment:
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://your-domain.com/
```

4. **Setup Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. **Deploy:**
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 📞 Support

**Created by:** Masala Studios  
**Contact:** masalaheadindia@gmail.com  
**GitHub:** [masala-automation](https://github.com/MasalaStudios-crypto/masala-automation)

---

## 📝 License

Private repository - All rights reserved by Masala Studios

---

**Last Updated:** February 4, 2026  
**Version:** 1.0.0
