# Task List: KSA Market-Entry Copilot (Phase 1 MVP)

**Generated from**: `0001-prd-ksa-market-entry-copilot-mvp.md`  
**Date**: 2025-11-03  
**Status**: Complete with sub-tasks

---

## Relevant Files

### Core Application Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration with strict mode
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `.env.local` - Environment variables (OpenAI API key)
- `.gitignore` - Git ignore file (must include `.env.local`)

### Frontend Components
- `app/page.tsx` - Landing page with file upload
- `app/layout.tsx` - Root layout with global styles
- `app/globals.css` - Global styles and TailwindCSS imports
- `app/results/page.tsx` - Results display page
- `components/ui/button.tsx` - Button component (shadcn/ui)
- `components/ui/card.tsx` - Card component (shadcn/ui)
- `components/ui/alert.tsx` - Alert component (shadcn/ui)
- `components/FileUpload.tsx` - File upload component
- `components/LoadingSpinner.tsx` - Loading state component
- `components/ComplianceChecklist.tsx` - Compliance checklist display
- `components/CitationsList.tsx` - Citations display component

### Backend API Routes
- `app/api/analyze/route.ts` - Main API endpoint for PDF analysis
- `app/api/export-pdf/route.ts` - PDF export endpoint
- `lib/pdf-extractor.ts` - PDF text extraction utility
- `lib/openai-client.ts` - OpenAI API client wrapper
- `lib/misa-prompt.ts` - MISA regulation prompt builder
- `lib/types.ts` - TypeScript type definitions

### Knowledge Base
- `regulations/misa-licensing.md` - MISA licensing regulations (structured)

### Configuration & Documentation
- `README.md` - Setup instructions and project documentation
- `components.json` - shadcn/ui configuration

### Testing (Optional for MVP)
- `__tests__/api/analyze.test.ts` - API endpoint tests
- `jest.config.js` - Jest configuration

### Notes
- All component files should be co-located with their logic
- Use TypeScript strict mode for all files
- Follow Next.js 14+ App Router conventions
- Environment variables must never be committed to git

---

## Tasks

- [x] 1.0 Project Setup and Foundation
  - [x] 1.1 Initialize Next.js project with TypeScript using `npx create-next-app@latest`
    - Name: `ksa-market-entry-copilot`
    - Use App Router: Yes
    - Use TypeScript: Yes
    - Use ESLint: Yes
    - Use TailwindCSS: Yes
    - Use `src/` directory: No
    - Customize default import alias: No (use default `@/*`)
  - [x] 1.2 Configure TypeScript strict mode in `tsconfig.json`
    - Set `"strict": true`
    - Set `"noUnusedLocals": true`
    - Set `"noUnusedParameters": true`
  - [x] 1.3 Install core dependencies
    - `npm install openai` - OpenAI API client
    - `npm install pdf-parse` - PDF text extraction
    - `npm install @types/pdf-parse` - TypeScript types for pdf-parse
    - `npm install zod` - Schema validation
  - [x] 1.4 Initialize shadcn/ui
    - Run `npx shadcn-ui@latest init`
    - Select default style, neutral color, CSS variables: Yes
    - Install initial components: `npx shadcn-ui@latest add button card alert`
  - [x] 1.5 Create `.env.local` file with OpenAI API key
    - Add `OPENAI_API_KEY=your_key_here`
    - Create `.env.example` file as template (without actual key)
  - [x] 1.6 Update `.gitignore` to ensure `.env.local` is excluded
  - [x] 1.7 Set up basic project structure
    - Create `/lib` directory for utilities
    - Create `/components` directory (if not exists)
    - Create `/regulations` directory for MISA knowledge base

- [x] 2.0 MISA Regulations Knowledge Base
  - [x] 2.1 Research and compile MISA licensing requirements
    - Visit MISA official website (misa.gov.sa)
    - Identify key license types: Commercial, Industrial, Professional, RHQ
    - Document eligibility criteria for each license type
    - Note required documentation for each license type
  - [x] 2.2 Create `/regulations/misa-licensing.md` file
    - Structure: License types → Eligibility → Requirements → Process
    - Include article/section numbers from official regulations
    - Format for easy parsing by AI (clear headings, bullet points)
  - [x] 2.3 Create `lib/misa-prompt.ts` to build AI prompts
    - Function to load MISA regulations from markdown file
    - Function to construct structured prompt for OpenAI
    - Include instructions for citation format
    - Define expected output structure (JSON schema)
  - [x] 2.4 Create sample MISA regulation entries (if real data not yet available)
    - At least 3 license types with 5+ requirements each
    - Include mock article numbers for testing
    - Mark as "SAMPLE DATA - REPLACE WITH OFFICIAL" in comments

