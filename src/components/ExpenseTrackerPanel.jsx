import React from 'react';
import { X } from 'lucide-react';

const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Lora:wght@400;500&display=swap');
`;

const C = {
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

const FONT_SANS = "'Instrument Sans', sans-serif";
const FONT_SERIF = "'Lora', Georgia, serif";

const s = {
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
    gridTemplateColumns: '1fr 1fr 1.6fr',
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
    display: 'grid',
    gridTemplateColumns: '1.35fr 1fr',
    background: C.bg,
  },
  col: {
    padding: '16px 20px',
  },
  colRight: {
    padding: '16px 20px',
    borderLeft: `1px solid ${C.border}`,
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
};

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
}) {
  const perPerson =
    participants.length > 0 ? (totalCents / 100 / participants.length).toFixed(2) : '0.00';

  const handleDraftChange = (key, value) => {
    setExpenseDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <style>{FONT_INJECT}</style>
      <div style={s.shell}>
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
          <div style={s.addGrid}>
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
              Total{' '}
              <strong style={{ color: C.text, fontWeight: 600 }}>
                ${(totalCents / 100).toFixed(2)}
              </strong>
            </div>
          </div>

          {error ? <p style={s.errorMsg}>{error}</p> : null}
        </div>

        <div style={s.body}>
          <div style={s.col}>
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
                  <button
                    style={s.deleteBtn}
                    onClick={() => deleteExpense(expense.id)}
                    aria-label="Delete"
                  >
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={s.colRight}>
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
      </div>
    </>
  );
}

export default ExpenseTrackerPanel;
