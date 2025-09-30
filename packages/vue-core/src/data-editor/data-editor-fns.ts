import type { GridCell, GridSelection, Rectangle, CellArray, GetCellsThunk } from "../internal/data-grid/data-grid-types.js";
import { createBufferFromGridCells, createTextBuffer, type CopyBuffer } from "./copy-paste.js";

/**
 * 扩展选择范围，确保当单元格存在跨列 `span` 时，选择范围自动扩展到完整的 `span` 区域。
 * 等价于 React 版本的实现，适配 Vue Core 类型结构。
 */
export function expandSelection(
    newVal: GridSelection,
    getCellsForSelection: ((selection: Rectangle, abortSignal: AbortSignal) => GetCellsThunk | CellArray) | undefined,
    rowMarkerOffset: number,
    spanRangeBehavior: "allowPartial" | "default",
    abortController: AbortController
): GridSelection {
    const origVal = newVal;
    if (spanRangeBehavior === "allowPartial" || newVal.current === undefined || getCellsForSelection === undefined)
        return newVal;

    let isFilled = false;
    do {
        if (newVal?.current === undefined) break;
        const r: Rectangle = newVal.current?.range;
        const cells: (readonly GridCell[])[] = [];

        if (r.width > 2) {
            const leftCells = getCellsForSelection(
                { x: r.x, y: r.y, width: 1, height: r.height },
                abortController.signal
            );
            if (typeof leftCells === "function") return origVal;
            cells.push(...leftCells);

            const rightCells = getCellsForSelection(
                { x: r.x + r.width - 1, y: r.y, width: 1, height: r.height },
                abortController.signal
            );
            if (typeof rightCells === "function") return origVal;
            cells.push(...rightCells);
        } else {
            const rCells = getCellsForSelection(
                { x: r.x, y: r.y, width: r.width, height: r.height },
                abortController.signal
            );
            if (typeof rCells === "function") return origVal;
            cells.push(...rCells);
        }

        let left = r.x - rowMarkerOffset;
        let right = r.x + r.width - 1 - rowMarkerOffset;
        for (const row of cells) {
            for (const cell of row) {
                if (cell.span === undefined) continue;
                left = Math.min(cell.span[0], left);
                right = Math.max(cell.span[1], right);
            }
        }

        if (left === r.x - rowMarkerOffset && right === r.x + r.width - 1 - rowMarkerOffset) {
            isFilled = true;
        } else {
            newVal = {
                current: {
                    cell: newVal.current.cell ?? [0, 0],
                    range: { x: left + rowMarkerOffset, y: r.y, width: right - left + 1, height: r.height },
                    rangeStack: newVal.current.rangeStack,
                },
                columns: newVal.columns,
                rows: newVal.rows,
            };
        }
    } while (!isFilled);
    return newVal;
}

/**
 * 去除 Excel/TSV 风格的引号并处理双引号转义。
 */
function descape(s: string): string {
    if (s.startsWith('"') && s.endsWith('"')) {
        s = s.slice(1, -1).replace(/""/g, '"');
    }
    return s;
}

/**
 * 解析 TSV/CSV 文本到 CopyBuffer 结构，兼容带引号单元格与转义。
 */
export function unquote(str: string): CopyBuffer {
    const enum State {
        None,
        inString,
        inStringPostQuote,
    }

    const result: string[][] = [];
    let current: string[] = [];

    let start = 0;
    let state = State.None;
    str = str.replace(/\r\n/g, "\n");
    let index = 0;
    for (const char of str) {
        switch (state) {
            case State.None:
                if (char === "\t" || char === "\n") {
                    current.push(str.slice(start, index));
                    start = index + 1;
                    if (char === "\n") {
                        result.push(current);
                        current = [];
                    }
                } else if (char === '"') {
                    state = State.inString;
                }
                break;
            case State.inString:
                if (char === '"') {
                    state = State.inStringPostQuote;
                }
                break;
            case State.inStringPostQuote:
                if (char === '"') {
                    state = State.inString;
                } else if (char === "\t" || char === "\n") {
                    current.push(descape(str.slice(start, index)));
                    start = index + 1;
                    if (char === "\n") {
                        result.push(current);
                        current = [];
                    }
                    state = State.None;
                } else {
                    state = State.None;
                }
                break;
        }
        index++;
    }
    if (start < str.length) {
        current.push(descape(str.slice(start, str.length)));
    }
    result.push(current);
    return result.map(r => r.map(c => ({ rawValue: c, formatted: c, format: "string" } as const)));
}