- [x] 3.0 Frontend UI - Upload and Landing Page
  - [x] 3.1 Create `lib/types.ts` for shared TypeScript types
    - `AnalysisResult` type (executive summary, license types, checklist, citations)
    - `ComplianceItem` type (requirement, status, recommendation, citation)
    - `Citation` type (regulation name, article, url)
    - `UploadError` type
  - [x] 3.2 Design and implement `app/page.tsx` (landing page)
    - Hero section with value proposition
    - File upload area (use shadcn card)
    - Clear instructions: "Upload your RFP or business plan PDF"
    - Disclaimer text about AI analysis
    - Max file size indicator (10MB)
  - [x] 3.3 Create `components/FileUpload.tsx`
    - Accept only PDF files (`accept=".pdf"`)
    - Validate file type and size (10MB max)
    - Display filename when selected
    - Show clear error messages for invalid files
    - Trigger upload on file selection
  - [x] 3.4 Create `components/LoadingSpinner.tsx`
    - Simple spinner animation
    - Message: "Analyzing document against MISA regulations..."
    - Sub-message: "This may take up to 2 minutes"
  - [x] 3.5 Implement upload logic in `app/page.tsx`
    - Handle file selection event
    - Show loading state while processing
    - Call `/api/analyze` endpoint with FormData
    - Handle errors gracefully with user-friendly messages
    - On success, redirect to results page with analysis data
  - [x] 3.6 Add basic styling with TailwindCSS
    - Professional color scheme (neutral/slate)
    - Responsive layout (desktop-first, mobile-friendly)
    - Clear visual hierarchy
    - Accessible focus states

- [x] 4.0 Backend API - PDF Processing and Analysis
  - [x] 4.1 Create `lib/pdf-extractor.ts` utility
    - Function `extractTextFromPDF(buffer: Buffer): Promise<string>`
    - Use `pdf-parse` library
    - Handle extraction errors gracefully
    - Return extracted text or throw descriptive error
  - [x] 4.2 Create `lib/openai-client.ts` wrapper
    - Initialize OpenAI client with API key from env
    - Function `analyzeDocument(text: string, prompt: string): Promise<AnalysisResult>`
    - Use GPT-4-turbo model (`gpt-4-turbo-preview`)
    - Set reasonable token limits (max_tokens: 2000)
    - Set timeout to 120 seconds
    - Parse JSON response from OpenAI
    - Handle API errors and rate limits
  - [x] 4.3 Create `app/api/analyze/route.ts` POST endpoint
    - Accept `multipart/form-data` with PDF file
    - Validate file is present and is a PDF
    - Validate file size <= 10MB
    - Extract text using `pdf-extractor`
    - Load MISA regulations and build prompt using `misa-prompt`
    - Call OpenAI API using `openai-client`
    - Return JSON response with `AnalysisResult`
    - Implement comprehensive error handling (400, 500 errors)
  - [x] 4.4 Structure OpenAI prompt for consistent output
    - System message: Role as compliance analyst
    - Include MISA regulations in prompt
    - Request structured JSON output with specific fields
    - Include examples of good citations
    - Request executive summary, license types, checklist, recommendations
  - [x] 4.5 Implement retry logic for OpenAI API
    - Retry up to 2 times on transient errors
    - Exponential backoff (1s, 3s)
    - Return clear error if all retries fail
  - [x] 4.6 Add input validation using Zod schemas
    - Validate file upload
    - Validate OpenAI response structure
    - Throw validation errors with clear messages

- [x] 5.0 Frontend UI - Results Display
  - [x] 5.1 Create `app/results/page.tsx`
    - Receive analysis data from URL params or state
    - Display all sections of analysis
    - Professional report layout
    - Include timestamp and disclaimer
  - [x] 5.2 Create `components/ComplianceChecklist.tsx`
    - Display checklist items with status icons
    - Green checkmark (✓) for addressed requirements
    - Yellow warning (⚠) for unclear requirements
    - Red X (✗) for missing requirements
    - Show requirement text, status, and recommendation
    - Include collapsible details for each item
  - [x] 5.3 Create `components/CitationsList.tsx`
    - Display all citations in organized format
    - Show regulation name and article number
    - Include links to official resources (if available)
    - Format as professional reference list
  - [x] 5.4 Implement executive summary section
    - Display 2-3 sentence summary at top
    - Highlight applicable license type(s)
    - Use card component for visual separation
  - [x] 5.5 Add prominent disclaimer
    - "This is an AI-generated analysis and should be reviewed by qualified professionals"
    - Display in alert component (warning style)
    - Place at top of results page
  - [x] 5.6 Add "Download Report" button
    - Prominent placement (top-right of page)
    - Triggers PDF export API call
    - Show loading state during export
  - [x] 5.7 Style results page with TailwindCSS
    - Clear visual hierarchy (summary → checklist → citations)
    - Color coding for compliance status
    - Proper spacing and typography
    - Print-friendly styles (for browser print option)

