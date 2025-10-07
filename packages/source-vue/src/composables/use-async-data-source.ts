import { ref, computed, type Ref } from 'vue'

// 简化的类型定义
export interface GridCell {
    kind: number
    data?: any
    displayData?: string
    allowOverlay?: boolean
}

export interface Item extends Array<number> {
    0: number // column
    1: number // row
}

export interface GridColumn {
    title: string
    width: number
    icon?: string
    hasMenu?: boolean
    style?: string
    themeOverride?: any
}

export interface AsyncDataSourceOptions {
    getData: (range: { x: number; y: number; width: number; height: number }) => Promise<GridCell[][]>
    columns: GridColumn[]
    rowCount: number
    batchSize?: number
}

export function useAsyncDataSource(options: AsyncDataSourceOptions) {
    const { getData, columns, rowCount, batchSize = 100 } = options
    
    const loading = ref(false)
    const error = ref<Error | null>(null)
    const data = ref<Map<string, GridCell>>(new Map())
    
    const getCellContent = (cell: Item): GridCell => {
        const [col, row] = cell
        const key = `${col},${row}`
        
        if (data.value.has(key)) {
            return data.value.get(key)!
        }
        
        // 返回加载状态单元格
        return {
            kind: 1, // GridCellKind.Loading
            allowOverlay: false
        } as GridCell
    }
    
    const loadData = async (range: { x: number; y: number; width: number; height: number }) => {
        loading.value = true
        error.value = null
        
        try {
            const newData = await getData(range)
            
            // 将数据存储到 Map 中
            for (let row = 0; row < newData.length; row++) {
                for (let col = 0; col < newData[row].length; col++) {
                    const actualRow = range.y + row
                    const actualCol = range.x + col
                    const key = `${actualCol},${actualRow}`
                    data.value.set(key, newData[row][col])
                }
            }
        } catch (err) {
            error.value = err as Error
        } finally {
            loading.value = false
        }
    }
    
    return {
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        getCellContent,
        loadData,
        refresh: () => {
            data.value.clear()
            // 重新加载可见区域的数据
        }
    }
}