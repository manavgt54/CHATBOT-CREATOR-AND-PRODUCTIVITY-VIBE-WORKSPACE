AI Creation Platform – Hackathon Prototype
Multi-bot AI Platform with Augmentation, RAG, and Personality-aware Bots
Hackathon: Google Gen AI International Hackathon
manavgt54– Team Lead, Core Development, Architecture & Optimization, 

VAIBHAV WAGHALKAR– Assisted with testing, UI design, and some core devlopment

THANUSHREE-23(GITHUB)– Supported workflow, demo prep, and documentation,UI DESING

VANI412(GITHUB)– Assisted with presentation, project visuals, and flow diagrams,ui desings and implementations.

Date: September 21, 2025


Table of Contents
Project Overview
Problem Statement
Unique Value Proposition
Features
User Flow
Developer Flow
Architecture
Technical Highlights
Deployment & Optimization
Future Vision
Team Contributions
Project Overview
AI Creation Platform allows users and developers to create fully-functional AI bots in one line descriptions, with unique personalities, RAG integration, and augmentation logic.

Instant bot creation without coding
Personality-aware bots
Real-time inline citations
Multi-bot collaboration (Phase 2)
PDF/Image upload and processing
Deployment: Fully live and tested prototype

Problem Statement
Current AI platforms often fail to provide:

Low-friction bot creation for developers
Personality customization
Reliable cross-domain responses
Real-time citations
Our solution: AI Creation Platform solves these by providing scalable, reliable, and fully functional bots in a developer-friendly environment.

Unique Value Proposition
For Developers:

One-line bot creation
Each bot has a unique API key powering personality
RAG integration + augmentation logic
Multi-bot orchestration and monitoring
For Users:

Inline citations appear only when requested
Domain-aware responses for reliability
Market Gap:
No existing platform combines RAG + personality + multi-bot orchestration + low friction

Features
Bot Creation & Invocation:

One-line creation
Unique personality per bot
Web citations, augmentation logic, and RAG integration
Minimal storage: ~500KB–1MB per bot using symlink optimization
User Features:

Real-time AI responses (<2 sec)
PDF/Image upload & processing
Multi-bot query support
Casual vs. deep mode responses
Developer Features:

Containerized multi-bot orchestration
Exponential backoff for API calls
Multi-API support (Google Gemini, OpenAI, Anthropic)
Performance & Optimization:

Memory-efficient: low storage per bot
Scalable: large nos of bots 
Reliable augmentation logic and cross-domain control
User Flow
User selects/creates bot → Bot initialized with unique personality & API key → User query processed with RAG + augmentation → Inline citations appear only when requested → Multi-bot collaboration supported → PDF/Image uploads processed → Response returned
Developer Flow
Developer logs in → Receives unique API key → Creates new bot → Personality & RAG auto-configured → Assigns multi-bot tasks → Monitors bots via real-time logs → Deploy additional bots easily
Difference for Developers:

API key powers bot personality without manual coding
Can orchestrate multiple bots with minimal effort
Direct access to PDF/Image processing and augmentation features
Architecture
Frontend: React 18 + WebSocket chat + inline citations + file upload
Backend: Node.js/Express + WebSocket server + SQLite3 database
AI Containers: Dockerized AI instances per bot

Optimizations:

Symlinked node_modules → ~1–2 MB per bot
Exponential backoff → handles API rate limits
Multi-API support for redundancy
Flow Diagram:

Frontend → Backend API → AI Container → RAG System → Web Search → Response  
  ↓           ↓            ↓            ↓           ↓  
React      Express.js    botLogic.js   rag.js     Google CSE  
  ↓           ↓            ↓            ↓           ↓  
State     Middleware    AI Processing  Vector DB  Real-time
Technical Highlights
Real-time AI responses (<2 sec)
Multi-bot support (50+ live, 1000+ in Phase 2)
Low storage per bot (symlink optimization)
Inline citations & smart augmentation
Domain-aware responses
PDF/Image ingestion & processing
API key powers bot features fully for developers
Deployment & Optimization
Fully live prototype
Low-cost implementation using Render + free-tier cloud APIs
Scalable storage using symlinks
Optimized for speed, reliability, and minimal resource consumption
Future Vision
Multi-bot collaboration & team workflows
Advanced augmentation strategies
GitHub integration for dev workflows
Analytics & performance tracking
Enterprise & productivity expansion
Team Contributions
manavgt54– Team Lead, Core Development, Architecture & Optimization, 
VAIBHAV WAGHALKAR– Assisted with testing, UI design, and some core devlopment
THANUSHREE-23(GITHUB)– Supported workflow, demo prep, and documentation,UI DESING
VANI412(GITHUB)– Assisted with presentation, project visuals, and flow diagrams,ui desings and implementations.