- [x] 6.0 PDF Export Functionality
  - [x] 6.1 Install PDF generation library
    - `npm install jspdf` - PDF generation
    - Or `npm install @react-pdf/renderer` (alternative)
  - [x] 6.2 Create `lib/pdf-generator.ts` utility
    - Function `generateReportPDF(analysis: AnalysisResult): Promise<Buffer>`
    - Format all sections: summary, checklist, citations
    - Include generation timestamp
    - Include disclaimer text
    - Professional formatting (fonts, spacing, page breaks)
  - [x] 6.3 Create `app/api/export-pdf/route.ts` POST endpoint
    - Accept analysis results as JSON in request body
    - Generate PDF using `pdf-generator`
    - Return PDF as binary response
    - Set proper headers (`Content-Type: application/pdf`)
    - Set filename in `Content-Disposition` header
  - [x] 6.4 Implement client-side download trigger
    - Function in results page to call export API
    - Handle response as blob
    - Trigger browser download
    - Show success/error messages
  - [x] 6.5 Format exported PDF professionally
    - Header with tool name and date
    - Clear section headings
    - Status icons/colors for checklist
    - Footer with page numbers and disclaimer
    - Proper margins and line spacing

- [x] 7.0 Testing, Documentation, and Deployment
  - [x] 7.1 Create 3-5 synthetic test documents
    - Test doc 1: Simple business plan (2 pages)
    - Test doc 2: Detailed RFP response (5 pages)
    - Test doc 3: Service agreement with licensing mentions
    - Test doc 4: Minimal document (1 page)
    - Test doc 5: Large document (10+ pages, edge case)
  - [x] 7.2 Manual end-to-end testing
    - Test each document uploads successfully
    - Verify analysis completes in < 2 minutes
    - Check all citations include regulation + article number
    - Verify checklist shows varied statuses (✓, ⚠, ✗)
    - Test PDF export works and is readable
    - Test error cases (invalid file, oversized file, corrupted PDF)
  - [x] 7.3 Create comprehensive `README.md`
    - Project overview and goals
    - Prerequisites (Node.js version, OpenAI API key)
    - Installation steps (`npm install`)
    - Environment setup (`.env.local` configuration)
    - How to run locally (`npm run dev`)
    - How to build for production (`npm run build`)
    - Deployment instructions (Vercel)
    - Known limitations
    - Future roadmap (Phase 2)
  - [x] 7.4 Add inline code comments
    - Document complex functions
    - Explain MISA regulation prompt structure
    - Add JSDoc comments for exported functions
    - Include type documentation
  - [x] 7.5 Set up Vercel deployment
    - Create Vercel account (if not exists)
    - Connect GitHub repository
    - Configure environment variables in Vercel dashboard
    - Deploy and test production build
    - Verify environment variables are loaded correctly
  - [x] 7.6 Post-deployment testing
    - Test deployed app with all test documents
    - Monitor Vercel logs for errors
    - Check performance (cold start times, API response times)
    - Verify OpenAI API usage and costs
  - [x] 7.7 Document MISA regulation sources
    - Create `regulations/SOURCES.md`
    - List all official MISA documents/websites used
    - Include access dates and version numbers
    - Note any assumptions or gaps in knowledge base
  - [x] 7.8 Create user feedback collection mechanism
    - Simple feedback form or email link on results page
    - Track: Was output useful? Did it save time?
    - Prepare for 5-user testing phase

---

## Development Tips for First-Time Builders

### Getting Started
1. **Install Node.js**: Download from nodejs.org (use LTS version 18 or 20)
2. **Get OpenAI API Key**: Sign up at platform.openai.com, create API key
3. **Use Cursor AI**: Let Cursor help generate boilerplate code - just describe what you need
4. **Start with Task 1.0**: Follow tasks in order, don't skip ahead

### When Stuck
- Ask Cursor to "explain this error" or "fix this code"
- Check Next.js documentation: nextjs.org/docs
- Test frequently with `npm run dev`
- Use `console.log()` liberally to debug

### Cost Management
- Start with GPT-3.5-turbo for testing (change in `lib/openai-client.ts`)
- Switch to GPT-4-turbo only when testing accuracy
- Monitor usage at platform.openai.com/usage

### Best Practices
- Commit code frequently to git
- Test each task before moving to next
- Don't worry about perfection - iterate later
- Read error messages carefully - they usually tell you what's wrong

---

## Estimated Timeline

- **Week 1**: Tasks 1.0-2.0 (Setup + Knowledge Base) - ~8 hours
- **Week 2**: Tasks 3.0-4.0 (Upload UI + API) - ~12 hours
- **Week 3**: Tasks 5.0-6.0 (Results Display + Export) - ~10 hours
- **Week 4**: Task 7.0 (Testing + Deployment) - ~6 hours

**Total**: ~36 hours of focused work over 4 weeks

---

## Success Checklist

Before considering Phase 1 complete:
- [ ] App runs locally without errors
- [ ] Can upload a PDF and see results
- [ ] Results include executive summary, checklist, and citations
- [ ] Can export results as PDF
- [ ] All 5 test documents process successfully
- [ ] Deployed to Vercel and accessible via URL
- [ ] README.md is complete and accurate
- [ ] No API keys or secrets in git repository
- [ ] OpenAI costs are within budget ($50-100)

---

**Ready to start building?** Begin with Task 1.0 (Project Setup)!

