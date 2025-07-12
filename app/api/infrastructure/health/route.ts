/**
 * Infrastructure Health API Route
 * Comprehensive health check endpoint for all infrastructure services
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkInfrastructureHealth, checkServiceHealth } from '@/lib/infrastructure/services';
import { requireInfrastructureAccess } from '@/lib/auth/infrastructure-auth';
import { InfrastructureAuthError } from '@/lib/auth/infrastructure-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and permissions
    const session = await requireInfrastructureAccess();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const detailed = searchParams.get('detailed') === 'true';

    let healthData;

    if (service) {
      // Check specific service health
      healthData = await checkServiceHealth(service);
      
      if (!healthData) {
        return NextResponse.json(
          { error: `Service '${service}' not found` },
          { status: 404 }
        );
      }
    } else {
      // Check all infrastructure health
      healthData = await checkInfrastructureHealth();
    }

    // Add additional metadata if detailed view requested
    if (detailed && !service) {
      const enhancedHealth = {
        ...healthData,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: session.user.id,
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version || '1.0.0',
        },
        recommendations: generateHealthRecommendations(healthData),
      };

      return NextResponse.json(enhancedHealth);
    }

    return NextResponse.json(healthData);

  } catch (error) {
    console.error('Infrastructure health check failed:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate health recommendations based on service status
 */
function generateHealthRecommendations(health: any): string[] {
  const recommendations: string[] = [];

  if (health.overall === 'unhealthy') {
    recommendations.push('Critical: Multiple services are down. Immediate attention required.');
  } else if (health.overall === 'degraded') {
    recommendations.push('Warning: Some services are experiencing issues. Monitor closely.');
  }

  // Check individual services
  health.services?.forEach((service: any) => {
    if (service.status === 'unhealthy') {
      recommendations.push(`Service ${service.service} is down: ${service.error}`);
    } else if (service.responseTime > 5000) {
      recommendations.push(`Service ${service.service} has high response time (${service.responseTime}ms)`);
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('All systems operational. No action required.');
  }

  return recommendations;
}

// This function will be moved to a separate metrics endpoint

/**
 * Convert health data to Prometheus metrics format
 */
function convertToPrometheusMetrics(health: any): string {
  const timestamp = Date.now();
  let metrics = '';

  // Overall health metric
  metrics += `# HELP vibekraft_infrastructure_health Overall infrastructure health status\n`;
  metrics += `# TYPE vibekraft_infrastructure_health gauge\n`;
  const healthValue = health.overall === 'healthy' ? 1 : health.overall === 'degraded' ? 0.5 : 0;
  metrics += `vibekraft_infrastructure_health ${healthValue} ${timestamp}\n\n`;

  // Individual service metrics
  metrics += `# HELP vibekraft_service_up Service availability status\n`;
  metrics += `# TYPE vibekraft_service_up gauge\n`;
  
  metrics += `# HELP vibekraft_service_response_time Service response time in milliseconds\n`;
  metrics += `# TYPE vibekraft_service_response_time gauge\n`;

  health.services?.forEach((service: any) => {
    const serviceUp = service.status === 'healthy' ? 1 : 0;
    metrics += `vibekraft_service_up{service="${service.service}"} ${serviceUp} ${timestamp}\n`;
    metrics += `vibekraft_service_response_time{service="${service.service}"} ${service.responseTime} ${timestamp}\n`;
  });

  return metrics;
}
