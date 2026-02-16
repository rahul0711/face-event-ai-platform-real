import archiver from "archiver";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // 👈 ADD THIS
import { s3 } from "./awsS3.service.js";


export const downloadAllPhotosZip = async (req, res) => {
  const { keys } = req.body; // array of S3 keys
  console.log("REQ BODY:", req.body);  

  res.attachment("photos.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(res);

  for (let key of keys) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const s3Object = await s3.send(command);
    archive.append(s3Object.Body, { name: key.split("/").pop() });
  }

  await archive.finalize();
};


export const downloadSinglePhoto = async (req, res) => {
  try {
    const { key } = req.body; // single S3 key

    if (!key) {
      return res.status(400).json({ error: "Image key required" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: "attachment",
      ResponseContentType: "image/jpeg"
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 900
    });

    res.json({ downloadUrl: signedUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Download failed" });
  }
};
