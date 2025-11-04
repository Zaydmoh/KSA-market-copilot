import fs from 'fs';
import path from 'path';

/**
 * Loads MISA licensing regulations from the markdown file
 * @returns The full text of MISA regulations
 */
export function loadMISARegulations(): string {
  const regulationsPath = path.join(process.cwd(), 'regulations', 'misa-licensing.md');
  
  try {
    const regulations = fs.readFileSync(regulationsPath, 'utf-8');
    return regulations;
  } catch (error) {
    console.error('Error loading MISA regulations:', error);
    throw new Error('Failed to load MISA regulations. Please ensure regulations/misa-licensing.md exists.');
  }
}

/**
 * Constructs a structured prompt for OpenAI to analyze a document against MISA regulations
 * @param documentText - The extracted text from the uploaded PDF
 * @returns A complete prompt for OpenAI with system message and user message
 */
export function buildMISAAnalysisPrompt(documentText: string): {
  systemMessage: string;
  userMessage: string;
} {
  const regulations = loadMISARegulations();

  const systemMessage = `You are an expert compliance analyst specializing in Saudi Arabian business licensing regulations, particularly MISA (Ministry of Investment of Saudi Arabia) requirements.

Your task is to analyze business documents (RFPs, contracts, business plans) and determine:
1. Which MISA license type(s) apply to the proposed business activities
2. Whether the document addresses key licensing requirements
3. What compliance gaps or missing information exist
4. Actionable recommendations for meeting MISA requirements

IMPORTANT INSTRUCTIONS:
- Base your analysis ONLY on the MISA regulations provided below
- Cite specific regulation articles and sections for every requirement mentioned
- Be specific and actionable in your recommendations
- Identify both what IS addressed and what is MISSING from the document
- Use the exact citation format: "Regulation Name, Article X, Section Y"
- If information is unclear or ambiguous in the document, mark it as "unclear" rather than "missing"

OUTPUT FORMAT:
You must respond with a valid JSON object with this exact structure:
{
  "executiveSummary": "2-3 sentence summary of the analysis",
  "applicableLicenses": ["License Type 1", "License Type 2"],
  "checklist": [
    {
      "requirement": "Specific requirement description",
      "status": "addressed" | "missing" | "unclear",
      "recommendation": "Specific actionable recommendation",
      "citation": "Regulation Name, Article X, Section Y"
    }
  ],
  "citations": [
    {
      "regulation": "Full regulation name",
      "article": "Article X, Section Y",
      "url": "https://misa.gov.sa/... (if available, otherwise empty string)"
    }
  ]
}

MISA REGULATIONS:
${regulations}`;

  const userMessage = `Please analyze the following business document against MISA licensing requirements:

DOCUMENT TEXT:
${documentText}

Provide your analysis in the JSON format specified above. Ensure all requirements have proper citations to the MISA regulations.`;

  return {
    systemMessage,
    userMessage,
  };
}

/**
 * Builds a concise version of the prompt for testing or cost-sensitive scenarios
 * Uses only key sections of regulations instead of the full document
 */
export function buildConciseMISAPrompt(documentText: string): {
  systemMessage: string;
  userMessage: string;
} {
  // For MVP, we can use a more concise version that highlights key requirements
  const systemMessage = `You are a compliance analyst for Saudi Arabian MISA licensing requirements.

Analyze the document and identify:
1. Which license type applies: Commercial, Industrial, Professional, or Regional Headquarters (RHQ)
2. Key requirements that are addressed or missing
3. Provide specific recommendations with regulation citations

Respond in JSON format:
{
  "executiveSummary": "Brief summary",
  "applicableLicenses": ["License types"],
  "checklist": [{"requirement": "", "status": "addressed|missing|unclear", "recommendation": "", "citation": ""}],
  "citations": [{"regulation": "", "article": "", "url": ""}]
}

KEY MISA REQUIREMENTS:
- Commercial License: For trading/distribution. Min capital SAR 100K. Requires premises and trade license.
- Industrial License: For manufacturing. Min capital SAR 500K. Requires environmental clearance.
- Professional License: For consulting/services. Min capital SAR 50K. Requires professional qualifications.
- RHQ License: For regional HQs. Min capital SAR 1M, 15+ employees, manages 3+ countries.

All require: Company registration (CR), Tax ID (TIN), GOSI registration, Saudization compliance.`;

  const userMessage = `Analyze this document against MISA requirements:

${documentText}

Provide analysis in the specified JSON format.`;

  return {
    systemMessage,
    userMessage,
  };
}

/**
 * Validates that the response from OpenAI matches the expected structure
 * This is a helper for the openai-client to validate responses
 */
export const expectedResponseSchema = {
  executiveSummary: 'string',
  applicableLicenses: ['array of strings'],
  checklist: [
    {
      requirement: 'string',
      status: 'one of: addressed, missing, unclear',
      recommendation: 'string',
      citation: 'string',
    },
  ],
  citations: [
    {
      regulation: 'string',
      article: 'string',
      url: 'string (can be empty)',
    },
  ],
};

