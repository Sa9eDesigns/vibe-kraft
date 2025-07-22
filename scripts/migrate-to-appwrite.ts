#!/usr/bin/env tsx
/**
 * Migration Script: MinIO to Appwrite Storage
 * Migrates existing workspace files from MinIO to Appwrite Storage
 */

import { PrismaClient } from '@prisma/client';
import { storageService } from '../lib/infrastructure/services/storage';
import { appwriteStorageService } from '../lib/infrastructure/services/appwrite-storage';
import { config } from '../lib/config/environment';

const db = new PrismaClient();

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  errors: Array<{ file: string; error: string }>;
}

class AppwriteMigration {
  private stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    errors: [],
  };

  async run(options: {
    dryRun?: boolean;
    workspaceId?: string;
    batchSize?: number;
  } = {}) {
    const { dryRun = false, workspaceId, batchSize = 50 } = options;

    console.log('🚀 Starting MinIO to Appwrite migration...');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    
    if (workspaceId) {
      console.log(`Workspace: ${workspaceId}`);
    } else {
      console.log('Migrating all workspaces');
    }

    try {
      // 1. Create Appwrite bucket if it doesn't exist
      if (!dryRun) {
        await this.ensureAppwriteBucket();
      }

      // 2. Get all workspace files to migrate
      const files = await this.getFilesToMigrate(workspaceId);
      this.stats.totalFiles = files.length;

      console.log(`📁 Found ${files.length} files to migrate`);

      // 3. Process files in batches
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await this.processBatch(batch, dryRun);
        
        console.log(`Progress: ${Math.min(i + batchSize, files.length)}/${files.length} files processed`);
      }

      // 4. Print migration summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await db.$disconnect();
    }
  }

  private async ensureAppwriteBucket(): Promise<void> {
    try {
      console.log('🪣 Creating Appwrite bucket...');
      
      const result = await appwriteStorageService.createBucket(
        config.appwrite.bucketName,
        {
          maximumFileSize: 50000000, // 50MB
          allowedFileExtensions: [], // Allow all file types
          encryption: true,
          antivirus: true,
        }
      );

      if (result.success) {
        console.log(`✅ Bucket created: ${result.data.name} (${result.data.id})`);
      } else {
        console.log('ℹ️ Bucket might already exist, continuing...');
      }
    } catch (error) {
      console.log('ℹ️ Bucket creation failed (might already exist):', error);
    }
  }

  private async getFilesToMigrate(workspaceId?: string) {
    const whereClause = workspaceId ? { workspaceId } : {};
    
    return await db.workspaceFile.findMany({
      where: {
        ...whereClause,
        isDirectory: false, // Only migrate actual files, not directories
      },
      select: {
        id: true,
        workspaceId: true,
        path: true,
        name: true,
        size: true,
        mimeType: true,
        hash: true,
      },
    });
  }

  private async processBatch(files: any[], dryRun: boolean): Promise<void> {
    const promises = files.map(file => this.migrateFile(file, dryRun));
    await Promise.allSettled(promises);
  }

  private async migrateFile(file: any, dryRun: boolean): Promise<void> {
    try {
      const storageKey = this.getStorageKey(file.workspaceId, file.path);

      if (dryRun) {
        console.log(`[DRY RUN] Would migrate: ${file.path}`);
        this.stats.migratedFiles++;
        return;
      }

      // 1. Download file from MinIO
      const downloadResult = await storageService.downloadObject({
        bucket: config.storage.bucketName,
        key: storageKey,
      });

      if (!downloadResult.success) {
        throw new Error(`Failed to download from MinIO: ${downloadResult.error}`);
      }

      // 2. Upload to Appwrite
      const fileContent = await downloadResult.data!.arrayBuffer();
      const uploadResult = await appwriteStorageService.uploadObject({
        file: new File([fileContent], file.name, { type: file.mimeType }),
        key: storageKey,
        bucket: config.appwrite.bucketName,
        metadata: {
          workspaceId: file.workspaceId,
          originalPath: file.path,
          migratedFrom: 'minio',
          migrationDate: new Date().toISOString(),
        },
      });

      if (!uploadResult.success) {
        throw new Error(`Failed to upload to Appwrite: ${uploadResult.error}`);
      }

      // 3. Verify file integrity
      const uploadedSize = uploadResult.data.size;
      if (uploadedSize !== Number(file.size)) {
        throw new Error(`Size mismatch: expected ${file.size}, got ${uploadedSize}`);
      }

      console.log(`✅ Migrated: ${file.path} (${this.formatBytes(Number(file.size))})`);
      this.stats.migratedFiles++;

    } catch (error) {
      console.error(`❌ Failed to migrate ${file.path}:`, error);
      this.stats.failedFiles++;
      this.stats.errors.push({
        file: file.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getStorageKey(workspaceId: string, path: string): string {
    return `workspaces/${workspaceId}/files/${path.replace(/^\//, '')}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private printSummary(): void {
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total files: ${this.stats.totalFiles}`);
    console.log(`✅ Migrated: ${this.stats.migratedFiles}`);
    console.log(`❌ Failed: ${this.stats.failedFiles}`);
    console.log(`⏭️ Skipped: ${this.stats.skippedFiles}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    const successRate = ((this.stats.migratedFiles / this.stats.totalFiles) * 100).toFixed(1);
    console.log(`\n📈 Success rate: ${successRate}%`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1];
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50');

  const migration = new AppwriteMigration();
  await migration.run({ dryRun, workspaceId, batchSize });
}

if (require.main === module) {
  main().catch(console.error);
}

export { AppwriteMigration };
