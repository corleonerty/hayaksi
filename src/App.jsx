import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
  { icon: "🚗", label: "Araç", examples: ["Kaza yaptım ne yapmalıyım", "Aracım çalındı", "Lastiğim patladı yolda kaldım", "Aracım çekici ile götürüldü"] },
  { icon: "🏠", label: "Ev", examples: ["Su borusu patladı", "Evde yangın çıktı", "Doğal gaz kokusu var", "Kapım kilitlendi içeride kaldım"] },
  { icon: "🏥", label: "Sağlık", examples: ["Yabancı cisim yuttum", "Arı soktu alerjim var", "Kırık şüphesi var", "İlaç dozu aştım"] },
  { icon: "💻", label: "Teknoloji", examples: ["Telefonum suya düştü", "Bilgisayarıma virüs girdi", "Verilerimi sildim geri almak istiyorum", "Kredi kartı bilgilerimi çaldılar"] },
  { icon: "✈️", label: "Seyahat", examples: ["Bagajım kayboldu", "Uçuşum iptal edildi", "Pasaportumu kaybettim", "Yurt dışında hastalandım"] },
  { icon: "🐾", label: "Evcil Hayvan", examples: ["Köpeğim zehirli bir şey yedi", "Kedim kayboldu", "Hayvanım kaza geçirdi", "Yabani hayvan ısırdı"] },
];

const SYSTEM_PROMPT = `Sen "Hay Aksi!" platformunun yapay zeka asistanısın. Türkiye'de yaşayan insanlara beklenmedik aksiliklerde pratik, adım adım rehberlik yapıyorsun.

Her yanıtında şu sırayla yardım et:
1. 🚨 Acil güvenlik önlemleri (varsa)
2. 📋 Hemen yapılması gerekenler (numaralı liste)
3. 📞 Aranacak numaralar veya başvurulacak kurumlar
4. 💡 Bir dahaki sefere için öneri (kısa)

Yanıtların kısa, net ve uygulanabilir olsun. Gereksiz açıklama yapma. Türkçe yaz.`;

export default function HayAksi() {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [popular, setPopular] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/popular")
      .then((r) => r.json())
      .then((data) => setPopular(data.popular || []))
      .catch(() => {});
  }, []);

  const handleSend = async (text) => {
    const userText = text || query;
    if (!userText.trim()) return;
    setStarted(true);
    setQuery("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          system: SYSTEM_PROMPT,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API hatası");
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Bir hata oluştu.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: `⚠️ Bir hata oluştu: ${err.message}` }]);
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
          borderLeft: isBullet ? "3px solid #e63946" : "none",
        }}>{line}</p>
      );
    });
  };

  // Cevabın son mesajı assistant mı?
  const lastMsg = messages[messages.length - 1];
  const showInsuranceBtn = lastMsg?.role === "assistant" && !loading;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fff5f5 0%, #fff 60%, #f0f4ff 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "#e63946",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(230,57,70,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }}>🆘</span>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px" }}>Hay Aksi!</div>
            <div style={{ fontSize: "12px", opacity: 0.85 }}>Beklenmedik anlarda yanındayım</div>
          </div>
        </div>
        {started && (
          <button onClick={reset} style={{
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            borderRadius: "8px",
            padding: "6px 14px",
            cursor: "pointer",
            fontSize: "13px",
          }}>↩ Yeni Soru</button>
        )}
      </header>

      <main style={{ flex: 1, maxWidth: "720px", width: "100%", margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column" }}>

        {/* Landing */}
        {!started && (
          <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>
                Hay Aksi! Başına ne geldi?
              </h1>
              <p style={{ color: "#6c757d", fontSize: "15px" }}>
                Kategori seç ya da durumunu yaz ki hemen yardım edebileyim.
              </p>
            </div>

            {/* Categories */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat.label} onClick={() => setSelectedCat(selectedCat?.label === cat.label ? null : cat)}
                  style={{
                    background: selectedCat?.label === cat.label ? "#e63946" : "#fff",
                    color: selectedCat?.label === cat.label ? "#fff" : "#1a1a2e",
                    border: `2px solid ${selectedCat?.label === cat.label ? "#e63946" : "#e9ecef"}`,
                    borderRadius: "12px",
                    padding: "16px 8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: "28px" }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Category Examples */}
            {selectedCat && (
              <div style={{ marginBottom: "20px", background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: "13px", color: "#6c757d", marginBottom: "10px" }}>Örnek durumlar:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedCat.examples.map((ex) => (
                    <button key={ex} onClick={() => handleSend(ex)}
                      style={{
                        background: "#fff5f5",
                        border: "1px solid #fce4e4",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#1a1a2e",
                      }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popüler Sorgular */}
            {popular.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#6c757d", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🔥 İşte herkesin başına gelenler, Muhtemelen senin de cevabın aşağıda bir yerde..
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {popular.map((item, i) => (
                    <button key={i} onClick={() => handleSend(item.query)}
                      style={{
                        background: "#fff",
                        border: "1px solid #e9ecef",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#1a1a2e",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "all 0.15s",
                      }}>
                      <span>{item.query}</span>
                      <span style={{ fontSize: "11px", color: "#adb5bd", marginLeft: "12px", whiteSpace: "nowrap" }}>
                        {item.count} kez Hay Aksi!
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%",
                  background: msg.role === "user" ? "#e63946" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#1a1a2e",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  {msg.role === "assistant" ? formatAssistant(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "#fff",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "12px 18px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: "20px",
                  letterSpacing: "4px",
                }}>⏳</div>
              </div>
            )}

            {/* Sigorta Teklifi Butonu */}
            {showInsuranceBtn && (
              <div style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}>
                <div>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: 600, margin: 0 }}>
                    🛡️ Sigortan yok değil mi? Bu durumlardan seni koruyan bir poliçen olmalı!. 
                  </p>
                  <p style={{ color: "#adb5bd", fontSize: "12px", margin: "4px 0 0 0" }}>
                    Frekans Sigorta uzmanları sana ücretsiz danışmanlık için bekliyor.
                  </p>
                </div>
                <a
                  href="https://frekanssigorta.com.tr/anasayfa"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#e63946",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: "10px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}>
                  Bilgi Al →
                </a>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div style={{
          display: "flex",
          gap: "10px",
          background: "#fff",
          borderRadius: "14px",
          padding: "10px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
          marginTop: "auto",
        }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Durumunu yaz... (örn: evde gaz kokusu var)"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "15px",
              background: "transparent",
              color: "#1a1a2e",
            }}
          />
          <button onClick={() => handleSend()}
            style={{
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "15px",
            }}>
            Yardım Al
          </button>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "16px", color: "#adb5bd", fontSize: "12px" }}>
        Hay Aksi! — Beklenmedik anlarda yapay zeka destekli rehberiniz
      </footer>
    </div>
  );
}
