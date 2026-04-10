// MPPS Listener — N-CREATE / N-SET SCP (Modality Performed Procedure Step)
// Receives procedure start (N-CREATE) and end (N-SET) signals from the EPK-i8020c.
// On completion, prompts the practitioner to finalise the report.

const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp } = dcmjsDimse;
const { NCreateResponse, NSetResponse } = dcmjsDimse.responses;
const { Status, PresentationContextResult } = dcmjsDimse.constants;
const { BrowserWindow } = require('electron');

class MppsScp extends Scp {
  constructor(socket, opts) {
    super(socket, opts);
  }

  associationRequested(association) {
    const contexts = association.getPresentationContexts();
    contexts.forEach((c) => {
      const context = association.getPresentationContext(c.id);
      const transferSyntaxes = context.getTransferSyntaxUids();
      if (transferSyntaxes.length > 0) {
        context.setResult(PresentationContextResult.Accept, transferSyntaxes[0]);
      }
    });
    this.sendAssociationAccept();
  }

  // Procedure STARTED — EPK-i8020c sends N-CREATE when procedure begins
  nCreateRequest(request, callback) {
    console.log('[DICOM] Procedure started (MPPS N-CREATE)');
    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (win) win.webContents.send('dicom:procedure-started');

    const response = NCreateResponse.fromRequest(request);
    response.setStatus(Status.Success);
    callback(response);
  }

  // Procedure COMPLETED or DISCONTINUED — EPK-i8020c sends N-SET when done
  nSetRequest(request, callback) {
    const dataset = request.getDataset();
    // DICOM tag 00400252: Performed Procedure Step Status ('COMPLETED' or 'DISCONTINUED')
    const status = dataset ? dataset.getElement('PerformedProcedureStepStatus') : null;
    console.log(`[DICOM] Procedure status update: ${status}`);

    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (win) win.webContents.send('dicom:procedure-completed', { status });

    const response = NSetResponse.fromRequest(request);
    response.setStatus(Status.Success);
    callback(response);
  }

  associationReleaseRequested() {
    this.sendAssociationReleaseResponse();
  }
}

function startMppsListener(port, aeTitle) {
  const server = new Server(MppsScp, { aeTitle });
  server.on('networkError', (e) => console.error('[DICOM] MPPS network error:', e));
  server.listen(port);
  console.log(`[DICOM] MPPS listener on port ${port} (AE: ${aeTitle})`);
  return server;
}

module.exports = { startMppsListener };
