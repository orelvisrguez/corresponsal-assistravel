import useSWR from 'swr'
import { FiltroPeriodo } from '@/lib/dashboardUtils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useDashboardData(periodo: FiltroPeriodo = 'actual', autoRefresh: boolean = true, refreshInterval: number = 30000) {
    const {
        data,
        error,
        isLoading,
        mutate,
        isValidating
    } = useSWR(`/api/dashboard/stats?periodo=${periodo}`, fetcher, {
        refreshInterval: autoRefresh ? refreshInterval : 0,
        revalidateOnFocus: true,
        keepPreviousData: true // Keep showing previous data while fetching new period
    })

    return {
        stats: data,
        isLoading,
        isError: error,
        mutate,
        isValidating
    }
}
