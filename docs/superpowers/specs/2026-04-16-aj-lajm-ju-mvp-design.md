# AJ ЛАЈМ ЈУ — MVP Design

**Project:** Cockta digital activation za Jurka festival 16.5.2026
**Scope:** MVP — landing, form, success, display, basic admin moderation
**Status:** approved 2026-04-16

## Goal

Festival web app gde gosti Jurka festivala skenraju QR (narukvica + chill zona), na telefonu pošalju kratku flert/icebreaker poruku osobi koja im se sviđa, a poruke (nakon admin moderacije) idu na LED wall u chill zoni.

**Success kriterijum (UX):** poruka poslata za < 20s od skena, max 2-3 klika.

## Out of scope (za MVP)

Sledeće je u brifu, ali se gradi posle MVP:

- Edit poruke u admin-u
- Pin/highlight poruke
- Auto-filter psovki (server-side blacklist)
- Sound cue za nove pending poruke u admin-u
- Stats panel (broj poslatih, odobrenih, peak hour)
- Polish vizuala (disko kugla, limeta, brand polish)

## Routes

| Ruta | Šta radi | Chrome |
|------|----------|--------|
| `/` | Landing — koncept text + CTA "Pošalji poruku" → `/form` | bez Header/Footer |
| `/form` | TanStack Form sa 3 polja → submit → navigate `/success` | bez chrome |
| `/success` | Random poruka iz brifa (8 varijanti) + link nazad na `/form` | bez chrome |
| `/display` | Fullscreen, 1 poruka u datom trenutku, rotacija 7s, crossfade | bez chrome (fullscreen) |
| `/admin` | Password gate → lista pending poruka → Approve/Reject | bez chrome |

`__root.tsx` se striple od demo Header/Footer (festival app — bez globalne navigacije). `src/routes/about.tsx` se briše.

## Backend (Convex)

### Schema

`convex/schema.ts` — `messages` se proširuje:

```ts
messages: defineTable({
  recipient: v.string(),                     // "plava košulja kod DJ-a"
  text: v.string(),                          // max 120 char (server-validated)
  signature: v.optional(v.string()),         // opciono, max 50 char
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  createdAt: v.number(),
})
```

Postojeće `products` i `todos` tabele ostaju (ne diraju se u MVP).

### Funkcije (`convex/messages.ts`)

- `submitMessage({recipient, text, signature?})` — public mutation. Server-side validacija: `recipient` 1-100 char, `text` 1-120 char, `signature` 0-50 char. Insert sa `status: "pending"`, `createdAt: Date.now()`.
- `getPendingMessages({adminPassword})` — admin query. Vraća sve `status === "pending"`, sortirano `desc` po `createdAt`.
- `approveMessage({messageId, adminPassword})` — admin mutation. `patch({status: "approved"})`.
- `rejectMessage({messageId, adminPassword})` — admin mutation. `patch({status: "rejected"})`.
- `getApprovedMessages()` — public query. Poslednjih **15** approved, sortirano `desc` po `createdAt`. Vraća `recipient`, `text`, `signature`, `createdAt`.

Auth helper `assertAdmin(password)` koji proverava `process.env.ADMIN_PASSWORD` — već postoji.

## Frontend struktura

### Tech stack (već postavljeno)

- TanStack Start + Router (file-based, `src/routes/`)
- shadcn/ui — koristi `button`, `input`, `label`, `textarea`. Treba dodati `card`.
- TanStack Form — `useAppForm` pattern iz `src/hooks/demo.form.ts`, postojeći `TextField` / `TextArea` field components iz `src/components/demo.FormComponents.tsx`.
- Convex `useQuery` / `useMutation` iz `convex/react`.
- Brand: postojeće CSS varijable (`--sea-ink #173a40`, `--lagoon #4fb8b2`, `--palm #2f6a4a`, `--sand #e7f0e8`), fontovi Fraunces (display/serif) i Manrope (sans).

### Novi fajlovi

- `src/routes/index.tsx` — REWRITE. Festival landing.
- `src/routes/form.tsx` — NEW. TanStack Form sa 3 polja.
- `src/routes/success.tsx` — NEW. Random success poruka.
- `src/routes/display.tsx` — NEW. Fullscreen rotator.
- `src/routes/admin.tsx` — NEW. Password gate + moderation list.
- `src/routes/__root.tsx` — MODIFY. Strip demo `<Header />` i `<Footer />`. Zadržati `<Outlet />`, providers, devtools.
- `src/lib/admin-auth.ts` — NEW. `useAdminPassword()` hook (localStorage `cockta-admin-password`).
- `src/lib/success-messages.ts` — NEW. Konstanta sa 8 success varijanti iz brifa.
- `src/components/ui/card.tsx` — NEW. shadcn add.
- `src/routes/about.tsx` — DELETE.

