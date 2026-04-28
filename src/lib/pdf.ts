import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import prisma from './prisma';
import fs from 'fs';
import path from 'path';

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(Math.floor(num)) + ' Taka Only.';
}

// Helper: draw a simple bordered rectangle (no transparency needed)
function drawBorderedRect(page: any, x: number, y: number, w: number, h: number, borderColor: [number,number,number], borderWidth = 1) {
  const [r, g, b] = borderColor;
  // top
  page.drawLine({ start: { x, y: y + h }, end: { x: x + w, y: y + h }, thickness: borderWidth, color: rgb(r, g, b) });
  // bottom
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness: borderWidth, color: rgb(r, g, b) });
  // left
  page.drawLine({ start: { x, y }, end: { x, y: y + h }, thickness: borderWidth, color: rgb(r, g, b) });
  // right
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness: borderWidth, color: rgb(r, g, b) });
}

export async function generateInvoicePDF(invoice: any, logoUrl?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Logo ──────────────────────────────────────────────────────────────────
  if (logoUrl) {
    try {
      let imageBuffer: Buffer | ArrayBuffer | null = null;
      let imageType: 'png' | 'jpg' = 'png';

      if (logoUrl.startsWith('data:')) {
        const parts = logoUrl.split(';');
        const mime = parts[0].split(':')[1];
        const base64Data = parts[1].split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        imageType = mime === 'image/png' ? 'png' : 'jpg';
      } else if (logoUrl.startsWith('http')) {
        const response = await fetch(logoUrl);
        imageBuffer = await response.arrayBuffer();
        imageType = logoUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      } else {
        const publicPath = path.join(process.cwd(), 'public');
        const fileName = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
        const localPath = path.join(publicPath, fileName);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
          imageType = fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
        }
      }

      if (imageBuffer) {
        const logoImage = imageType === 'png'
          ? await pdfDoc.embedPng(imageBuffer)
          : await pdfDoc.embedJpg(imageBuffer);
        const dims = logoImage.scale(0.3);
        page.drawImage(logoImage, { x: 50, y: height - dims.height - 40, width: dims.width, height: dims.height });
      }
    } catch (e) {
      console.error('Logo embed failed:', e);
    }
  }

  // ── Company info (right-aligned) ──────────────────────────────────────────
  const companyName = 'Sokrio Technologies Ltd.';
  const address1 = 'House 11 (4th floor), Road 21, Sector 4, Uttara, Dhaka - 1230';
  const contactInfo = 'Phone: 01711505322 | Website: www.sokrio.com';
  page.drawText(companyName, { x: width - boldFont.widthOfTextAtSize(companyName, 16) - 50, y: height - 50, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(address1, { x: width - font.widthOfTextAtSize(address1, 9) - 50, y: height - 70, size: 9, font });
  page.drawText(contactInfo, { x: width - font.widthOfTextAtSize(contactInfo, 9) - 50, y: height - 82, size: 9, font });

  // ── INVOICE title (centered, small, light blue) ───────────────────────────
  const invoiceTitle = 'INVOICE';
  const titleW = boldFont.widthOfTextAtSize(invoiceTitle, 16);
  page.drawText(invoiceTitle, { x: (width - titleW) / 2, y: height - 125, size: 16, font: boldFont, color: rgb(0.6, 0.7, 0.85) });

  // Divider
  page.drawLine({ start: { x: 50, y: height - 140 }, end: { x: width - 50, y: height - 140 }, thickness: 1.5, color: rgb(0.85, 0.90, 0.97) });

  // ── Bill To + Invoice Meta ────────────────────────────────────────────────
  page.drawText('BILL TO:', { x: 50, y: height - 160, size: 10, font: boldFont });
  page.drawText(invoice.contact.name, { x: 50, y: height - 175, size: 11, font: boldFont });
  page.drawText(invoice.contact.address || '', { x: 50, y: height - 190, size: 9, font, maxWidth: 200 });

  page.drawText('Invoice No:', { x: width - 200, y: height - 160, size: 10, font: boldFont });
  page.drawText(invoice.invoiceNumber, { x: width - 120, y: height - 160, size: 10, font });
  page.drawText('Date:', { x: width - 200, y: height - 175, size: 10, font: boldFont });
  page.drawText(new Date(invoice.date).toLocaleDateString(), { x: width - 120, y: height - 175, size: 10, font });
  if (invoice.dueDate) {
    page.drawText('Due Date:', { x: width - 200, y: height - 190, size: 10, font: boldFont });
    page.drawText(new Date(invoice.dueDate).toLocaleDateString(), { x: width - 120, y: height - 190, size: 10, font });
  }

  // ── Items Table with dynamic columns ─────────────────────────────────────
  const hasPeriod = !!invoice.billingPeriodStart;
  const hasDesc   = invoice.items.some((i: any) => i.description);

  const TL = 50;
  const TR = width - 50;
  const TW = TR - TL;

  // Define column weights based on what's visible
  const colConfig = [
    { id: 'product', label: 'Product / Service', weight: hasPeriod ? (hasDesc ? 1.3 : 1.8) : (hasDesc ? 1.8 : 2.5) },
    { id: 'period',  label: 'Billing Period',    weight: hasPeriod ? 1.2 : 0 },
    { id: 'desc',    label: 'Description',       weight: hasDesc ? 1.2 : 0 },
    { id: 'qty',     label: 'Qty',               weight: 0.4 },
    { id: 'price',   label: 'Unit Price',        weight: 0.7 },
    { id: 'total',   label: 'Total',             weight: 0.7 },
  ].filter(c => c.weight > 0);

  const totalWeight = colConfig.reduce((s, c) => s + c.weight, 0);

  let tempX = TL;
  const activeCols = colConfig.map(col => {
    const w = (col.weight / totalWeight) * TW;
    const x = tempX;
    tempX += w;
    return { ...col, x, w };
  });

  const ROW_H    = 22;
  const HEADER_Y = height - 255;
  const blueHdr  = rgb(0.85, 0.92, 0.98);
  const blueDark = rgb(0.1, 0.25, 0.55);
  const blueBdr  = rgb(0.67, 0.80, 0.93);
  const blueRow  = rgb(0.93, 0.97, 1.0);

  // Header background
  page.drawRectangle({ x: TL, y: HEADER_Y - ROW_H, width: TW, height: ROW_H, color: blueHdr });

  // Header texts
  activeCols.forEach(col => {
    page.drawText(col.label, { x: col.x + 5, y: HEADER_Y - 14, size: 8, font: boldFont, color: blueDark });
  });

  // Helper for date formatting
  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  };
  const periodText = (invoice.billingPeriodStart && invoice.billingPeriodEnd)
    ? `${formatDate(invoice.billingPeriodStart)} to ${formatDate(invoice.billingPeriodEnd)}`
    : '';

  // Draw rows
  let rowCursorY = HEADER_Y - ROW_H;
  for (const [index, item] of invoice.items.entries()) {
    const rowY = rowCursorY - ROW_H;
    if (index % 2 === 0) {
      page.drawRectangle({ x: TL, y: rowY, width: TW, height: ROW_H, color: blueRow });
    }

    for (const col of activeCols) {
      let text = '';
      if (col.id === 'product') {
        let pName = item.product?.name;
        // Fallback: if we have a productId but relation is missing
        if (!pName && item.productId) {
          try {
            const p = await prisma.product.findUnique({ where: { id: item.productId } });
            if (p) pName = p.name;
          } catch (e) {}
        }
        text = pName || item.description || 'Custom';
        
        // Auto-scale font if text is too long for column width
        const textWidth = font.widthOfTextAtSize(text, 8);
        const availableW = col.w - 10;
        const scaleFactor = textWidth > availableW ? availableW / textWidth : 1;
        const fontSize = 8 * scaleFactor;

        page.drawText(text, { x: col.x + 5, y: rowY + 9, size: fontSize, font });
        if (item.vatType === 'INCLUDE') {
          page.drawText(`(Including VAT ${item.vatRate}%)`, { x: col.x + 5, y: rowY + 2, size: 6, font, color: rgb(0.4, 0.4, 0.4) });
        }
      } else if (col.id === 'period') {
        page.drawText(periodText, { x: col.x + 5, y: rowY + 7, size: 7, font });
      } else if (col.id === 'desc') {
        const descText = item.description || '';
        const textWidth = font.widthOfTextAtSize(descText, 8);
        const availableW = col.w - 10;
        const scaleFactor = textWidth > availableW ? availableW / textWidth : 1;
        const fontSize = 8 * scaleFactor;
        page.drawText(descText, { x: col.x + 5, y: rowY + 7, size: fontSize, font });
      } else if (col.id === 'qty') {
        page.drawText(item.quantity.toString(), { x: col.x + 5, y: rowY + 7, size: 8, font });
      } else if (col.id === 'price') {
        page.drawText(item.unitPrice.toFixed(2), { x: col.x + 5, y: rowY + 7, size: 8, font });
      } else if (col.id === 'total') {
        page.drawText(item.total.toFixed(2), { x: col.x + 5, y: rowY + 7, size: 8, font });
      }
    }
    rowCursorY = rowY;
  }

  const TABLE_BOTTOM = rowCursorY;
  const TABLE_TOP    = HEADER_Y;
  const TABLE_H      = TABLE_TOP - TABLE_BOTTOM;

  // Border and lines
  drawBorderedRect(page, TL, TABLE_BOTTOM, TW, TABLE_H, [0.67, 0.80, 0.93], 1.2);
  page.drawLine({ start: { x: TL, y: TABLE_TOP - ROW_H }, end: { x: TR, y: TABLE_TOP - ROW_H }, thickness: 1.2, color: blueBdr });

  // Row dividers
  let divY = TABLE_TOP - ROW_H;
  invoice.items.forEach(() => {
    divY -= ROW_H;
    page.drawLine({ start: { x: TL, y: divY }, end: { x: TR, y: divY }, thickness: 0.5, color: blueBdr });
  });

  // Vertical dividers
  activeCols.slice(1).forEach(col => {
    page.drawLine({ start: { x: col.x, y: TABLE_BOTTOM }, end: { x: col.x, y: TABLE_TOP }, thickness: 0.8, color: blueBdr });
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  rowCursorY -= 25;
  const totalsX = width - 210;
  const totalsValX = width - 80;
  const drawTotalRow = (label: string, value: string, y: number, bold = false) => {
    page.drawText(label, { x: totalsX, y, size: 10, font: bold ? boldFont : font });
    page.drawText(value, { x: totalsValX - font.widthOfTextAtSize(value, 10), y, size: 10, font: bold ? boldFont : font });
  };
  drawTotalRow('Subtotal:', invoice.subtotal.toFixed(2), rowCursorY);
  if (invoice.discountAmount > 0) { rowCursorY -= 16; drawTotalRow('Discount:', `-${invoice.discountAmount.toFixed(2)}`, rowCursorY); }
  rowCursorY -= 16;
  drawTotalRow(`Tax (${invoice.taxRate}%):`, invoice.taxAmount.toFixed(2), rowCursorY);
  rowCursorY -= 22;
  page.drawRectangle({ x: totalsX - 5, y: rowCursorY - 4, width: 170, height: 22, color: rgb(0.85, 0.92, 0.98) });
  drawTotalRow('Total Due:', invoice.totalAmount.toFixed(2), rowCursorY, true);

  // ── In Words ──────────────────────────────────────────────────────────────
  rowCursorY -= 40;
  page.drawText('In Words: ' + numberToWords(invoice.totalAmount), { x: 50, y: rowCursorY, size: 9, font: boldFont });

  // ── Payment Info ──────────────────────────────────────────────────────────
  rowCursorY -= 50;
  page.drawText('Payment Info:', { x: 50, y: rowCursorY, size: 10, font: boldFont });
  page.drawLine({ start: { x: 50, y: rowCursorY - 3 }, end: { x: width - 50, y: rowCursorY - 3 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  const pLines = [
    'Bank Details:',
    'Account Name: Sokrio Technologies Ltd.',
    'A/C number: 1361115346000',
    'Bank Name: AB Bank PLC.',
    'Branch Name: Uttara',
    'Routing Number: 020264639',
    'Or',
    'bKash Merchant Number: 01798 013530',
  ];
  pLines.forEach(line => {
    rowCursorY -= 13;
    page.drawText(line, { x: 50, y: rowCursorY, size: 9, font: line === 'Bank Details:' ? boldFont : font });
  });

  // ── Terms ─────────────────────────────────────────────────────────────────
  rowCursorY -= 35;
  page.drawText('Terms & Conditions:', { x: 50, y: rowCursorY, size: 10, font: boldFont });
  page.drawLine({ start: { x: 50, y: rowCursorY - 3 }, end: { x: width - 50, y: rowCursorY - 3 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  rowCursorY -= 16;
  page.drawText('Payment Method: Bank & bKash', { x: 50, y: rowCursorY, size: 9, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
