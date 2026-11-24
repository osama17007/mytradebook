// Trade Gate news alerts - Google Apps Script (free).
// Paste this into script.google.com, then follow the setup steps.

const TOKEN = 'change-this-to-a-long-random-text'; // must match NEWS_SCRIPT.token in the website
const TZ = 'Asia/Karachi';
const TO = 'osama17007@gmail.com';
const ALERT_MINUTES = 20; // same window as the in-app banner

// The website sends the news calendar here whenever it is saved.
function doPost(e) {
  const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if (body.token !== TOKEN) return ContentService.createTextOutput('forbidden');
  PropertiesService.getScriptProperties().setProperty('newsCal', JSON.stringify(body.newsCal || []));
  return ContentService.createTextOutput('ok');
}

// Runs every minute (started by createTrigger).
function checkNews() {
  const props = PropertiesService.getScriptProperties();
  const events = JSON.parse(props.getProperty('newsCal') || '[]');
  const now = new Date();
  const day = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  const minutes = Number(Utilities.formatDate(now, TZ, 'H')) * 60 + Number(Utilities.formatDate(now, TZ, 'm'));
  const sent = JSON.parse(props.getProperty('sent') || '[]');
  let changed = false;

  events.forEach(function (ev) {
    if (ev.date !== day || !ev.time) return;
    const parts = ev.time.split(':').map(Number);
    const diff = parts[0] * 60 + parts[1] - minutes;
    if (!(diff > -1 && diff <= ALERT_MINUTES)) return;
    const key = day + '-' + (ev.id || ev.ccy + ev.name + ev.time);
    if (sent.indexOf(key) !== -1) return;
    const when = diff <= 0 ? 'now' : 'in ' + Math.ceil(diff) + ' min';
    MailApp.sendEmail(TO,
      'Trade Gate: ' + ev.ccy + ' ' + ev.name + ' ' + when,
      'High-impact news ' + when + ': ' + ev.ccy + ' ' + ev.name + ' at ' + ev.time + ' (' + day + ').\nCheck your checklist before trading.');
    sent.push(key);
    changed = true;
  });

  if (changed) props.setProperty('sent', JSON.stringify(sent.slice(-500)));
}

// Run this ONCE from the editor (select createTrigger, press Run).
function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('checkNews').timeBased().everyMinutes(1).create();
}
