require('dotenv').config();
const { predictStudentSuccess } = require('./services/aiService');

async function testPrediction() {
    const mockData = {
        attendancePercent: 85,
        cat1: 40, cat2: 38, cat3: 42,
        assignment1: 9, assignment2: 8, assignment3: 10, assignment4: 8, assignment5: 9,
        activity1: 9, activity2: 10
    };

    console.log("Testing Success Prediction...");
    try {
        const result = await predictStudentSuccess(mockData, "Computer Science");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test Script Error:", e.message);
    }
}

testPrediction();
