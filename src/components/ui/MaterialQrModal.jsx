import { useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// imprime via iframe (sem popup novo)
function printHtml({ title, htmlBody }) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 10mm; }
    body { font-family: Arial, sans-serif; color:#111; margin: 0; padding: 0; }

    .label {
      width: 320px;
      border: 1px solid #bbb;
      border-radius: 12px;
      padding: 12px;
    }
    .row { display:flex; gap: 12px; align-items:center; }
    .qr {
      width: 120px;
      height: 120px;
      display:flex;
      align-items:center;
      justify-content:center;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #fff;
    }
    .qr svg { width: 110px; height: 110px; } /* garante tamanho no print */

    .meta { flex: 1; min-width: 0; }
    .title { font-size: 14px; font-weight: 700; margin: 0 0 6px; }
    .line { font-size: 12px; margin: 2px 0; color:#222; }
    .muted { color:#555; font-size: 11px; }
    .sku { font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`);
  doc.close();

  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 800);
}

export default function MaterialQrModal({ material, onClose }) {
  const qrWrapRef = useRef(null);

  const safe = useMemo(() => {
    const code = material?.code ?? "";
    const name = material?.name ?? "";
    const sku = material?.sku ?? "";
    return {
      code: escapeHtml(code),
      name: escapeHtml(name),
      sku: escapeHtml(sku),
      title: escapeHtml(`${code} — ${name}`.trim()),
      printedAt: escapeHtml(new Date().toLocaleString("pt-BR")),
    };
  }, [material]);

  if (!material) return null;

  const handlePrintLabel = () => {
    const svg = qrWrapRef.current?.querySelector("svg");
    let qrHtml = "";

    if (svg) {
      qrHtml = svg.outerHTML;
    } else {
      const canvas = qrWrapRef.current?.querySelector("canvas");
      const dataUrl = canvas?.toDataURL?.("image/png");

      if (dataUrl) {
        qrHtml = `<img src="${dataUrl}" alt="QR" style="width:110px;height:110px;" />`;
      } else {
        qrHtml = `<div style="font-size:11px;color:#666;">QR indisponível</div>`;
      }
    }

    const html = `
      <div class="label">
        <div class="row">
          <div class="qr">${qrHtml}</div>
          <div class="meta">
            <div class="title">${safe.title}</div>
            <div class="line"><span class="muted">SKU:</span> <span class="sku">${safe.sku}</span></div>
            <div class="line muted">Impressão: ${safe.printedAt}</div>
          </div>
        </div>
      </div>
    `;

    printHtml({
      title: `Etiqueta ${material.code ?? ""}`.trim(),
      htmlBody: html,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[420px] shadow-xl ring-1 ring-black/5">
        <h2 className="text-lg font-semibold mb-1">QR Code do Material</h2>
        <p className="text-xs text-slate-500 mb-4">
          Conteúdo do QR: SKU (ideal para leitura no estoque).
        </p>

        <div className="flex flex-col items-center gap-3">
          <div ref={qrWrapRef} className="p-3 rounded-2xl border bg-white">
            {/* SVG */}
            <QRCodeSVG value={material.sku} size={180} />
          </div>

          <div className="text-center">
            <div className="font-medium">
              {material.code} — {material.name}
            </div>
            <div className="text-xs text-slate-500">
              SKU: <span className="font-mono">{material.sku}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>

          <Button onClick={handlePrintLabel}>
            Imprimir etiqueta
          </Button>
        </div>
      </div>
    </div>
  );
}
