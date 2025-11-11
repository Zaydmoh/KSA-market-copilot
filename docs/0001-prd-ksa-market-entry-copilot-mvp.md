# Product Requirements Document: KSA Market-Entry Copilot (Phase 1 MVP)

## Introduction/Overview

The KSA Market-Entry Copilot is an AI-powered tool that helps businesses entering the Saudi Arabian market understand their compliance requirements. For Phase 1 MVP, the copilot will focus on analyzing RFPs, contracts, and business plans against **MISA (Ministry of Investment of Saudi Arabia) licensing requirements** only.

### Problem Statement
Bid leads, GTM teams, and legal/compliance professionals at consultancies, infrastructure contractors, and tech vendors waste weeks manually researching KSA licensing requirements. This leads to:
- Delayed bid submissions
- Missed licensing requirements
- Rejected applications due to incomplete documentation
- High consulting costs for basic compliance checks

### Solution
An automated web application that accepts a PDF document (RFP, contract, or business plan), analyzes it against MISA licensing regulations using AI, and produces a compliance checklist with actionable recommendations and citations.

## Goals

### Primary Goals
1. **Reduce research time by 80%**: From weeks to hours for initial MISA licensing assessment
2. **Increase accuracy**: Provide line-level citations to official MISA regulations
3. **Lower barrier to entry**: Enable non-experts to understand basic licensing requirements
4. **Validate product-market fit**: Prove the concept works with one regulation before scaling

### Success Criteria
- Tool successfully analyzes 95%+ of uploaded PDFs without errors
- Generates useful output in under 2 minutes
- 5 test users report it saves them significant time
- Output includes accurate citations to MISA regulations

## User Stories

### Primary User: Bid/GTM Lead at Tech Vendor
**As a** bid manager preparing a government procurement response,  
**I want to** upload our bid document and quickly understand MISA licensing requirements,  
**So that** I can ensure our proposal includes all necessary licensing commitments without hiring expensive consultants.

### Primary User: Legal/Compliance Lead
**As a** compliance officer reviewing a Saudi expansion plan,  
**I want to** check our business plan against MISA requirements with official citations,  
**So that** I can confidently present our licensing roadmap to executives with regulatory backing.

### Secondary User: Operations Manager
**As an** operations manager planning Saudi market entry,  
**I want to** understand which MISA license type applies to our business model,  
**So that** I can budget time and resources for the licensing process.

## Functional Requirements

### FR1: Document Upload
1.1. The system **must** provide a file upload interface that accepts PDF files only.  
1.2. The system **must** validate that uploaded files are valid PDFs (not corrupted).  
1.3. The system **must** enforce a maximum file size of 10MB.  
1.4. The system **must** display clear error messages for invalid or oversized files.  
1.5. The system **should** show a loading indicator during upload and processing.

### FR2: PDF Text Extraction
2.1. The system **must** extract text content from uploaded PDF files.  
2.2. The system **must** handle both text-based and simple scanned PDFs (with basic OCR fallback).  
2.3. The system **must** display an error if text extraction fails, with a clear message to the user.

### FR3: MISA Licensing Analysis
3.1. The system **must** analyze extracted document text against MISA licensing requirements using OpenAI GPT-4.  
3.2. The system **must** identify which MISA license type(s) may be applicable (e.g., Commercial License, Industrial License, Professional License, Regional Headquarters License).  
3.3. The system **must** generate a compliance checklist identifying:
   - Requirements that are addressed in the document
   - Requirements that are missing or unclear
   - Potential gaps or concerns  
3.4. The system **must** provide actionable recommendations for each missing requirement.  
3.5. The analysis **must** complete within 2 minutes for typical documents (10-50 pages).

### FR4: Citations and References
4.1. The system **must** cite specific MISA regulation articles/sections for each requirement mentioned.  
4.2. Citations **must** include at minimum: regulation name and article/section number.  
4.3. The system **should** provide links to official MISA resources where available.

