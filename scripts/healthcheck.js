#!/usr/bin/env node

/**
 * Health Check Script for VibeKraft
 * Comprehensive health check for the application and its dependencies
 */

const http = require('http');
const https = require('https');

const HEALTH_CHECK_TIMEOUT = 5000;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = HEALTH_CHECK_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', reject);
  });
}

/**
 * Check application health
 */
async function checkAppHealth() {
  try {
    const response = await makeRequest(`http://localhost:${PORT}/api/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      return {
        status: 'healthy',
        details: healthData
      };
    } else {
      return {
        status: 'unhealthy',
        error: `HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    const response = await makeRequest(`http://localhost:${PORT}/api/health/database`);
    
    if (response.statusCode === 200) {
      return { status: 'healthy' };
    } else {
      return {
        status: 'unhealthy',
        error: `Database check failed: HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: `Database check failed: ${error.message}`
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
  try {
    const response = await makeRequest(`http://localhost:${PORT}/api/health/redis`);
    
    if (response.statusCode === 200) {
      return { status: 'healthy' };
    } else {
      return {
        status: 'unhealthy',
        error: `Redis check failed: HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: `Redis check failed: ${error.message}`
    };
  }
}

/**
 * Check infrastructure services
 */
async function checkInfrastructure() {
  try {
    const response = await makeRequest(`http://localhost:${PORT}/api/infrastructure/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      return {
        status: healthData.overall === 'healthy' ? 'healthy' : 'degraded',
        details: healthData
      };
    } else {
      return {
        status: 'unhealthy',
        error: `Infrastructure check failed: HTTP ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: `Infrastructure check failed: ${error.message}`
    };
  }
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  console.log('🔍 Starting health check...');
  
  const checks = {
    app: await checkAppHealth(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    infrastructure: await checkInfrastructure()
  };

  const healthyChecks = Object.values(checks).filter(check => check.status === 'healthy').length;
  const totalChecks = Object.keys(checks).length;
  
  const overallHealth = {
    status: healthyChecks === totalChecks ? 'healthy' : 
            healthyChecks > totalChecks / 2 ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: checks,
    summary: {
      healthy: healthyChecks,
      total: totalChecks,
      percentage: Math.round((healthyChecks / totalChecks) * 100)
    }
  };

  // Log results
  console.log(`📊 Health Check Results:`);
  console.log(`   Overall: ${overallHealth.status.toUpperCase()}`);
  console.log(`   Healthy: ${healthyChecks}/${totalChecks} (${overallHealth.summary.percentage}%)`);
  
  Object.entries(checks).forEach(([service, result]) => {
    const icon = result.status === 'healthy' ? '✅' : 
                 result.status === 'degraded' ? '⚠️' : '❌';
    console.log(`   ${icon} ${service}: ${result.status}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  return overallHealth;
}

/**
 * Exit with appropriate code based on health status
 */
async function main() {
  try {
    const health = await performHealthCheck();
    
    if (health.status === 'healthy') {
      console.log('✅ Health check passed');
      process.exit(0);
    } else if (health.status === 'degraded') {
      console.log('⚠️ Health check degraded - some services are unhealthy');
      // In production, you might want to exit with 0 for degraded state
      // to avoid unnecessary container restarts
      process.exit(NODE_ENV === 'production' ? 0 : 1);
    } else {
      console.log('❌ Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Health check error:', error.message);
    process.exit(1);
  }
}

// Handle signals gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, exiting...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, exiting...');
  process.exit(0);
});

// Run health check if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  performHealthCheck,
  checkAppHealth,
  checkDatabase,
  checkRedis,
  checkInfrastructure
};
