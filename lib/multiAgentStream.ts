import { OpenAI } from 'openai';

// Instantiate an OpenAI client but point it to NVIDIA NIM's API
function getNvidiaClient() {
  const apiKey = process.env.GPT_OSS_API_KEY;
  if (!apiKey) throw new Error("GPT_OSS_API_KEY is missing in .env.local");
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });
}

function getGemmaClient() {
  const apiKey = process.env.GEMMA_API_KEY;
  if (!apiKey) throw new Error("GEMMA_API_KEY is missing in .env.local");
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });
}

// Stream event types
export interface StreamEvent {
  type: 'agent_start' | 'content' | 'agent_complete' | 'error' | 'complete';
  agent?: string;
  model?: string;
  content?: string;
  fullResponse?: string;
  message?: string;
  metadata?: any;
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw error; // Authentication errors
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Streams multi-agent discussion with real-time updates
 * Emits events as each agent processes the query
 */
export async function* streamMultiAgentDiscussion(
  userQuery: string
): AsyncGenerator<StreamEvent> {
  // Detect if user wants image generation
  const lowerQuery = userQuery.toLowerCase();
  const imageKeywords = [
    'generate image', 'create image', 'draw', 'generate picture', 'create picture',
    'generate photo', 'create photo', 'make image', 'make picture', 'generate an image',
    'create an image', 'draw an image', 'generate a picture', 'create a picture',
    'shot of', 'cinematic shot', 'photograph of', 'render of', 'rendered', '4k', '8k',
    'illustration of', 'painting of', 'portrait of', 'cinematic'
  ];
  const wantsImage = imageKeywords.some(keyword => lowerQuery.includes(keyword));

  if (wantsImage) {
    console.log('Image generation requested:', userQuery);
    yield* streamImageGeneration(userQuery);
    return;
  }

  let agent1Response = '';
  let agent2Response = '';

  try {
    // ========== AGENT 1: GPT-OSS-120B ==========
    yield {
      type: 'agent_start',
      agent: 'gpt-oss',
      model: 'openai/gpt-oss-120b',
      metadata: { stage: 1, description: 'Initial Analysis' }
    };

    console.log('Agent 1 (gpt-oss-120b) starting...');
    
    const nvidiaClient = getNvidiaClient();
    
    // Try with retry logic
    const agent1Stream = await retryWithBackoff(async () => {
      return await nvidiaClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are Agent 1 (Large Language Model). Provide a comprehensive analysis and solution to the user query. Be thorough but concise.' 
          },
          { role: 'user', content: userQuery }
        ],
        stream: true,
        temperature: 0.7,
      });
    });

    // Stream Agent 1 response
    for await (const chunk of agent1Stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        agent1Response += content;
        yield {
          type: 'content',
          agent: 'gpt-oss',
          content: content
        };
      }
    }

    if (!agent1Response) {
      throw new Error('gpt-oss-120b returned an empty response');
    }

    yield {
      type: 'agent_complete',
      agent: 'gpt-oss',
      fullResponse: agent1Response
    };

    console.log('Agent 1 complete. Response length:', agent1Response.length);

    // ========== AGENT 2: GEMMA-3-4B-IT ==========
    yield {
      type: 'agent_start',
      agent: 'gemma',
      model: 'google/gemma-3-4b-it',
      metadata: { stage: 2, description: 'Synthesis & Refinement' }
    };

    console.log('Agent 2 (gemma-3-4b-it) starting...');

    const gemmaClient = getGemmaClient();

    // Try with retry logic
    const agent2Stream = await retryWithBackoff(async () => {
      return await gemmaClient.chat.completions.create({
        model: 'google/gemma-3-4b-it',
        messages: [
          { 
            role: 'system', 
            content: 'You are Agent 2 (Gemma), the final synthesizer. Agent 1 has provided an initial response. Your job is to improve it, refine it, and provide ONE clear, comprehensive, and actionable final answer directly to the user.' 
          },
          { 
            role: 'user', 
            content: `User Query: "${userQuery}"\n\n=== Agent 1 Response ===\n${agent1Response}\n\n=== Your Task ===\nSynthesize the BEST FINAL ANSWER combining any missing insights. Provide a complete, polished response.` 
          }
        ],
        stream: true,
        temperature: 0.7,
      });
    });

    // Stream Agent 2 response
    for await (const chunk of agent2Stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        agent2Response += content;
        yield {
          type: 'content',
          agent: 'gemma',
          content: content
        };
      }
    }

    if (!agent2Response) {
      // Graceful degradation: if Agent 2 fails, use Agent 1's response
      console.warn('Agent 2 returned empty response, falling back to Agent 1');
      agent2Response = agent1Response;
    }

    yield {
      type: 'agent_complete',
      agent: 'gemma',
      fullResponse: agent2Response
    };

    console.log('Agent 2 complete. Response length:', agent2Response.length);

    // All done!
    yield { type: 'complete' };

  } catch (error: any) {
    console.error('Error in multi-agent discussion:', error);
    
    // Determine error type and provide helpful message
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.status === 401 || error.status === 403) {
      errorMessage = 'Authentication failed. Please check your API keys.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error.status === 500 || error.status === 502 || error.status === 503) {
      errorMessage = 'The AI service is temporarily unavailable. Please try again.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // If we have at least Agent 1's response, return that (graceful degradation)
    if (agent1Response) {
      console.log('Graceful degradation: returning Agent 1 response after error');
      yield {
        type: 'agent_complete',
        agent: 'gpt-oss',
        fullResponse: agent1Response,
        metadata: { fallback: true, originalError: errorMessage }
      };
      yield { 
        type: 'complete',
        metadata: { warning: 'Partial response due to error in second agent' }
      };
    } else {
      // No responses available, yield error
      yield {
        type: 'error',
        message: errorMessage,
        metadata: { originalError: error }
      };
    }
  }
}

