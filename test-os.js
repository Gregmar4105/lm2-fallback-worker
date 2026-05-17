const ONESIGNAL_APP_ID = '3a65a187-1237-4d54-b760-2bfd94b50a6c';
const ONESIGNAL_REST_API = 'os_v2_app_hjs2dbysg5gvjn3afp6zjniknq45ehs3ehbe2r4qfzl72zib7dzpcnmamze3ftt44fo3bni62dh3d4iziu6rw5efj3kh5n4f4diviky';

async function test() {
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: 'push',
    included_segments: ['Subscribed Users'], // or 'Total Subscriptions'
    headings: { en: "Test" },
    contents: { en: "Test" }
  };

  const pushResponse = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${ONESIGNAL_REST_API}`
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", pushResponse.status);
  console.log("Response:", await pushResponse.text());
}

test();
