import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import CanvasRenderer from '../src/components/CanvasRenderer.vue'
import type { GridColumn, Item, GridCell, GridSelection } from '../src/types/data-grid-types.js'
import { GridCellKind, CompactSelection } from '../src/types/data-grid-types.js'

const meta = {
  title: 'Vue Components/CanvasRenderer',
  component: CanvasRenderer,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 1000 } },
    rowHeight: { control: { type: 'number', min: 20, max: 100 } },
    headerHeight: { control: { type: 'number', min: 20, max: 100 } },
    width: { control: 'text' },
    height: { control: 'text' }
  }
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// 基础数据生成函数
const generateColumns = (): GridColumn[] => [
  { title: 'ID', width: 60 },
  { title: 'Name', width: 150 },
  { title: 'Age', width: 80 },
  { title: 'Email', width: 200 }
]

const getCellContent = (cell: Item): GridCell => {
  const [col, row] = cell
  
  switch (col) {
    case 0: // ID
      return {
        kind: GridCellKind.Number,
        data: row + 1,
        displayData: String(row + 1),
        allowOverlay: false
      }
    case 1: // Name
      return {
        kind: GridCellKind.Text,
        data: `User ${row + 1}`,
        displayData: `User ${row + 1}`,
        allowOverlay: true
      }
    case 2: // Age
      return {
        kind: GridCellKind.Number,
        data: 20 + (row % 40),
        displayData: String(20 + (row % 40)),
        allowOverlay: true
      }
    case 3: // Email
      return {
        kind: GridCellKind.Text,
        data: `user${row + 1}@example.com`,
        displayData: `user${row + 1}@example.com`,
        allowOverlay: true
      }
    default:
      return {
        kind: GridCellKind.Text,
        data: '',
        displayData: '',
        allowOverlay: true
      }
  }
}

// 基础示例
export const Basic: Story = {
  args: {
    columns: generateColumns(),
    rows: 30,
    getCellContent
  },
  render: (args) => ({
    components: { CanvasRenderer },
    setup() {
      const selection = ref<GridSelection>({
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
        current: undefined
      })

      const handleCellClicked = (cell: Item, event: MouseEvent) => {
        console.log('Canvas cell clicked:', cell, event)
      }

      const handleSelectionChanged = (newSelection: GridSelection) => {
        console.log('Canvas selection changed:', newSelection)
        selection.value = newSelection
      }

      const handleScrollChanged = (x: number, y: number) => {
        console.log('Canvas scroll changed:', x, y)
      }

      return {
        args,
        selection,
        handleCellClicked,
        handleSelectionChanged,
        handleScrollChanged
      }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <CanvasRenderer
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          :selection="selection"
          @cell-clicked="handleCellClicked"
          @selection-changed="handleSelectionChanged"
          @scroll-changed="handleScrollChanged"
          width="600px"
          height="400px"
        />
      </div>
    `
  })
}

// 不同单元格类型示例
export const MixedCellTypes: Story = {
  args: {
    columns: [
      { title: 'Text', width: 120 },
      { title: 'Number', width: 100 },
      { title: 'Loading', width: 100 },
      { title: 'Status', width: 100 }
    ],
    rows: 15,
    getCellContent: (cell: Item) => {
      const [col, row] = cell
      
      switch (col) {
        case 0: // Text
          return {
            kind: GridCellKind.Text,
            data: `Text ${row + 1}`,
            displayData: `Text ${row + 1}`,
            allowOverlay: true
          }
        case 1: // Number
          return {
            kind: GridCellKind.Number,
            data: (row + 1) * 10,
            displayData: String((row + 1) * 10),
            allowOverlay: true
          }
        case 2: // Loading
          return {
            kind: GridCellKind.Loading,
            allowOverlay: false
          }
        case 3: // Status
          const statuses = ['Active', 'Inactive', 'Pending']
          return {
            kind: GridCellKind.Text,
            data: statuses[row % statuses.length],
            displayData: statuses[row % statuses.length],
            allowOverlay: true
          }
        default:
          return {
            kind: GridCellKind.Text,
            data: '',
            displayData: '',
            allowOverlay: true
          }
      }
    }
  },
  render: (args) => ({
    components: { CanvasRenderer },
    setup() {
      return { args }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <CanvasRenderer
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          width="500px"
          height="300px"
        />
      </div>
    `
  })
}

// 选择示例
export const WithSelection: Story = {
  args: {
    columns: generateColumns(),
    rows: 20,
    getCellContent
  },
  render: (args) => ({
    components: { CanvasRenderer },
    setup() {
      const selection = ref<GridSelection>({
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
        current: {
          cell: [1, 2] as [number, number],
          range: { x: 1, y: 2, width: 2, height: 3 },
          rangeStack: []
        }
      })

      const handleSelectionChanged = (newSelection: GridSelection) => {
        console.log('Selection changed:', newSelection)
        selection.value = newSelection
      }

      return {
        args,
        selection,
        handleSelectionChanged
      }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <CanvasRenderer
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          :selection="selection"
          @selection-changed="handleSelectionChanged"
          width="600px"
          height="400px"
        />
      </div>
    `
  })
}

// 自定义主题示例
export const CustomTheme: Story = {
  args: {
    columns: generateColumns(),
    rows: 15,
    getCellContent,
    theme: {
      accentColor: '#10B981',
      textDark: '#1F2937',
      bgCell: '#ECFDF5',
      bgHeader: '#D1FAE5',
      borderColor: '#A7F3D0',
      textHeader: '#065F46'
    }
  },
  render: (args) => ({
    components: { CanvasRenderer },
    setup() {
      return { args }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <CanvasRenderer
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          :theme="args.theme"
          width="600px"
          height="300px"
        />
      </div>
    `
  })
}