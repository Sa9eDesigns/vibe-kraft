# Appwrite Storage Integration for VibeKraft

This document explains how to integrate Appwrite Storage as the object storage backend for VibeKraft workspaces, replacing MinIO.

## Why Appwrite Storage?

### Benefits over MinIO

- **🚀 Managed Service**: No infrastructure to maintain
- **🌍 Global CDN**: Built-in content delivery network
- **🖼️ Image Processing**: Automatic transformations and optimization
- **🔒 Advanced Security**: Granular permissions and built-in antivirus
- **📦 Chunked Uploads**: Automatic handling of large files (5MB chunks)
- **🔧 Developer Experience**: Excellent TypeScript SDK
- **💰 Cost Effective**: Free tier with 2GB storage + 10GB bandwidth

### Feature Comparison

| Feature | MinIO | Appwrite Storage |
|---------|-------|------------------|
| Self-hosted | ✅ | ❌ (Cloud/Self-hosted) |
| Managed service | ❌ | ✅ |
| CDN integration | ❌ | ✅ |
| Image transformations | ❌ | ✅ |
| Built-in permissions | ❌ | ✅ |
| Antivirus scanning | ❌ | ✅ |
| TypeScript SDK | ⚠️ | ✅ |
| Free tier | ❌ | ✅ |

## Setup Instructions

### 1. Create Appwrite Account

1. Go to [Appwrite Cloud](https://cloud.appwrite.io)
2. Create an account and new project
3. Note your **Project ID** from the project settings

### 2. Create API Key

1. Go to **Settings** → **API Keys**
2. Create a new **Server-side** API key
3. Grant the following permissions:
   - `storage.read`
   - `storage.write`
   - `buckets.read`
   - `buckets.write`

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.appwrite.example .env.local
```

Fill in your Appwrite credentials:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id-here
APPWRITE_API_KEY=your-server-api-key-here
APPWRITE_BUCKET_NAME=workspace-files
```

### 4. Install Dependencies

The Appwrite SDK is already installed. If you need to install it manually:

```bash
pnpm add appwrite
```

## Migration from MinIO

If you have existing data in MinIO, use the migration script:

### Dry Run (Recommended First)

```bash
pnpm run migrate:appwrite:dry-run
```

### Full Migration

```bash
# Migrate all workspaces
pnpm run migrate:appwrite

# Migrate specific workspace
pnpm run migrate:appwrite -- --workspace=workspace-id-here

# Custom batch size
pnpm run migrate:appwrite -- --batch-size=25
```

### Migration Features

- ✅ **Batch Processing**: Processes files in configurable batches
- ✅ **Integrity Verification**: Verifies file sizes after migration
- ✅ **Error Handling**: Continues on individual file failures
- ✅ **Progress Tracking**: Shows real-time migration progress
- ✅ **Detailed Reporting**: Comprehensive migration summary

## Code Changes

The system automatically detects Appwrite configuration and uses it when available. The `WorkspaceFileStorage` class now supports both backends:

```typescript
// Automatically uses Appwrite if configured, falls back to MinIO
const fileStorage = new WorkspaceFileStorage(workspaceId);

// Upload file (works with both backends)
const file = await fileStorage.storeFile(
  '/path/to/file.txt',
  'file content',
  { metadata: { author: 'user' } }
);
```

## Advanced Features

### Image Transformations

Appwrite provides built-in image processing:

```typescript
// Get optimized image preview
const previewUrl = appwriteStorageService.getFilePreview(
  bucketId,
  fileId,
  {
    width: 300,
    height: 200,
    quality: 80,
    format: 'webp'
  }
);
```

### File Permissions

Set granular permissions per file:

```typescript
await appwriteStorageService.uploadObject({
  file: myFile,
  key: 'path/to/file',
  bucket: 'workspace-files',
  permissions: [
    Permission.read(Role.user('user-id')),
    Permission.write(Role.team('team-id')),
  ]
});
```

### Chunked Uploads

Large files are automatically chunked (5MB chunks):

```typescript
// Automatically handles chunking for files > 5MB
const result = await storage.createFile(
  bucketId,
  fileId,
  largeFile // Will be automatically chunked
);
```

## Monitoring & Analytics

### Storage Usage

Monitor storage usage through Appwrite console:
- File count and total size
- Bandwidth usage
- Request analytics
- Error rates

### File Events

Set up webhooks for file events:
- File uploaded
- File deleted
- File updated

## Security Considerations

### Permissions Model

Appwrite uses a sophisticated permissions system:

```typescript
// Workspace-specific permissions
Permission.read(Role.label('workspace:' + workspaceId))
Permission.write(Role.label('workspace:' + workspaceId))

// User-specific permissions
Permission.read(Role.user(userId))
Permission.write(Role.user(userId))

// Public read access
Permission.read(Role.any())
```

### Built-in Security Features

- **Antivirus Scanning**: Automatic malware detection
- **File Type Validation**: Configurable allowed extensions
- **Size Limits**: Per-bucket file size limits
- **Rate Limiting**: Built-in request rate limiting
- **Encryption**: Files encrypted at rest

## Troubleshooting

### Common Issues

1. **API Key Permissions**: Ensure your API key has all required permissions
2. **Bucket Creation**: Bucket might already exist (this is normal)
3. **File Size Limits**: Default 30MB limit (configurable)
4. **Network Issues**: Check Appwrite endpoint accessibility

### Debug Mode

Enable debug logging:

```typescript
// In your environment
DEBUG=appwrite:*
```

### Migration Issues

If migration fails:

1. Check MinIO connectivity
2. Verify Appwrite credentials
3. Check file permissions
4. Review error logs in migration output

## Performance Optimization

### CDN Benefits

Appwrite automatically serves files through a global CDN:
- Faster file delivery worldwide
- Reduced server load
- Automatic caching

### Image Optimization

Use Appwrite's image transformations:
- WebP conversion for better compression
- Automatic resizing
- Quality optimization
- Format conversion

## Cost Considerations

### Appwrite Pricing (as of 2024)

**Free Tier:**
- 2GB storage
- 10GB bandwidth
- Unlimited requests

**Pro Tier ($15/month):**
- 100GB storage
- 500GB bandwidth
- Advanced features

### Cost Comparison

For typical VibeKraft usage, Appwrite is often more cost-effective than self-hosted MinIO when considering:
- Infrastructure costs
- Maintenance time
- CDN costs
- Backup costs

## Next Steps

1. Set up Appwrite account and project
2. Configure environment variables
3. Run migration (dry-run first)
4. Test file operations
5. Monitor usage and performance

For questions or issues, refer to:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Storage Guide](https://appwrite.io/docs/products/storage)
- [VibeKraft GitHub Issues](https://github.com/your-repo/issues)
