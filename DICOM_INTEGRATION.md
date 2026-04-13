# DICOM Integration — Pentax EPK-i8020c
## Med Scope Report v3.1.1 — Feature Implementation Guide

---

## Overview

This guide covers adding three DICOM services to Med Scope Report so it can communicate directly with the **Pentax Medical INSPIRA EPK-i8020c** video processor over a local ethernet connection:

| Service | Role | What it replaces |
|---|---|---|
| **PACS Receiver (C-STORE SCP)** | Receives scope images pushed from the EPK-i8020c | Manual camera capture / USB import |
| **MWL Server (C-FIND SCP)** | Serves patient worklist to the processor touchscreen | Double-entry of patient data on the machine |
| **MPPS Listener (N-CREATE / N-SET SCP)** | Receives procedure start/end signals | Manual report initiation |

All three run in the **main process** as a background service — consistent with how the app already handles privileged operations.

---

## 1. Install Dependency

```bash
npm install dcmjs-dimse
```

> `dcmjs-dimse` is a pure Node.js DICOM DIMSE implementation. It supports C-STORE, C-FIND, N-CREATE, N-SET as both SCU and SCP — covering everything the EPK-i8020c needs.

---

## 2. File Structure

Add the following files to your project:

```
main-process/
└── dicom/
    ├── dicomServer.js      ← entry point — starts all three services
    ├── pacsReceiver.js     ← C-STORE SCP  (receives images)
    ├── mwlServer.js        ← C-FIND SCP   (serves patient worklist)
    └── mppsListener.js     ← N-CREATE/N-SET SCP (procedure status)
```

Register `dicomServer.js` in `main.js` alongside your existing IPC handlers.

---

## 3. Settings

Add three new keys to your existing `kmc-settings/settings.json` schema in `lib/settings.js`:

```js
// In lib/settings.js — add to defaults
const defaults = {
  // ...existing keys...
  dicomEnabled:   false,          // user must opt in
  dicomAeTitle:   'MEDSCOPE',     // your app's AE Title (max 16 chars)
  dicomPort:      4104,           // port the EPK-i8020c will send to
  mwlPort:        4105,           // port for worklist queries
  mppsPort:       4106,           // port for procedure status
};
```

> Ports above 1024 don't need elevated privileges on Windows. Port `104` is the DICOM standard but requires admin rights — `4104` is conventional and safe.

Add a **DICOM Settings** section to `sections/preferences.html` exposing these four fields.

---

## 4. PACS Receiver — `pacsReceiver.js`

This is the core integration. The EPK-i8020c pushes a DICOM file (`.dcm`) over the network every time the endoscopist captures an image. This service receives it, extracts the pixel data as a JPEG, saves it to `photoSavePath`, and notifies the renderer via IPC.

```js
// main-process/dicom/pacsReceiver.js
const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp } = dcmjsDimse;
const { CStoreResponse } = dcmjsDimse.responses;
const { Status, StorageClass } = dcmjsDimse.constants;
const fs   = require('fs');
const path = require('path');
const { ipcMain, BrowserWindow } = require('electron');
const Settings = require('../../lib/settings');

class PacsReceiverScp extends Scp {
  constructor(socket, opts) {
    super(socket, opts);
  }

  // Accept the association from the EPK-i8020c
  associationRequested(association) {
    // Accept all storage presentation contexts
    association.getPresentationContexts().forEach(ctx => {
      const storageClasses = Object.values(StorageClass);
      if (storageClasses.includes(ctx.getAbstractSyntaxUid())) {
        ctx.setResult(0x00); // accept
      }
    });
    this.sendAssociationAccept();
  }

  // Handle each incoming DICOM image
  cStoreRequest(request, callback) {
    const dataset  = request.getDataset();
    const settings = new Settings();
    const savePath = settings.get('photoSavePath');

    // Build output filename from DICOM SOP Instance UID (guaranteed unique)
    const uid      = dataset.getString('00080018') || Date.now().toString();
    const filename = `DICOM_${uid.replace(/\./g, '_')}.jpg`;
    const outPath  = path.join(savePath, filename);

    // Extract raw pixel data and write as JPEG
    // dcmjs-dimse exposes pixel data via the dataset element (7FE00010)
    const pixelData = dataset.getElement('7FE00010');
    if (pixelData && pixelData.Value) {
      fs.writeFileSync(outPath, Buffer.from(pixelData.Value[0]));

      // Notify the renderer — same IPC pattern used by the rest of the app
      const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
      if (win) {
        win.webContents.send('dicom:image-received', {
          filePath: outPath,
          patientId:   dataset.getString('00100020'),
          patientName: dataset.getString('00100010'),
          studyDate:   dataset.getString('00080020'),
        });
      }
    }

    callback(new CStoreResponse(Status.Success));
  }

  associationReleaseRequested() {
    this.sendAssociationRelease();
  }
}

function startPacsReceiver(port, aeTitle) {
  const server = new Server(PacsReceiverScp);
  server.listen(port, { maxConnections: 5, aeTitle });
  console.log(`[DICOM] PACS receiver listening on port ${port} (AE: ${aeTitle})`);
  return server;
}

module.exports = { startPacsReceiver };
```

