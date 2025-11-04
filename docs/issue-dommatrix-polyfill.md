## DOMMatrix Polyfill Failure When Parsing PDFs

- **Observed Error**: `Failed to extract text from PDF: DOMMatrix is not defined. Please ensure the file is a valid, text-based PDF.` appears in `app/api/analyze/route.ts` log output when uploading any PDF. The stack trace points to `lib/pdf-extractor.ts`.
- **Trigger**: Uploading valid, text-based PDFs (e.g., `BusinessPlan_Text_~3MB.pdf`). Extraction fails before reaching OpenAI analysis.
- **Root Cause (suspected)**: `pdf-parse` introduces a dependency on `pdfjs-dist`, which expects `DOMMatrix`, `ImageData`, and `Path2D` globals. In the Node.js runtime, these are normally polyfilled via `@napi-rs/canvas`. The native bindings of `@napi-rs/canvas` are not loading correctly inside this execution environment, so `DOMMatrix` remains undefined.

### Timeline of Fix Attempts

1. **Install Polyfill Dependency**  
   - Installed `@napi-rs/canvas@0.1.81` (npm also pulled `@napi-rs/canvas@0.1.80` as a transitive dependency of `pdf-parse`).  
   - Verified the package appears in `npm ls`.

2. **Polyfill in Code**  
   - Added guard in `lib/pdf-extractor.ts` to require `@napi-rs/canvas` and assign `globalThis.DOMMatrix` before invoking `pdf-parse`.

3. **Rebuild Native Binding**  
   - Ran `npm rebuild @napi-rs/canvas`.  
   - Verified `node -e "const canvas=require('@napi-rs/canvas'); console.log(typeof canvas.DOMMatrix);"` returns `function` locally.

4. **Server Restarts & Cache Clears**  
   - Multiple cycles of `npm run dev`, `kill $(lsof -ti tcp:3000)`, `rm -rf .next`, and restarts to ensure the new dependency is loaded.

5. **Result**  
   - API still logs `Could not load @napi-rs/canvas for DOMMatrix polyfill: Error: Failed to load native binding` when invoked via the Next.js route.  
   - pdf.js warnings about missing `DOMMatrix`, `ImageData`, `Path2D` follow.  
   - Endpoint returns 400 with PDF extraction failure.

### Additional Context

- The development server intermittently served `/` as a 404 because `tsconfig.json` was toggled between `"jsx": "preserve"` (required for Next.js app directory) and `"jsx": "react-jsx"`. Restoring `"preserve"` removes the 404 but the user reverted it; the runtime error persists regardless.
- Running the polyfill test script directly from the project root succeeds, which implies the native binding is present but may not load inside the Next.js API runtime (potentially due to sandboxing permissions or binary mismatch).

### Recommended Next Steps

- **Environment Check**: Confirm the Node.js version satisfies `@napi-rs/canvas`’s prebuilt binaries. Try forcing `npm install --build-from-source @napi-rs/canvas` if running on an unsupported platform.
- **Alternative Polyfill**: Evaluate using `canvas` (node-canvas) or a pure JS DOMMatrix polyfill (e.g., `@web-std/dom-matrix`) as a fallback when the native module fails.
- **Runtime Logging**: Add detailed logging around `process.versions`, `process.platform`, and `require.resolve('@napi-rs/canvas')` inside the API route to confirm resolution paths.
- **Isolation Test**: Create a simple Node script (outside Next.js) that uses `pdf-parse` with the same polyfill logic to see if the binding loads when not executed inside Next.js middleware/runtime.
- **Explore pdf-parse Options**: Some versions allow disabling DOM-dependent features. Investigate whether `pdfjs-dist` can be configured to skip geometry APIs that require `DOMMatrix` in this use case.

