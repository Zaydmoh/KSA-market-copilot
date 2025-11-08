#!/usr/bin/env tsx
/**
 * KB Ingestion Script
 * Reads markdown regulation documents, chunks them, generates embeddings,
 * and stores them in the database for RAG
 * 
 * Usage:
 *   tsx lib/kb/ingest.ts --pack nitaqat --version v2025.10
 *   tsx lib/kb/ingest.ts --pack zatca_phase2 --version v2025.10
 *   tsx lib/kb/ingest.ts --all
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import OpenAI from 'openai';
import { chunkMarkdown, getChunkStats } from './chunk';
import { getClient, testConnection } from './db';

interface SourceMetadata {
  title: string;
  url?: string;
  storage_url?: string;
  published_on?: string;
  retrieved_on?: string;
  reg_code: string;
  files?: string[];
}

interface SourcesYaml {
  pack_id: string;
  version: string;
  sources: SourceMetadata[];
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  const openai = new OpenAI({ apiKey });
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.substring(0, 8191), // Ada-002 has 8191 token limit
  });
  
  return response.data[0].embedding;
}

/**
 * Parse sources.yml file
 */
function parseSourcesYaml(packId: string, version: string): SourcesYaml {
  const yamlPath = path.join(
    process.cwd(),
    'regulations',
    packId,
    version,
    'sources.yml'
  );
  
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`sources.yml not found at ${yamlPath}`);
  }
  
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const parsed = yaml.load(yamlContent) as Partial<SourcesYaml>;
  
  return {
    pack_id: parsed.pack_id || packId,
    version: parsed.version || version,
    sources: parsed.sources || [],
  };
}

/**
 * Find all markdown files in a directory
 */
function findMarkdownFiles(dirPath: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Ingest a single pack version
 */
async function ingestPack(packId: string, version: string): Promise<void> {
  console.log(`\n📦 Ingesting pack: ${packId} ${version}`);
  
  // Parse sources.yml
  const sourcesData = parseSourcesYaml(packId, version);
  console.log(`Found ${sourcesData.sources.length} source(s) in sources.yml`);
  
  // Get database client
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Find all markdown files for this pack/version
    const packDir = path.join(process.cwd(), 'regulations', packId, version);
    const markdownFiles = findMarkdownFiles(packDir);
    console.log(`Found ${markdownFiles.length} markdown file(s)`);
    
    if (markdownFiles.length === 0) {
      console.warn('⚠ No markdown files found. Skipping pack.');
      await client.query('ROLLBACK');
      return;
    }
    
    // Process each source
    let totalChunks = 0;
    
    for (const source of sourcesData.sources) {
      console.log(`\n  Processing source: ${source.reg_code}`);
      
      // Insert or update source metadata
      const sourceResult = await client.query(
        `INSERT INTO kb_sources 
         (pack_id, version, title, url, storage_url, published_on, retrieved_on, reg_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (pack_id, version, reg_code) 
         DO UPDATE SET 
           title = EXCLUDED.title,
           url = EXCLUDED.url,
           storage_url = EXCLUDED.storage_url,
           updated_at = CURRENT_TIMESTAMP
         RETURNING source_id`,
        [
          packId,
          version,
          source.title,
          source.url,
          source.storage_url,
          source.published_on,
          source.retrieved_on || new Date().toISOString(),
          source.reg_code,
        ]
      );
      
      const sourceId = sourceResult.rows[0].source_id;
      
      // Find markdown files associated with this source
      const sourceFiles = source.files
        ? source.files.map(f => path.join(packDir, f))
        : markdownFiles; // If no files specified, use all
      
      // Process each markdown file
      for (const mdFile of sourceFiles) {
        if (!fs.existsSync(mdFile)) {
          console.warn(`  ⚠ File not found: ${mdFile}`);
          continue;
        }
        
        const relativePath = path.relative(process.cwd(), mdFile);
        console.log(`    Reading: ${relativePath}`);
        
        const markdown = fs.readFileSync(mdFile, 'utf8');
        const chunks = chunkMarkdown(markdown);
        const stats = getChunkStats(chunks);
        
        console.log(`    Chunked into ${stats.totalChunks} chunks (avg ${stats.avgTokens} tokens)`);
        
        // Generate embeddings and insert chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          process.stdout.write(`    Embedding chunk ${i + 1}/${chunks.length}...\r`);
          
          // Generate embedding
          const embedding = await generateEmbedding(chunk.text);
          
          // Insert chunk
          await client.query(
            `INSERT INTO kb_chunks 
             (source_id, pack_id, version, section, article, text, embedding, token_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              sourceId,
              packId,
              version,
              chunk.section,
              chunk.article,
              chunk.text,
              JSON.stringify(embedding), // pgvector accepts JSON arrays
              chunk.tokenCount,
            ]
          );
          
          totalChunks++;
          
          // Rate limiting: wait 50ms between embeddings to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`    ✓ Embedded ${chunks.length} chunks`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`\n✅ Successfully ingested ${totalChunks} chunks for ${packId} ${version}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`\n❌ Error ingesting ${packId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let packId: string | null = null;
  let version: string | null = null;
  let ingestAll = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pack' && i + 1 < args.length) {
      packId = args[i + 1];
      i++;
    } else if (args[i] === '--version' && i + 1 < args.length) {
      version = args[i + 1];
      i++;
    } else if (args[i] === '--all') {
      ingestAll = true;
    }
  }
  
  // Show usage if needed
  if (!ingestAll && (!packId || !version)) {
    console.log('Usage:');
    console.log('  tsx lib/kb/ingest.ts --pack <pack_id> --version <version>');
    console.log('  tsx lib/kb/ingest.ts --all');
    console.log('\nExamples:');
    console.log('  tsx lib/kb/ingest.ts --pack nitaqat --version v2025.10');
    console.log('  tsx lib/kb/ingest.ts --pack zatca_phase2 --version v2025.10');
    console.log('  tsx lib/kb/ingest.ts --all');
    process.exit(1);
  }
  
  // Test database connection
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('\n❌ Database not properly configured');
    console.error('Make sure DATABASE_URL is set and pgvector extension is installed');
    process.exit(1);
  }
  
  // Ingest packs
  if (ingestAll) {
    console.log('\n📚 Ingesting all packs...');
    
    // Find all pack directories
    const regulationsDir = path.join(process.cwd(), 'regulations');
    const packs = fs.readdirSync(regulationsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    for (const pack of packs) {
      const packPath = path.join(regulationsDir, pack);
      const versions = fs.readdirSync(packPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      for (const ver of versions) {
        try {
          await ingestPack(pack, ver);
        } catch (error) {
          console.error(`Failed to ingest ${pack}/${ver}:`, error);
        }
      }
    }
  } else if (packId && version) {
    await ingestPack(packId, version);
  }
  
  console.log('\n✨ Ingestion complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ingestPack };