**In the renderer** (`renderer-process/report.js` or `assets/js/imageimport.js`), listen for the IPC event and insert the image into the next available slot in `collector[]`:

```js
// In your renderer — add alongside existing ipcRenderer listeners
const { ipcRenderer } = require('electron');

ipcRenderer.on('dicom:image-received', (event, data) => {
  // data.filePath is the saved JPEG on disk
  // Load it into the next empty image slot the same way imageimport.js does
  loadImageIntoSlot(data.filePath);

  // Optionally auto-fill patient fields if they are empty
  if (!document.getElementById('firstName').value && data.patientName) {
    const parts = data.patientName.split('^'); // DICOM name format: LAST^FIRST
    document.getElementById('firstName').value = parts[1] || '';
    document.getElementById('lastName').value  = parts[0] || '';
  }
  if (!document.getElementById('patientNumber').value && data.patientId) {
    document.getElementById('patientNumber').value = data.patientId;
  }
});
```

> **Note on pixel data:** The EPK-i8020c sends still images as DICOM Secondary Capture objects. Pixel data is typically uncompressed or JPEG-compressed. If you get raw uncompressed bytes rather than a valid JPEG, use `jimp` (already in your stack) to convert: `Jimp.read(buffer).then(img => img.writeAsync(outPath))`.

---

## 5. MWL Server — `mwlServer.js`

The EPK-i8020c queries this service before a procedure. It sends a C-FIND request and expects back a list of scheduled patients. You return whatever patient is currently entered in the active report form.

```js
// main-process/dicom/mwlServer.js
const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp, Dataset } = dcmjsDimse;
const { CFindResponse } = dcmjsDimse.responses;
const { Status } = dcmjsDimse.constants;

// In-memory worklist — updated via IPC when the report form is filled
let activeWorklist = [];

class MwlScp extends Scp {
  associationRequested(association) {
    association.getPresentationContexts().forEach(ctx => {
      ctx.setResult(0x00);
    });
    this.sendAssociationAccept();
  }

  cFindRequest(request, callback) {
    const responses = activeWorklist.map(patient => {
      const ds = new Dataset({
        // Patient Module
        '00100010': patient.patientName,   // Patient Name  (LAST^FIRST)
        '00100020': patient.patientId,     // Patient ID
        '00100030': patient.dob,           // Date of Birth (YYYYMMDD)
        '00100040': patient.sex,           // M / F / O
        // Scheduled Procedure Step
        '00400100': [{
          '00400001': 'MEDSCOPE',          // Scheduled Station AE Title
          '00400002': patient.schedDate,   // Scheduled Date (YYYYMMDD)
          '00400009': patient.spssId,      // Scheduled Procedure Step ID
          '00400010': 'ENDOSCOPY',         // Scheduled Station Name
          '00080060': 'ES',               // Modality: Endoscopy
        }],
        '00401001': patient.spssId,        // Requested Procedure ID
        '00321070': patient.procedureDesc, // Requested Procedure Description
      });

      const response = new CFindResponse(Status.Pending);
      response.setDataset(ds);
      return response;
    });

    // Send all matching entries then a final Success
    callback([
      ...responses,
      new CFindResponse(Status.Success)
    ]);
  }

  associationReleaseRequested() {
    this.sendAssociationRelease();
  }
}

// Called from main.js IPC handler when the report form is updated
function updateWorklist(patient) {
  activeWorklist = patient ? [patient] : [];
}

function startMwlServer(port, aeTitle) {
  const server = new Server(MwlScp);
  server.listen(port, { aeTitle });
  console.log(`[DICOM] MWL server listening on port ${port}`);
  return server;
}

module.exports = { startMwlServer, updateWorklist };
```

