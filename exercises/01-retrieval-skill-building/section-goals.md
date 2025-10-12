# Section 01: Retrieval Skill Building - Learning Goals

## [01.01 - BM25](./01.01-bm25/explainer/readme.md) (Explainer)

- Keyword-based search using BM25 algorithm
- Term frequency & inverse document frequency scoring
- Document length normalization
- Understanding BM25 limitations: no semantic understanding, requires exact keyword matching

## [01.02 - Retrieval with BM25](./01.02-retrieval-with-bm25/problem/readme.md) (Problem)

- Generate keywords from conversation history using `streamObject`
- Implement BM25 search with `okapibm25` package
- Select top N most relevant search results
- Use LLM to answer questions with retrieved email context
- Format message history for LLM consumption

## [01.03 - Embeddings](./01.03-embeddings/problem/readme.md) (Problem)

- Semantic search via embeddings (vector representations of text)
- Use `embedMany` to create corpus embeddings
- Use `embed` to create query embeddings
- Calculate relevance with `cosineSimilarity`
- Compare semantic vs keyword-based retrieval performance
- Understand when embeddings outperform keyword search

## [01.04 - Rank Fusion](./01.04-rank-fusion/explainer/readme.md) (Explainer)

- Reciprocal rank fusion (RRF) algorithm for combining rankings
- Merge BM25 + semantic search results
- Handle different scoring scales between ranking systems
- Position-based scoring formula: `1/(k+rank)`
- Leverage complementary strengths of multiple retrieval methods

## [01.05 - Query Rewriting](./01.05-query-rewriting/problem/readme.md) (Problem)

- Pre-retrieval optimization via query rewriter LLM
- Convert long conversation history to focused, refined query
- Prevent dilution of recent/relevant context in embeddings
- Improve semantic search precision
- Generate both keywords (for BM25) and search query (for embeddings) in single call

## [01.06 - Reranking](./01.06-reranking/problem/readme.md) (Problem)

- Post-retrieval filtering via reranker LLM
- Pass top 30 results to reranker, return most relevant IDs only
- Token optimization: return IDs not full content
- Format emails with IDs for LLM evaluation
- Handle potential LLM hallucination of non-existent IDs
- Trade latency for improved retrieval relevance
