export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("LINE Bot is running");
    }

    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!signature || !env.LINE_CHANNEL_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.LINE_CHANNEL_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(signature), c => c.charCodeAt(0)),
      encoder.encode(body)
    );

    if (!valid) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = JSON.parse(body);

    for (const event of data.events ?? []) {
      if (event.source?.groupId) {
        console.log("GROUP_ID:", event.source.groupId);
      }
    }

    return new Response("OK");
  }
};
