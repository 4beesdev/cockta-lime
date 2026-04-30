import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminPassword } from "#/lib/admin-auth";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

function extractErrorMessage(err: unknown): string {
	if (!(err instanceof Error)) return "Nepoznata greška.";
	const msg = err.message;
	if (msg.includes("Unauthorized"))
		return "Pogrešna lozinka ili sesija je istekla.";
	if (msg.includes("ADMIN_PASSWORD not configured"))
		return "Server nije konfigurisan.";
	const match = msg.match(/Uncaught Error:\s*(.+?)(?:\n|$)/);
	if (match?.[1]) return match[1];
	return msg.length > 200 ? "Greška pri komunikaciji sa serverom." : msg;
}

export const Route = createFileRoute("/admin")({
	component: AdminPage,
});

const FONT_MONO = "'Roboto Mono', ui-monospace, monospace";
const FONT_CONDENSED = "'Roboto Condensed', system-ui, sans-serif";
const YELLOW_BUTTON_BG =
	"linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgb(245,205,33) 0%, rgb(245,205,33) 100%)";

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type MessageStatus = "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<MessageStatus, string> = {
	pending: "Na čekanju",
	approved: "Odobrena",
	rejected: "Odbačena",
};

const STATUS_TAB_LABEL: Record<StatusFilter, string> = {
	pending: "Na čekanju",
	approved: "Odobrene",
	rejected: "Odbačene",
	all: "Sve",
};

const WALL_LAYOUT_PRESETS: ReadonlyArray<{ rows: number; cols: number }> = [
	{ rows: 3, cols: 3 },
	{ rows: 4, cols: 3 },
	{ rows: 4, cols: 4 },
	{ rows: 5, cols: 4 },
	{ rows: 6, cols: 4 },
	{ rows: 6, cols: 5 },
	{ rows: 7, cols: 5 },
	{ rows: 8, cols: 5 },
];

// --- Shared shell with blue background + texture ---

function AdminShell({ children }: { children: React.ReactNode }) {
	return (
		<main
			className="relative min-h-svh w-full overflow-x-hidden bg-[#46aad3] text-white"
			style={{ fontFamily: FONT_MONO }}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay"
				style={{
					backgroundImage: "url(/figma/image9.png)",
					backgroundSize: "200px 200px",
					backgroundRepeat: "repeat",
				}}
			/>
			<div className="relative z-10">{children}</div>
		</main>
	);
}

// --- ErrorBoundary ---

class AdminErrorBoundary extends React.Component<
	{ onError: () => void; children: React.ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch(error: Error) {
		toast.error(extractErrorMessage(error));
		this.props.onError();
	}
	render() {
		if (this.state.hasError) return null;
		return this.props.children;
	}
}

// --- Password Gate ---

function PasswordGate({ onSubmit }: { onSubmit: (value: string) => void }) {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [verifying, setVerifying] = useState(false);
	const verifyPassword = useMutation(api.messages.verifyAdminPassword);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) {
			setError("Upiši lozinku.");
			return;
		}
		setError(null);
		setVerifying(true);
		try {
			await verifyPassword({ adminPassword: trimmed });
			onSubmit(trimmed);
		} catch (err) {
			const m = extractErrorMessage(err);
			setError(m);
			toast.error(m);
			setVerifying(false);
		}
	}

	return (
		<AdminShell>
			<div className="flex min-h-svh items-center justify-center px-4 py-12">
				<div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl bg-[#3d95b9] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
					<header className="text-center">
						<p className="mb-2 text-[12px] tracking-[0.3em] uppercase text-white/70">
							Jurka × Cockta
						</p>
						<h1
							className="text-[24px] leading-tight font-bold text-white"
							style={{ fontFamily: FONT_MONO }}
						>
							Admin
						</h1>
					</header>

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label
								htmlFor="admin-password"
								className="text-[16px] leading-[26.56px] font-semibold text-white"
							>
								Lozinka<span className="ml-1 text-[#f5cd21]">*</span>
							</label>
							<input
								id="admin-password"
								type="password"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								placeholder="••••••••"
								className="h-14 w-full rounded-lg border border-white bg-white px-4.75 text-[14px] tracking-tight text-[#222529] placeholder:text-[#222529]/60 outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
							/>
							{error && <p className="text-sm text-[#f5cd21]">{error}</p>}
						</div>
						<button
							type="submit"
							disabled={verifying}
							className="w-full cursor-pointer rounded-[12px] px-6 py-4 text-[18px] font-bold tracking-wide text-[#222529] uppercase shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
							style={{
								backgroundImage: YELLOW_BUTTON_BG,
								fontFamily: FONT_CONDENSED,
							}}
						>
							{verifying ? "Proveravam…" : "Uđi"}
						</button>
					</form>
				</div>
			</div>
		</AdminShell>
	);
}

