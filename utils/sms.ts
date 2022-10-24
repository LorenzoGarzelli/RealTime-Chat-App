import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config({ path: './config.env' });

//@ts-ignore
const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const SMS_VERIFICATION_TEMPLATE = 'Verification code:\n #CODE '; //\nYou can also tap on this link to activate your account:\n #URL';

export class Sms {
  //body: string;
  to: string;

  private otpLength: number;
  private twiloPhoneNumber: string;

  constructor(to: string) {
    //this.body = body;
    this.to = to;
    this.otpLength = +process.env.OTP_LENGTH!;
    this.twiloPhoneNumber = process.env.TWILO_PHONE_NUMBER!;
  }

  private generateOtp() {
    let digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < this.otpLength; i++)
      OTP += digits[Math.floor(Math.random() * 10)];

    return OTP;
  }

  async sendVerificationCode() {
    if (this.to && this.twiloPhoneNumber) {
      const otp = this.generateOtp();

      if (process.env.NODE_ENV === 'production') {
        const body = SMS_VERIFICATION_TEMPLATE.replace('#CODE', otp);
        const message = await client.messages.create({
          body: body,
          to: this.to,
          from: this.twiloPhoneNumber,
        });
      }

      return otp;
    }
  }
}
