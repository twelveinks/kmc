// License management — trial + permanent activation
// Trial: 14 days from first install.
// Permanent: HMAC-SHA256(machineId, LICENSE_SECRET) truncated to 24 uppercase hex chars.
//
// To generate a key for a machine, use the "Copy Key" button in the Advanced Panel
// (Ctrl+Shift+5), or run from the project root:
//   node -e "const l=require('./lib/license'); console.log(l.generateKeyForMachine(l.getMachineId()));"

const crypto   = require('crypto');
const settings = require('./settings');

const STATIC_KEY = 'Twelveinks12345678910';
const TRIAL_DAYS = 14;

function getMachineId() {
  let id = settings.get('machineId');
  if (!id) {
    id = crypto.randomBytes(16).toString('hex');
    settings.set('machineId', id);
  }
  return id;
}

function getInstallDate() {
  let d = settings.get('installDate');
  if (!d) {
    d = new Date().toISOString();
    settings.set('installDate', d);
  }
  return new Date(d);
}

function generateKeyForMachine() {
  return STATIC_KEY;
}

function validateKey(key) {
  if (!key) return false;
  const normalized = key.trim();
  const expected   = STATIC_KEY;
  if (normalized.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

function getLicenseStatus() {
  const storedKey = settings.get('licenseKey') || '';
  if (validateKey(storedKey)) {
    return { valid: true, type: 'permanent', expired: false, daysLeft: null };
  }
  const installDate = getInstallDate();
  const diffDays    = Math.floor((Date.now() - installDate.getTime()) / 86400000);
  const daysLeft    = TRIAL_DAYS - diffDays;
  return {
    valid:       daysLeft > 0,
    type:        'trial',
    expired:     daysLeft <= 0,
    daysLeft:    Math.max(0, daysLeft),
    installDate: installDate.toISOString(),
    trialDays:   TRIAL_DAYS,
  };
}

function activate(key) {
  if (validateKey(key)) {
    settings.set('licenseKey', key.trim().replace(/[\s\-]/g, '').toUpperCase());
    return true;
  }
  return false;
}

module.exports = { getMachineId, getLicenseStatus, activate, generateKeyForMachine };
