import { db } from "../database/db.js";
import { uploadToS3 } from "../services/awsS3.service.js";
import { ensureCollectionExists, indexFaces } from "../services/awsRekognition.service.js";
import { addToFaceQueue } from "../queues/faceIndex.queue.js";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { rekognitionClient } from "../config/aws.config.js";
import { s3Client } from "../config/aws.config.js";
import { DeleteFacesCommand } from "@aws-sdk/client-rekognition";


export const uploadEventImages = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const [eventRows] = await db.query(
      "SELECT collection_id FROM events WHERE event_id=?",
      [eventId]
    );

    if (!eventRows.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    const collectionId = eventRows[0].collection_id;
    const bucket = process.env.AWS_BUCKET_NAME;

    // ✅ Ensure once
    await ensureCollectionExists(collectionId);

    const uploadedImages = [];

    for (let file of files) {
      const key = `events/${eventId}/${Date.now()}_${file.originalname}`;

      /* Upload to S3 */
      const imageUrl = await uploadToS3(file, key);

      /* Save image in DB */
      const [imgResult] = await db.query(
        "INSERT INTO event_images(event_id,image_url) VALUES (?,?)",
        [eventId, imageUrl]
      );

      /* 🔥 Push Rekognition to background */
      addToFaceQueue(async () => {
        const rekogResult = await indexFaces(collectionId, bucket, key);

        if (rekogResult.FaceRecords?.length) {
          const faceValues = rekogResult.FaceRecords.map(face => [
            face.Face.FaceId,
            imgResult.insertId,
            face.Face.Confidence
          ]);

          await db.query(
            "INSERT INTO faces(face_id,image_id,confidence) VALUES ?",
            [faceValues]
          );
        }

        console.log("✅ Indexed:", key);
      });

      uploadedImages.push(imageUrl);
    }

    // ⚡ Immediate response
    res.json({
      message: "Images uploaded. Face indexing running in background.",
      images: uploadedImages
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};



export const deleteEventImage = async (req, res) => {
  try {
    const imageId = req.params.imageId;

    /* ===== GET IMAGE DETAILS ===== */
    const [rows] = await db.query(
      `SELECT ei.image_url, ei.event_id, e.collection_id
       FROM event_images ei
       JOIN events e ON ei.event_id = e.event_id
       WHERE ei.image_id = ?`,
      [imageId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Image not found" });
    }

    const { image_url, event_id, collection_id } = rows[0];

    /* ===== EXTRACT S3 KEY ===== */
    const url = new URL(image_url);
    const key = decodeURIComponent(url.pathname.substring(1)); 
    // removes leading /

    const bucket = process.env.AWS_BUCKET_NAME;

    /* ===== DELETE FACES FROM REKOGNITION ===== */
    const [faceRows] = await db.query(
      "SELECT face_id FROM faces WHERE image_id=?",
      [imageId]
    );

    if (faceRows.length) {
      const faceIds = faceRows.map(f => f.face_id);

      await rekognitionClient.send(
        new DeleteFacesCommand({
          CollectionId: collection_id,
          FaceIds: faceIds
        })
      );
    }

    /* ===== DELETE IMAGE FROM S3 ===== */
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    /* ===== DELETE FROM DB ===== */
    await db.query("DELETE FROM faces WHERE image_id=?", [imageId]);
    await db.query("DELETE FROM event_images WHERE image_id=?", [imageId]);

    res.json({ message: "Image deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


export const getImagesCount = async (req, res) => {
  try {

    const [eventWise] = await db.query(
      `SELECT 
          e.event_id,
          COUNT(ei.image_id) AS total_images
       FROM events e
       LEFT JOIN event_images ei 
         ON e.event_id = ei.event_id
       GROUP BY e.event_id`
    );

    /* Convert into object for faster lookup */
    const countMap = {};
    eventWise.forEach(item => {
      countMap[item.event_id] = item.total_images;
    });

    res.json(countMap);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
