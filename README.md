# KSA Market-Entry Copilot (Phase 1 MVP)

An AI-powered tool that analyzes business documents (RFPs, contracts, business plans) against Saudi Arabian MISA (Ministry of Investment of Saudi Arabia) licensing requirements, providing compliance checklists with official regulatory citations.

## 🎯 Overview

This tool helps businesses entering the Saudi Arabian market by:
- **Analyzing documents** against MISA licensing requirements
- **Identifying applicable license types** (Commercial, Industrial, Professional, RHQ)
- **Generating compliance checklists** with status indicators
- **Providing actionable recommendations** for missing requirements
- **Including official citations** to MISA regulations
- **Exporting professional PDF reports** for stakeholder review

**Current Phase**: MVP focusing on MISA licensing only  
**Future Phases**: Will expand to Saudization, ZATCA, PDPL, SABER, and more

---

## 🚀 Features

### Core Functionality
- ✅ PDF document upload (max 10MB)
- ✅ AI-powered analysis using GPT-4-turbo
- ✅ Compliance status indicators (✓ Addressed, ⚠ Unclear, ✗ Missing)
- ✅ Line-level citations to MISA regulations
- ✅ Exportable PDF reports
- ✅ Professional, responsive UI

### Supported License Types
- Commercial License (trading, retail, distribution)
- Industrial License (manufacturing, production)
- Professional License (consulting, IT services)
- Regional Headquarters (RHQ) License

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18.x or 20.x (LTS recommended)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`
  
- **OpenAI API Key**: Required for document analysis
  - Sign up at [platform.openai.com](https://platform.openai.com/)
  - Create API key in your dashboard
  - Budget: ~$0.10-0.30 per document analysis

- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)

---

## 🛠️ Installation

### 1. Clone or Navigate to the Project

```bash
cd /path/to/ksa-market-entry-copilot
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Next.js 15+ (React framework)
- TypeScript (strict mode)
- TailwindCSS (styling)
- shadcn/ui (component library)
- OpenAI SDK (AI analysis)
- pdf-parse (PDF text extraction)
- @react-pdf/renderer (PDF generation)
- Zod (validation)

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

**⚠️ Important**: 
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Keep your API key secure
- Don't share your API key publicly

### 4. Verify Installation

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the landing page.

---

## 🗄️ Database

- The app uses **Neon** (serverless PostgreSQL with pooled connections) via the `DATABASE_URL` defined in `.env.local`.
- No custom SSL certificates are required because Neon relies on trusted public certificate authorities.
- Quick connectivity test:

```bash
psql "$DATABASE_URL" -c "select 1"
```

If this command succeeds, you are ready to run migrations or the app locally.

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

- Starts development server on `http://localhost:3000`
- Hot reload enabled (changes reflect immediately)
- Shows detailed error messages

### Production Build

```bash
npm run build
npm start
```

- Creates optimized production build
- Runs production server on `http://localhost:3000`
- Better performance, minified assets

### Linting

```bash
npm run lint
```

- Checks for code quality issues
- Enforces TypeScript strict mode
- Ensures best practices

---

## 📖 Usage Guide

### Step 1: Upload Document

1. Visit the homepage
2. Click "Select PDF File" or drag-and-drop a PDF
3. Maximum file size: 10MB
4. Supported format: PDF only

### Step 2: Wait for Analysis

- Analysis typically takes 30-120 seconds
- Progress indicator shows current step
- Don't close the browser tab during analysis

### Step 3: Review Results

The results page shows:
- **Executive Summary**: AI-generated overview
- **Applicable Licenses**: MISA license types identified
- **Compliance Checklist**: Requirements with status indicators
  - ✓ **Addressed**: Requirement is covered in your document
  - ⚠ **Unclear**: Requirement is ambiguous or partially addressed
  - ✗ **Missing**: Requirement is not mentioned
- **Citations**: References to specific MISA regulation articles
- **Recommendations**: Actionable steps for each requirement

### Step 4: Export Report

- Click "Download Report" button
- Generates professional PDF with all analysis details
- Filename format: `misa-analysis-YYYY-MM-DD.pdf`

---

## 🗂️ Project Structure

```
ksa-market-entry-copilot/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── analyze/              # Main analysis endpoint
│   │   │   └── route.ts          # POST /api/analyze
│   │   └── export-pdf/           # PDF export endpoint
│   │       └── route.ts          # POST /api/export-pdf
│   ├── results/                  # Results page
│   │   └── page.tsx              # Analysis results display
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx            # Button component
│   │   ├── card.tsx              # Card component
│   │   └── alert.tsx             # Alert component
│   ├── ComplianceChecklist.tsx   # Checklist display
│   ├── CitationsList.tsx         # Citations display
│   ├── FileUpload.tsx            # File upload component
│   └── LoadingSpinner.tsx        # Loading state
├── lib/                          # Utility functions
│   ├── misa-prompt.ts            # AI prompt builder
│   ├── openai-client.ts          # OpenAI API wrapper
│   ├── pdf-extractor.ts          # PDF text extraction
│   ├── pdf-generator.ts          # PDF report generation
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # General utilities
├── regulations/                  # MISA regulations knowledge base
│   └── misa-licensing.md         # MISA licensing requirements
├── .env.local                    # Environment variables (not in Git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # TailwindCSS config
└── README.md                     # This file
```

---

## 🧪 Testing

### Manual Testing Checklist

Before deploying, test the following scenarios:

#### File Upload Tests
- [ ] Upload valid PDF (< 10MB) - Should succeed
- [ ] Upload PDF (> 10MB) - Should show error
- [ ] Upload non-PDF file - Should show error
- [ ] Upload corrupted PDF - Should show error
- [ ] Upload empty PDF - Should show error

