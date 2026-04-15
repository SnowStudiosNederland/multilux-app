import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;500;600;700&display=swap');`;

const vars = {
  "--ml-bg": "#F7F5F0", "--ml-surface": "#FFFFFF", "--ml-surface-alt": "#EDE9E1",
  "--ml-primary": "#2D4A3E", "--ml-primary-light": "#3D6454", "--ml-primary-dark": "#1E332B",
  "--ml-accent": "#C4956A", "--ml-accent-light": "#D4AA82",
  "--ml-text": "#1A1A1A", "--ml-text-light": "#6B6560", "--ml-border": "#D9D4CC",
  "--ml-error": "#C0392B", "--ml-success": "#27AE60", "--ml-warning": "#E67E22",
  "--ml-radius": "12px", "--ml-shadow": "0 2px 16px rgba(0,0,0,0.06)",
  "--ml-shadow-lg": "0 8px 32px rgba(0,0,0,0.10)", fontFamily: "'DM Sans', sans-serif",
};

const MONTAGETYPES = ["Plafond", "Muur", "In de dag", "Op de dag"];
const statusKleur = { nieuw: "#E67E22", verwerkt: "#2980B9", gereed: "#27AE60", geannuleerd: "#C0392B" };
const fmtDate = (d) => new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
const genOrderNr = () => "ML-" + Math.random().toString(36).slice(2, 8).toUpperCase();

function Badge({ children, color }) {
  return (<span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, padding: "3px 10px", borderRadius: 20, background: color + "18", color, border: `1px solid ${color}44` }}>{children}</span>);
}

