import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // En yüksek skorlu 20 sorguyu getir (büyükten küçüğe)
    const results = await kv.zrange("hayaksi:popular", 0, 19, {
      rev: true,
      withScores: true,
    });

    // results: [query, score, query, score, ...] formatında gelir
    const popular = [];
    for (let i = 0; i < results.length; i += 2) {
      popular.push({
        query: results[i],
        count: results[i + 1],
      });
    }

    return res.status(200).json({ popular });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
