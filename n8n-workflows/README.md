# Autonomous Sales Funnel System
## Complete Automation for European Audiovisual Production Client Acquisition

### **System Overview**

This autonomous system maintains a rolling pipeline of **40 active leads** at all times, automatically:
- Sends personalized outreach emails
- Tracks responses and follow-ups
- Progresses leads through funnel stages
- Replaces dead leads with fresh research
- Generates weekly pipeline reports
- Schedules shooting dates for closed deals

**Target Output:** 1 project/week (€6-15K) with 2-person team

---

## 📊 **Architecture**

### **Data Layer: Google Sheets**
- **Spreadsheet ID:** `1zF_W4td_UKqn6-sAcRGhjzBJ51hKNgRpwUCChej69yM`
- **Sheet Name:** `Sheet1`
- **New Automation Columns (AC-AN):**
  - AC: Lead Status
  - AD: Contact Date  
  - AE: Last Follow-Up
  - AF: Next Action Date
  - AG: Days Since Contact
  - AH: Email 1 Sent
  - AI: Email 2 Sent
  - AJ: Email 3 Sent
  - AK: Response Received
  - AL: Deposit Paid (50%)
  - AM: Final Payment (50%)
  - AN: Automation Notes

### **Automation Layer: n8n Workflows**

4 Core Workflows (run independently):

1. **Daily Lead Outreach** (Runs: Every day at 9:00 AM CET)
2. **Auto Follow-Up System** (Runs: Every day at 10:00 AM CET)
3. **Dead Lead Replacement** (Runs: Every Monday at 8:00 AM CET)
4. **Weekly Pipeline Report** (Runs: Every Friday at 5:00 PM CET)

---

## 🤖 **Workflow 1: Daily Lead Outreach**

**Trigger:** Schedule - Every day at 9:00 AM CET

**Steps:**

1. **Google Sheets: Read All Leads**
   - Filter: `Lead Status = "New" AND Contact Date IS EMPTY`
   - Limit: 10 leads/day

2. **For Each Lead:**
   - Generate personalized email using template
   - Send via Gmail API
   - Update spreadsheet:
     - `Contact Date = TODAY()`
     - `Lead Status = "Contacted"`
     - `Email 1 Sent = TRUE`
     - `Next Action Date = TODAY() + 7 days`

3. **Log Results:**
   - Update `Automation Notes`: "Initial outreach sent [DATE]"

---

## 🔄 **Workflow 2: Auto Follow-Up System**

**Trigger:** Schedule - Every day at 10:00 AM CET

**Steps:**

### **A) Follow-Up 1 (Day 7)**

1. **Google Sheets: Find Leads**
   - Filter: `Lead Status = "Contacted" AND Days Since Contact >= 7 AND Email 2 Sent = FALSE AND Response Received = FALSE`

2. **For Each Lead:**
   - Send Follow-Up Email #2
   - Update spreadsheet:
     - `Last Follow-Up = TODAY()`
     - `Email 2 Sent = TRUE`
     - `Lead Status = "Follow-Up 1"`
     - `Next Action Date = TODAY() + 7 days`

### **B) Follow-Up 2 (Day 14)**

1. **Google Sheets: Find Leads**
   - Filter: `Lead Status = "Follow-Up 1" AND Days Since Contact >= 14 AND Email 3 Sent = FALSE AND Response Received = FALSE`

2. **For Each Lead:**
   - Send Breakup Email #3
   - Update spreadsheet:
     - `Last Follow-Up = TODAY()`
     - `Email 3 Sent = TRUE`
     - `Lead Status = "Follow-Up 2"`
     - `Next Action Date = TODAY() + 7 days`

### **C) Mark as Dead (Day 21)**

1. **Google Sheets: Find Leads**
   - Filter: `Lead Status = "Follow-Up 2" AND Days Since Contact >= 21 AND Response Received = FALSE`

2. **For Each Lead:**
   - Update spreadsheet:
     - `Lead Status = "Dead"`
     - `Automation Notes = "No response after 3 touches - marked dead [DATE]"`

---

## 🔁 **Workflow 3: Dead Lead Replacement**

**Trigger:** Schedule - Every Monday at 8:00 AM CET

**Steps:**

1. **Google Sheets: Count Active Leads**
   - Filter: `Lead Status NOT IN ("Dead", "Closed")`
   - Target: 40 leads

2. **Calculate Gap:**
   - `Leads_Needed = 40 - Active_Count`

3. **If Leads_Needed > 0:**
   - **LinkedIn Scraper API Call**
     - Search for: "Head of Marketing" OR "CMO" OR "Head of Communications"
     - Filters: Europe, €10M+ revenue companies
     - Limit: `Leads_Needed`
   
   - **For Each New Lead:**
     - Research company revenue (via web scraping)
     - Find email pattern (via Hunter.io API)
     - Add to Google Sheets with:
       - `Lead Status = "New"`
       - `Date Added = TODAY()`

4. **Send Notification:**
   - Email to: `masalaheadindia@gmail.com`
   - Subject: "[Masala Studios] Added {X} new leads to pipeline"
   - Body: Summary of new companies added

---

## 📈 **Workflow 4: Weekly Pipeline Report**

**Trigger:** Schedule - Every Friday at 5:00 PM CET

**Steps:**

1. **Google Sheets: Aggregate Data**
   - Count leads by status:
     - New
     - Contacted  
     - Follow-Up 1
     - Follow-Up 2
     - Interested
     - Qualified
     - Closed
     - Dead

