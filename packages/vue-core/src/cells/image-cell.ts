import type { BaseGridCell, ImageCell } from '../internal/data-grid/data-grid-types.js'
import { roundedRect } from '../internal/data-grid/render/data-grid-lib.js'
import type { BaseDrawArgs, InternalCellRenderer } from './cell-types.js'

export const imageCellRenderer: InternalCellRenderer<ImageCell> = {
  getAccessibilityString: c => c.data?.[0]?.toString() ?? "",
  kind: 'image',
  needsHover: imageCell => imageCell.hoverEffect === true,
  needsHoverPosition: false,
  useLabel: false,
  draw: (args) => {
    const { cell, ctx, rect, theme } = args

    if (!cell.data || cell.data.length === 0) {
      // 没有图片数据时显示占位符
      ctx.fillStyle = theme.bgHeader
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

      ctx.fillStyle = theme.textLight
      ctx.font = `${theme.baseFontStyle} ${theme.baseFontSize}px ${theme.fontFamily}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('No Image', rect.x + rect.width / 2, rect.y + rect.height / 2)
      return
    }

    // 绘制图片占位符（实际项目中需要加载真实图片）
    const imageUrl = cell.data[0]

    // 绘制图片背景
    ctx.fillStyle = theme.bgCellMedium
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)

    // 绘制图片边框
    ctx.strokeStyle = theme.accentLight
    ctx.lineWidth = 1
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 4)

    // 绘制图片图标
    ctx.fillStyle = theme.accentColor
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🖼️', rect.x + rect.width / 2, rect.y + rect.height / 2)

    // 在实际项目中，这里应该加载和绘制真实图片
    // const img = new Image()
    // img.onload = () => {
    //   ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height)
    // }
    // img.src = imageUrl
  },
  measure: (ctx, cell, theme) => {
    return 80 // 固定图片宽度
  },
  onDelete: c => ({
    ...c,
    data: [],
  }),
  provideEditor: cell => ({
    disablePadding: true,
    editor: (props) => {
      // 在Vue中，编辑器将在覆盖编辑器中实现
      return null
    },
  }),
}

const itemMargin = 4;

export function drawImage(
    args: BaseDrawArgs,
    data: readonly string[],
    rounding: number,
    contentAlign?: BaseGridCell["contentAlign"]
) {
    const { rect, col, row, theme, ctx, imageLoader } = args;
    const { x, y, height: h, width: w } = rect;

    const imgHeight = h - theme.cellVerticalPadding * 2;
    const images: (HTMLImageElement | ImageBitmap)[] = [];
    let totalWidth = 0;
    // eslint-disable-next-line unicorn/no-for-loop
    for (let index = 0; index < data.length; index++) {
        const i = data[index];
        if (i.length === 0) continue;
        const img = imageLoader.loadOrGetImage(i, col, row);

        if (img !== undefined) {
            images[index] = img;
            const imgWidth = img.width * (imgHeight / img.height);
            totalWidth += imgWidth + itemMargin;
        }
    }

    if (totalWidth === 0) return;
    totalWidth -= itemMargin;

    let drawX = x + theme.cellHorizontalPadding;
    if (contentAlign === "right") drawX = Math.floor(x + w - theme.cellHorizontalPadding - totalWidth);
    else if (contentAlign === "center") drawX = Math.floor(x + w / 2 - totalWidth / 2);

    for (const img of images) {
        if (img === undefined) continue; //array is sparse
        const imgWidth = img.width * (imgHeight / img.height);
        if (rounding > 0) {
            ctx.beginPath();
            roundedRect(ctx, drawX, y + theme.cellVerticalPadding, imgWidth, imgHeight, rounding);
            ctx.save();
            ctx.clip();
        }
        ctx.drawImage(img, drawX, y + theme.cellVerticalPadding, imgWidth, imgHeight);
        if (rounding > 0) {
            ctx.restore();
        }

        drawX += imgWidth + itemMargin;
    }
}
