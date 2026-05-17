import html from '../dist/index.html';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // Create a new request object to forward to the origin
      const originRequest = new Request(request.url, request);

      // Attempt to fetch from the origin (which will be lm2bicycletrading.larable.dev based on route)
      const response = await fetch(originRequest);

      // Cloudflare 1xxx errors (like 1033) usually result in 530 status code.
      // 502 or 504 could also indicate the origin/tunnel is unreachable.
      if (response.status === 530 || response.status === 502 || response.status === 504) {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          status: 503, // Return 503 Service Unavailable to let clients know it's a fallback page
        });
      }

      // If the origin responded successfully (or with other errors like 404, 500 from the app itself),
      // return the response transparently.
      return response;
    } catch (e) {
      // If fetch fails entirely (e.g. network error when reaching origin)
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 503,
      });
    }
  },
};
