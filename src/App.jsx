import { useState, useEffect, useRef } from "react";

// ── Fake data ──────────────────────────────────────────────
const DEMO_USERS = {
  klant: { email: "klant@demo.nl", ww: "klant123", rol: "klant", naam: "Jan de Vries" },
  admin: { email: "admin@multilux.nl", ww: "admin123", rol: "admin", naam: "Lisa Bakker" },
};

const PRODUCT_TYPES = [
  { id: "rolgordijn", label: "Rolgordijn", icon: "▦", kleuren: ["Wit", "Crème", "Grijs", "Antraciet", "Zwart", "Zand"] },
  { id: "jaloezie", label: "Jaloezie", icon: "☰", kleuren: ["Wit", "Zilver", "Hout Naturel", "Hout Donker", "Antraciet"] },
  { id: "plisse", label: "Plissé", icon: "⌇", kleuren: ["Wit", "Crème", "Lichtgrijs", "Taupe", "Antraciet", "Koraal"] },
  { id: "vouwgordijn", label: "Vouwgordijn", icon: "▤", kleuren: ["Wit", "Linnen", "Zand", "Grijs", "Donkerblauw"] },
  { id: "duorolgordijn", label: "Duo Rolgordijn", icon: "▥", kleuren: ["Wit", "Crème", "Grijs", "Zwart", "Taupe"] },
  { id: "houten-jaloezie", label: "Houten Jaloezie", icon: "▧", kleuren: ["Wit", "Naturel", "Eiken", "Walnoot", "Zwart"] },
];

const MONTAGETYPES = ["Plafond", "Muur", "In de dag", "Op de dag"];

// ── Styles ─────────────────────────────────────────────────
const fonts = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;500;600;700&display=swap');
`;

const vars = {
  "--ml-bg": "#F7F5F0",
  "--ml-surface": "#FFFFFF",
  "--ml-surface-alt": "#EDE9E1",
  "--ml-primary": "#2D4A3E",
  "--ml-primary-light": "#3D6454",
  "--ml-primary-dark": "#1E332B",
  "--ml-accent": "#C4956A",
  "--ml-accent-light": "#D4AA82",
  "--ml-text": "#1A1A1A",
  "--ml-text-light": "#6B6560",
  "--ml-border": "#D9D4CC",
  "--ml-error": "#C0392B",
  "--ml-success": "#27AE60",
  "--ml-warning": "#E67E22",
  "--ml-radius": "12px",
  "--ml-shadow": "0 2px 16px rgba(0,0,0,0.06)",
  "--ml-shadow-lg": "0 8px 32px rgba(0,0,0,0.10)",
  fontFamily: "'DM Sans', sans-serif",
};

// ── Helpers ────────────────────────────────────────────────
const fmt = (n) => `€ ${Number(n).toFixed(2).replace(".", ",")}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
const genId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const statusKleur = { nieuw: "#E67E22", verwerkt: "#2980B9", gereed: "#27AE60", geannuleerd: "#C0392B" };

// ── Components ─────────────────────────────────────────────

function Badge({ children, color }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: 1, padding: "3px 10px", borderRadius: 20,
      background: color + "18", color, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

function Btn({ children, variant = "primary", onClick, style, disabled, small }) {
  const base = {
    fontFamily: vars.fontFamily, fontWeight: 600, fontSize: small ? 13 : 14,
    border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    padding: small ? "7px 16px" : "12px 28px", transition: "all .2s",
    opacity: disabled ? 0.5 : 1, letterSpacing: 0.3,
  };
  const styles = {
    primary: { ...base, background: "var(--ml-primary)", color: "#fff" },
    accent: { ...base, background: "var(--ml-accent)", color: "#fff" },
    outline: { ...base, background: "transparent", color: "var(--ml-primary)", border: "1.5px solid var(--ml-primary)" },
    ghost: { ...base, background: "transparent", color: "var(--ml-text-light)", padding: small ? "7px 12px" : "12px 18px" },
    danger: { ...base, background: "var(--ml-error)", color: "#fff" },
  };
  return <button style={{ ...styles[variant], ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, suffix, error, options, style: sx }) {
  if (options) {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sx }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ml-text-light)" }}>{label}</span>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{
            fontFamily: vars.fontFamily, fontSize: 14, padding: "10px 14px",
            border: `1.5px solid ${error ? "var(--ml-error)" : "var(--ml-border)"}`,
            borderRadius: 8, background: "#fff", color: "var(--ml-text)", outline: "none",
          }}>
          <option value="">— Selecteer —</option>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
        {error && <span style={{ fontSize: 12, color: "var(--ml-error)" }}>{error}</span>}
      </label>
    );
  }
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...sx }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ml-text-light)" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            fontFamily: vars.fontFamily, fontSize: 14, padding: "10px 14px",
            paddingRight: suffix ? 50 : 14, width: "100%", boxSizing: "border-box",
            border: `1.5px solid ${error ? "var(--ml-error)" : "var(--ml-border)"}`,
            borderRadius: 8, background: "#fff", color: "var(--ml-text)", outline: "none",
          }} />
        {suffix && <span style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 13, color: "var(--ml-text-light)", fontWeight: 500,
        }}>{suffix}</span>}
      </div>
      {error && <span style={{ fontSize: 12, color: "var(--ml-error)" }}>{error}</span>}
    </label>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "var(--ml-surface)", borderRadius: "var(--ml-radius)",
      boxShadow: "var(--ml-shadow)", padding: 28, ...style,
    }}>{children}</div>
  );
}

