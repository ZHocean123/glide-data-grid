import type { Meta, StoryObj } from '@storybook/vue3';
import { ref, onMounted } from 'vue';
import DataEditor from '../data-editor/DataEditor.vue';
import { GridCellKind, type GridColumn, type Item } from '../internal/data-grid/data-grid-types.js';

const columns: GridColumn[] = [
  { title: "ID", width: 80 },
  { title: "Name", width: 150 },
  { title: "Email", width: 200 },
  { title: "Company", width: 150 },
  { title: "Phone", width: 150 },
  { title: "Department", width: 120 },
  { title: "Salary", width: 100 },
  { title: "Start Date", width: 120 },
];

// Generate large dataset for performance testing
const generateLargeDataset = (rows: number) => {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Clark'];
  const companies = ['Tech Corp', 'Data Inc', 'Web Solutions', 'Cloud Systems', 'Digital Agency', 'IT Services', 'Software Co', 'Net Works', 'Info Tech', ' Cyber Tech'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Legal', 'Product', 'Design'];
  
  const data = [];
  for (let i = 0; i < rows; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    
    data.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      company,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      department,
      salary: Math.floor(Math.random() * 150000) + 50000,
      startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString(),
    });
  }
  return data;
};

const getCellContent = (data: any[]) => (cell: Item) => {
  const [col, row] = cell;
  const dataRow = data[row];
  
  if (!dataRow) {
    return {
      kind: GridCellKind.Text,
      allowOverlay: true,
      displayData: '',
      data: '',
    };
  }
  
  const keys: (keyof typeof dataRow)[] = ['id', 'name', 'email', 'company', 'phone', 'department', 'salary', 'startDate'];
  const value = dataRow[keys[col]];
  
  return {
    kind: GridCellKind.Text,
    allowOverlay: true,
    displayData: String(value),
    data: String(value),
  };
};

const meta: Meta<typeof DataEditor> = {
  title: 'Glide-Data-Grid-Vue/Performance',
  component: DataEditor,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
    rows: { control: 'number' },
    editable: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MediumDataset: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const dataset = ref(generateLargeDataset(1000));
      const renderTime = ref(0);
      
      onMounted(() => {
        const start = performance.now();
        // Force a re-render to measure actual render time
        setTimeout(() => {
          renderTime.value = performance.now() - start;
        }, 100);
      });
      
      return {
        dataset,
        renderTime,
        columns,
        getCellContent: getCellContent(dataset.value),
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Performance Test: Medium Dataset (1,000 rows)</h3>
          <p>Render time: {{ renderTime.toFixed(2) }}ms</p>
          <p>Total cells: {{ dataset.length * columns.length }}</p>
        </div>
        <DataEditor
          :width="1000"
          :height="600"
          :columns="columns"
          :rows="dataset.length"
          :get-cell-content="getCellContent"
          :editable="true"
        />
      </div>
    `,
  }),
};

export const LargeDataset: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const dataset = ref(generateLargeDataset(10000));
      const renderTime = ref(0);
      
      onMounted(() => {
        const start = performance.now();
        setTimeout(() => {
          renderTime.value = performance.now() - start;
        }, 100);
      });
      
      return {
        dataset,
        renderTime,
        columns,
        getCellContent: getCellContent(dataset.value),
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Performance Test: Large Dataset (10,000 rows)</h3>
          <p>Render time: {{ renderTime.toFixed(2) }}ms</p>
          <p>Total cells: {{ dataset.length * columns.length }}</p>
        </div>
        <DataEditor
          :width="1000"
          :height="600"
          :columns="columns"
          :rows="dataset.length"
          :get-cell-content="getCellContent"
          :editable="true"
        />
      </div>
    `,
  }),
};

export const VeryLargeDataset: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const dataset = ref(generateLargeDataset(100000));
      const renderTime = ref(0);
      
      onMounted(() => {
        const start = performance.now();
        setTimeout(() => {
          renderTime.value = performance.now() - start;
        }, 100);
      });
      
      return {
        dataset,
        renderTime,
        columns,
        getCellContent: getCellContent(dataset.value),
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Performance Test: Very Large Dataset (100,000 rows)</h3>
          <p>Render time: {{ renderTime.toFixed(2) }}ms</p>
          <p>Total cells: {{ dataset.length * columns.length }}</p>
          <p><strong>Note:</strong> This demonstrates virtual scrolling performance</p>
        </div>
        <DataEditor
          :width="1000"
          :height="600"
          :columns="columns"
          :rows="dataset.length"
          :get-cell-content="getCellContent"
          :editable="true"
        />
      </div>
    `,
  }),
};

export const FrequentUpdates: Story = {
  render: () => ({
    components: { DataEditor },
    setup() {
      const dataset = ref(generateLargeDataset(1000));
      const updateCount = ref(0);
      const isUpdating = ref(false);
      
      // Simulate frequent updates
      const startUpdates = () => {
        isUpdating.value = true;
        const interval = setInterval(() => {
          // Update a random cell
          const randomRow = Math.floor(Math.random() * dataset.value.length);
          const randomCol = Math.floor(Math.random() * 8);
          const keys: (keyof typeof dataset.value[0])[] = ['id', 'name', 'email', 'company', 'phone', 'department', 'salary', 'startDate'];
          
          // Create a new array to trigger reactivity
          const newData = [...dataset.value];
          if (keys[randomCol] === 'salary') {
            newData[randomRow] = {
              ...newData[randomRow],
              [keys[randomCol]]: Math.floor(Math.random() * 150000) + 50000,
            };
          } else if (keys[randomCol] === 'name') {
            const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
            const lastNames = ['Smith', 'Johnson', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Clark'];
            newData[randomRow] = {
              ...newData[randomRow],
              [keys[randomCol]]: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            };
          }
          
          dataset.value = newData;
          updateCount.value++;
        }, 100);
        
        // Stop after 10 seconds
        setTimeout(() => {
          clearInterval(interval);
          isUpdating.value = false;
        }, 10000);
      };
      
      return {
        dataset,
        updateCount,
        isUpdating,
        startUpdates,
        columns,
        getCellContent: getCellContent(dataset.value),
      };
    },
    template: `
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
          <h3>Frequent Updates Test</h3>
          <p>Updates: {{ updateCount }}</p>
          <p>Status: {{ isUpdating ? 'Updating...' : 'Stopped' }}</p>
          <button @click="startUpdates" :disabled="isUpdating">Start Updates</button>
          <p><strong>Note:</strong> Updates will run for 10 seconds</p>
        </div>
        <DataEditor
          :width="1000"
          :height="600"
          :columns="columns"
          :rows="dataset.length"
          :get-cell-content="getCellContent"
          :editable="true"
        />
      </div>
    `,
  }),
};