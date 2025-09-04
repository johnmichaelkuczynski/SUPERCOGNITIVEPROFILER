# TextMind - Advanced Writing & Analysis Engine

## Overview

TextMind is a comprehensive full-stack application designed to provide advanced writing, analysis, and AI-powered features for writers and thinkers. It integrates a React frontend with a Node.js/Express backend to offer capabilities such as document processing, large language model (LLM) integration, AI content detection, and sophisticated analytics. The project aims to deliver a powerful tool for generating, analyzing, and refining written content, including academic papers with integrated visualizations.

## Recent Changes

- **September 4, 2025**: **COMPLETED GPT BYPASS FEATURE** - Full AI text humanization system:
  - **4-box layout interface**: Input (A) → Style (B) → Content Mix (C) → Output (D)
  - **Complete file upload system**: PDF, DOCX, TXT files working in Box A with auto-analysis
  - **GPTZero AI detection**: All 4 boxes have working AI detection showing realistic percentages (e.g., "HUMAN: 82%" or "AI: 18%")
  - **Real humanization presets**: 45+ sophisticated presets including "Mixed cadence + clause sprawl", "Asymmetric emphasis", "Local disfluency", etc.
  - **Style samples**: Sophisticated writing samples from academic/professional texts
  - **Core constraint**: "REWRITE WHAT IS IN BOX A SO THAT IT IS EXACTLY IN THE STYLE OF WHAT IS IN BOX B" (NOT generic humanization)
  - **Backend integration**: Complete API routes for rewriting, file processing, and GPTZero analysis
  - **PDF processing fixed**: Switched from broken pdf-parse to working pdf.js-extract
  - **Trashcan clear buttons**: All 4 boxes have clear buttons that reset both text content and AI detection scores
  
- **AI Model ZHI Branding**: Updated all UI labels:
  - DeepSeek → ZHI 1 (primary model)
  - Claude/Anthropic → ZHI 2
  - GPT-4/OpenAI → ZHI 3
  - Perplexity → ZHI 4

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
- **GPT Bypass System**: Complete AI text humanization with 4-box interface (Input → Style → Content Mix → Output), sophisticated humanization presets, GPTZero-powered detection, and file upload support for PDF/DOCX/TXT files.
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