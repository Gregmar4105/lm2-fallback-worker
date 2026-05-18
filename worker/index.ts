import html from '../dist/index.html';

interface Env {
  SERVER_STATE: KVNamespace;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_REST_API: string;
}

async function runMonitor(env: Env): Promise<string> {
  const ONESIGNAL_APP_ID = (env.ONESIGNAL_APP_ID || '').trim();
  const ONESIGNAL_REST_API = (env.ONESIGNAL_REST_API || '').trim();
  
  let isServerUp = false;
  let debugLog = '';
  try {
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
  } catch (e: any) {
    isServerUp = false;
    debugLog += `Fetch err: ${e.message}. `;
  }

  const previousState = await env.SERVER_STATE.get('status') || 'online';
  const currentState = isServerUp ? 'online' : 'offline';
  
  debugLog += `Prev: ${previousState}, Curr: ${currentState}. `;

  if (currentState !== previousState) {
    const heading = isServerUp ? "✅ LM2 Server Online" : "⚠️ LM2 Server Offline";
    const message = isServerUp 
      ? "The LM2 system is back online and fully operational." 
      : "The LM2 system is currently offline. We will notify you when it resumes.";
      
    try {
      const payload = {
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        included_segments: ['Total Subscriptions'],
        headings: { en: heading },
        contents: { en: message },
        priority: 10,
        android_visibility: 1,
        android_group: 'chat_messages'
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
        debugLog += 'Push OK! KV Updated.';
      } else {
        const errText = await pushResponse.text();
        debugLog += `Push failed (${pushResponse.status}): ${errText}. AppID: ${ONESIGNAL_APP_ID} `;
        await env.SERVER_STATE.put('debug_error', debugLog);
      }
    } catch (err: any) {
      debugLog += `Push exception: ${err.message}. `;
      await env.SERVER_STATE.put('debug_error', debugLog);
    }
  } else {
    debugLog += 'No state change.';
  }
  
  return debugLog;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.url.includes('/api/test-cron')) {
      const log = await runMonitor(env);
      return new Response(log);
    }

    try {
      const originRequest = new Request(request.url, request);
      const response = await fetch(originRequest);
      if (response.status === 530 || response.status === 502 || response.status === 504) {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          status: 503,
        });
      }
      return response;
    } catch (e) {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 503,
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await runMonitor(env);
  }
};
