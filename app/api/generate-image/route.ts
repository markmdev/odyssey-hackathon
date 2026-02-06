import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
  }

  const { prompt } = await req.json();
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: '16:9',
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
  }

  for (const part of parts) {
    if (part.inlineData) {
      return NextResponse.json({
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      });
    }
  }

  return NextResponse.json({ error: 'No image in response' }, { status: 500 });
}
