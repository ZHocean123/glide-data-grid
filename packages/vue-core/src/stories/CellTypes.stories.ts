import type { Meta, StoryObj } from '@storybook/vue3';
import DataEditor from '../data-editor/DataEditor.vue';
import { 
  GridCellKind, 
  type GridCell, 
  type GridColumn, 
  type Item,
  type TextCell,
  type NumberCell,
  type BooleanCell,
  type ImageCell,
  type UriCell,
  type MarkdownCell
} from '../internal/data-grid/data-grid-types.js';

const columns: GridColumn[] = [
  { title: "Text", width: 150 },
  { title: "Number", width: 120 },
  { title: "Boolean", width: 100 },
  { title: "Image", width: 200 },
  { title: "URI", width: 200 },
  { title: "Markdown", width: 250 },
];

const sampleData = [
  { text: "John Doe", number: 42, boolean: true, image: "https://picsum.photos/100/100?random=1", uri: "https://example.com", markdown: "**Bold** text" },
  { text: "Jane Smith", number: 3.14, boolean: false, image: "https://picsum.photos/100/100?random=2", uri: "https://google.com", markdown: "*Italic* text" },
  { text: "Bob Johnson", number: -7, boolean: null, image: "https://picsum.photos/100/100?random=3", uri: "https://github.com", markdown: "# Heading" },
  { text: "Alice Brown", number: 0, boolean: undefined, image: "https://picsum.photos/100/100?random=4", uri: "https://stackoverflow.com", markdown: "```code```" },
  { text: "Charlie Wilson", number: 1000000, boolean: true, image: "https://picsum.photos/100/100?random=5", uri: "https://twitter.com", markdown: "[Link](https://example.com)" },
];

const getCellContent = (cell: Item): GridCell => {
  const [col, row] = cell;
  const dataRow = sampleData[row];
  
  switch (col) {
    case 0: // Text
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        displayData: dataRow.text,
        data: dataRow.text,
      } as TextCell;
      
    case 1: // Number
      return {
        kind: GridCellKind.Number,
        allowOverlay: true,
        displayData: dataRow.number.toString(),
        data: dataRow.number,
      } as NumberCell;
      
    case 2: // Boolean
      return {
        kind: GridCellKind.Boolean,
        allowOverlay: false,
        data: dataRow.boolean,
        readonly: false,
      } as BooleanCell;
      
    case 3: // Image
      return {
        kind: GridCellKind.Image,
        allowOverlay: true,
        data: [dataRow.image],
      } as ImageCell;
      
    case 4: // URI
      return {
        kind: GridCellKind.Uri,
        allowOverlay: true,
        displayData: dataRow.uri,
        data: dataRow.uri,
      } as UriCell;
      
    case 5: // Markdown
      return {
        kind: GridCellKind.Markdown,
        allowOverlay: true,
        data: dataRow.markdown,
      } as MarkdownCell;
      
    default:
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        displayData: "",
        data: "",
      } as TextCell;
  }
};

const meta: Meta<typeof DataEditor> = {
  title: 'Glide-Data-Grid-Vue/Cell Types',
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

export const AllCellTypes: Story = {
  args: {
    width: 1000,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: true,
  },
};

export const EditableCells: Story = {
  args: {
    width: 1000,
    height: 400,
    columns: columns.slice(0, 3), // Only first 3 columns are editable
    rows: sampleData.length,
    getCellContent: (cell: Item): GridCell => {
      const [col, row] = cell;
      const dataRow = sampleData[row];
      
      switch (col) {
        case 0: // Text
          return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            displayData: dataRow.text,
            data: dataRow.text,
          } as TextCell;
          
        case 1: // Number
          return {
            kind: GridCellKind.Number,
            allowOverlay: true,
            displayData: dataRow.number.toString(),
            data: dataRow.number,
          } as NumberCell;
          
        case 2: // Boolean
          return {
            kind: GridCellKind.Boolean,
            allowOverlay: false,
            data: dataRow.boolean,
            readonly: false,
          } as BooleanCell;
          
        default:
          return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            displayData: "",
            data: "",
          } as TextCell;
      }
    },
    editable: true,
  },
};

export const ReadOnlyCells: Story = {
  args: {
    width: 1000,
    height: 400,
    columns,
    rows: sampleData.length,
    getCellContent,
    editable: false,
  },
};