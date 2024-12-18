const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');

dotenv.config();

const emailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
  });
};

exports.sendWelcomeEmail = async (email, username) => {
  if (!email || !username) {
    throw new Error('Email and username are required to send a welcome email.');
  }

  try {
    const welcomePath = path.join(__dirname, '../client/welcome.html');
    const welcomeTemplate = fs.readFileSync(welcomePath, 'utf-8');
    const personalizedTemplate = welcomeTemplate.replace('{{username}}', username);

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Welcome to Fedemdelivery!',
      html: personalizedTemplate,
    };

    const transporter = emailTransporter();
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: 'Welcome email sent successfully.' };
  } catch (error) {
    throw new Error('Failed to send the welcome email.');
  }
};

exports.sendResetEmail = async (username, email, resetToken) => {

  try {
    const welcomePath = path.join(__dirname, '../client/emailReset.html');
    const welcomeTemplate = fs.readFileSync(welcomePath, 'utf-8');
    const resetUrl = `${process.env.RESETLINK}/authentication/reset/${resetToken}`;
    const personalizedTemplate = welcomeTemplate.replace('{{username}}', username).replace('{{resetUrl}}', resetUrl);

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Password Reset Request',
      html: personalizedTemplate,

    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
  }
};


exports.sendPaymentEmail = async (username, email, totalPrice, country, weight, shipmentType) => {

  try {
    const welcomePath = path.join(__dirname, '../client/payment.html');
    const welcomeTemplate = fs.readFileSync(welcomePath, 'utf-8');
    const personalizedTemplate = welcomeTemplate.replace('{{username}}', username).replace('{{email}}', email).replace('{{totalPrice}}', totalPrice).replace('{{country}}', country).replace('{{weight}}', weight).replace('{{shipmentType}}', shipmentType);

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: 'Payment details Request',
      html: personalizedTemplate,

    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending payment email:', error);
  }
};

exports.sendTrackingEmail = async (username, email,  trackingId, shipmentDetails) => {

  try {
    const { country, weight, shipmentType } = shipmentDetails;
    const welcomePath = path.join(__dirname, '../client/tracking.html');
    const welcomeTemplate = fs.readFileSync(welcomePath, 'utf-8');
    const personalizedTemplate = welcomeTemplate.replace('{{username}}', username).replace('{{email}}', email).replace('{{trackingId}}', trackingId).replace('{{country}}', country).replace('{{weight}}', weight).replace('{{shipmentType}}', shipmentType);

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your Tracking ID',
      html: personalizedTemplate,

    };

    const transporter = emailTransporter();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending payment email:', error);
  }
};


