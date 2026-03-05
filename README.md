# FinTrack 🏦

ระบบติดตามการเงินส่วนบุคคล พร้อม Web Dashboard และ Discord Bot — บันทึกรายรับ-รายจ่ายได้ทันทีด้วยภาษาพูดธรรมดา

---

## ✨ ฟีเจอร์

- 💬 **Discord Bot** — บันทึกรายการแค่พิมพ์ข้อความ เช่น `กินข้าว 120` หรือ `เงินเดือน 30000`
- 🏷️ **Auto-Categorize** — จำแนกหมวดหมู่อัตโนมัติ (Food, Transport, Shopping, Salary ฯลฯ)
- 📊 **Web Dashboard** — ดูภาพรวมรายรับ-รายจ่าย, บัญชี, งบประมาณ และเป้าหมายการเงิน
- � **Discord Account Linking** — เชื่อม Discord ID กับบัญชีบนเว็บ ข้อมูลซิงค์กันทันที
- 🎯 **Budget & Goals** — ตั้งงบรายเดือนตามหมวดหมู่ และเป้าหมายเก็บเงินพร้อม deadline
- � **JWT Authentication** — ระบบ login/register ปลอดภัย

---

## �️ โครงสร้างโปรเจค

```
FinTrack/
├── backend/          # Node.js + Express + TypeScript API
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── routes/   # auth, accounts, transactions, categories, budgets, goals
│       ├── middleware/
│       └── lib/
├── frontend/         # Next.js 15 + TypeScript Web Dashboard
│   ├── app/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── categories/
│   │   ├── goals/
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   ├── contexts/
│   └── lib/
└── discord-bot/      # Python Discord Bot
    ├── bot.py
    └── requirements.txt
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Discord Bot | Python 3, discord.py 2.3 |
| Auth | JWT (jsonwebtoken), bcryptjs |

---

## 📋 ความต้องการระบบ

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** 14+
- **Discord Bot Token** (จาก Discord Developer Portal)

---

## 🚀 การติดตั้ง

### 1. Clone Repository

```bash
git clone https://github.com/tanespol916/FinTrack.git
cd FinTrack
```

### 2. ตั้งค่า Backend

```bash
cd backend
npm install
```

สร้างไฟล์ `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/fintrack"
JWT_SECRET="your_jwt_secret_key"
PORT=4000
```

รัน database migration และ seed:

```bash
npx prisma migrate dev
npm run seed        # (optional) ใส่ข้อมูลตัวอย่าง
npm run dev         # เริ่ม backend ที่ http://localhost:4000
```

### 3. ตั้งค่า Frontend

```bash
cd frontend
npm install
```

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

```bash
npm run dev         # เริ่ม frontend ที่ http://localhost:3000
```

### 4. ตั้งค่า Discord Bot

```bash
cd discord-bot
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

สร้างไฟล์ `.env`:

```env
DISCORD_BOT_TOKEN="your_discord_bot_token"
API_URL="http://localhost:3001"
BOT_USER_PASSWORD="your_bot_user_password"
```

```bash
python bot.py
```

