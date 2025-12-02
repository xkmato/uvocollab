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
export async function sendCollaborationAcceptedEmail(
  buyerEmail: string,
  buyerName: string,
  legendName: string,
  serviceTitle: string,
  price: number
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
 * Send contract signed notification emails
 */
export async function sendContractSignedEmails(
  buyerEmail: string,
  buyerName: string,
  legendEmail: string,
  legendName: string,
  serviceTitle: string,
  collaborationId: string
): Promise<void> {
  const hubUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/collaboration/${collaborationId}`;
  
  // Email to Buyer
  const buyerSubject = '✅ Contract Signed - Collaboration Begins!';
  const buyerText = `
Hello ${buyerName},

Excellent news! Both parties have signed the collaboration contract.

Your collaboration with ${legendName} for "${serviceTitle}" is now officially in progress!

What's Next:
- Access your private Collaboration Hub to communicate with ${legendName}
- Track project milestones and progress
- Receive and download deliverables when complete
- Mark the project as complete once you're satisfied

Access Your Collaboration Hub:
${hubUrl}

The funds are securely held in escrow and will be released to ${legendName} once you mark the project as complete.

Let's make something amazing!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com
`;

  const buyerHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .milestone { background-color: #D1FAE5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
    .next-steps { background-color: #EEF2FF; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
    <h1>✅ Contract Signed!</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${buyerName}</strong>,</p>
    
    <div class="milestone">
      <h3>🎉 Excellent News!</h3>
      <p>Both parties have signed the collaboration contract.</p>
      <p>Your collaboration with <strong>${legendName}</strong> for "<strong>${serviceTitle}</strong>" is now officially in progress!</p>
    </div>
    
    <div class="next-steps">
      <h3>What's Next:</h3>
      <ul>
        <li>Access your private Collaboration Hub to communicate with ${legendName}</li>
        <li>Track project milestones and progress</li>
        <li>Receive and download deliverables when complete</li>
        <li>Mark the project as complete once you're satisfied</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${hubUrl}" class="cta-button">Access Collaboration Hub</a>
    </p>
    
    <p>The funds are securely held in escrow and will be released to ${legendName} once you mark the project as complete.</p>
    
    <p><strong>Let's make something amazing!</strong></p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  // Email to Legend
  const legendSubject = '✅ Contract Signed - Time to Create!';
  const legendText = `
Hello ${legendName},

Great news! Both parties have signed the collaboration contract.

You can now begin work on your collaboration with ${buyerName} for "${serviceTitle}"!

What's Next:
- Access your private Collaboration Hub to communicate with ${buyerName}
- Review the project requirements and creative vision
- Upload deliverables through the hub when complete
- Receive payment once ${buyerName} marks the project as complete

Access Your Collaboration Hub:
${hubUrl}

The payment has been secured in escrow and will be released to your connected bank account once ${buyerName} confirms completion.

Let's create something incredible!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com
`;

  const legendHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .milestone { background-color: #D1FAE5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
    .next-steps { background-color: #EEF2FF; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
    <h1>✅ Contract Signed!</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${legendName}</strong>,</p>
    
    <div class="milestone">
      <h3>🎉 Great News!</h3>
      <p>Both parties have signed the collaboration contract.</p>
      <p>You can now begin work on your collaboration with <strong>${buyerName}</strong> for "<strong>${serviceTitle}</strong>"!</p>
    </div>
    
    <div class="next-steps">
      <h3>What's Next:</h3>
      <ul>
        <li>Access your private Collaboration Hub to communicate with ${buyerName}</li>
        <li>Review the project requirements and creative vision</li>
        <li>Upload deliverables through the hub when complete</li>
        <li>Receive payment once ${buyerName} marks the project as complete</li>
      </ul>
    </div>
    
    <p style="text-align: center;">
      <a href="${hubUrl}" class="cta-button">Access Collaboration Hub</a>
    </p>
    
    <p>The payment has been secured in escrow and will be released to your connected bank account once ${buyerName} confirms completion.</p>
    
    <p><strong>Let's create something incredible!</strong></p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

  // Send emails to both parties
  await Promise.all([
    sendEmail({ to: buyerEmail, subject: buyerSubject, text: buyerText, html: buyerHtml }),
    sendEmail({ to: legendEmail, subject: legendSubject, text: legendText, html: legendHtml }),
  ]);
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
  const subject = `🎉 Great News! ${legendName} Accepted Your Pitch!`;
  
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/collaboration/${collaborationId}`;
  
  const text = `
Hello ${buyerName},

Exciting news! ${legendName} has accepted your pitch for "${serviceTitle}"!

Next Steps:
1. Complete your payment of $${price}
2. Review and sign the collaboration contract
3. Start working with ${legendName} in your private Collaboration Hub

Your payment will be held securely in escrow until the project is complete.

Complete Payment and Sign Contract:
${paymentUrl}

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
    .highlight { background-color: #D1FAE5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
    .next-steps { background-color: #EEF2FF; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
    <h1>🎉 Pitch Accepted!</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${buyerName}</strong>,</p>
    
    <div class="highlight">
      <h3>Exciting News!</h3>
      <p><strong>${legendName}</strong> has accepted your pitch for "<strong>${serviceTitle}</strong>"!</p>
    </div>
    
    <div class="next-steps">
      <h3>Next Steps:</h3>
      <ol>
        <li>Complete your payment of <strong>$${price}</strong></li>
        <li>Review and sign the collaboration contract</li>
        <li>Start working with ${legendName} in your private Collaboration Hub</li>
      </ol>
    </div>
    
    <p>Your payment will be held securely in escrow until the project is complete.</p>
    
    <p style="text-align: center;">
      <a href="${paymentUrl}" class="cta-button">Complete Payment &amp; Sign Contract</a>
    </p>
    
    <p>We're excited to see what you and ${legendName} create together!</p>
    
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

/**
 * Send podcast approval email
 */
export async function sendPodcastApprovalEmail(
  recipientEmail: string,
  podcastTitle: string
): Promise<void> {
  const subject = `🎉 Your podcast "${podcastTitle}" has been approved`;
  const text = `Hello,

Great news! Your podcast "${podcastTitle}" has been approved and is now visible on UvoCollab's marketplace.

You can now manage your podcast listing and create collaboration services via your dashboard.

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;
  const html = `<p>Hello,</p>
<p>Great news! Your podcast <strong>${podcastTitle}</strong> has been approved and is now visible on UvoCollab's marketplace.</p>
<p>You can now manage your podcast listing and create collaboration services via your dashboard.</p>
<p>Best regards,<br>The UvoCollab Team</p>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send podcast decline email
 */
export async function sendPodcastDeclineEmail(
  recipientEmail: string,
  podcastTitle: string,
  reason?: string
): Promise<void> {
  const subject = `Update on your podcast submission: "${podcastTitle}"`;
  const text = `Hello,

Thank you for submitting your podcast "${podcastTitle}" to UvoCollab. After a review, we couldn't approve the podcast at this time.${reason ? `\n\nFeedback: ${reason}` : ''}

You may revise your submission and reapply.

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;
  const html = `<p>Hello,</p>
<p>Thank you for submitting your podcast <strong>${podcastTitle}</strong> to UvoCollab.</p>
${reason ? `<div style="background:#FEF3C7;padding:10px;border-left:4px solid #F59E0B;">${reason}</div>` : ''}
<p>You may revise your submission and reapply.</p>
<p>Best regards,<br>The UvoCollab Team</p>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send guest invitation email
 */
export async function sendGuestInvitationEmail(
  recipientEmail: string,
  recipientName: string,
  podcastName: string,
  podcastOwnerName: string,
  offeredAmount: number,
  message: string,
  topics: string[],
  inviteLink: string,
  expiresAt: Date
): Promise<void> {
  const subject = `🎙️ You're invited to be a guest on "${podcastName}"`;
  
  const paymentInfo = offeredAmount > 0 
    ? `\n\n💰 Offered Amount: $${offeredAmount}` 
    : '\n\n✨ This is a free collaboration opportunity';
  
  const topicsText = topics.length > 0 
    ? `\n\n📋 Proposed Topics:\n${topics.map(t => `  • ${t}`).join('\n')}` 
    : '';
  
  const expiryDate = expiresAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const text = `Hi ${recipientName},

Great news! ${podcastOwnerName} from "${podcastName}" would like to invite you to be a guest on their podcast.${paymentInfo}${topicsText}

Personal Message:
"${message}"

To accept this invitation and get started, click the link below:
${inviteLink}

This invitation expires on ${expiryDate}.

If you're not already a member of UvoCollab, you'll be guided through a quick signup process where you can create your guest profile and start collaborating with podcasters.

Looking forward to seeing you on the platform!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const paymentHtml = offeredAmount > 0 
    ? `<div style="background:#D1FAE5;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>💰 Offered Amount:</strong> $${offeredAmount}
       </div>` 
    : `<div style="background:#DBEAFE;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>✨ This is a free collaboration opportunity</strong>
       </div>`;
  
  const topicsHtml = topics.length > 0 
    ? `<div style="margin:20px 0;">
         <strong>📋 Proposed Topics:</strong>
         <ul>${topics.map(t => `<li>${t}</li>`).join('')}</ul>
       </div>` 
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .message-box { background: #F9FAFB; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; font-style: italic; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
    .expiry { color: #DC2626; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎙️ Podcast Guest Invitation</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p>Great news! <strong>${podcastOwnerName}</strong> from <strong>"${podcastName}"</strong> would like to invite you to be a guest on their podcast.</p>
    
    ${paymentHtml}
    ${topicsHtml}
    
    <div class="message-box">
      <strong>Personal Message from ${podcastOwnerName}:</strong><br><br>
      "${message}"
    </div>
    
    <div style="text-align: center;">
      <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
    </div>
    
    <p class="expiry">⏰ This invitation expires on ${expiryDate}</p>
    
    <p>If you're not already a member of UvoCollab, you'll be guided through a quick signup process where you can create your guest profile and start collaborating with podcasters.</p>
    
    <p>Looking forward to seeing you on the platform!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send match notification email
 */
export async function sendMatchNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  matchedName: string,
  matchedType: 'guest' | 'podcast',
  recipientOffer: number,
  matchedOffer: number,
  topics: string[],
  matchLink: string
): Promise<void> {
  const isGuestRecipient = matchedType === 'podcast';
  const subject = `🎉 You've matched with ${matchedName}!`;
  
  const paymentDetails = recipientOffer === 0 && matchedOffer === 0
    ? 'This is a free collaboration opportunity'
    : isGuestRecipient
      ? `You offered $${recipientOffer} • ${matchedName} is willing to pay $${matchedOffer}`
      : `${matchedName} offered $${matchedOffer} • You're willing to pay $${recipientOffer}`;
  
  const topicsText = topics.length > 0 
    ? `\n\n📋 Shared Topics of Interest:\n${topics.map(t => `  • ${t}`).join('\n')}` 
    : '';

  const text = `Hi ${recipientName},

Exciting news! You've been matched with ${matchedName} on UvoCollab!

Both of you have expressed interest in collaborating, and this match indicates strong potential for a great partnership.

💰 Payment Details:
${paymentDetails}${topicsText}

What's Next?
Click the link below to view your match details and start a collaboration:
${matchLink}

In the collaboration hub, you can:
• Discuss and finalize terms
• Propose recording schedules
• Share preparation materials
• Coordinate all collaboration details

Don't miss this opportunity to create something amazing together!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const paymentHtml = recipientOffer === 0 && matchedOffer === 0
    ? `<div style="background:#DBEAFE;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>✨ This is a free collaboration opportunity</strong>
       </div>`
    : `<div style="background:#D1FAE5;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>💰 Payment Details:</strong><br>
         ${isGuestRecipient 
           ? `You offered <strong>$${recipientOffer}</strong> • ${matchedName} is willing to pay <strong>$${matchedOffer}</strong>`
           : `${matchedName} offered <strong>$${matchedOffer}</strong> • You're willing to pay <strong>$${recipientOffer}</strong>`
         }
       </div>`;
  
  const topicsHtml = topics.length > 0 
    ? `<div style="margin:20px 0;">
         <strong>📋 Shared Topics of Interest:</strong>
         <ul>${topics.map(t => `<li>${t}</li>`).join('')}</ul>
       </div>` 
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .highlight-box { background: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .next-steps { background: #EEF2FF; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 It's a Match!</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p>Exciting news! You've been matched with <strong>${matchedName}</strong> on UvoCollab!</p>
    
    <p>Both of you have expressed interest in collaborating, and this match indicates strong potential for a great partnership.</p>
    
    ${paymentHtml}
    ${topicsHtml}
    
    <div class="next-steps">
      <strong>What's Next?</strong>
      <p>In the collaboration hub, you can:</p>
      <ul>
        <li>Discuss and finalize terms</li>
        <li>Propose recording schedules</li>
        <li>Share preparation materials</li>
        <li>Coordinate all collaboration details</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="${matchLink}" class="cta-button">View Match & Start Collaboration</a>
    </div>
    
    <p>Don't miss this opportunity to create something amazing together!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send collaboration proposal email
 */
export async function sendCollaborationProposalEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  senderType: 'guest' | 'podcast',
  proposedPrice: number,
  proposedTopics: string[],
  proposedDates: string[],
  message: string,
  collaborationLink: string
): Promise<void> {
  const subject = `🎙️ ${senderName} sent you a collaboration proposal`;
  
  const paymentText = proposedPrice === 0
    ? '\n\n💰 This is a free collaboration opportunity'
    : senderType === 'guest'
      ? `\n\n💰 Guest Fee: $${proposedPrice} (guest pays podcast)`
      : `\n\n💰 Guest Fee: $${proposedPrice} (podcast pays guest)`;
  
  const topicsText = proposedTopics.length > 0 
    ? `\n\n📋 Proposed Topics:\n${proposedTopics.map(t => `  • ${t}`).join('\n')}` 
    : '';
  
  const datesText = proposedDates.length > 0
    ? `\n\n📅 Proposed Recording Dates:\n${proposedDates.map(d => `  • ${d}`).join('\n')}`
    : '';

  const text = `Hi ${recipientName},

${senderName} has sent you a collaboration proposal for a guest appearance!${paymentText}${topicsText}${datesText}

Personal Message:
"${message}"

To review and respond to this proposal, click the link below:
${collaborationLink}

You can accept the proposal, suggest changes, or start a conversation to finalize the details.

Looking forward to your response!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const paymentHtml = proposedPrice === 0
    ? `<div style="background:#DBEAFE;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>✨ This is a free collaboration opportunity</strong>
       </div>`
    : `<div style="background:#D1FAE5;padding:15px;border-radius:5px;margin:20px 0;">
         <strong>💰 Guest Fee:</strong> $${proposedPrice}<br>
         <small>${senderType === 'guest' ? '(guest pays podcast)' : '(podcast pays guest)'}</small>
       </div>`;
  
  const topicsHtml = proposedTopics.length > 0 
    ? `<div style="margin:20px 0;">
         <strong>📋 Proposed Topics:</strong>
         <ul>${proposedTopics.map(t => `<li>${t}</li>`).join('')}</ul>
       </div>` 
    : '';
  
  const datesHtml = proposedDates.length > 0
    ? `<div style="margin:20px 0;">
         <strong>📅 Proposed Recording Dates:</strong>
         <ul>${proposedDates.map(d => `<li>${d}</li>`).join('')}</ul>
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .message-box { background: #F9FAFB; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0; font-style: italic; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎙️ Collaboration Proposal</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p><strong>${senderName}</strong> has sent you a collaboration proposal for a guest appearance!</p>
    
    ${paymentHtml}
    ${topicsHtml}
    ${datesHtml}
    
    <div class="message-box">
      <strong>Personal Message from ${senderName}:</strong><br><br>
      "${message}"
    </div>
    
    <div style="text-align: center;">
      <a href="${collaborationLink}" class="cta-button">Review Proposal</a>
    </div>
    
    <p>You can accept the proposal, suggest changes, or start a conversation to finalize the details.</p>
    
    <p>Looking forward to your response!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send recording reminder email
 */
export async function sendRecordingReminderEmail(
  recipientEmail: string,
  recipientName: string,
  otherPartyName: string,
  recordingDate: string,
  recordingTime: string,
  timezone: string,
  duration: string,
  recordingUrl: string,
  prepNotes: string,
  topics: string[],
  hoursUntilRecording: number
): Promise<void> {
  const urgency = hoursUntilRecording <= 1 ? '⏰ STARTING SOON' : '📅 UPCOMING';
  const subject = `${urgency}: Recording with ${otherPartyName}`;
  
  const topicsText = topics.length > 0 
    ? `\n\n📋 Topics:\n${topics.map(t => `  • ${t}`).join('\n')}` 
    : '';
  
  const prepNotesText = prepNotes 
    ? `\n\nPreparation Notes:\n${prepNotes}` 
    : '';

  const text = `Hi ${recipientName},

${hoursUntilRecording <= 1 
  ? `Your recording with ${otherPartyName} is starting in ${hoursUntilRecording} hour(s)!` 
  : `This is a reminder about your upcoming recording with ${otherPartyName}.`
}

📅 Recording Details:
• Date: ${recordingDate}
• Time: ${recordingTime} ${timezone}
• Duration: ${duration}${topicsText}${prepNotesText}

🎙️ Join Recording:
${recordingUrl}

Make sure you're in a quiet environment with good internet connection. Test your audio and video equipment before joining.

Good luck with the recording!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const topicsHtml = topics.length > 0 
    ? `<div style="margin:20px 0;">
         <strong>📋 Topics:</strong>
         <ul>${topics.map(t => `<li>${t}</li>`).join('')}</ul>
       </div>` 
    : '';
  
  const prepNotesHtml = prepNotes
    ? `<div style="background:#FEF3C7;padding:15px;border-radius:5px;margin:20px 0;border-left:4px solid #F59E0B;">
         <strong>Preparation Notes:</strong><br><br>
         ${prepNotes.replace(/\n/g, '<br>')}
       </div>`
    : '';

  const urgencyColor = hoursUntilRecording <= 1 ? '#DC2626' : '#667eea';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, ${urgencyColor} 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .details-box { background: #F3F4F6; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .checklist { background: #EEF2FF; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${hoursUntilRecording <= 1 ? '⏰ Recording Starting Soon!' : '📅 Recording Reminder'}</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p>${hoursUntilRecording <= 1 
      ? `Your recording with <strong>${otherPartyName}</strong> is starting in <strong>${hoursUntilRecording} hour(s)</strong>!` 
      : `This is a reminder about your upcoming recording with <strong>${otherPartyName}</strong>.`
    }</p>
    
    <div class="details-box">
      <strong>📅 Recording Details:</strong>
      <ul style="margin:10px 0;padding-left:20px;">
        <li><strong>Date:</strong> ${recordingDate}</li>
        <li><strong>Time:</strong> ${recordingTime} ${timezone}</li>
        <li><strong>Duration:</strong> ${duration}</li>
      </ul>
    </div>
    
    ${topicsHtml}
    ${prepNotesHtml}
    
    <div style="text-align: center;">
      <a href="${recordingUrl}" class="cta-button">🎙️ Join Recording</a>
    </div>
    
    <div class="checklist">
      <strong>✅ Pre-Recording Checklist:</strong>
      <ul style="margin:10px 0;padding-left:20px;">
        <li>Find a quiet environment</li>
        <li>Test your audio and video equipment</li>
        <li>Check your internet connection</li>
        <li>Have water nearby</li>
        <li>Review the discussion topics</li>
      </ul>
    </div>
    
    <p>Good luck with the recording!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send episode release notification email
 */
export async function sendEpisodeReleaseEmail(
  recipientEmail: string,
  recipientName: string,
  podcastName: string,
  episodeTitle: string,
  episodeUrl: string,
  releaseDate: string,
  paymentReleased: boolean,
  paymentAmount?: number
): Promise<void> {
  const subject = `🎉 Your episode on "${podcastName}" is live!`;
  
  const paymentText = paymentReleased && paymentAmount
    ? `\n\n💰 Payment Released:\nYour payment of $${paymentAmount} has been released from escrow and will be transferred to your account shortly.`
    : '';

  const text = `Hi ${recipientName},

Great news! Your guest appearance on "${podcastName}" has been released!

📻 Episode Details:
• Title: ${episodeTitle}
• Release Date: ${releaseDate}
• Listen: ${episodeUrl}${paymentText}

Share It With Your Audience:
Now is a great time to share this episode with your followers! Here are some ideas:
• Post on your social media channels
• Add it to your "Previous Appearances" on your UvoCollab profile
• Include it in your newsletter
• Share in relevant communities

Thank you for being part of the UvoCollab community. We hope this collaboration was a success and leads to more opportunities!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const paymentHtml = paymentReleased && paymentAmount
    ? `<div style="background:#D1FAE5;padding:20px;border-radius:5px;margin:20px 0;border-left:4px solid #10B981;">
         <strong>💰 Payment Released:</strong><br><br>
         Your payment of <strong>$${paymentAmount}</strong> has been released from escrow and will be transferred to your account shortly.
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .episode-box { background: #F3F4F6; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #EC4899; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .share-section { background: #EEF2FF; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Your Episode is Live!</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p>Great news! Your guest appearance on <strong>"${podcastName}"</strong> has been released!</p>
    
    <div class="episode-box">
      <strong>📻 Episode Details:</strong>
      <ul style="margin:10px 0;padding-left:20px;">
        <li><strong>Title:</strong> ${episodeTitle}</li>
        <li><strong>Release Date:</strong> ${releaseDate}</li>
      </ul>
    </div>
    
    ${paymentHtml}
    
    <div style="text-align: center;">
      <a href="${episodeUrl}" class="cta-button">🎧 Listen to Episode</a>
    </div>
    
    <div class="share-section">
      <strong>📢 Share It With Your Audience:</strong>
      <p>Now is a great time to share this episode with your followers! Here are some ideas:</p>
      <ul style="margin:10px 0;padding-left:20px;">
        <li>Post on your social media channels</li>
        <li>Add it to your "Previous Appearances" on your UvoCollab profile</li>
        <li>Include it in your newsletter</li>
        <li>Share in relevant communities</li>
      </ul>
    </div>
    
    <p>Thank you for being part of the UvoCollab community. We hope this collaboration was a success and leads to more opportunities!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send guest verification approval email
 */
export async function sendGuestVerificationApprovalEmail(
  recipientEmail: string,
  recipientName: string,
  verificationBenefits: string[]
): Promise<void> {
  const subject = '✅ Your Guest Profile Has Been Verified!';
  
  const benefitsText = verificationBenefits.length > 0
    ? `\n\nAs a verified guest, you now enjoy:\n${verificationBenefits.map(b => `  • ${b}`).join('\n')}`
    : '';

  const text = `Hi ${recipientName},

Congratulations! Your guest profile on UvoCollab has been verified.

Your profile will now display a verification badge, helping you stand out to podcast hosts and increasing your credibility on the platform.${benefitsText}

What This Means:
• Enhanced visibility in guest discovery
• Verified badge on your profile
• Priority consideration for collaborations
• Increased trust from podcast hosts

Keep your profile updated with your latest appearances and expertise to maximize your opportunities!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const benefitsHtml = verificationBenefits.length > 0
    ? `<div style="margin:20px 0;">
         <strong>✨ As a verified guest, you now enjoy:</strong>
         <ul>${verificationBenefits.map(b => `<li>${b}</li>`).join('')}</ul>
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .badge { display: inline-block; background: #10B981; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
    .benefits-box { background: #D1FAE5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10B981; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Profile Verified!</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p><strong>Congratulations!</strong> Your guest profile on UvoCollab has been verified.</p>
    
    <div style="text-align: center;">
      <span class="badge">✓ VERIFIED GUEST</span>
    </div>
    
    <p>Your profile will now display a verification badge, helping you stand out to podcast hosts and increasing your credibility on the platform.</p>
    
    ${benefitsHtml}
    
    <div class="benefits-box">
      <strong>What This Means:</strong>
      <ul style="margin:10px 0;padding-left:20px;">
        <li>Enhanced visibility in guest discovery</li>
        <li>Verified badge on your profile</li>
        <li>Priority consideration for collaborations</li>
        <li>Increased trust from podcast hosts</li>
      </ul>
    </div>
    
    <p>Keep your profile updated with your latest appearances and expertise to maximize your opportunities!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}

/**
 * Send guest verification decline email
 */
export async function sendGuestVerificationDeclineEmail(
  recipientEmail: string,
  recipientName: string,
  reason: string,
  improvementSuggestions: string[]
): Promise<void> {
  const subject = 'UvoCollab Guest Verification Update';
  
  const suggestionsText = improvementSuggestions.length > 0
    ? `\n\nTo improve your chances of verification:\n${improvementSuggestions.map(s => `  • ${s}`).join('\n')}`
    : '';

  const text = `Hi ${recipientName},

Thank you for requesting verification for your guest profile on UvoCollab.

After careful review, we are unable to verify your profile at this time.

Reason:
${reason}${suggestionsText}

What You Can Do:
You can still use UvoCollab as a guest and apply for collaborations. Once you've addressed the feedback above, you're welcome to request verification again.

We appreciate your interest in becoming a verified guest and look forward to seeing your profile grow!

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com`;

  const suggestionsHtml = improvementSuggestions.length > 0
    ? `<div style="background:#EEF2FF;padding:20px;border-radius:5px;margin:20px 0;border-left:4px solid #667eea;">
         <strong>To improve your chances of verification:</strong>
         <ul>${improvementSuggestions.map(s => `<li>${s}</li>`).join('')}</ul>
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 30px 20px; background: #ffffff; }
    .reason-box { background: #FEF3C7; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #F59E0B; }
    .next-steps { background: #F3F4F6; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Verification Update</h1>
  </div>
  <div class="content">
    <p>Hi ${recipientName},</p>
    <p>Thank you for requesting verification for your guest profile on UvoCollab.</p>
    
    <p>After careful review, we are unable to verify your profile at this time.</p>
    
    <div class="reason-box">
      <strong>Reason:</strong><br><br>
      ${reason}
    </div>
    
    ${suggestionsHtml}
    
    <div class="next-steps">
      <strong>What You Can Do:</strong>
      <p>You can still use UvoCollab as a guest and apply for collaborations. Once you've addressed the feedback above, you're welcome to request verification again.</p>
    </div>
    
    <p>We appreciate your interest in becoming a verified guest and look forward to seeing your profile grow!</p>
    
    <p>Best regards,<br><strong>The UvoCollab Team</strong></p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>`;

  await sendEmail({ to: recipientEmail, subject, text, html });
}
