import "dotenv/config";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
    console.warn("WARNING: OPENAI_API_KEY environment variable is not set.");
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});
