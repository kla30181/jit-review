# JIT Review Hybrid (ODPC1 Chiang Mai)

React + Vite + Firebase Authentication + Cloud Firestore + Google Apps Script + Google Sheets.

- เกณฑ์และหน้าจอจาก ZIP ต้นฉบับ (5) เก็บไว้โดยไม่แก้ข้อความโรค
- ZIP ต้นฉบับมี 24 โรค / 96 เกณฑ์ระดับย่อย **ไม่ใช่ 252 ข้อ** ตามภาพหน้าจอ หากต้องการ 252 ข้อต้องนำเข้าข้อมูลต้นฉบับที่ครบก่อน
- Firestore เป็นฐานข้อมูลหลักสำหรับการส่งแบบสอบถาม
- Google Apps Script รับคำขอซิงก์ที่ตรวจ Firebase ID Token และบันทึก Google Sheets โดยใช้ SpreadsheetApp
- Browser ไม่สามารถยืนยันผลของ Apps Script Web App `no-cors` ได้ ต้องตรวจผลที่ Apps Script Executions / Google Sheets

อ่าน [DEPLOY_TH.md](DEPLOY_TH.md) สำหรับขั้นตอนตั้งค่า Firebase, Apps Script และ GitHub Pages

```cmd
copy .env.example .env.local
npm install
npm run lint
npm run build
npm run dev
```

Local: http://localhost:3065/  |  GitHub Pages: https://kla30181.github.io/jit-review/
