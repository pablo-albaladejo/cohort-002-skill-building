import BM25 from 'okapibm25';

export const searchViaBM25 = async (
  chunks: string[],
  keywords: string[],
) => {
  const scores: number[] = (BM25 as any)(chunks, keywords);

  return scores
    .map((score, index) => ({
      score,
      email: chunks[index]!,
    }))
    .sort((a, b) => b.score - a.score);
};
