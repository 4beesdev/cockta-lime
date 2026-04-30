import server from "../dist/server/server.js";

export const config = {
	api: { bodyParser: false },
};

export default async function handler(req, res) {
	const protocol = req.headers["x-forwarded-proto"] || "https";
	const host = req.headers["x-forwarded-host"] || req.headers.host;
	const url = `${protocol}://${host}${req.url}`;

	const headers = new Headers();
	for (const [key, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			for (const v of value) headers.append(key, v);
		} else if (typeof value === "string") {
			headers.set(key, value);
		}
	}

	let body;
	if (!["GET", "HEAD"].includes(req.method ?? "GET")) {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		if (chunks.length > 0) body = Buffer.concat(chunks);
	}

	const request = new Request(url, {
		method: req.method,
		headers,
		body,
	});

	const response = await server.fetch(request);

	res.statusCode = response.status;
	response.headers.forEach((value, key) => {
		res.setHeader(key, value);
	});

	if (response.body) {
		const reader = response.body.getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			res.write(value);
		}
	}
	res.end();
}
