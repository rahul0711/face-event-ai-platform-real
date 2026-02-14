import archiver from "archiver";
import { GetObjectCommand } from "@aws-sdk/client-s3";
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
