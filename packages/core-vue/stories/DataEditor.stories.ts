import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import DataEditor from '../src/components/DataEditor.vue'
import type { GridColumn, Item, GridCell, GridSelection } from '../src/types/data-grid-types.js'
import { GridCellKind, CompactSelection } from '../src/types/data-grid-types.js'

const meta = {
  title: 'Vue Components/DataEditor',
  component: DataEditor,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: { type: 'number', min: 1, max: 1000 } },
    rowHeight: { control: { type: 'number', min: 20, max: 100 } },
    headerHeight: { control: { type: 'number', min: 20, max: 100 } },
    width: { control: 'text' },
    height: { control: 'text' }
  }
} satisfies Meta<typeof DataEditor>

export default meta
type Story = StoryObj<typeof meta>

// 基础数据生成函数
const generateColumns = (): GridColumn[] => [
  { title: 'ID', width: 60 },
  { title: 'Name', width: 150 },
  { title: 'Age', width: 80 },
  { title: 'Email', width: 200 },
  { title: 'Status', width: 100 },
  { title: 'Score', width: 80 }
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
    case 4: // Status
      const statuses = ['Active', 'Inactive', 'Pending', 'Completed']
      return {
        kind: GridCellKind.Text,
        data: statuses[row % statuses.length],
        displayData: statuses[row % statuses.length],
        allowOverlay: true
      }
    case 5: // Score
      return {
        kind: GridCellKind.Number,
        data: Math.floor(Math.random() * 100),
        displayData: String(Math.floor(Math.random() * 100)),
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
    rows: 50,
    getCellContent
  },
  render: (args) => ({
    components: { DataEditor },
    setup() {
      const selection = ref<GridSelection>({
        columns: CompactSelection.empty(),
        rows: CompactSelection.empty(),
        current: undefined
      })

      const handleCellClicked = (cell: Item, event: MouseEvent) => {
        console.log('Cell clicked:', cell, event)
      }

      const handleSelectionChanged = (newSelection: GridSelection) => {
        console.log('Selection changed:', newSelection)
        selection.value = newSelection
      }

      return {
        args,
        selection,
        handleCellClicked,
        handleSelectionChanged
      }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <DataEditor
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          :selection="selection"
          @cell-clicked="handleCellClicked"
          @selection-changed="handleSelectionChanged"
          width="800px"
          height="400px"
        />
      </div>
    `
  })
}

// 小表格示例
export const SmallTable: Story = {
  args: {
    columns: [
      { title: 'ID', width: 50 },
      { title: 'Name', width: 120 },
      { title: 'Value', width: 80 }
    ],
    rows: 10,
    getCellContent: (cell: Item) => {
      const [col, row] = cell
      switch (col) {
        case 0:
          return { kind: GridCellKind.Number, data: row + 1, displayData: String(row + 1), allowOverlay: false }
        case 1:
          return { kind: GridCellKind.Text, data: `Item ${row + 1}`, displayData: `Item ${row + 1}`, allowOverlay: true }
        case 2:
          return { kind: GridCellKind.Number, data: (row + 1) * 10, displayData: String((row + 1) * 10), allowOverlay: true }
        default:
          return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: true }
      }
    }
  },
  render: (args) => ({
    components: { DataEditor },
    setup() {
      return { args }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <DataEditor
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          width="300px"
          height="300px"
        />
      </div>
    `
  })
}

// 大表格示例
export const LargeTable: Story = {
  args: {
    columns: generateColumns().concat([
      { title: 'Department', width: 120 },
      { title: 'Location', width: 100 },
      { title: 'Salary', width: 100 },
      { title: 'Start Date', width: 120 }
    ]),
    rows: 200,
    getCellContent: (cell: Item) => {
      const [col, row] = cell
      const baseContent = getCellContent(cell)
      
      if (col >= 6) {
        switch (col) {
          case 6: // Department
            const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance']
            return { 
              kind: GridCellKind.Text, 
              data: departments[row % departments.length], 
              displayData: departments[row % departments.length], 
              allowOverlay: true 
            }
          case 7: // Location
            const locations = ['New York', 'San Francisco', 'London', 'Tokyo', 'Berlin']
            return { 
              kind: GridCellKind.Text, 
              data: locations[row % locations.length], 
              displayData: locations[row % locations.length], 
              allowOverlay: true 
            }
          case 8: // Salary
            return { 
              kind: GridCellKind.Number, 
              data: 50000 + (row * 1000), 
              displayData: `$${(50000 + (row * 1000)).toLocaleString()}`, 
              allowOverlay: true 
            }
          case 9: // Start Date
            const date = new Date(2020 + (row % 4), row % 12, (row % 28) + 1)
            return { 
              kind: GridCellKind.Text, 
              data: date.toISOString().split('T')[0], 
              displayData: date.toLocaleDateString(), 
              allowOverlay: true 
            }
        }
      }
      
      return baseContent
    }
  },
  render: (args) => ({
    components: { DataEditor },
    setup() {
      return { args }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <DataEditor
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          width="1000px"
          height="600px"
        />
      </div>
    `
  })
}

// 自定义主题示例
export const CustomTheme: Story = {
  args: {
    columns: generateColumns(),
    rows: 20,
    getCellContent,
    theme: {
      accentColor: '#FF6B6B',
      textDark: '#2D3748',
      bgCell: '#F7FAFC',
      bgHeader: '#E2E8F0',
      borderColor: '#CBD5E0'
    }
  },
  render: (args) => ({
    components: { DataEditor },
    setup() {
      return { args }
    },
    template: `
      <div style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
        <DataEditor
          :columns="args.columns"
          :rows="args.rows"
          :getCellContent="args.getCellContent"
          :theme="args.theme"
          width="800px"
          height="400px"
        />
      </div>
    `
  })
}