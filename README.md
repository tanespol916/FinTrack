# FinTrack 🏦

AI-Powered Finance Tracker พร้อม Discord Bot - ระบบติดตามรายรับรายจ่ายสมัยใหม่ที่ใช้งานง่ายที่สุด

## 🎯 ภาพรวมโปรเจค

FinTrack เป็นแอปพลิเคชันติดตามการเงินส่วนบุคคลที่ผสมผสาน AI และ Discord Bot เข้าด้วยกัน ช่วยให้คุณสามารถบันทึกรายรับ-รายจ่ายได้อย่างง่ายดายเพียงแค่พิมพ์ข้อความธรรมดาใน Discord

### ✨ ฟีเจอร์หลัก

- 🤖 **AI Natural Language Processing** - บันทึกรายการด้วยภาษาพูดธรรมดา
- 💬 **Discord Bot Integration** - ใช้งานผ่าน Discord ที่คุ้นเคย
- 📊 **Smart Dashboard** - ติดตามการเงินแบบ real-time
- 📈 **AI Analytics** - วิเคราะห์และแนะนำการเงินอัตโนมัติ
- 🎯 **Budget Management** - ตั้งงบประมาณและเป้าหมายการเงิน
- 🔔 **Smart Notifications** - แจ้งเตือนเมื่อใกล้เกินงบ
- 📱 **Multi-platform** - ใช้ได้ทั้ง Discord และ Web Dashboard

---

## 🚀 วิธีใช้งาน

### Discord Bot Commands

#### บันทึกรายการ
```
/กินข้าว 120           → บันทึกรายจ่ายอาหาร 120 บาท
/เงินเดือน 30000       → บันทึกรายรับเงินเดือน 30000 บาท
/เติมน้ำมัน 1500      → บันทึกรายจ่ายค่าน้ำมัน 1500 บาท
/ซื้อเสื้อ 890         → บันทึกรายจ่ายช้อปปิ้ง 890 บาท
```

#### ดูข้อมูล
```
/ดูยอดเดือนนี้        → แสดงสรุปรายรับ-รายจ่ายเดือนปัจจุบัน
/ดูงบอาหาร            → แสดงยอดใช้จ่ายหมวดอาหารทั้งเดือน
/ดูรายการล่าสุด      → แสดงรายการ 10 อันล่าสุด
```

#### AI Features
```
/วิเคราะห์เดือนนี้     → AI วิเคราะห์การเงินเดือนนี้
/แนะนำการประหยัด      → AI แนะนำวิธีลดรายจ่าย
/ทำนายเดือนหน้า        → AI ทำนายแนวโน้มการเงิน
```

### Web Dashboard

- **Dashboard** - ภาพรวมการเงินและกราฟแนวโน้ม
- **Transactions** - จัดการรายการและประวัติ
- **Reports** - รายงานรายเดือนพร้อม export
- **Budgets** - ตั้งงบประมาณและเป้าหมาย
- **Settings** - จัดการบัญชีและหมวดหมู่

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React Framework พร้อม App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Chart.js** - Data Visualization

### Backend
- **Node.js + Express** - API Server
- **TypeScript** - Type Safety
- **PostgreSQL** - Database
- **Prisma** - ORM

### AI & Integration
- **Gemini API** - Natural Language Processing
- **Discord.js** - Discord Bot
- **JWT** - Authentication

---

## 📋 ความต้องการระบบ

- Node.js 18+
- PostgreSQL 14+
- Discord Bot Token
- Gemini API Key (optional)

---

## 🚀 Installation

### 1. Clone Repository
```bash
git clone https://github.com/tanespol916/FinTrack.git
cd FinTrack
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# แก้ไข .env ด้วยค่าที่เหมาะสม
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup
```bash
# สร้าง PostgreSQL database
createdb fintrack

# Run migrations
npx prisma migrate dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fintrack"
DISCORD_BOT_TOKEN="your_discord_bot_token"
OPENAI_API_KEY="your_openai_api_key"
JWT_SECRET="your_jwt_secret"
PORT=3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 📊 Database Schema

```sql
Users (id, discord_id, username, email)
Accounts (id, user_id, name, type, balance)
Categories (id, name, type, icon, color)
Transactions (id, account_id, category_id, amount, description, date)
Budgets (id, user_id, category_id, amount, month, year)
Goals (id, user_id, title, target_amount, current_amount)
```

---

## 🎯 Development Roadmap

### Phase 1: Core Features ✅
- [x] Basic Discord Bot
- [x] Transaction Recording
- [x] Web Dashboard
- [x] Database Integration

### Phase 2: AI Features 🚧
- [ ] Natural Language Processing
- [ ] Smart Categorization
- [ ] AI Analytics
- [ ] Predictive Insights

### Phase 3: Advanced Features 📋
- [ ] Multi-currency Support
- [ ] Recurring Transactions
- [ ] Advanced Reports
- [ ] Mobile App

---

## 🤖 Discord Bot Setup

### 1. สร้าง Discord Application
1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. สร้าง New Application
3. สร้าง Bot และได้ Token
4. เปิด Privileged Gateway Intents

### 2. Invite Bot ไป Server
1. ไปที่ OAuth2 -> URL Generator
2. เลือก scopes: `bot`, `applications.commands`
3. เลือก permissions: `Send Messages`, `Read Message History`
4. Copy URL และ invite bot

---

## 📱 Usage Examples

### Daily Usage
```
ตื่นนอน → /ดูวันนี้
กินข้าวเที่ยง → /กินข้าว 120
เติมน้ำมัน → /เติมน้ำมัน 1500
กลับบ้าน → /ดูยอดวันนี้
```

### Monthly Planning
```
ต้นเดือน → Web Dashboard: ตั้งงบ
กลางเดือน → /ดูงบ (ตรวจสอบความคืบหน้า)
สิ้นเดือน → /วิเคราะห์เดือนนี้
```

---


## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord Bot Framework
- [OpenAI](https://openai.com/) - AI API
- [Next.js](https://nextjs.org/) - React Framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework

---


**⭐ ถ้าชอบโปรเจคนี้ อย่าลืมให้ Star!** 🌟
