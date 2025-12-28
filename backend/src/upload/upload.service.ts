import { Injectable, BadRequestException } from '@nestjs/common';
import { s3Client, S3_BUCKET } from './s3.config';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { File as MulterFile } from 'multer';
import { createReadStream } from 'fs';

@Injectable()
export class UploadService {
  /** Sanitize filename - remove special characters that can cause issues with S3 */
  private sanitizeFilename(filename: string): string {
    // Decode if URL encoded
    let decoded = filename;
    try {
      decoded = decodeURIComponent(filename);
    } catch {
      // Keep original if decode fails
    }

    // Keep only safe characters: alphanumeric, dash, underscore, dot
    // Replace spaces and other chars with underscore
    const sanitized = decoded
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // Ensure we have a valid filename
    return sanitized || `file_${Date.now()}`;
  }

  /** Upload 1 file */
  async uploadSingle(file: MulterFile, folder: string) {
    if (!file) throw new BadRequestException('File is required');

    const sanitizedName = this.sanitizeFilename(file.originalname);
    const key = `${folder}/${Date.now()}-${sanitizedName}`;

    // Multer may store file in memory (buffer) or on disk (path). Prefer buffer, fallback to stream.
    const body =
      file.buffer ?? (file.path ? createReadStream(file.path) : undefined);
    if (!body) throw new BadRequestException('File buffer is not available');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ACL: 'public-read',
        ContentType: file.mimetype ?? 'application/octet-stream',
      }),
    );

    // URL chuẩn public-read
    const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { key, url };
  }

  /** Upload nhiều file */
  async uploadMulti(files: MulterFile[], folder: string) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files provided');

    const tasks = files.map((file) => this.uploadSingle(file, folder));
    return Promise.all(tasks);
  }

  /**
   * Download an object from S3 by its public URL.
   * Returns the S3 object stream + basic metadata.
   */
  async getObjectByUrl(fileUrl: string) {
    if (!fileUrl) throw new BadRequestException('fileUrl is required');

    let key: string;
    try {
      const url = new URL(fileUrl);
      key = decodeURIComponent(url.pathname.replace(/^\//, ''));
    } catch {
      throw new BadRequestException('Invalid fileUrl');
    }

    if (!key) throw new BadRequestException('Invalid fileUrl');

    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }),
    );

    return { key, result };
  }
}
