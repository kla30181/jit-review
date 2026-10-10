# JIT Review - บันทึกข้อมูลออนไลน์ (Firestore)

## ข้อมูลที่จัดเก็บ
- `datasets/jit_criteria`: เกณฑ์กลาง (Admin เขียน, ผู้เข้าสู่ระบบอ่าน)
- `drafts/{uid}`: ข้อมูลผู้ตอบและคำตอบแบบร่าง (เจ้าของบัญชีเท่านั้น)
- `submissions/{submissionId}`: ผลการส่งแบบสอบถาม (เจ้าของบัญชีอ่าน, Admin อ่าน, แก้ไขไม่ได้)
- `admins/{uid}`: สิทธิ์ผู้ดูแล (ตั้งค่าผ่าน Firebase Console เท่านั้น)

## ขั้นตอนตั้งค่าก่อนใช้งาน
1. เปิด Firebase Console > Authentication > Sign-in method > Google และเพิ่ม Authorized domains สำหรับ `kla30181.github.io`.
2. ตั้งค่า `.env.local` จาก `.env.example` ทั้ง 8 ตัว (อย่า commit `.env.local`).
3. Firebase Console > Firestore Database > Rules: วางเนื้อหาจาก `firestore.rules` แล้ว Publish. **กฎนี้จำเป็นสำหรับ drafts และ submissions**
4. Firebase Console > Firestore Database > Data: สร้าง `admins/{UID}` และกำหนด `active: true` ให้บัญชีผู้ดูแล (สร้างจาก Firebase Console เท่านั้น).
5. Login ด้วยบัญชี Admin จากเว็บไซต์ แล้วกดบันทึกเกณฑ์ขึ้นคลาวด์ครั้งแรกในหน้าจัดการเกณฑ์ เพื่อสร้าง `datasets/jit_criteria`.
6. Login ด้วยบัญชีผู้ใช้ ทดสอบกรอกข้อมูลและเลือกคำตอบ รอข้อความ “บันทึกแบบร่างออนไลน์แล้ว” แล้วเปิดเว็บจากอีกเครื่องด้วยบัญชีเดียวกัน ตรวจสอบว่าข้อมูลตรงกัน.
7. ทดสอบกดส่งแบบสอบถาม แล้วดูเอกสารใน Firestore `submissions`.

## ข้อจำกัดสำคัญ
- `defaultCriteria.ts` ยังเป็นชุดเกณฑ์ตั้งต้นในโค้ด และข้อมูลเกณฑ์มี 96 ข้อย่อย ไม่ใช่ 252 ข้อจากภาพ AI Studio; ต้องมีไฟล์ข้อมูลเกณฑ์ครบเพื่อแสดง 252 ข้อ.
- Google Sheets ผ่าน Apps Script ยังเป็นการส่งคำขอแบบ best-effort; aไม่สามารถรับประกันว่าส่งสำเร็จจากฝั่งหน้าเว็บได้ (no-cors). **Firestore เป็นแหล่งข้อมูลหลัก**.
- ต้อง Publish `firestore.rules` ด้วยตนเอง; การอัป GitHub ไม่ได้ Deploy Firestore Rules.
- ยังไม่ได้ทดสอบกับ Firebase จริงและยังไม่ยืนยันผล build ในสภาพแวดล้อมนี้.
- การทำงานแบบออฟไลน์ไม่ได้รับประกันการบันทึก; รอข้อความยืนยัน Firestore ก่อนปิดหน้า.
