/**
 * KB Chunking Utilities
 * Processes markdown documents into chunks suitable for RAG
 */

export interface Chunk {
  text: string;
  section?: string;
  article?: string;
  tokenCount: number;
}

/**
 * Rough token count estimation (4 chars ≈ 1 token for English)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Extract article number from heading text
 * Patterns: "Article 12", "§12", "Section 12.b", "12.b", etc.
 */
function extractArticleNumber(heading: string): string | undefined {
  // Pattern 1: "Article 12" or "Article 12.b"
  const match1 = heading.match(/article\s+(\d+(?:\.\w+)?)/i);
  if (match1) return match1[1];

  // Pattern 2: "§12" or "§12.b"
  const match2 = heading.match(/§\s*(\d+(?:\.\w+)?)/);
  if (match2) return match2[1];

  // Pattern 3: "Section 12.b"
  const match3 = heading.match(/section\s+(\d+(?:\.\w+)?)/i);
  if (match3) return match3[1];

  // Pattern 4: Standalone number at start "12." or "12.b."
  const match4 = heading.match(/^(\d+(?:\.\w+)?)\./);
  if (match4) return match4[1];

  return undefined;
}

/**
 * Parse markdown into sections based on headings
 */
interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  article?: string;
}

function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split('\n');
  const sections: MarkdownSection[] = [];
  
  let currentSection: MarkdownSection | null = null;
  
  for (const line of lines) {
    // Check if line is a heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save previous section if it exists
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Start new section
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      const article = extractArticleNumber(heading);
      
      currentSection = {
        heading,
        level,
        content: '',
        article,
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    } else {
      // Content before first heading - create implicit section
      if (sections.length === 0 && line.trim()) {
        currentSection = {
          heading: 'Introduction',
          level: 1,
          content: line + '\n',
        };
      }
    }
  }
  
  // Save final section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Split text into chunks with overlap
 */
function splitWithOverlap(
  text: string,
  targetTokens: number = 700,
  overlapTokens: number = 80
): string[] {
  const estimatedTokens = estimateTokens(text);
  
  // If text is small enough, return as single chunk
  if (estimatedTokens <= targetTokens) {
    return [text];
  }
  
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let currentTokens = 0;
  let overlapBuffer = '';
  
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);
    
    // If adding this sentence would exceed target
    if (currentTokens + sentenceTokens > targetTokens && currentChunk) {
      // Save current chunk
      chunks.push(currentChunk.trim());
      
      // Start new chunk with overlap
      currentChunk = overlapBuffer + sentence + ' ';
      currentTokens = estimateTokens(currentChunk);
      
      // Reset overlap buffer
      overlapBuffer = '';
    } else {
      // Add sentence to current chunk
      currentChunk += sentence + ' ';
      currentTokens += sentenceTokens;
      
      // Build overlap buffer (last N tokens)
      overlapBuffer += sentence + ' ';
      const overlapBufferTokens = estimateTokens(overlapBuffer);
      
      // Keep overlap buffer within limit
      if (overlapBufferTokens > overlapTokens) {
        const overlapSentences = overlapBuffer.split(/(?<=[.!?])\s+/);
        // Remove oldest sentences until within limit
        while (overlapSentences.length > 1 && 
               estimateTokens(overlapSentences.join(' ')) > overlapTokens) {
          overlapSentences.shift();
        }
        overlapBuffer = overlapSentences.join(' ');
      }
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Chunk a markdown document
 * 
 * @param markdown - Markdown content
 * @param targetTokens - Target tokens per chunk (default 700)
 * @param overlapTokens - Overlap between chunks (default 80)
 * @returns Array of chunks with metadata
 */
export function chunkMarkdown(
  markdown: string,
  targetTokens: number = 700,
  overlapTokens: number = 80
): Chunk[] {
  const sections = parseMarkdownSections(markdown);
  const chunks: Chunk[] = [];
  
  for (const section of sections) {
    const fullText = `${section.heading}\n\n${section.content}`;
    const textChunks = splitWithOverlap(fullText, targetTokens, overlapTokens);
    
    for (const textChunk of textChunks) {
      chunks.push({
        text: textChunk,
        section: section.heading,
        article: section.article,
        tokenCount: estimateTokens(textChunk),
      });
    }
  }
  
  return chunks;
}

/**
 * Get chunk statistics
 */
export interface ChunkStats {
  totalChunks: number;
  avgTokens: number;
  minTokens: number;
  maxTokens: number;
  chunksWithArticles: number;
}

export function getChunkStats(chunks: Chunk[]): ChunkStats {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgTokens: 0,
      minTokens: 0,
      maxTokens: 0,
      chunksWithArticles: 0,
    };
  }
  
  const tokenCounts = chunks.map(c => c.tokenCount);
  const avgTokens = Math.round(
    tokenCounts.reduce((sum, count) => sum + count, 0) / chunks.length
  );
  
  return {
    totalChunks: chunks.length,
    avgTokens,
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
    chunksWithArticles: chunks.filter(c => c.article).length,
  };
}