function Btn({ children, variant = "primary", onClick, style, disabled, small }) {
  const base = { fontFamily: vars.fontFamily, fontWeight: 600, fontSize: small ? 13 : 14, border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", padding: small ? "7px 16px" : "12px 28px", transition: "all .2s", opacity: disabled ? 0.5 : 1, letterSpacing: 0.3 };
  const styles = {
    primary: { ...base, background: "var(--ml-primary)", color: "#fff" },
    accent: { ...base, background: "var(--ml-accent)", color: "#fff" },
    outline: { ...base, background: "transparent", color: "var(--ml-primary)", border: "1.5px solid var(--ml-primary)" },
    ghost: { ...base, background: "transparent", color: "var(--ml-text-light)", padding: small ? "7px 12px" : "12px 18px" },
    danger: { ...base, background: "var(--ml-error)", color: "#fff" },
    success: { ...base, background: "var(--ml-success)", color: "#fff" },
  };
  return <button style={{ ...styles[variant], ...style }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, suffix, error, options, style: sx }) {
  if (options) {
    return (<label style={{ display: "flex", flexDirection: "column", gap: 6, ...sx }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--ml-text-light)" }}>{label}</span><select value={value} onChange={e => onChange(e.target.value)} style={{ fontFamily: vars.fontFamily, fontSize: 14, padding: "10px 14px", border: `1.5px solid ${error ? "var(--ml-error)" : "var(--ml-border)"}`, borderRadius: 8, background: "#fff", color: "var(--ml-text)", outline: "none" }}><option value="">— Selecteer —</option>{options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}</select>{error && <span style={{ fontSize: 12, color: "var(--ml-error)" }}>{error}</span>}</label>);
  }
  return (<label style={{ display: "flex", flexDirection: "column", gap: 6, ...sx }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--ml-text-light)" }}>{label}</span><div style={{ position: "relative" }}><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ fontFamily: vars.fontFamily, fontSize: 14, padding: "10px 14px", paddingRight: suffix ? 50 : 14, width: "100%", boxSizing: "border-box", border: `1.5px solid ${error ? "var(--ml-error)" : "var(--ml-border)"}`, borderRadius: 8, background: "#fff", color: "var(--ml-text)", outline: "none" }} />{suffix && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ml-text-light)", fontWeight: 500 }}>{suffix}</span>}</div>{error && <span style={{ fontSize: 12, color: "var(--ml-error)" }}>{error}</span>}</label>);
}

function Card({ children, style }) {
  return (<div style={{ background: "var(--ml-surface)", borderRadius: "var(--ml-radius)", boxShadow: "var(--ml-shadow)", padding: 28, ...style }}>{children}</div>);
}

function Loader() {
  return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}><div style={{ width: 36, height: 36, border: "3px solid var(--ml-border)", borderTopColor: "var(--ml-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>);
}

function WachtScherm({ profiel, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ml-bg)", fontFamily: vars.fontFamily }}>
      <Card style={{ maxWidth: 480, textAlign: "center", padding: "60px 48px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--ml-warning)15", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 36 }}>⏳</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 12px" }}>Account in afwachting</h2>
        <p style={{ fontSize: 15, color: "var(--ml-text-light)", lineHeight: 1.7, margin: "0 0 8px" }}>Bedankt voor uw registratie, <strong>{profiel.naam}</strong>.</p>
        <p style={{ fontSize: 14, color: "var(--ml-text-light)", lineHeight: 1.7, margin: "0 0 32px" }}>Uw account moet nog worden goedgekeurd door een beheerder. U ontvangt een bericht zodra uw account is geactiveerd.</p>
        <div style={{ padding: "16px 20px", background: "var(--ml-surface-alt)", borderRadius: 10, fontSize: 13, color: "var(--ml-text-light)", marginBottom: 28 }}><strong>Geregistreerd als:</strong><br />{profiel.email}</div>
        <Btn variant="ghost" onClick={onLogout}>Uitloggen</Btn>
      </Card>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [ww, setWw] = useState("");
  const [naam, setNaam] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [anim, setAnim] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: ww });
    setLoading(false);
    if (error) { setErr("Ongeldig e-mailadres of wachtwoord"); return; }
    onLogin(data.user);
  };

  const handleRegister = async () => {
    setErr(""); setLoading(true);
    if (!naam.trim()) { setErr("Vul een naam in"); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password: ww, options: { data: { naam: naam.trim(), rol: "klant" } } });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSuccess("Account aangemaakt! Een beheerder moet uw account nog goedkeuren voordat u kunt inloggen.");
    setMode("login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--ml-primary-dark)", fontFamily: vars.fontFamily }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 60, position: "relative", overflow: "hidden", background: "linear-gradient(145deg, #1E332B 0%, #2D4A3E 50%, #3D6454 100%)" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "rgba(196,149,106,0.08)" }} />
        <div style={{ opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(.23,1,.32,1)", textAlign: "center", zIndex: 1 }}>
          <div style={{ fontSize: 56, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#fff", letterSpacing: -1 }}>Multi<span style={{ color: "var(--ml-accent)" }}>lux</span></div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 4, textTransform: "uppercase", marginTop: 12 }}>Binnenzonwering</div>
          <div style={{ width: 50, height: 2, background: "var(--ml-accent)", margin: "32px auto", borderRadius: 1 }} />
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 340 }}>Bestel uw zonwering op maat.<br />Snel, eenvoudig en betrouwbaar.</p>
        </div>
      </div>
      <div style={{ width: 480, display: "flex", flexDirection: "column", justifyContent: "center", padding: 60, background: "var(--ml-bg)", opacity: anim ? 1 : 0, transform: anim ? "translateX(0)" : "translateX(40px)", transition: "all 0.8s cubic-bezier(.23,1,.32,1) 0.2s" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 8px" }}>{mode === "login" ? "Welkom terug" : "Account aanmaken"}</h2>
        <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 36px" }}>{mode === "login" ? "Log in op uw Multilux account" : "Registreer als nieuwe klant"}</p>
        {success && (<div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: 8, background: "var(--ml-success)15", color: "var(--ml-success)", fontSize: 13, fontWeight: 500 }}>✓ {success}</div>)}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {mode === "register" && (<Input label="Naam" value={naam} onChange={setNaam} placeholder="Uw volledige naam" />)}
          <Input label="E-mailadres" type="email" value={email} onChange={setEmail} placeholder="uw@email.nl" />
          <Input label="Wachtwoord" type="password" value={ww} onChange={setWw} placeholder="••••••••" />
        </div>
        {err && (<div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 8, background: "var(--ml-error)10", color: "var(--ml-error)", fontSize: 13, fontWeight: 500 }}>⚠ {err}</div>)}
        <Btn onClick={mode === "login" ? handleLogin : handleRegister} disabled={loading} style={{ marginTop: 28, width: "100%", padding: "14px 28px", fontSize: 15 }}>{loading ? "Even geduld..." : mode === "login" ? "Inloggen →" : "Registreren →"}</Btn>
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setSuccess(""); }} style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", color: "var(--ml-primary)", fontSize: 14, fontFamily: vars.fontFamily, fontWeight: 500 }}>{mode === "login" ? "Nog geen account? Registreer hier" : "Heb al een account? Log in"}</button>
      </div>
    </div>
  );
}

