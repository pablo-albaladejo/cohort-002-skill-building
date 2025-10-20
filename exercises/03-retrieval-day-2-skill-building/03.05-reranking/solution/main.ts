import { runLocalDevServer } from '#shared/run-local-dev-server.ts';
import {
  EMBED_CACHE_KEY,
  embedEmails,
} from './api/embeddings.ts';

console.log('Embedding Emails');

await embedEmails(EMBED_CACHE_KEY);

console.log('Embedding complete');

await runLocalDevServer({
  root: import.meta.dirname,
});
