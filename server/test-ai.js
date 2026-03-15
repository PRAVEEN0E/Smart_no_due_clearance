require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testAI() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Using API Key:", apiKey ? "Present" : "Missing");
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing from environment");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        console.log("AI Response:", text);
        require('fs').writeFileSync('test-ai-results.txt', "SUCCESS: " + text);
    } catch (e) {
        console.error("AI Test Failed!");
        const errorMsg = e.message + (e.stack ? "\n" + e.stack : "");
        require('fs').writeFileSync('test-ai-results.txt', "FAILED: " + errorMsg);
    }
}

testAI();
