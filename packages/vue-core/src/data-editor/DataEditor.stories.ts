import type { Meta, StoryObj } from '@storybook/vue3';
import DataEditor from './DataEditor.vue';
import { GridCellKind, type GridColumn, type Item } from '../internal/data-grid/data-grid-types.js';

// Sample data for stories
const sampleData = [
  { name: "Deidre Morris", company: "GONKLE", email: "deidremorris@gonkle.com", phone: "+1 (867) 507-3332" },
  { name: "Sheryl Craig", company: "EVENTAGE", email: "sherylcraig@eventage.com", phone: "+1 (869) 520-2227" },
  { name: "Lidia Bowers", company: "ANOCHA", email: "lidiabowers@anocha.com", phone: "+1 (808) 414-3826" },
  { name: "Jones Norton", company: "REPETWIRE", email: "jonesnorton@repetwire.com", phone: "+1 (875) 582-3320" },
  { name: "Lula Bruce", company: "COMDOM", email: "lulabruce@comdom.com", phone: "+1 (873) 452-2472" },
  { name: "Larsen Montgomery", company: "SQUISH", email: "larsenmontgomery@squish.com", phone: "+1 (893) 482-3651" },
  { name: "Becky Bright", company: "COMCUR", email: "beckybright@comcur.com", phone: "+1 (879) 494-2331" },
  { name: "Charlotte Rowland", company: "FROLIX", email: "charlotterowland@frolix.com", phone: "+1 (861) 439-2134" },
  { name: "Sonya Hensley", company: "GEEKETRON", email: "sonyahensley@geeketron.com", phone: "+1 (802) 553-2194" },
  { name: "Stephenson Guthrie", company: "EXOSWITCH", email: "stephensonguthrie@exoswitch.com", phone: "+1 (903) 449-3271" },
];

const columns: GridColumn[] = [
  { title: "Name", width: 150 },
  { title: "Company", width: 150 },
  { title: "Email", width: 200 },
  { title: "Phone", width: 150 },
];

const getCellContent = (cell: Item) => {
  const [col, row] = cell;
  const dataRow = sampleData[row];
  const keys: (keyof typeof sampleData[0])[] = ["name", "company", "email", "phone"];
  const data = dataRow[keys[col]];
  
  return {
    kind: GridCellKind.Text,
    allowOverlay: true,
    displayData: data,
    data: data,
  };
};

const meta: Meta<typeof DataEditor> = {
  title: 'Glide-Data-Grid-Vue/DataEditor',
  component: DataEditor,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
    rows: { control: 'number' },
    rowHeight: { control: 'number' },
    editable: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    width: 800,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: true,
  },
};

export const DarkTheme: Story = {
  args: {
    width: 800,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: true,
    theme: {
      baseTheme: 'dark',
    },
  },
};

export const LargeDataset: Story = {
  args: {
    width: 1000,
    height: 600,
    columns,
    rows: 1000,
    getCellContent: (cell: Item) => {
      const [col, row] = cell;
      const dataRow = sampleData[row % sampleData.length];
      const keys: (keyof typeof sampleData[0])[] = ["name", "company", "email", "phone"];
      const data = dataRow[keys[col]];
      
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        displayData: `${data} (${row})`,
        data: `${data} (${row})`,
      };
    },
    editable: true,
  },
};

export const ReadOnly: Story = {
  args: {
    width: 800,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: false,
  },
};

export const CustomRowHeight: Story = {
  args: {
    width: 800,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: true,
    rowHeight: 45,
  },
};