### Forma (`/form`)

3 polja u redosledu:

1. **Kome šalješ?** — `Input` (single line). Placeholder rotira između `"plava košulja na stage-u kod DJ-a"`, `"devojka koja igra u prvom redu"`, `"Jovani, zna ona koja je"` (random po render-u). Required, 1-100 char.
2. **Poruka** — `Textarea`. Placeholder: `"Šta hoćeš da joj/mu kažeš?"`. Required, 1-120 char. Counter `{n}/120` ispod, postaje crveno na > 110.
3. **Potpis / trag** *(opciono)* — `Input` mali. Placeholder: `"inicijal, emoji, hint…"`. Optional, 0-50 char.

Submit dugme: "Pošalji". Disabled dok nije validno. Spinner state tokom mutation-a. Na success → `navigate({to: "/success"})`. Na error → toast/inline poruka "Nešto je puklo, probaj ponovo."

### Display (`/display`)

- `useQuery(api.messages.getApprovedMessages)` — Convex automatski reactive.
- `useState<number>(0)` — trenutni indeks.
- `useEffect` sa `setInterval(7000)` — `setIndex(i => (i + 1) % messages.length)`.
- Reset indeksa na 0 kad se lista promeni i indeks ispadne van granica.
- Layout: `100vh`, centrirano. Format:
  ```
  [RECIPIENT — UPPERCASE, lagoon color, mali]
  [text — Fraunces, ogromno, italic, sand on sea-ink bg]
  [#AjЛajmЈy — mali, dole]
  [signature ako postoji — još manji, dole desno]
  ```
- Crossfade tranzicija: render trenutnu poruku sa React `key={index}` da forsiramo remount, plus CSS `animation: fade-in 600ms` (preko `tw-animate-css` ili custom keyframes).
- Edge case: ako `messages.length === 0`, prikazi "Čekamo prve poruke…" placeholder.

### Admin (`/admin`)

- Mount: `useAdminPassword()` čita iz localStorage. Ako prazno → password ekran (Input + "Uđi" dugme).
- Submit password: pokušava `useQuery(api.messages.getPendingMessages, {adminPassword})`. Ako baci `Unauthorized` → prikazi grešku, ne čuvaj. Ako prođe → sačuvaj u localStorage, pokaži listu.
- Lista pending: vertikalno sortirana, najnoviji gore. Svaka kartica:
  ```
  [recipient bold]
  [text]
  [signature ako postoji, gray small]
  [createdAt relativno: "pre 2 min"]
  [Approve (green) | Reject (outline red)] dugmad
  ```
- Klik Approve/Reject → `useMutation`, optimistic UI nije obavezan (lista će se reactive osvežiti).
- Logout dugme u header-u (briše password iz localStorage).

### Auth ponašanje

- `useAdminPassword()` exposes `{password, setPassword, clearPassword}`.
- localStorage ključ: `cockta-admin-password`.
- Password se šalje kao argument svaki put — Convex strana validira preko `process.env.ADMIN_PASSWORD`.

## Stil i konvencije

- Biome: tab indent, double quotes (za `src/`).
- Convex fajlovi: 2-space, single quotes, no semicolons (postojeći stil).
- shadcn alias: `#/components`, `#/components/ui`, `#/lib/utils`.
- Bez komentara u kodu osim za neočigledan WHY.

## Greške i edge case

- Submit forme bez konekcije: mutation baca, prikazi inline grešku, ne navigiraj.
- Admin password pogrešan: server baca `Unauthorized`, frontend prikazi crveni text, ne čuvaj password.
- `getApprovedMessages` prazan: display prikazi "Čekamo prve poruke…".
- Admin list prazna: prikazi "Nema poruka za moderaciju".

## Testing (manual za MVP)

- Submit forme sa svim 3 polja → vidi se na `/admin` kao pending.
- Approve → pojavi se na `/display` u sledećoj rotaciji.
- Reject → ne pojavi se.
- Pošalji 16 poruka, approve sve → na `/display` se vidi samo poslednjih 15.
- Test na pravom telefonu (mobile viewport, 3G throttling u DevTools).
- Otvori `/display` u dva tab-a → reactive update u oba kad approve novu poruku.

## Open questions

Ništa otvoreno za MVP. Sve odluke fiksirane sa user-om 2026-04-16.
