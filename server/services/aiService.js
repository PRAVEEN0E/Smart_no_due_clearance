const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateFeedback(fileUrl, subjectContext) {
    try {
        let fileContent = "";
        try {
            // Basic check to see if we can parse it
            const ext = fileUrl.split('.').pop().toLowerCase();
            if (['txt', 'md', 'csv'].includes(ext) || fileUrl.includes('raw')) {
                const axios = require('axios');
                const response = await axios.get(fileUrl);
                fileContent = String(response.data).substring(0, 3000);
            }
        } catch (e) {
            console.log("Could not parse file from URL directly:", e.message);
            // Binary file (PDF/image) — can't extract text directly, use subject context
        }

        const prompt = `You are an experienced academic evaluator. A student has submitted an assignment for the subject: "${subjectContext}".

${fileContent
                ? `Assignment content excerpt:\n\n${fileContent}\n\n`
                : `The student has uploaded a PDF/image assignment file for "${subjectContext}".\n\n`
            }
Please provide detailed, constructive academic feedback in Markdown format with:
## Strengths
- (What the student likely did well based on the subject)

## Areas for Improvement  
- (Key concepts they should focus on)

## Recommendations
- (Specific study tips or resources for "${subjectContext}")

## Overall Assessment
(A brief qualitative summary — e.g., Good effort, Needs improvement, Excellent work)

Keep the feedback encouraging, specific to "${subjectContext}", and academically appropriate.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || "Feedback unavailable.";
    } catch (error) {
        console.error("Groq AI Feedback Error:", error.message);
        fs.appendFileSync(path.join(__dirname, '../ai-error.log'), `[${new Date().toISOString()}] Feedback Error: ${error.message}\n${error.stack}\n`);
        return `## AI Feedback Unavailable\nFeedback generation failed. Please check your assignment submission and try again.`;
    }
}

async function predictStudentSuccess(studentData, subjectName) {
    try {
        // Calculate effective marks (remedial replaces CAT if present)
        const c1 = (studentData.remedial1 !== undefined && studentData.remedial1 !== null) ? studentData.remedial1 : (studentData.cat1 || 0);
        const c2 = (studentData.remedial2 !== undefined && studentData.remedial2 !== null) ? studentData.remedial2 : (studentData.cat2 || 0);
        const c3 = (studentData.remedial3 !== undefined && studentData.remedial3 !== null) ? studentData.remedial3 : (studentData.cat3 || 0);

        const prompt = `As an academic data analyst, analyze the following student performance data for the subject "${subjectName}" and provide a success prediction.
        
        Data:
        - Attendance: ${studentData.attendancePercent || 0}%
        - Effective CAT Marks (including remedials): ${c1}/50, ${c2}/50, ${c3}/50
        - Assignments: ${studentData.assignment1 || 0}/10, ${studentData.assignment2 || 0}/10, ${studentData.assignment3 || 0}/10, ${studentData.assignment4 || 0}/10, ${studentData.assignment5 || 0}/10
        - Activity Scores: ${studentData.activity1 || 0}/10, ${studentData.activity2 || 0}/10
        
        Please provide a concise analysis in JSON format:
        {
          "successProbability": "High/Medium/Low",
          "riskFactors": ["factor 1", "factor 2"],
          "recommendation": "One sentence advice",
          "predictedFinalGrade": "Estimated grade (S/A/B/C/D/E/F)"
        }`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an academic data analyst that only outputs raw JSON."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0]?.message?.content || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Success Prediction Error:", error.message);
        const logContent = `[${new Date().toISOString()}] Prediction Error: ${error.message}\n${error.stack}\n`;
        fs.appendFileSync(path.join(__dirname, '../ai-error.log'), logContent);
        return {
            successProbability: "Moderate",
            riskFactors: ["Awaiting more data"],
            recommendation: "Maintain consistent performance across all modules.",
            predictedFinalGrade: "B"
        };
    }
}

