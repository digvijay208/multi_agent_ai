# FusionAI - Fusion of AI Models

<<<<<<< HEAD
A collaborative AI system where **GPT-oss**, **Gemma**, and **Flux** work together to provide the best possible answers.
=======
A collaborative AI system where **GPT-OSS-120B** and **Gemma 3-4B-IT** work together with **real-time streaming** to provide the best possible answers.

## ✨ Latest Features (v2.0)

- ⚡ **Real-time Streaming** - See responses as they're generated (like ChatGPT)
- 🤖 **Individual Agent Views** - Expand to see each agent's contribution
- 🛡️ **Smart Error Handling** - Retry logic + graceful degradation
- 🔄 **Response Regeneration** - Regenerate any response instantly
- 🎨 **Enhanced UI/UX** - Toast notifications, loading skeletons, keyboard shortcuts
- ⌨️ **Keyboard Shortcuts** - Cmd/Ctrl+K for new chat
- 📋 **Code Copy Button** - One-click copy for code blocks
- 🎭 **Agent Transparency** - See GPT-OSS → Gemma → Final synthesis
>>>>>>> e65d0a6 (feat: Enhanced Light Mode UI, multi-agent persistence, and terminal code blocks)

## Features

- 🤖 **Real AI Collaboration** - Two premium AI models discuss and refine answers
- 💬 **Sequential Discussion** - Each AI builds on previous responses
<<<<<<< HEAD
- 🎨 **Image Generation** - Fluxintegration for creating images
- 💾 **Conversation History** - Remember all your chats
=======
- 🎨 **Image Generation** - Flux.2 integration for creating images
- 💾 **Conversation History** - Remember all your chats (coming soon)
>>>>>>> e65d0a6 (feat: Enhanced Light Mode UI, multi-agent persistence, and terminal code blocks)
- ⚡ **Best Quality** - Synthesized answers from multiple perspectives

## How It Works

<<<<<<< HEAD
1. **GPT-oss** provides initial comprehensive analysis
2. **Gemma** reviews, finds gaps, and adds improvements and synthesizes both into the best final answer
4. **You get** one polished response from true AI collaboration
=======
1. **GPT-OSS-120B** provides initial comprehensive analysis
2. **Gemma 3-4B-IT** reviews, finds gaps, and adds improvements
3. **You get** one polished response from true AI collaboration
4. **Streaming** - Watch the magic happen in real-time!
>>>>>>> e65d0a6 (feat: Enhanced Light Mode UI, multi-agent persistence, and terminal code blocks)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database (Optional - for conversation history)

```bash
npm run setup
```

Or manually:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Configure API Keys

Create/update `.env.local`:

```env
# NVIDIA NIM API Keys (get from https://build.nvidia.com)
GPT_OSS_API_KEY=your_key_here
GEMMA_API_KEY=your_key_here
FLUX_API_KEY=your_key_here

# Database (optional)
DATABASE_URL="file:./dev.db"
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🎯 Usage Tips

<<<<<<< HEAD
1. **User** submits a query
2. **Agent 1 (GPT-oss)** provides initial analysis
3. **Agent 2 (Gemma)** reviews and adds perspective and synthesizes the best final answer
=======
### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Start new conversation
- `Shift + Enter` - New line in message
- `Enter` - Send message

### Features
- Click **"Show Agent Responses"** to see individual agent contributions
- Click **"Regenerate"** to get a new response
- Hover over code blocks to see the **Copy** button
- Watch real-time streaming as agents think and respond
>>>>>>> e65d0a6 (feat: Enhanced Light Mode UI, multi-agent persistence, and terminal code blocks)

## Architecture

```
User Query
    ↓
<<<<<<< HEAD
Agent 1: GPT-oss (Analysis)
    ↓
Agent 2: Gemma (Critical Review and Synthesis)
    ↓
Final Answer
=======
┌─────────────────────────┐
│  Streaming Pipeline     │
├─────────────────────────┤
│ 1. GPT-OSS (Analysis)   │ ← Real-time streaming
│ 2. Gemma (Synthesis)    │ ← Real-time streaming
│ 3. Final Response       │
└─────────────────────────┘
    ↓
Enhanced UI with Toast + Loading States
>>>>>>> e65d0a6 (feat: Enhanced Light Mode UI, multi-agent persistence, and terminal code blocks)
```

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **NVIDIA NIM API** (AI model access)
- **Prisma + SQLite** (Database - optional)
- **React** with hooks and streaming
- **Tailwind CSS** with custom design system
- **Server-Sent Events** (SSE) for streaming

## API Endpoints

### `/api/chat/stream` (New!)
Streaming endpoint with real-time updates
- Uses Server-Sent Events (SSE)
- Returns agent responses as they're generated
- Better UX with instant feedback

### `/api/chat` (Legacy)
Non-streaming endpoint (still works)
- Returns complete response only
- Simpler but slower perceived performance

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup and feature guide

## 🆕 What's New in v2.0

### Backend Improvements
- ✅ Streaming responses with SSE
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ Graceful degradation (fallback to Agent 1 if Agent 2 fails)
- ✅ Better error messages and handling
- ✅ Individual agent response tracking

### Frontend Improvements
- ✅ Real-time streaming UI
- ✅ Toast notifications (success/error/info)
- ✅ Loading skeletons and smooth animations
- ✅ Expandable agent response cards
- ✅ Regenerate button on each response
- ✅ Code block copy buttons
- ✅ Keyboard shortcuts (Cmd/Ctrl+K)
- ✅ Professional design system

### Coming Soon
- 💾 Conversation persistence (database ready!)
- 🔍 Search conversations
- 📤 Export conversations (Markdown/PDF)
- 🔗 Share conversations (public links)
- 👤 User authentication
- 📊 Usage analytics

## Cost

- **Free** with NVIDIA NIM (check their limits)
- No monthly subscription required
- Pay-per-use model

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Troubleshooting

### Streaming not working?
- Check browser console for errors
- Verify API keys in `.env.local`
- Try the legacy endpoint first: `/api/chat`

### Database errors?
- Run `npm run prisma:generate`
- Run `npm run prisma:migrate`
- Check `DATABASE_URL` in `.env.local`

### API errors?
- Verify API keys are correct
- Check NVIDIA NIM API status
- Review rate limits

## Performance

- **Streaming**: Perceived 3x faster response time
- **Error Handling**: 3 automatic retries with backoff
- **Fallback**: Always returns best available response
- **Optimized**: Production build with tree-shaking

## Contributing

Contributions welcome! Feel free to open an issue or submit a pull request.

## License

MIT
