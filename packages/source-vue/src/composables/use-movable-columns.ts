import { ref, computed, type Ref } from 'vue'

export interface GridColumn {
    title: string
    width: number
    icon?: string
    hasMenu?: boolean
    style?: string
    themeOverride?: any
}

export function useMovableColumns(initialColumns: GridColumn[]) {
    const columns = ref<GridColumn[]>([...initialColumns])
    
    const moveColumn = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return
        
        const newColumns = [...columns.value]
        const [movedColumn] = newColumns.splice(fromIndex, 1)
        newColumns.splice(toIndex, 0, movedColumn)
        
        columns.value = newColumns
    }
    
    const resetColumns = () => {
        columns.value = [...initialColumns]
    }
    
    return {
        columns: computed(() => columns.value),
        moveColumn,
        resetColumns
    }
}