// import { db } from "../database/db.js";
// import { uploadToS3 } from "../services/awsS3.service.js";
// import {
//   ensureCollectionExists,
//   indexFaces
// } from "../services/awsRekognition.service.js";
// import { addToFaceQueue } from "../queues/faceIndex.queue.js";
// import {
//   listDriveImages,
//   downloadDriveFile
// } from "../services/googleDrive.service.js";

// const extractFolderId = (url) => {
//   const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
//   return match ? match[1] : null;
// };

// export const uploadFromGoogleDrive = async (req, res) => {
//   try {
//     const { driveLink } = req.body;
//     const eventId = req.params.eventId;

//     const folderId = extractFolderId(driveLink);
//     if (!folderId) {
//       return res.status(400).json({ message: "Invalid Google Drive folder link" });
//     }

//     const [eventRows] = await db.query(
//       "SELECT collection_id FROM events WHERE event_id=?",
//       [eventId]
//     );

//     if (!eventRows.length) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     const collectionId = eventRows[0].collection_id;
//     const bucket = process.env.AWS_BUCKET_NAME;

//     await ensureCollectionExists(collectionId);

//     const files = await listDriveImages(folderId);

//     for (const file of files) {
//       const buffer = await downloadDriveFile(file.id);
//       const key = `events/${eventId}/${Date.now()}_${file.name}`;

//       const imageUrl = await uploadToS3(
//         { buffer, mimetype: "image/jpeg" },
//         key
//       );

//       const [imgResult] = await db.query(
//         "INSERT INTO event_images(event_id,image_url) VALUES (?,?)",
//         [eventId, imageUrl]
//       );

//       addToFaceQueue(async () => {
//         const rekogResult = await indexFaces(collectionId, bucket, key);

//         if (rekogResult.FaceRecords?.length) {
//           const faceValues = rekogResult.FaceRecords.map(face => [
//             face.Face.FaceId,
//             imgResult.insertId,
//             face.Face.Confidence
//           ]);

//           await db.query(
//             "INSERT INTO faces(face_id,image_id,confidence) VALUES ?",
//             [faceValues]
//           );
//         }
//       });
//     }

//     res.json({
//       message: "Google Drive images ingestion started",
//       totalImages: files.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };
