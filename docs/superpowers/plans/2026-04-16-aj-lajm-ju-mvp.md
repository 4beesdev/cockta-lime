# AJ ЛАЈМ ЈУ MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement MVP for Cockta AJ ЛАЈМ ЈУ festival web app — landing, 3-field form, success screen, fullscreen rotating display, password-protected admin moderation.

**Architecture:** TanStack Start file-based routes consuming Convex backend (already scaffolded). Existing demo `Header`/`Footer` chrome stripped from root layout — festival routes render on plain shell. Admin password stored in `localStorage` and sent with every privileged Convex call; server validates against `process.env.ADMIN_PASSWORD`. Display page subscribes to `getApprovedMessages` reactively and rotates one message at a time client-side.

**Tech Stack:** TanStack Start + Router (file-based), Convex (`convex/react` hooks), shadcn/ui, TanStack Form (existing `useAppForm` pattern), Tailwind v4, Vitest + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-16-aj-lajm-ju-mvp-design.md`

> **EXECUTION MODE — NO-GIT (set 2026-04-16):** User opted out of git for now. **SKIP Task 0 entirely.** **SKIP every step labeled "Commit"** (any step running `git add` / `git commit` / `git status` / `git log`). Task boundaries still serve as review checkpoints for the orchestrator — they just don't produce commits. Do not run `git init`. Continue all other steps as written.

**Conventions:**
- `src/**` — tab indent, double quotes (biome rules)
- `convex/**` — 2-space indent, single quotes, no semicolons (existing style; biome ignores convex/)
- shadcn aliases: `#/components`, `#/components/ui`, `#/lib/utils`
- Brand: CSS vars `--sea-ink`, `--lagoon`, `--palm`, `--sand`; fonts Fraunces (display), Manrope (sans)
- No comments unless WHY is non-obvious

**Note on testing:** Pure logic units (success-message picker, admin-auth hook) have unit tests. UI route components are verified manually via dev server (visual smoke + golden-path interaction) — testing TanStack Start routes + Convex `useQuery` end-to-end requires heavy mocking that is low value for an MVP.

---

## Task 0: Initialize git + commit baseline

The project is not a git repo yet. Tasks below assume `git commit` works, so initialize first.

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
git init
git config user.email "user@local"  # only if no global config
git config user.name "User"          # only if no global config
```

- [ ] **Step 2: Create `.gitignore`**

Write `c:/Users/Pc/Desktop/Projects/cockta-lime/.gitignore`:

```gitignore
node_modules/
dist/
.env.local
.env*.local
.superpowers/
.vinxi/
.output/
.tanstack/
.nitro/
*.log
.DS_Store
```

- [ ] **Step 3: Stage and commit baseline**

```bash
git add .
git commit -m "chore: initial commit (TanStack Start scaffold + Convex backend + AJ ЛАЈМ ЈУ spec/plan)"
```

Expected: commit succeeds, working tree clean.

- [ ] **Step 4: Verify**

```bash
git status
git log --oneline
```

Expected: `nothing to commit, working tree clean` and at least one commit visible.

---

## Task 1: Vitest config (jsdom + globals)

Project has vitest + jsdom + @testing-library/react in `package.json` but no config. Tasks 6 and 7 need it.

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import viteReact from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	plugins: [viteReact(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test-setup.ts"],
	},
})
```

- [ ] **Step 2: Install `vite-tsconfig-paths`**

```bash
pnpm add -D vite-tsconfig-paths
```

Expected: package added, no errors.

- [ ] **Step 3: Write `src/test-setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 4: Add `@testing-library/jest-dom`**

```bash
pnpm add -D @testing-library/jest-dom
```

- [ ] **Step 5: Sanity-check vitest finds zero tests**

```bash
pnpm test
```

Expected: vitest exits with "No test files found" (exit code may be non-zero — that's fine, this is just verifying the runner starts without config errors).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test-setup.ts package.json pnpm-lock.yaml
git commit -m "test: configure vitest with jsdom and testing-library/jest-dom"
```

---

## Task 2: Convex schema — extend `messages` table

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Replace `messages` table definition**

Open `convex/schema.ts`. Replace the current `messages` block (currently has only `text`, `status`, `createdAt`) with:

```ts
  messages: defineTable({
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
    ),
    createdAt: v.number(),
  }),
```

Final file:

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  products: defineTable({
    title: v.string(),
    imageId: v.string(),
    price: v.number(),
  }),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  messages: defineTable({
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
    ),
    createdAt: v.number(),
  }),
})
```

- [ ] **Step 2: TypeScript check**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime/convex"
pnpm exec tsc --noEmit -p .
```

Expected: exits 0 with no output. (Will fail later when `messages.ts` `submitMessage` still uses old shape — that's fixed in Task 3. If you want to skip the intermediate failure, do Tasks 2 and 3 back-to-back without committing, then commit together. The tasks are committed separately below for clarity, but the type check between them WILL fail — skip Step 3 here and let Task 3 fix the types before committing both.)

- [ ] **Step 3: (skipped — see note above)**

- [ ] **Step 4: Stage but do not commit yet**

```bash
git add convex/schema.ts
```

Continue immediately to Task 3 — schema and messages.ts must commit together.

---

## Task 3: Convex messages.ts — extend `submitMessage` + bump `getApprovedMessages` limit

**Files:**
- Modify: `convex/messages.ts`

- [ ] **Step 1: Replace `submitMessage` function**

Open `convex/messages.ts`. Replace the `submitMessage` export with:

```ts
export const submitMessage = mutation({
  args: {
    recipient: v.string(),
    text: v.string(),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const recipient = args.recipient.trim()
    const text = args.text.trim()
    const signature = args.signature?.trim() || undefined

    if (recipient.length < 1 || recipient.length > 100) {
      throw new Error('recipient must be 1-100 characters')
    }
    if (text.length < 1 || text.length > 120) {
      throw new Error('text must be 1-120 characters')
    }
    if (signature !== undefined && signature.length > 50) {
      throw new Error('signature must be at most 50 characters')
    }

    await ctx.db.insert('messages', {
      recipient,
      text,
      signature,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})
```

- [ ] **Step 2: Replace `getApprovedMessages` `.take(10)` with `.take(15)`**

Find:
```ts
      .take(10)
```

Replace with:
```ts
      .take(15)
```

- [ ] **Step 3: TypeScript check**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime/convex"
pnpm exec tsc --noEmit -p .
```

Expected: exits 0 with no output.

- [ ] **Step 4: Commit (schema + messages together)**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
git add convex/schema.ts convex/messages.ts
git commit -m "feat(convex): extend messages schema with recipient/signature, bump display limit to 15"
```

- [ ] **Step 5: Push schema to Convex dev deployment**

```bash
pnpm exec convex dev --once
```

Expected: schema pushed successfully. (If `convex dev` has never been run, it may prompt for login/project selection — handle interactively.)

---

## Task 4: Strip demo chrome from `__root.tsx` + delete `/about`

**Files:**
- Modify: `src/routes/__root.tsx`
- Delete: `src/routes/about.tsx`

- [ ] **Step 1: Rewrite `src/routes/__root.tsx`**

Replace the entire file contents with:

```tsx
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import ConvexProvider from "../integrations/convex/provider"

import appCss from "../styles.css?url"

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "AJ ЛАЈМ ЈУ" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="sr" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<ConvexProvider>
					{children}
					<TanStackDevtools
						config={{ position: "bottom-right" }}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	)
}
```

Changes from original: removed `Header`/`Footer` imports + their JSX usage, changed `<html lang="en">` to `lang="sr"`, changed title to "AJ ЛАЈМ ЈУ".

- [ ] **Step 2: Delete `/about` route**

```bash
rm "c:/Users/Pc/Desktop/Projects/cockta-lime/src/routes/about.tsx"
```

- [ ] **Step 3: Start dev server**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
pnpm dev
```

Then in browser open `http://localhost:3000/` — verify:
- Page renders without the previous Header/Footer
- No console errors
- `/about` returns 404 (try `http://localhost:3000/about`)

Stop the dev server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add src/routes/__root.tsx src/routes/about.tsx src/routeTree.gen.ts
git commit -m "feat: strip demo chrome from root layout, drop /about"
```

(`routeTree.gen.ts` regenerates on dev start — include it.)

---

## Task 5: Add shadcn `card` component

**Files:**
- Create: `src/components/ui/card.tsx`

- [ ] **Step 1: Install via shadcn CLI**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
pnpm dlx shadcn@latest add card
```

If prompted to overwrite anything — choose "no" for everything except creating `card.tsx`. Expected: new file `src/components/ui/card.tsx`.

- [ ] **Step 2: Verify file exists**

```bash
ls src/components/ui/card.tsx
```

Expected: file path printed.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "chore: add shadcn card component"
```

---

## Task 6: success-messages module (TDD)

A pure module exporting the 8 success messages from the brief and a function to pick one randomly.

**Files:**
- Create: `src/lib/success-messages.ts`
- Test: `src/lib/success-messages.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/success-messages.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest"
import {
	SUCCESS_MESSAGES,
	getRandomSuccessMessage,
} from "./success-messages"

describe("success-messages", () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("exposes exactly the 8 messages from the brief", () => {
		expect(SUCCESS_MESSAGES).toHaveLength(8)
		for (const msg of SUCCESS_MESSAGES) {
			expect(typeof msg).toBe("string")
			expect(msg.length).toBeGreaterThan(0)
		}
	})

	it("getRandomSuccessMessage returns a value from SUCCESS_MESSAGES", () => {
		for (let i = 0; i < 50; i++) {
			expect(SUCCESS_MESSAGES).toContain(getRandomSuccessMessage())
		}
	})

	it("respects Math.random for selection (deterministic when mocked)", () => {
		vi.spyOn(Math, "random").mockReturnValue(0)
		expect(getRandomSuccessMessage()).toBe(SUCCESS_MESSAGES[0])

		vi.spyOn(Math, "random").mockReturnValue(0.999999)
		expect(getRandomSuccessMessage()).toBe(
			SUCCESS_MESSAGES[SUCCESS_MESSAGES.length - 1],
		)
	})
})
```

- [ ] **Step 2: Run the test (verify it fails)**

```bash
pnpm test src/lib/success-messages.test.ts
```

Expected: FAIL — `Cannot find module './success-messages'`.

- [ ] **Step 3: Implement `src/lib/success-messages.ts`**

```ts
export const SUCCESS_MESSAGES = [
	"Možda će videti. Možda će se prepoznati.",
	"Pogledaj AJ ЛАЈМ ЈУ wall.",
	"Možda ti se sreća osmehne.",
	"Strpi se, popij Cocktu, poruka je na moderaciji.",
	"Sad se opusti, Cockta će to da ti završi.",
	"Idi sad đuskaj, posle pitaj ove iz Cockte jel te neko tražio.",
	"Idi u chill zonu, zableji malo, možda se pojavi tamo.",
	"Floki & Goxy će puštati na afteru, jel znaš to?",
] as const

export function getRandomSuccessMessage(): string {
	const idx = Math.floor(Math.random() * SUCCESS_MESSAGES.length)
	return SUCCESS_MESSAGES[idx]
}
```

- [ ] **Step 4: Run the test (verify it passes)**

```bash
pnpm test src/lib/success-messages.test.ts
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/success-messages.ts src/lib/success-messages.test.ts
git commit -m "feat(lib): add success-messages module with random picker"
```

---

## Task 7: useAdminPassword hook (TDD)

Reads/writes admin password from `localStorage` under `cockta-admin-password`. Exposes `{password, setPassword, clearPassword}`.

**Files:**
- Create: `src/lib/admin-auth.ts`
- Test: `src/lib/admin-auth.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/admin-auth.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAdminPassword, ADMIN_PASSWORD_KEY } from "./admin-auth"

describe("useAdminPassword", () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it("returns null when localStorage is empty", () => {
		const { result } = renderHook(() => useAdminPassword())
		expect(result.current.password).toBeNull()
	})

	it("returns the stored password when localStorage has one", () => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, "cockta2025")
		const { result } = renderHook(() => useAdminPassword())
		expect(result.current.password).toBe("cockta2025")
	})

	it("setPassword writes to localStorage and updates state", () => {
		const { result } = renderHook(() => useAdminPassword())
		act(() => {
			result.current.setPassword("newpass")
		})
		expect(result.current.password).toBe("newpass")
		expect(window.localStorage.getItem(ADMIN_PASSWORD_KEY)).toBe("newpass")
	})

	it("clearPassword removes from localStorage and clears state", () => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, "cockta2025")
		const { result } = renderHook(() => useAdminPassword())
		act(() => {
			result.current.clearPassword()
		})
		expect(result.current.password).toBeNull()
		expect(window.localStorage.getItem(ADMIN_PASSWORD_KEY)).toBeNull()
	})
})
```

- [ ] **Step 2: Run the test (verify it fails)**

```bash
pnpm test src/lib/admin-auth.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Add `@testing-library/react` import works (already in deps; no install needed)**

Verify by running:
```bash
pnpm list @testing-library/react
```

Expected: shows installed version. (If missing for some reason, run `pnpm add -D @testing-library/react`.)

- [ ] **Step 4: Implement `src/lib/admin-auth.ts`**

```ts
import { useCallback, useEffect, useState } from "react"

export const ADMIN_PASSWORD_KEY = "cockta-admin-password"

export function useAdminPassword() {
	const [password, setPasswordState] = useState<string | null>(() => {
		if (typeof window === "undefined") return null
		return window.localStorage.getItem(ADMIN_PASSWORD_KEY)
	})

	useEffect(() => {
		if (typeof window === "undefined") return
		const stored = window.localStorage.getItem(ADMIN_PASSWORD_KEY)
		if (stored !== password) setPasswordState(stored)
	}, [password])

	const setPassword = useCallback((value: string) => {
		window.localStorage.setItem(ADMIN_PASSWORD_KEY, value)
		setPasswordState(value)
	}, [])

	const clearPassword = useCallback(() => {
		window.localStorage.removeItem(ADMIN_PASSWORD_KEY)
		setPasswordState(null)
	}, [])

	return { password, setPassword, clearPassword }
}
```

- [ ] **Step 5: Run the test (verify it passes)**

```bash
pnpm test src/lib/admin-auth.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin-auth.ts src/lib/admin-auth.test.ts
git commit -m "feat(lib): add useAdminPassword hook (localStorage-backed)"
```

---

## Task 8: Landing page (`/`)

Rewrite `src/routes/index.tsx` as the festival landing.

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/")({
	component: LandingPage,
})

function LandingPage() {
	return (
		<main className="min-h-svh flex items-center justify-center px-6 py-12 bg-[var(--sand)] text-[var(--sea-ink)]">
			<div className="max-w-xl w-full flex flex-col gap-8">
				<header className="text-center">
					<p className="text-sm tracking-[0.3em] uppercase text-[var(--palm)] mb-3">
						Jurka × Cockta
					</p>
					<h1 className="font-serif text-5xl sm:text-6xl leading-[0.95]">
						AJ ЛАЈМ ЈУ
					</h1>
				</header>

				<section className="font-serif text-lg sm:text-xl leading-relaxed text-center">
					<p>
						Ako ti neko zapadne za oko —{" "}
						<em>ne moraš odmah da prilaziš.</em>
					</p>
					<p className="mt-3">
						Pošalji poruku. Možda ostane samo osmeh. Možda nešto više.
						Na Jurci, to je sasvim dovoljno.
					</p>
					<p className="mt-3">
						Za promenu, samo reci: <strong>AJ ЛАЈМ ЈУ</strong> i baci
						pogled na wall u chill zoni.
					</p>
				</section>

				<div className="flex justify-center">
					<Button
						asChild
						size="lg"
						className="bg-[var(--sea-ink)] text-[var(--sand)] hover:bg-[var(--palm)] text-base px-8 py-6 rounded-full"
					>
						<Link to="/form">Pošalji poruku</Link>
					</Button>
				</div>
			</div>
		</main>
	)
}
```

- [ ] **Step 2: Visual smoke test**

```bash
pnpm dev
```

Open `http://localhost:3000/`. Verify:
- Festival landing renders (sand background, sea-ink text)
- Heading "AJ ЛАЈМ ЈУ" in serif font
- CTA button "Pošalji poruku" navigates to `/form` (will 404 until Task 9 — that's expected)
- Mobile viewport (DevTools, iPhone SE): readable, no horizontal scroll

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx src/routeTree.gen.ts
git commit -m "feat(routes): festival landing page at /"
```

---

## Task 9: Form page (`/form`)

3-field TanStack Form → submitMessage mutation → navigate to `/success`.

**Files:**
- Create: `src/routes/form.tsx`

- [ ] **Step 1: Write `src/routes/form.tsx`**

```tsx
import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"

import { api } from "../../convex/_generated/api"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Textarea } from "#/components/ui/textarea"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/form")({
	component: FormPage,
})

const RECIPIENT_PLACEHOLDERS = [
	"plava košulja na stage-u kod DJ-a",
	"devojka koja igra u prvom redu",
	"Jovani, zna ona koja je",
]

function FormPage() {
	const navigate = useNavigate()
	const [submitError, setSubmitError] = useState<string | null>(null)

	const recipientPlaceholder = RECIPIENT_PLACEHOLDERS[
		Math.floor(Math.random() * RECIPIENT_PLACEHOLDERS.length)
	]

	const submitMutation = useMutation({
		mutationFn: useConvexMutation(api.messages.submitMessage),
	})

	const form = useForm({
		defaultValues: { recipient: "", text: "", signature: "" },
		onSubmit: async ({ value }) => {
			setSubmitError(null)
			try {
				await submitMutation.mutateAsync({
					recipient: value.recipient.trim(),
					text: value.text.trim(),
					signature: value.signature.trim() || undefined,
				})
				navigate({ to: "/success" })
			} catch (err) {
				setSubmitError(
					err instanceof Error ? err.message : "Nešto je puklo, probaj ponovo.",
				)
			}
		},
	})

	return (
		<main className="min-h-svh px-6 py-10 bg-[var(--sand)] text-[var(--sea-ink)]">
			<div className="max-w-md mx-auto">
				<h1 className="font-serif text-3xl mb-8 text-center">
					Pošalji poruku
				</h1>

				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="flex flex-col gap-6"
				>
					<form.Field
						name="recipient"
						validators={{
							onChange: ({ value }) => {
								const v = value.trim()
								if (v.length < 1) return "Reci kome šalješ"
								if (v.length > 100) return "Najviše 100 karaktera"
								return undefined
							},
						}}
					>
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor="recipient" className="font-bold">
									Kome šalješ?
								</Label>
								<Input
									id="recipient"
									value={field.state.value}
									placeholder={recipientPlaceholder}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600">
											{String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>

					<form.Field
						name="text"
						validators={{
							onChange: ({ value }) => {
								const v = value.trim()
								if (v.length < 1) return "Napiši poruku"
								if (v.length > 120) return "Najviše 120 karaktera"
								return undefined
							},
						}}
					>
						{(field) => {
							const len = field.state.value.length
							const counterColor =
								len > 110
									? "text-red-600"
									: len > 100
										? "text-amber-600"
										: "text-[var(--palm)]"
							return (
								<div className="flex flex-col gap-2">
									<Label htmlFor="text" className="font-bold">
										Poruka
									</Label>
									<Textarea
										id="text"
										value={field.state.value}
										placeholder="Šta hoćeš da joj/mu kažeš?"
										rows={3}
										maxLength={120}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									<div className="flex justify-between items-center">
										<div className="text-sm text-red-600">
											{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
												? String(field.state.meta.errors[0])
												: null}
										</div>
										<div className={`text-xs tabular-nums ${counterColor}`}>
											{len}/120
										</div>
									</div>
								</div>
							)
						}}
					</form.Field>

					<form.Field
						name="signature"
						validators={{
							onChange: ({ value }) => {
								if (value.trim().length > 50) return "Najviše 50 karaktera"
								return undefined
							},
						}}
					>
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor="signature" className="font-bold">
									Potpis / trag <span className="font-normal text-sm text-[var(--palm)]">(opciono)</span>
								</Label>
								<Input
									id="signature"
									value={field.state.value}
									placeholder="inicijal, emoji, hint…"
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.isTouched &&
									field.state.meta.errors.length > 0 && (
										<p className="text-sm text-red-600">
											{String(field.state.meta.errors[0])}
										</p>
									)}
							</div>
						)}
					</form.Field>

					{submitError && (
						<p className="text-sm text-red-600 text-center">{submitError}</p>
					)}

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button
								type="submit"
								disabled={!canSubmit || isSubmitting}
								size="lg"
								className="bg-[var(--sea-ink)] text-[var(--sand)] hover:bg-[var(--palm)] text-base py-6 rounded-full"
							>
								{isSubmitting ? "Šaljem…" : "Pošalji"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</main>
	)
}
```

- [ ] **Step 2: Verify Convex client integration**

Read `src/integrations/convex/provider.tsx` (already configured). The hook pattern this task uses (`useConvexMutation` + `useMutation` from react-query) matches the project's setup since `@convex-dev/react-query` is in dependencies.

If the project's existing convex provider does NOT wire react-query (only ConvexProvider), the simpler alternative is:

```ts
import { useMutation } from "convex/react"
const submitMutation = useMutation(api.messages.submitMessage)
// then: await submitMutation({ recipient, text, signature })
```

Inspect `src/integrations/convex/provider.tsx` first; if only `ConvexProvider` is mounted (no `QueryClientProvider`), use the second pattern instead.

- [ ] **Step 3: Manual smoke test**

```bash
pnpm dev
```

Open `http://localhost:3000/form`. Verify:
- All 3 fields render with correct labels
- Submit disabled while empty
- Type 1 char in recipient + 1 char in text → submit enabled
- Type > 120 in text → counter goes red, validation error shown
- Submit valid form → navigates to `/success` (will 404 until Task 10)
- Open Convex dashboard → see new pending message with all 3 fields populated

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/form.tsx src/routeTree.gen.ts
git commit -m "feat(routes): /form with 3-field TanStack Form + submitMessage mutation"
```

---

## Task 10: Success page (`/success`)

**Files:**
- Create: `src/routes/success.tsx`

- [ ] **Step 1: Write `src/routes/success.tsx`**

```tsx
import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { getRandomSuccessMessage } from "#/lib/success-messages"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/success")({
	component: SuccessPage,
})

function SuccessPage() {
	const [message] = useState(() => getRandomSuccessMessage())

	return (
		<main className="min-h-svh flex items-center justify-center px-6 py-12 bg-[var(--sea-ink)] text-[var(--sand)]">
			<div className="max-w-lg w-full flex flex-col items-center gap-10 text-center">
				<div className="text-[var(--lagoon)] text-sm tracking-[0.3em] uppercase">
					Poslato
				</div>
				<p className="font-serif text-3xl sm:text-4xl leading-tight italic">
					{message}
				</p>
				<div className="flex flex-col gap-3 w-full max-w-xs">
					<Button
						asChild
						variant="outline"
						className="border-[var(--lagoon)] text-[var(--lagoon)] bg-transparent hover:bg-[var(--lagoon)] hover:text-[var(--sea-ink)] rounded-full py-5"
					>
						<Link to="/form">Pošalji još jednu</Link>
					</Button>
				</div>
				<div className="text-xs text-[var(--lagoon)] mt-4">#AjЛajmЈy</div>
			</div>
		</main>
	)
}
```

- [ ] **Step 2: Manual smoke test**

```bash
pnpm dev
```

Open `http://localhost:3000/success`. Verify:
- Renders one of the 8 success messages (refresh several times to see different ones)
- "Pošalji još jednu" button navigates back to `/form`
- Dark background (sea-ink), readable

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/routes/success.tsx src/routeTree.gen.ts
git commit -m "feat(routes): /success with random message + back-to-form link"
```

---

## Task 11: Display page (`/display`)

Fullscreen rotator subscribed to `getApprovedMessages`.

**Files:**
- Create: `src/routes/display.tsx`

- [ ] **Step 1: Write `src/routes/display.tsx`**

```tsx
import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export const Route = createFileRoute("/display")({
	component: DisplayPage,
})

const ROTATION_MS = 7000

function DisplayPage() {
	const messages = useQuery(api.messages.getApprovedMessages)
	const [index, setIndex] = useState(0)

	useEffect(() => {
		if (!messages || messages.length === 0) return
		if (index >= messages.length) setIndex(0)
	}, [messages, index])

	useEffect(() => {
		if (!messages || messages.length <= 1) return
		const id = setInterval(() => {
			setIndex((i) => (i + 1) % messages.length)
		}, ROTATION_MS)
		return () => clearInterval(id)
	}, [messages])

	if (messages === undefined) {
		return (
			<main className="min-h-svh flex items-center justify-center bg-[var(--sea-ink)] text-[var(--sand)]">
				<p className="font-serif text-2xl opacity-50">Učitavanje…</p>
			</main>
		)
	}

	if (messages.length === 0) {
		return (
			<main className="min-h-svh flex items-center justify-center bg-[var(--sea-ink)] text-[var(--sand)] px-6">
				<p className="font-serif text-3xl text-center opacity-70">
					Čekamo prve poruke…
				</p>
			</main>
		)
	}

	const safeIndex = index >= messages.length ? 0 : index
	const current = messages[safeIndex]

	return (
		<main className="min-h-svh flex flex-col items-center justify-center bg-[var(--sea-ink)] text-[var(--sand)] px-12 py-16 relative overflow-hidden">
			<div className="absolute top-8 left-8 text-xs tracking-[0.4em] uppercase text-[var(--lagoon)]">
				AJ ЛАЈМ ЈУ — Live wall
			</div>

			<div
				key={current._id}
				className="flex flex-col items-center justify-center text-center max-w-5xl gap-10 animate-in fade-in duration-700"
			>
				<div className="text-[var(--lagoon)] text-2xl sm:text-3xl tracking-[0.25em] uppercase font-bold">
					{current.recipient}
				</div>

				<p className="font-serif italic text-5xl sm:text-7xl leading-[1.1]">
					{current.text}
				</p>

				{current.signature && (
					<div className="text-[var(--sand)] opacity-60 text-xl">
						— {current.signature}
					</div>
				)}
			</div>

			<div className="absolute bottom-8 right-8 text-2xl text-[var(--lagoon)] font-bold tracking-wider">
				#AjЛajmЈy
			</div>

			<div className="absolute bottom-8 left-8 text-sm text-[var(--lagoon)] opacity-60 tabular-nums">
				{safeIndex + 1} / {messages.length}
			</div>
		</main>
	)
}
```

- [ ] **Step 2: Manual smoke test (single tab)**

```bash
pnpm dev
```

Open `http://localhost:3000/display`. With no approved messages yet, expect "Čekamo prve poruke…".

Open Convex dashboard. Manually insert a row in `messages` table with `status: "approved"`, `recipient: "test"`, `text: "Hello world"`, `createdAt: Date.now()`. Display should reactively show it within 1-2s.

Insert 2 more approved messages. Verify rotation: each shown ~7s, crossfade animation visible.

- [ ] **Step 3: Manual smoke test (two tabs)**

Open `/display` in 2 tabs side by side. Approve another message via Convex dashboard — both tabs update.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/display.tsx src/routeTree.gen.ts
git commit -m "feat(routes): /display fullscreen rotator with reactive updates"
```

---

## Task 12: Admin page (`/admin`) + set Convex env var

**Files:**
- Create: `src/routes/admin.tsx`

- [ ] **Step 1: Set ADMIN_PASSWORD env var in Convex**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
pnpm exec convex env set ADMIN_PASSWORD cockta2025
```

Expected: success message. Verify with:

```bash
pnpm exec convex env list
```

- [ ] **Step 2: Write `src/routes/admin.tsx`**

```tsx
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAdminPassword } from "#/lib/admin-auth"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card"

export const Route = createFileRoute("/admin")({
	component: AdminPage,
})

function AdminPage() {
	const { password, setPassword, clearPassword } = useAdminPassword()

	if (!password) {
		return <PasswordGate onSubmit={setPassword} />
	}

	return <AdminDashboard password={password} onLogout={clearPassword} />
}

function PasswordGate({ onSubmit }: { onSubmit: (value: string) => void }) {
	const [value, setValue] = useState("")
	const [error, setError] = useState<string | null>(null)

	return (
		<main className="min-h-svh flex items-center justify-center px-6 bg-[var(--sand)] text-[var(--sea-ink)]">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					if (value.trim().length === 0) {
						setError("Unesi lozinku")
						return
					}
					onSubmit(value.trim())
				}}
				className="flex flex-col gap-4 w-full max-w-sm"
			>
				<h1 className="font-serif text-2xl text-center mb-2">Admin</h1>
				<Label htmlFor="admin-password">Lozinka</Label>
				<Input
					id="admin-password"
					type="password"
					value={value}
					onChange={(e) => {
						setValue(e.target.value)
						setError(null)
					}}
					autoFocus
				/>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<Button
					type="submit"
					className="bg-[var(--sea-ink)] text-[var(--sand)] hover:bg-[var(--palm)] rounded-full"
				>
					Uđi
				</Button>
			</form>
		</main>
	)
}

function AdminDashboard({
	password,
	onLogout,
}: {
	password: string
	onLogout: () => void
}) {
	const result = useQuery(api.messages.getPendingMessages, {
		adminPassword: password,
	})
	const approve = useMutation(api.messages.approveMessage)
	const reject = useMutation(api.messages.rejectMessage)

	// Convex throws Unauthorized on bad password; useQuery surfaces it as a thrown error caught by error boundary or returned as undefined depending on setup. Detect by trying once and clearing on failure.
	if (result instanceof Error) {
		onLogout()
		return null
	}

	return (
		<main className="min-h-svh px-6 py-8 bg-[var(--sand)] text-[var(--sea-ink)]">
			<div className="max-w-2xl mx-auto">
				<header className="flex justify-between items-center mb-8">
					<div>
						<h1 className="font-serif text-2xl">Moderacija</h1>
						<p className="text-sm text-[var(--palm)]">
							{result === undefined
								? "Učitavanje…"
								: `${result.length} pending`}
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={onLogout}>
						Odjavi se
					</Button>
				</header>

				{result === undefined && (
					<p className="text-center text-[var(--palm)]">Učitavanje…</p>
				)}

				{result !== undefined && result.length === 0 && (
					<p className="text-center text-[var(--palm)] py-12">
						Nema poruka za moderaciju.
					</p>
				)}

				{result !== undefined && result.length > 0 && (
					<div className="flex flex-col gap-4">
						{result.map((msg) => (
							<Card key={msg._id}>
								<CardHeader>
									<CardTitle className="text-base font-bold">
										{msg.recipient}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-lg">{msg.text}</p>
									{msg.signature && (
										<p className="text-sm text-[var(--palm)] mt-2">
											— {msg.signature}
										</p>
									)}
									<p className="text-xs text-[var(--palm)] opacity-60 mt-3 tabular-nums">
										{new Date(msg.createdAt).toLocaleTimeString("sr-RS")}
									</p>
								</CardContent>
								<CardFooter className="gap-2">
									<Button
										size="sm"
										onClick={() =>
											approve({
												messageId: msg._id,
												adminPassword: password,
											})
										}
										className="bg-[var(--palm)] hover:bg-[var(--sea-ink)] text-[var(--sand)]"
									>
										Approve
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											reject({
												messageId: msg._id,
												adminPassword: password,
											})
										}
										className="border-red-600 text-red-600 hover:bg-red-50"
									>
										Reject
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
```

**Note on bad password handling:** Convex's `useQuery` may surface a thrown server error in different ways depending on the version. The simple guard `result instanceof Error` may not match Convex's actual behavior. If during manual testing a bad password causes an unhandled crash instead of a clean logout, replace the guard with a TanStack Query-based wrapper (`useConvexQuery` from `@convex-dev/react-query` returns `{data, error}`). Try the simple version first; iterate only if needed.

- [ ] **Step 3: Manual smoke test (happy path)**

```bash
pnpm dev
```

Open `http://localhost:3000/admin`. Verify:
- Password gate shows
- Wrong password ("foo") → either error shown or auto-logout (depends on Convex behavior — see note above)
- Correct password ("cockta2025") → moderation list appears
- Submit a new message via `/form` in another tab → appears in admin list within 1-2s
- Click Approve → message disappears from pending list
- Open `/display` in third tab → approved message appears
- Click Reject on another → message disappears, doesn't show on display
- Refresh `/admin` → stays logged in (localStorage persists)
- Click "Odjavi se" → returns to password gate

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/admin.tsx src/routeTree.gen.ts
git commit -m "feat(routes): /admin with password gate + approve/reject UI"
```

---

## Task 13: Final verification

**Files:** none modified (just verification).

- [ ] **Step 1: Biome check**

```bash
cd "c:/Users/Pc/Desktop/Projects/cockta-lime"
pnpm check
```

Expected: 0 errors. Fix any biome lint/format issues.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: 7 passing (3 in success-messages, 4 in admin-auth).

- [ ] **Step 3: TypeScript check (root)**

```bash
pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Production build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 5: Mobile viewport smoke test**

```bash
pnpm dev
```

In Chrome DevTools, switch to iPhone SE viewport. Walk through:
- `/` → tap CTA → `/form`
- Fill all 3 fields → submit → `/success`
- Tap "Pošalji još jednu" → back to `/form`
- `/display` (rotate device to landscape, simulate projector)
- `/admin` (login with `cockta2025`, approve a message)

Verify no horizontal scroll, all touch targets reachable, text readable.

Stop dev server.

- [ ] **Step 6: Final commit (if any biome fixups)**

```bash
git status
# If anything modified by biome fixes:
git add -A
git commit -m "chore: apply biome fixes from final pass"
```

If nothing modified, skip the commit.

- [ ] **Step 7: Summary log**

Print final state:

```bash
git log --oneline
```

Expected: 12+ commits, MVP complete.

---

## Self-review checklist (already run by author 2026-04-16)

- [x] Spec coverage: every requirement in `2026-04-16-aj-lajm-ju-mvp-design.md` mapped to a task (landing → T8, form → T9, success → T10 + T6, display → T11, admin → T12 + T7, schema → T2, messages → T3, chrome strip → T4, card → T5).
- [x] No placeholders: every step has actual file paths and complete code.
- [x] Type consistency: `useAdminPassword()` shape (`{password, setPassword, clearPassword}`) matches across T7 test, T7 impl, T12 usage. `submitMessage` args match T3 signature and T9 form payload. `getApprovedMessages` returns documents with `_id`, `recipient`, `text`, `signature?`, `createdAt` — matches T11 display usage.
- [x] Open ambiguity flagged inline: T9 step 2 (Convex client integration variants) and T12 step 2 (`useQuery` error handling) document fallback approaches if the primary doesn't fit the project's actual Convex setup.
