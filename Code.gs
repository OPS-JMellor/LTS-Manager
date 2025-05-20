// ===== SETTINGS + HELPERS =====
const SETTINGS_TAB_NAME = "Settings";
const ASSIGNMENTS_TAB_NAME = "Assignments";
const RETURNS_TAB_NAME = "Returns";
const GROUP_LOGS_TAB_NAME = "Group Logs";
const REMINDER_LOGS_TAB_NAME = "Reminder Logs";
const TIMEZONE = "America/Chicago";

function formatDate(d) {
  return Utilities.formatDate(new Date(d), TIMEZONE, "MM/dd/yyyy");
}

function getSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName(SETTINGS_TAB_NAME);
  if (!settingsSheet) throw new Error("Settings sheet not found.");

  const data = settingsSheet.getDataRange().getValues();

  const recipients = [];
  const allowedGroups = [];
  let staffOU = "/Staff"; // Optional now, not used

  for (let i = 1; i < data.length; i++) {
    const colA = data[i][0];
    const colB = data[i][1];
    const colC = data[i][2];

    if (colA && typeof colA === "string" && colA.includes("@")) recipients.push(colA);
    if (colB && typeof colB === "string" && colB.includes("@")) allowedGroups.push(colB);
    if (colC && typeof colC === "string" && colC.startsWith("/")) staffOU = colC.trim();
  }

  if (recipients.length === 0) throw new Error("No notification recipients found.");
  if (allowedGroups.length === 0) throw new Error("No allowed groups found.");

  return { recipients, allowedGroups, staffOU };
}

// ===== ASSIGNMENTS + RETURNS =====

function dailyRunner() {
  const { recipients, allowedGroups } = getSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  processAssignments(today, recipients, allowedGroups);
  processReturns(today, recipients);
  buildDashboard(today);
}

function processAssignments(today, recipients, allowedGroups) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ASSIGNMENTS_TAB_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const [teacherName, teacherEmail, subName, subEmail, startDate, endDate] = data[i];
    if (!teacherEmail || !subEmail || !startDate || !endDate) continue;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const daysToStart = Math.floor((start - today) / (1000 * 60 * 60 * 24));
    const daysToEnd = Math.floor((end - today) / (1000 * 60 * 60 * 24));

    if ([3, 1, 0].includes(daysToStart)) {
      const subject = (daysToStart === 0)
        ? `LTS Start Reminder: ${subName} starts TODAY`
        : `LTS Start Reminder: ${subName} starts in ${daysToStart} day(s)`;
      const body = `Reminder: ${subName} starts for ${teacherName} on ${formatDate(start)}.\n\n${getCheckboxStatus(data[i])}`;
      safeSendEmail(recipients.join(","), subject, body);
      logReminder("Start Reminder", teacherName, subName, start, daysToStart);
    }

    if ([1, 0].includes(daysToStart)) {
      let addedGroups = [];
      let success = false;
      for (const group of allowedGroups) {
        if (isMember(group, teacherEmail)) {
          if (addToGroup(group, subEmail)) {
            addedGroups.push(group);
            success = true;
          }
        }
      }
      if (success) sheet.getRange(i + 1, 11).setValue(true);
      if (addedGroups.length) logGroupAction("Added to Groups", teacherEmail, subEmail, addedGroups);
    }

    if ([3, 1, 0].includes(daysToEnd)) {
      const subject = (daysToEnd === 0)
        ? `LTS End Reminder: ${subName} ends TODAY`
        : `LTS End Reminder: ${subName} ends in ${daysToEnd} day(s)`;
      const body = `Reminder: ${subName} ends for ${teacherName} on ${formatDate(end)}.\n\n${getCheckboxStatus(data[i])}`;
      safeSendEmail(recipients.join(","), subject, body);
      logReminder("End Reminder", teacherName, subName, end, daysToEnd);
    }
  }
}

function processReturns(today, recipients) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(RETURNS_TAB_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const teacherName = row[0];
    const returnDate = row[4];

    if (!teacherName || !returnDate) continue;

    const retDate = new Date(returnDate);
    retDate.setHours(0, 0, 0, 0);

    const daysToReturn = Math.floor((retDate - today) / (1000 * 60 * 60 * 24));

    if ([1, 0].includes(daysToReturn)) {
      const subject = (daysToReturn === 0)
        ? `LTS Return Reminder: ${teacherName} returns TODAY`
        : `LTS Return Reminder: ${teacherName} returns in ${daysToReturn} day(s)`;
      const body = `Reminder: ${teacherName} is scheduled to return on ${formatDate(retDate)}.\n\n${getCheckboxStatus(row)}`;
      safeSendEmail(recipients.join(","), subject, body);
      logReminder("Return Reminder", teacherName, "", retDate, daysToReturn);
    }
  }
}

