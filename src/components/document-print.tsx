'use client'
import { fmtDate, fmtMoney } from './ui'

const DOC_TITLES: Record<string, { title: string; subtitle: string }> = {
  PR: { title: 'PURCHASE REQUEST', subtitle: 'Formulir Permintaan Pembelian Barang / Jasa' },
  PR_RAW: { title: 'PURCHASE REQUEST — RAW MATERIAL', subtitle: 'Formulir Permintaan Pembelian Bahan Baku Produksi' },
  RFQ: { title: 'REQUEST FOR QUOTATION', subtitle: 'Surat Permintaan Penawaran Harga Resmi' },
  QUO: { title: 'VENDOR QUOTATION', subtitle: 'Surat Penawaran Harga Rekanan' },
  CTR: { title: 'PURCHASE CONTRACT', subtitle: 'Perjanjian Kontrak Pengadaan Barang / Jasa' },
  PO: { title: 'PURCHASE ORDER', subtitle: 'Surat Pesanan Pembelian Resmi' },
  GR: { title: 'GOODS RECEIPT NOTE', subtitle: 'Berita Acara Penerimaan / Retur Barang' },
  CA: { title: 'CASH ADVANCE VOUCHER', subtitle: 'Formulir Pengajuan Uang Muka (Kasbon)' },
  STL: { title: 'CASH ADVANCE SETTLEMENT', subtitle: 'Formulir Pertanggungjawaban Uang Muka' },
  RMB: { title: 'REIMBURSEMENT VOUCHER', subtitle: 'Formulir Klaim Penggantian Biaya' },
  INV: { title: 'AP INVOICE VOUCHER', subtitle: 'Dokumen Verifikasi Tagihan Rekanan' },
  OPAP: { title: 'OUTGOING PAYMENT VOUCHER (AP)', subtitle: 'Bukti Pengeluaran Kas / Bank Pembayaran Tagihan' },
  OPCA: { title: 'OUTGOING PAYMENT VOUCHER (CA)', subtitle: 'Bukti Pencairan Uang Muka Karyawan' },
  OPRMB: { title: 'OUTGOING PAYMENT VOUCHER (RMB)', subtitle: 'Bukti Pembayaran Reimbursement Karyawan' },
  ARI: { title: 'ACCOUNTS RECEIVABLE INVOICE', subtitle: 'Faktur Penagihan Pelanggan' },
  SVR: { title: 'SUPPLIER VERIFICATION', subtitle: 'Formulir Verifikasi & Registrasi Rekanan' },
}

export type PrintDocProps = {
  module: string
  doc: any
  form: Record<string, any>
  lines: any[]
  targetDocLines?: any[]
  subtotal: number
  vatAmount: number
  whtAmount: number
  freightAmount: number
  grandTotal: number
  terbilang: string
}

