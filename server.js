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

YOUR FLOW:
1. Greet warmly in Hinglish, ask what digital problem they have
2. If they mention social media/website — ask for their Instagram/Facebook handle or website URL
3. When they share a handle -> do a realistic AUDIT. Check: bio, posting frequency, content type, engagement, highlights, ads. Score /10. Be SPECIFIC.
   Format: [AUDIT:Instagram|@handle|score|finding1|finding2|finding3|finding4]
4. Recommend the best ADRAK offer based on their problem
   Format: [OFFER:offer_id]
5. When they show interest in price -> ALWAYS show 50% founding discount
   Format: [DISCOUNT:offer_id]
6. For complaints/custom deals/speaking to human:
   "Seedha founder Daniyal se baat karein — WhatsApp: **0333-996-2158** ya Instagram: **@preneurbhaya**"

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

function fallbackReply(messages) {
  const lastUserMessage = [...(messages || [])].reverse().find((m) => m?.role === 'user')?.content || '';
  const q = String(lastUserMessage).toLowerCase();
  const offer = chooseOfferFromText(lastUserMessage);

  if (/price|cost|rate|kitna|charges|pricing/.test(q)) {
    return `Great question. **${offer.name}** is **${offer.priceDisplay}** and you also get our **${KB.discount.label}** with code **${KB.discount.code}**. Share your business type and I will recommend the exact plan with next steps.`;
  }

  if (/contact|call|whatsapp|founder|human|team/.test(q)) {
    return `You can connect directly on WhatsApp: **${KB.company.whatsappDisplay}** or Instagram: **${KB.company.founderIG}**. If you want, I can still suggest the best package first before you book.`;
  }

  return `Based on your query, I recommend **${offer.name}** (${offer.priceDisplay}). It is best for ${offer.bestFor.slice(0, 3).join(', ')}. You also qualify for **${KB.discount.label}** with code **${KB.discount.code}**. What is your business niche so I can tailor this better?`;
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
