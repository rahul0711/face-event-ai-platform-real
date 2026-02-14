import { db } from "../database/db.js";
import { searchFaces } from "../services/awsRekognition.service.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../services/awsS3.service.js";

export const searchBySelfieandEmail = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    const { email } = req.body;
    const selfie = req.file;

    if (!email || !selfie) {
      return res.status(400).json({ error: "Email and selfie required" });
    }

    /* 🔐 Check email verification */
    const [verified] = await db.query(
      `SELECT 1 FROM email_verifications
       WHERE email=? AND verified=TRUE
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (!verified.length) {
      return res.status(403).json({
        error: "Email not verified. Please verify OTP first."
      });
    }

    /* ✅ Get Event Collection */
    const [eventRows] = await db.query(
      "SELECT collection_id FROM events WHERE event_id=?",
      [event_id]
    );

    if (!eventRows.length) {
      return res.status(404).json({ error: "Event not found" });
    }

    const collectionId = eventRows[0].collection_id;

    /* ✅ Create user request */
    const [requestResult] = await db.query(
      `INSERT INTO user_requests (email, event_id)
       VALUES (?, ?)`,
      [email, event_id]
    );

    const requestId = requestResult.insertId;

    /* 🔍 Face Search */
    const result = await searchFaces(collectionId, selfie.buffer);

    if (!result.FaceMatches?.length) {
      await db.query(
        `UPDATE user_requests SET request_status='FAILED'
         WHERE request_id=?`,
        [requestId]
      );

      return res.json({ images: [] });
    }

    const faceIds = result.FaceMatches.map(f => f.Face.FaceId);

    /* 🖼️ Get matched images */
    const [images] = await db.query(
      `SELECT DISTINCT ei.image_id, ei.image_url
       FROM faces f
       JOIN event_images ei ON ei.image_id=f.image_id
       WHERE f.face_id IN (?)`,
      [faceIds]
    );

    /* 🔐 Generate signed download URLs */
    const signedImages = await Promise.all(
      images.map(async (img) => {
        // Extract S3 key from full URL
        const key = img.image_url.split(".amazonaws.com/")[1];

       const command = new GetObjectCommand({
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: key,
  ResponseContentDisposition: "attachment",
  ResponseContentType: "image/jpeg"
});


        const signedUrl = await getSignedUrl(s3, command, {
          expiresIn: 900 // 1 minute
        });

        return {
          image_id: img.image_id,
          downloadUrl: signedUrl
        };
      })
    );

    await db.query(
      `UPDATE user_requests SET request_status='COMPLETED'
       WHERE request_id=?`,
      [requestId]
    );

    /* ✅ Final response */
    res.json({
      images: signedImages
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
