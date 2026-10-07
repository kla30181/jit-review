# ติดตั้งแบบฟรี: GitHub Pages + Firebase Auth + Firestore + Google Apps Script

ระบบนี้ใช้ Firestore เป็นฐานข้อมูลหลัก และส่งสำเนาข้อมูลไป Google Sheet ผ่าน Google Apps Script
จึงไม่ต้องเปิด Google Sheets API หรือ Google Drive API ใน Google Cloud Console

## 1) Firebase
1. สร้าง Firebase project และ Web App
2. Authentication > Sign-in method > Google > Enable
3. Authentication > Settings > Authorized domains > เพิ่ม `kla30181.github.io`
4. Firestore Database > Create database > Production mode
5. Firestore Database > Rules > วางเนื้อหาจาก `firestore.rules` แล้ว Publish
6. Project settings > General > Web app > คัดลอก Firebase config 6 ค่า

## 2) Google Sheet + Apps Script
1. สร้าง Google Sheet เปล่า 1 ไฟล์
2. ใน Sheet ไป Extensions > Apps Script
3. ลบโค้ดเดิม แล้วคัดลอก `google-apps-script/Code.gs` ไปวาง
4. Save
5. Deploy > New deployment > Web app
6. Execute as: Me
7. Who has access: Anyone
8. Deploy และคัดลอก Web app URL ที่ลงท้าย `/exec`
9. คัดลอก URL ของ Google Sheet

ไม่ต้องเปิด Google Sheets API/Drive API

## 3) รันในเครื่อง
สร้าง `.env.local` จาก `.env.example` แล้วใส่ค่าทั้ง 8 ตัว

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../edit
```

จากนั้น

```bash
npm install
npm run dev
```

เปิด http://localhost:5173

## 4) GitHub Secrets
Repository > Settings > Secrets and variables > Actions > New repository secret

เพิ่ม 8 ตัว:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_APPS_SCRIPT_WEB_APP_URL
- VITE_GOOGLE_SHEET_URL

จากนั้น push ขึ้น branch main ระบบ GitHub Actions จะ deploy GitHub Pages อัตโนมัติ

## การทำงาน
- Login: Firebase Authentication (Google)
- ข้อมูลหลัก: Firestore (`jit_submissions`, `jit_settings`)
- สำเนารายงาน: Google Sheet ผ่าน Apps Script
- ปุ่ม Google Sheet ในหน้าเดิมยังอยู่
- Export CSV เดิมยังอยู่
- หน้า Admin / Summary / SAT / เกณฑ์เดิมยังอยู่
