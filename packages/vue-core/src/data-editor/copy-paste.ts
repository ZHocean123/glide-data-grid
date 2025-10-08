/* eslint-disable sonarjs/no-duplicate-string */
import { assertNever } from "../common/support";
import {
    BooleanEmpty,
    BooleanIndeterminate,
    GridCellKind,
    type GridCell,
    type TextCell,
    type NumberCell,
    type BooleanCell,
    type ImageCell,
    type BubbleCell,
    type DrilldownCell,
    type UriCell,
    type MarkdownCell,
    type RowIDCell,
    type CustomCell,
} from "../internal/data-grid/data-grid-types";

type StringArrayCellBuffer = {
    formatted: string[];
    rawValue: string[];
    format: "string-array";
    doNotEscape?: boolean;
};

type BasicCellBuffer = {
    formatted: string;
    rawValue: string | number | boolean | typeof BooleanEmpty | typeof BooleanIndeterminate;
    format: "string" | "number" | "boolean" | "url";
    doNotEscape?: boolean;
};
export type CellBuffer = StringArrayCellBuffer | BasicCellBuffer;
export type CopyBuffer = CellBuffer[][];

function convertCellToBuffer(cell: GridCell): CellBuffer {
    if (cell.copyData !== undefined) {
        return {
            formatted: cell.copyData,
            rawValue: cell.copyData,
            format: "string",
            // Do not escape the copy value if it was explicitly specified via copyData:
            doNotEscape: true,
        };
    }
    switch (cell.kind) {
        case GridCellKind.Boolean: {
            const boolCell = cell as BooleanCell;
            return {
                formatted:
                    boolCell.data === true
                        ? "TRUE"
                        : boolCell.data === false
                        ? "FALSE"
                        : boolCell.data === BooleanIndeterminate
                        ? "INDETERMINATE"
                        : "",
                rawValue: boolCell.data,
                format: "boolean",
            };
        }
        case GridCellKind.Custom: {
            const customCell = cell as CustomCell;
            return {
                formatted: customCell.copyData ?? "",
                rawValue: customCell.copyData ?? "",
                format: "string",
            };
        }
        case GridCellKind.Image: {
            const imageCell = cell as ImageCell;
            return {
                formatted: imageCell.data,
                rawValue: imageCell.data,
                format: "string-array",
            };
        }
        case GridCellKind.Bubble: {
            const bubbleCell = cell as BubbleCell;
            return {
                formatted: bubbleCell.data,
                rawValue: bubbleCell.data,
                format: "string-array",
            };
        }
        case GridCellKind.Drilldown: {
            const drilldownCell = cell as DrilldownCell;
            return {
                formatted: drilldownCell.data.map(x => x.text),
                rawValue: drilldownCell.data.map(x => x.text),
                format: "string-array",
            };
        }
        case GridCellKind.Text: {
            const textCell = cell as TextCell;
            return {
                formatted: textCell.displayData ?? textCell.data,
                rawValue: textCell.data,
                format: "string",
            };
        }
        case GridCellKind.Uri: {
            const uriCell = cell as UriCell;
            return {
                formatted: uriCell.displayData ?? uriCell.data,
                rawValue: uriCell.data,
                format: "url",
            };
        }
        case GridCellKind.Markdown: {
            const markdownCell = cell as MarkdownCell;
            return {
                formatted: markdownCell.data,
                rawValue: markdownCell.data,
                format: "string",
            };
        }
        case GridCellKind.RowID: {
            const rowIdCell = cell as RowIDCell;
            return {
                formatted: rowIdCell.data,
                rawValue: rowIdCell.data,
                format: "string",
            };
        }
        case GridCellKind.Number: {
            const numberCell = cell as NumberCell;
            return {
                formatted: numberCell.displayData ?? "",
                rawValue: numberCell.data,
                format: "number",
            };
        }
        case GridCellKind.Loading: {
            return {
                formatted: "#LOADING",
                rawValue: "",
                format: "string",
            };
        }
        case GridCellKind.Protected: {
            return {
                formatted: "************",
                rawValue: "",
                format: "string",
            };
        }
        default:
            assertNever(cell as never);
            return {} as CellBuffer;
    }
}

function createBufferFromGridCells(
    cells: readonly (readonly GridCell[])[],
    columnIndexes: readonly number[]
): CopyBuffer {
    const copyBuffer: CopyBuffer = cells.map((row, index) => {
        const mappedIndex = columnIndexes[index];
        return row.map(cell => {
            if (cell.span !== undefined && cell.span[0] !== mappedIndex)
                return {
                    formatted: "",
                    rawValue: "",
                    format: "string",
                };
            return convertCellToBuffer(cell);
        });
    });
    return copyBuffer;
}

