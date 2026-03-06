export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set in Vercel Environment Variables.' });

  try {
    const body = { ...req.body };

    // Enable web search for analyze and overpay calls (not image identification)
    const isImageCall = body.messages?.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.type === 'image')
    );
    const isShortChatCall = body.max_tokens <= 350;

    if (!isImageCall && !isShortChatCall) {
      body.tools = [
        {
          type: "web_search_20250305",
          name: "web_search"
        }
      ];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reach Anthropic API' });
  }
}
