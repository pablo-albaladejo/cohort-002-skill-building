import { TokenTextSplitter } from '@langchain/textsplitters';
import { readFileSync } from 'fs';
import path from 'path';

const splitter = new TokenTextSplitter({
  chunkSize: 300,
  chunkOverlap: 50,
});

const text = readFileSync(
  path.join(import.meta.dirname, 'input.md'),
  'utf8',
);

const chunks = await splitter.splitText(text);

for (let index = 0; index < chunks.length; index++) {
  const chunk = chunks[index]!;
  console.log(`Chunk ${index + 1}:`);
  console.log(chunk.trim());
  console.log('\n');
}