> **⚠️ ข้อควรระวัง:**
> - ต้องเปิด **Message Content Intent** ใน [Discord Developer Portal](https://discord.com/developers/applications)
> - ต้องรัน backend ก่อนเสมอ

---

## 🤖 Discord Bot — วิธีใช้งาน

### เชื่อมบัญชี (ครั้งแรก)

ลงทะเบียนบัญชีที่เว็บก่อน แล้วใช้ slash command:

```
/register username:<username> password:<password>
```

### บันทึกรายการ

พิมพ์ข้อความธรรมดาในรูป `<คำอธิบาย> <จำนวนเงิน>`:

```
กินข้าว 120
เงินเดือน 30000
เติมน้ำมัน 1500
ซื้อเสื้อ 890
Netflix 379
ค่าเช่า 8000
```

Bot จะจำแนกหมวดหมู่ให้อัตโนมัติและตอบกลับทันที

### ดูข้อมูล

```
ดูยอดเดือนนี้     → สรุปรายรับ-รายจ่ายเดือนปัจจุบัน + ยอดคงเหลือ
ดูรายการล่าสุด   → แสดง 5 รายการล่าสุด
ช่วยเหลือ         → แสดงคำสั่งทั้งหมด
```

### หมวดหมู่ที่รองรับ

| หมวดหมู่ | ประเภท | ตัวอย่างคีย์เวิร์ด |
|---|---|---|
| Food & Dining 🍔 | รายจ่าย | กินข้าว, อาหาร, กาแฟ, restaurant |
| Transportation 🚗 | รายจ่าย | น้ำมัน, รถไฟฟ้า, grab, taxi |
| Shopping 🛍️ | รายจ่าย | ซื้อเสื้อ, shopee, lazada |
| Entertainment 🎮 | รายจ่าย | หนัง, เกม, netflix, spotify |
| Bills & Utilities 🏠 | รายจ่าย | ค่าไฟ, ค่าน้ำ, ค่าเช่า |
| Salary 💼 | รายรับ | เงินเดือน, salary, โบนัส |
| Freelance 💻 | รายรับ | freelance, ฟรีแลนซ์ |
| Investment 📈 | รายรับ | ดอกเบี้ย, ปันผล, หุ้น |
| Other Income 💰 | รายรับ | รับเงิน, ขายของ, กำไร |

---

## 🌐 Web Dashboard

เข้าที่ `http://localhost:3000` หลังรัน frontend

| หน้า | คำอธิบาย |
|---|---|
| `/dashboard` | ภาพรวมการเงิน, กราฟรายรับ-รายจ่าย |
| `/transactions` | ประวัติรายการทั้งหมด, เพิ่ม/แก้ไข/ลบ |
| `/accounts` | จัดการบัญชีและยอดเงิน |
| `/budgets` | ตั้งงบรายเดือนตามหมวดหมู่ |
| `/categories` | จัดการหมวดหมู่ |
| `/goals` | เป้าหมายการเงิน พร้อม deadline |

---

## 📊 Database Schema

```
User          — id, discord_id, username, password, name
Account       — id, userId, name, type, balance
Category      — id, name, type, icon, color
Transaction   — id, accountId, categoryId, userId, amount, description, date
Budget        — id, userId, categoryId, amount, month, year
Goal          — id, userId, title, targetAmount, currentAmount, deadline
```

---

## 🔌 API Endpoints

Backend รันที่ `http://localhost:3001` พร้อม Swagger UI ที่ `/api-docs`

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/link-discord` | เชื่อม Discord ID |
| POST | `/api/auth/discord-login` | Login ด้วย Discord ID |
| GET/POST | `/api/accounts` | จัดการบัญชี |
| GET/POST | `/api/transactions` | จัดการรายการ |
| GET/POST | `/api/categories` | จัดการหมวดหมู่ |
| GET/POST | `/api/budgets` | จัดการงบประมาณ |
| GET/POST | `/api/goals` | จัดการเป้าหมาย |

---

## 🔧 Discord Bot Setup

### สร้าง Discord Application

1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. สร้าง **New Application** → ไปที่แท็บ **Bot**
3. คลิก **Reset Token** แล้ว copy token
4. เปิด **Privileged Gateway Intents**:
   - ✅ Message Content Intent
5. ไปที่ **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`
6. Copy URL แล้ว invite bot เข้า server

---

## 🧪 Running Tests

```bash
cd backend
npm test              # รัน unit tests ทั้งหมด
npm run test:watch    # watch mode
```

---

## 📦 Scripts สรุป

| Directory | Command | คำอธิบาย |
|---|---|---|
| `backend/` | `npm run dev` | รัน backend (nodemon) |
| `backend/` | `npm run build` | Build TypeScript |
| `backend/` | `npm run seed` | Seed ข้อมูลตัวอย่าง |
| `backend/` | `npm test` | รัน tests |
| `frontend/` | `npm run dev` | รัน frontend |
| `frontend/` | `npm run build` | Build สำหรับ production |
| `discord-bot/` | `python bot.py` | รัน Discord Bot |

---

**⭐ ถ้าชอบโปรเจคนี้ อย่าลืมให้ Star!** 🌟
