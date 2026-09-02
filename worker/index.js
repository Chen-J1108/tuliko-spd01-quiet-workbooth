export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const pathname = new URL(request.url).pathname.toLowerCase();
    const hlsContentType = pathname.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : pathname.endsWith(".ts")
        ? "video/mp2t"
        : null;

    if (response.status !== 404 && hlsContentType) {
      const headers = new Headers(response.headers);
      headers.set("content-type", hlsContentType);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
