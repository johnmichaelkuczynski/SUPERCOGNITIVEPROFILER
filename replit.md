# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive full-stack application designed to provide advanced writing, analysis, and AI-powered features for writers and thinkers. It integrates a React frontend with a Node.js/Express backend to offer capabilities such as document processing, large language model (LLM) integration, AI content detection, and sophisticated analytics. The project aims to deliver a powerful tool for generating, analyzing, and refining written content, including academic papers with integrated visualizations.

## Recent Changes

- **September 4, 2025**: Updated all AI model labels in UI to ZHI branding:
  - DeepSeek → ZHI 1 (primary model)
  - Claude/Anthropic → ZHI 2
  - GPT-4/OpenAI → ZHI 3
  - Perplexity → ZHI 4
  - Backend API logic and routing remain unchanged

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Math Rendering**: MathJax and KaTeX integration for mathematical content
- **Theming**: Dark/light mode support

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM, utilizing Neon Database for serverless functionality
- **Build Tools**: Vite for frontend, esbuild for backend
- **Development**: tsx for TypeScript execution

### Key Features & Design Decisions
- **LLM Integration**: Supports multiple providers including ZHI 2 (Claude/Anthropic), ZHI 3 (GPT-4/OpenAI), ZHI 4 (Perplexity), and ZHI 1 (DeepSeek). Features intelligent document chunking and real-time response streaming via WebSockets.
- **AI Services**: Includes multi-model document rewriting, GPTZero for AI content detection, ElevenLabs for text-to-speech, Tesseract for OCR, and advanced cognitive profiling/writing analysis.
- **Graph Generation**: Converts natural language and mathematical expressions into SVG graphs, enabling the creation of academic papers with embedded charts.
- **Mathematical Notation**: Comprehensive system for rendering LaTeX expressions, ensuring proper display of mathematical and scientific notation throughout the application and in exports. Includes intelligent delimiter detection and currency protection.
- **Text Processing**: Focuses on generating clean plain text output from LLMs, eliminating markdown formatting, transitional text, and editorial comments.
- **Document Management**: Handles user authentication, document uploads (PDF, DOCX, TXT, JPG, PNG) with text extraction and chunking, and manages chat histories and analytics data.
- **Refined User Experience**: Features editable processed content, selective text rewriting, expandable content previews, and robust word counting across input areas.
- **Analytical Scoring**: Implements a paradigm-based metacognitive scoring framework for content analysis, providing detailed, evidence-based reports with direct quotations and justifications.

## External Dependencies

- **Anthropic API**: Claude LLM integration
- **OpenAI API**: GPT-4 and Whisper integration
- **Perplexity API**: Alternative LLM provider
- **DeepSeek API**: Primary LLM provider
- **GPTZero API**: AI content detection
- **ElevenLabs API**: Text-to-speech conversion
- **SendGrid API**: Email functionality
- **Drizzle ORM**: Database interaction
- **Mammoth**: DOCX text extraction
- **pdf.js-extract**: PDF text extraction
- **Tesseract.js**: OCR processing
- **Multer**: File upload handling