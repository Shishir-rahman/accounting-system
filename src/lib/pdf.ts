import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

export async function generateInvoicePDF(invoice: any, logoUrl?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Handle Logo Embedding (Support Data URL, Remote URL, and Local Path)
  if (logoUrl) {
    try {
      let imageBuffer: Buffer | ArrayBuffer | null = null;
      let imageType: 'png' | 'jpg' = 'png';
      
      if (logoUrl.startsWith('data:')) {
        // Handle Base64 Data URL
        const parts = logoUrl.split(';');
        const mime = parts[0].split(':')[1];
        const base64Data = parts[1].split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        imageType = mime === 'image/png' ? 'png' : 'jpg';
      } else if (logoUrl.startsWith('http')) {
        // Handle Remote URL
        const response = await fetch(logoUrl);
        imageBuffer = await response.arrayBuffer();
        imageType = logoUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      } else {
        // Handle Local Path
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
        page.drawImage(logoImage, {
          x: 50,
          y: height - dims.height - 40,
          width: dims.width,
          height: dims.height,
        });
      }
    } catch (e) {
      console.error('Failed to embed logo in PDF:', e);
    }
  }

  // Header - Right Aligned Company Info
  const companyName = 'Sokrio Technologies Ltd.';
  const address1 = 'House 11 (4th floor), Road 21, Sector 4, Uttara, Dhaka - 1230';
  const contactInfo = 'Phone: 01711505322 | Website: www.sokrio.com';

  page.drawText(companyName, { x: width - font.widthOfTextAtSize(companyName, 16) - 50, y: height - 50, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(address1, { x: width - font.widthOfTextAtSize(address1, 9) - 50, y: height - 70, size: 9, font });
  page.drawText(contactInfo, { x: width - font.widthOfTextAtSize(contactInfo, 9) - 50, y: height - 82, size: 9, font });

  // INVOICE title - smaller, centered, lower
  const invoiceTitle = 'INVOICE';
  const invoiceTitleSize = 16;
  const invoiceTitleWidth = boldFont.widthOfTextAtSize(invoiceTitle, invoiceTitleSize);
  page.drawText(invoiceTitle, { 
    x: (width - invoiceTitleWidth) / 2, 
    y: height - 125, 
    size: invoiceTitleSize, 
    font: boldFont, 
    color: rgb(0.6, 0.7, 0.85) // light blue
  });

  // Divider
  page.drawLine({ start: { x: 50, y: height - 140 }, end: { x: width - 50, y: height - 140 }, thickness: 1.5, color: rgb(0.85, 0.90, 0.97) });

  // Info Section
  page.drawText('BILL TO:', { x: 50, y: height - 160, size: 10, font: boldFont });
  page.drawText(invoice.contact.name, { x: 50, y: height - 175, size: 11, font: boldFont });
  page.drawText(invoice.contact.address || 'No Address', { x: 50, y: height - 190, size: 9, font, maxWidth: 200 });

  page.drawText('Invoice No:', { x: width - 200, y: height - 160, size: 10, font: boldFont });
  page.drawText(invoice.invoiceNumber, { x: width - 120, y: height - 160, size: 10, font });
  
  page.drawText('Date:', { x: width - 200, y: height - 175, size: 10, font: boldFont });
  page.drawText(new Date(invoice.date).toLocaleDateString(), { x: width - 120, y: height - 175, size: 10, font });

  if (invoice.dueDate) {
    page.drawText('Due Date:', { x: width - 200, y: height - 190, size: 10, font: boldFont });
    page.drawText(new Date(invoice.dueDate).toLocaleDateString(), { x: width - 120, y: height - 190, size: 10, font });
  }

  // Items Table — light blue header with box border
  const tableTop = height - 255;
  const tableLeft = 50;
  const tableRight = width - 50;
  const tableW = tableRight - tableLeft;
  const colQty = 345;
  const colUnitPrice = 415;
  const colTotal = 490;
  const headerH = 22;

  // Blue header background
  page.drawRectangle({ x: tableLeft, y: tableTop - headerH, width: tableW, height: headerH, color: rgb(0.85, 0.92, 0.98) });
  // Header text
  page.drawText('Description', { x: tableLeft + 8, y: tableTop - 15, size: 9, font: boldFont, color: rgb(0.1, 0.25, 0.55) });
  page.drawText('Qty', { x: colQty + 5, y: tableTop - 15, size: 9, font: boldFont, color: rgb(0.1, 0.25, 0.55) });
  page.drawText('Unit Price', { x: colUnitPrice + 5, y: tableTop - 15, size: 9, font: boldFont, color: rgb(0.1, 0.25, 0.55) });
  page.drawText('Total', { x: colTotal + 5, y: tableTop - 15, size: 9, font: boldFont, color: rgb(0.1, 0.25, 0.55) });

  // Draw rows
  let currentY = tableTop - headerH - 20;
  invoice.items.forEach((item: any) => {
    page.drawText(item.description, { x: tableLeft + 8, y: currentY, size: 9, font });
    page.drawText(item.quantity.toString(), { x: colQty + 5, y: currentY, size: 9, font });
    page.drawText(item.unitPrice.toFixed(2), { x: colUnitPrice + 5, y: currentY, size: 9, font });
    page.drawText(item.total.toFixed(2), { x: colTotal + 5, y: currentY, size: 9, font });
    currentY -= 20;
    // Horizontal row divider
    page.drawLine({ start: { x: tableLeft, y: currentY + 15 }, end: { x: tableRight, y: currentY + 15 }, thickness: 0.5, color: rgb(0.85, 0.91, 0.97) });
  });

  // Outer border box around entire table
  const tableBottom = currentY + 15;
  const tableHeight = (tableTop) - tableBottom;
  page.drawRectangle({ x: tableLeft, y: tableBottom, width: tableW, height: tableHeight, borderColor: rgb(0.67, 0.80, 0.93), borderWidth: 1.2, color: rgb(1, 1, 1, 0) });

  // Vertical column dividers (full height)
  const vLineOpts = { thickness: 0.8, color: rgb(0.67, 0.80, 0.93) };
  page.drawLine({ start: { x: colQty, y: tableBottom }, end: { x: colQty, y: tableTop }, ...vLineOpts });
  page.drawLine({ start: { x: colUnitPrice, y: tableBottom }, end: { x: colUnitPrice, y: tableTop }, ...vLineOpts });
  page.drawLine({ start: { x: colTotal, y: tableBottom }, end: { x: colTotal, y: tableTop }, ...vLineOpts });


  // Totals
  currentY -= 20;
  const totalsX = width - 200;
  const totalsValueX = width - 100;
  const drawTotal = (label: string, value: string, y: number, isBold = false) => {
    page.drawText(label, { x: totalsX, y, size: 10, font: isBold ? boldFont : font });
    page.drawText(value, { x: totalsValueX, y, size: 10, font: isBold ? boldFont : font });
  };
  drawTotal('Subtotal:', invoice.subtotal.toFixed(2), currentY);
  if (invoice.discountAmount > 0) {
    currentY -= 15;
    drawTotal('Discount:', `-${invoice.discountAmount.toFixed(2)}`, currentY);
  }
  currentY -= 15;
  drawTotal(`Tax (${invoice.taxRate}%):`, invoice.taxAmount.toFixed(2), currentY);
  currentY -= 25;
  page.drawRectangle({ x: totalsX - 10, y: currentY - 5, width: 160, height: 25, color: rgb(0.95, 0.95, 0.95) });
  drawTotal('Total Due:', invoice.totalAmount.toFixed(2), currentY, true);

  // In Words
  currentY -= 50;
  page.drawText('In Words: ' + numberToWords(invoice.totalAmount), { x: 50, y: currentY, size: 9, font: boldFont });

  // Payment Info Section
  currentY -= 60;
  page.drawText('Payment Info:', { x: 50, y: currentY, size: 10, font });
  page.drawLine({ start: { x: 50, y: currentY - 2 }, end: { x: width - 50, y: currentY - 2 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  
  currentY -= 20;
  page.drawText('Bank Details:', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('Account Name: Sokrio Technologies Ltd.', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('A/C number: 1361115346000', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('Bank Name: AB Bank PLC.', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('Branch Name: Uttara', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('Routing Number: 020264639', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('Or', { x: 50, y: currentY, size: 9, font });
  currentY -= 12;
  page.drawText('bKash Merchant Number: 01798 013530', { x: 50, y: currentY, size: 9, font });

  // Terms Section
  currentY -= 40;
  page.drawText('Terms & Conditions:', { x: 50, y: currentY, size: 10, font });
  page.drawLine({ start: { x: 50, y: currentY - 2 }, end: { x: width - 50, y: currentY - 2 }, thickness: 1, color: rgb(0.5, 0.5, 0.5) });
  currentY -= 20;
  page.drawText('Payment Method: Bank & bKash', { x: 50, y: currentY, size: 9, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
