const axios = require('axios');

async function bootstrap() {
    try {
        console.log("🚀 Attempting to bootstrap the Mentor Admin account...");
        const response = await axios.post('http://localhost:3000/api/auth/bootstrap');
        console.log("✅ Success!", response.data);
        console.log("\n--- ADMIN CREDENTIALS ---");
        console.log("Email: admin@college.edu");
        console.log("Password: Admin@123");
        console.log("--------------------------");
    } catch (error) {
        if (error.response) {
            console.log("ℹ️ Info:", error.response.data.message);
        } else {
            console.error("❌ Error connecting to server. Is the backend running on port 3000?");
        }
    }
}

bootstrap();