### FR5: Results Display
5.1. The system **must** display analysis results in a clear, scannable format on a web page.  
5.2. Results **must** include:
   - Executive summary (2-3 sentences)
   - Applicable license type(s)
   - Compliance checklist with status indicators (✓ addressed, ⚠ unclear, ✗ missing)
   - Detailed recommendations
   - Full citations list  
5.3. The system **must** clearly indicate this is an AI-generated analysis requiring expert review.

### FR6: PDF Export
6.1. The system **must** provide a "Download Report" button on the results page.  
6.2. The exported PDF **must** include all information from the results display.  
6.3. The exported PDF **must** include generation timestamp and disclaimer.  
6.4. The export **must** be formatted for professional use (readable fonts, proper spacing, page breaks).

### FR7: Knowledge Base (MISA Regulations)
7.1. The system **must** have access to current MISA licensing regulations in a structured format.  
7.2. Regulations **must** include: license types, eligibility criteria, documentation requirements, and application processes.  
7.3. The knowledge base **should** be stored as markdown files or embedded in the AI prompt for Phase 1 MVP.

### FR8: Error Handling
8.1. The system **must** gracefully handle and display errors for:
   - Invalid file uploads
   - PDF extraction failures
   - OpenAI API failures
   - Network timeouts  
8.2. Error messages **must** be user-friendly (no technical stack traces).  
8.3. The system **should** log errors for debugging purposes.

## Non-Goals (Out of Scope for Phase 1 MVP)

The following are explicitly **NOT** included in Phase 1:

### Other Regulations
- ❌ Saudization (Nitaqat) requirements
- ❌ ZATCA e-invoicing compliance
- ❌ PDPL (data protection) analysis
- ❌ SABER/SFDA product conformity
- ❌ RHQ (Regional Headquarters) detailed analysis (may mention if relevant, but not deep analysis)
- ❌ Customs/import regulations

### Advanced Features
- ❌ User accounts and authentication
- ❌ Saved projects/document history
- ❌ Multi-session workspaces
- ❌ Real-time collaboration
- ❌ Contract clause redlining
- ❌ Comparison between multiple documents
- ❌ Mobile app
- ❌ Direct integration with government portals
- ❌ Automated form filling or application submission

### Document Formats
- ❌ DOCX, XLSX, or other Office formats
- ❌ Email ingestion
- ❌ Multi-file batch upload
- ❌ Advanced OCR for handwritten or complex scanned documents

### Other
- ❌ Multi-language UI (English only for MVP)
- ❌ Payment processing
- ❌ Support for countries other than KSA
- ❌ Legal liability or guarantee of compliance accuracy

## Design Considerations

### User Interface
- **Landing Page**: Clean, professional design with:
  - Brief value proposition (1 sentence)
  - File upload dropzone (drag-and-drop optional for MVP)
  - Clear instructions ("Upload your RFP or business plan PDF")
  - Trust indicators (disclaimer about AI analysis)
  
- **Loading State**: Simple loading spinner with message: "Analyzing document against MISA regulations... This may take up to 2 minutes."

- **Results Page**: Professional report layout with:
  - Clear visual hierarchy (executive summary → checklist → details)
  - Color coding for status (green/yellow/red for compliance status)
  - Collapsible sections for detailed recommendations
  - Prominent "Download Report" button

### Visual Style
- Modern, professional aesthetic suitable for business users
- TailwindCSS for styling
- Use shadcn/ui components for consistent UI elements (buttons, cards, alerts)
- Responsive design (desktop-first, mobile usable)

### Accessibility
- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Readable font sizes (minimum 16px body text)

## Technical Considerations

### Tech Stack
**Frontend & Backend:**
- **Next.js 14+** (App Router) - React framework with API routes
- **TypeScript** - Type safety (strict mode)
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library

**AI & Processing:**
- **OpenAI API** (GPT-4 or GPT-4-turbo) - Document analysis
- **pdf-parse** or **pdf.js** - PDF text extraction

**Deployment:**
- **Vercel** - Hosting and deployment (free tier sufficient for MVP)
- **Environment variables** for OpenAI API key

