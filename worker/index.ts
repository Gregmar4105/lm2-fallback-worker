import html from '../dist/index.html';

interface Env {
  SERVER_STATE: KVNamespace;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_REST_API: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const ONESIGNAL_APP_ID = env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API = env.ONESIGNAL_REST_API;
    
    let isServerUp = false;
    try {
      // We add a random cache buster to ensure Cloudflare doesn't cache the response
      const cacheBuster = Math.random().toString(36).substring(7);
      const response = await fetch(`https://lm2bicycletrading.larable.dev/api/server-status?cb=${cacheBuster}`, {
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache' 
        }
      });
      if (response.ok) {
        isServerUp = true;
      }
    } catch (e) {
      isServerUp = false;
    }

    // Default to 'online' initially so we don't spam a down message immediately if it's already down
    // or if the KV namespace is empty.
    const previousState = await env.SERVER_STATE.get('status') || 'online';
    const currentState = isServerUp ? 'online' : 'offline';

    if (currentState !== previousState) {
      const heading = isServerUp ? "✅ LM2 Server Online" : "⚠️ LM2 Server Offline";
      const message = isServerUp 
        ? "The LM2 system is back online and fully operational." 
        : "The LM2 system is currently offline. We will notify you when it resumes.";
        
      try {
        const payload = {
          app_id: ONESIGNAL_APP_ID,
          target_channel: 'push',
          included_segments: ['Subscribed Users'],
          headings: { en: heading },
          contents: { en: message }
        };

        const pushResponse = await fetch('https://api.onesignal.com/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${ONESIGNAL_REST_API}`
          },
          body: JSON.stringify(payload)
        });
        
        if (pushResponse.ok) {
          await env.SERVER_STATE.put('status', currentState);
        } else {
          console.error("OneSignal push failed:", await pushResponse.text());
        }
      } catch (err) {
        console.error("Push notification error:", err);
      }
    }
  }
};
