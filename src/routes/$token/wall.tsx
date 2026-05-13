import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

// Random token koji štiti wall od slučajnih poseta.
// Pristup: /<WALL_TOKEN>/wall
const WALL_TOKEN = "9k7Xm2Pq4nT8wRyZb6cN3vJh";

export const Route = createFileRoute("/$token/wall")({
	component: WallRoute,
});

function WallRoute() {
	const { token } = Route.useParams();
	if (token !== WALL_TOKEN) return <WallNotFound />;
	return <WallPage />;
}

function WallNotFound() {
	return (
		<main
			className="flex min-h-svh w-full items-center justify-center bg-[#46aad3] px-6 text-center text-white"
			style={{ fontFamily: "'Roboto Mono', ui-monospace, monospace" }}
		>
			<div className="flex flex-col items-center gap-3">
				<p className="text-[clamp(48px,8vw,96px)] font-bold leading-none">
					404
				</p>
				<p className="text-[clamp(16px,2vw,24px)] font-medium opacity-80">
					Stranica ne postoji.
				</p>
			</div>
		</main>
	);
}

const FONT_MONO = "'Roboto Mono', ui-monospace, monospace";

const FOOTER_KEYS = Array.from({ length: 14 }, (_, i) => `wall-foot-${i}`);

const COLUMN_KEYS = Array.from({ length: 8 }, (_, i) => `wall-col-${i}`);

function formatHHmm(d: Date): string {
	const h = d.getHours().toString().padStart(2, "0");
	const m = d.getMinutes().toString().padStart(2, "0");
	return `${h}:${m}`;
}

