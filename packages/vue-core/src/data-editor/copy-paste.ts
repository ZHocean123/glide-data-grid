import { assertNever } from '../common/support.js'
import {
  BooleanEmpty,
  BooleanIndeterminate,
  type GridCell,
} from '../internal/data-grid/data-grid-types.js'

type StringArrayCellBuffer = {
  formatted: string[]
  rawValue: string[]
  format: "string-array"
  doNotEscape?: boolean
}

type BasicCellBuffer = {
  formatted: string
  rawValue: string | number | boolean | BooleanEmpty | BooleanIndeterminate | undefined
  format: "string" | "number" | "boolean" | "url"
  doNotEscape?: boolean
}

export type CellBuffer = StringArrayCellBuffer | BasicCellBuffer
export type CopyBuffer = CellBuffer[][]

function convertCellToBuffer(cell: GridCell): CellBuffer {
  if (cell.copyData !== undefined) {
    return {
      formatted: cell.copyData,
      rawValue: cell.copyData,
      format: "string",
      // Do not escape the copy value if it was explicitly specified via copyData:
      doNotEscape: true,
    }
  }

  switch (cell.kind) {
    case 'boolean':
      return {
        formatted:
          cell.data === true
            ? "TRUE"
            : cell.data === false
            ? "FALSE"
            : cell.data === BooleanIndeterminate
            ? "INDETERMINATE"
            : "",
        rawValue: cell.data,
        format: "boolean",
      }
    case 'custom':
      return {
        formatted: cell.copyData || '',
        rawValue: cell.copyData || '',
        format: "string",
      }
    case 'image':
    case 'bubble':
      return {
        formatted: cell.data || [],
        rawValue: cell.data || [],
        format: "string-array",
      }
    case 'drilldown':
      return {
        formatted: cell.data?.map(x => x.text) || [],
        rawValue: cell.data?.map(x => x.text) || [],
        format: "string-array",
      }
    case 'text':
      return {
        formatted: cell.displayData ?? cell.data ?? '',
        rawValue: cell.data ?? '',
        format: "string",
      }
    case 'uri':
      return {
        formatted: cell.displayData ?? cell.data ?? '',
        rawValue: cell.data ?? '',
        format: "url",
      }
    case 'markdown':
    case 'row-id':
      return {
        formatted: cell.data ?? '',
        rawValue: cell.data ?? '',
        format: "string",
      }
    case 'number':
      return {
        formatted: cell.displayData ?? cell.data?.toString() ?? '',
        rawValue: cell.data ?? '',
        format: "number",
      }
    case 'loading':
      return {
        formatted: "#LOADING",
        rawValue: "",
        format: "string",
      }
    case 'protected':
      return {
        formatted: "************",
        rawValue: "",
        format: "string",
      }
    default:
      assertNever(cell)
      return {
        formatted: '',
        rawValue: '',
        format: "string",
      }
  }
}

export function createBufferFromGridCells(
  cells: readonly (readonly GridCell[])[],
  columnIndexes: readonly number[]
): CopyBuffer {
  const copyBuffer: CopyBuffer = cells.map((row, index) => {
    const mappedIndex = columnIndexes[index]
    return row.map(cell => {
      if (cell.span !== undefined && cell.span[0] !== mappedIndex)
        return {
          formatted: "",
          rawValue: "",
          format: "string",
        }
      return convertCellToBuffer(cell)
    })
  })
  return copyBuffer
}

function escapeIfNeeded(str: string, withComma: boolean): string {
  if ((withComma ? /[\t\n",]/ : /[\t\n"]/).test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function createTextBuffer(copyBuffer: CopyBuffer): string {
  const lines: string[] = []
  for (const row of copyBuffer) {
    const line: string[] = []
    for (const cell of row) {
      if (cell.format === "url") {
        line.push(cell.rawValue?.toString() ?? "")
      } else if (cell.format === "string-array") {
        line.push(cell.formatted.map(x => escapeIfNeeded(x, true)).join(","))
      } else {
        line.push(cell.doNotEscape === true ? cell.formatted : escapeIfNeeded(cell.formatted, false))
      }
    }
    lines.push(line.join("\t"))
  }
  return lines.join("\n")
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    return new Promise((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject()
      textArea.remove()
    })
  }
}

export function decodeHTML(html: string): string {
  const txt = document.createElement("textarea")
  txt.innerHTML = html
  return txt.value
}

export function parsePasteData(data: string): string[][] {
  const result: string[][] = []
  const lines = data.split(/\r?\n/)

  for (const line of lines) {
    if (line.trim() === '') continue

    const row: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
        } else if (char === quoteChar) {
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            // Escaped quote
            current += char
            i++ // Skip next quote
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else if (char === '\t' && !inQuotes) {
        row.push(current)
        current = ''
      } else {
        current += char
      }
    }

    row.push(current)
    result.push(row)
  }

  return result
}
