# 🛠 LTS Manager – Install Guide

This walkthrough will help you install the LTS Manager automation system in Google Workspace using Apps Script + Google Sheets.

---

## 1️⃣ Make a Copy of the Template

📄 Template:  
https://docs.google.com/spreadsheets/d/1LhvKiGZGR4nDxHr2nJ6Z3EzTFnbPWFXK73nUD6T56Ag/edit?usp=sharing  
→ File > Make a copy

---

## 2️⃣ Open the Script Editor

From your new Sheet:  
**Extensions > Apps Script**

---

## 3️⃣ Paste the Code

Replace any placeholder code with:

- `Code.gs` (full script)
- `appsscript.json` (contains advanced service config)

You can copy these directly from this GitHub repo.

---

## 4️⃣ Enable Admin SDK

In Apps Script:
- Click **+ Services**
- Add **Admin SDK** (`AdminDirectory`)

---

## 5️⃣ Authorize + Run Once

In the Script Editor:
- Run `onOpen()` (to load custom menu)
- Run `dailyRunner()` (to test functionality)

You’ll be asked to approve permissions (for Sheets, Email, Admin Directory, etc.)

---

## 6️⃣ Set Up Your Daily Trigger

In the Sheet:
- Go to the new **“LTS Manager”** menu
- Click **“Create Daily Trigger”**

This will run `dailyRunner()` every day at 8 AM.

---

## 7️⃣ Fill Out Settings

In the `Settings` tab:
- Column A = Who should get notifications (email)
- Column B = Google Groups to pull from (teacher must already be in them)

---

## 8️⃣ Use the Assignments / Returns Tabs

In `Assignments`:
- Add teacher + sub info
- Fill out dates
- Use the checkboxes to track what’s been done

In `Returns`:
- Add teacher and **return date** in Column E

✅ That’s it! You're live.

---

## 🧪 Testing Tips

- Set a start date to **today** in the Assignments tab
- Use your email + test sub
- Run `dailyRunner()` to trigger the logic

Check your inbox for status reminders!

---

## 🧼 Admin Notes

- Logs are kept in `Reminder Logs` and `Group Logs`
- All automation is driven by `dailyRunner()`
- You can always rerun it manually if needed
