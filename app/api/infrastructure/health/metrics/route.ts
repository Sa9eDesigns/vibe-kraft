/**
 * Infrastructure Health Metrics API Route
 * Prometheus metrics endpoint for health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkInfrastructureHealth } from '@/lib/infrastructure/services';
import { requireInfrastructureAccess } from '@/lib/auth/infrastructure-auth';
import { InfrastructureAuthError } from '@/lib/auth/infrastructure-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireInfrastructureAccess();
    const health = await checkInfrastructureHealth();

    // Convert health data to Prometheus metrics format
    const metrics = convertToPrometheusMetrics(health);

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Health metrics generation failed:', error);
    
    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate health metrics' },
      { status: 500 }
    );
  }
}

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
