# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a sophisticated full-stack web application that serves as an advanced writing, reasoning, and analysis engine for serious users. It combines multiple AI models (Claude, GPT-4, Perplexity) with document processing capabilities, providing high-context analysis, document rewriting, AI content detection, and comprehensive user analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, local state with React hooks
- **Routing**: Wouter for lightweight client-side routing
- **Math Rendering**: MathJax for LaTeX formula display
- **Theme**: Next-themes for dark/light mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Simple localStorage-based authentication (MVP level)
- **File Processing**: Multer for file uploads with memory storage

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle with schema-first approach
- **File Storage**: Memory-based with processing pipeline
- **Session Storage**: Browser localStorage for user data

## Key Components

### Document Processing Pipeline
- **PDF Processing**: Custom extraction with fallback to multiple libraries
- **DOCX Processing**: Mammoth.js for Word document parsing
- **OCR Support**: Tesseract.js for image-to-text conversion
- **Math Processing**: Mathpix integration for mathematical content
- **Chunking**: Intelligent document splitting for large file processing

### AI Integration Layer
- **Multi-Model Support**: Claude 3.5 Sonnet, GPT-4, and Perplexity
- **Streaming**: WebSocket support for real-time AI responses
- **Context Management**: Conversation history and document context
- **Prompt Engineering**: Specialized prompts for different use cases

### Analytics Engine
- **Writing Analysis**: Formality, complexity, and cognitive signature detection
- **User Profiling**: Cognitive, psychological, and metacognitive profiles
- **Pattern Recognition**: Writing style evolution tracking
- **Export Capabilities**: Multiple format support (JSON, CSV, PDF)

### Content Services
- **AI Detection**: GPTZero integration for AI content identification
- **Document Rewriting**: Multi-model rewriting with detection protection
- **Text-to-Speech**: ElevenLabs integration for audio generation
- **Speech-to-Text**: Azure OpenAI Whisper integration

## Data Flow

1. **Document Upload**: Files processed through extraction pipeline
2. **AI Processing**: Content sent to selected AI model with context
3. **Response Handling**: Streaming or batch response processing
4. **Storage**: Results stored in PostgreSQL with metadata
5. **Analytics**: Writing patterns analyzed and stored
6. **Export**: Data available in multiple formats

## External Dependencies

### AI Services
- **Anthropic**: Claude API for advanced reasoning
- **OpenAI**: GPT-4 and Whisper for text/speech processing
- **Perplexity**: Web-connected AI responses
- **GPTZero**: AI content detection
- **Mathpix**: Mathematical content OCR

### Communication Services
- **SendGrid**: Email delivery for notifications
- **ElevenLabs**: Text-to-speech conversion
- **Azure OpenAI**: Speech-to-text transcription

### Infrastructure
- **Neon**: Serverless PostgreSQL hosting
- **WebSocket**: Real-time communication
- **Replit**: Development and deployment platform

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Build Tool**: Vite for frontend bundling
- **Process Manager**: npm scripts for development workflow

### Production Deployment
- **Target**: Replit Autoscale deployment
- **Build Process**: Vite build + esbuild for server bundling
- **Database**: Neon serverless PostgreSQL
- **Environment**: Production Node.js with optimized builds

### Configuration
- **Port**: 5000 (development), 80 (production)
- **Environment Variables**: API keys, database URL, service credentials
- **Static Assets**: Vite-built assets served from dist/public

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```