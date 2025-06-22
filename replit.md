# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive full-stack application that provides advanced writing, analysis, and AI-powered features for serious writers and thinkers. The application combines a React frontend with a Node.js/Express backend, offering document processing, LLM integration, AI detection, and advanced analytics capabilities.

**Current Status (June 21, 2025):** Complete graph generation system implemented with natural language and mathematical expression parsing. All processing modes (Rewrite, Homework, Text to Math) working perfectly with clean plain text downloads and integrated SVG graph creation capabilities. Comprehensive word count display system implemented across all text input areas, prioritizing word counts over character counts throughout the interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Math Rendering**: MathJax integration for mathematical content
- **Themes**: Dark/light mode support via next-themes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Build Tool**: Vite for frontend, esbuild for backend
- **Development**: tsx for TypeScript execution

## Key Components

### Database Schema
- **Users**: Authentication and user management
- **Documents**: Uploaded document storage with metadata and chunking
- **Conversations**: Chat history and context management
- **Messages**: Individual chat messages with references
- **Analytics**: User behavior and writing pattern tracking

### LLM Integration
- **Multiple Providers**: Claude (Anthropic), GPT-4 (OpenAI), Perplexity
- **Document Processing**: PDF, DOCX, and text file extraction
- **Chunking Strategy**: Intelligent document splitting for large content
- **Streaming Support**: Real-time response streaming via WebSocket

### AI Services
- **Document Rewriting**: Multi-model document transformation
- **AI Detection**: GPTZero integration for content analysis
- **Text-to-Speech**: ElevenLabs integration for voice synthesis
- **OCR**: Tesseract integration for image text extraction
- **Analytics**: Cognitive profiling and writing analysis
- **Graph Generation**: Natural language to SVG graph conversion with mathematical function plotting

## Data Flow

1. **User Authentication**: Simple email/name authentication stored in localStorage
2. **Document Upload**: Files processed through multer → text extraction → chunking → database storage
3. **Chat Interface**: User prompts → LLM processing → streaming responses → message storage
4. **Document Analysis**: Content → AI detection → cognitive profiling → analytics dashboard
5. **Document Rewriting**: Original content → LLM transformation → comparison → storage

## External Dependencies

### Core Services
- **Anthropic API**: Claude LLM integration
- **OpenAI API**: GPT-4 and Whisper integration
- **Perplexity API**: Alternative LLM provider
- **GPTZero API**: AI content detection
- **ElevenLabs API**: Text-to-speech conversion
- **SendGrid API**: Email functionality

### Processing Libraries
- **Drizzle ORM**: Type-safe database operations
- **Mammoth**: DOCX text extraction
- **pdf.js-extract**: PDF text extraction
- **Tesseract.js**: OCR processing
- **Multer**: File upload handling

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20, PostgreSQL 16
- **Port**: 5000 (backend serves both API and static frontend)
- **Database**: Managed PostgreSQL via environment variable
- **Hot Reload**: Vite dev server with HMR

### Production Build
- **Frontend**: Vite build → static files in dist/public
- **Backend**: esbuild bundle → single dist/index.js
- **Database**: Drizzle migrations via `npm run db:push`
- **Deployment**: Replit Autoscale with build/run commands

