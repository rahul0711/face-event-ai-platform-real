// import { google } from "googleapis";

// const auth = new google.auth.GoogleAuth({
//   keyFile: "google-service-account.json",
//   scopes: ["https://www.googleapis.com/auth/drive.readonly"]
// });

// const drive = google.drive({ version: "v3", auth });

// export const listDriveImages = async (folderId) => {
//   const res = await drive.files.list({
//     q: `'${folderId}' in parents and mimeType contains 'image/'`,
//     fields: "files(id, name)"
//   });

//   return res.data.files;
// };

// export const downloadDriveFile = async (fileId) => {
//   const res = await drive.files.get(
//     { fileId, alt: "media" },
//     { responseType: "arraybuffer" }
//   );

//   return Buffer.from(res.data);
// };
// const extractFolderId = (url) => {
//   const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
//   return match ? match[1] : null;
// };
