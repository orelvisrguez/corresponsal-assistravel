import useSWR from 'swr'
import { CasoConCorresponsal, CorresponsalConCasos } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardData {
    casos: CasoConCorresponsal[]
    corresponsales: CorresponsalConCasos[]
    isLoading: boolean
    isError: any
    mutate: () => Promise<any>
    isValidating: boolean
}

export function useDashboardData(autoRefresh: boolean = true, refreshInterval: number = 30000) {
    const {
        data: casos,
        error: casosError,
        isLoading: casosLoading,
        mutate: mutateCasos,
        isValidating: validatingCasos
    } = useSWR<CasoConCorresponsal[]>('/api/casos', fetcher, {
        refreshInterval: autoRefresh ? refreshInterval : 0,
        revalidateOnFocus: true,
    })

    const {
        data: corresponsales,
        error: corresponsalesError,
        isLoading: corresponsalesLoading,
        mutate: mutateCorresponsales,
        isValidating: validatingCorresponsales
    } = useSWR<CorresponsalConCasos[]>('/api/corresponsales', fetcher, {
        refreshInterval: autoRefresh ? refreshInterval : 0,
        revalidateOnFocus: true,
    })

    const mutate = async () => {
        await Promise.all([mutateCasos(), mutateCorresponsales()])
    }

    return {
        casos: casos || [],
        corresponsales: corresponsales || [],
        isLoading: casosLoading || corresponsalesLoading,
        isError: casosError || corresponsalesError,
        mutate,
        isValidating: validatingCasos || validatingCorresponsales
    }
}