// ── LOGIN ──────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [ww, setWw] = useState("");
  const [err, setErr] = useState("");
  const [anim, setAnim] = useState(false);

  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  const handleLogin = () => {
    const user = Object.values(DEMO_USERS).find(u => u.email === email && u.ww === ww);
    if (user) { onLogin(user); }
    else { setErr("Ongeldig e-mailadres of wachtwoord"); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", background: "var(--ml-primary-dark)",
      fontFamily: vars.fontFamily,
    }}>
      {/* Left panel - branding */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: 60, position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg, #1E332B 0%, #2D4A3E 50%, #3D6454 100%)",
      }}>
        {/* Decorative shapes */}
        <div style={{
          position: "absolute", top: -100, right: -100, width: 400, height: 400,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60, width: 250, height: 250,
          borderRadius: "50%", background: "rgba(196,149,106,0.08)",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "10%", width: 120, height: 120,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)",
        }} />

        <div style={{
          opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(.23,1,.32,1)", textAlign: "center", zIndex: 1,
        }}>
          <div style={{ fontSize: 56, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#fff", letterSpacing: -1 }}>
            Multi<span style={{ color: "var(--ml-accent)" }}>lux</span>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 4, textTransform: "uppercase", marginTop: 12 }}>
            Binnenzonwering
          </div>
          <div style={{
            width: 50, height: 2, background: "var(--ml-accent)", margin: "32px auto",
            borderRadius: 1,
          }} />
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 340 }}>
            Bestel uw zonwering op maat.<br />Snel, eenvoudig en betrouwbaar.
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        width: 480, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: 60, background: "var(--ml-bg)",
        opacity: anim ? 1 : 0, transform: anim ? "translateX(0)" : "translateX(40px)",
        transition: "all 0.8s cubic-bezier(.23,1,.32,1) 0.2s",
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 8px" }}>Welkom terug</h2>
        <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 36px" }}>
          Log in op uw Multilux account
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Input label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="uw@email.nl" />
          <Input label="Wachtwoord" type="password" value={ww} onChange={setWw} placeholder="••••••••" />
        </div>

        {err && (
          <div style={{
            marginTop: 16, padding: "10px 16px", borderRadius: 8,
            background: "var(--ml-error)10", color: "var(--ml-error)",
            fontSize: 13, fontWeight: 500,
          }}>⚠ {err}</div>
        )}

        <Btn onClick={handleLogin} style={{ marginTop: 28, width: "100%", padding: "14px 28px", fontSize: 15 }}>
          Inloggen →
        </Btn>

        <div style={{
          marginTop: 40, padding: "20px 24px", background: "var(--ml-surface-alt)",
          borderRadius: 10, fontSize: 13, color: "var(--ml-text-light)", lineHeight: 1.7,
        }}>
          <strong style={{ color: "var(--ml-text)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Demo accounts</strong><br />
          <span style={{ fontFamily: "monospace" }}>klant@demo.nl</span> / klant123 — Klant<br />
          <span style={{ fontFamily: "monospace" }}>admin@multilux.nl</span> / admin123 — Beheerder
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR NAV ────────────────────────────────────────────
function Sidebar({ user, actief, onNav, onLogout }) {
  const isAdmin = user.rol === "admin";
  const items = isAdmin
    ? [
        { id: "dashboard", label: "Dashboard", icon: "◫" },
        { id: "bestellingen", label: "Bestellingen", icon: "☰" },
        { id: "klanten", label: "Klanten", icon: "◉" },
      ]
    : [
        { id: "bestellen", label: "Nieuwe Bestelling", icon: "＋" },
        { id: "mijn-bestellingen", label: "Mijn Bestellingen", icon: "☰" },
      ];

  return (
    <div style={{
      width: 250, minHeight: "100vh", background: "var(--ml-primary-dark)",
      display: "flex", flexDirection: "column", padding: "28px 0",
      fontFamily: vars.fontFamily,
    }}>
      <div style={{ padding: "0 28px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#fff" }}>
          Multi<span style={{ color: "var(--ml-accent)" }}>lux</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              border: "none", borderRadius: 8, cursor: "pointer",
              background: actief === it.id ? "rgba(255,255,255,0.1)" : "transparent",
              color: actief === it.id ? "#fff" : "rgba(255,255,255,0.55)",
              fontSize: 14, fontWeight: actief === it.id ? 600 : 400,
              fontFamily: vars.fontFamily, transition: "all .15s", textAlign: "left",
            }}>
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "20px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500, marginBottom: 4 }}>{user.naam}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>{user.email}</div>
        <Btn variant="ghost" small onClick={onLogout}
          style={{ color: "rgba(255,255,255,0.4)", padding: "6px 0", fontSize: 12 }}>
          Uitloggen
        </Btn>
      </div>
    </div>
  );
}

