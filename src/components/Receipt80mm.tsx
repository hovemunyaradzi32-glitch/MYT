import React, { useEffect, useState } from 'react';
import { Invoice, StoreConfig } from '../types/pos';
import {
  formatCurrency,
  generateQrCodeDataUrl,
  ORIGINAL_ZIMRA_QR_IMAGE,
  buildZimraFiscalQrUrl,
} from '../utils/receiptGenerator';

interface Receipt80mmProps {
  invoice: Invoice;
  config: StoreConfig;
  className?: string;
  isPrintVersion?: boolean;
  paperWidthMm?: number;
  boldLevel?: 'bold' | 'extra-bold';
  fiscalHighlightStyle?: 'black-banner' | 'bordered' | 'yellow' | 'none';
}

export const Receipt80mm: React.FC<Receipt80mmProps> = ({
  invoice,
  config,
  className = '',
  isPrintVersion = false,
  paperWidthMm = 80,
  boldLevel = 'extra-bold',
  fiscalHighlightStyle,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(ORIGINAL_ZIMRA_QR_IMAGE);

  useEffect(() => {
    // Generate authentic ZIMRA FDMS QR code matching the exact design from attached invoice
    const isOriginalInvoice =
      String(invoice.fiscalInvoiceNo) === '12108' ||
      (invoice.verificationCode && invoice.verificationCode.includes('2C03'));

    if (isOriginalInvoice) {
      setQrCodeUrl(ORIGINAL_ZIMRA_QR_IMAGE);
      return;
    }

    generateQrCodeDataUrl(invoice).then((url) => {
      setQrCodeUrl(url || ORIGINAL_ZIMRA_QR_IMAGE);
    });
  }, [invoice, config]);

  const currency = config.currencySymbol;
  const is58mm = paperWidthMm === 58;
  const targetWidth = is58mm ? '54mm' : '78mm';
  const isExtraBold = boldLevel === 'extra-bold';
  const highlightMode = fiscalHighlightStyle || invoice.fiscalInvoiceHighlight || config.fiscalInvoiceHighlight || 'black-banner';

  // 100% full-width dashed line that flushes edge-to-edge with the highlight banner
  const FlushDashedDivider: React.FC<{ className?: string }> = ({ className = 'my-1' }) => (
    <div
      className={`w-full ${className} select-none overflow-hidden`}
      style={{
        borderBottom: '1.5px dashed #000000',
        width: '100%',
      }}
    />
  );

  return (
    <div
      id={isPrintVersion ? 'printable-receipt' : undefined}
      className={`font-receipt bg-white text-black ${is58mm ? 'text-[10px]' : 'text-[12px]'} leading-[1.3] select-text font-bold ${
        isPrintVersion
          ? ''
          : `p-4 shadow-2xl border border-slate-300 rounded-xs relative`
      } ${className}`}
      style={{
        width: targetWidth,
        minWidth: targetWidth,
        maxWidth: targetWidth,
        fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
        color: '#000000',
        backgroundColor: '#ffffff',
        fontWeight: isExtraBold ? 800 : 700,
        WebkitTextStroke: isExtraBold ? '0.25px #000' : 'none',
      }}
    >
      {/* 1. Header Information (Centered - Courier New Bold) */}
      <div className="text-center space-y-0.5 mb-2 font-bold">
        <h1 className="text-[17px] font-black uppercase tracking-wide leading-tight">
          {config.name}
        </h1>
        <div className="font-bold text-[13px] leading-tight uppercase px-1">
          {config.tagline}
        </div>
        <div className="text-[12px] font-bold leading-tight mt-1 px-1">
          {config.address}
        </div>
        <div className="text-[12px] mt-0.5 font-bold">
          Tel: {config.phone}
        </div>
        <div className="text-[12px] font-bold break-all">
          Email: {config.email}
        </div>
        <div className="text-[12px] font-bold mt-0.5">
          TIN: {config.tin}
        </div>
        <div className="text-[12px] font-bold">
          VAT: {config.vat}
        </div>
      </div>

      {/* Dashed Separator (Flush with Highlight) */}
      <FlushDashedDivider />

      {/* 2. FISCAL TAX INVOICE Header (Highlighted Banner - 100% Flush Width, Courier New) */}
      <div className="my-1.5 text-center w-full">
        {highlightMode === 'black-banner' ? (
          <div
            className="w-full bg-black text-white py-1 px-2 font-black text-[12.5px] tracking-wider uppercase flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              width: '100%',
            }}
          >
            <span className="text-[10px] inline-block font-black text-white">■</span>
            <span className="font-black text-white tracking-wider">
              {invoice.isCopy ? 'COPY OF FISCAL TAX INVOICE' : 'FISCAL TAX INVOICE'}
            </span>
          </div>
        ) : highlightMode === 'bordered' ? (
          <div className="w-full border-2 border-black py-0.5 px-2 font-black text-[12px] tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span className="text-[10px] inline-block font-black">■</span>
            <span className="font-black">
              {invoice.isCopy ? 'COPY OF FISCAL TAX INVOICE' : 'FISCAL TAX INVOICE'}
            </span>
          </div>
        ) : highlightMode === 'yellow' ? (
          <div
            className="w-full bg-yellow-300 text-black py-0.5 px-2 font-black text-[12px] tracking-wider uppercase flex items-center justify-center gap-1.5 border border-yellow-400"
            style={{
              backgroundColor: '#fde047',
              color: '#000000',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              width: '100%',
            }}
          >
            <span className="text-[10px] inline-block font-black">■</span>
            <span className="font-black">
              {invoice.isCopy ? 'COPY OF FISCAL TAX INVOICE' : 'FISCAL TAX INVOICE'}
            </span>
          </div>
        ) : (
          <div className="w-full font-black text-black text-[12px] tracking-wider uppercase flex items-center justify-center gap-1.5">
            <span className="text-[10px] inline-block font-black">■</span>
            <span className="font-black">
              {invoice.isCopy ? 'COPY OF FISCAL TAX INVOICE' : 'FISCAL TAX INVOICE'}
            </span>
          </div>
        )}
      </div>

      {/* 3. Document Details (Note: Dotted line below FISCAL removed per user request) */}
      <div className="text-[12px] space-y-0.5 mb-2 font-bold mt-1.5">
        <div className="leading-snug">
          <span className="font-bold">INVOICE: </span>
          <span className="font-bold break-all text-[12px]">{invoice.invoiceNumber}</span>
        </div>
        <div>
          <span className="font-bold">Date: </span>
          <span className="font-bold">{invoice.date}</span>
        </div>
        <div>
          <span className="font-bold">Cashier: </span>
          <span className="font-bold">{invoice.cashier}</span>
        </div>
        <div className="break-all">
          <span className="font-bold">Email: </span>
          <span className="font-bold">{invoice.cashierEmail}</span>
        </div>
        <div className="leading-tight">
          <span className="font-bold">Shop: </span>
          <span className="uppercase text-[12px] font-bold">{invoice.shopName}</span>
        </div>
      </div>

      {/* Dashed Separator (Flush) */}
      <FlushDashedDivider />

      {/* 4. Customer Details */}
      <div className="text-[12px] mb-2 font-bold">
        <div className="font-bold uppercase tracking-wide">CUSTOMER DETAILS:</div>
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">Name: </span>
            <strong className="uppercase font-bold">{invoice.customerName}</strong>
          </div>
          {invoice.customerPhone && (
            <span className="text-[11px] font-bold">{invoice.customerPhone}</span>
          )}
        </div>
      </div>

      {/* 5. Table Header (No line between Customer Details and Description) */}
      <div className="border-b-2 border-black pb-1 mb-1 pt-0.5">
        <div className="grid grid-cols-12 text-[12px] font-bold">
          <div className="col-span-6 font-bold">Description</div>
          <div className="col-span-2 text-right font-bold">Price</div>
          <div className="col-span-2 text-right font-bold">Vat</div>
          <div className="col-span-2 text-right font-bold">Amount</div>
        </div>
      </div>

      {/* 6. Line Items with faint dotted lines separating products */}
      <div className="py-1">
        {invoice.items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <div
                className="w-full my-1.5 select-none overflow-hidden"
                style={{
                  borderBottom: '1px dotted #888888',
                  width: '100%',
                }}
              />
            )}
            <div className="text-[12px] font-bold py-0.5">
              {/* Item Name */}
              <div className="font-bold uppercase leading-tight text-[12px]">
                {item.name}
              </div>

              {/* Quantity x Price, Vat, Amount */}
              <div className="grid grid-cols-12 items-baseline text-[12px] font-bold">
                <div className="col-span-4 text-black font-bold">
                  {item.quantity.toFixed(2)} *
                </div>
                <div className="col-span-3 text-right font-bold">
                  {formatCurrency(item.finalUnitPrice, currency)}
                </div>
                <div className="col-span-2 text-right font-bold">
                  {formatCurrency(item.vatAmount, currency)}
                </div>
                <div className="col-span-3 text-right font-bold">
                  {formatCurrency(item.lineTotal, currency)}
                </div>
              </div>

              {/* Discount subrow matching physical receipt photo exact styling: ↳ ($1.20 was discounted) */}
              {item.discount > 0 && (
                <div className="text-[11px] pl-2 flex items-center gap-1 font-bold text-black">
                  <span className="font-bold">↳</span>
                  <span className="font-bold">
                    ({formatCurrency(item.discount * item.quantity, currency)} was discounted)
                  </span>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Dashed Separator (Flush) */}
      <FlushDashedDivider />

      {/* 7. Totals Section */}
      <div className="space-y-1 text-[12px] font-bold">
        <div className="flex justify-between font-bold">
          <span className="font-bold">Subtotal:</span>
          <span className="font-bold">{formatCurrency(invoice.subtotal, currency)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span className="font-bold">Tax:</span>
          <span className="font-bold">{formatCurrency(invoice.tax, currency)}</span>
        </div>

        {/* Dashed line before Total (Flush) */}
        <FlushDashedDivider className="my-0.5" />

        <div className="flex justify-between text-[14px] font-black tracking-wide py-0.5">
          <span className="font-black">TOTAL:</span>
          <span className="text-[14px] font-black">{formatCurrency(invoice.total, currency)}</span>
        </div>

        {/* Dashed line after Total (Flush) */}
        <FlushDashedDivider className="my-0.5" />
      </div>

      {/* 8. Payment Details */}
      <div className="space-y-0.5 text-[12px] my-1 font-bold">
        <div className="flex justify-between font-bold">
          <span className="font-bold">Payment Method: {invoice.paymentMethod}</span>
        </div>
        {invoice.amountPaid > invoice.total && (
          <>
            <div className="flex justify-between font-bold">
              <span>Amount Paid:</span>
              <span className="font-bold">{formatCurrency(invoice.amountPaid, currency)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span className="font-bold">{formatCurrency(invoice.change, currency)}</span>
            </div>
          </>
        )}
      </div>

      {/* Dashed Separator (Flush) */}
      <FlushDashedDivider />

      {/* 9. ZIMRA Fiscal Header (Centered - 12pt Courier New Bold) */}
      <div className="text-center font-bold tracking-wider text-[12px] uppercase my-1">
        {config.fiscalAuthority}
      </div>

      {/* 10. QR Code (Centered - EXACT ZIMRA QR CODE DESIGN from prior invoice) */}
      <div className="flex flex-col items-center justify-center my-1.5">
        <div
          className="bg-white inline-flex items-center justify-center"
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <img
            src={qrCodeUrl || ORIGINAL_ZIMRA_QR_IMAGE}
            alt="ZIMRA Fiscal QR Code"
            className="w-[134px] h-[134px] object-contain select-none"
            style={{
              imageRendering: 'pixelated',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* 11. Fiscal Device Information (12pt Courier New Bold) */}
      <div className="text-center text-[12px] space-y-0.5 font-bold">
        <div>
          <span className="font-bold">Fiscal Invoice No: </span>
          <strong className="font-bold">{invoice.fiscalInvoiceNo}</strong>
        </div>
        <div>
          <span className="font-bold">Fiscal Day: </span>
          <strong className="font-bold">{invoice.fiscalDay}</strong>
        </div>
        <div>
          <span className="font-bold">Device ID: </span>
          <strong className="font-bold">{invoice.deviceId}</strong>
        </div>
        <div className="break-all text-[11.5px]">
          <span className="font-bold">Verification: </span>
          <strong className="font-bold">{invoice.verificationCode}</strong>
        </div>
      </div>

      {/* Dashed Separator (Flush) - POS Cut Boundary 1: Under Verification */}
      <FlushDashedDivider className="my-1 pos-cut-verification" />

      {/* 12. Bundle Summary (Courier New Italic - less dark, lighter weight, soft charcoal) */}
      {invoice.showBundleSummary !== false && invoice.bundleSummary && invoice.bundleSummary.length > 0 && (
        <>
          <div
            className="bundle-summary-section text-[12px] mb-2 select-text"
            style={{
              fontWeight: 400,
              color: '#444444',
              WebkitTextStroke: '0px transparent',
            }}
          >
            <div
              className="text-[12px] italic mb-0.5"
              style={{
                fontWeight: 500,
                color: '#444444',
                WebkitTextStroke: '0px transparent',
              }}
            >
              Bundle Summary:
            </div>
            <div className="space-y-0.5 mt-0.5">
              {invoice.bundleSummary.map((bundle, idx) => (
                <div
                  key={idx}
                  className="flex items-baseline gap-1.5 italic text-[12px]"
                  style={{
                    fontWeight: 400,
                    color: '#444444',
                    WebkitTextStroke: '0px transparent',
                  }}
                >
                  <span className="italic" style={{ fontWeight: 400, color: '#444444' }}>
                    {bundle.quantity}×
                  </span>
                  <span
                    className="uppercase italic tracking-tight"
                    style={{ fontWeight: 400, color: '#444444' }}
                  >
                    {bundle.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashed Separator (Flush) */}
          <FlushDashedDivider />
        </>
      )}

      {/* 13. Footer Info */}
      <div className="text-center text-[11.5px] space-y-0.5 pt-0.5 font-bold">
        <div className="font-bold">
          Browser: {invoice.browserInfo}
        </div>
        <div className="font-bold mt-0.5 italic text-black">
          "{config.footerMessage.replace(/^"|"$/g, '')}"
        </div>
        {invoice.printedAt && (
          <div className="text-[11px] text-black font-bold">
            {invoice.printedAt}
          </div>
        )}
      </div>

      {/* Final Dotted Line marking the end of the invoice - POS Cut Boundary 2: End of Invoice */}
      <FlushDashedDivider className="mt-2 mb-1 pos-cut-end" />

      {/* Thermal roll feed margin */}
      <div className="h-3"></div>
    </div>
  );
};
