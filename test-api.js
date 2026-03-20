const { OpenAI } = require("openai");

const client1 = new OpenAI({
  apiKey: process.env.GPT_OSS_API_KEY || "YOUR_KEY_HERE",
  baseURL: "https://integrate.api.nvidia.com/v1"
});

const client2 = new OpenAI({
  apiKey: process.env.GEMMA_API_KEY || "YOUR_KEY_HERE",
  baseURL: "https://integrate.api.nvidia.com/v1"
});

async function run() {
  try {
    console.log("Testing gpt-oss-120b...");
    const res1 = await client1.chat.completions.create({
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: "hello" }]
    });
    console.log("Success 1:", res1.choices[0].message.content);
  } catch(e) {
    console.log("Error 1:", e.message);
  }

  try {
    console.log("Testing gemma...");
    const res2 = await client2.chat.completions.create({
      model: "google/gemma-3-4b-it",
      messages: [{ role: "user", content: "hello" }]
    });
    console.log("Success 2:", res2.choices[0].message.content);
  } catch(e) {
    console.log("Error 2:", e.message);
  }
}

run();
