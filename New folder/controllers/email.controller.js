import { transporter } from "../config/mailer.js";
import { generateOTP } from "../utils/otp.js";
import {db} from "../database/db.js";

export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.query(
      `INSERT INTO email_verifications (email, otp, expires_at)
       VALUES (?, ?, ?)`,
      [email, otp, expiry]
    );

    await transporter.sendMail({
      from: `"Face Event System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [rows] = await db.query(
      `SELECT * FROM email_verifications
       WHERE email=? AND otp=? AND verified=FALSE
       AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP"
      });
    }

    await db.query(
      `UPDATE email_verifications
       SET verified=TRUE
       WHERE id=?`,
      [rows[0].id]
    );

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
