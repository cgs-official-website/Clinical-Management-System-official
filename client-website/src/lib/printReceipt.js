/**
 * Prints a simple pharmacy / billing receipt using a hidden iframe
 * (no popup window, so browser popup-blockers do not interfere).
 *
 * receipt = {
 *   invoiceNumber, date, patientName, tokenNumber, paymentMethod, status,
 *   servedBy, items: [{ description, amount }], total
 * }
 */
const esc = (v) =>
    String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

const money = (n) =>
    '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const printReceipt = (receipt = {}) => {
    const items = Array.isArray(receipt.items) ? receipt.items : []
    const total =
        receipt.total ?? items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
    const date = receipt.date ? new Date(receipt.date) : new Date()
    const dateStr = isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN')

    const rows = items
        .map(
            (it, i) => `<tr><td>${i + 1}</td><td>${esc(it.description)}</td><td class="r">${money(it.amount)}</td></tr>`
        )
        .join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(receipt.invoiceNumber)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:24px;font-size:13px}
  .box{max-width:420px;margin:0 auto}
  h1{font-size:18px;margin:0 0 2px}
  .muted{color:#666;font-size:12px}
  hr{border:0;border-top:1px dashed #999;margin:12px 0}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#555;border-bottom:1px solid #ccc;padding:4px 0}
  td{padding:5px 0;vertical-align:top}
  .r{text-align:right;white-space:nowrap}
  .total td{border-top:1px solid #111;font-weight:bold;font-size:15px;padding-top:8px}
  .paid{display:inline-block;border:2px solid #0a8f5a;color:#0a8f5a;padding:2px 10px;border-radius:6px;font-weight:bold;letter-spacing:1px;margin-top:8px}
  .token{display:inline-block;border:1px solid #111;border-radius:4px;padding:0 8px;font-family:monospace;letter-spacing:1px}
  .foot{text-align:center;margin-top:16px;color:#666;font-size:11px}
</style></head><body><div class="box">
  <h1>Pharmacy Receipt</h1>
  <div class="muted">Invoice: <b>${esc(receipt.invoiceNumber || '-')}</b></div>
  <div class="muted">Date: ${esc(dateStr)}</div>
  <hr>
  <div>Patient: <b>${esc(receipt.patientName || '-')}</b></div>
  ${receipt.tokenNumber ? `<div>Token No: <b class="token">${esc(receipt.tokenNumber)}</b></div>` : ''}
  ${receipt.servedBy ? `<div class="muted">Dispensed by: ${esc(receipt.servedBy)}</div>` : ''}
  <hr>
  <table>
    <thead><tr><th>#</th><th>Medicine</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="total"><td></td><td>Total</td><td class="r">${money(total)}</td></tr></tfoot>
  </table>
  <hr>
  <div>Payment: <b>${esc(receipt.paymentMethod || '-')}</b></div>
  ${String(receipt.status || '').toUpperCase() === 'PAID' ? '<div class="paid">PAID</div>' : ''}
  <div class="foot">Thank you. Get well soon!</div>
</div></body></html>`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    // print() must run exactly ONCE. Previously both iframe.onload and a 400ms fallback timer
    // called it, so the browser opened a second print dialog after the user pressed Cancel.
    let printed = false
    const cleanup = () => setTimeout(() => iframe.parentNode && iframe.parentNode.removeChild(iframe), 1000)
    const doPrint = () => {
        if (printed) return
        printed = true
        try {
            iframe.contentWindow.focus()
            iframe.contentWindow.print()
        } finally {
            cleanup()
        }
    }
    iframe.onload = doPrint
    // Some browsers do not fire onload for document.write content; the `printed` flag prevents a double call
    setTimeout(doPrint, 400)
}

export default printReceipt