# Multilux Bestelapp

Bestelportaal voor binnenzonwering op maat.

## Lokaal draaien

```bash
npm install
npm run dev
```

De app draait dan op `http://localhost:5173`

## Deployen naar Vercel

### Optie 1: Via GitHub (aanbevolen)

1. Maak een GitHub repository aan op github.com
2. Push dit project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/JOUW-USERNAME/multilux-app.git
   git push -u origin main
   ```
3. Ga naar [vercel.com](https://vercel.com) en log in
4. Klik **"Add New Project"** → importeer je GitHub repo
5. Vercel detecteert Vite automatisch — klik **Deploy**
6. Klaar! Je krijgt een URL zoals `multilux-app.vercel.app`

### Optie 2: Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Volg de stappen in de terminal.

## Bewerken

Open het project in **VS Code** (of een andere editor):

```bash
code .
```

De belangrijkste bestanden:
- `src/App.jsx` — De volledige app (componenten, logica, styling)
- `index.html` — HTML template
- `src/main.jsx` — React entry point

Na aanpassingen:
- Lokaal testen: `npm run dev`
- Als je GitHub + Vercel hebt gekoppeld: gewoon pushen → Vercel deployed automatisch

## Demo accounts

| Rol      | E-mail             | Wachtwoord |
|----------|--------------------|------------|
| Klant    | klant@demo.nl      | klant123   |
| Beheerder| admin@multilux.nl  | admin123   |
