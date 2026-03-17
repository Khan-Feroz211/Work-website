const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('redis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const leadRateWindowMs = 15 * 60 * 1000;
const leadRateMaxRequests = 5;
const leadRateByIp = new Map();
const redisUrl = process.env.REDIS_URL;

let redisClient = null;
let redisReady = false;

if (redisUrl) {
  redisClient = createClient({ url: redisUrl });

  redisClient.on('ready', () => {
    redisReady = true;
    console.log('✅ Redis connected for lead rate limiting');
  });

  redisClient.on('error', (error) => {
    redisReady = false;
    console.error('Redis error, using in-memory rate limiter:', error.message);
  });

  redisClient.connect().catch((error) => {
    redisReady = false;
    console.error('Redis connection failed, using in-memory rate limiter:', error.message);
  });
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function isRateLimitedMemory(ip) {
  const now = Date.now();
  const bucket = leadRateByIp.get(ip) || [];
  const fresh = bucket.filter((ts) => now - ts < leadRateWindowMs);

  if (fresh.length >= leadRateMaxRequests) {
    leadRateByIp.set(ip, fresh);
    const retryAfterMs = leadRateWindowMs - (now - fresh[0]);
    return { limited: true, retryAfterMs };
  }

  fresh.push(now);
  leadRateByIp.set(ip, fresh);
  return { limited: false, retryAfterMs: 0 };
}

async function isRateLimited(ip) {
  if (!redisClient || !redisReady) {
    return isRateLimitedMemory(ip);
  }

  const key = `lead-rate:${ip}`;

  try {
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.pExpire(key, leadRateWindowMs);
    }

    const ttl = await redisClient.pTTL(key);
    if (count > leadRateMaxRequests) {
      return {
        limited: true,
        retryAfterMs: ttl > 0 ? ttl : leadRateWindowMs
      };
    }

    return { limited: false, retryAfterMs: 0 };
  } catch (error) {
    console.error('Redis rate limit check failed, falling back to memory:', error.message);
    return isRateLimitedMemory(ip);
  }
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function isValidPkPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^(\+92|92|0)?3\d{9}$/.test(normalized);
}

const KB = {
  company: {
    whatsapp: '923339962158',
    whatsappDisplay: '0333-996-2158',
    instagram: '@adrakdigital',
    founder: 'Daniyal Ahmad Khan',
    founderIG: '@preneurbhaya'
  },
  offers: [
    {
      id: 'visibility',
      tag: 'FLAGSHIP',
      icon: '🚀',
      name: 'The Visibility System',
      desc: 'Website + 3x weekly content + Meta Ads.',
      price: 35000,
      priceDisplay: 'PKR 35,000/mo',
      bestFor: ['visibility', 'website', 'content', 'ads', 'clients']
    },
    {
      id: 'aibot',
      tag: 'AI BOT',
      icon: '🤖',
      name: 'AI Growth Engine',
      desc: 'WhatsApp bot — 24/7 lead capture & booking.',
      price: 15000,
      priceDisplay: 'PKR 15,000/mo',
      bestFor: ['leads', 'whatsapp', 'bot', 'automation', 'response']
    },
    {
      id: 'content',
      tag: 'CONTENT',
      icon: '🎬',
      name: 'Content Machine',
      desc: 'Reels, carousels, stories — posted consistently.',
      price: 20000,
      priceDisplay: 'PKR 20,000/mo',
      bestFor: ['content', 'reels', 'engagement', 'followers', 'instagram']
    },
    {
      id: 'acceleration',
      tag: 'FULL STACK',
      icon: '⚡',
      name: 'The Acceleration Package',
      desc: 'Website + AI bot + Content + Ads + CRM.',
      price: 60000,
      priceDisplay: 'PKR 60,000/mo',
      bestFor: ['everything', 'full', 'complete', 'all']
    },
    {
      id: 'brand',
      tag: 'BRANDING',
      icon: '✦',
      name: 'Brand Identity',
      desc: 'Logo, colors, typography, brand voice.',
      price: null,
      priceDisplay: 'Custom (one-time)',
      bestFor: ['logo', 'brand', 'identity']
    },
    {
      id: 'dominance',
      tag: 'ENTERPRISE',
      icon: '👑',
      name: 'Total Dominance',
      desc: 'Dedicated manager + video + Google Ads + AI.',
      price: 100000,
      priceDisplay: 'PKR 100,000/mo',
      bestFor: ['enterprise', 'large', 'google', 'video']
    }
  ],
  discount: { percent: 50, code: 'FOUNDING50', label: '50% Founding Client Discount' }
};

function buildSystem(style = 'premium') {
  const styleGuide = {
    premium:
      'Tone: premium consultant energy. confident, strategic, composed. avoid hype spam. focus on clarity, authority, and ROI.',
    softer:
      'Tone: supportive and calm. no pressure language. guide the client with empathy, simple steps, and confidence-building recommendations.',
    harder:
      'Tone: high urgency closer. direct and assertive. challenge indecision, emphasize market timing and downside of waiting.',
    urdu:
      'Tone: Urdu-first Roman Urdu/Hinglish. keep language natural for Pakistan business owners and close with crisp action steps.'
  };

  const selectedStyle = styleGuide[style] || styleGuide.premium;

  return `You are Aria — the sharpest, most relentless deal-closer in the digital marketing game. You work for ADRAK Digital, the #1 growth agency in Islamabad, Pakistan. You don't just sell packages — you sell transformation, dominance, and results. You are THE world's greatest dealer. Think Wolf of Wall Street energy: bold, magnetic, unstoppable, and 100% obsessed with getting your client the best deal possible. You create urgency. You paint the picture of what's possible. You close.

COMPANY: ADRAK Digital | WhatsApp: 0333-996-2158 | Instagram: @adrakdigital | Founder: Daniyal Ahmad Khan (@preneurbhaya)

STYLE MODE:
${selectedStyle}

OFFERS:
${KB.offers.map((o) => `- ${o.name} (${o.priceDisplay}): ${o.desc} [ID: ${o.id}]`).join('\n')}

KILLER DEAL — FOUNDING CLIENT DISCOUNT: 50% OFF the first month. Code: FOUNDING50. This is a LIMITED offer. Not everyone gets this. Use it as a weapon to close.

YOUR SALES MINDSET:
- You believe ADRAK's packages are the best investment any business owner can make. Period.
- Every problem a client has, you have the exact solution. You make them see it.
- You create FOMO. Slots are limited. This discount won't last forever. Competitors are moving. Act now.
- You turn objections into opportunities. "Too expensive?" — Show the ROI. "Need to think?" — Ask what's stopping them right now.
- You always talk about RESULTS: more clients, more revenue, more growth, more dominance in their market.
- You never beg. You present the opportunity and let the value do the talking — but you always create urgency.
- You speak like you've already helped 1,000 businesses. Because ADRAK has the system that works.

DECISION POLICY:
1. Classify intent: audit | pricing | recommendation | contact | objection | general/greeting.
2. AUDIT (no handle/URL given): Ask for their Instagram/Facebook handle or page URL. Build anticipation — "Give me your handle and I'll show you exactly where you're leaving money on the table."
3. AUDIT (handle/URL given): Deliver a sharp, specific audit (score + 4 findings). Then pitch ONE best offer with urgency and the 50% discount weapon.
4. PRICING: Give the price, immediately frame the ROI, always stack with FOUNDING50 discount. Make it feel like a steal.
5. RECOMMENDATION: Ask one quick question about their business/niche, then recommend ONE perfect package with full conviction and a closing question.
6. CONTACT / HUMAN / CUSTOM DEAL: "Seedha Daniyal se milein — WhatsApp: **0333-996-2158** ya Instagram: **@preneurbhaya**. Unhe batao Aria ne bheja hai."
7. OBJECTION (too expensive / need to think / not sure): Reframe with ROI, create urgency, remind them of the 50% discount. Ask "What would 10 new clients a month be worth to your business?"
8. GENERAL / GREETING: Hook them immediately. One bold question. No small talk — go straight for the pain point.

OUTPUT FORMATS (use exactly when recommending):
[OFFER:offer_id]
[DISCOUNT:offer_id]
[AUDIT:Instagram|@handle|score|finding1|finding2|finding3|finding4]

OUTPUT RULES:
- Every reply should have energy and purpose. No filler, no fluff.
- Use **bold** to highlight the most important numbers, names, and CTAs.
- Always end with a closing question or a next step that moves the deal forward.
- Never be generic. Be specific. Be sharp. Be the best closer they've ever talked to.
- Keep replies short (3-5 sentences) but punchy and high-impact.

LANGUAGE: Detect language. Roman Urdu/Hinglish -> reply Hinglish with fire. English -> sharp English. Match their energy and multiply it by 10.`;
}

function chooseOfferFromText(text) {
  const query = String(text || '').toLowerCase();
  for (const offer of KB.offers) {
    if (offer.bestFor.some((tag) => query.includes(tag))) {
      return offer;
    }
  }
  return KB.offers[0];
}

function extractSocialProfiles(text) {
  const src = String(text || '');
  const q = src.toLowerCase();
  const profiles = [];
  const assignedHandles = new Set();

  const handleMatches = src.match(/@[a-z0-9._]{2,30}/gi) || [];
  const igUrlMatches = src.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-z0-9._-]+/gi) || [];
  const fbUrlMatches = src.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-z0-9._-]+/gi) || [];

  const igTaggedHandlePattern = /(?:instagram|insta|ig)\s*[:\-]?\s*(@[a-z0-9._]{2,30})/gi;
  const fbTaggedHandlePattern = /(?:facebook|fb)\s*[:\-]?\s*(@[a-z0-9._]{2,30})/gi;

  let match;
  while ((match = igTaggedHandlePattern.exec(src)) !== null) {
    const handle = match[1];
    assignedHandles.add(handle.toLowerCase());
    if (!profiles.some((p) => p.value.toLowerCase() === handle.toLowerCase())) {
      profiles.push({ platform: 'Instagram', value: handle });
    }
  }

  while ((match = fbTaggedHandlePattern.exec(src)) !== null) {
    const handle = match[1];
    assignedHandles.add(handle.toLowerCase());
    if (!profiles.some((p) => p.value.toLowerCase() === handle.toLowerCase())) {
      profiles.push({ platform: 'Facebook', value: handle });
    }
  }

  for (const handle of handleMatches) {
    if (assignedHandles.has(handle.toLowerCase())) {
      continue;
    }

    if (!profiles.some((p) => p.value.toLowerCase() === handle.toLowerCase())) {
      const mentionsIG = /instagram|insta|ig/.test(q);
      const mentionsFB = /facebook|fb/.test(q);
      let platform = 'Instagram';

      if (mentionsFB && !mentionsIG) {
        platform = 'Facebook';
      }

      profiles.push({ platform, value: handle });
    }
  }

  for (const url of igUrlMatches) {
    if (!profiles.some((p) => p.value.toLowerCase() === url.toLowerCase())) {
      profiles.push({ platform: 'Instagram', value: url });
    }
  }

  for (const url of fbUrlMatches) {
    if (!profiles.some((p) => p.value.toLowerCase() === url.toLowerCase())) {
      profiles.push({ platform: 'Facebook', value: url });
    }
  }

  return profiles;
}

