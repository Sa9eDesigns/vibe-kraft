/**
 * Environment Configuration Module
 * Centralized configuration management for VibeKraft infrastructure
 */

import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // MinIO Storage
  MINIO_ENDPOINT: z.string().url(),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET_NAME: z.string().min(1),
  MINIO_REGION: z.string().default('us-east-1'),
  
  // API Endpoints
  API_URL: z.string().url(),
  WEBSOCKET_URL: z.string().url(),
  
  // Firecracker & WebVM
  FIRECRACKER_API_URL: z.string().url().optional(),
  WEBVM_INSTANCES_URL: z.string().url().optional(),
  WEBVM_DEFAULT_IMAGE: z.string().default('ubuntu:22.04'),
  WEBVM_MAX_INSTANCES_PER_USER: z.coerce.number().default(5),
  WEBVM_DEFAULT_MEMORY: z.string().default('512M'),
  WEBVM_DEFAULT_CPU_COUNT: z.coerce.number().default(1),
  
  // Docker
  DOCKER_API_URL: z.string().url().optional(),
  DOCKER_SOCKET_PATH: z.string().default('/var/run/docker.sock'),
  DOCKER_NETWORK_NAME: z.string().default('vibekraft-net'),
  
  // Monitoring
  PROMETHEUS_URL: z.string().url().optional(),
  GRAFANA_URL: z.string().url().optional(),
  GRAFANA_API_KEY: z.string().optional(),
  METRICS_RETENTION_DAYS: z.coerce.number().default(30),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // AI SDK
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  
  // Security
  INFRASTRUCTURE_JWT_SECRET: z.string().min(32),
  ADMIN_API_KEY: z.string().min(32),
  WEBHOOK_SECRET: z.string().min(32),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Feature Flags
  ENABLE_FIRECRACKER: z.coerce.boolean().default(true),
  ENABLE_WEBVM: z.coerce.boolean().default(true),
  ENABLE_AI_FEATURES: z.coerce.boolean().default(true),
  ENABLE_METRICS_DASHBOARD: z.coerce.boolean().default(true),
  ENABLE_STORAGE_BROWSER: z.coerce.boolean().default(true),
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().default(100),
  RATE_LIMIT_WEBVM_CREATES_PER_HOUR: z.coerce.number().default(10),
  RATE_LIMIT_STORAGE_UPLOADS_PER_HOUR: z.coerce.number().default(50),
  
  // Backup
  BACKUP_S3_BUCKET: z.string().optional(),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Environment validation failed');
  }
}

// Export validated environment configuration
export const env = parseEnv();

// Environment-specific configurations
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Database configuration
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis configuration
  redis: {
    url: env.REDIS_URL,
  },
  
  // MinIO configuration
  storage: {
    endpoint: env.MINIO_ENDPOINT,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucketName: env.MINIO_BUCKET_NAME,
    region: env.MINIO_REGION,
  },
  
  // API configuration
  api: {
    url: env.API_URL,
    websocketUrl: env.WEBSOCKET_URL,
  },
  
  // WebVM configuration
  webvm: {
    firecrackerApiUrl: env.FIRECRACKER_API_URL,
    instancesUrl: env.WEBVM_INSTANCES_URL,
    defaultImage: env.WEBVM_DEFAULT_IMAGE,
    maxInstancesPerUser: env.WEBVM_MAX_INSTANCES_PER_USER,
    defaultMemory: env.WEBVM_DEFAULT_MEMORY,
    defaultCpuCount: env.WEBVM_DEFAULT_CPU_COUNT,
  },
  
  // Docker configuration
  docker: {
    apiUrl: env.DOCKER_API_URL,
    socketPath: env.DOCKER_SOCKET_PATH,
    networkName: env.DOCKER_NETWORK_NAME,
  },
  
  // Monitoring configuration
  monitoring: {
    prometheusUrl: env.PROMETHEUS_URL,
    grafanaUrl: env.GRAFANA_URL,
    grafanaApiKey: env.GRAFANA_API_KEY,
    retentionDays: env.METRICS_RETENTION_DAYS,
  },
  
  // Authentication configuration
  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  
  // AI configuration
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  
  // Security configuration
  security: {
    infrastructureJwtSecret: env.INFRASTRUCTURE_JWT_SECRET,
    adminApiKey: env.ADMIN_API_KEY,
    webhookSecret: env.WEBHOOK_SECRET,
  },
  
  // Logging configuration
  logging: {
    level: env.LOG_LEVEL,
    sentryDsn: env.SENTRY_DSN,
    datadogApiKey: env.DATADOG_API_KEY,
  },
  
  // Feature flags
  features: {
    firecracker: env.ENABLE_FIRECRACKER,
    webvm: env.ENABLE_WEBVM,
    ai: env.ENABLE_AI_FEATURES,
    metrics: env.ENABLE_METRICS_DASHBOARD,
    storage: env.ENABLE_STORAGE_BROWSER,
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
    webvmCreatesPerHour: env.RATE_LIMIT_WEBVM_CREATES_PER_HOUR,
    storageUploadsPerHour: env.RATE_LIMIT_STORAGE_UPLOADS_PER_HOUR,
  },
  
  // Backup configuration
  backup: {
    s3Bucket: env.BACKUP_S3_BUCKET,
    schedule: env.BACKUP_SCHEDULE,
    retentionDays: env.BACKUP_RETENTION_DAYS,
  },
} as const;

// Type exports
export type Config = typeof config;
export type Environment = typeof env;
