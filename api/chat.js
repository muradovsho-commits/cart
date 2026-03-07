export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set.' });

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const webSearchTool = { name: 'web_search', type: 'web_search_20250305' };

  const body = { ...req.body };

  // Inject today's date into the system prompt
  const dateNote = `\n\nToday's date is ${today}. You have access to web search — use it to find current real-time prices, availability, and deals before responding. Always search before giving price estimates.`;
  if (body.system) {
    body.system = body.system + dateNote;
  } else {
    body.system = dateNote;
  }

  // Add web search tool
  body.tools = Array.isArray(body.tools) ? [...body.tools, webSearchTool] : [webSearchTool];

  try {
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