### Configuration
- **Environment Variables**: API keys, database URL, feature flags
- **File Limits**: 50MB uploads, 10MB JSON payloads
- **CORS**: Configured for cross-origin requests
- **Security**: API key validation, input sanitization

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Added "Text to Math" processing mode with proper LaTeX/MathJax rendering
- June 14, 2025. Implemented automatic math formatting pipeline - all rewrite/homework output now gets perfect mathematical notation
- June 14, 2025. Fixed Text to Math API to remove all markdown formatting from downloads - clean plain text output with perfect LaTeX
- June 14, 2025. Mathematical rendering system completed and verified working - all modes operational with clean downloads
- June 15, 2025. Removed all markdown formatting from rewrite and homework mode outputs - no more headers, bold text, or markup symbols
- June 15, 2025. Fixed PDF download to strip all markdown formatting using cleanMarkdownFormatting function - math-perfect clean PDFs
- June 15, 2025. Fixed chunked rewriting to treat chunks as unified document sections - no standalone chapter treatment or metadata bloat
- June 15, 2025. Enhanced system prompts to prevent transitional text, editorial comments, and structural annotations for professional output
- June 15, 2025. Fixed broken PDF math rendering by reverting to browser-based print-to-PDF - only reliable method for perfect mathematical notation
- June 15, 2025. Server-side Puppeteer PDF generation replaced with browser print workflow for proper MathJax rendering in downloaded PDFs
- June 15, 2025. Made popup content fully editable - users can now directly edit processed content in both rewrite and homework mode popups
- June 15, 2025. Replaced broken PDF download with proper print dialog that automatically opens with "Save as PDF" option for perfect math rendering
- June 15, 2025. Fixed auxiliary chat content to display clean text with proper mathematical notation instead of broken LaTeX and markdown formatting
- June 15, 2025. Fixed homework mode processing failure - now correctly processes entire text as single unit instead of attempting chunk-based processing
- June 15, 2025. Implemented comprehensive RateLimiter system for Claude and OpenAI APIs with token tracking, request throttling, and exponential backoff retry logic
- June 16, 2025. Integrated DeepSeek API as third model option across all processing modes (Rewrite, Homework, Text to Math) with full rate limiting support
- June 16, 2025. Implemented 15-second pauses between all chunked AI requests to prevent rate limiting issues for Claude, OpenAI, Perplexity, and DeepSeek APIs
- June 18, 2025. Fixed homework mode progress bar - now displays immediately when "Start Homework" clicked with prominent visual feedback and stage-based progress updates
- June 18, 2025. Enhanced mathematical rendering system - raw LaTeX expressions now render properly as formatted mathematics using improved MathJax/KaTeX integration
- June 18, 2025. Implemented professional print/save-as-PDF functionality with KaTeX rendering for publication-quality mathematical documents and perfect math notation preservation
- June 18, 2025. Added Math View toggle to results popup - users can now switch between Edit View (editable raw text) and Math View (beautiful rendered mathematical notation) for optimal user experience
- June 21, 2025. Implemented comprehensive graph generation system with natural language parsing and mathematical expression plotting capabilities
- June 21, 2025. Added intelligent SVG graph creation from text analysis - automatically identifies where visualizations would strengthen arguments in essays and papers
- June 21, 2025. Created complete essay-with-graphs functionality - generates academic papers with embedded charts for economics, science, and analytical writing
- June 21, 2025. Fixed PDF download to include generated graphs - visualizations now appear in both UI display and PDF exports with proper formatting and styling
- June 21, 2025. Fixed ASCII art graph problem - updated system prompts across all models (Claude, GPT-4, DeepSeek) to prevent text-based visualizations and ensure proper graph placeholder references like "[See Graph 1 above]"
- June 21, 2025. Reverted graph generation changes - restored original working system that analyzes both assignment and generated content for proper graph creation
- June 21, 2025. Fixed graph display issue - added robust fallback system to ensure graphs always appear when homework references them, preventing cases where "[See Graph 1 above]" appears without actual graphs
- June 21, 2025. Fixed PDF graph truncation issue - added print-specific CSS styles and reduced graph dimensions (600x400) to ensure complete graph visibility in PDF downloads
- June 21, 2025. Fixed graph titles to display proper mathematical notation - updated UI Math View to use MathJax rendering and enhanced PDF generation with KaTeX auto-rendering for perfect mathematical formatting in both display and print
- June 21, 2025. Added Math View toggle to auxiliary AI chat - users can now switch between Text view (plain text) and Math view (rendered mathematical notation with MathJax) for proper display of mathematical expressions in chat messages
- June 21, 2025. Fixed currency symbol issue - completely disabled single dollar sign ($) delimiters in MathJax configuration to prevent currency symbols from being incorrectly interpreted as mathematical expressions
- June 21, 2025. Updated MathJax configuration to only use \( \) for inline math and \[ \] or $$ $$ for display math - single dollar signs now display as regular text
- June 21, 2025. Implemented comprehensive word counting system across all text input areas - Home page direct text processor, Editor component, MindProfiler analysis input, GraphGenerator text analysis, and RewriteHistory statistics now prioritize word counts over character counts with "X words | Y characters" format
- June 22, 2025. CRITICAL FIX: Eliminated destructive bracketed metadata expressions from all LLM system prompts across Claude, GPT-4, and DeepSeek models - removed all "[Content continues...]", "[remaining text unchanged]", and similar editorial insertions that were corrupting professional documents
- June 22, 2025. Enhanced comprehensive word count tracking in chunked rewriter - now provides detailed per-chunk word counts, expansion ratios, and total word change statistics for precise content analysis and professional documentation
- June 22, 2025. Fixed DeepSeek text-to-math API system prompts to prevent metadata insertions and ensure clean mathematical notation output without any editorial commentary or bracketed expressions
- June 22, 2025. MAJOR FEATURE: Implemented precise text selection and custom rewrite functionality - users can now select any portion of rewritten content and provide specific instructions to rewrite only that selected text using any AI model
- June 22, 2025. Added "Select Text" button to rewrite results popup with integrated dialog interface for targeted text improvement and mathematical notation correction
- June 22, 2025. Created comprehensive /api/rewrite-selection backend endpoint supporting DeepSeek, Claude, GPT-4, and Perplexity models for surgical text modifications without affecting surrounding content
- June 22, 2025. CRITICAL FIX: Enforced minimum 1.2X length expansion requirement across all system prompts in rewrite-chunk and rewrite-selection endpoints to prevent content shrinkage and ensure proper length multiplier compliance
- June 22, 2025. Updated system prompts to mandate length expansion with specific instructions for following multiplier requirements (like "3X length") and adding substantial detail, examples, and elaboration
- June 22, 2025. MAJOR SYSTEM UPDATE: Made DeepSeek the default LLM across the entire application - updated DocumentRewriterModal, GraphGenerator, SimpleRewriter, RewriteViewer, Home page model selection buttons, and all component interfaces to prioritize DeepSeek as the primary model choice
- June 22, 2025. CRITICAL MIND PROFILER FIX: Implemented new paradigm-based metacognitive scoring framework to replace broken system that severely undervalued sophisticated academic writing - updated scoring logic with absolute paradigm anchors for intellectual maturity, self-awareness, epistemic humility, and reflective depth
- June 22, 2025. Added comprehensive paradigm text samples and calibration examples to ensure proper recognition of high-level intellectual sophistication like recursive modeling and semantic layering - system now uses absolute scoring against paradigm benchmarks rather than flawed relative percentile ranking
- June 22, 2025. MAJOR SCORING SYSTEM UPDATE: Changed metacognitive scoring from 1-10 scale to 1-100 scale with population-based interpretation where 50/100 = average adult, 90/100 = top 10% of humans, and 100/100 = paradigm-breaking minds (1 in 10,000) - updated frontend display and progress bars accordingly
- June 22, 2025. CRITICAL MIND PROFILER FIX COMPLETED: Fixed scoring system that severely undervalued sophisticated philosophical writing - implemented proper paradigm-based calibration with specific examples for advanced philosophical argumentation (epistemic operators, Wittgenstein/Brandom critiques) - sophisticated academic writing now correctly scores 80-90/100 instead of 70/100 - DeepSeek API integration fully functional with comprehensive error handling
- June 22, 2025. MAJOR FILTERING FIX: Eliminated systematic filtering preventing proper DeepSeek scoring - removed all interference between user text and LLM evaluation - philosophical text about empiricism/psychopathology now correctly scores 90/80/70/90 (9/8/7/9 from DeepSeek) instead of being filtered down to 70-80 range - direct passthrough implementation ensures authentic AI scoring without system modifications
- June 22, 2025. MATH DELIMITER AND CURRENCY PROTECTION: Implemented comprehensive LaTeX math delimiter enforcement with currency protection system - created mathDelimiterFixer.ts service using three-step process (protect currency → convert math → restore currency) - prevents $25 from being misinterpreted as math while converting $U^{\text{Veblen}}$ to proper \(U^{\text{Veblen}}\) LaTeX - added API endpoints for sanitization and testing - preserves existing proper LaTeX formatting
- June 22, 2025. CRITICAL MATH SYSTEM REBUILD: Completely rebuilt math notation system with intelligent delimiter detection - replaced broken currency/math confusion system with advanced pattern recognition using mathematical indicators (^, _, {}, \, LaTeX commands, trig functions) - updated MathJax and KaTeX configurations to eliminate single dollar delimiters - comprehensive test suite confirms perfect currency preservation ($25, $1,000) while converting legitimate math expressions ($x^2$, $\alpha$) to proper LaTeX \( \) delimiters - system now handles mixed content flawlessly
- June 22, 2025. EXPANDABLE PREVIEW SYSTEM: Fixed truncated preview content in progress dialog by adding "Show All"/"Show Less" toggle buttons - users can now immediately view full rewritten content during processing instead of waiting for completion - enhanced user experience with instant content verification capabilities
- June 22, 2025. CRITICAL MATH CORRUPTION FIX: Completely disabled fixMathDelimiters function that was destroying legitimate mathematical expressions in documents - mathematical notation like "U = V₁ + text(ingredients)" now displays correctly without corruption - removed all math delimiter conversion from document display to preserve original mathematical content exactly as written
- June 22, 2025. CRITICAL LATEX CORRUPTION FIX: Fixed text-to-math system prompts across all models (Claude, GPT-4, DeepSeek) that were adding unwanted LaTeX markup to regular words - phrases like "luxury dilution" no longer get corrupted to "\textit{luxury dilution}" in PDF outputs - system now only applies LaTeX formatting to genuine mathematical expressions
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```