**IPC bridge in `main.js`** — sync the form data to the worklist as the user types:

```js
// In main.js
const { updateWorklist } = require('./main-process/dicom/mwlServer');

ipcMain.on('dicom:update-worklist', (event, patient) => {
  // patient = { patientName, patientId, dob, sex, schedDate, procedureDesc, spssId }
  updateWorklist(patient);
});
```

**In the renderer** (`renderer-process/report.js`), send the update whenever patient fields change:

```js
// Debounce and send on each field change
function syncWorklist() {
  const firstName = document.getElementById('firstName').value;
  const lastName  = document.getElementById('lastName').value;
  if (!firstName || !lastName) return;

  ipcRenderer.send('dicom:update-worklist', {
    patientName:   `${lastName}^${firstName}`, // DICOM name format
    patientId:     document.getElementById('patientNumber').value,
    dob:           document.getElementById('dob').value.replace(/-/g, ''),
    sex:           document.getElementById('sex').value,
    schedDate:     new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    procedureDesc: 'ENDOSCOPY',
    spssId:        Date.now().toString(),
  });
}

['firstName', 'lastName', 'patientNumber'].forEach(id => {
  document.getElementById(id).addEventListener('input', syncWorklist);
});
```

---

## 6. MPPS Listener — `mppsListener.js`

The EPK-i8020c sends an N-CREATE when a procedure starts and an N-SET when it completes. Use the completion signal to prompt the practitioner to finalise the report.

```js
// main-process/dicom/mppsListener.js
const dcmjsDimse = require('dcmjs-dimse');
const { Server, Scp } = dcmjsDimse;
const { NCreateResponse, NSetResponse } = dcmjsDimse.responses;
const { Status } = dcmjsDimse.constants;
const { BrowserWindow } = require('electron');

class MppsScp extends Scp {
  associationRequested(association) {
    association.getPresentationContexts().forEach(ctx => ctx.setResult(0x00));
    this.sendAssociationAccept();
  }

  // Procedure STARTED
  nCreateRequest(request, callback) {
    console.log('[DICOM] Procedure started (MPPS N-CREATE)');
    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (win) win.webContents.send('dicom:procedure-started');
    callback(new NCreateResponse(Status.Success));
  }

  // Procedure COMPLETED or DISCONTINUED
  nSetRequest(request, callback) {
    const dataset = request.getDataset();
    const status  = dataset?.getString('00400252'); // 'COMPLETED' or 'DISCONTINUED'
    console.log(`[DICOM] Procedure status update: ${status}`);

    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (win) win.webContents.send('dicom:procedure-completed', { status });

    callback(new NSetResponse(Status.Success));
  }

  associationReleaseRequested() {
    this.sendAssociationRelease();
  }
}

function startMppsListener(port, aeTitle) {
  const server = new Server(MppsScp);
  server.listen(port, { aeTitle });
  console.log(`[DICOM] MPPS listener on port ${port}`);
  return server;
}

module.exports = { startMppsListener };
```

**In the renderer**, listen for the completion event:

```js
ipcRenderer.on('dicom:procedure-completed', (event, data) => {
  if (data.status === 'COMPLETED') {
    // Show a prompt — reuse your existing confirm dialog pattern
    const confirm = window.confirm(
      'The scope procedure has been marked complete on the processor.\n\nReview and save the report now?'
    );
    if (confirm) {
      // trigger your existing report save flow
      document.getElementById('btn-save-report').click();
    }
  }
});
```

---

## 7. Entry Point — `dicomServer.js`

Wire everything together and expose start/stop to `main.js`:

```js
// main-process/dicom/dicomServer.js
const { startPacsReceiver } = require('./pacsReceiver');
const { startMwlServer }    = require('./mwlServer');
const { startMppsListener } = require('./mppsListener');
const Settings = require('../../lib/settings');

let servers = [];

function startDicomServices() {
  const settings  = new Settings();
  if (!settings.get('dicomEnabled')) {
    console.log('[DICOM] Integration disabled in settings — skipping.');
    return;
  }

  const aeTitle   = settings.get('dicomAeTitle') || 'MEDSCOPE';
  const pacsPort  = settings.get('dicomPort')    || 4104;
  const mwlPort   = settings.get('mwlPort')      || 4105;
  const mppsPort  = settings.get('mppsPort')      || 4106;

  servers = [
    startPacsReceiver(pacsPort, aeTitle),
    startMwlServer(mwlPort, aeTitle),
    startMppsListener(mppsPort, aeTitle),
  ];
}

function stopDicomServices() {
  servers.forEach(s => { try { s.close(); } catch (_) {} });
  servers = [];
}

module.exports = { startDicomServices, stopDicomServices };
```

