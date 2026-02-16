import { transporter } from "../config/mailer.js";
import { generateOTP } from "../utils/otp.js";
import {db} from "../database/db.js";
import crypto from "crypto";




export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Expiry time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Invalidate all previous unverified OTPs for this email
    await db.query(
      `UPDATE email_verifications
       SET verified = TRUE
       WHERE email = ? AND verified = FALSE`,
      [email]
    );

    // Insert new OTP
    await db.query(
      `INSERT INTO email_verifications
       (email, otp, verified, expires_at, created_at)
       VALUES (?, ?, FALSE, ?, NOW())`,
      [email, otp, expiresAt]
    );

    // Send email
    await transporter.sendMail({
      from: `"Face Event System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP"
    });
  }
};





export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and OTP are required"
      });
    }

    // Get latest OTP for this email
    const [rows] = await db.query(
      `SELECT * FROM email_verifications
       WHERE email = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        error: "No OTP found for this email"
      });
    }

    const record = rows[0];

    // Already verified
    if (record.verified) {
      return res.json({
        success: true,
        message: "Email already verified"
      });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "OTP has expired"
      });
    }

    // Check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP"
      });
    }

    // Mark as verified
    await db.query(
      `UPDATE email_verifications
       SET verified = TRUE
       WHERE id = ?`,
      [record.id]
    );

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Verification failed"
    });
  }
};


export const checkEmailVerified = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        verified: false,
        message: "Email required"
      });
    }

    /* Check if email was EVER verified */
    const [rows] = await db.query(
      `SELECT id
       FROM email_verifications
       WHERE email = ?
       AND verified = TRUE
       LIMIT 1`,
      [email]
    );

    if (rows.length) {
      return res.json({
        verified: true,
        message: "Email already verified"
      });
    }

    return res.json({
      verified: false,
      message: "OTP required"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
