import neo4j, { type Driver } from 'neo4j-driver';
import type { GraphEdgeView } from '../src/domain/types.js';
import { graphEdgeFromRecord, VON_WORKER_ID, vonGraphQuery } from './graph.js';

export class Neo4jGraphReader {
  constructor(
    private readonly driver: Driver,
    private readonly database: string,
  ) {}

  async getVonRelationships(): Promise<GraphEdgeView[]> {
    const session = this.driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result = await session.run(vonGraphQuery, { workerId: VON_WORKER_ID });
      return result.records.map(graphEdgeFromRecord);
    } finally {
      await session.close();
    }
  }

  close(): Promise<void> {
    return this.driver.close();
  }
}

export async function createNeo4jGraphReader(): Promise<Neo4jGraphReader> {
  const driver = neo4j.driver(
    requiredEnvironment('NEO4J_URI'),
    neo4j.auth.basic(
      requiredEnvironment('NEO4J_USERNAME'),
      requiredEnvironment('NEO4J_PASSWORD'),
    ),
  );

  try {
    await driver.verifyConnectivity();
    return new Neo4jGraphReader(driver, process.env.NEO4J_DATABASE || 'neo4j');
  } catch (error) {
    await driver.close();
    throw error;
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required ${name} configuration.`);
  }
  return value;
}
