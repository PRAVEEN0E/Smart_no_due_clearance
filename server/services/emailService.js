const nodemailer = require('nodemailer');

// Initialize transporter
// Using common environment variables for flexibility
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
async function sendEmail(to, subject, html, attachments = []) {
    try {
        const mailOptions = {
            from: `"InstiSync Notifications" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Email Error:', error);
        // We don't throw here to prevent breaking the main workflow if email fails
        return null;
    }
}

/**
 * Template for Hall Ticket Unlock
 */
async function sendHallTicketUnlockedEmail(userEmail, userName, ticketUrl) {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #10b981;">🎫 Hall Ticket Unlocked!</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your No-Due verification is complete. Your Semester Hall Ticket has been successfully unlocked and is ready for download.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/student/hall-ticket" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Hall Ticket</a>
        </div>
        <p style="font-size: 12px; color: #666;">Note: You can also download it directly from your student dashboard.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">This is an automated notification from City Institute of Technology.</p>
    </div>
    `;
    return sendEmail(userEmail, '🎫 Your Semester Hall Ticket is Ready', html);
}

/**
 * Template for Marks Update
 */
async function sendMarksUpdateEmail(userEmail, userName, subjectName) {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #3b82f6;">📊 Academic Update</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your internal assessment marks for <b>${subjectName}</b> have been updated in the portal.</p>
        <p>Please log in to your dashboard to review your CAT scores and internal components.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/student/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Marks</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Digital Academic Management</p>
    </div>
    `;
    return sendEmail(userEmail, `📊 Marks Updated: ${subjectName}`, html);
}

/**
 * Template for New Account / Welcome
 */
async function sendWelcomeEmail(userEmail, userName, password) {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #15803d;">🎓 Welcome to InstiSync</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your institutional account has been created by your academic mentor. You can now access the Digital No-Due and Internal Marks portal.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #374151;"><b>Portal Link:</b> http://localhost:5173</p>
            <p style="margin: 10px 0 0 0; color: #374151;"><b>Username:</b> ${userEmail}</p>
            <p style="margin: 5px 0 0 0; color: #374151;"><b>Temporary Password:</b> <span style="font-family: monospace; background: #eee; padding: 2px 5px;">${password}</span></p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Please change your password after your first login.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" style="background-color: #15803d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Academic Transparency Platform</p>
    </div>
    `;
    return sendEmail(userEmail, '🎓 Your Institutional Account is Ready', html);
}

module.exports = {
    sendEmail,
    sendHallTicketUnlockedEmail,
    sendMarksUpdateEmail,
    sendWelcomeEmail
};
