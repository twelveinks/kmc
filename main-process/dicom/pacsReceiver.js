// PACS Receiver — C-STORE SCP
// Receives scope images pushed from the Pentax EPK-i8020c over the network.
// Saves each image as a JPEG in photoSavePath and notifies the renderer via IPC.

const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp } = dcmjsDimse;
const { CStoreResponse } = dcmjsDimse.responses;
const { Status, PresentationContextResult } = dcmjsDimse.constants;
const fs   = require('fs');
const path = require('path');
const { BrowserWindow } = require('electron');
const settings = require('../../lib/settings');

class PacsReceiverScp extends Scp {
  constructor(socket, opts) {
    super(socket, opts);
  }

  // Accept all presented storage contexts from the EPK-i8020c
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

  // Handle each incoming DICOM image from the scope processor
  cStoreRequest(request, callback) {
    try {
      const dataset  = request.getDataset();
      const savePath = settings.get('photoSavePath');

      // Use SOP Instance UID as filename — guaranteed unique per image
      const uid      = dataset.getElement('SOPInstanceUID') || Date.now().toString();
      const filename = `DICOM_${uid.replace(/\./g, '_')}.jpg`;
      const outPath  = path.join(savePath, filename);

      // Ensure save directory exists
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }

      const pixelData = dataset.getElement('PixelData');
      if (pixelData) {
        // pixelData may be a Buffer, ArrayBuffer, or array — normalise to Buffer
        const buffer = Buffer.isBuffer(pixelData)
          ? pixelData
          : Buffer.from(pixelData instanceof ArrayBuffer ? pixelData : pixelData[0]);

        fs.writeFileSync(outPath, buffer);

        // Notify renderer — it will load the image into the next available slot
        const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
        if (win) {
          win.webContents.send('dicom:image-received', {
            filePath:    outPath,
            patientId:   dataset.getElement('PatientID')   || '',
            patientName: dataset.getElement('PatientName') || '',
            studyDate:   dataset.getElement('StudyDate')   || '',
          });
        }
      }
    } catch (err) {
      console.error('[DICOM] Error handling C-STORE:', err.message);
    }

    const response = CStoreResponse.fromRequest(request);
    response.setStatus(Status.Success);
    callback(response);
  }

  associationReleaseRequested() {
    this.sendAssociationReleaseResponse();
  }
}

function startPacsReceiver(port, aeTitle) {
  const server = new Server(PacsReceiverScp, { aeTitle });
  server.on('networkError', (e) => console.error('[DICOM] PACS network error:', e));
  server.listen(port);
  console.log(`[DICOM] PACS receiver listening on port ${port} (AE: ${aeTitle})`);
  return server;
}

module.exports = { startPacsReceiver };
