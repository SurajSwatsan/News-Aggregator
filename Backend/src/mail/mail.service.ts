import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const isDev = this.configService.get<string>('SMTP_USER') === 'your-email@gmail.com' || !this.configService.get('SMTP_USER');

    try {
      if (isDev) {
        console.log('--- [DEV MODE] EMAIL LOGGED ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content:', html);
        console.log('-------------------------------');
        return { messageId: 'dev-mock-' + Date.now() };
      }

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
      console.log('--- EMAIL SENT ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Message sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      // In Dev mode, we return success even if transport fails (e.g. invalid host)
      if (isDev) {
        return { messageId: 'dev-fallback-' + Date.now() };
      }
      return null;
    }
  }

  async sendInvitation(email: string, inviteLink: string) {
    const subject = 'Invitation to join Next-Gen News as a Publisher';
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to Next-Gen News!</h2>
        <p>You have been invited by the administrator to join our platform as a Publisher.</p>
        <p>Please click the link below to complete your organizational registration:</p>
        <div style="margin: 20px 0;">
          <a href="${inviteLink}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Registration</a>
        </div>
        <p>This link will expire in 48 hours.</p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">If you did not expect this invitation, please ignore this email.</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendApprovalLink(email: string, orgName: string, approvalLink: string) {
    const subject = 'Next-Gen News: Your application has been approved!';
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Great news, ${orgName}!</h2>
        <p>Your application to join Next-Gen News as a publisher has been approved by our administrators.</p>
        <p>Please click the button below to confirm your acceptance and move to the next step:</p>
        <div style="margin: 20px 0;">
          <a href="${approvalLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirm Approval</a>
        </div>
        <p>After clicking, you will receive a secondary email to set your account password.</p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">Welcome to the aggregator platform!</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendActivation(email: string, orgName: string, activationLink: string) {
    const subject = 'Next-Gen News: Set Your Publisher Account Password';
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Congratulations, ${orgName}!</h2>
        <p>Your application to join Next-Gen News has been approved.</p>
        <p>To finalize your account and access your dashboard, please set your secure password using the link below:</p>
        <div style="margin: 20px 0;">
          <a href="${activationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Set My Password</a>
        </div>
        <p>Once set, you will be able to log in to your dashboard immediately.</p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">Welcome aboard!</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendOtp(email: string, otp: string) {
    const subject = 'Your Next-Gen News Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #ffb822; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Verification Code</h2>
        </div>
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 1.1rem; color: #4a5568;">Your one-time verification code is:</p>
          <div style="display: inline-block; padding: 15px 30px; background-color: #f7fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-size: 2.5rem; font-weight: 800; color: #2d3748; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #718096; font-size: 0.9rem;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 0.8rem; color: #a0aec0; margin: 0;">Next-Gen News Aggregator - Secure Login</p>
        </div>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }
}
