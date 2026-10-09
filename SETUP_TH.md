# ติดตั้ง JIT แบบ Hybrid

1. Firebase Console: เปิด Authentication > Google, เพิ่ม Authorized domain `kla30181.github.io` และสร้าง Firestore (default database).
2. Firestore > Rules: วาง `firestore.rules` แล้ว Publish.
3. สร้าง `jit_admins/{Firebase UID ของผู้ดูแล}` ใน Firestore Console เพื่อให้ผู้ดูแลแก้เกณฑ์ได้ (สร้างโดยผู้ดูแล Firebase Console เท่านั้น).
4. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ Firebase Web config ทั้ง 6 ค่า.
5. สร้าง Google Sheet > Extensions > Apps Script วาง `google-apps-script/Code.gs` แล้ว Deploy Web App. ควรจำกัดผู้ที่เข้าถึง endpoint และทดสอบความปลอดภัยก่อนใช้งานจริง: URL เว็บแอปที่เปิด Anyone ไม่ใช่ระบบยืนยันตัวตนที่ปลอดภัย.
6. ตั้ง `VITE_APPS_SCRIPT_WEB_APP_URL` และ `VITE_GOOGLE_SHEET_URL`.
7. `npm install`, `npm run dev`, `npm run build`.
8. GitHub > Settings > Secrets and variables > Actions เพิ่มตัวแปร VITE ทั้ง 8 ตัว แล้ว push ไป main; Settings > Pages เลือก GitHub Actions.

**สำคัญ**: Google Apps Script ในเบราว์เซอร์ใช้ `no-cors` จึงยืนยันไม่ได้ว่า Sheet เขียนสำเร็จจริง แม้การส่งคำขอไม่เกิด network error; Firestore เป็นแหล่งข้อมูลหลัก. ห้ามใช้ข้อมูลส่วนบุคคลจริงก่อนตรวจสอบสิทธิ์ของ Apps Script และ Firestore. Firestore rules จำกัดการอ่านคำตอบเฉพาะเจ้าของ/ผู้ดูแล แต่หน้า Summary แบบรวมทุกคนต้องพัฒนา query ฝั่งผู้ดูแลเพิ่มเติม.
