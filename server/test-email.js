
require("dotenv").config();

const { sendEmail } = require("./src/utils/emailService");

async function main() {
  try {
    const info = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "FoodGuard Email Test",
      text: "FoodGuard Gmail SMTP is working!",
      html: "<h2>FoodGuard</h2><p>Gmail email delivery is working!</p>",
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Email test failed:", error.message);
  }
}

main();
