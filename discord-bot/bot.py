import os
import re
import sys
import discord
import aiohttp
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
API_URL = os.getenv("API_URL")
BOT_PASSWORD = os.getenv("BOT_USER_PASSWORD")

# Prevent multiple instances using a lock file
LOCK_FILE = "/tmp/fintrack_bot.lock"

def check_single_instance():
    import fcntl
    lock = open(LOCK_FILE, "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        lock.write(str(os.getpid()))
        lock.flush()
        return lock
    except IOError:
        print("❌ Bot is already running! Exiting.")
        sys.exit(1)

_lock = check_single_instance()

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)
tree = discord.app_commands.CommandTree(client)

# For testing - sync to specific guild only
GUILD_ID = discord.Object(id=1476924814563475640)  # Use your server ID

# Cache token per discord user id
user_tokens: dict[str, str] = {}
# Prevent duplicate processing
processed_messages: dict[str, float] = {}  # message_id -> timestamp

# ─────────────────────────────────────────────
# Keyword maps
# ─────────────────────────────────────────────
INCOME_KEYWORDS = [
    "เงินเดือน", "salary", "รายได้", "ได้รับเงิน", "โบนัส", "ค่าจ้าง",
    "ขายของ", "กำไร", "ดอกเบี้ย", "ปันผล", "freelance", "รับเงิน"
]

CATEGORY_MAP = {
    # Expense
    "Food & Dining":    ["กินข้าว", "กิน", "อาหาร", "เครื่องดื่ม", "กาแฟ", "ข้าว", "ก๋วยเตี๋ยว", "บุฟเฟ่", "สตาร์บัคส์", "food", "dining", "restaurant"],
    "Transportation":   ["เติมน้ำมัน", "น้ำมัน", "ค่าน้ำมัน", "บีทีเอส", "รถไฟฟ้า", "แท็กซี่", "grab", "ค่าเดินทาง", "ค่ารถ", "transportation", "gas", "fuel"],
    "Shopping":         ["ซื้อเสื้อ", "ซื้อกางเกง", "ซื้อรองเท้า", "ช้อป", "lazada", "shopee", "เสื้อผ้า", "shopping", "clothes"],
    "Entertainment":    ["หนัง", "เกม", "คอนเสิร์ต", "ดูหนัง", "netflix", "spotify", "ของเล่น", "entertainment", "movie", "music"],
    "Bills & Utilities":["ค่าไฟ", "ค่าน้ำ", "ค่าเช่า", "อินเทอร์เน็ต", "เฟอร์นิเจอร์", "bills", "utilities", "rent"],
    # Income
    "Salary":           ["เงินเดือน", "salary", "ค่าจ้าง", "โบนัส", "paycheck"],
    "Freelance":        ["freelance", "งาน", "side job", "ฟรีแลนซ์"],
    "Investment":       ["ดอกเบี้ย", "ปันผล", "investment", "dividend", "interest", "หุ้น"],
    "Other Income":     ["รับเงิน", "ขายของ", "กำไร", "other income", "bonus", "ได้รับ"],
    # Default
    "Other Expense":    ["อื่นๆ", "other", "miscellaneous"],
}

CATEGORY_META = {
    "Food & Dining":    ("expense", "🍔", "#FF6B6B"),
    "Transportation":   ("expense", "🚗", "#4ECDC4"),
    "Shopping":         ("expense", "🛍️", "#45B7D1"),
    "Entertainment":    ("expense", "🎮", "#96CEB4"),
    "Bills & Utilities":("expense", "🏠", "#98D8C8"),
    "Salary":           ("income",  "💼", "#52C234"),
    "Freelance":        ("income",  "💻", "#3b82f6"),
    "Investment":       ("income",  "📈", "#8b5cf6"),
    "Other Income":     ("income",  "💰", "#F7DC6F"),
    "Other Expense":    ("expense", "📝", "#95A5A6"),
}


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def parse_transaction(text: str):
    """Return (amount, description) or None if not a transaction message."""
    # Skip if it's a command
    if text in ("ดูยอดเดือนนี้", "ยอดเดือนนี้", "ดูยอด", "ดูรายการล่าสุด", "รายการล่าสุด", "ช่วยเหลือ", "help", "วิธีใช้"):
        return None
        
    match = re.search(r"(\d[\d,]*(?:\.\d+)?)\s*บาท?$", text.strip())
    if not match:
        # also accept number at end without 'บาท'
        match = re.search(r"(\d[\d,]*(?:\.\d+)?)$", text.strip())
    if not match:
        return None
    amount = float(match.group(1).replace(",", ""))
    description = text[: match.start()].strip()
    if not description or amount <= 0:
        return None
    return amount, description


def categorize(description: str):
    desc = description.lower()
    for cat_name, keywords in CATEGORY_MAP.items():
        if any(k.lower() in desc for k in keywords):
            return cat_name
    return "อื่นๆ"


def is_income(description: str):
    return any(k.lower() in description.lower() for k in INCOME_KEYWORDS)