export function DocumentPrintView({
  module,
  doc,
  form,
  lines,
  targetDocLines = [],
  subtotal,
  vatAmount,
  whtAmount,
  freightAmount,
  grandTotal,
  terbilang,
}: PrintDocProps) {
  const heading = DOC_TITLES[module] ?? { title: 'DOCUMENT VOUCHER', subtitle: 'Purchasing & Finance Document' }
  const isExpense = module === 'CA' || module === 'STL' || module === 'RMB'
  const isPayment = module === 'OPAP' || module === 'OPCA' || module === 'OPRMB'
  const isGr = module === 'GR'
  const isRfq = module === 'RFQ'
  const hasVendor = ['RFQ', 'QUO', 'CTR', 'PO', 'GR', 'INV', 'OPAP', 'ARI', 'SVR'].includes(module)

  const approvals: any[] = doc?.approvals ?? []
  const sigSlots = [
    { label: 'Prepared By', name: form.requesterName || doc?.ownerName || '—', date: form.docDate || doc?.docDate, status: 'SUBMITTED' },
    { label: 'Checked By', name: approvals[0]?.actedByName || approvals[0]?.assigneeName || '', date: approvals[0]?.actedAt, status: approvals[0]?.status },
    { label: 'Approved By', name: approvals[1]?.actedByName || approvals[1]?.assigneeName || approvals[0]?.actedByName || '', date: approvals[1]?.actedAt || approvals[0]?.actedAt, status: approvals[1]?.status || approvals[0]?.status },
    { label: 'Acknowledged / Received', name: hasVendor ? (form.bpLabel || '') : '', date: doc?.detail?.AcknowledgedAt, status: doc?.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : '' },
  ]

  return (
    <div className="hidden print:block text-[11px] leading-snug text-gray-900 bg-white">
      {/* 1. Corporate Letterhead (Kop Surat) */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-3 mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Purchasing &amp; Procurement Portal
          </div>
          <div className="text-base font-extrabold tracking-tight text-gray-900 mt-0.5">
            {heading.title}
          </div>
          <div className="text-[10px] text-gray-600">{heading.subtitle}</div>
        </div>
        <div className="text-right">
          <div className="inline-block border border-gray-900 px-2.5 py-1 font-mono text-xs font-bold text-gray-900">
            {doc?.docNo ?? '(DRAFT)'}
          </div>
          <div className="mt-1.5 text-[10px] text-gray-700">
            Tanggal: <strong>{fmtDate(form.docDate || doc?.docDate)}</strong>
            {' · '}
            Status: <strong className="uppercase">{(doc?.status ?? 'DRAFT').replaceAll('_', ' ')}</strong>
          </div>
        </div>
      </div>

      {/* 2. Party & Reference Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-300 p-2.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-1.5">
            {hasVendor ? 'Vendor / Business Partner' : 'Requester / Employee'}
          </div>
          {hasVendor ? (
            <table className="w-full text-[10.5px]">
              <tbody>
                <tr>
                  <td className="w-28 py-0.5 text-gray-500">Nama Rekanan</td>
                  <td className="py-0.5 font-semibold text-gray-900">: {form.bpLabel || doc?.bpName || '—'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">Kode BP / NPWP</td>
                  <td className="py-0.5 font-mono text-gray-800">
                    : {form.bpCode || doc?.bpCode || '—'} {form.bpTaxId ? `· ${form.bpTaxId}` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">Referensi Vendor</td>
                  <td className="py-0.5 text-gray-800">: {form.bpReference || form.bpInvoiceNo || '—'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">Termin Bayar</td>
                  <td className="py-0.5 text-gray-800">: {form.paymentTermLabel || '—'}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[10.5px]">
              <tbody>
                <tr>
                  <td className="w-28 py-0.5 text-gray-500">Nama Pemohon</td>
                  <td className="py-0.5 font-semibold text-gray-900">
                    : {form.requesterName || doc?.ownerName || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">NIK / Jabatan</td>
                  <td className="py-0.5 text-gray-800">: {form.requesterNik || '—'} · {form.requesterJobTitle || 'Staff'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">Departemen</td>
                  <td className="py-0.5 text-gray-800">: {form.departmentLabel || '—'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-gray-500">Cost Center</td>
                  <td className="py-0.5 text-gray-800">: {form.costCenterLabel || '—'}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <div className="border border-gray-300 p-2.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-1.5">
            Document &amp; Commercial Info
          </div>
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr>
                <td className="w-28 py-0.5 text-gray-500">Mata Uang / Kurs</td>
                <td className="py-0.5 font-semibold text-gray-900">
                  : {form.currencyCode || 'IDR'} (Rate: {form.exchangeRate || '1'})
                </td>
              </tr>
              {(form.rfqLabel || form.poLabel || form.caLabel) && (
                <tr>
                  <td className="py-0.5 text-gray-500">Dokumen Sumber</td>
                  <td className="py-0.5 font-mono text-gray-800">
                    : {form.rfqLabel || form.poLabel || form.caLabel}
                  </td>
                </tr>
              )}
              {(module === 'PO' || module === 'PR' || module === 'PR_RAW') && (
                <tr>
                  <td className="py-0.5 text-gray-500">Tgl. Dibutuhkan</td>
                  <td className="py-0.5 text-gray-800">: {fmtDate(form.deliveryDate || form.requiredDate)}</td>
                </tr>
              )}
              {module === 'INV' && (
                <tr>
                  <td className="py-0.5 text-gray-500">Jatuh Tempo / Faktur</td>
                  <td className="py-0.5 text-gray-800">
                    : {fmtDate(form.dueDate)} {form.taxInvoiceNo ? `· FP: ${form.taxInvoiceNo}` : ''}
                  </td>
                </tr>
              )}
              {module === 'PO' && form.deliveryAddress && (
                <tr>
                  <td className="py-0.5 text-gray-500 align-top">Alamat Kirim</td>
                  <td className="py-0.5 text-gray-800">: {form.deliveryAddress}</td>
                </tr>
              )}
              {module === 'QUO' && (
                <tr>
                  <td className="py-0.5 text-gray-500">Berlaku Hingga</td>
                  <td className="py-0.5 text-gray-800">: {fmtDate(form.validUntil)} · {form.deliveryTerms || ''}</td>
                </tr>
              )}
              {isGr && (
                <tr>
                  <td className="py-0.5 text-gray-500">No. Surat Jalan</td>
                  <td className="py-0.5 text-gray-800">: {form.deliveryNoteNo || '—'} · {form.location || ''}</td>
                </tr>
              )}
              {isPayment && (
                <tr>
                  <td className="py-0.5 text-gray-500">Bank / Referensi</td>
                  <td className="py-0.5 text-gray-800">: {form.bankTransferInfo || form.referenceNo || '—'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Subject / Perihal */}
      <div className="border border-gray-300 bg-gray-50 px-3 py-1.5 mb-3">
        <span className="text-[10px] font-bold uppercase text-gray-500 mr-2">Perihal / Subject:</span>
        <span className="font-semibold text-gray-900">{form.title || doc?.title || '—'}</span>
      </div>

      {/* 4. Line Items Table */}
      <table className="w-full border-collapse border border-gray-400 mb-3 text-[10.5px]">
        <thead>
          <tr className="bg-gray-100 text-left text-[9.5px] font-bold uppercase text-gray-700">
            <th className="border border-gray-400 px-2 py-1.5 w-8 text-center">No</th>
            {isExpense ? (
              <>
                <th className="border border-gray-400 px-2 py-1.5 w-24">Tanggal</th>
                <th className="border border-gray-400 px-2 py-1.5 w-36">G/L Account (COA)</th>
                <th className="border border-gray-400 px-2 py-1.5 w-28">Cost Center</th>
                <th className="border border-gray-400 px-2 py-1.5">Uraian Pengeluaran</th>
                <th className="border border-gray-400 px-2 py-1.5 w-28 text-right">Jumlah</th>
              </>
            ) : isGr ? (
              <>
                <th className="border border-gray-400 px-2 py-1.5 w-28">Kode Item</th>
                <th className="border border-gray-400 px-2 py-1.5">Deskripsi Barang</th>
                <th className="border border-gray-400 px-2 py-1.5 w-16 text-center">Satuan</th>
                <th className="border border-gray-400 px-2 py-1.5 w-20 text-right">Diterima</th>
                <th className="border border-gray-400 px-2 py-1.5 w-20 text-right">Diterima Baik</th>
                <th className="border border-gray-400 px-2 py-1.5 w-16 text-right">Ditolak</th>
              </>
            ) : isPayment ? (
              <>
                <th className="border border-gray-400 px-2 py-1.5 w-32">Referensi</th>
                <th className="border border-gray-400 px-2 py-1.5">Deskripsi / Alokasi Pembayaran</th>
                <th className="border border-gray-400 px-2 py-1.5 w-32 text-right">Nilai Dibayar</th>
              </>
            ) : (
              <>
                <th className="border border-gray-400 px-2 py-1.5 w-28">Kode Item</th>
                <th className="border border-gray-400 px-2 py-1.5">Deskripsi / Spesifikasi</th>
                <th className="border border-gray-400 px-2 py-1.5 w-16 text-right">Qty</th>
                <th className="border border-gray-400 px-2 py-1.5 w-14 text-center">Satuan</th>
                {!isRfq && (
                  <>
                    <th className="border border-gray-400 px-2 py-1.5 w-24 text-right">Harga Satuan</th>
                    <th className="border border-gray-400 px-2 py-1.5 w-12 text-right">Disc%</th>
                    <th className="border border-gray-400 px-2 py-1.5 w-28 text-right">Total</th>
                  </>
                )}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {(isPayment && targetDocLines.length > 0 ? targetDocLines : lines).map((ln, idx) => {
            const qty = Number(ln.quantity ?? ln.targetQty ?? 0)
            const price = Number(ln.unitPrice ?? ln.estimatedUnitPrice ?? 0)
            const disc = Number(ln.discountPercent ?? 0)
            const rowTotal = ln.lineTotal != null ? Number(ln.lineTotal) : qty * price * (1 - disc / 100)
            return (
              <tr key={idx}>
                <td className="border border-gray-300 px-2 py-1.5 text-center tabular-nums">{idx + 1}</td>
                {isExpense ? (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5">{fmtDate(ln.expenseDate)}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-[10px]">{ln.coaLabel || ln.coaCode || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{ln.costCenterLabel || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{ln.description || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold tabular-nums">
                      {fmtMoney(ln.amount ?? rowTotal)}
                    </td>
                  </>
                ) : isGr ? (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-[10px]">{ln.itemCode || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{ln.description || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{ln.uomLabel || ln.uomCode || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{ln.receivedQty ?? qty}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums font-semibold">{ln.acceptedQty ?? qty}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{ln.rejectedQty ?? 0}</td>
                  </>
                ) : isPayment ? (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-[10px]">{ln.targetDocNo || form.referenceNo || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5">{ln.description || form.title || '—'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold tabular-nums">
                      {fmtMoney(ln.lineTotal ?? ln.amount ?? grandTotal)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 font-mono text-[10px]">
                      {ln.itemCode || (ln.itemLabel ? String(ln.itemLabel).split(' — ')[0] : '—')}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <div>{ln.description || '—'}</div>
                      {ln.specification && <div className="text-[9.5px] text-gray-500">{ln.specification}</div>}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{qty.toLocaleString('id-ID')}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{ln.uomLabel || ln.uomCode || '—'}</td>
                    {!isRfq && (
                      <>
                        <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{fmtMoney(price)}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">{disc}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-right font-semibold tabular-nums">
                          {fmtMoney(rowTotal)}
                        </td>
                      </>
                    )}
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* 5. Remarks & Financial Summary */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-7 border border-gray-300 p-2.5 text-[10px]">
          <div className="font-bold uppercase text-gray-500 mb-1">Catatan / Syarat &amp; Ketentuan:</div>
          <p className="text-gray-800 whitespace-pre-line">
            {form.remarks || form.justification || form.terms || doc?.remarks || '—'}
          </p>
        </div>
        <div className="col-span-5 border border-gray-300 p-2.5">
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600">Subtotal (DPP)</td>
                <td className="py-0.5 text-right font-medium tabular-nums">{fmtMoney(subtotal, form.currencyCode)}</td>
              </tr>
              {freightAmount > 0 && (
                <tr>
                  <td className="py-0.5 text-gray-600">Biaya Kirim / Freight</td>
                  <td className="py-0.5 text-right font-medium tabular-nums">{fmtMoney(freightAmount, form.currencyCode)}</td>
                </tr>
              )}
              {vatAmount > 0 && (
                <tr>
                  <td className="py-0.5 text-gray-600">PPN (VAT)</td>
                  <td className="py-0.5 text-right font-medium tabular-nums">{fmtMoney(vatAmount, form.currencyCode)}</td>
                </tr>
              )}
              {whtAmount > 0 && (
                <tr>
                  <td className="py-0.5 text-gray-600">PPh (WHT)</td>
                  <td className="py-0.5 text-right font-medium tabular-nums text-error-700">
                    -{fmtMoney(whtAmount, form.currencyCode)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-gray-400">
                <td className="pt-1.5 font-bold text-gray-900">GRAND TOTAL</td>
                <td className="pt-1.5 text-right text-xs font-extrabold tabular-nums text-gray-900">
                  {fmtMoney(grandTotal, form.currencyCode)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Terbilang */}
      <div className="border border-gray-300 bg-gray-50 px-3 py-1.5 mb-5 text-[10px]">
        <span className="font-bold uppercase text-gray-500 mr-1.5">Terbilang:</span>
        <span className="italic font-medium text-gray-900"># {terbilang} #</span>
      </div>

      {/* 6. Official Signature Matrix */}
      <div className="grid grid-cols-4 border border-gray-400 text-center text-[10px]">
        {sigSlots.map((s, idx) => (
          <div key={s.label} className={`p-2 ${idx > 0 ? 'border-l border-gray-400' : ''}`}>
            <div className="font-bold uppercase text-gray-700 border-b border-gray-200 pb-1">{s.label}</div>
            <div className="h-14 flex items-center justify-center">
              {s.status === 'APPROVED' || s.status === 'SUBMITTED' || s.status === 'ACKNOWLEDGED' ? (
                <span className="border border-gray-400 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-gray-700">
                  {s.status}
                </span>
              ) : null}
            </div>
            <div className="font-semibold text-gray-900 truncate">{s.name || '( .............................. )'}</div>
            <div className="text-[9px] text-gray-500">{s.date ? fmtDate(s.date) : 'Tgl: ___ / ___ / _____'}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between text-[9px] text-gray-400">
        <span>Dokumen elektronik resmi — Purchasing &amp; Supplier Portal System</span>
        <span>Dicetak: {new Date().toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}
