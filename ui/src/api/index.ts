/* ============================================================================
   API facade
   ----------------------------------------------------------------------------
   The only module the UI talks to. Components never import `live.ts` or
   `mock.ts` directly — they receive a client from `useApiClient()`, which picks
   the implementation based on the active data source.
   ========================================================================= */

import { DEFAULT_DATA_SOURCE, type DataSource } from "./config";
import { liveClient, type AegisApiClient } from "./live";
import { mockClient } from "./mock";

const clients: Record<DataSource, AegisApiClient> = {
  mock: mockClient,
  live: liveClient,
};

export function getApiClient(mode: DataSource): AegisApiClient {
  return clients[mode];
}

export { DEFAULT_DATA_SOURCE };
export type { AegisApiClient };
export * from "./config";