/**
 * 生成 HTML 文本缓冲，用于高质量粘贴到 Excel/Google Sheets。
 * 注：对空格进行 `<span>` 包裹以避免被折叠。
 */
function formatHtmlTextContent(text: string): string {
    return text.replace(/\t/g, "    ").replace(/ {2,}/g, match => "<span> </span>".repeat(match.length));
}

function formatHtmlAttributeContent(attrText: string): string {
    return '"' + attrText.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '"';
}

/**
 * 将 CopyBuffer 转为 HTML `<table>` 字符串以供剪贴板写入。
 */
function createHtmlBuffer(copyBuffer: CopyBuffer): string {
    const lines: string[] = [];
    lines.push(`<style type="text/css"><!--br {mso-data-placement:same-cell;}--></style>`, "<table><tbody>");
    for (const row of copyBuffer) {
        lines.push("<tr>");
        for (const cell of row) {
            const formatStr = `gdg-format="${cell.format}"`;
            if (cell.format === "url") {
                lines.push(`<td ${formatStr}><a href="${cell.rawValue}">${formatHtmlTextContent(cell.formatted)}</a></td>`);
            } else if (cell.format === "string-array") {
                lines.push(
                    `<td ${formatStr}><ol>${cell.formatted
                        .map((x, ind) => `<li gdg-raw-value=${formatHtmlAttributeContent((cell as any).rawValue[ind])}>` +
                            formatHtmlTextContent(x) +
                            "</li>")
                        .join("")}</ol></td>`
                );
            } else {
                const attrRawValue = (cell as any).rawValue?.toString?.() ?? "";
                lines.push(`<td ${formatStr} gdg-raw-value=${formatHtmlAttributeContent(attrRawValue)}>${formatHtmlTextContent(cell.formatted)}</td>`);
            }
        }
        lines.push("</tr>");
    }
    lines.push("</tbody></table>");
    return lines.join("");
}

/**
 * 组合生成纯文本与 HTML 文本以供剪贴板写入。
 */
function getCopyBufferContents(
    cells: readonly (readonly GridCell[])[],
    columnIndexes: readonly number[]
): { readonly textPlain: string; readonly textHtml: string } {
    const copyBuffer = createBufferFromGridCells(cells, columnIndexes);
    const textPlain = createTextBuffer(copyBuffer);
    const textHtml = createHtmlBuffer(copyBuffer);
    return { textPlain, textHtml };
}

/**
 * 将表格单元格内容复制到剪贴板。支持写入 `text/plain` 与 `text/html` 两种 MIME。
 */
export function copyToClipboard(
    cells: readonly (readonly GridCell[])[],
    columnIndexes: readonly number[],
    e?: ClipboardEvent
): void {
    const { textPlain, textHtml } = getCopyBufferContents(cells, columnIndexes);

    const copyWithWriteText = (s: string) => {
        try {
            void window.navigator.clipboard?.writeText(s);
        } catch (err) {
            // 忽略错误：某些环境不支持写入剪贴板
            console.warn("clipboard.writeText failed", err);
        }
    };

    const copyWithWrite = (s: string, html: string): boolean => {
        if (window.navigator.clipboard?.write === undefined) return false;
        try {
            void window.navigator.clipboard.write([
                new ClipboardItem({
                    "text/plain": new Blob([s], { type: "text/plain" }),
                    "text/html": new Blob([html], { type: "text/html" }),
                }),
            ]);
            return true;
        } catch (err) {
            console.warn("clipboard.write failed", err);
            return false;
        }
    };

    const copyWithClipboardData = (s: string, html: string) => {
        try {
            if (e === undefined || e.clipboardData === null) throw new Error("No clipboard data");
            e?.clipboardData?.setData("text/plain", s);
            e?.clipboardData?.setData("text/html", html);
        } catch {
            if (!copyWithWrite(s, html)) {
                copyWithWriteText(s);
            }
        }
    };

    if (window.navigator.clipboard?.write !== undefined || e?.clipboardData !== undefined) {
        void copyWithClipboardData(textPlain, textHtml);
    } else {
        copyWithWriteText(textPlain);
    }

    e?.preventDefault();
}

/**
 * 复选框行为：true -> unchecked, false -> checked, indeterminate -> checked, empty -> checked。
 */
export function toggleBoolean(data: boolean | null | undefined): boolean | null | undefined {
    return data !== true;
}