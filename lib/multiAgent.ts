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

export interface AgentResponse {
  agent: string;
  model: string;
  response: string;
  timestamp: number;
}

export async function runMultiAgentDiscussion(userQuery: string): Promise<AgentResponse[]> {
  // Detect if user wants image generation
  const lowerQuery = userQuery.toLowerCase();
  const imageKeywords = [
    'generate image', 'create image', 'draw', 'generate picture', 'create picture',
    'generate photo', 'create photo', 'make image', 'make picture', 'generate an image',
    'create an image', 'draw an image', 'generate a picture', 'create a picture'
  ];
  const wantsImage = imageKeywords.some(keyword => lowerQuery.includes(keyword));

  if (wantsImage) {
    console.log('Image generation requested:', userQuery);
    return await generateImage(userQuery);
  }

  // REAL DISCUSSION: Sequential collaboration using NVIDIA Text Models
  const nvidiaClient = getNvidiaClient();
  
  // Step 1: Agent 1 (gpt-oss-120b) provides initial analysis
  console.log('Step 1: gpt-oss-120b analyzing...');
  const agent1Result = await nvidiaClient.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'You are Agent 1 (Large Language Model). Provide a comprehensive analysis and solution to the user query. Be thorough but concise.' },
      { role: 'user', content: userQuery }
    ]
  });

  const agent1Response = agent1Result.choices[0]?.message?.content || '';
  if (!agent1Response) throw new Error('gpt-oss-120b returned an empty response');

  // Step 2: Agent 2 (gemma) READS Agent 1's response and builds on it for the BEST FINAL ANSWER
  console.log("Step 2: gemma-3n-e4b-it synthesizing final answer...");
  
  // Create a separate client specifically for Gemma pointing to Google's NVIDIA endpoint
  const gemmaClient = new OpenAI({
    apiKey: process.env.GEMMA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1"
  });

  const agent2Result = await gemmaClient.chat.completions.create({
    model: 'google/gemma-3-4b-it',
    messages: [
      { role: 'system', content: 'You are Agent 2 (Gemma), the final synthesizer. Agent 1 has provided an initial response. Your job is to improve it, refine it, and provide ONE clear, comprehensive, and actionable final answer directly to the user.' },
      { role: 'user', content: `User Query: "${userQuery}"\n\n=== Agent 1 Response ===\n${agent1Response}\n\n=== Your Task ===\nSynthesize the BEST FINAL ANSWER combining any missing insights. Provide a complete, polished response.` }
    ]
  });

  const finalResponse = agent2Result.choices[0]?.message?.content || '';
  if (!finalResponse) throw new Error('gemma-3n-e4b-it returned an empty response');

  // Return only the final synthesized answer
  return [{
    agent: 'FusionAI (Collaborative Solution)',
    model: 'gpt-oss-120b → gemma-3n-e4b-it',
    response: finalResponse,
    timestamp: Date.now()
  }];
}

async function generateImage(prompt: string): Promise<AgentResponse[]> {
  try {
    const invokeUrl = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b";
    
    // Standard payload for the NVIDIA API endpoint
    const payload = {
      prompt: prompt,
      seed: Math.floor(Math.random() * 100000), // Random seed to get varied results
      aspect_ratio: "1:1"
    };

    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FLUX_API_KEY}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA Flux API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // The NVIDIA endpoint returns base64 image data in the response
    const base64Image = data.image || data.b64_json || data?.artifacts?.[0]?.base64;
    
    if (!base64Image) {
      throw new Error("Could not parse base64 image data from API response.");
    }

    // Render it back in the frontend 
    // Format required for Next.js explicit imagery mapping with base64
    const htmlImageString = `Image generated successfully!\n\n![Generated Image](data:image/jpeg;base64,${base64Image})`;

    return [{
      agent: 'Image Generator (Flux.2)',
      model: 'NVIDIA: flux.2-klein-4b',
      response: htmlImageString,
      timestamp: Date.now()
    }];
  } catch (error: any) {
    return [{
      agent: 'Multi-Agent AI',
      model: 'GPT-4o + Claude + Gemini',
      response: `Image generation failed. Error: ${error.message}\n\nI can help you with text-based responses instead. What would you like to know?`,
      timestamp: Date.now()
    }];
  }
}
