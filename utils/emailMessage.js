const emailMessage = (user, resetUrl) => {
  const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the URL below to reset your password</p>
    <p>This reset link is valid for only 30 minutes.</p>

    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards...</p>
    <p>Pinvent Team</p>
    `;

  const subject = "Password Reset Request";
  const sendTo = user.email;
  const sentFrom = process.env.EMAIL_USER;

  return {
    subject,
    sendTo,
    sentFrom,
    message,
  };
};

export default emailMessage;
