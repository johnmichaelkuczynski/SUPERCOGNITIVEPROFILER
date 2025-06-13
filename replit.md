# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a sophisticated full-stack application that serves as a high-context writing, analysis, and processing engine. The application combines modern web technologies with advanced AI capabilities to provide users with document processing, AI-powered conversations, text analysis, and writing assistance tools.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Custom component library built with Radix UI primitives and styled with Tailwind CSS
- **State Management**: TanStack Query for server state management, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Math Rendering**: Better React MathJax for LaTeX mathematical expressions
- **Styling**: Tailwind CSS with shadcn/ui design system (New York variant)

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js with custom middleware for logging and error handling
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL with connection pooling
- **API Design**: RESTful endpoints with WebSocket support for real-time features

### Development & Build Tools
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Development**: Hot module replacement with Vite dev server
- **TypeScript**: Strict configuration with path mapping for clean imports
- **Package Management**: npm with lockfile for reproducible builds

## Key Components

### Document Processing System
- **File Support**: PDF, DOCX, TXT, and other document formats
- **Text Extraction**: Advanced text extraction with mathematical content preservation
- **Document Chunking**: Intelligent splitting of large documents for better processing
- **AI Detection**: Integration with GPTZero for AI content detection
- **Mathematical Content**: LaTeX preservation and MathJax rendering

### AI Integration Services
- **Claude (Anthropic)**: Primary AI model using claude-3-7-sonnet-20250219
- **GPT-4 (OpenAI)**: Secondary AI model using gpt-4o
- **Perplexity**: Online-enabled AI model using llama-3.1-sonar-small-128k-online
- **Conversation Management**: Persistent conversations with context and history
- **Document Rewriting**: AI-powered document transformation with detection protection

### Advanced Features
- **Text-to-Speech**: ElevenLabs integration for voice synthesis
- **Speech-to-Text**: Azure OpenAI Whisper integration for audio transcription
- **Email Services**: SendGrid integration for notifications and document sharing
- **Analytics Engine**: Comprehensive writing and cognitive pattern analysis
- **User Profiling**: Psychological and cognitive profiling based on writing patterns

### Authentication & User Management
- **Simple Authentication**: Local storage based user management (MVP approach)
- **User Profiles**: Basic user information and preferences storage
- **Document Library**: Personal document storage and management per user

## Data Flow

### Document Processing Flow
1. File upload via multipart form data
2. Text extraction using appropriate service (PDF, DOCX, etc.)
3. Optional mathematical content processing via MathPix OCR
4. Document chunking for large files
5. AI detection analysis
6. Storage in PostgreSQL with metadata
7. Frontend display with preserved formatting

### AI Conversation Flow
1. User input with optional file attachments
2. Document processing and context preparation
3. AI service selection and prompt formatting
4. Streaming or batch response handling
5. Response storage with conversation context
6. Real-time updates via WebSocket connections

### Analytics Generation Flow
1. Document and conversation data aggregation
2. Writing pattern analysis using AI services
3. Cognitive profiling based on content analysis
4. Statistical computation and trend identification
5. Report generation and visualization data preparation

## External Dependencies

### AI Services
- **Anthropic API**: Claude models for advanced reasoning and analysis
- **OpenAI API**: GPT-4 and Whisper for text generation and speech processing
- **Perplexity API**: Online-enabled language model for real-time information
- **GPTZero API**: AI content detection and analysis
- **ElevenLabs API**: Text-to-speech voice synthesis

### Infrastructure Services
- **Neon Database**: Serverless PostgreSQL hosting
- **SendGrid**: Email delivery service
- **Azure OpenAI**: Alternative AI service endpoint

### Development Tools
- **Replit Integration**: Development environment with cartographer plugin
- **PostCSS & Autoprefixer**: CSS processing pipeline
- **Drizzle Kit**: Database schema management and migrations

## Deployment Strategy

### Production Build
- **Frontend**: Vite build generates optimized static assets
- **Backend**: esbuild bundles server code with external package references
- **Output**: Single deployable package with public assets and server bundle

### Environment Configuration
- **Development**: Local development with hot reloading and debugging tools
- **Production**: Optimized builds with environment-specific configurations
- **Database**: Automatic schema synchronization with Drizzle push command

### Scaling Considerations
- **Deployment Target**: Autoscale configuration for dynamic resource allocation
- **Database**: Serverless PostgreSQL with connection pooling for scalability
- **File Processing**: Memory-based file handling with size limits (50MB)

## Changelog

```
Changelog:
- June 13, 2025. Initial setup
```

## User Preferences

Preferred communication style: Simple, everyday language.