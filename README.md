# 04.-Purchasing_FE

Frontend **KPIN Purchasing + Portal Vendor** — Next.js 16 + Tailwind. Pasangan BE: `04.-Purchasing_BE`.

- `/api/*` di-proxy (Next rewrites) ke BE (`API_URL`), jadi cookie login tetap first-party dan tanpa CORS.
- `src/app/(app)/…` area internal · `src/app/(portal)/portal/…` portal vendor · `login`, `portal/register`, `forgot-password` publik.
- Kit: `components/ui.tsx`, `form.tsx` (AutoForm, LookupSelect), `data-table.tsx` + `lib/use-list.ts` (list server-side: pagination, search, sort), `crud-page.tsx`, `components/document/*`.
- Menu: `src/nav/<grup>.ts` (tampil sesuai permission).

## Jalankan lokal
```bash
npm install
cp .env.example .env.local     # API_URL=http://localhost:3918
npm run dev                    # http://localhost:3917
```

## Deploy gratis — Vercel Hobby
Import repo ini, set env `API_URL` = URL BE. Di BE, set `ALLOWED_ORIGINS` & `APP_URL` = URL FE ini.
