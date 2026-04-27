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

  // Improved Logo Embedding
  if (logoUrl) {
    try {
      let imageBytes: ArrayBuffer;
      
      if (logoUrl.startsWith('http')) {
        // External URL
        const response = await fetch(logoUrl);
        imageBytes = await response.arrayBuffer();
      } else {
        // Local path (handle relative/absolute)
        const publicPath = path.join(process.cwd(), 'public');
        const localPath = path.join(publicPath, logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`);
        if (fs.existsSync(localPath)) {
          imageBytes = fs.readFileSync(localPath);
        } else {
          throw new Error(`Logo not found at: ${localPath}`);
        }
      }

      if (imageBytes!) {
        let logoImage;
        const isPng = logoUrl.toLowerCase().endsWith('.png');
        if (isPng) {
          logoImage = await pdfDoc.embedPng(imageBytes);
        } else {
          logoImage = await pdfDoc.embedJpg(imageBytes);
        }
        
        const dims = logoImage.scale(0.3); // Scale down a bit more
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

  page.drawText('INVOICE', { x: 50, y: height - 120, size: 24, font: boldFont, color: rgb(0.8, 0.8, 0.8) });

  // Divider
  page.drawLine({ start: { x: 50, y: height - 130 }, end: { x: width - 50, y: height - 130 }, thickness: 2, color: rgb(0.9, 0.9, 0.9) });

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

  // Items Table
  const tableTop = height - 250;
  page.drawRectangle({ x: 50, y: tableTop - 20, width: width - 100, height: 20, color: rgb(0.98, 0.98, 0.98) });
  page.drawText('Description', { x: 60, y: tableTop - 15, size: 9, font: boldFont });
  page.drawText('Qty', { x: 350, y: tableTop - 15, size: 9, font: boldFont });
  page.drawText('Unit Price', { x: 420, y: tableTop - 15, size: 9, font: boldFont });
  page.drawText('Total', { x: 500, y: tableTop - 15, size: 9, font: boldFont });

  let currentY = tableTop - 40;
  invoice.items.forEach((item: any) => {
    page.drawText(item.description, { x: 60, y: currentY, size: 9, font });
    page.drawText(item.quantity.toString(), { x: 350, y: currentY, size: 9, font });
    page.drawText(item.unitPrice.toFixed(2), { x: 420, y: currentY, size: 9, font });
    page.drawText(item.total.toFixed(2), { x: 500, y: currentY, size: 9, font });
    currentY -= 20;
    page.drawLine({ start: { x: 50, y: currentY + 15 }, end: { x: width - 50, y: currentY + 15 }, thickness: 0.5, color: rgb(0.95, 0.95, 0.95) });
  });

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
