import { searchViaBM25 } from './bm25.ts';
import { searchChunksViaEmbeddings } from './embeddings.ts';
import { reciprocalRankFusion } from './utils.ts';

export const searchChunks = async (opts: {
  chunks: string[];
  keywordsForBM25: string[];
  embeddingsQuery: string;
}) => {
  const bm25SearchResults = await searchViaBM25(
    opts.chunks,
    opts.keywordsForBM25,
  );

  const embeddingsSearchResults =
    await searchChunksViaEmbeddings(opts.embeddingsQuery);

  const rrfResults = reciprocalRankFusion([
    bm25SearchResults,
    embeddingsSearchResults,
  ]);

  return rrfResults;
};