#### Analysis Tests
- [ ] Analyze business plan mentioning commercial activities
- [ ] Analyze RFP for IT consulting services
- [ ] Analyze industrial manufacturing proposal
- [ ] Verify analysis completes in < 2 minutes
- [ ] Check that all results have citations

#### Results Display Tests
- [ ] Executive summary is displayed
- [ ] License types are shown
- [ ] Checklist items have status indicators
- [ ] Citations list is complete
- [ ] Can collapse/expand checklist items

#### PDF Export Tests
- [ ] Click "Download Report" generates PDF
- [ ] PDF contains all analysis sections
- [ ] PDF is readable and well-formatted
- [ ] Disclaimer is included in PDF

### Creating Test Documents

If you don't have real RFPs/business plans, create synthetic test PDFs:

**Test Document 1 - Simple Business Plan:**
```
Business Plan: Tech Consulting Services in Saudi Arabia

Company Overview:
[Your Company] is an IT consulting firm specializing in digital transformation. 
We plan to establish operations in Riyadh, Saudi Arabia.

Proposed Activities:
- IT consulting services
- Software development
- Digital strategy advisory
- Cloud migration services

Investment:
We plan to invest SAR 500,000 in establishing our Saudi operations.

Staffing:
Initial team of 10 employees, including 3 Saudi nationals.

Facility:
Office space in Riyadh's business district (200 sqm).
```

Convert to PDF using:
- Microsoft Word → "Save As" → PDF
- Google Docs → "File" → "Download" → PDF
- Online converters: [pdf.io](https://pdf.io/)

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

Vercel is the recommended hosting platform for Next.js applications.

#### Prerequisites
- GitHub account
- Vercel account (free tier available)

#### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ksa-market-entry-copilot.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `your-actual-api-key`
   - Apply to: Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Your app will be live at: `https://your-project.vercel.app`

5. **Verify Deployment**
   - Visit your deployment URL
   - Upload a test PDF
   - Verify analysis works
   - Check Vercel logs for errors

#### Custom Domain (Optional)
- In Vercel dashboard → Domains
- Add your custom domain
- Update DNS records as instructed

---

## ⚙️ Configuration

### Adjusting OpenAI Model

In `lib/openai-client.ts`:

```typescript
// For cost savings during testing:
model: 'gpt-3.5-turbo'  // ~10x cheaper

// For production (better quality):
model: 'gpt-4-turbo-preview'  // Default
```

### Changing File Size Limit

In `app/api/analyze/route.ts` and `components/FileUpload.tsx`:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (default)
// Change to: 20 * 1024 * 1024 for 20MB
```

### Updating MISA Regulations

Replace content in `regulations/misa-licensing.md` with official regulations.

**Note**: Current file contains sample data marked "SAMPLE DATA - REPLACE WITH OFFICIAL"

---

## 💰 Cost Estimates

### OpenAI API Costs (GPT-4-turbo)
- **Input**: ~$0.01 per 1K tokens
- **Output**: ~$0.03 per 1K tokens
- **Average per analysis**: $0.10 - $0.30
- **With $50 budget**: ~166-500 analyses

### Cost-Saving Tips
1. Start with GPT-3.5-turbo for testing (~10x cheaper)
2. Use `buildConciseMISAPrompt()` instead of full regulations
3. Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

### Vercel Hosting
- **Free Tier**: Sufficient for MVP
- Includes: 100GB bandwidth, serverless functions, SSL

---

## 🔧 Troubleshooting

### Issue: "OPENAI_API_KEY is not configured"

**Solution**: 
- Ensure `.env.local` file exists
- Verify `OPENAI_API_KEY=sk-proj-...` is set
- Restart dev server: `npm run dev`

### Issue: PDF extraction fails

**Solution**:
- Ensure PDF contains selectable text (not scanned image)
- Try re-saving PDF from original document
- Check PDF is not password-protected

### Issue: Analysis takes too long

**Possible causes**:
- Large document (> 50 pages)
- OpenAI API rate limits
- Network connectivity issues

**Solutions**:
- Reduce document size
- Wait and retry
- Check OpenAI API status: [status.openai.com](https://status.openai.com)

### Issue: PDF export fails

**Solution**:
- Check browser console for errors
- Verify analysis result is complete
- Try refreshing the page and re-exporting

---

## 🛡️ Security & Privacy

### Data Handling
- **PDFs**: Processed in-memory, not saved to disk
- **Results**: Stored temporarily in browser sessionStorage only
- **No Database**: MVP doesn't persist any data server-side

### API Security
- OpenAI API key stored in environment variables (never exposed to client)
- All API routes validate input
- File upload size limits prevent abuse
- No user authentication required (public tool for MVP)

### Disclaimers
- Tool provides AI-generated analysis for informational purposes only
- Results should be reviewed by qualified professionals
- Not a substitute for legal or compliance advice
- Regulations may change; always verify with official sources

---

## 🗺️ Roadmap

### Phase 1 (Current - MVP)
- ✅ MISA licensing analysis
- ✅ PDF upload and export
- ✅ Basic UI

### Phase 2 (Next)
- [ ] Add Saudization (Nitaqat) requirements
- [ ] Add ZATCA e-invoicing compliance
- [ ] Add PDPL (data protection) analysis
- [ ] Multi-document comparison

### Phase 3 (Future)
- [ ] User accounts and project workspaces
- [ ] Contract clause redlining
- [ ] Real-time regulatory updates
- [ ] API for integrations

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Support

For issues, questions, or feedback:
- Review this README thoroughly
- Check the troubleshooting section
- Verify environment configuration

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [OpenAI](https://openai.com/) - AI analysis
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting

---

**Last Updated**: November 2025  
**Version**: 1.0.0 (Phase 1 MVP)  
**Status**: Production Ready 🚀
