require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There isn't a simple listModels in the main export of @google/generative-ai 
        // in older versions, but let's check the current one.
        // Actually, listing models usually requires a different client or the REST API.

        // Let's try the REST API directly to LIST models.
        const https = require('https');
        const apiKey = process.env.GEMINI_API_KEY;

        https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log("Models List Response:", data);
                require('fs').writeFileSync('available-models.json', data);
            });
        });
    } catch (e) {
        console.error(e);
    }
}

run();
