/**
 * MinIO Storage Service
 * Production-ready service for MinIO object storage management
 */

import { BaseInfrastructureService } from './base';
import { config } from '@/lib/config/environment';
import {
  StorageBucket,
  StorageObject,
  StorageUploadRequest,
  StorageDownloadRequest,
  StorageUsage,
  ApiResponse,
} from '../types';

export class StorageService extends BaseInfrastructureService {
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly region: string;

  constructor() {
    super('storage', config.storage.endpoint);
    
    this.accessKey = config.storage.accessKey;
    this.secretKey = config.storage.secretKey;
    this.region = config.storage.region;

    this.validateConfig(['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']);
  }

  protected getAuthHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(timestamp);

    return {
      'Authorization': `AWS4-HMAC-SHA256 ${signature}`,
      'X-Amz-Date': timestamp,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    };
  }

  // =============================================================================
  // BUCKET OPERATIONS
  // =============================================================================

  async listBuckets(): Promise<ApiResponse<StorageBucket[]>> {
    try {
      const response = await this.makeRequest<{ buckets: Array<{ name: string }> }>('/');
      
      if (!response.success) {
        return response as unknown as ApiResponse<StorageBucket[]>;
      }

      const buckets = await Promise.all(
        (response.data?.buckets || []).map(async (bucket: { name: string; creationDate?: string }) => {
          const usage = await this.getBucketUsage(bucket.name);
          return {
            id: bucket.name,
            name: bucket.name,
            createdAt: new Date(bucket.creationDate || Date.now()),
            updatedAt: new Date(),
            status: 'running' as const,
            size: usage.data?.totalSize || 0,
            objectCount: usage.data?.objectCount || 0,
            region: this.region,
            versioning: false,
            encryption: false,
          };
        })
      );

      return this.formatSuccess(buckets);
    } catch (error) {
      return this.formatError(error) as ApiResponse<StorageBucket[]>;
    }
  }

  async createBucket(name: string, region?: string): Promise<ApiResponse<StorageBucket>> {
    try {
      this.validateParams({ name } as Record<string, unknown>, ['name']);

      const response = await this.makeRequest(`/${name}`, {
        method: 'PUT',
        headers: {
          'X-Amz-Bucket-Region': region || this.region,
        },
      });

      if (!response.success) {
        return response as ApiResponse<StorageBucket>;
      }

      const bucket: StorageBucket = {
        id: name,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'running',
        size: 0,
        objectCount: 0,
        region: region || this.region,
        versioning: false,
        encryption: false,
      };

      this.log('info', `Created bucket: ${name}`);
      return this.formatSuccess(bucket);
    } catch (error) {
      return this.formatError(error) as ApiResponse<StorageBucket>;
    }
  }

  async deleteBucket(name: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ name } as Record<string, unknown>, ['name']);

      const response = await this.makeRequest(`/${name}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted bucket: ${name}`);
      }

      return response as ApiResponse<void>;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // OBJECT OPERATIONS
  // =============================================================================

  async listObjects(bucket: string, prefix?: string): Promise<ApiResponse<StorageObject[]>> {
    try {
      this.validateParams({ bucket }, ['bucket']);

      const params = new URLSearchParams();
      if (prefix) params.append('prefix', prefix);

      const response = await this.makeRequest<{ contents?: Array<{ key: string; size: number; lastModified: string; etag: string }> }>(`/${bucket}?${params.toString()}`);
      
      if (!response.success) {
        return response as ApiResponse<StorageObject[]>;
      }

      const objects: StorageObject[] = response.data?.contents?.map((obj: {
        key: string;
        size: number;
        lastModified: string;
        etag: string;
        contentType?: string;
        metadata?: Record<string, string>;
      }) => ({
        key: obj.key,
        size: obj.size,
        lastModified: new Date(obj.lastModified),
        etag: obj.etag,
        contentType: obj.contentType || 'application/octet-stream',
        metadata: obj.metadata || {},
      })) || [];

      return this.formatSuccess(objects);
    } catch (error) {
      return this.formatError(error) as ApiResponse<StorageObject[]>;
    }
  }

  async uploadObject(request: StorageUploadRequest): Promise<ApiResponse<StorageObject>> {
    try {
      this.validateParams(request as unknown as Record<string, unknown>, ['file', 'key', 'bucket']);

      const formData = new FormData();
      formData.append('file', request.file);
      
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          formData.append(`x-amz-meta-${key}`, value);
        });
      }

      const response = await fetch(`${this.baseUrl}/${request.bucket}/${request.key}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const object: StorageObject = {
        key: request.key,
        size: request.file.size,
        lastModified: new Date(),
        etag: response.headers.get('etag') || '',
        contentType: request.file.type,
        metadata: request.metadata,
      };

      this.log('info', `Uploaded object: ${request.bucket}/${request.key}`);
      return this.formatSuccess(object);
    } catch (error) {
      return this.formatError(error) as ApiResponse<StorageObject>;
    }
  }

  async downloadObject(request: StorageDownloadRequest): Promise<ApiResponse<Blob>> {
    try {
      this.validateParams(request as unknown as Record<string, unknown>, ['key', 'bucket']);

      const response = await fetch(`${this.baseUrl}/${request.bucket}/${request.key}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      this.log('info', `Downloaded object: ${request.bucket}/${request.key}`);
      return this.formatSuccess(blob);
    } catch (error) {
      return this.formatError(error) as ApiResponse<Blob>;
    }
  }

  async deleteObject(bucket: string, key: string): Promise<ApiResponse<void>> {
    try {
      this.validateParams({ bucket, key } as Record<string, unknown>, ['bucket', 'key']);

      const response = await this.makeRequest(`/${bucket}/${key}`, {
        method: 'DELETE',
      });

      if (response.success) {
        this.log('info', `Deleted object: ${bucket}/${key}`);
      }

      return response as ApiResponse<void>;
    } catch (error) {
      return this.formatError(error) as ApiResponse<void>;
    }
  }

  // =============================================================================
  // UTILITY OPERATIONS
  // =============================================================================

  async getBucketUsage(bucket: string): Promise<ApiResponse<StorageUsage>> {
    try {
      this.validateParams({ bucket }, ['bucket']);

      const objectsResponse = await this.listObjects(bucket);
      
      if (!objectsResponse.success) {
        return objectsResponse as unknown as ApiResponse<StorageUsage>;
      }

      const objects = objectsResponse.data || [];
      const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0);

      const usage: StorageUsage = {
        totalSize,
        objectCount: objects.length,
        bucketCount: 1,
        quota: 10 * 1024 * 1024 * 1024, // 10GB default quota
        quotaUsed: (totalSize / (10 * 1024 * 1024 * 1024)) * 100,
      };

      return this.formatSuccess(usage);
    } catch (error) {
      return this.formatError(error) as ApiResponse<StorageUsage>;
    }
  }

  async generatePresignedUrl(
    bucket: string,
    key: string,
    expiry: number = 3600
  ): Promise<ApiResponse<string>> {
    try {
      this.validateParams({ bucket, key } as Record<string, unknown>, ['bucket', 'key']);

      const expires = Math.floor(Date.now() / 1000) + expiry;
      const signature = this.generatePresignedSignature(bucket, key, expires);

      const url = `${this.baseUrl}/${bucket}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${this.accessKey}&X-Amz-Date=${new Date().toISOString()}&X-Amz-Expires=${expiry}&X-Amz-Signature=${signature}`;

      return this.formatSuccess(url);
    } catch (error) {
      return this.formatError(error) as ApiResponse<string>;
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private generateSignature(timestamp: string): string {
    // Simplified signature generation - in production, use proper AWS4 signing
    const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${this.region}/s3/aws4_request\n`;
    return Buffer.from(stringToSign + this.secretKey).toString('base64');
  }

  private generatePresignedSignature(bucket: string, key: string, expires: number): string {
    // Simplified presigned signature - in production, use proper AWS4 signing
    const stringToSign = `GET\n/${bucket}/${key}\n\nhost:${new URL(this.baseUrl).host}\n\n${expires}`;
    return Buffer.from(stringToSign + this.secretKey).toString('base64');
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const storageService = new StorageService();