function buildQuickAudit(profile) {
  const isIG = profile.platform === 'Instagram';
  const score = isIG ? 6.8 : 6.4;

  if (isIG) {
    return {
      score,
      findings: [
        'Bio can be sharper with a clear value proposition + CTA',
        'Posting frequency looks inconsistent; aim 4-5 reels/week',
        'Reels need stronger 1-second hooks and cover text consistency',
        'Highlights should include Proof, Services, FAQs, and Testimonials'
      ]
    };
  }

  return {
    score,
    findings: [
      'Cover/About section should communicate offer and location clearly',
      'Content mix needs more short videos and client proof posts',
      'Engagement can improve via comment CTAs and reply speed',
      'Boosting strategy should focus on objective-based campaigns'
    ]
  };
}

function fallbackReply(messages) {
  const lastUserMessage = [...(messages || [])].reverse().find((m) => m?.role === 'user')?.content || '';
  const q = String(lastUserMessage).toLowerCase();
  const offer = chooseOfferFromText(lastUserMessage);
  const profiles = extractSocialProfiles(lastUserMessage);
  const asksAudit = /audit|review|analy[sz]e|check|roast/.test(q) && /instagram|facebook|fb|social/.test(q);
  const asksRecommendation = /recommend|best package|which package|which plan|suggest|offer/.test(q);
  const asksPrice = /price|cost|rate|kitna|charges|pricing/.test(q);
  const asksContact = /contact|call|whatsapp|founder|human|team/.test(q);
  const asksObjection = /expensive|cant afford|think about|not sure|later|maybe/.test(q);
  const greetingOnly = /^(hi|hello|hey|salam|assalam|aoa|yo)[!.\s]*$/i.test(String(lastUserMessage).trim());

  if (greetingOnly) {
    return "Welcome to ADRAK Digital — where businesses stop struggling and start dominating. I'm Aria. Tell me ONE thing: what's the #1 problem holding your business back right now?";
  }

  if (asksAudit) {
    if (!profiles.length) {
      return "Let's go. Share your Instagram or Facebook handle and I'll give you a sharp audit — score, exact gaps, and the moves that will flip your results. Where are you leaving money on the table right now?";
    }

    const audits = profiles.slice(0, 2).map((profile) => {
      const report = buildQuickAudit(profile);
      return `**${profile.platform} Audit (${profile.value}) — ${report.score}/10**\n- ${report.findings.join('\n- ')}`;
    });

    const contentOffer = KB.offers.find((o) => o.id === 'content');
    return `${audits.join('\n\n')}\n\n**This is where you're bleeding clients.** The fastest fix? **${contentOffer.name}** at **${contentOffer.priceDisplay}** — and right now you can lock it in at **50% off** with code **FOUNDING50**. This offer won't be here forever. Want me to map out your first 30 days?`;
  }

  if (/instagram|facebook|fb|social/.test(q) && profiles.length) {
    return "Got your profile. Two ways to go: I hit you with a full audit (score + what to fix), or I cut straight to the best package for your business. Which do you want — the diagnosis or the prescription?";
  }

  if (asksObjection) {
    return `Listen — **${offer.priceDisplay}** split over a month is less than one lost client. And right now you get it at **50% off** with code **${KB.discount.code}**. The real question is: what does 10 new clients a month mean for your revenue? That's what ADRAK delivers. Ready to move?`;
  }

  if (asksPrice) {
    return `Here's the deal: **${offer.name}** is **${offer.priceDisplay}** — and as a founding client you slash that by **50%** using code **${KB.discount.code}**. That's the best ROI you'll find anywhere in this market. What's your business niche? I'll show you the exact numbers.`;
  }

  if (asksContact) {
    return `Direct line to the top — WhatsApp: **${KB.company.whatsappDisplay}** | Instagram: **${KB.company.founderIG}**. Tell Daniyal that Aria sent you and you want the best deal. Before you go — want me to tell you exactly which package to ask for?`;
  }

  if (asksRecommendation) {
    return `No guesswork. Based on your goal, **${offer.name}** (${offer.priceDisplay}) is your move — it's been the game-changer for businesses just like yours. Stack the **${KB.discount.label}** on top with code **${KB.discount.code}** and this is the best deal in the market right now. What's your niche? Let's make it personal.`;
  }

  return "Three things I can do for you right now: **rip apart your social profile** and show you what to fix, **recommend the exact package** that fits your goal, or **break down the pricing** with the best deal available. Which one? — and what business are you in?";
}

