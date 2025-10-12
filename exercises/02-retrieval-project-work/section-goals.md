# Section 02: Retrieval Project Work - Learning Goals

## [02.01 - Building Your Own Dataset](./02.01-building-your-own-dataset/explainer/readme.md) (Explainer)

- Set up custom dataset for project work
- Options: Gmail export, chat logs, or pre-built email dataset
- Prepare data structure for retrieval pipeline
- Optional: skip if using pre-built dataset

## [02.02 - Building a Search Algorithm](./02.02-building-a-search-algorithm/explainer/todo.md) (Explainer)

- Build complete search algorithm from scratch in project search page
- Implement BM25 keyword search (refs [01.01](../01-retrieval-skill-building/01.01-bm25/explainer/readme.md), [01.02](../01-retrieval-skill-building/01.02-retrieval-with-bm25/problem/readme.md))
- Implement embeddings/semantic search (refs [01.03](../01-retrieval-skill-building/01.03-embeddings/problem/readme.md))
- Apply rank fusion to combine BM25 + semantic results (refs [01.04](../01-retrieval-skill-building/01.04-rank-fusion/explainer/readme.md))
- Build retrieval pipeline without agent integration yet
- Work directly in project codebase vs isolated exercises

## [02.03 - Building a Search Agent](./02.03-building-a-search-agent/explainer/todo.md) (Explainer)

- Connect search algorithm to agent
- Implement query rewriting for focused queries (refs [01.05](../01-retrieval-skill-building/01.05-query-rewriting/problem/readme.md))
- Add reranking to filter top results (refs [01.06](../01-retrieval-skill-building/01.06-reranking/problem/readme.md))
- Integrate retrieval with agent conversation flow
- Apply query optimization in production context

## [02.04 - Returning Related Emails](./02.04-returning-related-emails/explainer/todo.md) (Explainer)

- Understand email relationships and thread structure
- Fetch entire email threads from single email match
- Include related emails in retrieval results
- Configure before/after range for thread context
- Explore LLM tool for dynamic thread fetching
- Pass thread-enriched results to reranker