/**
 * Streams image generation with progress updates
 */
async function* streamImageGeneration(prompt: string): AsyncGenerator<StreamEvent> {
  try {
    yield {
      type: 'agent_start',
      agent: 'flux',
      model: 'black-forest-labs/flux.2-klein-4b',
      metadata: { stage: 'image_generation', description: 'Generating Image' }
    };

    // The NVIDIA Flux API has a strict 800 character limit for prompts
    const safePrompt = prompt.length > 790 ? prompt.substring(0, 790) + "..." : prompt;

    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
    
    const payload = {
      prompt: safePrompt,
      seed: Math.floor(Math.random() * 100000),
      aspect_ratio: "1:1"
    };

    // Try with retry logic
    const response = await retryWithBackoff(async () => {
      const res = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.FLUX_API_KEY}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`NVIDIA Flux API error: ${res.status} - ${errorText}`);
      }

      return res;
    });

    const data = await response.json();
    console.log("Flux API Response:", JSON.stringify(data).substring(0, 200) + "...");
    
    // NVIDIA API formats can vary
    const artifact = data?.artifacts?.[0];
    
    if (artifact?.finishReason === "CONTENT_FILTERED") {
      throw new Error("Image generation failed: The prompt was rejected by the safety filters. Try rephrasing words like 'shot' or 'pierce'.");
    }

    const base64Image = data.image || data.b64_json || artifact?.base64 || data?.data?.[0]?.b64_json || data?.image_url;
    
    if (!base64Image) {
      throw new Error(`Could not parse base64 image data from API response. Got keys: ${Object.keys(data).join(', ')}`);
    }

    const htmlImageString = `Image generated successfully!\n\n![Generated Image](data:image/jpeg;base64,${base64Image})`;

    yield {
      type: 'agent_complete',
      agent: 'flux',
      fullResponse: htmlImageString
    };

    yield { type: 'complete' };

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    let errorMessage = 'Image generation failed.';
    if (error.message) {
      errorMessage += ` ${error.message}`;
    }
    
    yield {
      type: 'error',
      message: errorMessage,
      metadata: { 
        fallbackMessage: 'I can help you with text-based responses instead. What would you like to know?'
      }
    };
  }
}
