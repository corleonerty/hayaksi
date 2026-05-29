import { useState } from "react";

const categories = [
  { icon: "🚗", label: "Araç", color: "#E6F1FB", border: "#378ADD", examples: ["Lastik patladı", "Benzin bitti", "Kaza yaptım", "Yolda kaldım"] },
  { icon: "🏠", label: "Ev", color: "#EAF3DE", border: "#639922", examples: ["Su borusu patladı", "Elektrik kesildi", "Gaz kaçağı", "Kilit açılmıyor"] },
  { icon: "🩹", label: "Sağlık", color: "#FAECE7", border: "#D85A30", examples: ["Bileğimi burktum", "Düşüp yaralandım", "Alerjik reaksiyon", "Başım çok ağrıyor"] },
  { icon: "💻", label: "Teknoloji", color: "#EEEDFE", border: "#7F77DD", examples: ["İnternet koptu", "Telefon kırıldı", "Su hasarı", "Bilgisayar açılmıyor"] },
  { icon: "✈️", label: "Seyahat", color: "#FAEEDA", border: "#BA7517", examples: ["Uçuşum iptal oldu", "Bagajım kayboldu", "Pasaportum kayboldu", "Otelim beni almadı"] },
  { icon: "🐾", label: "Evcil Hayvan", color: "#FBEAF0", border: "#D4537E", examples: ["Hayvanım yaralandı", "Bir şey yuttu", "Kayboldu", "Zehirlendi"] },
];

const SYSTEM_PROMPT = `Sen "Hay Aksi" platformunun yardımcı asistanısın. Kullanıcılar başlarına gelen beklenmedik, stresli anlarda sana başvuruyor. Amacın:

1. ÖNCE: 2-3 madde halinde hemen alınması gereken güvenlik önlemlerini söyle (kısa ve net)
2. SONRA: Varsa asistans hizmetleri veya sigorta poliçesi başvuru yöntemlerini anlat
3. SONRA: Hizmet yoksa en ucuz ve kolay çözümü nerede bulabileceğini söyle

Türkçe yaz. Sade, sakin ve güven verici bir dil kullan. Madde madde yaz, uzun paragraflar yazma. Emoji kullanabilirsin ama abartma. Yanıtın başına kısa bir "panik yapma" mesajı ekle.`;

export default function HayAksi() {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const handleSend = async (text) => {
    const userText = text || query;
    if (!userText.trim()) return;
    setStarted(true);
    setQuery("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Bir hata oluştu.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Bağlantı hatası. Lütfen tekrar dene." }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setMessages([]);
    setStarted(false);
    setQuery("");
    setSelectedCat(null);
  };

  const formatAssistant = (text) => {
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return null;
      const isBullet = /^[-•*]\s/.test(line) || /^\d+[.)]\s/.test(line);
      return (
        <p key={i} style={{
          margin: isBullet ? "4px 0" : "8px 0",
          paddingLeft: isBullet ? "8px" : "0",
          borderLeft: isBullet ? "2px solid #1D9E75" : "none",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "var(--color-text-primary)",
        }}>{line}</p>
      );
    }).filter(Boolean);
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 680, margin: "0 auto", padding: "0 0 2rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "2rem 1rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>😬</span>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, letterSpacing: "-0.5px", color: "var(--color-text-primary)" }}>
            hay aksi
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-secondary)" }}>
          Beklenmedik anlarda ne yapacağını söylüyoruz. Hızlı, güvenilir, ücretsiz.
        </p>
      </div>

      {/* Chat Area */}
      {started ? (
        <div style={{ padding: "0 1rem" }}>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: 16, padding: "1rem", minHeight: 200, marginBottom: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}>
                {m.role === "assistant" && (
                  <span style={{ fontSize: 18, marginRight: 8, marginTop: 2 }}>😬</span>
                )}
                <div style={{
                  background: m.role === "user" ? "#1D9E75" : "var(--color-background-primary)",
                  color: m.role === "user" ? "#fff" : "var(--color-text-primary)",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  maxWidth: "85%",
                  border: m.role === "assistant" ? "0.5px solid var(--color-border-tertiary)" : "none",
                  fontSize: 15,
                }}>
                  {m.role === "user" ? m.content : formatAssistant(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 6, padding: "8px 12px", alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>😬</span>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>düşünüyorum...</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Devam et veya başka bir şey sor..."
              style={{ flex: 1, fontSize: 15, borderRadius: 12, padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)" }}
            />
            <button onClick={() => handleSend()} style={{ padding: "10px 18px", borderRadius: 12, background: "#1D9E75", color: "#fff", border: "none", fontSize: 15, cursor: "pointer" }}>
              Gönder
            </button>
          </div>
          <button onClick={reset} style={{ marginTop: 10, fontSize: 13, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            ← Yeni aksiliğe başla
          </button>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div style={{ padding: "0.5rem 1rem 1.5rem" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder='Ne oldu? "Su borusu patladı" gibi yaz...'
                style={{
                  flex: 1,
                  fontSize: 16,
                  borderRadius: 14,
                  padding: "13px 18px",
                  border: "1px solid var(--color-border-secondary)",
                  background: "var(--color-background-primary)",
                }}
              />
              <button
                onClick={() => handleSend()}
                style={{
                  padding: "12px 20px",
                  borderRadius: 14,
                  background: "#1D9E75",
                  color: "#fff",
                  border: "none",
                  fontSize: 16,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Yardım al
              </button>
            </div>
          </div>

          {/* Categories */}
          <div style={{ padding: "0 1rem" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>Ya da bir kategori seç:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {categories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCat(selectedCat === cat.label ? null : cat.label)}
                  style={{
                    background: selectedCat === cat.label ? cat.color : "var(--color-background-primary)",
                    border: selectedCat === cat.label ? `1.5px solid ${cat.border}` : "0.5px solid var(--color-border-tertiary)",
                    borderRadius: 14,
                    padding: "14px 10px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{cat.label}</div>
                </button>
              ))}
            </div>

            {/* Quick examples for selected category */}
            {selectedCat && (
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {categories.find(c => c.label === selectedCat)?.examples.map(ex => (
                  <button
                    key={ex}
                    onClick={() => handleSend(ex)}
                    style={{
                      background: "var(--color-background-secondary)",
                      border: "0.5px solid var(--color-border-tertiary)",
                      borderRadius: 20,
                      padding: "8px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer note */}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-tertiary)", marginTop: "2rem", padding: "0 1rem" }}>
            Acil durumlarda her zaman 112'yi veya ilgili acil hattı ara. Bu platform genel rehberlik amaçlıdır.
          </p>
        </>
      )}
    </div>
  );
}
