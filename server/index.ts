import { existsSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { loadEnvFile } from 'node:process';
import { AssessmentNotFoundError, IntakeValidationError, parseDemoAssessmentInput } from './intake.js';
import { createNeo4jGraphReader, type Neo4jGraphReader } from './neo4j.js';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const port = Number(process.env.PORT || 3001);
const maxJsonBodyBytes = 2_048;
let graphReaderPromise: Promise<Neo4jGraphReader> | undefined;

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

async function handleRequest(request: IncomingMessage, response: ServerResponse<IncomingMessage>): Promise<void> {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    writeJson(response, 200, { status: 'ok' });
    return;
  }

  const isGraphRequest = request.method === 'GET' && requestUrl.pathname === '/api/graph/von';
  const isPrefillRequest = request.method === 'GET' && requestUrl.pathname === '/api/intake/von';
  const isAssessmentSave = request.method === 'PUT' && requestUrl.pathname === '/api/intake/von/assessment';
  const isAssessmentReset = request.method === 'DELETE' && requestUrl.pathname === '/api/intake/von/assessment';
  const isRecommendationRequest = request.method === 'POST' && requestUrl.pathname === '/api/recommendations/von';

  if (!isGraphRequest && !isPrefillRequest && !isAssessmentSave && !isAssessmentReset && !isRecommendationRequest) {
    if (requestUrl.pathname === '/api/graph/von' || requestUrl.pathname === '/api/intake/von' || requestUrl.pathname === '/api/intake/von/assessment' || requestUrl.pathname === '/api/recommendations/von') {
      writeJson(response, 405, { error: 'Method not allowed.' });
      return;
    }
    writeJson(response, 404, { error: 'Not found.' });
    return;
  }

  try {
    const graphReader = await (graphReaderPromise ??= createNeo4jGraphReader());

    if (isGraphRequest) {
      writeJson(response, 200, await graphReader.getVonRelationships());
      return;
    }

    if (isPrefillRequest) {
      writeJson(response, 200, await graphReader.getIntakePrefill());
      return;
    }

    if (isAssessmentSave) {
      const input = parseDemoAssessmentInput(await readJsonBody(request));
      writeJson(response, 200, await graphReader.upsertAssessment(input));
      return;
    }

    if (isAssessmentReset) {
      await graphReader.resetAssessment();
      writeJson(response, 204, undefined);
      return;
    }

    writeJson(response, 200, await graphReader.getRecommendations());
  } catch (error) {
    if (error instanceof JsonBodyError || error instanceof IntakeValidationError) {
      writeJson(response, 400, { error: error.message });
      return;
    }
    if (error instanceof AssessmentNotFoundError) {
      writeJson(response, 409, { error: error.message });
      return;
    }

    console.error('Unable to process the public-safe Neo4j demo request.', error);
    writeJson(response, 503, { error: 'The graph-backed demo service is temporarily unavailable.' });
  }
}

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

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const contentLength = Number(request.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > maxJsonBodyBytes) {
    throw new JsonBodyError('The intake request is too large.');
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxJsonBodyBytes) {
      throw new JsonBodyError('The intake request is too large.');
    }
    chunks.push(buffer);
  }

  if (!chunks.length) {
    throw new JsonBodyError('The intake request must contain JSON selections.');
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new JsonBodyError('The intake request must contain valid JSON selections.');
  }
}

function writeJson(response: ServerResponse<IncomingMessage>, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(statusCode === 204 ? undefined : JSON.stringify(payload));
}

class JsonBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JsonBodyError';
  }
}
