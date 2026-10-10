# JIT Review - ติดตั้งและ Deploy

## ข้อจำกัดของชุดข้อมูล

ไฟล์ ZIP ต้นฉบับ (5) มี 24 โรค / 96 เกณฑ์ระดับย่อย ไม่ใช่ 252 ข้อในภาพตัวอย่าง ข้อมูลใน `src/data/defaultCriteria.ts` ถูกคงไว้ตามต้นฉบับ ห้ามเติมข้อมูลเกณฑ์จากการคาดเดา หากต้องการ 252 ข้อ ต้องนำเข้าชุดข้อมูลต้นฉบับที่ครบถ้วนผ่านหน้า Admin (ผู้ดูแลที่มีสิทธิ์เท่านั้น)

## รันในเครื่อง

1. ใช้ Node.js 22 หรือใหม่กว่า
2. `copy .env.example .env.local` แล้วกรอกค่าทั้ง 8 ตัว
3. `npm install`
4. `npm run lint && npm run build && npm run dev`
5. เปิด `http://localhost:3065/` (ไม่เติม `/jit-review/` ใน Local)

## Firebase

1. Firebase Console > Authentication > Sign-in method > Google > Enable
2. Authorized domains: เพิ่ม `kla30181.github.io` และ `localhost` ตามที่ใช้
3. สร้าง Firestore Database **(default)** แล้ว Deploy `firestore.rules` ผ่าน Firebase CLI หรือ Console
4. เพิ่มเอกสาร `admins/{uid}` ด้วย Firebase Console สำหรับ UID ของผู้ดูแล (เนื้อหาเอกสารเช่น `{ "enabled": true }`) — Rules ไม่อนุญาตให้ผู้ใช้สร้างสิทธิ์ Admin เอง
5. ลงชื่อเข้าใช้ก่อนบันทึกคำตอบ Firestore; Admin เท่านั้นที่บันทึกเกณฑ์ขึ้น Cloud ได้
6. หาก Cloud มี `datasets/jit_criteria` อยู่แล้ว ระบบจะอ่านเกณฑ์จาก Cloud ซึ่งอาจต่างจาก ZIP; ตรวจสอบข้อมูลก่อนทับเกณฑ์

## Apps Script

1. สร้าง Google Sheets สำหรับเก็บสำเนา
2. เปิด Extensions > Apps Script แล้วคัดลอก `google-apps-script/Code.gs`
3. Project Settings > Script Properties เพิ่ม `FIREBASE_API_KEY` (Web API key ของ Firebase Project เดียวกัน) และ `GOOGLE_SHEET_ID` (ID จาก URL ของ Google Sheets)
4. Deploy > New deployment > Web app > Execute as Me > Who has access: Anyone; คัดลอก URL ที่ลงท้าย `/exec`
5. ใส่ URL ใน `VITE_APPS_SCRIPT_WEB_APP_URL` และ URL ของชีตใน `VITE_GOOGLE_SHEET_URL`
6. Apps Script จะตรวจ Firebase ID token ผ่าน Identity Toolkit `accounts:lookup` ก่อนเขียนชีต พร้อม LockService และตรวจ record_key ป้องกันซ้ำ
7. **ข้อจำกัด:** Browser ใช้ `no-cors` จึงอ่านผล Apps Script ไม่ได้ ปุ่มซิงก์แปลว่า *ส่งคำขอ* ไม่ใช่ยืนยันว่าเขียนชีตสำเร็จ ให้ตรวจที่ Apps Script > Executions และ Google Sheets
8. ระบบนี้ไม่เรียก Google Sheets API หรือ Drive API จาก Browser แต่ Apps Script ใช้ SpreadsheetApp ฝั่ง Google

## GitHub Pages

1. GitHub Repository `kla30181/jit-review` > Settings > Pages > Source: GitHub Actions
2. Settings > Secrets and variables > Actions > Variables เพิ่ม `VITE_*` ทั้ง 8 ตัว
3. Push Branch `main` ระบบจะ Build และ Deploy ไป `https://kla30181.github.io/jit-review/`
4. ค่า `VITE_*` ถูกฝังใน JS ฝั่ง Browser ห้ามใส่ Service Account, Private Key หรือรหัสลับ

## หมายเหตุด้านข้อมูลและสิทธิ์

- การพิมพ์/เลือกคำตอบจะบันทึกแบบร่างใน localStorage; เมื่อกดส่งและล็อกอินแล้วจึงบันทึก Firestore
- Google Sheets เป็นสำเนาที่อาจซิงก์ล่าช้าหรือล้มเหลวได้; Firestore เป็นแหล่งข้อมูลหลัก
- ผู้ใช้ทั่วไปอ่าน Submission ของตนเองเท่านั้น; การดูสรุปรวมของผู้ดูแลต้องทำ Query/หน้าจอสำหรับ Admin เพิ่มเติม
- ห้ามอ้างว่าซิงก์ Sheets สำเร็จจนกว่าจะตรวจสอบจากฝั่งเซิร์ฟเวอร์
