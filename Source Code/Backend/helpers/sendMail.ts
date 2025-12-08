import nodemailer from "nodemailer";

export const sendEmail = (email: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SEND_MAIL_EMAIL,
      pass: process.env.SEND_MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SEND_MAIL_EMAIL,
    to: email,
    subject: subject,
    html: html,
  };

  transporter.sendMail(mailOptions, function (error: string, info: any) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
