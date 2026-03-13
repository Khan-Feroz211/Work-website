# Work-website

A professional portfolio website built with **Node.js**, **Express**, and vanilla **HTML/CSS/JavaScript**. Features a responsive dark-themed design, animated skill bars, a project showcase, and a working contact form.

---

## 🖼️ Preview

| Section | Features |
|---------|----------|
| **Hero** | Animated typing effect, social links, scroll indicator |
| **About** | Bio, contact info, years-of-experience badge |
| **Skills** | 6 skill cards with animated progress bars |
| **Work** | 3 featured project cards with hover overlays |
| **Contact** | Server-side validated contact form (email or demo mode) |
| **Footer** | Copyright, logo, social links |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables (optional)

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3000`) |
| `EMAIL_SERVICE` | No | Email service name (e.g. `gmail`) |
| `EMAIL_USER` | No | Your email address |
| `EMAIL_PASS` | No | Your email app password |
| `EMAIL_TO` | No | Address to receive contact-form emails |

> **Note:** Without email credentials the contact form runs in **demo mode** — form submissions are printed to the console instead of being emailed.

### 3. Start the server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📦 Deployment

### Option 1 – Railway (recommended, free tier available)

1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Select your repository. Railway auto-detects Node.js.
4. Add environment variables under **Variables** (copy from `.env.example`).
5. Railway assigns a public URL automatically.

### Option 2 – Render (free tier)

1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect your GitHub repo.
3. Set **Build Command**: `npm install`  
   Set **Start Command**: `npm start`
4. Add environment variables in the **Environment** tab.
5. Deploy — Render provides a public `.onrender.com` URL.

### Option 3 – Heroku

```bash
# Install Heroku CLI, then:
heroku login
heroku create your-app-name
heroku config:set EMAIL_USER=you@gmail.com EMAIL_PASS=yourpass
git push heroku main
heroku open
```

### Option 4 – VPS / Cloud VM (AWS EC2, DigitalOcean, etc.)

```bash
# On your server:
git clone https://github.com/Khan-Feroz211/Work-website.git
cd Work-website
npm install
cp .env.example .env   # fill in values
npm start              # or use PM2 for production
```

**With PM2 (recommended for VPS):**

```bash
npm install -g pm2
pm2 start server.js --name work-website
pm2 save
pm2 startup             # follow the printed command to survive reboots
```

### Option 5 – Vercel / Netlify (static-only, no contact form API)

If you only need the static front-end (no backend/contact form), you can deploy the `public/` folder directly to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) as a static site.

---

## 📁 Project Structure

```
Work-website/
├── public/
│   ├── index.html        # Main HTML page (all sections)
│   ├── css/
│   │   └── style.css     # Responsive dark-theme styles
│   └── js/
│       └── main.js       # Navigation, typing animation, contact form
├── server.js             # Express server + /api/contact endpoint
├── package.json
├── .env.example          # Environment variable template
└── .gitignore
```

---

## 🔒 Security Features

- **Helmet.js** – sets secure HTTP headers (CSP, XSS protection, etc.)
- **Rate limiting** – contact form is limited to 5 requests per 15 minutes per IP
- **Input validation** – all form fields validated on both client and server
- **Input length limits** – protects against oversized payloads
- **No secrets in source** – credentials loaded from `.env` (excluded from git)

---

## 📧 Contact Form – Gmail Setup

1. Enable **2-Step Verification** on your Google account.
2. Go to **Google Account → Security → App passwords**.
3. Generate a new app password for "Mail".
4. Use that 16-character password as `EMAIL_PASS` in your `.env` file.

---

## 📝 Customisation

| What to change | Where |
|----------------|-------|
| Your name, bio, links | `public/index.html` |
| Colour theme | CSS custom properties at the top of `public/css/style.css` |
| Typing phrases | `phrases` array in `public/js/main.js` |
| Project cards | Work section in `public/index.html` |
| Skill percentages | `style="--pct: XX%"` on each `.skill-bar__fill` element |

---

## 📄 License

MIT © Feroz Khan
