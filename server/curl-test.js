require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const data = JSON.stringify({
    contents: [{
        parts: [{ text: "Hello" }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
        require('fs').writeFileSync('curl-test.txt', `STATUS: ${res.statusCode}\nBODY: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();