// ===== GROUP MANAGEMENT =====

function isMember(groupEmail, userEmail) {
  try {
    const result = AdminDirectory.Members.hasMember(groupEmail, userEmail);
    return result.isMember;
  } catch {
    return false;
  }
}

function addToGroup(groupEmail, userEmail) {
  try {
    AdminDirectory.Members.insert({ email: userEmail, role: "MEMBER" }, groupEmail);
    return true;
  } catch {
    return false;
  }
}

function removeFromGroup(groupEmail, userEmail) {
  try {
    AdminDirectory.Members.remove(groupEmail, userEmail);
    return true;
  } catch {
    return false;
  }
}

// ===== REMINDERS + EMAILS =====

function getCheckboxStatus(row) {
  const tasks = ["Staff", "User", "Reassign Sections", "Overnight Sync", "Assign Groups", "Sync from Console (After Overnight)", "Phone Configuration"];
  let status = "\nTask Checklist:\n";
  for (let i = 0; i < tasks.length; i++) {
    const checked = row[6 + i] === true ? "✅" : "❌";
    status += `${checked} ${tasks[i]}\n`;
  }
  return status;
}

function safeSendEmail(to, subject, body) {
  try {
    MailApp.sendEmail(to, subject, body);
  } catch (e) {
    Logger.log("Email error: " + e);
  }
}

function logReminder(type, teacher, sub, targetDate, extra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REMINDER_LOGS_TAB_NAME) || ss.insertSheet(REMINDER_LOGS_TAB_NAME);
  sheet.appendRow([new Date(), type, teacher, sub, targetDate, extra]);
}

function logGroupAction(action, teacherEmail, subEmail, groupsAffected) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(GROUP_LOGS_TAB_NAME) || ss.insertSheet(GROUP_LOGS_TAB_NAME);
  sheet.appendRow([new Date(), action, teacherEmail, subEmail, groupsAffected.join(", ")]);
}

// ===== DASHBOARD BUILDING =====

function buildDashboard(today) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let dash = ss.getSheetByName("Dashboard");
  if (!dash) {
    dash = ss.insertSheet("Dashboard");
  } else {
    dash.clear();
  }

  let row = 1;
  dash.getRange(row++, 1).setValue("LTS Dashboard – " + formatDate(today));
  dash.getRange(row++, 1).setValue("");

  dash.getRange(row++, 1).setValue("Today's Starts:");
  const starts = getTodaysStarts(today);
  if (starts.length) {
    starts.forEach(start => dash.getRange(row++, 1).setValue(start));
  } else {
    dash.getRange(row++, 1).setValue("No starts today.");
  }

  row++;
  dash.getRange(row++, 1).setValue("Today's Ends:");
  const ends = getTodaysEnds(today);
  if (ends.length) {
    ends.forEach(end => dash.getRange(row++, 1).setValue(end));
  } else {
    dash.getRange(row++, 1).setValue("No ends today.");
  }

  row++;
  dash.getRange(row++, 1).setValue("Today's Returns:");
  const returns = getTodaysReturns(today);
  if (returns.length) {
    returns.forEach(ret => dash.getRange(row++, 1).setValue(ret));
  } else {
    dash.getRange(row++, 1).setValue("No returns today.");
  }

  dash.autoResizeColumn(1);
}

function getTodaysStarts(today) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ASSIGNMENTS_TAB_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const subName = data[i][2];
    const teacherName = data[i][0];
    const startDate = new Date(data[i][4]);
    startDate.setHours(0, 0, 0, 0);

    if (startDate.getTime() === today.getTime()) {
      results.push(`${subName} for ${teacherName}`);
    }
  }
  return results;
}

function getTodaysEnds(today) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ASSIGNMENTS_TAB_NAME);
  const data = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const subName = data[i][2];
    const teacherName = data[i][0];
    const endDate = new Date(data[i][5]);
    endDate.setHours(0, 0, 0, 0);

    if (endDate.getTime() === today.getTime()) {
      results.push(`${subName} for ${teacherName}`);
    }
  }
  return results;
}

function getTodaysReturns(today) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RETURNS_TAB_NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const results = [];

  for (let i = 1; i < data.length; i++) {
    const teacherName = data[i][0];
    const returnDate = new Date(data[i][4]);
    returnDate.setHours(0, 0, 0, 0);

    if (returnDate.getTime() === today.getTime()) {
      results.push(`${teacherName}`);
    }
  }
  return results;
}

// ===== MENU =====

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("LTS Manager")
    .addItem("Run Daily Manually", "dailyRunner")
    .addItem("Create Daily Trigger", "createDailyTrigger")
    .addToUi();
}

function createDailyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === "dailyRunner") ScriptApp.deleteTrigger(t);
  }
  ScriptApp.newTrigger("dailyRunner")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}