**In `main.js`**, call start after the app is ready:

```js
const { startDicomServices, stopDicomServices } = require('./main-process/dicom/dicomServer');

app.whenReady().then(() => {
  createWindow();         // your existing startup
  startDicomServices();   // ← add this
});

app.on('before-quit', () => {
  stopDicomServices();
});
```

---

## 8. Network Configuration (EPK-i8020c Side)

On the processor's touchscreen, go to **Settings → Network → DICOM**:

| Field | Value |
|---|---|
| PACS Server IP | IP address of the reporting PC |
| PACS Server Port | `4104` (must match `dicomPort` in settings) |
| PACS AE Title | `MEDSCOPE` (must match `dicomAeTitle`) |
| MWL Server IP | Same PC IP |
| MWL Server Port | `4105` |
| MPPS Server IP | Same PC IP |
| MPPS Server Port | `4106` |
| Calling AE Title | Any name (e.g. `EPK-i8020c`) |

> Both devices must be on the same local network switch. No internet or router is needed — a direct ethernet switch between the processor and PC is sufficient.

---

## 9. Testing Without the Physical Device

Use **DCMTK** (`storescp`, `findscu`) to simulate the EPK-i8020c on any machine:

```bash
# Install DCMTK
# Windows: https://dcmtk.org/en/dcmtk/dcmtk-software-development-toolkit/
# Ubuntu:  sudo apt install dcmtk

# 1. Test PACS — send a DICOM file to your receiver
storescu -v +sd +r 127.0.0.1 4104 path/to/test.dcm --call MEDSCOPE

# 2. Test MWL — query your worklist server
findscu -v -W 127.0.0.1 4105 -k "00100010=*" --call MEDSCOPE

# 3. Test MPPS — simulate procedure complete
# (requires a .dcm MPPS dataset — see DCMTK examples)
```

A sample `.dcm` test file is available from the [DCMTK sample data repository](https://www.dcmtk.org/en/dcmtk/dcmtk-example-files/).

---

## 10. Data Flow Summary

```
EPK-i8020c (Pentax)                     Med Scope Report (PC)
────────────────────                     ─────────────────────────────
                                         app starts → dicomServer.js
                                           ├─ PACS receiver  :4104
                                           ├─ MWL server     :4105
                                           └─ MPPS listener  :4106

Practitioner fills patient form  ──────→  ipcRenderer.send('dicom:update-worklist')
                                            └─ updateWorklist() stores in memory

EPK queries worklist (C-FIND)    ──────→  MWL server responds with patient entry
  └─ Patient appears on processor
       touchscreen ✓

Procedure runs, endoscopist       ──────→  PACS receiver saves JPEG to photoSavePath
captures image (C-STORE)                   └─ ipcMain fires 'dicom:image-received'
                                             └─ renderer loads image into report slot ✓

Endoscopist ends procedure        ──────→  MPPS listener receives N-SET 'COMPLETED'
(N-SET COMPLETED)                          └─ renderer shows "Save report?" prompt ✓
```

---

## 11. Known Gotchas

**Pixel data format** — The EPK-i8020c may send images as uncompressed RGB, JPEG Baseline, or JPEG 2000. Check the Transfer Syntax UID in the received dataset (`00020010`). If it's not `1.2.840.10008.1.2.4.50` (JPEG Baseline), pass the raw pixel buffer through `jimp` or `sharp` (both already in your stack) before writing the JPEG.

**AE Title casing** — DICOM AE Titles are case-sensitive and max 16 characters. Whatever you set in `dicomAeTitle` in settings must exactly match what is configured on the EPK-i8020c.

**Windows Firewall** — On first run, Windows will prompt to allow Node.js through the firewall on the three ports. The user must click **Allow**. Document this in your setup instructions.

**Multiple windows** — The `BrowserWindow.getAllWindows().find(...)` pattern works fine for the main report window. If the user has a PDF viewer window open at the same time, filter by the window title or store a reference to the main window in a module-level variable in `main.js` to be precise.

**Port conflicts** — If port `4104` is already in use (e.g. another DICOM tool installed on the PC), the server will throw. Wrap `server.listen()` in a try/catch and surface the error through IPC to the preferences screen with a message to change the port.
