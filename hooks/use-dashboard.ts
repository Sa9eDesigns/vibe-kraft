import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboardStats(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/dashboard/stats?organizationId=${organizationId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    stats: data,
    projects: data?.projects,
    workspaces: data?.workspaces,
    instances: data?.instances,
    overview: data?.overview,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRealtimeStats(organizationId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    organizationId ? `/api/dashboard/stats?organizationId=${organizationId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}
