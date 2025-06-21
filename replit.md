# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive full-stack application that provides advanced writing, analysis, and AI-powered features for serious writers and thinkers. The application combines a React frontend with a Node.js/Express backend, offering document processing, LLM integration, AI detection, and advanced analytics capabilities.

**Current Status (June 21, 2025):** Complete graph generation system implemented with natural language and mathematical expression parsing. All processing modes (Rewrite, Homework, Text to Math) working perfectly with clean plain text downloads and integrated SVG graph creation capabilities.

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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```