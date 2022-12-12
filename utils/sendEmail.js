import nodemailer from "nodemailer";

const sendEmail = async (subject, message, sendTo, sentFrom, replyTo) => {
  // Create email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER_GMAIL,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Options for sending email
  const options = {
    from: sentFrom,
    to: sendTo,
    replyTo: replyTo,
    subject: subject,
    html: message,
  };

  // Send the email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });
};

export default sendEmail;
