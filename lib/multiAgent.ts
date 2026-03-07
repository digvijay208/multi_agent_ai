import Bytez from 'bytez.js';

const sdk = new Bytez(process.env.BYTEZ_API_KEY!);

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

  // REAL DISCUSSION: Sequential collaboration
  
  // Step 1: GPT-4o provides initial analysis
  console.log('Step 1: GPT-4o analyzing...');
  const gpt4Result = await sdk.model('openai/gpt-4o').run([
    { role: 'system', content: 'You are Agent 1 (GPT-4o). Provide a comprehensive analysis and solution to the user query. Be thorough but concise.' },
    { role: 'user', content: userQuery }
  ]);

  if (gpt4Result.error) throw new Error('GPT-4o error: ' + gpt4Result.error);
  const gpt4Response = typeof gpt4Result.output === 'string' 
    ? gpt4Result.output 
    : (gpt4Result.output?.content || JSON.stringify(gpt4Result.output));

  // Step 2: Claude READS GPT's response and adds critical insights
  console.log('Step 2: Claude reviewing GPT\'s response...');
  const claudeResult = await sdk.model('anthropic/claude-sonnet-4-6').run([
    { role: 'system', content: 'You are Agent 2 (Claude Sonnet 4-6). Agent 1 (GPT-4o) has provided an initial response. Your job is to: 1) Identify what GPT did well, 2) Find gaps or missing information, 3) Add alternative perspectives or improvements, 4) Provide a refined answer that builds on GPT\'s response.' },
    { role: 'user', content: `User Query: "${userQuery}"\n\n=== Agent 1 (GPT-4o) Response ===\n${gpt4Response}\n\n=== Your Task ===\nReview GPT-4o's response and provide your critical analysis and improvements.` }
  ]);

  if (claudeResult.error) throw new Error('Claude error: ' + claudeResult.error);
  const claudeResponse = typeof claudeResult.output === 'string' 
    ? claudeResult.output 
    : (claudeResult.output?.content || JSON.stringify(claudeResult.output));

  // Step 3: Gemini READS both and synthesizes the BEST FINAL ANSWER
  console.log('Step 3: Gemini synthesizing final answer...');
  const geminiResult = await sdk.model('google/gemini-2.5-pro').run([
    { role: 'system', content: 'You are Agent 3 (Gemini 2.5 Pro), the final synthesizer. You have access to responses from GPT-4o and Claude. Your job is to combine the best insights from both agents and provide ONE clear, comprehensive, and actionable final answer. Do not mention the other agents - just provide the best possible answer to the user.' },
    { role: 'user', content: `User Query: "${userQuery}"\n\n=== Agent 1 (GPT-4o) Response ===\n${gpt4Response}\n\n=== Agent 2 (Claude) Review & Improvements ===\n${claudeResponse}\n\n=== Your Task ===\nSynthesize the BEST FINAL ANSWER by combining insights from both agents. Provide a complete, polished response.` }
  ]);

  if (geminiResult.error) throw new Error('Gemini error: ' + geminiResult.error);
  const geminiResponse = typeof geminiResult.output === 'string' 
    ? geminiResult.output 
    : (geminiResult.output?.content || JSON.stringify(geminiResult.output));

  // Return only the final synthesized answer
  return [{
    agent: 'FusionAI (Collaborative Solution)',
    model: 'GPT-4o → Claude → Gemini',
    response: geminiResponse,
    timestamp: Date.now()
  }];
}

async function generateImage(prompt: string): Promise<AgentResponse[]> {
  try {
    // Use DALL-E 3 for image generation
    const imageModel = sdk.model('openai/dall-e-3');
    const result = await imageModel.run(prompt);
    
    if (result.error) {
      throw new Error('Image generation failed: ' + result.error);
    }
    
    // Extract image URL from output
    let imageUrl = '';
    let imageData = '';
    
    if (typeof result.output === 'string') {
      // If output is a URL
      if (result.output.startsWith('http')) {
        imageUrl = result.output;
      } else {
        imageData = result.output;
      }
    } else if (result.output?.url) {
      imageUrl = result.output.url;
    } else if (result.output?.data) {
      imageData = result.output.data;
    }

    let responseText = '';
    if (imageUrl) {
      responseText = `Image generated successfully!\n\n![Generated Image](${imageUrl})`;
    } else if (imageData) {
      responseText = `Image generated successfully!\n\n![Generated Image](data:image/png;base64,${imageData})`;
    } else {
      responseText = `Image generated but format is unexpected. Output: ${JSON.stringify(result.output)}`;
    }

    return [{
      agent: 'Image Generator (DALL-E 3)',
      model: 'dall-e-3',
      response: responseText,
      timestamp: Date.now()
    }];
  } catch (error: any) {
    return [{
      agent: 'Multi-Agent AI',
      model: 'GPT-4o + Claude + Gemini',
      response: `Image generation is not available or failed. Error: ${error.message}\n\nI can help you with text-based responses instead. What would you like to know?`,
      timestamp: Date.now()
    }];
  }
}
