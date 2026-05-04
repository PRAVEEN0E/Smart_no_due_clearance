const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// Initialize Resend with API key from environment
const resend = (process.env.RESEND_API_KEY) ? new Resend(process.env.RESEND_API_KEY) : null;

// Setup Nodemailer for Gmail fallback
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    service: process.env.EMAIL_SERVICE === 'gmail' ? 'gmail' : undefined,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Add timeouts to prevent hanging the server
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 10000,
    debug: false,
    logger: false
});

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

    // --- STRATEGY: Try Resend first if available (HTTP based, more reliable on Render) ---
    if (resend && process.env.RESEND_API_KEY) {
        try {
            const payload = {
                from: process.env.EMAIL_FROM || 'InstiSync Notifications <onboarding@resend.dev>',
                to: actualTo,
                subject,
                html: finalHtml,
            };

            if (attachments && attachments.length > 0) {
                const fs = require('fs');
                payload.attachments = attachments.map(att => {
                    if (att.content) {
                        return { filename: att.filename, content: att.content };
                    }
                    if (att.path && fs.existsSync(att.path)) {
                        return {
                            filename: att.filename,
                            content: fs.readFileSync(att.path)
                        };
                    }
                    return null;
                }).filter(Boolean);
            }

            const data = await resend.emails.send(payload);
            if (!data.error) {
                console.log(`📧 Resend sent to ${to}: ${data.data.id}`);
                return data.data;
            }
            console.error('⚠️ Resend failed, falling back to Nodemailer:', data.error);
        } catch (err) {
            console.error('❌ Resend Exception:', err.message);
        }
    }

    // --- STRATEGY 2: Fallback to Nodemailer (Gmail) ---
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: actualTo,
                subject: subject,
                html: finalHtml,
                attachments: attachments.map(att => ({
                    filename: att.filename,
                    path: att.path,
                    content: att.content
                })).filter(a => a.path || a.content)
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`📧 Nodemailer sent to ${to}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('❌ Nodemailer/Gmail Dispatch Error:', error.message);
            return null;
        }
    }

    console.error('❌ No email provider configured or all failed.');
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
async function sendWelcomeEmail(userEmail, userName, password) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #15803d;">🎓 Welcome to InstiSync</h2>
        <p>Dear <b>${userName}</b>,</p>
        <p>Your institutional account has been created by your academic mentor. You can now access the Digital No-Due and Internal Marks portal.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #374151;"><b>Portal Link:</b> ${frontendUrl}</p>
            <p style="margin: 10px 0 0 0; color: #374151;"><b>Username:</b> ${userEmail}</p>
            <p style="margin: 5px 0 0 0; color: #374151;"><b>Temporary Password:</b> <span style="font-family: monospace; background: #eee; padding: 2px 5px;">${password}</span></p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Please change your password after your first login.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" style="background-color: #15803d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #999;">InstiSync | Academic Transparency Platform</p>
    </div>
    `;
    return sendEmail(userEmail, '🎓 Your Institutional Account is Ready', html);
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
    
    // Convert multiple emails into an array for Resend (supports up to 50 recipients at once usually, we map it or send BCC if supported)
    // For simplicity, we loop or use bcc. With resend, you can pass array to `bcc` or `to`.
    // We will just return a promise.all for individual emails or let the caller loop.
    // It's better for the caller to provide arrays, but to keep existing structure, we accept array of emails and send them as BCC.
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
    // If it's single email or multiple
    return sendEmail(emails, `📢 ${title}`, html); 
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

