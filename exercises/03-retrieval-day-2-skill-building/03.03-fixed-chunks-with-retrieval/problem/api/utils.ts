import { readFile } from 'fs/promises';
import path from 'path';

const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { chunk: string }[][],
): { chunk: string }[] {
  const rrfScores = new Map<string, number>();
  const chunkMap = new Map<string, { chunk: string }>();

  // Process each ranking list
  rankings.forEach((ranking) => {
    ranking.forEach((doc, rank) => {
      // Get current RRF score for this document
      const currentScore = rrfScores.get(doc.chunk.id) || 0;

      // Add contribution from this ranking list
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(doc.chunk.id, currentScore + contribution);

      // Store document reference
      chunkMap.set(doc.chunk.id, doc);
    });
  });

  // Sort by RRF score (descending)
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([docId]) => chunkMap.get(docId)!);
}
