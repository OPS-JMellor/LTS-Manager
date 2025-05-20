![LTS Manager Logo](https://img.shields.io/badge/LTS--Manager-Automation-blue?style=for-the-badge&logo=google)
# LTS-Manager 
Long-Term Sub Automation for Google Workspace

It handles:
- ✅ Daily start/end/return reminders
- ✅ Google Group adds/removals based on teacher membership
- ✅ Task checklist visibility (staffing, syncing, phone setup, etc.)
- ✅ Dashboard summary of active and upcoming assignments
- ✅ Fully customizable Google Sheet

👉 **Live Template**: [Copy this Sheet](https://docs.google.com/spreadsheets/d/1LhvKiGZGR4nDxHr2nJ6Z3EzTFnbPWFXK73nUD6T56Ag/edit?usp=sharing)

---

## ✨ Features

- Daily reminders to IT/staff when LTS starts/ends/returns
- Automatically adds substitutes to the same Google Groups as the teacher
- Clean status emails that include checklist progress (✅/❌)
- Daily dashboard that updates with today's events
- Logs all group actions and reminders sent
- Fully open source – customize it freely

---

## 📁 Project Structure
lts-manager/
├── Code.gs
├── appsscript.json
├── README.md
├── install_instructions.md


---

## 🔧 Setup Overview

1. **Copy the template sheet**:  
   → [Open Template](https://docs.google.com/spreadsheets/d/1LhvKiGZGR4nDxHr2nJ6Z3EzTFnbPWFXK73nUD6T56Ag/edit?usp=sharing)

2. **Open Apps Script**  
   → Extensions > Apps Script

3. **Paste in the `Code.gs` and `appsscript.json`**

4. **Enable Admin SDK Advanced Service**  
   In Apps Script > Services tab → Add `Admin SDK`

5. **Run `onOpen()` and then `dailyRunner()` manually once**

6. **Set up daily trigger (8 AM)**  
   → Run `createDailyTrigger()`

---

## ✅ Sheets Setup

| Sheet | Description |
|:--|:--|
| `Settings` | Column A = notification recipients<br>Column B = allowed group pool |
| `Assignments` | Tracks teacher + sub info, start/end dates, and a 7-item task checklist |
| `Returns` | Tracks when teachers return (Column E = Return Date) |
| `Group Logs` | Tracks all group add/remove activity |
| `Reminder Logs` | Tracks reminders sent |
| `Dashboard` | Auto-generated daily status view |

---

## 🔐 Required OAuth Scopes

These are auto-granted during setup:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/script.send_mail`
- `https://www.googleapis.com/auth/admin.directory.group`
- `https://www.googleapis.com/auth/admin.directory.user`

---

## 🧪 Testing

Use the sample template and fill in a row with:
- Today’s date as the start or end date
- Valid teacher + sub emails
- Confirm group membership in Settings
- Run `dailyRunner()` manually

---

## 📄 License

MIT License – use freely, modify for your district, and make it your own!

---

## 🙌 Credits

Built by Joel Mellor and ChatGPT — maintained with ❤️ for K–12 IT and school operations teams.

