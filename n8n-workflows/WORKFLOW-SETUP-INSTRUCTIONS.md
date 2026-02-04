# n8n Workflow Setup Instructions

## Quick Start Guide

This document provides step-by-step instructions for manually creating the 4 core n8n workflows that power the Masala Studios client acquisition automation system.

---

## Workflow 1: Daily Lead Research (09:00 AM)
**File:** `01-daily-lead-research.json`

### Purpose
Automatically research and add 2 new qualified European companies to the pipeline every morning.

### Workflow Structure

1. **Schedule Trigger Node**
   - Cron: `0 9 * * 1-5` (Weekdays at 9 AM)
   - Timezone: Europe/Madrid

2. **Function Node: Define Target Criteria**
   ```javascript
   return [
     {
       json: {
         minRevenue: 10000000,
         industries: ['Technology', 'Finance', 'Telecommunications', 'Consumer Goods'],
         countries: ['Germany', 'France', 'UK', 'Spain', 'Italy', 'Netherlands'],
         targetRoles: ['Head of Marketing', 'Marketing Director', 'Communications Director']
       }
     }
   ];
   ```

3. **HTTP Request Node: LinkedIn Search** (Manual Research Required)
   - Note: Full LinkedIn API automation requires LinkedIn Recruiter/Sales Navigator
   - Alternative: Use Webhook to trigger manual research workflow
   - Output: Company name, industry, location

4. **HTTP Request Node: Company Revenue Lookup**
   - URL: Company financial data API (Crunchbase, PitchBook, or Doorlass equivalent)
   - Method: GET
   - Headers: API Key authentication

5. **Function Node: Email Pattern Detection**
   ```javascript
   const domain = $json.website.replace('https://', '').replace('http://', '').split('/')[0];
   const firstName = $json.contactFirstName.toLowerCase();
   const lastName = $json.contactLastName.toLowerCase();
   
   return {
     json: {
       ...$json,
       estimatedEmail: `${firstName}.${lastName}@${domain}`
     }
   };
   ```

6. **Google Sheets Node: Append Row**
   - Spreadsheet ID: `1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM`
   - Range: `Sheet1!A:AN`
   - Values:
     - Company Name (A)
     - Industry (B)
     - Location (C)
     - Website (D)
     - Annual Revenue (E)
     - Contact Name (F)
     - Contact Title (G)
     - Email (H)
     - LinkedIn (I)
     - Phone (J)
     - Lead Status: "New" (AC)
     - Contact Date: `{{$now}}` (AD)

---

## Workflow 2: Email Sequence Automation (11:00 AM)
**File:** `02-email-sequence.json`

### Purpose
Send personalized initial outreach emails to new leads.

### Workflow Structure

1. **Schedule Trigger Node**
   - Cron: `0 11 * * 1-5`
   - Timezone: Europe/Madrid

2. **Google Sheets Node: Read Rows**
   - Spreadsheet ID: `1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM`
   - Range: `Sheet1!A:AN`
   - Filter: `Lead Status` = "New" AND `Contact Date` = TODAY

3. **Function Node: Load Email Template**
   ```javascript
   const template = `
Subject: Premium Audiovisual Production for {{companyName}}

Dear {{contactName}},

I noticed {{companyName}}'s impressive work in {{industry}}, particularly your recent {{recentNews}}.

Masala Studios specializes in high-impact audiovisual content for European enterprises. Our collaborative approach combines:

🎥 **On-site European Production Team**
   - Based in {{location}} region
   - Full equipment & post-production
   
💼 **Enterprise-Grade Service**
   - Worked with 20+ EU enterprises
   - Delivered 50+ projects in 2025
   
⭐ **Flexible Engagement**
   - Project-based or retainer
   - 50% upfront, balance on delivery

Would you be open to a 15-minute call this week to explore how we can enhance {{companyName}}'s visual storytelling?

Best regards,
[Your Name]
Masala Studios
masalaheadindia@gmail.com
   `;
   
   return {
     json: {
       ...$json,
       emailSubject: template.match(/Subject: (.*)/)[1].replace('{{companyName}}', $json.companyName),
       emailBody: template
         .replace(/{{companyName}}/g, $json.companyName)
         .replace(/{{contactName}}/g, $json.contactFirstName)
         .replace(/{{industry}}/g, $json.industry)
         .replace(/{{location}}/g, $json.location)
     }
   };
   ```

4. **Gmail Node: Send Email**
   - From: masalaheadindia@gmail.com
   - To: `{{$json.email}}`
   - Subject: `{{$json.emailSubject}}`
   - Body: `{{$json.emailBody}}`
   - Format: HTML

5. **Google Sheets Node: Update Row**
   - Update `Lead Status` to "Contacted"
   - Set `Last Contact Date` to current date
   - Set `Email Sent Count` +1

---

## Workflow 3: Follow-up Automation (03:00 PM)
**File:** `03-follow-up-automation.json`

### Purpose
Check Gmail for responses and send follow-up emails to non-responders after 7 days.

### Workflow Structure

1. **Schedule Trigger Node**
   - Cron: `0 15 * * 1-5`

