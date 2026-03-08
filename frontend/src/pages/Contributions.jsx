import { useState, useEffect, useCallback } from 'react';
import { contributionsAPI, membersAPI, formatDate, formatCurrency } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const PAYMENT_METHODS = ['mpesa', 'bank', 'cash', 'payroll'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'failed'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EMPTY_FORM = { member: '', amount: '', payment_method: 'mpesa', transaction_ref: '', payment_date: '', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), status: 'confirmed' };

export default function Contributions() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const data = await contributionsAPI.list(params);
      setItems(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch { toast.error('Failed to load contributions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { membersAPI.list({ page_size: 200 }).then(d => setMembers(d.results || d)).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!form.member || !form.amount || !form.payment_date) return toast.warning('Fill required fields');
    setSaving(true);
    try {
      if (editItem) { await contributionsAPI.update(editItem.id, form); toast.success('Contribution updated'); }
      else { await contributionsAPI.create(form); toast.success('Contribution recorded'); }
      setModalOpen(false); load();
    } catch (e) { toast.error(e?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await contributionsAPI.delete(deleteId); toast.success('Record removed'); setConfirmOpen(false); load(); }
    catch { toast.error('Failed to delete'); }
    finally { setSaving(false); }
  };

  const totalConfirmed = items.filter(i => i.status === 'confirmed').reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPages = Math.ceil(total / 10);

  const methodIcon = { mpesa: 'bi-phone-fill', bank: 'bi-bank2', cash: 'bi-cash-coin', payroll: 'bi-briefcase-fill' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Contributions</h1>
          <p>{total.toLocaleString()} payment records</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load}><i className="bi bi-arrow-clockwise" />Refresh</button>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); }}>
            <i className="bi bi-plus-circle-fill" />Record Payment
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-16 mb-20">
        {[
          { label: 'Total Records', value: total, icon: 'bi-receipt', color: '#006600' },
          { label: 'Confirmed', value: items.filter(i => i.status === 'confirmed').length, icon: 'bi-check-circle', color: '#16a34a' },
          { label: 'Pending', value: items.filter(i => i.status === 'pending').length, icon: 'bi-hourglass', color: '#d97706' },
          { label: 'Total Collected', value: formatCurrency(totalConfirmed), icon: 'bi-cash-stack', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '16px 18px', border: '1px solid var(--border-light)', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="filters-bar">
        <div className="input-group" style={{ flex: 2 }}>
          <i className="bi bi-search input-icon" />
          <input className="form-control" placeholder="Search by transaction ref, member name, SHA number..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
        </div>
        <select className="form-control" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
            : items.length === 0 ? <div className="empty-state"><i className="bi bi-wallet2" /><h3>No contributions found</h3></div>
            : (
              <table className="sha-table">
                <thead>
                  <tr><th>Transaction Ref</th><th>Member</th><th>Amount</th><th>Method</th><th>Period</th><th>Payment Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{item.transaction_ref}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{item.member_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.member_sha}</div></td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(item.amount)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <i className={`bi ${methodIcon[item.payment_method] || 'bi-credit-card'}`} style={{ color: 'var(--primary)' }} />
                          <span style={{ textTransform: 'capitalize' }}>{item.payment_method}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{MONTHS[item.period_month - 1]} {item.period_year}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(item.payment_date)}</td>
                      <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => { setEditItem(item); setForm({ ...item }); setModalOpen(true); }}><i className="bi bi-pencil" /></button>
                          <button className="action-btn delete" onClick={() => { setDeleteId(item.id); setConfirmOpen(true); }}><i className="bi bi-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
        {totalPages > 1 && (
          <div className="pagination-bar">
            <span>Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} of {total}</span>
            <div className="pagination-buttons">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}><i className="bi bi-chevron-left" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const p = Math.max(1, page - 2) + i; if (p > totalPages) return null; return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>; })}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Contribution' : 'Record Payment'} icon="bi-wallet2" size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg" />{editItem ? 'Update' : 'Record'}</>}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-16">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Member *</label>
            <select className="form-control" value={form.member} onChange={e => setForm(f => ({ ...f, member: e.target.value }))}>
              <option value="">Select Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name} — {m.sha_number}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (KES) *</label>
            <input className="form-control" type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-control" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction Reference</label>
            <input className="form-control" placeholder="Auto-generated" value={form.transaction_ref} onChange={e => setForm(f => ({ ...f, transaction_ref: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date *</label>
            <input className="form-control" type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Period Month</label>
            <select className="form-control" value={form.period_month} onChange={e => setForm(f => ({ ...f, period_month: e.target.value }))}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Period Year</label>
            <input className="form-control" type="number" min="2020" max="2030" value={form.period_year} onChange={e => setForm(f => ({ ...f, period_year: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving}
        title="Delete Record?" message="This will permanently remove this contribution record." />
    </div>
  );
}