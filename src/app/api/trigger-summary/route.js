export async function GET(req) {
  const authHeader = req.headers.get("authorization");

  // ✅ Secure authorization check
  if (authHeader !== `Bearer ${process.env.INTERNAL_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    // ✅ Trigger the Netlify function
    const response = await fetch(`${process.env.URL}/.netlify/functions/dailySummary`, {
      method: "GET",
    });

    // ✅ Handle both JSON and plain-text responses gracefully
    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text }; // fallback if not JSON
    }

    // ✅ Return the formatted response
    return new Response(JSON.stringify({ ok: true, data }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
