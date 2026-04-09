# Med Scope Report — System Documentation Report

**Application:** Med Scope Report  
**Version:** 3.1.1  
**Author:** Twelveinks Company Limited  
**License:** CC0-1.0  
**Date of Report:** April 2026  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Core Features](#4-core-features)
5. [Data Flow](#5-data-flow)
6. [Data Storage](#6-data-storage)
7. [User Management & Authentication](#7-user-management--authentication)
8. [Report Generation Workflow](#8-report-generation-workflow)
9. [Image Handling](#9-image-handling)
10. [Settings & Configuration](#10-settings--configuration)
11. [Security Practices & Standards Compliance](#11-security-practices--standards-compliance)
12. [Known Security Observations](#12-known-security-observations)
13. [Build & Deployment](#13-build--deployment)
14. [File Structure Reference](#14-file-structure-reference)

---

## 1. System Overview

**Med Scope Report** is a desktop application built on the Electron framework. It is designed for medical professionals — primarily endoscopists — to capture, annotate, and generate structured PDF reports from endoscopy and colonoscopy (scope) procedures. The application runs entirely offline on the local machine; no patient data is transmitted over a network.

### Primary Use Cases

| Use Case | Description |
|---|---|
| Endoscopy / Colonoscopy Report | Create a structured PDF report with patient details, findings, and captured scope images |
| Operation Report | Generate a free-text operation note as a PDF document |
| Referral Letter | Author and export a formatted patient referral letter |
| Report History | Browse and re-open all previously saved PDF reports |
| User Administration | Create and manage practitioner user accounts |

---

## 2. Architecture

The application follows the **Electron two-process model**:

```
┌──────────────────────────────────────────────┐
│                  Main Process                │
│  main.js                                     │
│  ├── Window management (BrowserWindow)       │
│  ├── IPC event handling (ipcMain)            │
│  ├── PDF generation (printToPDF)             │
│  ├── File system operations                  │
│  └── Application menu                       │
└────────────────┬─────────────────────────────┘
                 │  IPC (ipcMain / ipcRenderer)
┌────────────────▼─────────────────────────────┐
│               Renderer Process               │
│  HTML sections + JS renderer-process files   │
│  ├── Login / User creation                   │
│  ├── Dashboard                               │
│  ├── Report forms (endo / colo)              │
│  ├── Camera capture                          │
│  ├── Image import & processing               │
│  └── PDF confirmation view                  │
└──────────────────────────────────────────────┘
```

**IPC Communication Pattern:** The renderer process sends requests via `ipcRenderer.send()` and receives responses via `ipcRenderer.on()` / `ipcRenderer.once()`. The main process handles these via registered `ipcMain.on()` listeners. This separation ensures that privileged operations (file I/O, PDF generation, dialog boxes) are handled exclusively in the main process.

---

## 3. Technology Stack

### Runtime & Framework

| Component | Version | Purpose |
|---|---|---|
| Electron | ^22.3.27 | Desktop application shell |
| Node.js | (bundled with Electron) | Runtime, file system, crypto |
| @electron/remote | ^2.1.3 | Cross-process Electron API access |

### UI Libraries

| Library | Version | Purpose |
|---|---|---|
| Bootstrap | 3.x (vendored) | Responsive layout and UI components |
| Font Awesome | (vendored) | Icon set |
| jQuery | ^3.4.1 | DOM manipulation |
| jQuery UI | ^1.12.1 | UI enhancements |
| js-datepicker | ^4.0.6 | Date selection widget |

### Image Processing

| Library | Version | Purpose |
|---|---|---|
| jimp | ^1.6.0 | Server-side image manipulation |
| sharp | ^0.34.4 | High-performance image processing |
| Canvas API | (browser built-in) | Client-side black-border cropping |

### PDF & Logging

| Library | Version | Purpose |
|---|---|---|
| electron-pdf | ^25.0.0 | PDF generation from HTML |
| electron-pdf-window | ^1.0.0 | In-app PDF previewing |
| electron-log | ^5.4.3 | Application logging |

---

## 4. Core Features

### 4.1 Dashboard

The main hub after login. Provides quick-access action cards for:
- Creating a new scope report
- Writing a referral letter
- Completing an operation form
- Viewing the recent reports list

### 4.2 Scope Report Creation

Two report subtypes are supported:

- **Endoscopy (`endo`):** Upper GI scope procedure report
- **Colonoscopy (`colo`):** Lower GI scope procedure report

Each report captures:
- Patient demographics (first name, last name, patient number, date of birth, sex)
- Procedure date (via date picker)
- Clinical findings (free-text)
- Up to 6 scope images (imported or camera-captured)
- Attending doctor's name (automatically injected from the logged-in user)

### 4.3 Camera Capture

Integrates with the machine's connected webcam or external video device to capture still images directly from the scope feed. The camera module:
- Validates that patient information (first name, last name, patient number) is entered before enabling the capture button
- Supports large and small camera dialog sizes
- Saves images to the configured photo save path (`~/ENDO/` by default)

### 4.4 Image Import

Accepts bulk or individual image upload. Supported formats:
- JPEG (`.jpg`)
- PNG (`.png`)
- BMP (`.bmp`)

Each slot accepts one image; the form supports up to 6 images per report.

### 4.5 Image Processing

A Canvas-based algorithm automatically crops black border regions common in scope machine output images:
- Scans pixel data to detect non-black content boundaries
- Applies an additional 82 px left-side crop offset specific to scope machine output
- Trims 10% from top and bottom (vertical crop)
- Preserves a 1 px black margin on horizontal edges

### 4.6 PDF Generation

Reports are rendered as HTML in a hidden Electron window and exported via `printToPDF`. The output PDF is:
- Saved to a user-configurable path
- Recorded in the local `reports.json` history store
- Optionally displayed in an in-app PDF viewer window

PDF save paths (configurable in Preferences):

| Report Type | Default Save Path |
|---|---|
| Scope photos | `~/ENDO/` |
| Scope reports | `~/scope report/` |
| Operation reports | `~/operation reports/` |
| Referral letters | `~/referral reports/` |

### 4.7 Operation Report

A free-text, A4-formatted document with a hospital letterhead. The physician types the operation note in a content-editable area, then exports to PDF.

### 4.8 Referral Letter

Same document format as the Operation Report — A4 with letterhead — used to refer a patient to another clinician or facility.

### 4.9 Reports History

A persistent index (`reports.json`) stores metadata for up to 20 recent reports:
- Patient name
- Doctor name
- Report type
- File path
- Date/time created

Reports can be viewed from the dashboard and re-opened from the history screen.

### 4.10 User Management

Administrators can create, edit, and delete practitioner user accounts. Each account stores:
- First name and last name
- Username
- SHA-256 HMAC hashed password

---

## 5. Data Flow

### Login Flow

```
User enters credentials
        │
        ▼
renderer-process/login.js
  └─ hash password (SHA-256 HMAC)
  └─ lib/data.js → read .data/users/<username>.json
  └─ compare username + hashed password
        │
  ┌─────┴────────┐
 Pass            Fail
  │               │
  ▼               ▼
ipcRenderer    Show error
.send('openMainWindow', userData)
  │
  ▼
main.js → open dashboard window
```

### Report Creation Flow

```
User fills in patient form + images
        │
        ▼
renderer-process/report.js
  └─ ipcRenderer.send('get-doctor-name')
  └─ receive doctor name → attach to form data
  └─ ipcRenderer.send('openReportCreation', { type, data })
        │
        ▼
main.js → create report BrowserWindow
  └─ load sections/report.html
  └─ inject data via 'insert-data' IPC event
        │
        ▼
User confirms → ipcRenderer.send('generate-pdf', ...)
        │
        ▼
main.js / lib/report-helpers.js
  └─ printToPDF()
  └─ fs.writeFile() to configured path
  └─ lib/reports-store.js → update reports.json
  └─ open PDF viewer window
```

---

## 6. Data Storage

All data is stored **locally on the host machine** — no external database or network service is used.

### Directory Layout

| Storage | Path (Development) | Path (Packaged) |
|---|---|---|
| User accounts | `<app>/.data/users/<username>.json` | `<resources>/../.data/users/<username>.json` |
| Reports index | `<app>/.data/reports.json` | `<resources>/../.data/reports.json` |
| App settings | `$APPDATA/kmc-settings/settings.json` | `$APPDATA/kmc-settings/settings.json` |
| Scope photos | `~/ENDO/` (configurable) | Same |
| PDF reports | `~/scope report/` (configurable) | Same |

### Data Format

**User record (`users/<username>.json`):**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "userName": "janedoe",
  "password": "<sha256-hmac-hex>"
}
```

**Reports index entry (`reports.json` array item):**
```json
{
  "filePath": "/Users/.../scope report/ReportName.pdf",
  "patientName": "John Smith",
  "doctorName": "Dr. Jane Doe",
  "type": "endo",
  "findings": "...",
  "date": "2026-04-09T10:00:00.000Z"
}
```

---

## 7. User Management & Authentication

- User accounts are created by registering a username, password, and personal details
- Passwords are **never stored in plain text**; they are hashed using `crypto.createHmac('sha256', secret).update(password).digest('hex')` (Node.js built-in `crypto` module)
- Login compares the submitted password hash against the stored hash
- The currently logged-in user's data is held in `global.currentUser` in the main process and reflected across windows via IPC
- User display name is prepended with "Dr." throughout the application

---

## 8. Report Generation Workflow

1. **Form completion** — practitioner fills in patient details and findings
2. **Image attachment** — up to 6 images via camera capture or file import
3. **Doctor injection** — the logged-in doctor's name is fetched via IPC and appended to the data payload
4. **Report window** — a dedicated `BrowserWindow` renders the report HTML template
5. **Confirmation** — the practitioner reviews the rendered report and confirms saving
6. **PDF export** — `printToPDF` generates the binary PDF, which is written to disk via `fs.promises.writeFile`
7. **History recording** — the `ReportsStore` class appends a metadata entry to `reports.json`, capping at 20 records
8. **PDF preview** — a viewer window opens with `contextIsolation: true` and `nodeIntegration: false` to safely display the file

---

## 9. Image Handling

### Supported Input Formats

| Format | Extension |
|---|---|
| JPEG | `.jpg` |
| Portable Network Graphics | `.png` |
| Bitmap | `.bmp` |

### Processing Pipeline

1. File selected via `<input type="file">` or camera capture
2. `FileReader.readAsDataURL()` encodes the file as a Base64 data URL
3. The Canvas API (`cropBlackSections()`) removes black borders:
   - Horizontal boundary detection with configurable `blackThreshold` (default: 30/255)
   - 82 px additional left-crop offset for scope machine OSD region
   - 10% top/bottom vertical trim
4. Processed data URL is stored in the `collector[]` array and rendered as thumbnail previews
5. Images are embedded as Base64 data URLs directly in the HTML report template

---

## 10. Settings & Configuration

Settings are persisted in `kmc-settings/settings.json` in the platform's standard application data directory:

| Platform | Settings Path |
|---|---|
| Windows | `%APPDATA%\kmc-settings\settings.json` |
| macOS | `~/Library/Application Support/kmc-settings/settings.json` |
| Linux | `~/.config/kmc-settings/settings.json` |

Configurable paths and their defaults:

| Setting Key | Default Value |
|---|---|
| `photoSavePath` | `~/ENDO` |
| `reportSavePath` | `~/scope report` |
| `operationSavePath` | `~/operation reports` |
| `referralSavePath` | `~/referral reports` |

Settings are managed through the **Preferences** screen (File → Preferences or `Cmd+,` / `Ctrl+,`). The `Settings` class in `lib/settings.js` provides `get()`, `set()`, `getAll()`, and `resetToDefaults()` methods. All configured directories are created automatically if they do not already exist.

---

## 11. Security Practices & Standards Compliance

### 11.1 Data Privacy (HIPAA-Aligned Practices)

Although this application is not currently certified under any specific regulatory framework, its design aligns with key data-privacy principles relevant to healthcare software:

| Principle | Implementation |
|---|---|
| **Local data storage** | All patient data (report content, images, user records) remains on the local machine. No data is transmitted to external servers. |
| **Access control** | Application access is protected by username/password authentication before any patient data is accessible. |
| **Minimum necessary** | Only the data required for report generation is collected and stored. |
| **Data at rest** | Patient report PDFs and user records are stored in local directories; physical access controls on the workstation form the outer security boundary. |

### 11.2 Password Security

- Passwords are hashed using **HMAC-SHA256** via Node.js's built-in `crypto` module — no plain-text storage
- Password confirmation is required during account creation to prevent typos
- Duplicate username detection prevents account enumeration via creation

### 11.3 Electron Security

| Feature | Status |
|---|---|
| PDF viewer uses `contextIsolation: true` | Applied — the PDF viewer window isolates browser context from Node.js |
| PDF viewer uses `nodeIntegration: false` | Applied — renderer code in the PDF viewer cannot access Node.js APIs |
| IPC used for privileged operations | Applied — file writes, PDF generation, and dialog boxes are delegated to the main process |
| `asar` packaging | Enabled — source files are packaged in an asar archive in production builds |

### 11.4 Input Validation

- Camera capture is gated on patient field completion (first name, last name, patient number must be non-empty)
- Image file types are validated against an allowlist (`image/bmp`, `image/png`, `image/jpeg`) before processing
- Password fields are compared after hashing — raw passwords are not stored or logged
- JSON parsing uses a safe wrapper (`helpers.parseJsonToObject`) that returns an empty object on parse failure, preventing crashes from corrupt data

### 11.5 Dependency Management

- Dependencies are managed via `npm` with pinned major versions
- `electron-builder` is used for reproducible builds
- `asar: true` is set in the build configuration, preventing casual modification of deployed application files

---

## 12. Known Security Observations

The following observations are noted for awareness. They do not represent immediate exploits given the application's offline, local-use context, but should be considered if the application is extended or audited:

| Observation | Detail | Recommendation |
|---|---|---|
| **Hardcoded HMAC secret** | The password hashing secret key (`'allHospitalBillsPaid'`) is embedded in `lib/helpers.js` source code. If source code is accessed, the key is exposed. | Store the secret in an environment variable or platform keychain. Move to bcrypt or Argon2 for password hashing. |
| **`webSecurity: false`** | The main application window disables Electron's web security to allow loading local file resources. This permits cross-origin requests from the renderer. | Refactor local resource loading to use proper `file://` protocol paths or a custom protocol handler, and re-enable `webSecurity`. |
| **`contextIsolation: false` + `nodeIntegration: true`** | The main window renderer has full Node.js access. Any XSS vulnerability in the renderer could lead to arbitrary code execution. | Migrate to `contextIsolation: true` + `nodeIntegration: false` with a `preload.js` bridge, as already done for the PDF viewer window. |
| **No session / token management** | There is no session expiry or logout timeout. A user who leaves the application open is fully authenticated indefinitely. | Implement an inactivity timeout that returns to the login screen. |
| **No audit log** | There is no record of which user generated, accessed, or modified reports. | Add a structured audit log to `electron-log` that records user actions on patient data. |
| **Reports stored in plaintext** | PDF reports and user JSON files are not encrypted on disk. Anyone with OS-level access to the machine can read them. | Consider encrypting the `.data/` directory contents at rest using the OS keychain or a key derived from the user's login credentials. |

---

## 13. Build & Deployment

### Development

```bash
npm install          # Install dependencies
npm start            # Launch in development mode (Electron)
```

### Production Builds

```bash
# Windows (32-bit)
npm run build:win32

# macOS
npm run build:mac
```

Build artefacts are placed in `release-builds/`. The build is configured in `package.json` under the `"build"` key using `electron-builder`.

### Build Configuration Summary

| Setting | Value |
|---|---|
| App ID | `com.twelveinks.med-scope-report` |
| Product Name | `Med Scope Report` |
| Packaging | `asar: true` |
| Windows Target | `ia32` |
| Output Directory | `release-builds/` |

---

## 14. File Structure Reference

```
/
├── main.js                    # Main process entry point
├── preload.js                 # Preload script (contextBridge)
├── index.html                 # Application shell / template loader
├── renderer.js                # Renderer bootstrap
├── package.json               # Dependencies and build config

├── lib/                       # Shared Node.js modules
│   ├── data.js                # JSON file CRUD (users, records)
│   ├── handlers.js            # HTTP-style route handlers (legacy)
│   ├── helpers.js             # Crypto utilities (hash, random string)
│   ├── report-helpers.js      # PDF save + report store helpers
│   ├── reports-store.js       # Report history persistence (ReportsStore)
│   ├── settings.js            # App settings persistence (Settings)
│   └── userSession.js         # Current-user session utility

├── main-process/
│   └── createPDF.js           # IPC handler: confirmation dialog

├── renderer-process/
│   ├── login.js               # Login form logic
│   ├── createUser.js          # Account creation form logic
│   ├── report.js              # Report form submission & PDF trigger
│   └── handlefiles.js         # File handling utilities

├── sections/                  # HTML pages (loaded into BrowserWindow)
│   ├── dashboard.html         # Post-login dashboard
│   ├── report.html            # Scope report preview / PDF confirmation
│   ├── report2.html / report3.html  # Alternate report templates
│   ├── report-generation.html # Report form (endo / colo)
│   ├── operationForm.html     # Operation note editor
│   ├── referralForm.html      # Referral letter editor
│   ├── all-reports.html       # Report history list
│   ├── users.html             # User management
│   ├── preferences.html       # Settings / Preferences
│   ├── accountCreate.html     # New user registration
│   ├── sessionCreate.html     # Login page
│   └── templates.html         # Template management

├── assets/
│   ├── js/
│   │   ├── app.js             # Date picker initialisation
│   │   ├── camera.js          # Camera capture + patient validation
│   │   ├── imageimport.js     # Bulk/single image import
│   │   └── imageprocessing.js # Canvas-based black-border cropping
│   ├── css/                   # Application stylesheets
│   └── vendor/                # Vendored Bootstrap & Font Awesome

└── build/
    └── entitlements.mac.plist # macOS entitlements for signing
```

---

*This document was generated from source code analysis of Med Scope Report v3.1.1.*