function WallPage() {
	const settings = useQuery(api.messages.getWallSettings, {});
	const rows = settings?.rows ?? 3;
	const cols = settings?.cols ?? 3;
	const highlightedMessageId = settings?.highlightedMessageId ?? null;
	const limit = rows * cols;

	const messages = useQuery(api.messages.getApprovedMessages, { limit });

	const [now, setNow] = useState<Date>(() => new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	// Round-robin raspodela; istaknuta uvek na top-left (msg[0])
	const columnsData = useMemo<Doc<"messages">[][]>(() => {
		const result: Doc<"messages">[][] = Array.from(
			{ length: cols },
			() => [],
		);
		if (!messages) return result;

		const highlighted = highlightedMessageId
			? (messages.find((m) => m._id === highlightedMessageId) ?? null)
			: null;
		const rest = highlighted
			? messages.filter((m) => m._id !== highlightedMessageId)
			: messages;
		const ordered = highlighted ? [highlighted, ...rest] : rest;

		ordered.forEach((msg, i) => {
			result[i % cols].push(msg);
		});
		return result;
	}, [messages, cols, highlightedMessageId]);

	return (
		<main
			className="relative flex h-svh w-full flex-col overflow-hidden bg-[#46aad3] text-white"
			style={{ fontFamily: FONT_MONO }}
		>
			{/* Žuta apstraktna pozadinska forma — drift + breathe */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
			>
				<img
					src="/figma/yellow-splash.svg"
					alt=""
					className="wall-float w-[110vw] max-w-none select-none"
				/>
			</div>

			{/* Paper texture overlay */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay"
				style={{
					backgroundImage: "url(/figma/image9.png)",
					backgroundSize: "200px 200px",
					backgroundRepeat: "repeat",
				}}
			/>

			{/* Header */}
			<header className="relative z-10 flex w-full items-center gap-6 px-6 pt-6">
				<img
					src="/figma/aj-lajm-ju-banner.svg"
					alt="AJ ЛАЈМ ЈУ"
					className="h-16 w-41.5 shrink-0 select-none"
				/>

				<div className="relative flex flex-1 items-center justify-center gap-[8vw] text-[clamp(24px,2.6vw,40px)] leading-none font-bold tracking-tight text-white uppercase">
					<span>Možda je neko</span>
					<img
						src="/figma/disco-ball.png"
						alt=""
						aria-hidden="true"
						className="absolute top-1/2 left-[48%] h-[clamp(110px,12vw,220px)] -translate-x-1/2 -translate-y-[62%] select-none"
					/>
					<span>pisao baš tebi?</span>
				</div>

				<div className="flex shrink-0 items-center gap-2.5 rounded-full border-2 border-white px-4 py-2">
					<span className="size-2 animate-pulse rounded-full bg-red-600" />
					<span className="text-[clamp(16px,1.6vw,24px)] font-bold tabular-nums tracking-tight text-white uppercase">
						{formatHHmm(now)}
					</span>
				</div>
			</header>

			{/* Messages — flexbox kolone sa round-robin raspodelom */}
			{messages && messages.length === 0 ? (
				<div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-6 py-12 text-[clamp(20px,2vw,32px)] font-medium text-white/80">
					Čekamo prve poruke…
				</div>
			) : (
				<LayoutGroup>
					<section className="relative z-10 flex min-h-0 flex-1 gap-4 overflow-hidden px-6 py-12">
						{messages === undefined
							? Array.from(
									{ length: cols },
									(_, c) => `skeleton-col-${c}`,
								).map((colKey) => (
									<div key={colKey} className="flex flex-1 flex-col gap-4">
										{Array.from(
											{ length: rows },
											(_, r) => `${colKey}-${r}`,
										).map((rowKey) => (
											<div
												key={rowKey}
												className="h-32 rounded-xl bg-white/30"
												aria-hidden="true"
											/>
										))}
									</div>
								))
							: columnsData.map((colMessages, colIdx) => (
									<MessageColumn
										key={COLUMN_KEYS[colIdx]}
										messages={colMessages}
										highlightedMessageId={highlightedMessageId}
									/>
								))}
					</section>
				</LayoutGroup>
			)}

			{/* QR poziv — iznad footer-a (jedna slika iz Figme) */}
			<section className="relative z-10 flex w-full items-center justify-center px-6 py-2">
				<img
					src="/figma/qr-banner.png"
					alt="Skeniraj QR kod na narukvici i pošalji poruku nekome ko ti se sviđa #AjЛajmЈy"
					className="h-auto max-w-full select-none"
				/>
			</section>

			{/* Footer marquee */}
			<footer className="relative z-10 w-full overflow-hidden py-2">
				<div className="aj-marquee flex w-max items-center gap-8 whitespace-nowrap">
					{FOOTER_KEYS.map((key, i) => (
						<div
							key={key}
							className="flex shrink-0 items-center gap-8"
							aria-hidden={i > 0 ? "true" : undefined}
						>
							<img
								src="/figma/cockta-logo.svg"
								alt={i === 0 ? "Cockta" : ""}
								className="h-8 w-13.5 shrink-0"
							/>
							<img
								src="/figma/jurka-logo.svg"
								alt={i === 0 ? "Jurka" : ""}
								className="h-5 w-21.25 shrink-0"
							/>
							<span
								className="shrink-0 text-[16px] font-bold tracking-tight text-[#2e81a3] normal-case"
								aria-hidden="true"
							>
								#AjЛajmЈy
							</span>
						</div>
					))}
				</div>
			</footer>
		</main>
	);
}

function MessageColumn({
	messages,
	highlightedMessageId,
}: {
	messages: Doc<"messages">[];
	highlightedMessageId: Doc<"messages">["_id"] | null;
}) {
	return (
		<div className="flex flex-1 flex-col gap-4">
			{messages.map((msg) => (
				<MessageCard
					key={msg._id}
					cardId={msg._id}
					recipient={msg.recipient}
					text={msg.text}
					signature={msg.signature}
					createdAt={msg.createdAt}
					isHighlighted={highlightedMessageId === msg._id}
				/>
			))}
		</div>
	);
}

function MessageCard({
	cardId,
	recipient,
	text,
	signature,
	createdAt,
	isHighlighted,
}: {
	cardId: string;
	recipient: string;
	text: string;
	signature?: string;
	createdAt: number;
	isHighlighted: boolean;
}) {
	const time = useMemo(() => formatHHmm(new Date(createdAt)), [createdAt]);

	// Plava tema istaknute kartice (žuta tema je sklonjena)
	const bg = isHighlighted ? "#2e81a3" : "#ffffff";
	const borderColor = isHighlighted ? "#f8cd04" : "#ffffff";
	const recipientColor = isHighlighted ? "#f8cd04" : "#3d95b9";
	const textColor = isHighlighted ? "#ffffff" : "#222529";

	return (
		<motion.div
			layoutId={cardId}
			layout
			initial={{ scale: 0.4, rotate: -8 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{
				layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
				scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
				rotate: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
			}}
			className="relative flex flex-col gap-3 overflow-visible rounded-xl border-4 p-2 transition-[background-color,border-color,color] duration-700 ease-out"
			style={{
				backgroundColor: bg,
				borderColor: borderColor,
				color: textColor,
			}}
		>
			{/* Paper grain overlay (samo na istaknutoj) */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 rounded-xl mix-blend-overlay transition-opacity duration-700 ease-out"
				style={{
					backgroundImage: "url(/figma/image9.png)",
					backgroundSize: "200px 200px",
					backgroundRepeat: "repeat",
					opacity: isHighlighted ? 1 : 0,
				}}
			/>

			<p
				className="relative z-10 text-[clamp(11px,0.95vw,14px)] font-medium tracking-tight transition-colors duration-700 ease-out"
				style={{
					color: recipientColor,
					textTransform: isHighlighted ? "none" : "uppercase",
				}}
			>
				{recipient}
			</p>
			<p className="relative z-10 text-[clamp(13px,1.1vw,16px)] leading-snug font-bold tracking-tight uppercase">
				{text} <span className="normal-case">#AjЛajmЈy</span>
			</p>
			<div className="relative z-10 flex items-center justify-between gap-2 text-[clamp(10px,0.9vw,14px)] font-medium tracking-tight uppercase">
				<span>{signature ?? ""}</span>
				<span className="tabular-nums opacity-50">{time}</span>
			</div>
		</motion.div>
	);
}
