const fs = require('fs');

function updateToFloat(filePath, fields) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const field of fields) {
    // Match "@Column({ nullable: true })\n  fieldname?: number;" and similar
    // Replace the @Column decorator to include type: 'float'
    const patterns = [
      // nullable: true
      { from: `@Column({ nullable: true })\r\n  ${field}`,  to: `@Column({ type: 'float', nullable: true })\r\n  ${field}` },
      { from: `@Column({ nullable: true })\n  ${field}`,    to: `@Column({ type: 'float', nullable: true })\n  ${field}` },
      // select:false variant
      { from: `@Column({ select: false, insert: false, readonly: true, nullable: true })\r\n  ${field}`,
        to:   `@Column({ type: 'float', select: false, insert: false, readonly: true, nullable: true })\r\n  ${field}` },
      { from: `@Column({ select: false, insert: false, readonly: true, nullable: true })\n  ${field}`,
        to:   `@Column({ type: 'float', select: false, insert: false, readonly: true, nullable: true })\n  ${field}` },
    ];
    for (const p of patterns) {
      content = content.split(p.from).join(p.to);
    }
  }
  fs.writeFileSync(filePath, content);
  console.log('Updated:', filePath);
}

const poFields = [
  'unit_price', 'unit_price_1', 'unit_price_2', 'requested_qty', 'billed_qty', 'due_qty',
  'line_amount', 'remaining_from_po', 'amount_pending_approval_pd', 'amount_ready_invoice',
  'budget_percentage', 'total_acceptance', 'ny_invoice', 'piutang', 'amount_priority',
  'achievement_priority', 'actual_work_amount', 'total_cash_advance'
];

const poiFields = [
  'payment_amount', 'deduction_amount', 'unit_price', 'submit_amount', 'approve_amount'
];

updateToFloat(
  'd:/Android/SIMPRO Update 25 Nov 26/cms-api/src/entities/purchase-order.entity.ts',
  poFields
);
updateToFloat(
  'd:/Android/SIMPRO Update 25 Nov 26/cms-api/src/entities/purchase-order-invoice.entity.ts',
  poiFields
);

console.log('All float updates applied!');
