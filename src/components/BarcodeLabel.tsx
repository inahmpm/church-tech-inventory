import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export function generateBarcodeSvgMarkup(value: string, width = 2.2, height = 70): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, { format: 'CODE128', width, height, fontSize: 16, margin: 8 });
  return svg.outerHTML;
}

export default function BarcodeLabel({
  value,
  itemName,
  width = 1.6,
  height = 50,
}: {
  value: string;
  itemName?: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        width,
        height,
        fontSize: 14,
        margin: 6,
      });
    } catch {
      // invalid characters for the barcode symbology; leave blank
    }
  }, [value, width, height]);

  return (
    <div className="flex flex-col items-center">
      {itemName && <div className="text-xs text-slate-500 mb-1">{itemName}</div>}
      <svg ref={ref} />
    </div>
  );
}