async function chatWithAI(studentData, message) {
    try {
        const context = `
        You are an expert Academic Advisor focusing on maximizing student Internal Marks (Total 40).
        
        Rules for Internal Marks calculation (Max 40):
        1. CATs: 20 marks (Best 2 out of 3, each out of 50).
        2. Assignments: 10 marks (Total 5, each out of 10).
        3. Activities: 5 marks (Total 2, each out of 10).
        4. Attendance: 5 marks.

        Student's Marks Breakdown:
        ${studentData.map(e => {
            const c1 = (e.remedial1 !== undefined && e.remedial1 !== null) ? e.remedial1 : (e.cat1 || 0);
            const c2 = (e.remedial2 !== undefined && e.remedial2 !== null) ? e.remedial2 : (e.cat2 || 0);
            const c3 = (e.remedial3 !== undefined && e.remedial3 !== null) ? e.remedial3 : (e.cat3 || 0);
            const assignSum = (e.assignment1 || 0) + (e.assignment2 || 0) + (e.assignment3 || 0) + (e.assignment4 || 0) + (e.assignment5 || 0);
            const activitySum = (e.activity1 || 0) + (e.activity2 || 0);
            
            return `
        - Subject: ${e.subject.name}
          * CATs: ${c1}, ${c2}, ${c3} (out of 50)
          * Assignments: ${assignSum}/50
          * Activities: ${activitySum}/20
          * Attendance: ${e.attendancePercent}%
          * Current Total: ${e.internalMarksTotal}/40`;
        }).join('')}

        Student's current message: "${message}"

        Task:
        1. Analyze the components (CAT, Assignment, Activity, Attendance).
        2. Provide a motivating response.
        3. TELL THEM EXACTLY how much they need to improve in pending components to reach a "High Score" (35-40 range). 
        4. If they have failed CATs, remind them about the Remedial option to replace low scores.
        5. Keep it friendly and concise. Use Markdown.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: context,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || "I'm having trouble connecting to my academic brain right now.";
    } catch (error) {
        console.error("AI Chat Error:", error.message);
        return "I'm having trouble connecting to my academic brain right now. Please try again in a moment!";
    }
}

async function generateAcademicInsights(evaluations, enrolledSubjects = []) {
    try {
        const prompt = `
        As an Academic Performance Analyst, generate 3-5 personalized academic insights for a student based on their subject evaluations and enrollment status.
        
        Enrollment List (All subjects the student is taking):
        ${enrolledSubjects.map(es => `- ${es.subject.name} (${es.subject.code})`).join('\n')}

        Active Evaluation Data (Subjects with marks/attendance entered):
        ${evaluations.map(ev => {
            const c1 = (ev.remedial1 !== undefined && ev.remedial1 !== null) ? ev.remedial1 : (ev.cat1 || 0);
            const c2 = (ev.remedial2 !== undefined && ev.remedial2 !== null) ? ev.remedial2 : (ev.cat2 || 0);
            const c3 = (ev.remedial3 !== undefined && ev.remedial3 !== null) ? ev.remedial3 : (ev.cat3 || 0);
            return `
        - ${ev.subject.name}: Attendance ${ev.attendancePercent}%, CAT marks ${c1}, ${c2}, ${c3} out of 50. Assignments missing: ${[ev.assignment1, ev.assignment2, ev.assignment3, ev.assignment4, ev.assignment5].filter(a => a === 0 || a === null).length}. Total internal: ${ev.internalMarksTotal}/40. Staff approved: ${ev.staffApproved ? 'Yes' : 'No'}`;
        }).join('')}

        Requirements:
        1. YOU MUST include an insight for EVERY subject listed in the "Enrollment List" above. IF A SUBJECT HAS NO EVALUATION DATA, you must still include it and mention that no assessment data has been uploaded yet by the staff.
        2. Categorize each insight as 'critical' (attendance < 75%), 'warning' (marks < 25), 'success' (performance > 35), or 'info' (general updates/pending/newly enrolled).
        3. Keep messages concise, professional, and encouraging.
        4. Focus on specific subjects (e.g., Python, C-programming, etc.) mentioned in the enrollment list.
        
        Return a JSON array of objects:
        [
          { "type": "critical|warning|success|info", "subject": "Subject Name", "message": "Detailed personalized message" }
        ]
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an academic analyst that only outputs raw JSON arrays."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        let text = completion.choices[0]?.message?.content || "[]";
        // Robust extraction in case LLM wraps in 'suggestions' key or something
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : (parsed.suggestions || parsed.insights || []);
    } catch (error) {
        console.error("AI Insights Error:", error.message);
        // Fallback to basic logic if AI fails
        return [{
            type: 'info',
            subject: 'General',
            message: 'All your academic records look stable. Keep monitoring your portal for updates from staff.'
        }];
    }
}

async function generateImportantQA(subjectName, syllabusText, studentPerformance) {
    try {
        const prompt = `
        You are an expert academic tutor for the subject: "${subjectName}".
        
        Syllabus Content:
        ${syllabusText || "No syllabus text provided. Please use general knowledge of this subject."}
        
        Student's Current Context:
        ${studentPerformance ? `Attendance: ${studentPerformance.attendancePercent}%, Internal Marks: ${studentPerformance.internalMarksTotal}/40` : "General student query."}
        
        Task:
        Based on the syllabus provided, generate 5 highly important exam questions and their detailed, easy-to-understand answers. 
        Focus on core concepts that are frequently tested. 
        Format the output clearly using Markdown with:
        ### Q1: [Question]
        **Answer:** [Detailed Answer]
        
        (Repeat for all 5 questions)
        
        End with a small encouraging note for the student.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || "Important Q&A currently unavailable for this subject.";
    } catch (error) {
        console.error("Groq AI Q&A Error:", error.message);
        return "I'm having trouble generating study material right now. Please try again later.";
    }
}

module.exports = {
    generateFeedback,
    predictStudentSuccess,
    chatWithAI,
    generateAcademicInsights,
    generateImportantQA
};