// --- Status badge ---

function StatusBadge({ status }: { status: MessageStatus }) {
	const styles: Record<MessageStatus, string> = {
		pending: "bg-[#f5cd21]/20 text-[#a07e00] border-[#f5cd21]",
		approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/60",
		rejected: "bg-red-500/15 text-red-700 border-red-500/60",
	};
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap uppercase tracking-wide ${styles[status]}`}
			style={{ fontFamily: FONT_CONDENSED }}
		>
			{STATUS_LABEL[status]}
		</span>
	);
}

// --- Status filter tabs ---

function StatusTabs({
	current,
	counts,
	onChange,
}: {
	current: StatusFilter;
	counts: Record<StatusFilter, number | undefined>;
	onChange: (s: StatusFilter) => void;
}) {
	const tabs: StatusFilter[] = ["all", "pending", "approved", "rejected"];
	return (
		<div className="flex flex-wrap gap-2">
			{tabs.map((tab) => {
				const active = current === tab;
				const count = counts[tab];
				return (
					<button
						key={tab}
						type="button"
						onClick={() => onChange(tab)}
						className={`cursor-pointer rounded-full border-2 px-4 py-2 text-[14px] font-bold tracking-wide uppercase transition active:scale-[0.98] ${
							active
								? "border-[#f5cd21] bg-[#f5cd21] text-[#222529]"
								: "border-white/60 bg-transparent text-white hover:bg-white/10"
						}`}
						style={{ fontFamily: FONT_CONDENSED }}
					>
						{STATUS_TAB_LABEL[tab]}
						{count !== undefined && (
							<span
								className={`ml-2 inline-block rounded-full px-1.5 text-[12px] ${
									active ? "bg-[#222529]/20" : "bg-white/20"
								}`}
							>
								{count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

// --- Admin Dashboard ---

function AdminDashboard({
	password,
	onLogout,
}: {
	password: string;
	onLogout: () => void;
}) {
	const [filter, setFilter] = useState<StatusFilter>("all");

	const messages = useQuery(api.messages.getAllMessages, {
		adminPassword: password,
		status: filter === "all" ? undefined : filter,
	});

	const allMessages = useQuery(api.messages.getAllMessages, {
		adminPassword: password,
	});

	const setStatus = useMutation(api.messages.setMessageStatus);
	const wallSettings = useQuery(api.messages.getWallSettings, {});
	const setWallSettings = useMutation(api.messages.setWallSettings);

	const counts: Record<StatusFilter, number | undefined> = {
		pending: allMessages?.filter((m) => m.status === "pending").length,
		approved: allMessages?.filter((m) => m.status === "approved").length,
		rejected: allMessages?.filter((m) => m.status === "rejected").length,
		all: allMessages?.length,
	};

	const handleSetWallLayout = (rows: number, cols: number) => {
		setWallSettings({ adminPassword: password, rows, cols }).catch((err) => {
			toast.error(extractErrorMessage(err));
		});
	};

	const handleSetStatus = (
		messageId: Id<"messages">,
		status: MessageStatus,
	) => {
		setStatus({ messageId, adminPassword: password, status }).catch((err) => {
			toast.error(extractErrorMessage(err));
		});
	};

	const [editing, setEditing] = useState<Doc<"messages"> | null>(null);

	const renderActions = (msg: Doc<"messages">) => (
		<div className="flex flex-wrap gap-2">
			<button
				type="button"
				onClick={() => setEditing(msg)}
				className="cursor-pointer rounded-full border border-[#3d95b9] bg-white px-3 py-1.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-[#3d95b9] uppercase transition hover:bg-[#3d95b9]/10 active:scale-[0.98]"
				style={{ fontFamily: FONT_CONDENSED }}
			>
				Izmeni
			</button>
			{msg.status !== "approved" && (
				<button
					type="button"
					onClick={() => handleSetStatus(msg._id, "approved")}
					className="cursor-pointer rounded-full bg-emerald-500 px-3 py-1.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-white uppercase transition hover:bg-emerald-600 active:scale-[0.98]"
					style={{ fontFamily: FONT_CONDENSED }}
				>
					Odobri
				</button>
			)}
			{msg.status !== "rejected" && (
				<button
					type="button"
					onClick={() => handleSetStatus(msg._id, "rejected")}
					className="cursor-pointer rounded-full border border-red-500 bg-white px-3 py-1.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-red-600 uppercase transition hover:bg-red-50 active:scale-[0.98]"
					style={{ fontFamily: FONT_CONDENSED }}
				>
					Odbaci
				</button>
			)}
			{/* "Vrati u pending" — privremeno sakriveno; Odobri/Odbaci su dovoljni za moderaciju
			{msg.status !== "pending" && (
				<button
					type="button"
					onClick={() => handleSetStatus(msg._id, "pending")}
					className="cursor-pointer rounded-full border border-[#222529]/30 bg-white px-3 py-1.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-[#222529]/70 uppercase transition hover:bg-[#222529]/5 active:scale-[0.98]"
					style={{ fontFamily: FONT_CONDENSED }}
				>
					Vrati
				</button>
			)}
			*/}
		</div>
	);

	return (
		<AdminShell>
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
				{/* Header */}
				<header className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="mb-1 text-[12px] tracking-[0.3em] uppercase text-white/70">
							AJ ЛАЈМ ЈУ
						</p>
						<h1
							className="text-[28px] leading-tight font-bold text-white"
							style={{ fontFamily: FONT_MONO }}
						>
							Moderacija
						</h1>
					</div>
					<button
						type="button"
						onClick={onLogout}
						className="cursor-pointer rounded-full border-2 border-white/60 bg-transparent px-5 py-2 text-[14px] font-bold tracking-wide text-white uppercase transition hover:bg-white/10 active:scale-[0.98]"
						style={{ fontFamily: FONT_CONDENSED }}
					>
						Odjavi se
					</button>
				</header>

				{/* Wall settings — broj poruka na ekranu */}
				<section className="flex flex-col gap-3 rounded-2xl bg-[#3d95b9] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<h2
							className="text-[16px] leading-[26.56px] font-semibold text-white"
							style={{ fontFamily: FONT_MONO }}
						>
							Broj poruka na zidu
						</h2>
						{wallSettings && (
							<span className="text-[13px] text-white/70">
								Trenutno:{" "}
								<span className="font-semibold text-white">
									{wallSettings.rows} × {wallSettings.cols} ={" "}
									{wallSettings.rows * wallSettings.cols}
								</span>
							</span>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						{WALL_LAYOUT_PRESETS.map((p) => {
							const active =
								wallSettings?.rows === p.rows && wallSettings?.cols === p.cols;
							return (
								<button
									key={`${p.rows}x${p.cols}`}
									type="button"
									onClick={() => handleSetWallLayout(p.rows, p.cols)}
									className={`cursor-pointer rounded-full border-2 px-4 py-2 text-[14px] font-bold tracking-wide uppercase transition active:scale-[0.98] ${
										active
											? "border-[#f5cd21] bg-[#f5cd21] text-[#222529]"
											: "border-white/60 bg-transparent text-white hover:bg-white/10"
									}`}
									style={{ fontFamily: FONT_CONDENSED }}
								>
									{p.rows} × {p.cols}
									<span
										className={`ml-2 inline-block rounded-full px-1.5 text-[12px] ${
											active ? "bg-[#222529]/20" : "bg-white/20"
										}`}
									>
										{p.rows * p.cols}
									</span>
								</button>
							);
						})}
					</div>
				</section>

				{/* Filter tabs */}
				<StatusTabs current={filter} counts={counts} onChange={setFilter} />

				{/* Empty / loading states */}
				{messages === undefined && (
					<div className="rounded-2xl bg-white p-12 text-center text-[#222529]/60 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
						Učitavanje…
					</div>
				)}
				{messages !== undefined && messages.length === 0 && (
					<div className="rounded-2xl bg-white p-12 text-center text-[#222529]/60 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
						Nema poruka za ovaj filter.
					</div>
				)}

				{/* Desktop: tabela (lg+) */}
				{messages && messages.length > 0 && (
					<div className="hidden overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.18)] lg:block">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-[14px] text-[#222529]">
								<thead className="bg-[#3d95b9]/10 text-[12px] tracking-wide text-[#3d95b9] uppercase">
									<tr>
										<th className="px-4 py-3 font-semibold">Vreme</th>
										<th className="px-4 py-3 font-semibold">Kome</th>
										<th className="px-4 py-3 font-semibold">Poruka</th>
										<th className="px-4 py-3 font-semibold">Potpis</th>
										<th className="px-4 py-3 font-semibold">Status</th>
										<th className="px-4 py-3 font-semibold">Akcije</th>
									</tr>
								</thead>
								<tbody>
									{messages.map((msg) => (
										<tr
											key={msg._id}
											className="border-t border-[#222529]/10 align-top transition hover:bg-[#3d95b9]/5"
										>
											<td className="px-4 py-4 whitespace-nowrap text-[#222529]/70 tabular-nums">
												{formatDateTime(msg.createdAt)}
											</td>
											<td className="px-4 py-4 font-semibold">
												{msg.recipient}
											</td>
											<td className="max-w-md px-4 py-4">{msg.text}</td>
											<td className="px-4 py-4 text-[#222529]/70">
												{msg.signature || "—"}
											</td>
											<td className="px-4 py-4">
												<StatusBadge status={msg.status} />
											</td>
											<td className="px-4 py-4">{renderActions(msg)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Mobile / tablet: kartice (< lg) */}
				{messages && messages.length > 0 && (
					<div className="flex flex-col gap-3 lg:hidden">
						{messages.map((msg) => (
							<div
								key={msg._id}
								className="rounded-[12px] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
							>
								<div className="mb-2 flex items-center justify-between gap-2">
									<span className="text-[12px] tabular-nums text-[#222529]/60">
										{formatDateTime(msg.createdAt)}
									</span>
									<StatusBadge status={msg.status} />
								</div>
								<p className="text-[12px] font-bold tracking-wide text-[#3d95b9] uppercase">
									{msg.recipient}
								</p>
								<p className="mt-1 text-[15px] font-semibold text-[#222529]">
									{msg.text}
								</p>
								{msg.signature && (
									<p className="mt-2 text-[12px] text-[#222529]/70">
										Potpis: {msg.signature}
									</p>
								)}
								<div className="mt-3 border-t border-[#222529]/10 pt-3">
									{renderActions(msg)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			{editing && (
				<EditMessageModal
					message={editing}
					password={password}
					onClose={() => setEditing(null)}
				/>
			)}
		</AdminShell>
	);
}

// --- Edit Message Modal ---

function EditMessageModal({
	message,
	password,
	onClose,
}: {
	message: Doc<"messages">;
	password: string;
	onClose: () => void;
}) {
	const [recipient, setRecipient] = useState(message.recipient);
	const [text, setText] = useState(message.text);
	const [signature, setSignature] = useState(message.signature ?? "");
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const updateMessage = useMutation(api.messages.updateMessage);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	const recipientTrim = recipient.trim();
	const textTrim = text.trim();
	const signatureTrim = signature.trim();

	const canSave =
		recipientTrim.length >= 1 &&
		recipientTrim.length <= 100 &&
		textTrim.length >= 1 &&
		textTrim.length <= 120 &&
		signatureTrim.length <= 50 &&
		!saving;

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		setError(null);
		try {
			await updateMessage({
				messageId: message._id,
				adminPassword: password,
				recipient: recipientTrim,
				text: textTrim,
				signature: signatureTrim || undefined,
			});
			toast.success("Poruka sačuvana.");
			onClose();
		} catch (err) {
			const m = extractErrorMessage(err);
			setError(m);
			toast.error(m);
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<button
				type="button"
				aria-label="Zatvori"
				onClick={onClose}
				className="absolute inset-0 cursor-default bg-black/60"
			/>
			<div className="relative w-full max-w-md rounded-2xl bg-[#3d95b9] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
				<h2
					className="mb-5 text-[20px] leading-tight font-bold text-white"
					style={{ fontFamily: FONT_MONO }}
				>
					Izmeni poruku
				</h2>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<label
							htmlFor="edit-recipient"
							className="text-[14px] font-semibold text-white"
						>
							Kome <span className="text-[#f5cd21]">*</span>
						</label>
						<input
							id="edit-recipient"
							type="text"
							value={recipient}
							onChange={(e) => setRecipient(e.target.value)}
							maxLength={100}
							className="h-12 w-full rounded-lg border border-white bg-white px-3 text-[14px] tracking-tight text-[#222529] outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label
							htmlFor="edit-text"
							className="text-[14px] font-semibold text-white"
						>
							Poruka <span className="text-[#f5cd21]">*</span>
						</label>
						<textarea
							id="edit-text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							maxLength={120}
							rows={3}
							className="w-full resize-none rounded-lg border border-white bg-white px-3 py-2 text-[14px] tracking-tight text-[#222529] outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
						/>
						<div className="text-right text-[12px] tabular-nums text-white/70">
							{text.length}/120
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<label
							htmlFor="edit-signature"
							className="text-[14px] font-semibold text-white"
						>
							Potpis (opciono)
						</label>
						<input
							id="edit-signature"
							type="text"
							value={signature}
							onChange={(e) => setSignature(e.target.value)}
							maxLength={50}
							className="h-12 w-full rounded-lg border border-white bg-white px-3 text-[14px] tracking-tight text-[#222529] outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
						/>
					</div>

					{error && <p className="text-[14px] text-[#f5cd21]">{error}</p>}

					<div className="mt-2 flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 cursor-pointer rounded-full border-2 border-white bg-transparent px-4 py-3 text-[14px] font-bold tracking-wide text-white uppercase transition hover:bg-white/10 active:scale-[0.98]"
							style={{ fontFamily: FONT_CONDENSED }}
						>
							Otkaži
						</button>
						<button
							type="button"
							onClick={handleSave}
							disabled={!canSave}
							className="flex-1 cursor-pointer rounded-full px-4 py-3 text-[14px] font-bold tracking-wide text-[#222529] uppercase shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
							style={{
								backgroundImage: YELLOW_BUTTON_BG,
								fontFamily: FONT_CONDENSED,
							}}
						>
							{saving ? "Čuvam…" : "Sačuvaj"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function formatDateTime(ts: number): string {
	const d = new Date(ts);
	const date = d.toLocaleDateString("sr-RS", {
		day: "2-digit",
		month: "2-digit",
	});
	const time = d.toLocaleTimeString("sr-RS", {
		hour: "2-digit",
		minute: "2-digit",
	});
	return `${date} ${time}`;
}

// --- Admin Page (root) ---

function AdminPage() {
	const { password, setPassword, clearPassword } = useAdminPassword();

	if (!password) return <PasswordGate onSubmit={setPassword} />;

	return (
		<AdminErrorBoundary onError={clearPassword}>
			<AdminDashboard password={password} onLogout={clearPassword} />
		</AdminErrorBoundary>
	);
}
