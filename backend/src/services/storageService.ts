import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const STORAGE_REGION = process.env.OBJECT_STORAGE_REGION;
const STORAGE_ENDPOINT = process.env.OBJECT_STORAGE_ENDPOINT;
const STORAGE_ACCESS_KEY = process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
const STORAGE_SECRET_KEY = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;
const STORAGE_BUCKET = process.env.OBJECT_STORAGE_BUCKET;
const STORAGE_PUBLIC_BASE_URL = process.env.OBJECT_STORAGE_PUBLIC_BASE_URL;

const isStorageConfigured = () =>
  Boolean(
    STORAGE_REGION &&
      STORAGE_ACCESS_KEY &&
      STORAGE_SECRET_KEY &&
      STORAGE_BUCKET &&
      STORAGE_PUBLIC_BASE_URL
  );

const getClient = () => {
  if (!isStorageConfigured()) {
    throw new Error('Object storage is not configured');
  }
  return new S3Client({
    region: STORAGE_REGION,
    endpoint: STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: STORAGE_ACCESS_KEY!,
      secretAccessKey: STORAGE_SECRET_KEY!,
    },
    forcePathStyle: Boolean(STORAGE_ENDPOINT),
  });
};

const buildPublicUrl = (key: string) => {
  const base = STORAGE_PUBLIC_BASE_URL!.replace(/\/$/, '');
  return `${base}/${key}`;
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const ensureStorageConfigured = () => {
  if (!isStorageConfigured()) {
    throw new Error('Object storage is not configured');
  }
};

export const uploadBuffer = async (key: string, buffer: Buffer, contentType: string) => {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return buildPublicUrl(key);
};

export const uploadStream = async (key: string, stream: Readable, contentType: string) => {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET!,
      Key: key,
      Body: stream,
      ContentType: contentType,
    })
  );
  return buildPublicUrl(key);
};

export const getObjectBuffer = async (key: string): Promise<Buffer> => {
  const client = getClient();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: STORAGE_BUCKET!,
      Key: key,
    })
  );
  if (!response.Body) {
    throw new Error('Object storage returned empty body');
  }
  return streamToBuffer(response.Body as Readable);
};
