import { create } from 'zustand';

interface Organization {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setOrganizations: (organizations: Organization[]) => void;
  setCurrentOrganization: (organization: Organization) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: null,
  setOrganizations: (organizations) => set({ organizations }),
  setCurrentOrganization: (organization) => set({ currentOrganization: organization }),
}));