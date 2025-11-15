import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '@/lib/debug-logger';

const execAsync = promisify(exec);
const logger = createLogger('ADK-Service');

export async function POST(req: NextRequest) {
  try {
    logger.log('[start route] Attempting to start ADK service');

    // Check if the ADK service is already running
    try {
      const checkResponse = await fetch('http://localhost:8001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Short timeout for health check
        signal: AbortSignal.timeout(2000),
      });

      if (checkResponse.ok) {
        logger.log('[start route] ADK service is already running');
        return NextResponse.json({
          message: 'ADK service is already running',
          status: 'running'
        });
      }
    } catch (error) {
      // Service is not running, which is expected
      logger.log('[start route] ADK service is not running, will attempt to start it');
    }

    // Determine the correct command based on the platform
    const isWindows = process.platform === 'win32';
    const adkServiceDir = 'adk_service';
    
    let command;
    if (isWindows) {
      // Windows command
      command = `cd ${adkServiceDir} && start cmd /k "python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"`;
    } else {
      // Linux/Mac command
      command = `cd ${adkServiceDir} && nohup python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001 > adk_service.log 2>&1 &`;
    }

    // Execute the command
    logger.log('[start route] Executing command:', command);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      logger.error('[start route] Error starting ADK service:', stderr);
      return NextResponse.json({
        error: `Failed to start ADK service: ${stderr}`,
        command
      }, { status: 500 });
    }

    logger.log('[start route] ADK service start command executed successfully');
    logger.log('[start route] Command output:', stdout);

    // Wait a moment for the service to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the service is running
    try {
      const verifyResponse = await fetch('http://localhost:8001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Short timeout for health check
        signal: AbortSignal.timeout(5000),
      });

      if (verifyResponse.ok) {
        logger.log('[start route] ADK service is now running');
        return NextResponse.json({
          message: 'ADK service started successfully',
          status: 'started'
        });
      } else {
        logger.error('[start route] ADK service health check failed after start attempt');
        return NextResponse.json({
          error: 'ADK service health check failed after start attempt',
          status: 'unknown'
        }, { status: 500 });
      }
    } catch (error) {
      logger.error('[start route] Failed to verify ADK service is running:', error);
      return NextResponse.json({
        error: 'Failed to verify ADK service is running. It might still be starting up.',
        status: 'unknown',
        command
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('[start route] Unhandled error:', error);
    return NextResponse.json({
      error: `Failed to start ADK service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'error'
    }, { status: 500 });
  }
}
