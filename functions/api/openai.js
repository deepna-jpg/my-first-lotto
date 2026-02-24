export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" }
  });
}
