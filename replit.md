# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a sophisticated full-stack web application designed as a high-context, no-throttle writing, reasoning, and analysis engine for serious users. The application provides advanced document processing, AI-powered analysis, and comprehensive writing assistance through multiple language models including Claude, GPT-4, and Perplexity.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Math Rendering**: MathJax integration for mathematical expressions and LaTeX

### Backend Architecture
- **Runtime**: Node.js with TypeScript using ESM modules
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Processing**: Multer for file uploads with multiple document format support
- **Real-time Communication**: WebSocket server for streaming responses

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Users**: Authentication and user management
- **Documents**: File storage with content, metadata, and AI analysis results
- **Conversations**: Chat-style interactions with context management
- **Messages**: Individual conversation messages with document references
- **Analytics**: User interaction tracking and cognitive profiling data

## Key Components

### Document Processing Pipeline
- **Multi-format Support**: PDF, DOCX, TXT, and image files with OCR
- **Text Extraction**: Specialized extractors for each format maintaining formatting
- **Mathematical Content**: Mathpix integration for mathematical document processing
- **Chunking Strategy**: Intelligent document splitting for large files
- **AI Detection**: GPTZero integration for detecting AI-generated content

### Language Model Integration
- **Claude Integration**: Primary AI model using Anthropic's latest API
- **GPT-4 Support**: OpenAI integration with streaming capabilities
- **Perplexity API**: Web-enhanced reasoning and research capabilities
- **Model Selection**: Dynamic model switching based on task requirements
- **Conversation History**: Context-aware conversations with message persistence

### Advanced Features
- **Document Rewriting**: AI-powered content improvement with detection protection
- **Cognitive Profiling**: Psychological and intellectual analysis of writing patterns
- **Analytics Dashboard**: Comprehensive writing pattern analysis and insights
- **Text-to-Speech**: ElevenLabs integration for document narration
- **Speech Recognition**: Azure OpenAI Whisper for voice input

## Data Flow

1. **Document Upload**: Files processed through specialized extractors
2. **Content Analysis**: Text analyzed for AI detection and cognitive patterns
3. **Storage**: Documents and metadata stored in PostgreSQL
4. **LLM Processing**: Content sent to selected AI models with conversation context
5. **Response Handling**: Streaming responses managed through WebSocket connections
6. **Analytics Generation**: User interactions analyzed for cognitive profiling

## External Dependencies

### AI Services
- **Anthropic Claude**: Primary language model for advanced reasoning
- **OpenAI GPT-4**: Alternative model for specific use cases
- **Perplexity**: Web-enhanced AI for research tasks
- **GPTZero**: AI content detection service
- **ElevenLabs**: Text-to-speech conversion
- **Azure OpenAI**: Whisper for speech-to-text

### Infrastructure Services
- **Neon Database**: PostgreSQL hosting with connection pooling
- **SendGrid**: Email service for notifications
- **Mathpix**: Mathematical content OCR and processing

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production build optimization
- **TypeScript**: Type safety across frontend and backend

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite development server with fast refresh
- **Database**: PostgreSQL module in Replit environment
- **Port Configuration**: Development on port 5000, production on port 80

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild bundling server code with external package handling
- **Database Migrations**: Drizzle migrations for schema updates
- **Environment Variables**: Secure API key management

### Scaling Considerations
- **Autoscale Deployment**: Configured for automatic scaling based on demand
- **Connection Pooling**: Neon serverless PostgreSQL with connection management
- **File Upload Limits**: 50MB limit with memory storage for processing
- **WebSocket Management**: Real-time connection handling for streaming responses

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```