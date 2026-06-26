import axios from "axios";
import { logger } from "./logger";

// Use the user-provided DeepSeek API key
export const apiKey = process.env.DEEPSEEK_API_KEY || "";

export const callDeepSeek = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("DeepSeek API key is not configured.");
  }

  try {
    logger.info("Directing AI prompt to DeepSeek API (model: deepseek-chat)...");
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert digital librarian, scholar, and assistant. Strive to generate accurate, highly readable content, and formatting exactly as instructed.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const content = response.data.choices[0]?.message?.content || "";
    return content.trim();
  } catch (error: any) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.error("DeepSeek API call failed: " + errMsg);
    throw new Error("DeepSeek API error: " + errMsg);
  }
};

// Generative AI interface proxy to preserve backend imports and compiler compatibility
export const ai = {
  getGenerativeModel: (options: { model: string }) => {
    return {
      generateContent: async (prompt: string) => {
        const text = await callDeepSeek(prompt);
        return {
          response: {
            text: () => text,
          },
        };
      },
    };
  },
};

export { apiKey as geminiApiKey };