function Sidebar({ profiel, actief, onNav, onLogout, aantalWachtend }) {
  const isAdmin = profiel?.rol === "admin";
  const items = isAdmin
    ? [{ id: "dashboard", label: "Dashboard", icon: "◫" }, { id: "bestellingen", label: "Bestellingen", icon: "☰" }, { id: "klanten", label: "Klanten", icon: "◉", badge: aantalWachtend }, { id: "producten", label: "Producten", icon: "▦" }]
    : [{ id: "bestellen", label: "Nieuwe Bestelling", icon: "＋" }, { id: "mijn-bestellingen", label: "Mijn Bestellingen", icon: "☰" }];

  return (
    <div style={{ width: 250, minHeight: "100vh", background: "var(--ml-primary-dark)", display: "flex", flexDirection: "column", padding: "28px 0", fontFamily: vars.fontFamily }}>
      <div style={{ padding: "0 28px 32px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#fff" }}>Multi<span style={{ color: "var(--ml-accent)" }}>lux</span></div>
      </div>
      <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onNav(it.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none", borderRadius: 8, cursor: "pointer", background: actief === it.id ? "rgba(255,255,255,0.1)" : "transparent", color: actief === it.id ? "#fff" : "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: actief === it.id ? 600 : 400, fontFamily: vars.fontFamily, transition: "all .15s", textAlign: "left" }}>
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{it.icon}</span>
            {it.label}
            {it.badge > 0 && (<span style={{ marginLeft: "auto", background: "var(--ml-error)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{it.badge}</span>)}
          </button>
        ))}
      </nav>
      <div style={{ padding: "20px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500, marginBottom: 4 }}>{profiel?.naam}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{profiel?.email}</div>
        <Badge color={profiel?.rol === "admin" ? "#E67E22" : "#27AE60"}>{profiel?.rol}</Badge><br />
        <Btn variant="ghost" small onClick={onLogout} style={{ color: "rgba(255,255,255,0.4)", padding: "6px 0", fontSize: 12, marginTop: 12 }}>Uitloggen</Btn>
      </div>
    </div>
  );
}

function BestelForm({ profiel, producten, onBesteld }) {
  const [productId, setProductId] = useState("");
  const [kleur, setKleur] = useState("");
  const [breedte, setBreedte] = useState("");
  const [hoogte, setHoogte] = useState("");
  const [montage, setMontage] = useState("");
  const [aantal, setAantal] = useState("1");
  const [opmerking, setOpmerking] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);
  const gekozenProduct = producten.find(p => p.id === productId);

  const validate = () => {
    const e = {};
    if (!productId) e.product = "Selecteer een product";
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

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.from("bestellingen").insert({ order_nr: genOrderNr(), klant_id: profiel.id, product_id: productId, kleur, breedte: +breedte, hoogte: +hoogte, montage, aantal: +aantal, opmerking });
    setLoading(false);
    if (error) { alert("Fout bij plaatsen bestelling: " + error.message); return; }
    setSucces(true);
    onBesteld();
    setTimeout(() => { setSucces(false); setProductId(""); setKleur(""); setBreedte(""); setHoogte(""); setMontage(""); setAantal("1"); setOpmerking(""); setErrors({}); }, 3000);
  };

  if (succes) {
    return (<div style={{ padding: 40 }}><Card style={{ textAlign: "center", padding: "60px 40px" }}><div style={{ fontSize: 52, marginBottom: 16 }}>✓</div><h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ml-primary)", margin: "0 0 8px" }}>Bestelling geplaatst!</h2><p style={{ color: "var(--ml-text-light)", fontSize: 14 }}>Uw bestelling wordt zo snel mogelijk verwerkt.</p></Card></div>);
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Nieuwe Bestelling</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 32px" }}>Vul de maten en specificaties van uw binnenzonwering in.</p>
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "var(--ml-primary)" }}>1. Kies uw product</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {producten.map(p => (
            <button key={p.id} onClick={() => { if (p.actief) { setProductId(p.id); setKleur(""); } }} style={{ padding: "20px 16px", border: `2px solid ${productId === p.id && p.actief ? "var(--ml-primary)" : "var(--ml-border)"}`, borderRadius: 10, background: productId === p.id && p.actief ? "var(--ml-primary)08" : p.actief ? "#fff" : "#f5f5f5", cursor: p.actief ? "pointer" : "not-allowed", textAlign: "center", transition: "all .15s", fontFamily: vars.fontFamily, opacity: p.actief ? 1 : 0.6, position: "relative" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: productId === p.id && p.actief ? 600 : 400, color: productId === p.id && p.actief ? "var(--ml-primary)" : "var(--ml-text)" }}>{p.naam}</div>
              {!p.actief && <div style={{ fontSize: 11, color: "var(--ml-error)", fontWeight: 600, marginTop: 6 }}>Tijdelijk niet leverbaar</div>}
            </button>
          ))}
        </div>
        {errors.product && <span style={{ fontSize: 12, color: "var(--ml-error)", marginTop: 8, display: "block" }}>{errors.product}</span>}
      </Card>
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px", color: "var(--ml-primary)" }}>2. Specificaties</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Input label="Kleur" value={kleur} onChange={setKleur} error={errors.kleur} options={gekozenProduct ? gekozenProduct.kleuren : []} />
          <Input label="Montagetype" value={montage} onChange={setMontage} error={errors.montage} options={MONTAGETYPES} />
        </div>
      </Card>
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "var(--ml-primary)" }}>3. Maten invoeren</h3>
        <p style={{ fontSize: 13, color: "var(--ml-text-light)", margin: "0 0 20px" }}>Meet de exacte binnenafmetingen van uw raamkozijn in centimeters.</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, padding: 20, background: "var(--ml-surface-alt)", borderRadius: 10 }}>
          <svg width="200" height="160" viewBox="0 0 200 160">
            <rect x="30" y="10" width="140" height="120" fill="none" stroke="var(--ml-primary)" strokeWidth="2" rx="2" />
            <line x1="30" y1="140" x2="170" y2="140" stroke="var(--ml-accent)" strokeWidth="2" /><line x1="25" y1="140" x2="35" y2="140" stroke="var(--ml-accent)" strokeWidth="2" /><line x1="165" y1="140" x2="175" y2="140" stroke="var(--ml-accent)" strokeWidth="2" />
            <text x="100" y="154" textAnchor="middle" fill="var(--ml-accent)" fontSize="11" fontWeight="600">Breedte: {breedte || "—"} cm</text>
            <line x1="190" y1="10" x2="190" y2="130" stroke="var(--ml-accent)" strokeWidth="2" /><line x1="185" y1="10" x2="195" y2="10" stroke="var(--ml-accent)" strokeWidth="2" /><line x1="185" y1="130" x2="195" y2="130" stroke="var(--ml-accent)" strokeWidth="2" />
            <text x="188" y="75" textAnchor="middle" fill="var(--ml-accent)" fontSize="11" fontWeight="600" transform="rotate(90 188 75)">Hoogte: {hoogte || "—"} cm</text>
            {[0,1,2,3,4,5,6,7].map(i => (<line key={i} x1="36" y1={18 + i * 14} x2="164" y2={18 + i * 14} stroke="var(--ml-primary)" strokeWidth="0.5" opacity="0.25" />))}
          </svg>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          <Input label="Breedte" type="number" value={breedte} onChange={setBreedte} placeholder="bijv. 120" suffix="cm" error={errors.breedte} />
          <Input label="Hoogte" type="number" value={hoogte} onChange={setHoogte} placeholder="bijv. 160" suffix="cm" error={errors.hoogte} />
          <Input label="Aantal" type="number" value={aantal} onChange={setAantal} placeholder="1" error={errors.aantal} />
        </div>
      </Card>
      <Card style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-primary)" }}>4. Opmerkingen (optioneel)</h3>
        <textarea value={opmerking} onChange={e => setOpmerking(e.target.value)} placeholder="Bijv. speciale montagewensen, draairichting, etc." rows={3} style={{ width: "100%", boxSizing: "border-box", fontFamily: vars.fontFamily, fontSize: 14, padding: "12px 14px", border: "1.5px solid var(--ml-border)", borderRadius: 8, resize: "vertical", outline: "none" }} />
      </Card>
      <Btn onClick={handleSubmit} disabled={loading} style={{ padding: "14px 48px", fontSize: 15 }}>{loading ? "Bezig met plaatsen..." : "Bestelling plaatsen →"}</Btn>
    </div>
  );
}

