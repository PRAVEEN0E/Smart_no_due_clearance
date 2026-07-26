const nodemailer = require('nodemailer');
const axios = require('axios');

// ============================================================
// STRATEGY 1: EmailJS HTTP API (works on Render, Vercel, etc.)
// Uses HTTPS (port 443) — never blocked by hosting providers.
// Setup: https://www.emailjs.com
//   1. Create free account at emailjs.com
//   2. Add Gmail as an email service
//   3. Create a template with these variables:
//        Subject: {{subject}}
//        To Email: {{to_email}}
//        Content:  {{{html_content}}}
//   4. Set env vars: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
//      EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY
// ============================================================
async function sendViaEmailJS(to, subject, html) {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey) return null;

    const toAddress = Array.isArray(to) ? to.join(', ') : to;

    try {
        const payload = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
                to_email: toAddress,
                subject: subject,
                html_content: html
            }
        };

        // Add private key for server-side auth (if provided)
        if (privateKey) {
            payload.accessToken = privateKey;
        }

        const response = await axios.post(
            'https://api.emailjs.com/api/v1.0/email/send',
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            }
        );

        return { messageId: `emailjs-${Date.now()}`, status: response.status };
    } catch (error) {
        const errMsg = error.response?.data || error.message;
        const status = error.response?.status;
        if (status === 412) {
            console.error('❌ EmailJS Error 412: Gmail OAuth token expired. Go to https://dashboard.emailjs.com/admin/services and click "Reconnect Account".');
        } else {
            console.error('❌ EmailJS API Error:', errMsg);
        }
        return null;
    }
}

// ============================================================
// STRATEGY 2: Nodemailer/Gmail SMTP (local dev fallback)
// Will NOT work on Render free tier (SMTP ports blocked).
// ============================================================
let transporter = null;

function createTransporter() {
    if (transporter) return transporter;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;

    transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        family: 4,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 45000,
        dnsTimeout: 15000,
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    });

    return transporter;
}

