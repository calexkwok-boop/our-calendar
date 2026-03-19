import React from 'react';
import { X } from 'lucide-react';

const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Lora:wght@400;500&display=swap');

  .expense-tracker-shell {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .expense-tracker-add-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.6fr);
    gap: 8px;
  }

  .expense-tracker-body {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  }

  .expense-tracker-col,
  .expense-tracker-col-right {
    min-width: 0;
  }

  @media (max-width: 860px) {
    .expense-tracker-add-grid,
    .expense-tracker-body {
      grid-template-columns: minmax(0, 1fr);
    }

    .expense-tracker-col-right {
      border-left: none !important;
      border-top: 1px solid var(--expense-tracker-border);
    }
  }
`;

const LIGHT = {
  bg: '#fafaf8',
  surface: '#ffffff',
  border: '#e5e2da',
  borderLight: '#eeebe3',
  text: '#1a1916',
  textMid: '#3a3830',
  textSub: '#8a8880',
  textHint: '#a09e99',
  green: '#2d6a4f',
  greenDeep: '#1a5c3a',
  greenLight: '#eef5f1',
  greenText: '#4a7c65',
  amber: '#b85c20',
  red: '#c03030',
  inputBorder: '#e0ddd6',
};

const DARK = {
  bg: '#111827',
  surface: '#18212f',
  border: '#2a3648',
  borderLight: '#334155',
  text: '#f3f4f6',
  textMid: '#d1d5db',
  textSub: '#9ca3af',
  textHint: '#94a3b8',
  green: '#34d399',
  greenDeep: '#6ee7b7',
  greenLight: '#11261f',
  greenText: '#a7f3d0',
  amber: '#f59e0b',
  red: '#f87171',
  inputBorder: '#334155',
};

const FONT_SANS = "'Instrument Sans', sans-serif";
const FONT_SERIF = "'Lora', Georgia, serif";

const createStyles = (C) => ({
  shell: {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    overflow: 'hidden',
    fontFamily: FONT_SANS,
    color: C.text,
    marginBottom: 24,
  },
  header: {
    padding: '18px 20px 14px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontFamily: FONT_SERIF,
    fontSize: 19,
    fontWeight: 500,
    color: C.text,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    border: `1px solid ${C.border}`,
    background: C.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: C.textSub,
    flexShrink: 0,
  },
  addSection: {
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
  },
  addGrid: {
    display: 'grid',
    gap: 8,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: C.textHint,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: '8px 11px',
    border: `1px solid ${C.inputBorder}`,
    borderRadius: 8,
    fontFamily: FONT_SANS,
    fontSize: 14,
    color: C.text,
    background: C.bg,
    outline: 'none',
  },
  addFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  addBtn: {
    padding: '8px 18px',
    background: C.green,
    border: 'none',
    borderRadius: 8,
    fontFamily: FONT_SANS,
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
  },
  totalChip: {
    fontSize: 13,
    color: C.textSub,
  },
  body: {
    background: C.bg,
  },
  col: {
    padding: '16px 20px',
    minWidth: 0,
  },
  colRight: {
    padding: '16px 20px',
    borderLeft: `1px solid ${C.border}`,
    minWidth: 0,
  },
  colTitle: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: C.textHint,
    marginBottom: 10,
  },
  expenseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 11px',
    background: C.surface,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 10,
    marginBottom: 6,
  },
  expenseDesc: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  expensePayer: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 1,
  },
  expenseAmt: {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  deleteBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#d0cdc6',
    padding: 2,
    borderRadius: 4,
    lineHeight: 0,
    flexShrink: 0,
    display: 'flex',
  },
  perPersonCard: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: C.greenLight,
    borderRadius: 10,
    marginBottom: 8,
  },
  perPersonLabel: {
    fontSize: 12,
    color: C.greenText,
  },
  perPersonVal: {
    fontFamily: FONT_SERIF,
    fontSize: 18,
    fontWeight: 500,
    color: C.greenDeep,
    fontVariantNumeric: 'tabular-nums',
  },
  balanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '8px 11px',
    background: C.surface,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 9,
    marginBottom: 6,
  },
  balanceName: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: 500,
  },
  balancePos: {
    fontSize: 12.5,
    fontWeight: 600,
    color: C.green,
    fontVariantNumeric: 'tabular-nums',
  },
  balanceNeg: {
    fontSize: 12.5,
    fontWeight: 600,
    color: C.amber,
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    fontSize: 12.5,
    color: '#b5b2aa',
    fontStyle: 'italic',
    padding: '6px 0',
  },
  errorMsg: {
    fontSize: 12,
    color: C.red,
    marginTop: 8,
  },
  paymentSection: {
    padding: '16px 20px',
    borderTop: `1px solid ${C.border}`,
    background: C.bg,
  },
  sectionCard: {
    background: C.surface,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 14,
    padding: '14px 14px 10px',
  },
  sectionHint: {
    fontSize: 12,
    color: C.textSub,
    marginTop: -2,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  settlementRow: {
    padding: '10px 11px',
    background: C.surface,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 10,
    marginBottom: 7,
  },
  settlementHeadline: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    lineHeight: 1.5,
  },
  settlementHandle: {
    fontSize: 12,
    fontWeight: 600,
    color: C.greenDeep,
  },
  settlementNote: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 4,
    lineHeight: 1.45,
  },
});

function ExpenseTrackerPanel({
  title = 'Expense Tracker',
  subtitle = 'Track and split shared costs',
  onClose,
  expenseDraft,
  setExpenseDraft,
  addExpense,
  totalCents,
  expenses,
  deleteExpense,
  participants,
  balances,
  error,
  payerOptions = null,
  getDisplayName = (value) => value,
  emptyExpensesText = 'No expenses yet.',
  emptySummaryText = 'Add an expense to see the split.',
  payerPlaceholder = 'Name',
  amountPlaceholder = '0.00',
  descriptionPlaceholder = 'What was it for?',
  settlements = [],
  getVenmoHandle = null,
  getCashAppHandle = null,
  onOpenVenmoPayment = null,
  onOpenCashAppPayment = null,
  settlementNoteContext = 'expense split',
  darkMode = false,
}) {
  const palette = darkMode ? DARK : LIGHT;
  const s = createStyles(palette);
  const perPerson =
    participants.length > 0 ? (totalCents / 100 / participants.length).toFixed(2) : '0.00';

  const handleDraftChange = (key, value) => {
    setExpenseDraft((prev) => ({ ...prev, [key]: value }));
  };

  const showPaymentSections =
    typeof getVenmoHandle === 'function' &&
    typeof getCashAppHandle === 'function' &&
    Array.isArray(settlements);

  const getPreferredPayLabel = (identity) => {
    const venmoHandle = typeof getVenmoHandle === 'function' ? getVenmoHandle(identity) : '';
    const cashHandle = typeof getCashAppHandle === 'function' ? getCashAppHandle(identity) : '';
    if (venmoHandle) return `@${venmoHandle}`;
    if (cashHandle) return `$${cashHandle}`;
    return getDisplayName(identity);
  };

  return (
    <>
      <style>{FONT_INJECT}</style>
      <div
        className="expense-tracker-shell"
        style={{ ...s.shell, '--expense-tracker-border': palette.border }}
      >
        <div style={s.header}>
          <div>
            <div style={s.title}>{title}</div>
            <div style={s.subtitle}>{subtitle}</div>
          </div>
          {typeof onClose === 'function' && (
            <button style={s.closeBtn} onClick={onClose} aria-label="Close">
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        <div style={s.addSection}>
          <div className="expense-tracker-add-grid" style={s.addGrid}>
            <div>
              <label style={s.fieldLabel}>Paid by</label>
              {Array.isArray(payerOptions) ? (
                <select
                  style={s.input}
                  value={expenseDraft.payer}
                  onChange={(e) => handleDraftChange('payer', e.target.value)}
                >
                  {payerOptions.length === 0 ? (
                    <option value="">No members</option>
                  ) : (
                    payerOptions.map((option) => (
                      <option key={option} value={option}>
                        {getDisplayName(option)}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  style={s.input}
                  type="text"
                  value={expenseDraft.payer}
                  onChange={(e) => handleDraftChange('payer', e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addExpense();
                  }}
                  placeholder={payerPlaceholder}
                />
              )}
            </div>
            <div>
              <label style={s.fieldLabel}>Amount</label>
              <input
                style={s.input}
                type="number"
                step="0.01"
                min="0"
                value={expenseDraft.amount}
                onChange={(e) => handleDraftChange('amount', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addExpense();
                }}
                placeholder={amountPlaceholder}
              />
            </div>
            <div>
              <label style={s.fieldLabel}>Description</label>
              <input
                style={s.input}
                type="text"
                value={expenseDraft.description}
                onChange={(e) => handleDraftChange('description', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addExpense();
                }}
                placeholder={descriptionPlaceholder}
              />
            </div>
          </div>

          <div style={s.addFooter}>
            <button style={s.addBtn} onClick={addExpense}>
              Add expense
            </button>
            <div style={s.totalChip}>
              Total <strong style={{ color: palette.text, fontWeight: 600 }}>${(totalCents / 100).toFixed(2)}</strong>
            </div>
          </div>

          {error ? <p style={s.errorMsg}>{error}</p> : null}
        </div>

        <div className="expense-tracker-body" style={s.body}>
          <div className="expense-tracker-col" style={s.col}>
            <div style={s.colTitle}>Expenses</div>
            {expenses.length === 0 ? (
              <p style={s.empty}>{emptyExpensesText}</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} style={s.expenseRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={s.expenseDesc}>{expense.description}</div>
                    <div style={s.expensePayer}>{getDisplayName(expense.payer)}</div>
                  </div>
                  <div style={s.expenseAmt}>${(Number(expense.amount) || 0).toFixed(2)}</div>
                  <button style={s.deleteBtn} onClick={() => deleteExpense(expense.id)} aria-label="Delete">
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="expense-tracker-col-right" style={s.colRight}>
            <div style={s.colTitle}>Split summary</div>
            <div style={s.perPersonCard}>
              <span style={s.perPersonLabel}>Per person</span>
              <span style={s.perPersonVal}>${perPerson}</span>
            </div>
            {balances.length === 0 ? (
              <p style={s.empty}>{emptySummaryText}</p>
            ) : (
              balances.map((row) => (
                <div key={row.name} style={s.balanceRow}>
                  <span style={s.balanceName}>{getDisplayName(row.name)}</span>
                  {row.balance >= 0 ? (
                    <span style={s.balancePos}>+${(row.balance / 100).toFixed(2)}</span>
                  ) : (
                    <span style={s.balanceNeg}>owes ${(Math.abs(row.balance) / 100).toFixed(2)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {showPaymentSections && (
          <div style={s.paymentSection}>
            <div style={s.sectionCard}>
              <div style={s.colTitle}>Who pays whom</div>
              <div style={s.sectionHint}>
                Transfer suggestions use saved Venmo or Cash App handles from Account when available.
              </div>
              {settlements.length === 0 ? (
                <p style={s.empty}>No transfers needed.</p>
              ) : (
                settlements.map((settlement, idx) => {
                  const venmoHandle = getVenmoHandle(settlement.to);
                  const cashHandle = getCashAppHandle(settlement.to);
                  const fromDisplay = getDisplayName(settlement.from);
                  const toDisplay = getDisplayName(settlement.to);
                  const payLabel = getPreferredPayLabel(settlement.to);
                  const payVerb = fromDisplay === 'You' ? 'pay' : 'pays';
                  const hasPaymentHandle = Boolean(venmoHandle || cashHandle);
                  return (
                    <div key={`${settlement.from}-${settlement.to}-${idx}`} style={s.settlementRow}>
                      <div style={{ minWidth: 0 }}>
                        <div style={s.settlementHeadline}>
                          {fromDisplay} {payVerb} ${(settlement.amount / 100).toFixed(2)}{' '}
                          <span style={hasPaymentHandle ? s.settlementHandle : undefined}>{payLabel}</span>
                        </div>
                        {hasPaymentHandle ? (
                          <div style={s.settlementNote}>
                            {venmoHandle ? `Venmo @${venmoHandle}` : 'Venmo not set'} {' · '}
                            {cashHandle ? `Cash App $${cashHandle}` : 'Cash App not set'}
                          </div>
                        ) : (
                          <div style={s.settlementNote}>
                            {toDisplay} has not added a Venmo or Cash App handle yet. They can add payment handles in Account.
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          style={{
                            ...s.addBtn,
                            padding: '6px 10px',
                            fontSize: 12,
                            background: venmoHandle ? '#008cff' : (darkMode ? '#334155' : '#cbd5e1'),
                            color: venmoHandle ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                            cursor: venmoHandle ? 'pointer' : 'not-allowed',
                          }}
                          disabled={!venmoHandle}
                          onClick={() => {
                            if (typeof onOpenVenmoPayment === 'function') {
                              onOpenVenmoPayment(
                                venmoHandle,
                                settlement.amount,
                                `${fromDisplay} ${payVerb} ${payLabel} for ${settlementNoteContext}`
                              );
                            }
                          }}
                        >
                          {venmoHandle ? 'Venmo' : 'No Venmo'}
                        </button>
                        <button
                          style={{
                            ...s.addBtn,
                            padding: '6px 10px',
                            fontSize: 12,
                            background: cashHandle ? '#00d632' : (darkMode ? '#334155' : '#cbd5e1'),
                            color: cashHandle ? '#06240f' : (darkMode ? '#94a3b8' : '#64748b'),
                            cursor: cashHandle ? 'pointer' : 'not-allowed',
                          }}
                          disabled={!cashHandle}
                          onClick={() => {
                            if (typeof onOpenCashAppPayment === 'function') {
                              onOpenCashAppPayment(cashHandle, settlement.amount);
                            }
                          }}
                        >
                          {cashHandle ? 'Cash App' : 'No Cash App'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ExpenseTrackerPanel;
