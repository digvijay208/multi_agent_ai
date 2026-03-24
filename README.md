# FusionAI - Fusion of AI Models

A collaborative AI system where **GPT-oss**, **Gemma**, and **Flux** work together to provide the best possible answers.

## Features

- 🤖 **Real AI Collaboration** - Three premium AI models discuss and refine answers
- 💬 **Sequential Discussion** - Each AI builds on previous responses
- 🎨 **Image Generation** - Fluxintegration for creating images
- 💾 **Conversation History** - Remember all your chats
- ⚡ **Best Quality** - Synthesized answers from multiple perspectives

## How It Works

1. **GPT-oss** provides initial comprehensive analysis
2. **Gemma** reviews, finds gaps, and adds improvements and synthesizes both into the best final answer
4. **You get** one polished response from true AI collaboration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Bytez API Key

1. Go to https://bytez.com
2. Sign up and get your API key
3. Copy `.env.local` and add your key:

```env
BYTEZ_API_KEY=your_actual_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## How It Works

1. **User** submits a query
2. **Agent 1 (GPT-oss)** provides initial analysis
3. **Agent 2 (Gemma)** reviews and adds perspective and synthesizes the best final answer

## Architecture

```
User Query
    ↓
Agent 1: GPT-oss (Analysis)
    ↓
Agent 2: Gemma (Critical Review and Synthesis)
    ↓
Final Answer
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Bytez SDK** (AI model access)
- **React** (UI)

## Cost

- **Free** with Bytez (check their limits)
- Fallback to other providers if needed

## License

MIT
