# ตั้งค่าผู้ดูแล JIT Review ออนไลน์

1. เปิด Firebase Console → Authentication → Sign-in method → เปิด Google
2. Authentication → Settings → Authorized domains เพิ่ม `kla30181.github.io`
3. เปิด Firestore Database และนำกฎจาก `firestore.rules` ไป Publish
4. เข้าสู่ระบบด้วย Google บนเว็บไซต์ 1 ครั้ง แล้วคัดลอก **UID** จาก Firebase Authentication → Users
5. ใน Firestore สร้าง collection `admins` → document ID = UID ของผู้ดูแล → field `active` (boolean) = `true`
6. Refresh เว็บไซต์และลงชื่อเข้าใช้อีกครั้ง จะเห็นแท็บ **จัดการเกณฑ์ (Admin)**
7. ครั้งแรกให้ผู้ดูแลกดปุ่มซิงก์/บันทึกเกณฑ์ขึ้นคลาวด์เพื่อสร้าง `datasets/jit_criteria` จากข้อมูลตั้งต้น
8. หลังจากนั้นเพิ่ม แก้ไข ลบ และจัดลำดับเกณฑ์ผ่านหน้าเว็บได้ ข้อมูลจะบันทึกลง Firestore และผู้ใช้เครื่องอื่นจะเห็นการเปลี่ยนแปลง

**ข้อควรระวัง:** การกดลบในหน้าปัจจุบันเป็นการลบจากชุดเกณฑ์จริง ไม่ใช่ soft delete; ควรสำรองข้อมูลก่อนแก้ไข และอย่ากดคืนค่าเริ่มต้นหากมีการแก้ไขแล้ว

**ข้อจำกัด:** ZIP นี้มีเกณฑ์ตั้งต้น 96 ข้อย่อย ไม่ใช่ 252 ข้อตามภาพ Google AI Studio; ไม่ได้แต่งข้อมูลเกณฑ์เพิ่มเติม

**การ Deploy:** GitHub Pages ไม่ได้เป็นฐานข้อมูล ข้อมูลแก้ไขอยู่ใน Firestore จึงไม่ต้อง git push ทุกครั้ง แต่การแก้โค้ดต้อง Deploy ใหม่
