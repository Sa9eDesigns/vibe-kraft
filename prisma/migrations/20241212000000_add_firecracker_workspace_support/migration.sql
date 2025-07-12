-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('WEBVM', 'FIRECRACKER');

-- CreateEnum
CREATE TYPE "FirecrackerStatus" AS ENUM ('STARTING', 'RUNNING', 'STOPPING', 'STOPPED', 'ERROR', 'SUSPENDED', 'PAUSED');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "type" "WorkspaceType" NOT NULL DEFAULT 'WEBVM';

-- CreateTable
CREATE TABLE "FirecrackerVM" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "FirecrackerStatus" NOT NULL DEFAULT 'STOPPED',
    "vmId" TEXT NOT NULL,
    "config" JSONB,
    "resources" JSONB,
    "networkConfig" JSONB,
    "kernelImage" TEXT,
    "rootfsImage" TEXT,
    "socketPath" TEXT,
    "logPath" TEXT,
    "metricsPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "templateId" TEXT,

    CONSTRAINT "FirecrackerVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirecrackerContainer" (
    "id" TEXT NOT NULL,
    "vmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" "ContainerStatus" NOT NULL DEFAULT 'CREATING',
    "config" JSONB,
    "ports" JSONB,
    "volumes" JSONB,
    "environment" JSONB,
    "command" TEXT,
    "workingDir" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),

    CONSTRAINT "FirecrackerContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirecrackerMetric" (
    "id" TEXT NOT NULL,
    "vmId" TEXT NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirecrackerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirecrackerSnapshot" (
    "id" TEXT NOT NULL,
    "vmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "snapshotPath" TEXT NOT NULL,
    "memoryPath" TEXT,
    "size" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirecrackerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirecrackerTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "kernelImage" TEXT NOT NULL,
    "rootfsImage" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirecrackerTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirecrackerContainerLog" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "FirecrackerContainerLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FirecrackerVM_vmId_key" ON "FirecrackerVM"("vmId");

-- CreateIndex
CREATE INDEX "FirecrackerMetric_vmId_timestamp_idx" ON "FirecrackerMetric"("vmId", "timestamp");

-- CreateIndex
CREATE INDEX "FirecrackerContainerLog_containerId_timestamp_idx" ON "FirecrackerContainerLog"("containerId", "timestamp");

-- AddForeignKey
ALTER TABLE "FirecrackerVM" ADD CONSTRAINT "FirecrackerVM_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirecrackerVM" ADD CONSTRAINT "FirecrackerVM_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FirecrackerTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirecrackerContainer" ADD CONSTRAINT "FirecrackerContainer_vmId_fkey" FOREIGN KEY ("vmId") REFERENCES "FirecrackerVM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirecrackerMetric" ADD CONSTRAINT "FirecrackerMetric_vmId_fkey" FOREIGN KEY ("vmId") REFERENCES "FirecrackerVM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirecrackerSnapshot" ADD CONSTRAINT "FirecrackerSnapshot_vmId_fkey" FOREIGN KEY ("vmId") REFERENCES "FirecrackerVM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirecrackerContainerLog" ADD CONSTRAINT "FirecrackerContainerLog_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "FirecrackerContainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
