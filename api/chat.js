import { kv } from "@vercel/kv";

function normalizeQuery(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function cacheKey(normalized) {
  return `hayaksi:v1:${normalized}`;
}

function popularKey(normalized) {
  return `popular:${normalized}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Geçersiz istek" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key yapılandırılmamış" });

  const isSingleTurn = messages.filter((m) => m.role === "user").length === 1;
  const firstUserMsg = messages.find((m) => m.role === "user");
  const rawText = typeof firstUserMsg?.content === "string"
    ? firstUserMsg.content
    : firstUserMsg?.content?.[0]?.text || "";
  const normalized = normalizeQuery(rawText);
  const key = isSingleTurn ? cacheKey(normalized) : null;

  // Popüler sorgu sayacını artır
  if (isSingleTurn && normalized) {
    try {
      await kv.zincrby("hayaksi:popular", 1, normalized);
    } catch (e) {
      console.warn("Popüler sayaç hatası:", e.message);
    }
  }

  // Cache kontrolü
  if (key) {
    try {
      const cached = await kv.get(key);
      if (cached) {
        return res.status(200).json({
          content: [{ type: "text", text: cached }],
          cached: true,
        });
      }
    } catch (e) {
      console.warn("KV cache okuma hatası:", e.message);
    }
  }

  // Anthropic API çağrısı
  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: system || defaultSystemPrompt(),
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json();
      return res.status(anthropicRes.status).json({ error: err.error?.message || "Anthropic API hatası" });
    }

    const data = await anthropicRes.json();
    const responseText = data.content?.[0]?.text || "";

    if (key && responseText) {
      try {
        await kv.set(key, responseText, { ex: 60 * 60 * 24 * 7 });
      } catch (e) {
        console.warn("KV cache yazma hatası:", e.message);
      }
    }

    return res.status(200).json({
      content: [{ type: "text", text: responseText }],
      cached: false,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function defaultSystemPrompt() {
  return `Sen "Hay Aksi!" platformunun yapay zeka asistanısın. Türkiye'de yaşayan insanlara beklenmedik aksiliklerde pratik, adım adım rehberlik yapıyorsun.

Her yanıtında şu sırayla yardım et:
1. 🚨 Acil güvenlik önlemleri (varsa)
2. 📋 Hemen yapılması gerekenler (numaralı liste)
3. 📞 Aranacak numaralar veya başvurulacak kurumlar
4. 💡 Bir dahaki sefere için öneri (kısa)

Yanıtların kısa, net ve uygulanabilir olsun. Gereksiz açıklama yapma. Türkçe yaz.`;
}
