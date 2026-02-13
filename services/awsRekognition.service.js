import {
  CreateCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteCollectionCommand,
  DescribeCollectionCommand
} from "@aws-sdk/client-rekognition";

import { rekognitionClient } from "../config/aws.config.js";

/* CREATE COLLECTION */
export const createCollection = async (collectionId) => {
  const command = new CreateCollectionCommand({
    CollectionId: collectionId
  });

  return await rekognitionClient.send(command);
};

/* DELETE COLLECTION */
export const deleteCollection = async (collectionId) => {
  const command = new DeleteCollectionCommand({
    CollectionId: collectionId
  });

  return await rekognitionClient.send(command);
};

/* INDEX FACES */
export const indexFaces = async (collectionId, bucket, imageKey) => {
  const command = new IndexFacesCommand({
    CollectionId: collectionId,
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: imageKey
      }
    },
    DetectionAttributes: ["DEFAULT"]
  });

  return await rekognitionClient.send(command);
};

/* SEARCH FACES */
export const searchFaces = async (collectionId, imageBuffer) => {
  const command = new SearchFacesByImageCommand({
    CollectionId: collectionId,
    Image: {
      Bytes: imageBuffer
    },
    FaceMatchThreshold: 80
  });

  return await rekognitionClient.send(command);
};

/* ENSURE COLLECTION EXISTS */
export const ensureCollectionExists = async (collectionId) => {
  try {
    await rekognitionClient.send(
      new DescribeCollectionCommand({
        CollectionId: collectionId
      })
    );
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      await rekognitionClient.send(
        new CreateCollectionCommand({
          CollectionId: collectionId
        })
      );
    } else {
      throw err;
    }
  }
};
