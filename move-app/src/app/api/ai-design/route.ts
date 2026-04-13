import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomType, prompt, photos } = await req.json();

    // Build image content blocks
    const imageBlocks: Anthropic.ImageBlockParam[] = (photos ?? [])
      .slice(0, 3)
      .map((p: { data: string; mediaType: string }) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: (p.mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp',
          data: p.data,
        },
      }));

    const systemPrompt = `You are an expert interior designer with deep knowledge of Japanese apartments and living spaces.
You specialize in practical, budget-friendly design solutions for people moving to Japan.
You know Japanese recycle shops well (Hard Off, Eco Ring, Book Off, Second Street) and suggest affordable second-hand options.
Always respond with valid JSON matching the schema exactly.`;

    const userPrompt = `Analyze this ${roomType} and create a practical room design plan for someone moving to Japan.
${prompt ? `Their preferences: ${prompt}` : ''}

Respond ONLY with valid JSON (no markdown, no explanation) matching this exact schema:
{
  "summary": "2-3 sentence overview of the design approach",
  "layout": "Detailed layout recommendation — where to place furniture, how to maximize the space",
  "colorScheme": "Recommended color palette and why it works for this space",
  "furniture": [
    {
      "item": "Item name",
      "description": "Why it works, dimensions if relevant",
      "whereToBuy": "Specific shop recommendation (Hard Off / Eco Ring / IKEA Japan / Nitori / etc.)",
      "estimatedPrice": "¥X,000〜¥XX,000"
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4"]
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    });

    const textContent = response.content.find((b) => b.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Clean and parse JSON
    let raw = textContent.text.trim();
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const result = JSON.parse(raw);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('AI Design API error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