// ── KLANT: BESTELFORMULIER ─────────────────────────────────
function BestelForm({ onBestel }) {
  const [product, setProduct] = useState("");
  const [kleur, setKleur] = useState("");
  const [breedte, setBreedte] = useState("");
  const [hoogte, setHoogte] = useState("");
  const [montage, setMontage] = useState("");
  const [aantal, setAantal] = useState("1");
  const [opmerking, setOpmerking] = useState("");
  const [errors, setErrors] = useState({});
  const [succes, setSucces] = useState(false);

  const gekozenProduct = PRODUCT_TYPES.find(p => p.id === product);

  const validate = () => {
    const e = {};
    if (!product) e.product = "Selecteer een product";
    if (!kleur) e.kleur = "Selecteer een kleur";
    if (!breedte || breedte < 20) e.breedte = "Min. 20 cm";
    if (!hoogte || hoogte < 20) e.hoogte = "Min. 20 cm";
    if (breedte > 400) e.breedte = "Max. 400 cm";
    if (hoogte > 350) e.hoogte = "Max. 350 cm";
    if (!montage) e.montage = "Selecteer montagetype";
    if (!aantal || aantal < 1) e.aantal = "Min. 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onBestel({
      id: genId(), product, kleur, breedte: +breedte, hoogte: +hoogte,
      montage, aantal: +aantal, opmerking, datum: new Date().toISOString(), status: "nieuw",
    });
    setSucces(true);
    setTimeout(() => {
      setSucces(false);
      setProduct(""); setKleur(""); setBreedte(""); setHoogte("");
      setMontage(""); setAantal("1"); setOpmerking(""); setErrors({});
    }, 3000);
  };

  if (succes) {
    return (
      <div style={{ padding: 40 }}>
        <Card style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ml-primary)", margin: "0 0 8px" }}>
            Bestelling geplaatst!
          </h2>
          <p style={{ color: "var(--ml-text-light)", fontSize: 14 }}>
            Uw bestelling wordt zo snel mogelijk verwerkt.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>
        Nieuwe Bestelling
      </h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 32px" }}>
        Vul de maten en specificaties van uw binnenzonwering in.
      </p>

      {/* Product selectie */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "var(--ml-primary)" }}>
          1. Kies uw product
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {PRODUCT_TYPES.map(p => (
            <button key={p.id} onClick={() => { setProduct(p.id); setKleur(""); }}
              style={{
                padding: "20px 16px", border: `2px solid ${product === p.id ? "var(--ml-primary)" : "var(--ml-border)"}`,
                borderRadius: 10, background: product === p.id ? "var(--ml-primary)08" : "#fff",
                cursor: "pointer", textAlign: "center", transition: "all .15s",
                fontFamily: vars.fontFamily,
              }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: product === p.id ? 600 : 400,
                color: product === p.id ? "var(--ml-primary)" : "var(--ml-text)" }}>{p.label}</div>
            </button>
          ))}
        </div>
        {errors.product && <span style={{ fontSize: 12, color: "var(--ml-error)", marginTop: 8, display: "block" }}>{errors.product}</span>}
      </Card>

      {/* Specificaties */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "var(--ml-primary)" }}>
          2. Specificaties
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Input label="Kleur" value={kleur} onChange={setKleur} error={errors.kleur}
            options={gekozenProduct ? gekozenProduct.kleuren : []} />
          <Input label="Montagetype" value={montage} onChange={setMontage} error={errors.montage}
            options={MONTAGETYPES} />
        </div>
      </Card>

      {/* Maten */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "var(--ml-primary)" }}>
          3. Maten invoeren
        </h3>
        <p style={{ fontSize: 13, color: "var(--ml-text-light)", margin: "0 0 20px" }}>
          Meet de exacte binnenafmetingen van uw raamkozijn in centimeters.
        </p>

        {/* Visual helper */}
        <div style={{
          display: "flex", justifyContent: "center", marginBottom: 28, padding: 20,
          background: "var(--ml-surface-alt)", borderRadius: 10,
        }}>
          <svg width="200" height="160" viewBox="0 0 200 160">
            <rect x="30" y="10" width="140" height="120" fill="none" stroke="var(--ml-primary)" strokeWidth="2" rx="2" />
            <line x1="30" y1="140" x2="170" y2="140" stroke="var(--ml-accent)" strokeWidth="2" />
            <line x1="25" y1="140" x2="35" y2="140" stroke="var(--ml-accent)" strokeWidth="2" />
            <line x1="165" y1="140" x2="175" y2="140" stroke="var(--ml-accent)" strokeWidth="2" />
            <text x="100" y="154" textAnchor="middle" fill="var(--ml-accent)" fontSize="11" fontWeight="600">
              Breedte: {breedte || "—"} cm
            </text>
            <line x1="190" y1="10" x2="190" y2="130" stroke="var(--ml-accent)" strokeWidth="2" />
            <line x1="185" y1="10" x2="195" y2="10" stroke="var(--ml-accent)" strokeWidth="2" />
            <line x1="185" y1="130" x2="195" y2="130" stroke="var(--ml-accent)" strokeWidth="2" />
            <text x="188" y="75" textAnchor="middle" fill="var(--ml-accent)" fontSize="11" fontWeight="600"
              transform="rotate(90 188 75)">
              Hoogte: {hoogte || "—"} cm
            </text>
            {/* Blinds illustration */}
            {[0,1,2,3,4,5,6,7].map(i => (
              <line key={i} x1="36" y1={18 + i * 14} x2="164" y2={18 + i * 14}
                stroke="var(--ml-primary)" strokeWidth="0.5" opacity="0.25" />
            ))}
          </svg>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <Input label="Breedte" type="number" value={breedte} onChange={setBreedte}
            placeholder="bijv. 120" suffix="cm" error={errors.breedte} />
          <Input label="Hoogte" type="number" value={hoogte} onChange={setHoogte}
            placeholder="bijv. 160" suffix="cm" error={errors.hoogte} />
          <Input label="Aantal" type="number" value={aantal} onChange={setAantal}
            placeholder="1" error={errors.aantal} />
        </div>
      </Card>

      {/* Opmerking */}
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-primary)" }}>
          4. Opmerkingen (optioneel)
        </h3>
        <textarea value={opmerking} onChange={e => setOpmerking(e.target.value)}
          placeholder="Bijv. speciale montagewensen, draairichting, etc."
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box", fontFamily: vars.fontFamily,
            fontSize: 14, padding: "12px 14px", border: "1.5px solid var(--ml-border)",
            borderRadius: 8, resize: "vertical", outline: "none",
          }} />
      </Card>

      <Btn onClick={handleSubmit} style={{ padding: "14px 48px", fontSize: 15 }}>
        Bestelling plaatsen →
      </Btn>
    </div>
  );
}

