import { ref, computed, type Ref } from 'vue'

export interface SortConfig {
    columnIndex: number
    direction: 'asc' | 'desc'
}

export function useColumnSort() {
    const sortConfig = ref<SortConfig | null>(null)
    
    const toggleSort = (columnIndex: number) => {
        if (sortConfig.value?.columnIndex === columnIndex) {
            // 切换排序方向
            sortConfig.value = {
                columnIndex,
                direction: sortConfig.value.direction === 'asc' ? 'desc' : 'asc'
            }
        } else {
            // 新列排序
            sortConfig.value = {
                columnIndex,
                direction: 'asc'
            }
        }
    }
    
    const clearSort = () => {
        sortConfig.value = null
    }
    
    const sortData = <T extends Record<string, any>>(data: T[], getValue: (item: T, columnIndex: number) => any) => {
        if (!sortConfig.value) return data
        
        const { columnIndex, direction } = sortConfig.value
        
        return [...data].sort((a, b) => {
            const aValue = getValue(a, columnIndex)
            const bValue = getValue(b, columnIndex)
            
            if (aValue === bValue) return 0
            
            const comparison = aValue < bValue ? -1 : 1
            return direction === 'asc' ? comparison : -comparison
        })
    }
    
    return {
        sortConfig: computed(() => sortConfig.value),
        toggleSort,
        clearSort,
        sortData
    }
}