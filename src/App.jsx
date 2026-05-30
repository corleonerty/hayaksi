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
3. 📞 Başvurulacak kurumlar/hizmetler (asistans hatları, sigorta, resmi kurumlar)
4. 💡 Pratik ipuçları

Kısa, net ve Türkçe yaz. Panikletme, sakinleştir. Acil durumlarda her zaman 112'yi hatırlat.`;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStarted(true);
    setLoading(true);

    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("API key bulunamadı. Lütfen .env dosyasını kontrol edin.");
      }

      const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        system: SYSTEM_PROMPT,
      }),
    });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "API hatası");
      }

      const data = await res.json();
      const assistantMsg = { role: "assistant", content: data.content[0].text };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Bir hata oluştu: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setStarted(false);
    setSelectedCat(null);
    setInput("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "var(--primary)",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(230,57,70,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div onClick={reset} style={{ cursor: "pointer" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>😤 Hay Aksi!</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Aksiliğin çaresi burada</div>
        </div>
        {started && (
          <button onClick={reset} style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 20,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
          }}>
            ← Yeni Aksiliğim Var
          </button>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column" }}>
        {!started ? (
          /* Home Screen */
          <div style={{ padding: "32px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😤</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Ne oldu?
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
                Aksiliğini yaz, ne yapman gerektiğini söyleyelim.
              </p>
            </div>

            {/* Search box */}
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Örn: Su borusu patladı, ne yapmalıyım?"
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1.5px solid var(--border)",
                  fontSize: 15,
                  outline: "none",
                  background: "#fff",
                  boxShadow: "var(--shadow)",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 20px",
                  cursor: "pointer",
                  fontSize: 20,
                  opacity: input.trim() ? 1 : 0.5,
                }}
              >
                →
              </button>
            </div>

            {/* Categories */}
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, fontWeight: 500 }}>
              VEYA KATEGORİ SEÇ
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCat(selectedCat === cat.label ? null : cat.label)}
                  style={{
                    background: selectedCat === cat.label ? "#fff0f1" : "#fff",
                    border: `1.5px solid ${selectedCat === cat.label ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 12,
                    padding: "14px 8px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{cat.label}</div>
                </button>
              ))}
            </div>

            {/* Category examples */}
            {selectedCat && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {CATEGORIES.find((c) => c.label === selectedCat)?.examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => sendMessage(ex)}
                    style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      borderRadius: 20,
                      padding: "9px 16px",
                      fontSize: 13,
                      cursor: "pointer",
                      color: "var(--text)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)", marginTop: 32 }}>
              ⚠️ Acil durumlarda her zaman <strong>112</strong>'yi ara. Bu platform genel rehberlik amaçlıdır.
            </p>
          </div>
        ) : (
          /* Chat Screen */
          <div style={{ flex: 1, paddingTop: 16, paddingBottom: 100 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    background: msg.role === "user" ? "var(--primary)" : "#fff",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    boxShadow: "var(--shadow)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                <div style={{
                  background: "#fff",
                  padding: "12px 20px",
                  borderRadius: "18px 18px 18px 4px",
                  boxShadow: "var(--shadow)",
                  color: "var(--text-secondary)",
                  fontSize: 20,
                  letterSpacing: 4,
                }}>
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Sticky input bar (chat mode) */}
      {started && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          maxWidth: 720,
          margin: "0 auto",
          width: "100%",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ek soru sor..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 24,
              border: "1.5px solid var(--border)",
              fontSize: 15,
              outline: "none",
              background: "#f8f9fa",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 46,
              height: 46,
              cursor: "pointer",
              fontSize: 20,
              opacity: input.trim() && !loading ? 1 : 0.4,
              flexShrink: 0,
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
