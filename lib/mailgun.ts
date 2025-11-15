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

/**
 * Send pitch accepted email to buyer
 */
export async function sendPitchAcceptedEmail(
  buyerEmail: string,
  buyerName: string,
  legendName: string,
  serviceTitle: string,
  price: number,
  collaborationId: string
): Promise<void> {
  const subject = `🎉 ${legendName} Accepted Your Collaboration Request!`;
  
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/dashboard`;
  
  const text = `
Hello ${buyerName},

Great news! ${legendName} has accepted your collaboration request for "${serviceTitle}"!

Project Details:
- Service: ${serviceTitle}
- Price: $${price}
- Status: Awaiting Payment

Next Steps:
To move forward with this collaboration, you'll need to complete the payment. The funds will be held securely in escrow until you confirm the work is complete.

Visit your dashboard to proceed with payment:
${dashboardUrl}

Once payment is processed, a contract will be generated and sent to both of you for e-signature. After both parties sign, you'll gain access to your private collaboration hub where you can communicate and exchange files.

We're excited to see what you and ${legendName} create together!

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
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .project-details { background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .cta-button { 
      display: inline-block; 
      background-color: #4F46E5; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
      font-weight: bold;
    }
    .next-steps { background-color: #EEF2FF; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Request Accepted!</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${buyerName}</strong>,</p>
    
    <p>Great news! <strong>${legendName}</strong> has accepted your collaboration request!</p>
    
    <div class="project-details">
      <h3>Project Details:</h3>
      <ul>
        <li><strong>Service:</strong> ${serviceTitle}</li>
        <li><strong>Price:</strong> $${price}</li>
        <li><strong>Status:</strong> Awaiting Payment</li>
      </ul>
    </div>
    
    <div class="next-steps">
      <h3>Next Steps:</h3>
      <p>To move forward with this collaboration, you'll need to complete the payment. The funds will be held securely in escrow until you confirm the work is complete.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="cta-button">Proceed with Payment</a>
    </p>
    
    <p>Once payment is processed, a contract will be generated and sent to both of you for e-signature. After both parties sign, you'll gain access to your private collaboration hub where you can communicate and exchange files.</p>
    
    <p>We're excited to see what you and <strong>${legendName}</strong> create together!</p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  await sendEmail({ to: buyerEmail, subject, text, html });
}

/**
 * Send pitch declined email to buyer
 */
export async function sendPitchDeclinedEmail(
  buyerEmail: string,
  buyerName: string,
  legendName: string,
  serviceTitle: string
): Promise<void> {
  const subject = `Update on Your Collaboration Request with ${legendName}`;
  
  const marketplaceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/marketplace`;
  
  const text = `
Hello ${buyerName},

Thank you for your interest in collaborating with ${legendName}.

After reviewing your pitch for "${serviceTitle}", ${legendName} has decided not to move forward with this particular project at this time.

While this specific collaboration won't be happening, we encourage you to:
- Continue exploring other Legends in the marketplace
- Refine your pitch and demo for future requests
- Keep creating and developing your craft

Remember, our Legends receive many requests and have to be selective about which projects they can take on. This decision doesn't reflect on your talent or potential.

Browse other Legends in the marketplace:
${marketplaceUrl}

Keep pushing forward!

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
    .encouragement { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }
    .cta-button { 
      display: inline-block; 
      background-color: #4F46E5; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
      font-weight: bold;
    }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Collaboration Request Update</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${buyerName}</strong>,</p>
    
    <p>Thank you for your interest in collaborating with <strong>${legendName}</strong>.</p>
    
    <p>After reviewing your pitch for "<strong>${serviceTitle}</strong>", ${legendName} has decided not to move forward with this particular project at this time.</p>
    
    <div class="encouragement">
      <h3>Keep Moving Forward!</h3>
      <p>While this specific collaboration won't be happening, we encourage you to:</p>
      <ul>
        <li>Continue exploring other Legends in the marketplace</li>
        <li>Refine your pitch and demo for future requests</li>
        <li>Keep creating and developing your craft</li>
      </ul>
    </div>
    
    <p>Remember, our Legends receive many requests and have to be selective about which projects they can take on. This decision doesn't reflect on your talent or potential.</p>
    
    <p style="text-align: center;">
      <a href="${marketplaceUrl}" class="cta-button">Browse Other Legends</a>
    </p>
    
    <p><strong>Keep pushing forward!</strong></p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  await sendEmail({ to: buyerEmail, subject, text, html });
}
