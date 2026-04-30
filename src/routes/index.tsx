import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
	component: HomePage,
});

const RECIPIENT_PLACEHOLDERS = [
	"plava košulja na stage-u kod DJ-a",
	"devojka koja igra u prvom redu",
	"Jovani, zna ona koja je",
];

const YELLOW_BUTTON_BG =
	"linear-gradient(0deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 100%), linear-gradient(90deg, rgb(245,205,33) 0%, rgb(245,205,33) 100%)";

const MARQUEE_KEYS = Array.from({ length: 24 }, (_, i) => `aj-marq-${i}`);

function HomePage() {
	const navigate = useNavigate();
	const submitMessage = useMutation(api.messages.submitMessage);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const formCardRef = useRef<HTMLDivElement | null>(null);
	const [recipientPlaceholder, setRecipientPlaceholder] = useState(
		RECIPIENT_PLACEHOLDERS[0],
	);

	useEffect(() => {
		setRecipientPlaceholder(
			RECIPIENT_PLACEHOLDERS[
				Math.floor(Math.random() * RECIPIENT_PLACEHOLDERS.length)
			],
		);
	}, []);

	const form = useForm({
		defaultValues: {
			recipient: "",
			text: "",
			signature: "",
		},
		onSubmit: async ({ value }) => {
			setSubmitError(null);
			try {
				await submitMessage({
					recipient: value.recipient.trim(),
					text: value.text.trim(),
					signature: value.signature.trim() || undefined,
				});
				setSubmitted(true);
				formCardRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "Nešto je puklo, probaj ponovo.";
				setSubmitError(message);
			}
		},
	});

	const handleSendAnother = () => {
		form.reset();
		setSubmitError(null);
		setSubmitted(false);
	};

	const scrollToForm = () => {
		formCardRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
	};

	const fontMono = "'Roboto Mono', ui-monospace, monospace";
	const fontCondensed = "'Roboto Condensed', system-ui, sans-serif";

	return (
		<main
			className="relative min-h-svh w-full overflow-x-hidden bg-[#46aad3] text-white"
			style={{ fontFamily: fontMono }}
		>
			{/* Paper texture overlay — blendovan preko plave pozadine */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay"
				style={{
					backgroundImage: "url(/figma/image9.png)",
					backgroundSize: "200px 200px",
					backgroundRepeat: "repeat",
				}}
			/>

			{/* Side leaf decorations — vire samo s ivica ekrana */}
			<img
				src="/figma/layer6.png"
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute top-38.5 -right-75 z-0 h-120.25 w-95.5 select-none object-contain opacity-90"
			/>
			<img
				src="/figma/layer6.png"
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute top-156.25 -left-81.25 z-0 h-120.25 w-95.5  select-none object-contain opacity-90"
			/>

			{/* Top marquee strip — alternating Cockta + JURKA logos */}
			<div className="relative z-10 w-full overflow-hidden py-2">
				<div className="aj-marquee flex w-max items-center gap-8 whitespace-nowrap">
					{MARQUEE_KEYS.map((key, i) => (
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
						</div>
					))}
				</div>
			</div>

			{/* Content column */}
			<div className="relative z-20 mx-auto flex w-full max-w-160 flex-col items-center gap-8 px-4 py-6">
				{/* Headline */}
				<h1
					className="w-full text-center text-[24px] leading-tight font-bold text-white"
					style={{ fontFamily: fontMono }}
				>
					Ako ti neko zapadne za oko ne moraš odmah da prilaziš.
				</h1>

				{/* Yellow CTA + disco ball overlap */}
				<div className="relative flex flex-col items-center pb-13.25">
					<button
						type="button"
						onClick={scrollToForm}
						className="relative z-[2] -mb-13.25 inline-flex cursor-pointer items-center justify-center rounded-[12px] px-6 py-4 text-[18px] font-bold tracking-wide text-[#222529] uppercase shadow-md transition active:scale-[0.98]"
						style={{
							backgroundImage: YELLOW_BUTTON_BG,
							fontFamily: fontCondensed,
						}}
					>
						POŠALJI PORUKU
					</button>
					<img
						src="/figma/disco-ball.png"
						alt=""
						aria-hidden="true"
						className="z-[1] -mb-13.25 h-57 w-75 max-w-full object-contain object-top select-none"
					/>
				</div>

				{/* Subtext with yellow ring around "nešto više" */}
				<p
					className="w-full text-center text-[16px] leading-[24px] font-medium text-white"
					style={{ fontFamily: fontMono }}
				>
					Možda ostane samo osmeh.
					<br />
					Možda{" "}
					<span className="relative inline-block">
						<span className="relative z-10">nešto više</span>
						<svg
							aria-hidden="true"
							viewBox="0 0 129 32"
							fill="none"
							preserveAspectRatio="none"
							className="pointer-events-none absolute -top-1 -left-2 h-[calc(100%+0.7rem)] w-[calc(100%+1.6rem)] overflow-visible"
						>
							<path
								d="M64.5 1.5C22.362 1.5 1.5 7.99187 1.5 16C1.5 24.0081 23.4382 30.5 64.5 30.5C105.562 30.5 127.5 24.0081 127.5 16C127.5 8.30211 105.006 -0.1675 54.2881 6.2125"
								stroke="#F5CD21"
								strokeWidth="3"
							/>
						</svg>
					</span>
					. Na Jurci, to je sasvim dovoljno.
				</p>

				{/* AJ ЛАЈМ ЈУ logo block */}
				<div className="flex flex-col items-center gap-4">
					<p
						className="text-center text-[16px] leading-[24px] font-medium whitespace-nowrap text-white"
						style={{ fontFamily: fontMono }}
					>
						Za promenu, samo reci
					</p>
					<img
						src="/figma/aj-lajm-ju.svg"
						alt="AJ ЛАЈМ ЈУ"
						className="h-25 w-64.75 max-w-full"
					/>
					<p
						className="text-center text-[16px] leading-[24px] font-medium whitespace-nowrap text-white"
						style={{ fontFamily: fontMono }}
					>
						i baci pogled na wall u chill zoni.
					</p>
				</div>

				{/* Form card / success state */}
				<div
					ref={formCardRef}
					className="w-full rounded-[16px] bg-[#3d95b9] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
				>
					{submitted ? (
						<div className="flex min-h-[462px] flex-col gap-10">
							<div className="flex flex-1 flex-col items-center justify-center gap-6">
								<img
									src="/figma/eyes.png"
									alt=""
									aria-hidden="true"
									className="h-45 w-42 max-w-full select-none object-contain"
								/>
								<p className="w-full text-center text-[20px] leading-tight font-semibold text-white">
									Možda će videti.
									<br />
									Možda će se prepoznati.
								</p>
							</div>
							<div className="flex w-full flex-col gap-4">
								<button
									type="button"
									onClick={handleSendAnother}
									className="w-full cursor-pointer rounded-[12px] border-2 border-white px-6 py-4 text-[18px] font-bold tracking-wide text-white uppercase transition active:scale-[0.99] hover:bg-white/10"
									style={{ fontFamily: fontCondensed }}
								>
									Pošalji još jednu poruku
								</button>
								<button
									type="button"
									onClick={() => navigate({ to: "/wall" })}
									className="w-full cursor-pointer rounded-[12px] px-6 py-4 text-[18px] font-bold tracking-wide text-[#222529] uppercase shadow-sm transition active:scale-[0.99]"
									style={{
										backgroundImage: YELLOW_BUTTON_BG,
										fontFamily: fontCondensed,
									}}
								>
									Idi do wall-a
								</button>
							</div>
						</div>
					) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="flex flex-col gap-6"
						noValidate
					>
						{/* Field: Recipient */}
						<form.Field
							name="recipient"
							validators={{
								onMount: ({ value }) =>
									!value || value.trim().length < 1
										? "Upiši kome šalješ."
										: undefined,
								onChange: ({ value }) => {
									if (!value || value.trim().length < 1)
										return "Upiši kome šalješ.";
									if (value.trim().length > 100)
										return "Maksimalno 100 karaktera.";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="flex w-full flex-col gap-2">
									<label
										htmlFor={field.name}
										className="text-[16px] leading-[26.56px] font-semibold text-white"
									>
										Kome šalješ?
										<span className="ml-1 text-[#f5cd21]">*</span>
									</label>
									<input
										id={field.name}
										name={field.name}
										type="text"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={recipientPlaceholder}
										maxLength={100}
										className="h-14 w-full rounded-lg border border-white bg-white px-4.75 text-[14px] tracking-tight text-[#222529] placeholder:text-[#222529]/60 outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
									/>
									{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 && (
											<p className="text-sm text-[#f5cd21]">
												{field.state.meta.errors[0]}
											</p>
										)}
								</div>
							)}
						</form.Field>

						{/* Field: Message */}
						<form.Field
							name="text"
							validators={{
								onMount: ({ value }) =>
									!value || value.trim().length < 1
										? "Upiši poruku."
										: undefined,
								onChange: ({ value }) => {
									if (!value || value.trim().length < 1) return "Upiši poruku.";
									if (value.trim().length > 120)
										return "Maksimalno 120 karaktera.";
									return undefined;
								},
							}}
						>
							{(field) => {
								const len = field.state.value.length;
								return (
									<div className="flex w-full flex-col gap-2">
										<label
											htmlFor={field.name}
											className="text-[16px] leading-[26.56px] font-semibold text-white"
										>
											Poruka<span className="ml-1 text-[#f5cd21]">*</span>
										</label>
										<textarea
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Napiši šta bi hteo/htela da kažeš"
											maxLength={120}
											rows={3}
											className="h-22 w-full resize-none rounded-lg border border-white bg-white px-4.75 py-4.75 text-[14px] tracking-tight text-[#222529] placeholder:text-[#222529]/60 outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
										/>
										<div className="flex items-center justify-between text-[14px] tracking-tight text-white">
											<span>#AjЛajmЈy</span>
											<span className="tabular-nums">{len}/120</span>
										</div>
										{field.state.meta.isTouched &&
											field.state.meta.errors.length > 0 && (
												<p className="text-sm text-[#f5cd21]">
													{field.state.meta.errors[0]}
												</p>
											)}
									</div>
								);
							}}
						</form.Field>

						{/* Field: Signature */}
						<form.Field
							name="signature"
							validators={{
								onChange: ({ value }) => {
									if (value && value.length > 50)
										return "Maksimalno 50 karaktera.";
									return undefined;
								},
							}}
						>
							{(field) => (
								<div className="flex w-full flex-col gap-2">
									<label
										htmlFor={field.name}
										className="text-[16px] leading-[26.56px] font-semibold text-white"
									>
										Potpis (opciono)
									</label>
									<input
										id={field.name}
										name={field.name}
										type="text"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Inicijali, emoji, hint..."
										maxLength={50}
										className="h-14 w-full rounded-lg border border-white bg-white px-4.75 text-[14px] tracking-tight text-[#222529] placeholder:text-[#222529]/60 outline-none transition focus:border-[#f5cd21] focus:ring-2 focus:ring-[#f5cd21]/40"
									/>
									{field.state.meta.isTouched &&
										field.state.meta.errors.length > 0 && (
											<p className="text-sm text-[#f5cd21]">
												{field.state.meta.errors[0]}
											</p>
										)}
								</div>
							)}
						</form.Field>

						{submitError && (
							<p className="text-center text-sm text-[#f5cd21]">
								{submitError}
							</p>
						)}

						{/* Submit button */}
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									className="w-full cursor-pointer rounded-[12px] px-6 py-4.25 text-[18px] font-bold tracking-wide text-[#222529] uppercase shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
									style={{
										backgroundImage: YELLOW_BUTTON_BG,
										fontFamily: fontCondensed,
									}}
								>
									{isSubmitting ? "Šaljem…" : "Pošalji"}
								</button>
							)}
						</form.Subscribe>
					</form>
					)}
				</div>
			</div>

			{/* Bottom section: Cockta Lime can + tagline + powered by */}
			<section className="relative z-10 mt-0 w-full overflow-hidden">
				{/* Pocepani zeleni papir — gornji-levi, blago rotiran (iza limenke i teksta) */}
				<img
					src="/figma/decoration.png"
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute -top-28 left-0 z-0 h-183.5 w-127.5 -rotate-90 select-none "
				/>

				{/* Trava + disko kugle — apsolutno na dnu sekcije, full-bleed */}
				<img
					src="/figma/expand-water.png"
					alt=""
					aria-hidden="true"
					className="pointer-events-none absolute -bottom-80 left-1/2 z-0 w-373 max-w-none -translate-x-1/2 select-none"
				/>

				{/* Sadržaj */}
				<div className="relative z-10 mx-auto flex max-w-160 flex-col items-center gap-8 px-4 pt-16 mt-28 pb-40">
					<h2
						className="max-w-65 text-center text-[24px] leading-tight font-bold text-white"
						style={{ fontFamily: fontMono }}
					>
						Probaj me hladnu u chill zoni.
					</h2>
					<img
						src="/figma/cockta-can.png"
						alt="Cockta Lime"
						className="h-auto w-54.25 max-w-full -rotate-15 select-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]"
					/>
					<img
						src="/figma/powered-by.png"
						alt="Powered by Cockta"
						className="mt-52 h-auto w-50 max-w-full select-none"
					/>
				</div>
			</section>
		</main>
	);
}
