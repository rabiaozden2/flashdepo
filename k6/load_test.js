import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '10s', target: 50 },  // Ramp up to 50 users
        { duration: '20s', target: 50 },  // Stay at 50 users for 20s
        { duration: '10s', target: 0 },   // Ramp down to 0 users
    ],
};

// In a real scenario, you'd fetch a valid auth token and campaign ID from your environment variables or setup phase.
const TOKEN = __ENV.TOKEN || "YOUR_TEST_TOKEN";
const CAMPAIGN_ID = __ENV.CAMPAIGN_ID || "YOUR_CAMPAIGN_ID";

export default function () {
    const url = 'http://localhost/api/orders';

    const payload = JSON.stringify({
        campaign_id: CAMPAIGN_ID,
        quantity: 1,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`,
        },
    };

    let res = http.post(url, payload, params);

    check(res, {
        'status is 202 or 409 (out of stock)': (r) => r.status === 202 || r.status === 409,
    });

    // Small sleep to simulate user think time
    sleep(1);
}
