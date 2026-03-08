import { useState, useEffect, useCallback } from 'react';
import { claimsAPI, membersAPI, facilitiesAPI, formatDate, formatCurrency } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const STATUS_OPTIONS = ['pending', 'under_review', 'approved', 'rejected', 'paid'];
const CLAIM_TYPES = ['inpatient', 'outpatient', 'maternity', 'dental', 'optical', 'chronic'];

const EMPTY_FORM = {
  claim_number: '', member: '', facility: '', claim_type: 'outpatient',
  diagnosis: '', admission_date: '', discharge_date: '', total_amount: '',
  approved_amount: '', status: 'pending', rejection_reason: '',
};

export default function Claims() {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', claim_type: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const data = await claimsAPI.list(params);
      setClaims(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    membersAPI.list({ page_size: 200 }).then(d => setMembers(d.results || d)).catch(() => {});
    facilitiesAPI.list({ page_size: 200 }).then(d => setFacilities(d.results || d)).catch(() => {});
  }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, member: item.member, facility: item.facility }); setModalOpen(true); };
  const openView = (item) => { setViewItem(item); setViewModalOpen(true); };
  const openDelete = (id) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSave = async () => {
    if (!form.member || !form.facility || !form.diagnosis || !form.admission_date || !form.total_amount) {
      return toast.warning('Please fill in all required fields');
    }
    setSaving(true);
    try {
      if (editItem) { await claimsAPI.update(editItem.id, form); toast.success('Claim updated'); }
      else { await claimsAPI.create(form); toast.success('Claim submitted successfully'); }
      setModalOpen(false); load();
    } catch (e) { toast.error(e?.detail || 'Failed to save claim'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await claimsAPI.delete(deleteId); toast.success('Claim deleted'); setConfirmOpen(false); load(); }
    catch { toast.error('Failed to delete claim'); }
    finally { setSaving(false); }
  };

  const statusColor = (s) => ({ pending: '#f59e0b', under_review: '#0891b2', approved: '#16a34a', rejected: '#dc2626', paid: '#7c3aed' }[s] || '#666');
  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Claims Management</h1>
          <p>{total.toLocaleString()} total claims in system</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load}><i className="bi bi-arrow-clockwise" />Refresh</button>
          <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-circle-fill" />New Claim</button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-16 mb-20">
        {STATUS_OPTIONS.map(s => {
          const count = claims.filter(c => c.status === s).length;
          return (
            <div key={s} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: `1px solid var(--border-light)`, cursor: 'pointer', borderTop: `3px solid ${statusColor(s)}` }}
              onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s }))}>
              <div style={{ fontSize: 20, fontWeight: 800, color: statusColor(s) }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 500 }}>{s.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="input-group" style={{ flex: 2 }}>
          <i className="bi bi-search input-icon" />
          <input className="form-control" placeholder="Search by claim number, member name, SHA number..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
        </div>
        <select className="form-control" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select className="form-control" value={filters.claim_type} onChange={e => { setFilters(f => ({ ...f, claim_type: e.target.value })); setPage(1); }}>
          <option value="">All Types</option>
          {CLAIM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner" /><span>Loading claims...</span></div>
            : claims.length === 0 ? <div className="empty-state"><i className="bi bi-file-medical" /><h3>No claims found</h3></div>
            : (
              <table className="sha-table">
                <thead>
                  <tr><th>Claim No.</th><th>Member</th><th>Facility</th><th>Type</th><th>Diagnosis</th><th>Total Amt</th><th>Approved</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {claims.map(c => (
                    <tr key={c.id}>
                      <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{c.claim_number}</span></td>
                      <td><div style={{ fontWeight: 600, fontSize: 13 }}>{c.member_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.member_sha}</div></td>
                      <td style={{ fontSize: 12, maxWidth: 140 }} className="truncate">{c.facility_name}</td>
                      <td><span className={`badge badge-${c.claim_type}`}>{c.claim_type}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 120 }} className="truncate">{c.diagnosis}</td>
                      <td className="font-mono" style={{ fontSize: 12 }}>{formatCurrency(c.total_amount)}</td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--primary)' }}>{c.approved_amount ? formatCurrency(c.approved_amount) : '—'}</td>
                      <td><span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(c.admission_date)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn view" onClick={() => openView(c)}><i className="bi bi-eye" /></button>
                          <button className="action-btn edit" onClick={() => openEdit(c)}><i className="bi bi-pencil" /></button>
                          <button className="action-btn delete" onClick={() => openDelete(c.id)}><i className="bi bi-trash" /></button>
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

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Claim' : 'Submit New Claim'} icon="bi-file-medical-fill" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg" />{editItem ? 'Update' : 'Submit Claim'}</>}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-16">
          <div className="form-group">
            <label className="form-label">Member *</label>
            <select className="form-control" value={form.member} onChange={e => setForm(f => ({ ...f, member: e.target.value }))}>
              <option value="">Select Member</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name} — {m.sha_number}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Health Facility *</label>
            <select className="form-control" value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))}>
              <option value="">Select Facility</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Claim Type</label>
            <select className="form-control" value={form.claim_type} onChange={e => setForm(f => ({ ...f, claim_type: e.target.value }))}>
              {CLAIM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Diagnosis *</label>
            <textarea className="form-control" placeholder="Describe the diagnosis" value={form.diagnosis}
              onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Admission Date *</label>
            <input className="form-control" type="date" value={form.admission_date} onChange={e => setForm(f => ({ ...f, admission_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Discharge Date</label>
            <input className="form-control" type="date" value={form.discharge_date} onChange={e => setForm(f => ({ ...f, discharge_date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Amount (KES) *</label>
            <input className="form-control" type="number" min="0" placeholder="0.00" value={form.total_amount}
              onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Approved Amount (KES)</label>
            <input className="form-control" type="number" min="0" placeholder="0.00" value={form.approved_amount}
              onChange={e => setForm(f => ({ ...f, approved_amount: e.target.value }))} />
          </div>
          {form.status === 'rejected' && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Rejection Reason</label>
              <textarea className="form-control" placeholder="State reason for rejection" value={form.rejection_reason}
                onChange={e => setForm(f => ({ ...f, rejection_reason: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
            </div>
          )}
        </div>
      </Modal>

      {/* View Modal */}
      {viewItem && (
        <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Claim Details" icon="bi-file-medical-fill" size="md"
          footer={<><button className="btn btn-outline" onClick={() => setViewModalOpen(false)}>Close</button><button className="btn btn-primary" onClick={() => { setViewModalOpen(false); openEdit(viewItem); }}><i className="bi bi-pencil" />Process</button></>}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, padding: '14px 16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{viewItem.claim_number}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Submitted {formatDate(viewItem.created_at)}</div>
            </div>
            <span className={`badge badge-${viewItem.status}`} style={{ fontSize: 13, padding: '5px 14px' }}>{viewItem.status.replace('_', ' ')}</span>
          </div>
          <div className="grid grid-cols-2 gap-16">
            {[
              { label: 'Member', value: viewItem.member_name },
              { label: 'SHA Number', value: viewItem.member_sha },
              { label: 'Facility', value: viewItem.facility_name },
              { label: 'Claim Type', value: viewItem.claim_type },
              { label: 'Diagnosis', value: viewItem.diagnosis },
              { label: 'Admission Date', value: formatDate(viewItem.admission_date) },
              { label: 'Discharge Date', value: formatDate(viewItem.discharge_date) },
              { label: 'Total Amount', value: formatCurrency(viewItem.total_amount) },
              { label: 'Approved Amount', value: viewItem.approved_amount ? formatCurrency(viewItem.approved_amount) : '—' },
              { label: 'Processed By', value: viewItem.processed_by_name || '—' },
              ...(viewItem.rejection_reason ? [{ label: 'Rejection Reason', value: viewItem.rejection_reason }] : []),
            ].map((d, i) => (
              <div key={i} style={d.label === 'Diagnosis' || d.label === 'Rejection Reason' ? { gridColumn: '1 / -1' } : {}}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{d.value}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving}
        title="Delete Claim?" message="This will permanently remove this claim record. This action cannot be undone." />
    </div>
  );
}