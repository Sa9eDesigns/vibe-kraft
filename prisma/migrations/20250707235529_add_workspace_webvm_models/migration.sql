-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'ERROR');

-- CreateEnum
CREATE TYPE "WebVMStatus" AS ENUM ('STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'ERROR', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'NETWORK_IN', 'NETWORK_OUT', 'RESPONSE_TIME');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT NOT NULL,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'INACTIVE',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebVMInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "WebVMStatus" NOT NULL DEFAULT 'STOPPED',
    "imageUrl" TEXT,
    "config" JSONB,
    "resources" JSONB,
    "networkConfig" JSONB,
    "connectionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),

    CONSTRAINT "WebVMInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebVMMetric" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVMMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebVMMetric_instanceId_timestamp_idx" ON "WebVMMetric"("instanceId", "timestamp");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebVMInstance" ADD CONSTRAINT "WebVMInstance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebVMMetric" ADD CONSTRAINT "WebVMMetric_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WebVMInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
