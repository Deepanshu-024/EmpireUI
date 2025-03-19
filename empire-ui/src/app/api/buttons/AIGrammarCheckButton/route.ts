import { streamText } from "ai";
import { createOpenAI as createGroq } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

const groq = createGroq({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const prompt = await req.text();

    const { textStream } = await streamText({
      model: groq("llama3-8b-8192"),
      system:
        "You are an expert in grammar and style. Provide suggestions for improvements in grammar, spelling, and style. Be short and clear in your suggestions.",
      prompt: prompt,
    });

    return new NextResponse(textStream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
