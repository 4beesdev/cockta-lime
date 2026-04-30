import server from "../../dist/server/server.js";

export default async (request) => {
	return await server.fetch(request);
};
