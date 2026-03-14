const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

function buildSystem() {
  return `You are Aria, the AI assistant for ADRAK Digital — a digital marketing agency in Islamabad, Pakistan.

COMPANY: ADRAK Digital | WhatsApp: 0333-996-2158 | Instagram: @adrakdigital | Founder: Daniyal Ahmad Khan (@preneurbhaya)

OFFERS:
${KB.offers.map((o) => `- ${o.name} (${o.priceDisplay}): ${o.desc} [ID: ${o.id}]`).join('\n')}

FIRST-TIME DISCOUNT: 50% off first month for all new clients. Code: FOUNDING50

DECISION POLICY (STRICT):
1. First classify intent: audit | pricing | recommendation | contact | general.
2. If intent is audit and no handle/URL is provided:
  Ask ONLY for Instagram/Facebook handle or page URL. Do not recommend a package yet.
3. If intent is audit and handle/URL is provided:
  Give a realistic social audit first (score + specific findings). Then suggest ONE best offer.
4. If intent is pricing:
  Show offer price and ALWAYS include 50% founding discount code FOUNDING50.
5. If intent is recommendation:
  Recommend one best offer based on stated problem. Ask niche/business type.
6. If intent is contact (founder/human/custom deal/complaint):
   "Seedha founder Daniyal se baat karein — WhatsApp: **0333-996-2158** ya Instagram: **@preneurbhaya**"
7. If intent is general or greeting:
  Ask one clarifying question before recommending anything.

OUTPUT RULES:
- Never push a package in every reply.
- Always adapt to latest user message, not a generic sales script.
- Keep responses concise and useful.

AUDIT FORMAT EXAMPLE:
[AUDIT:Instagram|@handle|score|finding1|finding2|finding3|finding4]

OFFER FORMAT EXAMPLE:
[OFFER:offer_id]

DISCOUNT FORMAT EXAMPLE:
[DISCOUNT:offer_id]

LANGUAGE: Detect language. Roman Urdu/Hinglish -> reply Hinglish. English -> English. Be warm, not salesy.
RESPONSES: Keep short (3-4 sentences). Use **bold** for key info. End with a question or next step.`;
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
  const greetingOnly = /^(hi|hello|hey|salam|assalam|aoa|yo)[!.\s]*$/i.test(String(lastUserMessage).trim());

  if (greetingOnly) {
    return 'Hey! I can help with social media, ads, website, and lead generation. What is your main growth problem right now?';
  }

  if (asksAudit) {
    if (!profiles.length) {
      return 'Bilkul. Send your Instagram/Facebook handle or page URL first, and I will do a quick practical audit with score, gaps, and clear next steps.';
    }

    const audits = profiles.slice(0, 2).map((profile) => {
      const report = buildQuickAudit(profile);
      return `**${profile.platform} Audit (${profile.value}) - ${report.score}/10**\n- ${report.findings.join('\n- ')}`;
    });

    const contentOffer = KB.offers.find((o) => o.id === 'content');
    return `${audits.join('\n\n')}\n\nBased on this, the best starting plan is **${contentOffer.name}** (${contentOffer.priceDisplay}). If you want, I can also give you a 30-day content direction for your niche.`;
  }

  if (/instagram|facebook|fb|social/.test(q) && profiles.length) {
    return 'Great, I got your profile details. Do you want a quick audit (score + improvements) or direct package recommendation?';
  }

  if (asksPrice) {
    return `Great question. **${offer.name}** is **${offer.priceDisplay}** and you also get our **${KB.discount.label}** with code **${KB.discount.code}**. Share your business type and I will recommend the exact plan with next steps.`;
  }

  if (asksContact) {
    return `You can connect directly on WhatsApp: **${KB.company.whatsappDisplay}** or Instagram: **${KB.company.founderIG}**. If you want, I can still suggest the best package first before you book.`;
  }

  if (asksRecommendation) {
    return `Based on your goal, I recommend **${offer.name}** (${offer.priceDisplay}). You also qualify for **${KB.discount.label}** with code **${KB.discount.code}**. Share your business niche and I will tailor the plan in detail.`;
  }

  return 'I can help in 3 ways: quick social audit, package recommendation, or pricing breakdown. Tell me which one you want first, and share your niche if you have one.';
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const KEY = process.env.GROQ_API_KEY;

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
        temperature: 0.7,
        messages: [{ role: 'system', content: buildSystem() }, ...(messages || [])]
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ ADRAK running on http://localhost:${PORT}`));
