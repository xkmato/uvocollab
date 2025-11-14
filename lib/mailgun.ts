// Mailgun email service configuration and utilities
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

// Initialize Mailgun client
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`;

export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email using Mailgun
 */
export async function sendEmail(data: EmailData): Promise<void> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Mailgun configuration missing. Email not sent.');
    console.log('Would have sent email:', data);
    return;
  }

  try {
    const messageData = {
      from: FROM_EMAIL,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html || data.text.replace(/\n/g, '<br>'),
    };

    await mg.messages.create(MAILGUN_DOMAIN, messageData);
    console.log(`Email sent successfully to ${data.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send application approval email
 */
export async function sendApprovalEmail(
  recipientEmail: string,
  artistName: string,
  managementEmail?: string
): Promise<void> {
  const subject = '🎉 Your UvoCollab Legend Application Has Been Approved!';
  
  const text = `
Congratulations ${artistName}!

We're thrilled to inform you that your application to become a Legend on UvoCollab has been approved!

You now have access to the Legend Dashboard where you can:
- Set up your public profile
- Create and manage your service offerings
- Connect your bank account for payouts
- Start collaborating with emerging artists

Next Steps:
1. Log in to your UvoCollab account
2. Complete your Legend profile
3. Add your services and set your rates
4. Connect your Stripe account for payouts

Welcome to the UvoCollab family! We're excited to see the incredible collaborations you'll create.

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .next-steps { background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Application Approved!</h1>
  </div>
  <div class="content">
    <p>Congratulations <strong>${artistName}</strong>!</p>
    
    <p>We're thrilled to inform you that your application to become a <strong>Legend</strong> on UvoCollab has been approved!</p>
    
    <p>You now have access to the Legend Dashboard where you can:</p>
    <ul>
      <li>Set up your public profile</li>
      <li>Create and manage your service offerings</li>
      <li>Connect your bank account for payouts</li>
      <li>Start collaborating with emerging artists</li>
    </ul>
    
    <div class="next-steps">
      <h3>Next Steps:</h3>
      <ol>
        <li>Log in to your UvoCollab account</li>
        <li>Complete your Legend profile</li>
        <li>Add your services and set your rates</li>
        <li>Connect your Stripe account for payouts</li>
      </ol>
    </div>
    
    <p>Welcome to the UvoCollab family! We're excited to see the incredible collaborations you'll create.</p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  // Send to both applicant and management if management email is provided
  await sendEmail({ to: recipientEmail, subject, text, html });
  
  if (managementEmail && managementEmail !== recipientEmail) {
    await sendEmail({ 
      to: managementEmail, 
      subject: `${artistName}'s UvoCollab Legend Application Approved`, 
      text: `Hello,\n\nWe're reaching out to inform you that ${artistName}'s application to become a Legend on UvoCollab has been approved.\n\n${text}`,
      html 
    });
  }
}

/**
 * Send application decline email
 */
export async function sendDeclineEmail(
  recipientEmail: string,
  artistName: string,
  reason?: string,
  managementEmail?: string
): Promise<void> {
  const subject = 'UvoCollab Legend Application Update';
  
  const text = `
Hello ${artistName},

Thank you for your interest in becoming a Legend on UvoCollab.

After careful review, we are unable to approve your application at this time.

${reason ? `Feedback: ${reason}` : ''}

We appreciate your interest in our platform and encourage you to continue developing your craft. You're welcome to reapply in the future as your career evolves.

If you have any questions or would like more detailed feedback, please don't hesitate to reach out.

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #6B7280; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .feedback { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Application Update</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${artistName}</strong>,</p>
    
    <p>Thank you for your interest in becoming a Legend on UvoCollab.</p>
    
    <p>After careful review, we are unable to approve your application at this time.</p>
    
    ${reason ? `<div class="feedback"><strong>Feedback:</strong><br>${reason}</div>` : ''}
    
    <p>We appreciate your interest in our platform and encourage you to continue developing your craft. You're welcome to reapply in the future as your career evolves.</p>
    
    <p>If you have any questions or would like more detailed feedback, please don't hesitate to reach out.</p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  // Send to both applicant and management if management email is provided
  await sendEmail({ to: recipientEmail, subject, text, html });
  
  if (managementEmail && managementEmail !== recipientEmail) {
    await sendEmail({ 
      to: managementEmail, 
      subject: `${artistName}'s UvoCollab Legend Application Update`, 
      text: `Hello,\n\nWe're reaching out to inform you about ${artistName}'s application to become a Legend on UvoCollab.\n\n${text}`,
      html 
    });
  }
}
