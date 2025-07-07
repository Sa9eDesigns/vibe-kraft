import { db } from "@/lib/db";

export const getUserOrganizations = async (userId: string) => {
  try {
    const memberships = await db.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return memberships.map(membership => ({
      ...membership.organization,
      role: membership.role,
      memberCount: membership.organization._count.members,
      projectCount: membership.organization._count.projects,
    }));
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
};

export const getOrganizationById = async (id: string) => {
  try {
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        projects: {
          include: {
            _count: {
              select: {
                tasks: true,
              },
            },
          },
        },
      },
    });
    return organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
};

export const getOrganizationBySlug = async (slug: string) => {
  try {
    const organization = await db.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });
    return organization;
  } catch (error) {
    console.error("Error fetching organization by slug:", error);
    return null;
  }
};

export const getUserOrganizationRole = async (userId: string, organizationId: string) => {
  try {
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
    return membership?.role || null;
  } catch (error) {
    console.error("Error fetching user organization role:", error);
    return null;
  }
};

export const getOrganizationMembers = async (organizationId: string) => {
  try {
    const members = await db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return members;
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return [];
  }
};