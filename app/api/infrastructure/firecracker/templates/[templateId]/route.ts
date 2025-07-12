/**
 * Firecracker Template Management API Routes
 * Handles individual template operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { firecrackerService } from '@/lib/infrastructure/services/firecracker';
import { getUserOrganizationRole } from '@/lib/data/organization';

interface RouteParams {
  params: {
    templateId: string;
  };
}

/**
 * DELETE /api/infrastructure/firecracker/templates/[templateId]
 * Delete a WebVM template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = params;
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Check if user has admin permissions for infrastructure access
    // const userRole = await getUserOrganizationRole(session.user.id, organizationId);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const response = await firecrackerService.deleteTemplate(templateId);
    
    if (!response.success) {
      if (response.error?.includes('not found')) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting Firecracker template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
