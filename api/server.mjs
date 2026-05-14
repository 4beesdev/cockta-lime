import server from '../dist/server/server.js'

export default async function handler(request) {
  return server.fetch(request)
}

export const config = {
  runtime: 'nodejs',
}