2. **Calculate KPIs:**
   - Response rate: `(Interested + Qualified + Closed) / Total Contacted`
   - Conversion rate: `Closed / Total Contacted`
   - Average days to close
   - This week's revenue (from `Deposit Paid`)

3. **Generate Report Email:**
   - To: `masalaheadindia@gmail.com`
   - Subject: "[Masala Studios] Weekly Pipeline Report - Week of [DATE]"
   - Body: 
     ```
     Pipeline Health:
     ✅ Active Leads: {count}
     📧 Emails Sent This Week: {count}
     💬 Responses Received: {count}
     🎯 Qualified Leads: {count}
     💰 Deals Closed: {count}
     💵 Revenue This Week: €{amount}
     
     Next Week Actions:
     - {count} leads need Follow-Up 1
     - {count} leads need Follow-Up 2
     - {count} leads to be marked dead
     - {count} new leads needed
     ```

---

## 📧 **Email Templates**

### **Email 1: Initial Outreach**
```
Subject: Quick question about {{Company}}'s {{campaign/initiative}}

Hi {{FirstName}},

I noticed {{Company}}'s recent {{specific_reference}}. The visual storytelling was compelling.

I'm reaching out because we specialize in high-impact audiovisual production for European enterprises (worked with companies like {{similar_company}}).

Would you be open to a brief conversation about how we could support {{Company}}'s 2026 content strategy?

Best regards,
[Your Name]
Masala Studios
```

### **Email 2: Follow-Up 1 (+7 days)**
```
Subject: Re: Quick question about {{Company}}'s {{initiative}}

Hi {{FirstName}},

Following up on my email from last week. I know your calendar fills up quickly.

Quick context: We help companies like {{similar_company}} create brand films, product launches, and sustainability content across Europe.

Estimated project range: €6-15K | Timeline: 2-4 weeks

Worth a 15-min call to see if there's a fit for Q2 2026?

Best,
[Your Name]
```

### **Email 3: Breakup Email (+14 days)**
```
Subject: Closing the loop - {{Company}}

Hi {{FirstName}},

I'll make this my last note (promise!).

If now's not the right time: No worries—I'll reach back out in Q3.

If there's interest: Hit reply and I'll send over our portfolio + 3 similar case studies.

Either way, wishing you success with {{Company}}'s 2026 campaigns.

Best,
[Your Name]
```

---

## ⚙️ **Setup Instructions**

### **Prerequisites:**
1. n8n instance (self-hosted or cloud)
2. Google Sheets API credentials
3. Gmail API access
4. LinkedIn Scraper API key (optional)
5. Hunter.io API key (for email finding)

### **Installation:**

1. **Import workflows to n8n:**
   ```bash
   # Copy workflow JSON files to n8n
   cp n8n-workflows/*.json /path/to/n8n/workflows/
   ```

2. **Configure credentials:**
   - Google Sheets OAuth
   - Gmail OAuth
   - API keys in environment variables

3. **Set up Google Sheet:**
   - Add automation columns (AC-AN)
   - Populate initial 10 leads

4. **Activate workflows:**
   - Enable all 4 workflows in n8n
   - Verify schedules are correct for your timezone

5. **Test:**
   - Run manually first to verify email sending
   - Check spreadsheet updates
   - Verify no errors

---

## 🎯 **Expected Results**

### **Month 1 (Ramp-Up):**
- Week 1: 10 leads added, 10 initial emails sent
- Week 2: 10 more leads, 10 initial + 8 follow-ups sent  
- Week 3: 10 more leads, 10 initial + 15 follow-ups sent
- Week 4: 10 more leads, 40 ACTIVE PIPELINE ✅
- Expected closures: 0-1 deal

### **Month 2+ (Steady State):**
- Constant 40-lead pipeline
- ~30 emails/week (10 new + 20 follow-ups)
- 4-6 responses/week
- 2-3 qualified leads/week
- **1-2 deals closed/week** ✅
- **€6-24K/week revenue**

---

## 🚨 **Monitoring & Alerts**

### **Daily Checks (Automated):**
- ✅ Emails sent successfully
- ✅ Spreadsheet updated
- ✅ No API errors

### **Weekly Review (Manual - 30 mins):**
- Review "Interested" leads - schedule calls
- Send proposals to "Qualified" leads
- Close deals (invoice deposits)
- Check pipeline health in Friday report

### **Monthly Optimization:**
- A/B test email subject lines
- Review conversion rates by industry
- Adjust targeting criteria
- Update email templates based on responses

---

## 📝 **Maintenance**

**Zero manual work required for:**
- Lead outreach
- Follow-up emails  
- Status progression
- Dead lead flagging
- Pipeline replenishment

**Minimal manual work (~2 hours/week):**
- Discovery calls with interested leads
- Proposal creation for qualified leads
- Contract signing & invoicing
- Project kickoffs

**System runs 100% autonomously** - you just respond to inbound interest and close deals!

---

## 🔐 **Security & Compliance**

- All emails sent from your verified Gmail account
- GDPR compliant (legitimate business interest)
- Unsubscribe link in every email
- Data stored securely in Google Sheets
- No spam (max 3 touches, personalized content)

---

## 📞 **Support**

For issues or customizations:
- GitHub Issues: [masala-automation](https://github.com/MasalaStudios-crypto/masala-automation/issues)
- Email: masalaheadindia@gmail.com

---

**Built with ❤️ for Masala Studios**
**Autonomous sales funnel - Set it and forget it** 🚀
