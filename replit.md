# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive full-stack application that provides advanced writing, analysis, and AI-powered features for serious writers and thinkers. The application combines a React frontend with a Node.js/Express backend, offering document processing, LLM integration, AI detection, and advanced analytics capabilities.

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
- June 14, 2025. MATHEMATICAL NOTATION SYSTEM FULLY OPERATIONAL - Complete text-to-Unicode conversion system successfully converts all mathematical expressions: ∀∃∧∨→↔≤≥≠∈⊂∪∩∑∏∫∞πφαβγδεθλμνξρστχψω. Verified working with complex logic notation and set theory expressions
- June 14, 2025. ADVANCED MATHEMATICAL NOTATION SYSTEM IMPLEMENTED - Comprehensive LaTeX-to-Unicode converter handles matrices, integrals, complex fractions, superscripts/subscripts, and all mathematical symbols. Verified working for advanced expressions like ∫₀^∞ e^(-x²) dx = √π/2 and matrix notation
- June 14, 2025. MARKDOWN FORMATTING COMPLETELY ELIMINATED - Server-side aggressive stripping removes all # * formatting from AI responses, ensuring clean output everywhere
- June 14, 2025. Replaced all MathJax implementations with unified MathRenderer component for consistent mathematical display
- June 14, 2025. PDF export system completely rebuilt to remove ALL markup and render clean documents with proper Unicode symbols
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language. User is extremely frustrated with mathematical notation display issues. Stop reviewing/checking - just fix directly and immediately.
```