2. **Gmail Node: Search Emails**
   - Query: `to:masalaheadindia@gmail.com after:{{sevenDaysAgo}}`
   - Labels: INBOX
   - Max Results: 100

3. **Function Node: Extract Response Emails**
   ```javascript
   const responses = [];
   for (const email of $input.all()) {
     responses.push(email.json.from);
   }
   return { json: { responseEmails: responses } };
   ```

4. **Google Sheets Node: Read Contacted Leads**
   - Filter: `Lead Status` IN ["Contacted", "Follow-up 1"]
   - AND `Last Contact Date` >= 7 days ago

5. **Function Node: Filter Non-Responders**
   ```javascript
   const responseEmails = $node["Extract Response Emails"].json.responseEmails;
   const nonResponders = [];
   
   for (const lead of $input.all()) {
     if (!responseEmails.includes(lead.json.email)) {
       nonResponders.push(lead);
     }
   }
   
   return nonResponders;
   ```

6. **Gmail Node: Send Follow-up**
   - Use template from `templates/email-templates.md` - Follow-up #1 or #2
   - Subject: "Following up: {{companyName}} Audiovisual Production"

7. **Google Sheets Node: Update Status**
   - Increment `Email Sent Count`
   - Update `Last Contact Date`
   - Update `Lead Status` to next funnel stage

---

## Workflow 4: Lead Status Tracker (05:00 PM)
**File:** `04-lead-status-tracker.json`

### Purpose
Daily health check and pipeline maintenance.

### Workflow Structure

1. **Schedule Trigger Node**
   - Cron: `0 17 * * 1-5`

2. **Google Sheets Node: Read All Leads**
   - Range: `Sheet1!A:AN`

3. **Function Node: Calculate Pipeline Metrics**
   ```javascript
   const metrics = {
     totalLeads: 0,
     newLeads: 0,
     contacted: 0,
     inNegotiation: 0,
     proposalSent: 0,
     closed: 0,
     dead: 0
   };
   
   for (const lead of $input.all()) {
     metrics.totalLeads++;
     const status = lead.json.leadStatus;
     if (status === 'New') metrics.newLeads++;
     if (status === 'Contacted') metrics.contacted++;
     // ... etc
   }
   
   return { json: metrics };
   ```

4. **Function Node: Identify Stale Leads**
   ```javascript
   const staleLeads = [];
   const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
   
   for (const lead of $input.all()) {
     const lastContact = new Date(lead.json.lastContactDate);
     if (lastContact < thirtyDaysAgo && lead.json.leadStatus !== 'Closed' && lead.json.leadStatus !== 'Dead') {
       staleLeads.push(lead);
     }
   }
   
   return staleLeads;
   ```

5. **Google Sheets Node: Mark Dead Leads**
   - Update stale leads `Lead Status` to "Dead"
   - Set `Dead Reason` to "No response after 30 days"

6. **Gmail Node: Send Daily Report**
   - To: your-email@gmail.com
   - Subject: "Daily Pipeline Report - {{$now}}"
   - Body: Pipeline metrics summary

---

## Setup Checklist

### Prerequisites
- [ ] n8n instance running (localhost:5678 or production URL)
- [ ] Google Sheets API credentials configured
- [ ] Gmail API credentials configured
- [ ] European Target Companies spreadsheet accessible
- [ ] Email templates reviewed and customized

### Workflow Creation Steps

1. **Access n8n**
   ```
   http://localhost:5678
   ```

2. **For Each Workflow:**
   - Click "New Workflow"
   - Name workflow according to list above
   - Add nodes as documented
   - Connect nodes in sequence
   - Configure credentials
   - Test with sample data
   - Activate workflow

3. **Test End-to-End:**
   - Manually trigger Workflow 1
   - Verify new lead appears in Google Sheets
   - Wait for Workflow 2 to send email (or manually trigger)
   - Check Gmail Sent folder
   - Verify Sheet updates with "Contacted" status

---

## Troubleshooting

### Common Issues

**Gmail API Rate Limits:**
- Solution: Add delay nodes between email sends (2-3 seconds)
- Monitor quota: https://console.cloud.google.com/apis/dashboard

**Google Sheets Conflicts:**
- Solution: Use "Append" instead of "Update" for new rows
- Ensure unique row identifiers (Row ID column)

**Workflow Not Triggering:**
- Check workflow is Active (toggle top-right)
- Verify cron expression is correct
- Check n8n logs: `docker-compose logs -f n8n`

---

## Alternative: Quick Import (Future Enhancement)

Once workflows are created and tested:

1. Export from n8n:
   - Open workflow
   - Click "⋮" menu → "Download"
   - Save as JSON

2. Commit to repository:
   ```bash
   mv ~/Downloads/workflow.json ./n8n-workflows/01-daily-lead-research.json
   git add n8n-workflows/
   git commit -m "Add n8n workflow JSONs"
   ```

3. Team members can import:
   - n8n → "Import from File"
   - Select JSON file
   - Configure credentials
   - Activate

---

**Created:** February 4, 2026  
**Last Updated:** February 4, 2026  
**Status:** Ready for implementation