# ─────────────────────────────────────────────
# API calls
# ─────────────────────────────────────────────
async def get_or_create_token(discord_id: str, username: str, display_name: str) -> str | None:
    """Try discord login only - require existing user."""
    if discord_id in user_tokens:
        return user_tokens[discord_id]

    async with aiohttp.ClientSession() as session:
        # Try Discord login first (find existing user by discord_id)
        async with session.post(f"{API_URL}/api/auth/discord-login", json={
            "discord_id": discord_id,
        }) as resp:
            if resp.status == 200:
                data = await resp.json()
                token = data["data"]["token"]
                user_tokens[discord_id] = token
                print(f"🔑 Discord login success for {display_name}")
                return token
            else:
                print(f"❌ No linked account found for {display_name}")

    return None


async def get_or_create_account(token: str) -> int | None:
    headers = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/api/accounts", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                accounts = data.get("data", {}).get("accounts", [])
                if accounts:
                    return accounts[0]["id"]

        # Create default account
        async with session.post(f"{API_URL}/api/accounts", headers=headers, json={
            "name": "กระเป๋าหลัก",
            "type": "cash",
            "balance": 0,
        }) as resp:
            if resp.status == 201:
                data = await resp.json()
                return data["data"]["account"]["id"]
    return None


async def get_or_create_category(token: str, cat_name: str) -> int | None:
    headers = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/api/categories", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                for cat in data.get("data", {}).get("categories", []):
                    if cat["name"] == cat_name:
                        return cat["id"]

        # Create category
        meta = CATEGORY_META.get(cat_name, CATEGORY_META["อื่นๆ"])
        async with session.post(f"{API_URL}/api/categories", headers=headers, json={
            "name": cat_name,
            "type": meta[0],
            "icon": meta[1],
            "color": meta[2],
        }) as resp:
            if resp.status in (201, 409):
                if resp.status == 409:
                    # Already exists from another user — fetch again
                    async with session.get(f"{API_URL}/api/categories", headers=headers) as r2:
                        d2 = await r2.json()
                        for cat in d2.get("data", {}).get("categories", []):
                            if cat["name"] == cat_name:
                                return cat["id"]
                else:
                    data = await resp.json()
                    return data["data"]["category"]["id"]
    return None


async def create_transaction(token: str, account_id: int, category_id: int, amount: float, description: str) -> bool:
    headers = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}/api/transactions", headers=headers, json={
            "accountId": account_id,
            "categoryId": category_id,
            "amount": amount,
            "description": description,
        }) as resp:
            return resp.status == 201


async def get_monthly_summary(token: str) -> dict | None:
    """ยอดรายรับ-รายจ่ายเดือนปัจจุบัน"""
    from datetime import datetime
    now = datetime.now()
    start = datetime(now.year, now.month, 1).isoformat()
    headers = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{API_URL}/api/transactions",
            headers=headers,
            params={"startDate": start, "limit": 100},
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            txs = data.get("data", {}).get("transactions", [])
            income = sum(t["amount"] for t in txs if t["category"]["type"] == "income")
            expense = sum(t["amount"] for t in txs if t["category"]["type"] == "expense")
            return {"income": income, "expense": expense, "net": income - expense, "count": len(txs)}


async def get_recent_transactions(token: str, limit: int = 5) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{API_URL}/api/transactions",
            headers=headers,
            params={"limit": limit},
        ) as resp:
            if resp.status != 200:
                return []
            data = await resp.json()
            return data.get("data", {}).get("transactions", [])


# ─────────────────────────────────────────────
# Discord events
# ─────────────────────────────────────────────
@client.event
async def on_ready():
    print(f"✅ Bot พร้อมใช้งาน: {client.user}")
    try:
        await tree.sync()
        print("✅ Slash commands synced globally!")
    except Exception as e:
        print(f"❌ Error syncing commands: {e}")

@tree.command(name="register", description="เชื่อมบัญชี Discord กับบัญชี FinTrack")
@discord.app_commands.describe(
    username="Username ในระบบ FinTrack",
    password="Password ในระบบ FinTrack"
)
async def register_slash(interaction: discord.Interaction, username: str, password: str):
    await interaction.response.defer()
    
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}/api/auth/link-discord", json={
            "username": username,
            "password": password,
            "discord_id": str(interaction.user.id),
        }) as resp:
            if resp.status == 200:
                data = await resp.json()
                token = data["data"]["token"]
                user_tokens[str(interaction.user.id)] = token
                await interaction.followup.send(
                    f"✅ เชื่อมบัญชีสำเร็จ!\n"
                    f"👤 ชื่อ: {data['data']['user']['name']}\n"
                    f"📝 สามารถบันทึกรายการได้ทันที"
                )
            elif resp.status == 404:
                await interaction.followup.send("❌ ไม่พบ username นี้ในระบบ")
            elif resp.status == 401:
                await interaction.followup.send("❌ Password ไม่ถูกต้อง")
            else:
                await interaction.followup.send("❌ เชื่อมบัญชีไม่สำเร็จ กรุณาลองใหม่")


