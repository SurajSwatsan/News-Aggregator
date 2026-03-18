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
}