function escapeIfNeeded(str: string, withComma: boolean): string {
    if ((withComma ? /[\t\n",]/ : /[\t\n"]/).test(str)) {
        str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function createTextBuffer(copyBuffer: CopyBuffer): string {
    const lines: string[] = [];
    for (const row of copyBuffer) {
        const line: string[] = [];
        for (const cell of row) {
            if (cell.format === "url") {
                line.push(cell.rawValue?.toString() ?? "");
            } else if (cell.format === "string-array") {
                line.push(cell.formatted.map(x => escapeIfNeeded(x, true)).join(","));
            } else {
                line.push(cell.doNotEscape === true ? cell.formatted : escapeIfNeeded(cell.formatted, false));
            }
        }
        lines.push(line.join("\t"));
    }
    return lines.join("\n");
}

function formatHtmlTextContent(text: string): string {
    // The following formatting for the `html` variable ensures that when pasting,
    // spaces are preserved in both Google Sheets and Excel. This is done by:
    // 1. Replacing tabs with four spaces for consistency. Also google sheets disallows any tabs.
    // 2. Wrapping each space with a span element to prevent them from being collapsed or ignored during the
    //    paste operation
    return text.replace(/\t/g, "    ").replace(/ {2,}/g, match => "<span> </span>".repeat(match.length));
}

function formatHtmlAttributeContent(attrText: string): string {
    // Escape all quotes, lt, gt, and other special characters
    return (
        '"' + attrText.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '"'
    );
}

function restoreHtmlEntities(str: string): string {
    // Unescape all quotes, lt, gt, and other special characters
    return str
        .replace(/"/g, '"')
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/&/g, "&");
}

function createHtmlBuffer(copyBuffer: CopyBuffer): string {
    const lines: string[] = [];
    lines.push(`<style type="text/css"><!--br {mso-data-placement:same-cell;}--></style>`, "<table><tbody>");
    for (const row of copyBuffer) {
        lines.push("<tr>");
        for (const cell of row) {
            const formatStr = `gdg-format="${cell.format}"`;
            if (cell.format === "url") {
                lines.push(
                    `<td ${formatStr}><a href="${cell.rawValue}">${formatHtmlTextContent(cell.formatted)}</a></td>`
                );
            } else {
                if (cell.format === "string-array") {
                    lines.push(
                        `<td ${formatStr}><ol>${cell.formatted
                            .map(
                                (x, ind) =>
                                    `<li gdg-raw-value=${formatHtmlAttributeContent(cell.rawValue[ind])}>` +
                                    formatHtmlTextContent(x) +
                                    "</li>"
                            )
                            .join("")}</ol></td>`
                    );
                } else {
                    lines.push(
                        `<td gdg-raw-value=${formatHtmlAttributeContent(
                            cell.rawValue?.toString() ?? ""
                        )} ${formatStr}>${formatHtmlTextContent(cell.formatted)}</td>`
                    );
                }
            }
        }
        lines.push("</tr>");
    }
    lines.push("</tbody></table>");
    return lines.join("");
}

// This function encodes grid cells to a table object.
// Each td in the table contains one of 3 things
// - A string directly and the td has a `gdg-raw-value` attribute with the raw value
// - An anchor tag with a href and the text is the formatted value
// - An ordered list with each item containing a `gdg-raw-value` attribute with the raw value
export function getCopyBufferContents(
    cells: readonly (readonly GridCell[])[],
    columnIndexes: readonly number[]
): {
    readonly textPlain: string;
    readonly textHtml: string;
} {
    const copyBuffer = createBufferFromGridCells(cells, columnIndexes);
    const textPlain = createTextBuffer(copyBuffer);
    const textHtml = createHtmlBuffer(copyBuffer);
    return {
        textPlain,
        textHtml,
    };
}

export function decodeHTML(html: string): CopyBuffer | undefined {
    const fragment = document.createElement("html");
    // we dont want to retain the pasted non-breaking spaces
    fragment.innerHTML = html.replace(/&nbsp;/g, " ");
    const tableEl = fragment.querySelector("table");
    if (tableEl === null) return undefined;
    const walkEl: Element[] = [tableEl];
    const result: CellBuffer[][] = [];
    let current: CellBuffer[] | undefined;

    while (walkEl.length > 0) {
        const el = walkEl.pop();

        if (el === undefined) break;

        if (el instanceof HTMLTableElement || el.nodeName === "TBODY") {
            walkEl.push(...[...el.children].reverse());
        } else if (el instanceof HTMLTableRowElement) {
            if (current !== undefined) {
                result.push(current);
            }
            current = [];
            walkEl.push(...[...el.children].reverse());
        } else if (el instanceof HTMLTableCellElement) {
            // be careful not to use innerText here as its behavior is not well defined for non DOM attached nodes
            const clone: HTMLTableCellElement = el.cloneNode(true) as HTMLTableCellElement;

            // Apple numbers seems to always wrap the cell in a p tag and a font tag. It also puts both <br> and \n
            // linebreak markers in the code. This is both unneeded and causes issues with the paste code.
            const firstTagIsPara = clone.children.length === 1 && clone.children[0].nodeName === "P";
            const para = firstTagIsPara ? clone.children[0] : null;
            const isAppleNumbers = para?.children.length === 1 && para.children[0].nodeName === "FONT";

            const brs = clone.querySelectorAll("br");
            for (const br of brs) {
                br.replaceWith("\n");
            }

            const attributeValue = clone.getAttribute("gdg-raw-value");
            const formatValue = (clone.getAttribute("gdg-format") ?? "string") as any; // fix me at some point
            if (clone.querySelector("a") !== null) {
                current?.push({
                    // raw value is the href
                    rawValue: clone.querySelector("a")?.getAttribute("href") ?? "",
                    formatted: clone.textContent ?? "",
                    format: formatValue,
                });
            } else if (clone.querySelector("ol") !== null) {
                const rawValues = clone.querySelectorAll("li");
                current?.push({
                    rawValue: [...rawValues].map(x => x.getAttribute("gdg-raw-value") ?? ""),
                    formatted: [...rawValues].map(x => x.textContent ?? ""),
                    format: "string-array",
                });
            } else if (attributeValue !== null) {
                current?.push({
                    rawValue: restoreHtmlEntities(attributeValue),
                    formatted: clone.textContent ?? "",
                    format: formatValue,
                });
            } else {
                let textContent = clone.textContent ?? "";
                if (isAppleNumbers) {
                    // replace any newline not preceded by a newline
                    textContent = textContent.replace(/\n(?!\n)/g, "");
                }

                current?.push({
                    rawValue: textContent ?? "",
                    formatted: textContent ?? "",
                    format: formatValue,
                });
            }
        }
    }

    if (current !== undefined) {
        result.push(current);
    }

    return result;
}