@client.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    # Prevent duplicate processing with timestamp check
    import time
    message_id = str(message.id)
    current_time = time.time()
    
    # Check if this message was processed recently
    if message_id in processed_messages:
        time_diff = current_time - processed_messages[message_id]
        if time_diff < 5:  # 5 second window
            print(f"⚠️  Skipping duplicate message (age: {time_diff:.1f}s): {message_id}")
            return
        else:
            print(f"🔄 Processing old message again (age: {time_diff:.1f}s): {message_id}")
    
    processed_messages[message_id] = current_time
    
    # Clean old message IDs (older than 1 minute)
    if len(processed_messages) > 100:
        cutoff = current_time - 60
        to_delete = [mid for mid, ts in processed_messages.items() if ts <= cutoff]
        for mid in to_delete:
            del processed_messages[mid]

    content = message.content.strip()
    print(f"📝 Processing message: {content} (ID: {message_id})")

    # ── Commands (ขึ้นต้นด้วยคำ) ─────────────────
    if content in ("ดูยอดเดือนนี้", "ยอดเดือนนี้", "ดูยอด"):
        token = await get_or_create_token(
            str(message.author.id), message.author.name, message.author.display_name
        )
        if not token:
            await message.reply("❌ ไม่สามารถเข้าระบบได้")
            return
        summary = await get_monthly_summary(token)
        if not summary:
            await message.reply("❌ ดึงข้อมูลไม่ได้")
            return
        await message.reply(
            f"📊 **ยอดเดือนนี้**\n"
            f"💰 รายรับ: `{summary['income']:,.2f}` บาท\n"
            f"💸 รายจ่าย: `{summary['expense']:,.2f}` บาท\n"
            f"{'✅' if summary['net'] >= 0 else '⚠️'} คงเหลือ: `{summary['net']:,.2f}` บาท\n"
            f"📝 รายการ: {summary['count']} รายการ"
        )
        return

    if content in ("ดูรายการล่าสุด", "รายการล่าสุด"):
        token = await get_or_create_token(
            str(message.author.id), message.author.name, message.author.display_name
        )
        if not token:
            await message.reply("❌ ไม่สามารถเข้าระบบได้")
            return
        txs = await get_recent_transactions(token, limit=5)
        if not txs:
            await message.reply("ยังไม่มีรายการ")
            return
        lines = ["📋 **5 รายการล่าสุด**"]
        for t in txs:
            emoji = "💰" if t["category"]["type"] == "income" else "💸"
            lines.append(f"{emoji} {t['description']} — `{t['amount']:,.2f}` บาท ({t['category']['name']})")
        await message.reply("\n".join(lines))
        return

    if content in ("ช่วยเหลือ", "help", "วิธีใช้"):
        await message.reply(
            "**📖 วิธีใช้ FinTrack Bot**\n\n"
            "**เชื่อมบัญชี Discord** (ถ้ามีบัญชีในเว็บแล้ว)\n"
            "```\n"
            "/register username password\n"
            "หรือใช้ slash command: /register\n"
            "```\n"
            "**บันทึกรายการ** — พิมพ์ข้อความ + จำนวนเงิน\n"
            "```\n"
            "กินข้าว 120\n"
            "เงินเดือน 30000\n"
            "เติมน้ำมัน 1500\n"
            "ซื้อเสื้อ 890\n"
            "```\n"
            "**ดูข้อมูล**\n"
            "```\n"
            "ดูยอดเดือนนี้\n"
            "ดูรายการล่าสุด\n"
            "```"
        )
        return

    # ── Natural language transaction ──────────────
    if content.startswith("/"):
        return  # ไม่ตอบ command ที่ไม่รู้จัก

    parsed = parse_transaction(content)
    if parsed is None:
        return  # ไม่ใช่ transaction — ไม่ตอบ

    amount, description = parsed
    token = await get_or_create_token(
        str(message.author.id), message.author.name, message.author.display_name
    )
    if not token:
        await message.reply(
            "❌ ยังไม่ได้เชื่อมบัญชี\n"
            "📝 ใช้คำสั่ง: `เชื่อมบัญชี username password`\n"
            "🌐 หรือลงทะเบียนที่เว็บก่อน: http://localhost:3000/register"
        )
        return

    account_id = await get_or_create_account(token)
    if not account_id:
        await message.reply("❌ ไม่พบบัญชี กรุณาลองใหม่")
        return

    cat_name = categorize(description)
    category_id = await get_or_create_category(token, cat_name)
    if not category_id:
        await message.reply("❌ ไม่พบหมวดหมู่ กรุณาลองใหม่")
        return

    success = await create_transaction(token, account_id, category_id, amount, description)
    if success:
        tx_type = "รายรับ" if is_income(description) else "รายจ่าย"
        emoji = "💰" if is_income(description) else "💸"
        await message.reply(
            f"{emoji} บันทึก{tx_type}แล้ว!\n"
            f"📝 รายการ: **{description}**\n"
            f"💵 จำนวน: **{amount:,.2f} บาท**\n"
            f"🏷️ หมวดหมู่: {cat_name}"
        )   
    else:
        await message.reply("❌ บันทึกรายการไม่สำเร็จ กรุณาลองใหม่")


client.run(DISCORD_TOKEN)
