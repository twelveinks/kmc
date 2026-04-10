// DICOM Services Entry Point
// Starts/stops all three DICOM services: PACS receiver, MWL server, and MPPS listener.
// Called from main.js after app.whenReady().

const { startPacsReceiver } = require('./pacsReceiver');
const { startMwlServer, updateWorklist } = require('./mwlServer');
const { startMppsListener } = require('./mppsListener');
const settings = require('../../lib/settings');

let servers = [];

function startDicomServices() {
  if (!settings.get('dicomEnabled')) {
    console.log('[DICOM] Integration disabled in settings — skipping.');
    return;
  }

  const aeTitle  = settings.get('dicomAeTitle') || 'MEDSCOPE';
  const pacsPort = settings.get('dicomPort')    || 4104;
  const mwlPort  = settings.get('mwlPort')      || 4105;
  const mppsPort = settings.get('mppsPort')     || 4106;

  try {
    servers = [
      startPacsReceiver(pacsPort, aeTitle),
      startMwlServer(mwlPort, aeTitle),
      startMppsListener(mppsPort, aeTitle),
    ];
  } catch (err) {
    console.error('[DICOM] Failed to start services:', err.message);
  }
}

function stopDicomServices() {
  servers.forEach(s => { try { s.close(); } catch (_) {} });
  servers = [];
}

module.exports = { startDicomServices, stopDicomServices, updateWorklist };
