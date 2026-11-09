/* ============================================================================================
   CONTENT — the only file you edit to change your works, your journey and your contact links.
   (Everything else — layout, paper-cut look, 3D character — stays untouched.)

   • Add a work  : copy one block inside `projects`, change the texts. The card, the popup and the number appear by themselves.
   • Add a stop  : copy one block inside `journey`. `link.project` is the `id` of a project (optional).
   • Tools       : { label: "PHP", slug: "php" }  -> logo from simpleicons.org (use the slug found there)
                   { label: "AI API", svg: "ai" } -> built-in drawings: "ai", "ml", "rest"
   • Demo        : `demo` = path or URL shown in the popup iframe (the page must allow being embedded), or null for details only.
   • more        : the fold-out "รายละเอียดโปรเจค" in the popup — { summary, role?, steps: [..], note?, gallery: [{ src, cap, tall? }] }
                   (all optional; `feats`, `tools` and `video` are shown inside it too)
   • fx: "trash" | "food" | "robot" : little paper-cut pieces that decorate the top of the card and jump on hover. Leave it out for a normal card.
   Keep the quotes and commas as they are. Save, refresh the page.
   ============================================================================================ */
window.CONTENT = {

  settings: { perPage: 6 },                      // projects.html: how many cards per page (the pager appears when there are more)

  projects: [
    {
      id: "binbuddy", fx: "trash",
      card: { ctx: "โครงงานจบการศึกษา", title: "BinBuddy", color: "#bfeadd", hint: "ดูเดโม ▶", label: "BinBuddy — เปิดเดโม",
              text: "ให้ AI จำแนกประเภทขยะจากรูป พร้อมบอกศูนย์จัดการขยะที่ใกล้ที่สุด และหลังบ้านเทรนโมเดลเอง" },
      title: "BinBuddy — ระบบจำแนกขยะอัจฉริยะ", ctx: "โครงงานจบการศึกษา · AI Waste Classification",
      desc: "เว็บแอปที่ให้ AI ช่วยจำแนกประเภทขยะจากรูปภาพ พร้อมแนะนำศูนย์จัดการขยะที่ใกล้ที่สุด และมีหลังบ้านให้แอดมินเทรนโมเดลต่อยอดได้เอง",
      feats: [
        "เลือกรูปภาพเพื่อจำแนกขยะ แล้วดูผลวิเคราะห์จากโมเดล AI",
        "แสดงศูนย์จัดการขยะที่ใกล้ที่สุด พร้อมเส้นทาง",
        "แอดมินเทรนโมเดลต่อยอด (V4 · ความแม่นยำ 74.72%) และเลือกโมเดลที่ใช้ในระบบ",
        "แจ้งเตือนผ่าน LINE เมื่อเทรนสำเร็จ"
      ],
      tools: [
        { label: "PHP", slug: "php" }, { label: "Python", slug: "python" }, { label: "MySQL", slug: "mysql" },
        { label: "Machine Learning", svg: "ml" }, { label: "Map API", slug: "openstreetmap" }, { label: "LINE API", slug: "line" }, { label: "JavaScript", slug: "javascript" }
      ],
      demo: "demo/binbuddy/waste-classification.html", url: "binbuddy / สแกนขยะ",
      repo: "https://github.com/thanasinchurachet/project",
      more: {
        summary: "หลายคนไม่แน่ใจว่าขยะชิ้นนี้ต้องทิ้งถังไหน BinBuddy ให้อัปโหลดรูปขยะ แล้ว AI บอกว่าเป็นขยะประเภทอะไร ควรจัดการอย่างไร และมีศูนย์รับขยะที่ไหนใกล้ตัว",
        steps: [
          "ผู้ใช้อัปโหลดรูปขยะ 1 ภาพ",
          "โมเดล Machine Learning (Python) ทำนายประเภทขยะ",
          "แสดงวิธีจัดการขยะประเภทนั้นทีละขั้น",
          "ค้นหาศูนย์จัดการขยะในรัศมีที่เลือก พร้อมเส้นทางบนแผนที่",
          "แอดมินเทรนโมเดลรุ่นใหม่ เลือกรุ่นที่ใช้งานจริง และได้แจ้งเตือนทาง LINE เมื่อเทรนเสร็จ"
        ],
        gallery: [
          { src: "assets/shots/bb_home.webp", cap: "หน้าแรก" },
          { src: "assets/shots/bb_scan.webp", cap: "อัปโหลดรูปให้ AI จำแนกขยะ" },
          { src: "assets/shots/bb_info.webp", cap: "วิธีจัดการขยะแต่ละประเภท" },
          { src: "assets/shots/bb_loc.webp", cap: "ค้นหาศูนย์จัดการขยะใกล้ตัว" }
        ]
      }
    },
    {
      id: "foodvote", fx: "food",
      card: { ctx: "ฝึกงาน · Logicton", title: "Food Vote System", color: "#f9df97", hint: "ดูเดโม ▶", label: "Food Vote System — ดูรายละเอียด",
              text: "โหวตเมนูอาหารพร้อมคำนวณราคา มี LINE Bot แจ้งเตือน และ AI ผ่าน n8n ช่วยแยกรายการ" },
      title: "Food Vote System — ระบบโหวตอาหาร", ctx: "โครงงานฝึกงาน · Logicton Co., LTD",
      desc: "เว็บแอปให้ทีมโหวตเมนูอาหารกลางวัน คำนวณราคาอัตโนมัติ มี LINE Bot แจ้งเตือนเข้ากลุ่ม และให้ AI ผ่าน n8n ช่วยแยกรายการอาหาร",
      feats: [
        "ผู้ใช้เลือกรายการอาหาร พร้อมคำนวณราคาให้เห็นทันที",
        "LINE Bot ส่งแจ้งเตือนและลิงก์เข้ากลุ่มอัตโนมัติ (ลองเล่นฝั่งแอดมิน/สมาชิกได้ในเดโม)",
        "แอดมินพิมพ์รายการอาหาร ให้ AI วิเคราะห์ผ่าน n8n",
        "ดูสรุปผลโหวต ค่าใช้จ่ายรวม ตามวันที่",
        "ใช้งานจริงในทีมของบริษัทตั้งแต่ช่วงฝึกงาน (2568) มาจนถึงทุกวันนี้"
      ],
      tools: [
        { label: "n8n", slug: "n8n" }, { label: "LINE API", slug: "line" }, { label: "AI API", svg: "ai" },
        { label: "PHP", slug: "php" }, { label: "MySQL", slug: "mysql" }, { label: "JavaScript", slug: "javascript" }
      ],
      demo: "demo/foodvote/story.html", url: "food-vote × LINE / เดโมจำลอง",
      more: {
        summary: "ช่วยให้ทีมสั่งอาหารกลางวันร่วมกันง่ายขึ้น แอดมินแค่พิมพ์รายการอาหารของวันนั้น AI จะแยกเป็นเมนูพร้อมราคา LINE Bot ส่งลิงก์ให้ทุกคนโหวต แล้วระบบสรุปยอดให้เอง",
        role: "พัฒนาระบบโหวตอาหาร เชื่อม LINE Bot และ n8n ช่วงเตรียมฝึกงาน 2 เดือนที่ Logicton",
        steps: [
          "แอดมินพิมพ์รายการอาหารของวันนั้นในแชท LINE",
          "n8n ส่งข้อความให้ AI แยกเป็นชื่อเมนูและราคา",
          "LINE Bot แจ้งเตือนพร้อมลิงก์โหวตเข้ากลุ่ม",
          "สมาชิกเปิดลิงก์ใน LINE เลือกเมนู ระบบคำนวณราคาให้ทันที",
          "ดูผลโหวต ยอดรวม และคัดลอกสรุปไปสั่งอาหาร"
        ],
        note: "ภาพทั้งหมดมาจากเดโมจำลอง รายชื่อคนและเมนูเป็นข้อมูลสมมติ",
        gallery: [
          { src: "assets/shots/fv_story.webp", cap: "เดโมแบบสไลด์: แอดมินพิมพ์เมนู ส่งให้ AI" },
          { src: "assets/shots/fv_res.webp", cap: "หน้าผลโหวตแยกตามคน", tall: true },
          { src: "assets/shots/fv_sum.webp", cap: "สรุปยอดพร้อมปุ่มคัดลอก", tall: true }
        ]
      }
    },
    {
      id: "facerecog", fx: "robot",
      card: { ctx: "ฝึกงาน · depa", title: "Face Recognition", color: "#f8c9c4", hint: "ดูเดโม ▶", label: "Face Recognition — เปิดเดโม",
              text: "จดจำใบหน้า แสดง Event และสั่งหุ่นยนต์แบบ Realtime พร้อมหลังบ้านตั้งค่าระบบ" },
      title: "Face Recognition — ระบบตรวจจับใบหน้า & ควบคุมหุ่นยนต์", ctx: "โครงงานฝึกงาน · depa",
      desc: "แอปจดจำใบหน้าและแสดงอีเวนต์ที่กำลังจะมาถึง พร้อมสั่งงานหุ่นยนต์แบบ Realtime (สั่งเดิน สั่งหันหน้า) และหลังบ้านสำหรับตั้งค่าระบบ",
      feats: [
        "ตรวจจับและจดจำใบหน้า แล้ว AI วิเคราะห์",
        "แสดง Event ที่กำลังจะมาถึง",
        "สั่งเดินไปยังจุดต่างๆ และสั่งหันหน้าหุ่นยนต์แบบ Realtime",
        "หลังบ้านตั้งค่าคำทักทาย Schedule และเพิ่มใบหน้าใหม่"
      ],
      tools: [
        { label: "Python", slug: "python" }, { label: "FastAPI", slug: "fastapi" }, { label: "Kotlin", slug: "kotlin" },
        { label: "Android", slug: "android" }, { label: "REST API", svg: "rest" }
      ],
      demo: "demo/robot/index.html", url: "robot-control / เดโมจำลอง",
      video: { src: "demo/robot/real.mp4", poster: "demo/robot/real-poster.jpg", label: "ดูหุ่นตัวจริง", note: "คลิป 14 วินาที ตอนฝึกงาน",
               caption: "ของจริงตอนฝึกงานที่ depa: สั่งงานจากหน้าเว็บบนแล็ปท็อป แล้วหุ่นยนต์เดินไปยังจุดหมายเอง" },
      more: {
        summary: "หุ่นยนต์ต้อนรับในสำนักงาน เมื่อมีคนมายืนหน้าหุ่น ระบบจดจำว่าเป็นใคร ทักทาย แล้วแสดงนัดหมายที่กำลังจะถึง ส่วนเจ้าหน้าที่สั่งให้หุ่นเดินไปจุดต่างๆ ผ่านหน้าเว็บได้แบบ Realtime",
        role: "Robotics Software Developer ฝึกงาน 4 เดือนที่ depa",
        steps: [
          "แอปบนหุ่นยนต์ (Kotlin / Android) ถ่ายภาพใบหน้า แล้วส่งไปที่ POST /check_face",
          "เซิร์ฟเวอร์ FastAPI ปรับภาพให้ชัด: แก้แสง ลดนอยส์ CLAHE เพิ่มความคม",
          "RetinaFace หาตำแหน่งใบหน้า แล้ว Facenet512 แปลงเป็นตัวเลข 512 ค่า",
          "เทียบกับใบหน้าในระบบด้วย cosine distance ถ้าต่ำกว่า 0.35 ถือว่าเป็นคนเดียวกัน",
          "ส่งชื่อและนัดหมายกลับไปให้หุ่นทักทาย",
          "เจ้าหน้าที่สั่งเดิน สั่งหันหน้า หรือสั่งกลับแท่นชาร์จได้จากหน้าเว็บ"
        ],
        note: "ภาพหน้าจอจากงานจริงตอนฝึกงาน · ส่วนเดโมด้านบนเป็นแบบจำลอง คนและข้อมูลในฉากเป็นของสมมติ",
        gallery: [
          { src: "assets/shots/rb_scan.webp", cap: "กล้องหุ่นจับใบหน้าแล้วส่งไปตรวจ" },
          { src: "assets/shots/rb_capture.webp", cap: "ถ่ายภาพลงทะเบียนพนักงานใหม่" },
          { src: "assets/shots/rb_confirm.webp", cap: "ยืนยันข้อมูลก่อนบันทึก" },
          { src: "assets/shots/rb_web.webp", cap: "หน้าเว็บสั่งหุ่นเดินไปห้องต่างๆ" },
          { src: "assets/shots/rb_tts.webp", cap: "ตั้งค่าคำทักทายที่หุ่นพูด" }
        ]
      }
    }
  ],

  journey: [
    {
      when: "24 มี.ค. – 24 พ.ค. 2568", title: "Full-stack Web Developer (เตรียมฝึกงาน)",
      text: "Logicton Co., LTD · 2 เดือน — พัฒนาระบบโหวตอาหาร เชื่อม LINE Bot และ n8n",
      stamp: { text: "2025" },
      link: { project: "foodvote", text: "ดูผลงาน: ระบบโหวตอาหาร" }
    },
    {
      when: "ฝึกประสบการณ์ · 4 เดือน", title: "Robotics Software Developer (ฝึกงาน)",
      text: "สำนักงานพัฒนาอุตสาหกรรมดิจิทัล (depa) — ระบบจดจำใบหน้าและควบคุมหุ่นยนต์ Realtime",
      stamp: { text: "2026", color: "var(--green)" },
      link: { project: "facerecog", text: "ดูผลงาน: ระบบจดจำใบหน้า" }
    },
    {
      when: "2022 – 2026", title: "วิทยาศาสตรบัณฑิต (เกียรตินิยมอันดับ 2)",
      gpa: { value: "3.30", label: ["เกรดเฉลี่ยสะสม", "GPA"] },
      text: "สาขาวิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (แขนงเทคโนโลยีสารสนเทศ) · คณะเทคโนโลยีดิจิทัล มหาวิทยาลัยราชภัฏเชียงราย",
      stamp: { text: "EDU", color: "#e0a93a" },
      link: { project: "binbuddy", text: "ดูโครงงานจบ: BinBuddy ระบบจำแนกขยะ" }
    }
  ],

  contact: {
    eyebrow: "let’s talk",
    title: "สนใจติดต่อได้ช่องทางนี้เลย",
    text: "ออยากคุยเรื่องงานหรือเริ่องส่วนตัวทักมาคุยกันได้เลย",
    email: "thanasinchurachet@gmail.com",
    phone: { text: "063-963-2000", href: "+66639632000" },
    social: [                                    // type: "facebook" | "instagram" | anything else (gets a link icon)
      { type: "facebook", label: "Facebook", url: "https://web.facebook.com/Thscht/" },
      { type: "instagram", label: "Instagram", url: "https://www.instagram.com/thscht/" }
    ]
  }
};
