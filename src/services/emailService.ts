import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // SMTP server for Gmail
  port: 587, // TLS port
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // Your email address from environment variables
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Function to send an email notification
export const sendMail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to, // Recipient's email address
    subject, // Subject line
    text, // Plain text body
  };

  try {
    // Sending the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error: unknown) {
    // Improved error handling
    if (error instanceof Error) {
      console.error('Error sending email:', error.message);
    } else {
      console.error('Error sending email:', error);
    }
    throw new Error('Email sending failed');
  }
};
