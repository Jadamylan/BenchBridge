import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadEnvFile } from 'node:process';
import { createNeo4jGraphReader, type Neo4jGraphReader } from './neo4j.js';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const port = Number(process.env.PORT || 3001);
let graphReaderPromise: Promise<Neo4jGraphReader> | undefined;

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method !== 'GET') {
    writeJson(response, 405, { error: 'Method not allowed.' });
    return;
  }

  if (requestUrl.pathname === '/api/health') {
    writeJson(response, 200, { status: 'ok' });
    return;
  }

  if (requestUrl.pathname !== '/api/graph/von') {
    writeJson(response, 404, { error: 'Not found.' });
    return;
  }

  try {
    const graphReader = await (graphReaderPromise ??= createNeo4jGraphReader());
    writeJson(response, 200, await graphReader.getVonRelationships());
  } catch (error) {
    console.error('Unable to load the Neo4j relationship graph.', error);
    writeJson(response, 503, { error: 'The relationship graph is temporarily unavailable.' });
  }
});

server.listen(port, () => {
  console.log(`BenchBridge API listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void closeServer();
  });
}

async function closeServer(): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const graphReader = await graphReaderPromise?.catch(() => undefined);
  await graphReader?.close();
}

function writeJson(response: ServerResponse<IncomingMessage>, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}
