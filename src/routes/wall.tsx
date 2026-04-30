import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/wall")({
	component: WallPage,
});

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
	const limit = rows * cols;

	const messages = useQuery(api.messages.getApprovedMessages, { limit });

	const [now, setNow] = useState<Date>(() => new Date());
	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	// Round-robin raspodela poruka po kolonama (msg[0]→col 0, msg[1]→col 1, …)
	const columnsData = useMemo<Doc<"messages">[][]>(() => {
		const result: Doc<"messages">[][] = Array.from(
			{ length: cols },
			() => [],
		);
		messages?.forEach((msg, i) => {
			result[i % cols].push(msg);
		});
		return result;
	}, [messages, cols]);

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
					className="h-16 w-[166px] shrink-0 select-none"
				/>

				<div className="relative flex flex-1 items-center justify-center gap-[8vw] text-[clamp(24px,2.6vw,40px)] leading-none font-bold tracking-tight text-white uppercase">
					<span>Tvoja poruka</span>
					<img
						src="/figma/disco-ball.png"
						alt=""
						aria-hidden="true"
						className="absolute top-1/2 left-1/2 h-[clamp(110px,12vw,220px)] -translate-x-1/2 -translate-y-[62%] select-none"
					/>
					<span>Njihov osmeh</span>
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
				<section className="relative z-10 flex min-h-0 flex-1 gap-4 overflow-hidden px-6 py-12">
					{messages === undefined
						? Array.from({ length: cols }, (_, c) => `skeleton-col-${c}`).map(
								(colKey) => (
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
								),
							)
						: columnsData.map((colMessages, colIdx) => (
								<div
									key={COLUMN_KEYS[colIdx]}
									className="flex flex-1 flex-col gap-4"
								>
									{colMessages.map((msg, msgIdx) => (
										<MessageCard
											key={msg._id}
											index={colIdx + msgIdx * cols}
											recipient={msg.recipient}
											text={msg.text}
											signature={msg.signature}
											createdAt={msg.createdAt}
										/>
									))}
								</div>
							))}
				</section>
			)}

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
								className="shrink-0 text-[16px] font-bold tracking-tight text-[#2e81a3] uppercase"
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

function MessageCard({
	index,
	recipient,
	text,
	signature,
	createdAt,
}: {
	index: number;
	recipient: string;
	text: string;
	signature?: string;
	createdAt: number;
}) {
	const time = useMemo(() => formatHHmm(new Date(createdAt)), [createdAt]);
	return (
		<div
			className="card-enter flex flex-col gap-3 rounded-xl border border-white bg-white p-3"
			style={{ animationDelay: `${index * 80}ms` }}
		>
			<p className="text-[clamp(11px,0.95vw,14px)] font-medium tracking-tight text-[#3d95b9] uppercase">
				{recipient}
			</p>
			<p className="text-[clamp(13px,1.1vw,16px)] leading-snug font-bold tracking-tight text-[#222529]">
				{text}
			</p>
			<div className="flex items-center justify-between text-[clamp(10px,0.9vw,14px)] font-medium tracking-tight text-[#222529] uppercase">
				<span className="opacity-50">#AjЛajmЈy</span>
				<span aria-hidden={!signature} className={signature ? "" : "opacity-0"}>
					{signature || "—"}
				</span>
				<span className="tabular-nums opacity-50">{time}</span>
			</div>
		</div>
	);
}
