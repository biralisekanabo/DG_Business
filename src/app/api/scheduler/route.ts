import { NextRequest, NextResponse } from 'next/server';
import ReportScheduler from '@/services/scheduler';

/**
 * API pour contrôler le scheduler des rapports
 * GET /api/scheduler/status - Obtenir le statut du scheduler
 * POST /api/scheduler/start - Démarrer le scheduler
 * POST /api/scheduler/stop - Arrêter le scheduler
 */

// Variable globale pour tracker si le scheduler est déjà démarré
let schedulerStarted = false;

// Auto-start scheduler on first request (both dev and prod)
if (!schedulerStarted && typeof process !== 'undefined') {
  try {
    ReportScheduler.startScheduler();
    schedulerStarted = true;
    console.log('✅ Report scheduler initialized on server startup');
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
  }
}

export async function GET() {
  try {
    const status = ReportScheduler.getStatus();
    return NextResponse.json({
      success: true,
      scheduler: status,
      message: 'Scheduler status retrieved',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      ReportScheduler.startScheduler();
      schedulerStarted = true;
      return NextResponse.json({
        success: true,
        message: 'Scheduler started',
      });
    } else if (action === 'stop') {
      ReportScheduler.stopScheduler();
      schedulerStarted = false;
      return NextResponse.json({
        success: true,
        message: 'Scheduler stopped',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}
