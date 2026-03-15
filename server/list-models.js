require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        // The SDK doesn't have a direct listModels export usually in the basic set, 
        // but we can try to find if it works.
        // Failing that, we'll just try a few known model strings.

        console.log("Testing known models...");
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`Model ${m} works!`);
                require('fs').appendFileSync('model-test.txt', `SUCCESS: ${m}\n`);
                return; // Stop if one works
            } catch (e) {
                console.log(`Model ${m} failed: ${e.message}`);
                require('fs').appendFileSync('model-test.txt', `FAILED: ${m} - ${e.message}\n`);
            }
        }
    } catch (e) {
        console.error("General failure:", e.message);
    }
}

listModels();