function MijnBestellingen({ bestellingen, producten, loading }) {
  if (loading) return <Loader />;
  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Mijn Bestellingen</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>Overzicht van al uw geplaatste bestellingen.</p>
      {bestellingen.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "60px 40px", color: "var(--ml-text-light)" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><p style={{ fontSize: 15 }}>U heeft nog geen bestellingen geplaatst.</p></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bestellingen.map(b => {
            const prod = producten.find(p => p.id === b.product_id);
            return (
              <Card key={b.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--ml-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{prod?.icon || "▦"}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ml-text)" }}>{prod?.naam || "Product"} — {b.kleur}</div>
                      <div style={{ fontSize: 13, color: "var(--ml-text-light)", marginTop: 2 }}>{b.breedte} × {b.hoogte} cm · {b.montage} · {b.aantal}×</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={statusKleur[b.status]}>{b.status}</Badge>
                    <div style={{ fontSize: 12, color: "var(--ml-text-light)", marginTop: 6 }}>{b.order_nr} · {fmtDate(b.created_at)}</div>
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

function AdminDashboard({ bestellingen, producten, aantalWachtend }) {
  const stats = { totaal: bestellingen.length, nieuw: bestellingen.filter(b => b.status === "nieuw").length, verwerkt: bestellingen.filter(b => b.status === "verwerkt").length, gereed: bestellingen.filter(b => b.status === "gereed").length };
  const statCards = [
    { label: "Totaal", waarde: stats.totaal, kleur: "var(--ml-primary)", icon: "☰" },
    { label: "Nieuw", waarde: stats.nieuw, kleur: "var(--ml-warning)", icon: "●" },
    { label: "In Behandeling", waarde: stats.verwerkt, kleur: "#2980B9", icon: "◐" },
    { label: "Gereed", waarde: stats.gereed, kleur: "var(--ml-success)", icon: "✓" },
  ];
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>Overzicht van alle bestellingen</p>
      {aantalWachtend > 0 && (
        <Card style={{ marginBottom: 20, padding: "16px 24px", border: "1.5px solid var(--ml-warning)44" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ml-text)" }}>{aantalWachtend} account{aantalWachtend > 1 ? "s" : ""} wacht{aantalWachtend === 1 ? "" : "en"} op goedkeuring</div>
              <div style={{ fontSize: 13, color: "var(--ml-text-light)" }}>Ga naar Klanten om accounts te beoordelen.</div>
            </div>
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--ml-text-light)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: s.kleur, marginTop: 8, fontFamily: "'Playfair Display', serif" }}>{s.waarde}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.kleur + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: s.kleur }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-primary)" }}>Recente Bestellingen</h3>
        {bestellingen.length === 0 ? (<p style={{ color: "var(--ml-text-light)", fontSize: 14 }}>Nog geen bestellingen.</p>) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--ml-surface-alt)" }}>{["Order", "Product", "Maten", "Status", "Datum"].map(h => (<th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--ml-text-light)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>))}</tr></thead>
            <tbody>
              {bestellingen.slice(-8).reverse().map(b => {
                const prod = producten.find(p => p.id === b.product_id);
                return (<tr key={b.id} style={{ borderBottom: "1px solid var(--ml-surface-alt)" }}><td style={{ padding: "10px 12px", fontWeight: 600, fontFamily: "monospace" }}>{b.order_nr}</td><td style={{ padding: "10px 12px" }}>{prod?.naam} – {b.kleur}</td><td style={{ padding: "10px 12px" }}>{b.breedte}×{b.hoogte} cm</td><td style={{ padding: "10px 12px" }}><Badge color={statusKleur[b.status]}>{b.status}</Badge></td><td style={{ padding: "10px 12px", color: "var(--ml-text-light)" }}>{fmtDate(b.created_at)}</td></tr>);
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function AdminBestellingen({ bestellingen, producten, onStatusUpdate }) {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Bestellingen</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>Beheer en verwerk alle bestellingen.</p>
      {bestellingen.length === 0 ? (<Card style={{ textAlign: "center", padding: 48, color: "var(--ml-text-light)" }}>Nog geen bestellingen.</Card>) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...bestellingen].reverse().map(b => {
            const prod = producten.find(p => p.id === b.product_id);
            return (
              <Card key={b.id} style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "var(--ml-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{prod?.icon || "▦"}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{prod?.naam} — {b.kleur}</div>
                      <div style={{ fontSize: 13, color: "var(--ml-text-light)", marginTop: 4 }}>{b.breedte} × {b.hoogte} cm · {b.montage} · Aantal: {b.aantal}</div>
                      <div style={{ fontSize: 12, color: "var(--ml-text-light)", marginTop: 4 }}>Klant: {b.profielen?.naam || "—"} ({b.profielen?.email || "—"})</div>
                      {b.opmerking && (<div style={{ marginTop: 8, fontSize: 12, color: "var(--ml-text-light)", fontStyle: "italic", padding: "6px 10px", background: "var(--ml-surface-alt)", borderRadius: 6 }}>💬 {b.opmerking}</div>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--ml-text-light)", fontFamily: "monospace" }}>{b.order_nr} · {fmtDate(b.created_at)}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["nieuw", "verwerkt", "gereed", "geannuleerd"].map(s => (
                        <button key={s} onClick={() => onStatusUpdate(b.id, s)} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: vars.fontFamily, background: b.status === s ? statusKleur[s] + "18" : "transparent", color: b.status === s ? statusKleur[s] : "var(--ml-text-light)", border: b.status === s ? `1.5px solid ${statusKleur[s]}44` : "1.5px solid var(--ml-border)", transition: "all .15s" }}>{s}</button>
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

function AdminKlanten({ klanten, onGoedkeuren, onAfwijzen }) {
  const wachtend = klanten.filter(k => !k.goedgekeurd && k.rol !== "admin");
  const goedgekeurd = klanten.filter(k => k.goedgekeurd || k.rol === "admin");
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Klanten</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>Beheer gebruikersaccounts en goedkeuringen.</p>
      {wachtend.length > 0 && (<>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-warning)" }}>⏳ Wachtend op goedkeuring ({wachtend.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
          {wachtend.map(k => (
            <Card key={k.id} style={{ padding: 20, border: "1.5px solid var(--ml-warning)33" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{k.naam}</div>
                  <div style={{ fontSize: 13, color: "var(--ml-text-light)", marginTop: 2 }}>{k.email}</div>
                  <div style={{ fontSize: 12, color: "var(--ml-text-light)", marginTop: 4 }}>Geregistreerd: {fmtDate(k.created_at)}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small variant="success" onClick={() => onGoedkeuren(k.id)}>Goedkeuren</Btn>
                  <Btn small variant="danger" onClick={() => onAfwijzen(k.id)}>Afwijzen</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>)}
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", color: "var(--ml-primary)" }}>Actieve accounts ({goedgekeurd.length})</h3>
      <Card>
        {goedgekeurd.length === 0 ? (<p style={{ color: "var(--ml-text-light)" }}>Nog geen actieve klanten.</p>) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--ml-surface-alt)" }}>{["Naam", "E-mail", "Rol", "Geregistreerd"].map(h => (<th key={h} style={{ textAlign: "left", padding: "12px 14px", color: "var(--ml-text-light)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>))}</tr></thead>
            <tbody>
              {goedgekeurd.map(k => (<tr key={k.id} style={{ borderBottom: "1px solid var(--ml-surface-alt)" }}><td style={{ padding: "14px", fontWeight: 600 }}>{k.naam}</td><td style={{ padding: "14px", color: "var(--ml-text-light)" }}>{k.email}</td><td style={{ padding: "14px" }}><Badge color={k.rol === "admin" ? "#E67E22" : "#27AE60"}>{k.rol}</Badge></td><td style={{ padding: "14px", color: "var(--ml-text-light)" }}>{fmtDate(k.created_at)}</td></tr>))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function AdminProducten({ producten, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [naam, setNaam] = useState("");
  const [icon, setIcon] = useState("");
  const [kleuren, setKleuren] = useState("");
  const startEdit = (p) => { setEditing(p.id); setNaam(p.naam); setIcon(p.icon); setKleuren(p.kleuren.join(", ")); };
  const saveEdit = async () => { await supabase.from("producten").update({ naam, icon, kleuren: kleuren.split(",").map(k => k.trim()).filter(Boolean) }).eq("id", editing); setEditing(null); onRefresh(); };
  const toggleActief = async (p) => { await supabase.from("producten").update({ actief: !p.actief }).eq("id", p.id); onRefresh(); };

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ml-text)", margin: "0 0 4px" }}>Producten</h1>
      <p style={{ fontSize: 14, color: "var(--ml-text-light)", margin: "0 0 28px" }}>Beheer het productaanbod.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {producten.map(p => (
          <Card key={p.id} style={{ padding: 20 }}>
            {editing === p.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 80px", gap: 12 }}><Input label="Productnaam" value={naam} onChange={setNaam} /><Input label="Icoon" value={icon} onChange={setIcon} /></div>
                <Input label="Kleuren (kommagescheiden)" value={kleuren} onChange={setKleuren} />
                <div style={{ display: "flex", gap: 8 }}><Btn small onClick={saveEdit}>Opslaan</Btn><Btn small variant="ghost" onClick={() => setEditing(null)}>Annuleren</Btn></div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--ml-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, opacity: p.actief ? 1 : 0.4 }}>{p.icon}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 15, opacity: p.actief ? 1 : 0.5 }}>{p.naam}</div><div style={{ fontSize: 12, color: "var(--ml-text-light)", marginTop: 2 }}>{p.kleuren.join(" · ")}</div></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}><Btn small variant="outline" onClick={() => startEdit(p)}>Bewerken</Btn><Btn small variant={p.actief ? "ghost" : "accent"} onClick={() => toggleActief(p)}>{p.actief ? "Deactiveer" : "Activeer"}</Btn></div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function MultiluxApp() {
  const [session, setSession] = useState(null);
  const [profiel, setProfiel] = useState(null);
  const [pagina, setPagina] = useState("");
  const [producten, setProducten] = useState([]);
  const [bestellingen, setBestellingen] = useState([]);
  const [klanten, setKlanten] = useState([]);
  const [loading, setLoading] = useState(true);
  const aantalWachtend = klanten.filter(k => !k.goedgekeurd && k.rol !== "admin").length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) loadProfiel(session.user.id); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) loadProfiel(session.user.id); else { setProfiel(null); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfiel = async (userId) => {
    const { data } = await supabase.from("profielen").select("*").eq("id", userId).single();
    setProfiel(data);
    if (data?.goedgekeurd || data?.rol === "admin") {
      setPagina(data?.rol === "admin" ? "dashboard" : "bestellen");
      await loadProducten();
      await loadBestellingen(data);
      if (data?.rol === "admin") await loadKlanten();
    }
    setLoading(false);
  };

  const loadProducten = async () => { const { data } = await supabase.from("producten").select("*").order("volgorde"); setProducten(data || []); };
  const loadBestellingen = async (prof) => { let query = supabase.from("bestellingen").select("*, profielen(naam, email)").order("created_at"); if (prof?.rol !== "admin") query = query.eq("klant_id", prof.id); const { data } = await query; setBestellingen(data || []); };
  const loadKlanten = async () => { const { data } = await supabase.from("profielen").select("*").order("created_at"); setKlanten(data || []); };
  const onStatusUpdate = async (id, status) => { await supabase.from("bestellingen").update({ status, updated_at: new Date().toISOString() }).eq("id", id); await loadBestellingen(profiel); };
  const onGoedkeuren = async (id) => { await supabase.from("profielen").update({ goedgekeurd: true }).eq("id", id); await loadKlanten(); };
  const onAfwijzen = async (id) => { await supabase.from("profielen").update({ goedgekeurd: false }).eq("id", id); await loadKlanten(); };
  const handleLogout = async () => { await supabase.auth.signOut(); setProfiel(null); setSession(null); };

  if (loading) return (<><style>{fonts}</style><div style={{ ...vars, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ml-bg)" }}><Loader /></div></>);
  if (!session) return (<><style>{fonts}</style><div style={vars}><LoginPage onLogin={() => {}} /></div></>);
  if (profiel && !profiel.goedgekeurd && profiel.rol !== "admin") return (<><style>{fonts}</style><div style={vars}><WachtScherm profiel={profiel} onLogout={handleLogout} /></div></>);

  const renderPage = () => {
    if (profiel?.rol === "admin") {
      switch (pagina) {
        case "dashboard": return <AdminDashboard bestellingen={bestellingen} producten={producten} aantalWachtend={aantalWachtend} />;
        case "bestellingen": return <AdminBestellingen bestellingen={bestellingen} producten={producten} onStatusUpdate={onStatusUpdate} />;
        case "klanten": return <AdminKlanten klanten={klanten} onGoedkeuren={onGoedkeuren} onAfwijzen={onAfwijzen} />;
        case "producten": return <AdminProducten producten={producten} onRefresh={loadProducten} />;
        default: return <AdminDashboard bestellingen={bestellingen} producten={producten} aantalWachtend={aantalWachtend} />;
      }
    } else {
      switch (pagina) {
        case "bestellen": return <BestelForm profiel={profiel} producten={producten} onBesteld={() => loadBestellingen(profiel)} />;
        case "mijn-bestellingen": return <MijnBestellingen bestellingen={bestellingen} producten={producten} />;
        default: return <BestelForm profiel={profiel} producten={producten} onBesteld={() => loadBestellingen(profiel)} />;
      }
    }
  };

  return (<><style>{fonts}</style><div style={{ ...vars, display: "flex", minHeight: "100vh", background: "var(--ml-bg)", fontFamily: vars.fontFamily }}><Sidebar profiel={profiel} actief={pagina} onNav={setPagina} onLogout={handleLogout} aantalWachtend={aantalWachtend} /><div style={{ flex: 1, overflowY: "auto" }}>{renderPage()}</div></div></>);
}
