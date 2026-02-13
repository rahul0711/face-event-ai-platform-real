import { db } from "../database/db.js";
import { searchFaces } from "../services/awsRekognition.service.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../services/awsS3.service.js";

export const searchBySelfie = async (req, res) => {
  try {
    const event_id = req.params.eventId;
    const selfie = req.file;

    if (!selfie) {
      return res.status(400).json({ error: "Selfie required" });
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

    /* 🔍 Search Faces */
    const result = await searchFaces(collectionId, selfie.buffer);

    if (!result.FaceMatches?.length) {
      return res.json({ images: [] });
    }

    const faceIds = result.FaceMatches.map(f => f.Face.FaceId);

    /* 🖼️ Fetch Image URLs */
    const [images] = await db.query(
      `SELECT DISTINCT ei.image_id, ei.image_url
       FROM faces f
       JOIN event_images ei ON ei.image_id = f.image_id
       WHERE f.face_id IN (?)`,
      [faceIds]
    );

    /* 🔐 Generate Signed Download URLs */
    const signedImages = await Promise.all(
      images.map(async (img) => {
        // Extract S3 key from stored URL
        const key = img.image_url.split(".amazonaws.com/")[1];

        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });

        const signedUrl = await getSignedUrl(s3, command, {
          expiresIn: 60 // seconds
        });

        return {
          image_id: img.image_id,
          downloadUrl: signedUrl
        };
      })
    );

    /* ✅ Final Response */
    res.json({ images: signedImages });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