### Architecture
```
User uploads PDF
    ↓
Next.js API route receives file
    ↓
Extract text with pdf-parse
    ↓
Send text + MISA regulation prompt to OpenAI API
    ↓
Parse structured response from GPT-4
    ↓
Return analysis to frontend
    ↓
Display results + offer PDF export
```

### Data Flow
- **No database in Phase 1**: Documents are processed in-memory and not stored
- **No user sessions**: Each analysis is stateless
- **Security**: API keys stored in environment variables, never exposed to client

### Knowledge Base Implementation
For MVP, MISA regulations can be:
1. **Option A (Recommended for speed)**: Embedded directly in the OpenAI prompt as structured text
2. **Option B (Better for accuracy)**: Stored as markdown files in `/regulations` directory, loaded into prompt at runtime

### API Design
```
POST /api/analyze
- Accepts: multipart/form-data with PDF file
- Returns: JSON with analysis results
- Error handling: Returns 4xx/5xx with clear error messages

POST /api/export-pdf
- Accepts: JSON with analysis results
- Returns: PDF file (binary)
```

### Performance Considerations
- Set OpenAI API timeout to 120 seconds (2 minutes)
- Implement retry logic for transient API failures
- Stream responses from OpenAI if possible to show progress

### Security & Privacy
- PDFs processed in-memory, not saved to disk
- No PII collected from users
- Clear disclaimer that documents are sent to OpenAI API
- Environment variables for secrets
- Input validation for file uploads

### Constraints
- OpenAI API rate limits (handle gracefully)
- 10MB PDF size limit (to avoid long processing times)
- English language only (for both input documents and UI)

## Success Metrics

### Phase 1 MVP Success Metrics

#### Technical Success
- [ ] 95%+ of uploaded PDFs process without errors
- [ ] Average analysis time < 2 minutes
- [ ] System uptime > 99% (Vercel reliability)
- [ ] Zero exposed API keys or security issues

#### User Success (Qualitative - 5 test users)
- [ ] All 5 users successfully upload a document and receive results
- [ ] 4/5 users report output is "useful" or "very useful"
- [ ] 3/5 users say it saves them time vs. manual research
- [ ] Users can understand results without additional explanation

#### Output Quality
- [ ] All citations include regulation name + article number
- [ ] Analysis identifies at least 3 relevant MISA requirements per document
- [ ] Recommendations are actionable (specific, not generic)
- [ ] No hallucinated regulations (verify with spot checks)

### How to Measure (MVP)
- Manual testing with 5 real RFP/business plan documents
- User interviews after testing (15-minute feedback sessions)
- Review of generated outputs for accuracy
- Monitor Vercel logs for errors/failures

## Open Questions

### ✅ Resolved
1. **MISA Regulation Source**: ✓ Official MISA documents (PDFs/websites) available
2. **OpenAI API Budget**: ✓ $50-100 allocated for MVP testing (~100-500 analyses)
3. **Test Documents**: ✓ Will use publicly available RFP examples + create synthetic test cases

### Nice-to-Know (Can defer to implementation)
4. **Deployment Domain**: Will this be hosted on a custom domain or Vercel subdomain for MVP?
5. **Analytics**: Should we add basic analytics (Google Analytics, Vercel Analytics) to track usage?
6. **Disclaimer Wording**: What exact legal disclaimer should appear on the site?

### Future Consideration (Phase 2)
7. **Monetization**: Is this a free tool, freemium, or paid from the start?
8. **User Feedback**: Should we add a feedback form to the results page?

---

## Next Steps

Once this PRD is approved:
1. Gather MISA licensing regulations (answer Open Question #1)
2. Generate task list from this PRD using the task generation workflow
3. Set up development environment (Node.js, Next.js, OpenAI API key)
4. Begin implementation following the task list
5. Test with 5 real documents
6. Gather user feedback
7. Iterate or proceed to Phase 2 (adding more regulations)

---

**Document Version**: 1.0  
**Created**: 2025-11-03  
**Target Completion**: 4-6 weeks from start of development  
**Next PRD**: Phase 2 (Multi-Regulation Analysis) - to be written after Phase 1 validation