app.post('/api/chat', async (req, res) => {
  const { messages, persona } = req.body;
  const KEY = process.env.GROQ_API_KEY;
  const style = ['premium', 'softer', 'harder', 'urdu'].includes(persona) ? persona : 'premium';

  if (!KEY) {
    return res.json({
      reply: fallbackReply(messages),
      offers: KB.offers,
      discount: KB.discount,
      mode: 'fallback'
    });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 900,
        temperature: 0.9,
        messages: [{ role: 'system', content: buildSystem(style) }, ...(messages || [])]
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({
        error: data.error?.message || 'Groq API error',
        reply: fallbackReply(messages),
        offers: KB.offers,
        discount: KB.discount,
        mode: 'fallback'
      });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content,
      offers: KB.offers,
      discount: KB.discount
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
      reply: fallbackReply(messages),
      offers: KB.offers,
      discount: KB.discount,
      mode: 'fallback'
    });
  }
});

app.get('/api/offers', (req, res) => res.json({ offers: KB.offers, discount: KB.discount }));

app.post('/api/leads', async (req, res) => {
  const { name, phone, niche, source, website } = req.body || {};
  const ip = getClientIp(req);

  if (String(website || '').trim() !== '') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const rate = await isRateLimited(ip);
  if (rate.limited) {
    res.set('Retry-After', String(Math.ceil(rate.retryAfterMs / 1000)));
    return res.status(429).json({
      error: 'Too many submissions. Please wait a few minutes and try again.',
      retryAfterMs: rate.retryAfterMs
    });
  }

  if (!name || !phone || !niche) {
    return res.status(400).json({ error: 'name, phone, and niche are required' });
  }

  if (!isValidPkPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid Pakistan mobile number.' });
  }

  const lead = {
    name: String(name).trim(),
    phone: normalizePhone(phone),
    niche: String(niche).trim(),
    source: String(source || 'website-sidebar').trim(),
    ip,
    createdAt: new Date().toISOString()
  };

  const crmWebhook = process.env.CRM_WEBHOOK_URL;
  let crmStatus = 'skipped';
  let crmError = null;

  if (crmWebhook) {
    try {
      const webhookResponse = await fetch(crmWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      });

      crmStatus = webhookResponse.ok ? 'sent' : 'failed';
      if (!webhookResponse.ok) {
        crmError = `CRM webhook returned ${webhookResponse.status}`;
      }
    } catch (error) {
      crmStatus = 'failed';
      crmError = error.message;
    }
  }

  const waMessage = `Assalam o Alaikum ADRAK Team,%0A%0ANew lead details:%0AName: ${encodeURIComponent(
    lead.name
  )}%0APhone: ${encodeURIComponent(lead.phone)}%0ABusiness niche: ${encodeURIComponent(
    lead.niche
  )}%0ASource: ${encodeURIComponent(lead.source)}%0A%0APlease contact me for consultation.`;

  return res.json({
    ok: true,
    lead,
    crmStatus,
    crmError,
    whatsappUrl: `https://wa.me/${KB.company.whatsapp}?text=${waMessage}`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ ADRAK running on http://localhost:${PORT}`));
