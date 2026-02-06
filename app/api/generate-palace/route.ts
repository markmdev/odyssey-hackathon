import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  const { systemPrompt, items } = await req.json();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a memory palace with ${items.length} rooms for these items:\n\n${items.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: response.status });
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return NextResponse.json(JSON.parse(content));
}