// ============================================================
// MAIN: sendEmail — tries EmailJS first, then Gmail SMTP fallback
// ============================================================
async function sendEmail(to, subject, html, attachments = []) {
    const actualTo = process.env.DEV_EMAIL_OVERRIDE || to;

    // Add override notice if in development mode
    let finalHtml = html;
    if (process.env.DEV_EMAIL_OVERRIDE && process.env.DEV_EMAIL_OVERRIDE !== to) {
        finalHtml = `
            <div style="background-color:#fff3cd; color:#856404; padding:10px; margin-bottom:20px; border:1px solid #ffeeba; border-radius:5px;">
                <b>Development Mode Override:</b> This email was originally intended for <b>${Array.isArray(to) ? to.join(', ') : to}</b>
            </div>
            ${html}
        `;
    }

    // --- Try EmailJS HTTP API first (works on cloud hosts) ---
    const emailjsResult = await sendViaEmailJS(actualTo, subject, finalHtml);
    if (emailjsResult) return emailjsResult;

    // --- Fallback: Gmail SMTP (App Password — never expires) ---
    const smtp = createTransporter();
    if (smtp) {
        try {
            const mailOptions = {
                from: `"InstiSync" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
                to: actualTo,
                subject: subject,
                html: finalHtml,
                attachments: attachments
                    .map(att => ({ filename: att.filename, path: att.path, content: att.content }))
                    .filter(a => a.path || a.content)
            };
            const info = await smtp.sendMail(mailOptions);
            return info;
        } catch (error) {
            console.error('❌ Nodemailer SMTP Error:', error.message);
        }
    }

    // --- Both failed ---
    console.warn('⚠️ Email could not be sent. Check EmailJS connection and EMAIL_USER/EMAIL_PASS in .env');
    return null;
}

/**
 * Template for Hall Ticket Unlock
 */
async function sendHallTicketUnlockedEmail(userEmail, userName, ticketUrl) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const path = require('path');
    const fs = require('fs');

    let attachments = [];
    if (ticketUrl && ticketUrl.startsWith('/uploads/')) {
        const absolutePath = path.resolve(__dirname, '..', ticketUrl.replace(/^\//, ''));
        if (fs.existsSync(absolutePath)) {
            attachments.push({
                filename: 'HallTicket.pdf',
                path: absolutePath
            });
        }
    }

    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #10b981;">🎫 Hall Ticket Unlocked!</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your No-Due verification is complete. Your Semester Hall Ticket has been successfully unlocked. We have attached a copy to this email for your convenience.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/student/dashboard" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
        <p style="font-size: 12px; color: #666;">Note: You can also download it directly from your student dashboard at any time.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">This is an automated notification from City Institute of Technology.</p>
    </div>
    `;
    return sendEmail(userEmail, '🎫 Your Semester Hall Ticket is Ready', html, attachments);
}

/**
 * Template for Marks Update
 */
async function sendMarksUpdateEmail(userEmail, userName, subjectName) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #3b82f6;">📊 Academic Update</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your internal assessment marks for <b>${subjectName}</b> have been updated in the portal.</p>
        <p>Please log in to your dashboard to review your CAT scores and internal components.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/student/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Marks</a>
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
async function sendWelcomeEmail(userEmail, userName, setupToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const setupUrl = `${frontendUrl}/setup-password?token=${setupToken}&email=${encodeURIComponent(userEmail)}`;
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #15803d;">🎓 Welcome to InstiSync</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your institutional account has been created by your academic mentor. You can now access the Digital No-Due and Internal Marks portal.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #374151;"><b>Portal Link:</b> ${frontendUrl}</p>
            <p style="margin: 10px 0 0 0; color: #374151;"><b>Username:</b> ${userEmail}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">To activate your account, please set up your password using the link below. This link will expire in 24 hours.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #15803d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Up Password</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Academic Transparency Platform</p>
    </div>
    `;
    return sendEmail(userEmail, '🎓 Set Up Your Institutional Account Password', html);
}

/**
 * Template for Fee Update / Addition
 */
async function sendFeeUpdateEmail(userEmail, userName, amount) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ef4444;">💰 Fee Due Notification</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>A new fee balance of <b>₹${amount}</b> has been added to your account by your mentor.</p>
        <p style="color: #6b7280; font-size: 14px;">Please clear your dues as soon as possible to ensure your No-Due process is not delayed.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/student/dashboard" style="background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync Notifications</p>
    </div>
    `;
    return sendEmail(userEmail, '⚠️ New Fee Added to Your Account', html);
}

/**
 * Template for Global Announcements
 */
async function sendAnnouncementEmail(emails, title, content, priority) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const highlightColor = priority === 3 ? '#ef4444' : '#f59e0b';
    
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: ${highlightColor};">📢 Important Announcement</h2>
        <h3 style="margin-bottom: 5px;">${title}</h3>
        <p style="white-space: pre-wrap;">${content}</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}" style="background-color: ${highlightColor}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Digital College Notice Board</p>
    </div>
    `;

    const emailList = Array.isArray(emails) ? emails : [emails];
    return Promise.allSettled(emailList.map(email => sendEmail(email, `📢 ${title}`, html)));
}

/**
 * Template for Subject Clearance/Approval
 */
async function sendSubjectApprovedEmail(userEmail, userName, subjectName) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #10b981;">✅ Subject Marks Approved</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your internal marks for subject <b>${subjectName}</b> have been officially approved by the staff.</p>
        <p>You are one step closer to unlocking your Hall Ticket.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/student/dashboard" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Progress</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Digital Academic Management</p>
    </div>
    `;
    return sendEmail(userEmail, `✅ Subject Approved: ${subjectName}`, html);
}

module.exports = {
    sendEmail,
    sendHallTicketUnlockedEmail,
    sendMarksUpdateEmail,
    sendWelcomeEmail,
    sendFeeUpdateEmail,
    sendAnnouncementEmail,
    sendSubjectApprovedEmail
};
