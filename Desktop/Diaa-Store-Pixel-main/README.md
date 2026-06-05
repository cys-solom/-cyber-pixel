# Cyber Key — Gemini Pro Pixel Verify ⚡

> Automated Gemini Advanced subscription activation platform for resellers.

[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Private-red)](#)

---

## 🚀 Features

- 🔑 **CDK-based merchant system** — Each merchant gets a unique CDK code with points balance
- 🔗 **Extract Link** — Extracts Gemini activation link automatically
- ⚡ **Full Activation** — Complete Gemini subscription activation with card binding
- 💳 **Binance Pay deposits** — Merchants top up points via Binance Pay
- 📊 **Admin Panel** — Full control: CDKs, orders, source keys, settings
- 📦 **Out of Stock** toggle — Stop all activations instantly from sidebar
- ⚡ **Full Activation** toggle — Enable/disable full activation from sidebar
- 🔄 **Real-time polling** — Orders and balance update every 10 seconds
- 📋 **Bulk Import** — Process multiple accounts at once
- 🌐 **Multi-language** — AR / EN support
- 📢 **Announcement bar** — Scrolling and fixed announcements
- 🔁 **Auto-refund** — Points refunded automatically on failed orders

---

## 🛠️ Setup

### 1. Clone & Install

```bash
git clone https://github.com/cys-solom/-cyber-pixel.git
cd -cyber-pixel
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_random_jwt_secret_min_32_chars

# Binance Pay (optional - for deposits)
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
BINANCE_MERCHANT_UID=your_binance_uid

# Settings
DEPOSIT_RATE=1
PORT=3000
```

### 3. Run

```bash
node server.js
```

- 🏪 **Merchant Dashboard:** `http://localhost:3000`
- 📊 **Admin Panel:** `http://localhost:3000/admin-panel`
- 📖 **API Docs:** `http://localhost:3000/docs`

---

## 🗂️ Project Structure

```
├── public/
│   ├── assets/
│   │   ├── style.css        # Full UI design system
│   │   ├── merchant.js      # Merchant dashboard logic
│   │   ├── admin.js         # Admin panel logic
│   │   ├── background.js    # Animated canvas background
│   │   └── i18n.js          # Translations
│   ├── admin/
│   │   └── index.html       # Admin panel page
│   └── index.html           # Merchant dashboard page
├── routes/
│   ├── admin.js             # Admin API routes
│   └── merchantApi.js       # Merchant API routes
├── services/
│   ├── orderSync.js         # Order status sync & auto-refund
│   └── depositChecker.js    # Binance deposit checker
├── database/
│   └── db.js                # Supabase database layer
├── middleware/
│   └── auth.js              # JWT authentication
└── server.js                # Main Express server
```

---

## 🔐 Security

- All secrets stored in `.env` (never committed)
- JWT authentication for admin and merchant APIs
- Admin routes protected by Bearer token
- Passwords never stored in plain text
- `.env` is in `.gitignore`

---

## 📞 Contact

**Telegram:** [@Cyberr_exe](https://t.me/Cyberr_exe)

---

> ⚠️ This is a private commercial project. Do not redistribute.