// ── KLANT: MIJN BESTELLINGEN ───────────────────────────────
function MijnBestellingen({ bestellingen }) {
  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>
        Mijn Bestellingen
      </h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>
        Overzicht van al uw geplaatste bestellingen.
      </p>

      {bestellingen.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "60px 40px", color: "var(--ml-text-light)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15 }}>U heeft nog geen bestellingen geplaatst.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bestellingen.map(b => {
            const prod = PRODUCT_TYPES.find(p => p.id === b.product);
            return (
              <Card key={b.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, background: "var(--ml-surface-alt)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    }}>{prod?.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ml-text)" }}>
                        {prod?.label} — {b.kleur}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ml-text-light)", marginTop: 2 }}>
                        {b.breedte} × {b.hoogte} cm · {b.montage} · {b.aantal}×
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={statusKleur[b.status]}>{b.status}</Badge>
                    <div style={{ fontSize: 12, color: "var(--ml-text-light)", marginTop: 6 }}>
                      #{b.id} · {fmtDate(b.datum)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ADMIN: DASHBOARD ───────────────────────────────────────
function AdminDashboard({ bestellingen }) {
  const stats = {
    totaal: bestellingen.length,
    nieuw: bestellingen.filter(b => b.status === "nieuw").length,
    verwerkt: bestellingen.filter(b => b.status === "verwerkt").length,
    gereed: bestellingen.filter(b => b.status === "gereed").length,
  };

  const statCards = [
    { label: "Totaal", waarde: stats.totaal, kleur: "var(--ml-primary)", icon: "☰" },
    { label: "Nieuw", waarde: stats.nieuw, kleur: "var(--ml-warning)", icon: "●" },
    { label: "In Behandeling", waarde: stats.verwerkt, kleur: "#2980B9", icon: "◐" },
    { label: "Gereed", waarde: stats.gereed, kleur: "var(--ml-success)", icon: "✓" },
  ];

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>
        Overzicht van alle bestellingen
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--ml-text-light)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: s.kleur, marginTop: 8, fontFamily: "'Playfair Display', serif" }}>
                  {s.waarde}
                </div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: s.kleur + "12",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: s.kleur,
              }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent orders mini table */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-primary)" }}>
          Recente Bestellingen
        </h3>
        {bestellingen.length === 0 ? (
          <p style={{ color: "var(--ml-text-light)", fontSize: 14 }}>Nog geen bestellingen.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--ml-surface-alt)" }}>
                {["Order", "Product", "Maten", "Status", "Datum"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 12px", color: "var(--ml-text-light)",
                    fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bestellingen.slice(-8).reverse().map(b => {
                const prod = PRODUCT_TYPES.find(p => p.id === b.product);
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--ml-surface-alt)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, fontFamily: "monospace" }}>#{b.id}</td>
                    <td style={{ padding: "10px 12px" }}>{prod?.label} – {b.kleur}</td>
                    <td style={{ padding: "10px 12px" }}>{b.breedte}×{b.hoogte} cm</td>
                    <td style={{ padding: "10px 12px" }}><Badge color={statusKleur[b.status]}>{b.status}</Badge></td>
                    <td style={{ padding: "10px 12px", color: "var(--ml-text-light)" }}>{fmtDate(b.datum)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── ADMIN: ALLE BESTELLINGEN ───────────────────────────────
function AdminBestellingen({ bestellingen, onStatusUpdate }) {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Bestellingen</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>
        Beheer en verwerk alle binnenkomende bestellingen.
      </p>

      {bestellingen.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 48, color: "var(--ml-text-light)" }}>
          Nog geen bestellingen ontvangen.
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...bestellingen].reverse().map(b => {
            const prod = PRODUCT_TYPES.find(p => p.id === b.product);
            return (
              <Card key={b.id} style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 10, background: "var(--ml-surface-alt)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                    }}>{prod?.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{prod?.label} — {b.kleur}</div>
                      <div style={{ fontSize: 13, color: "var(--ml-text-light)", marginTop: 4 }}>
                        {b.breedte} × {b.hoogte} cm · {b.montage} · Aantal: {b.aantal}
                      </div>
                      {b.opmerking && (
                        <div style={{
                          marginTop: 8, fontSize: 12, color: "var(--ml-text-light)",
                          fontStyle: "italic", padding: "6px 10px",
                          background: "var(--ml-surface-alt)", borderRadius: 6,
                        }}>💬 {b.opmerking}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--ml-text-light)", fontFamily: "monospace" }}>
                      #{b.id} · {fmtDate(b.datum)}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["nieuw", "verwerkt", "gereed", "geannuleerd"].map(s => (
                        <button key={s} onClick={() => onStatusUpdate(b.id, s)}
                          style={{
                            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: 0.5, padding: "5px 12px", borderRadius: 6,
                            cursor: "pointer", fontFamily: vars.fontFamily,
                            background: b.status === s ? statusKleur[s] + "18" : "transparent",
                            color: b.status === s ? statusKleur[s] : "var(--ml-text-light)",
                            border: b.status === s ? `1.5px solid ${statusKleur[s]}44` : "1.5px solid var(--ml-border)",
                            transition: "all .15s",
                          }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ADMIN: KLANTEN ─────────────────────────────────────────
function AdminKlanten() {
  const klanten = [
    { naam: "Jan de Vries", email: "klant@demo.nl", bestellingen: 3, laatst: "2026-04-10" },
    { naam: "Petra Jansen", email: "petra@voorbeeld.nl", bestellingen: 7, laatst: "2026-04-12" },
    { naam: "Mark Visser", email: "mark@voorbeeld.nl", bestellingen: 1, laatst: "2026-03-28" },
  ];

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Klanten</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>
        Overzicht van geregistreerde klanten.
      </p>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--ml-surface-alt)" }}>
              {["Klant", "E-mail", "Bestellingen", "Laatst Actief"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "12px 14px", color: "var(--ml-text-light)",
                  fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {klanten.map(k => (
              <tr key={k.email} style={{ borderBottom: "1px solid var(--ml-surface-alt)" }}>
                <td style={{ padding: "14px", fontWeight: 600 }}>{k.naam}</td>
                <td style={{ padding: "14px", color: "var(--ml-text-light)" }}>{k.email}</td>
                <td style={{ padding: "14px" }}>{k.bestellingen}</td>
                <td style={{ padding: "14px", color: "var(--ml-text-light)" }}>{fmtDate(k.laatst)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────
export default function MultiluxApp() {
  const [user, setUser] = useState(null);
  const [pagina, setPagina] = useState("");
  const [bestellingen, setBestellingen] = useState([
    { id: "A1B2C3D4", product: "rolgordijn", kleur: "Antraciet", breedte: 120, hoogte: 160, montage: "Plafond", aantal: 2, opmerking: "", datum: "2026-04-10T10:30:00Z", status: "verwerkt" },
    { id: "E5F6G7H8", product: "plisse", kleur: "Wit", breedte: 90, hoogte: 140, montage: "In de dag", aantal: 1, opmerking: "Graag extra snoer", datum: "2026-04-12T14:15:00Z", status: "nieuw" },
    { id: "I9J0K1L2", product: "jaloezie", kleur: "Hout Naturel", breedte: 150, hoogte: 180, montage: "Muur", aantal: 3, opmerking: "", datum: "2026-04-08T09:00:00Z", status: "gereed" },
  ]);

  const onLogin = (u) => {
    setUser(u);
    setPagina(u.rol === "admin" ? "dashboard" : "bestellen");
  };

  const onBestel = (b) => setBestellingen(prev => [...prev, b]);

  const onStatusUpdate = (id, status) => {
    setBestellingen(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  if (!user) {
    return (
      <>
        <style>{fonts}</style>
        <div style={vars}><LoginPage onLogin={onLogin} /></div>
      </>
    );
  }

  const renderPage = () => {
    if (user.rol === "admin") {
      switch (pagina) {
        case "dashboard": return <AdminDashboard bestellingen={bestellingen} />;
        case "bestellingen": return <AdminBestellingen bestellingen={bestellingen} onStatusUpdate={onStatusUpdate} />;
        case "klanten": return <AdminKlanten />;
        default: return <AdminDashboard bestellingen={bestellingen} />;
      }
    } else {
      switch (pagina) {
        case "bestellen": return <BestelForm onBestel={onBestel} />;
        case "mijn-bestellingen": return <MijnBestellingen bestellingen={bestellingen} />;
        default: return <BestelForm onBestel={onBestel} />;
      }
    }
  };

  return (
    <>
      <style>{fonts}</style>
      <div style={{ ...vars, display: "flex", minHeight: "100vh", background: "var(--ml-bg)", fontFamily: vars.fontFamily }}>
        <Sidebar user={user} actief={pagina} onNav={setPagina} onLogout={() => setUser(null)} />
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </>
  );
}
