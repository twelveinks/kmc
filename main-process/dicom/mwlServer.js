// MWL Server — C-FIND SCP (Modality Worklist)
// Serves the current patient record to the EPK-i8020c touchscreen before a procedure.
// Updated via IPC whenever the practitioner fills the report form.

const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp, Dataset } = dcmjsDimse;
const { CFindResponse } = dcmjsDimse.responses;
const { Status, PresentationContextResult } = dcmjsDimse.constants;

// In-memory worklist — updated from main.js via IPC when the form is filled
let activeWorklist = [];

class MwlScp extends Scp {
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

  // Return the active worklist entry to the EPK-i8020c
  cFindRequest(request, callback) {
    const pendingResponses = activeWorklist.map(patient => {
      const ds = new Dataset();
      // Patient Module
      ds.setElement('00100010', patient.patientName);   // Patient Name (LAST^FIRST)
      ds.setElement('00100020', patient.patientId);     // Patient ID
      ds.setElement('00100030', patient.dob || '');     // Date of Birth (YYYYMMDD)
      ds.setElement('00100040', patient.sex || 'O');    // Sex: M / F / O
      // Scheduled Procedure Step
      ds.setElement('00401001', patient.spssId);        // Requested Procedure ID
      ds.setElement('00321070', patient.procedureDesc); // Procedure Description

      const response = CFindResponse.fromRequest(request);
      response.setDataset(ds);
      response.setStatus(Status.Pending);
      return response;
    });

    const finalResponse = CFindResponse.fromRequest(request);
    finalResponse.setStatus(Status.Success);

    callback([...pendingResponses, finalResponse]);
  }

  associationReleaseRequested() {
    this.sendAssociationReleaseResponse();
  }
}

// Called from main.js IPC handler when the report form is updated
function updateWorklist(patient) {
  activeWorklist = patient ? [patient] : [];
}

function startMwlServer(port, aeTitle) {
  const server = new Server(MwlScp, { aeTitle });
  server.on('networkError', (e) => console.error('[DICOM] MWL network error:', e));
  server.listen(port);
  console.log(`[DICOM] MWL server listening on port ${port} (AE: ${aeTitle})`);
  return server;
}

module.exports = { startMwlServer, updateWorklist };
