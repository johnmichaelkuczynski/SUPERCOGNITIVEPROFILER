# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive writing and analysis platform that combines multiple AI language models with sophisticated document processing capabilities. The application provides high-context writing assistance, document analysis, AI content detection, and cognitive profiling features for serious writers and thinkers.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Math Rendering**: MathJax for LaTeX mathematical expressions
- **Themes**: next-themes for dark/light mode support

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Development**: Vite for frontend bundling, tsx for server execution
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Processing**: Multer for multipart form handling
- **WebSocket**: Native WebSocket support for real-time chat

### Database Schema
- **Users**: Basic authentication and profile management
- **Documents**: File storage with metadata and chunking support
- **Conversations**: Chat history with contextual document references
- **Messages**: Individual chat messages with metadata
- **Analytics**: User activity and writing pattern tracking

## Key Components

### 1. Multi-Model LLM Integration
- **Claude 3.7 Sonnet**: Primary model for advanced reasoning
- **GPT-4o**: Secondary model for specific tasks
- **Perplexity**: Online research and fact-checking
- **Anthropic SDK**: Direct integration with Claude API
- **OpenAI SDK**: Direct integration with GPT models

### 2. Document Processing Pipeline
- **File Support**: PDF, DOCX, TXT, and image formats
- **Text Extraction**: Multiple extraction methods with fallbacks
- **Document Chunking**: Intelligent content segmentation
- **Mathematical Content**: LaTeX preservation and rendering
- **OCR Integration**: Tesseract for image-based text extraction

### 3. AI Content Detection
- **GPTZero Integration**: Professional AI detection service
- **Detailed Analysis**: Sentence-level probability scoring
- **Visual Indicators**: Color-coded confidence badges
- **Protection Features**: Anti-detection rewriting capabilities

### 4. Cognitive Profiling System
- **Writing Analysis**: Style, complexity, and pattern recognition
- **Cognitive Archetypes**: Personality-based writing categorization
- **Analytics Dashboard**: Comprehensive usage and pattern tracking
- **Profile Generation**: Multi-dimensional personality assessment

### 5. Text-to-Speech Engine
- **ElevenLabs Integration**: High-quality voice synthesis
- **Script Processing**: Dialogue extraction and character separation
- **Voice Mapping**: Character-specific voice assignment
- **Document Cleaning**: Automated script preparation

## Data Flow

### 1. Document Upload and Processing
```
File Upload → Multer Processing → Text Extraction → Chunking → Database Storage → AI Analysis
```

### 2. Chat Interaction
```
User Input → Model Selection → Context Enrichment → API Call → Response Processing → Storage
```

### 3. AI Detection Workflow
```
Text Selection → GPTZero API → Probability Analysis → Visual Feedback → Storage
```

### 4. Document Rewriting
```
Original Text → Instruction Processing → Model Selection → Rewriting → Comparison → Storage
```

## External Dependencies

### AI Services
- **Anthropic API**: Claude model access
- **OpenAI API**: GPT-4 and Whisper integration
- **Perplexity API**: Online research capabilities
- **GPTZero API**: AI content detection
- **ElevenLabs API**: Text-to-speech synthesis

### Infrastructure Services
- **Neon Database**: PostgreSQL hosting
- **SendGrid**: Email delivery service
- **Azure OpenAI**: Speech-to-text services

### Development Tools
- **Replit**: Development environment
- **Vite**: Build tooling and development server
- **Drizzle Kit**: Database migration management

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Hot Reload**: Vite dev server with HMR
- **Database**: Automatically provisioned PostgreSQL instance
- **Port Configuration**: 5000 (internal) → 80 (external)

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundling to `dist/index.js`
- **Database**: Drizzle migrations via `db:push`
- **Deployment**: Autoscale deployment target

### Configuration Management
- **Environment Variables**: API keys and database URLs
- **Path Aliases**: TypeScript path mapping for clean imports
- **Asset Handling**: Static file serving in production

## Changelog

Changelog:
- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.