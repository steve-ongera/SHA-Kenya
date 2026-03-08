import { useState, useEffect, useCallback } from 'react';
import { facilitiesAPI, countiesAPI, formatDate } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const FACILITY_TYPES = ['hospital', 'health_centre', 'dispensary', 'clinic', 'nursing_home'];
const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];
const EMPTY_FORM = { name: '', facility_code: '', facility_type: 'hospital', county: '', address: '', phone: '', email: '', status: 'active', beds: 0 };

export default function Facilities() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [counties, setCounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', type: '', county: '' });
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
      const data = await facilitiesAPI.list(params);
      setItems(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch { toast.error('Failed to load facilities'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { countiesAPI.list({ page_size: 100 }).then(d => setCounties(d.results || d)).catch(() => {}); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, county: item.county || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.facility_code || !form.phone) return toast.warning('Fill required fields');
    setSaving(true);
    try {
      if (editItem) { await facilitiesAPI.update(editItem.id, form); toast.success('Facility updated'); }
      else { await facilitiesAPI.create(form); toast.success('Facility added'); }
      setModalOpen(false); load();
    } catch (e) { toast.error(e?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await facilitiesAPI.delete(deleteId); toast.success('Facility removed'); setConfirmOpen(false); load(); }
    catch { toast.error('Failed to delete'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Health Facilities</h1>
          <p>{total.toLocaleString()} accredited facilities</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load}><i className="bi bi-arrow-clockwise" />Refresh</button>
          <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-hospital" />Add Facility</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-16 mb-20">
        {FACILITY_TYPES.map(t => {
          const count = items.filter(i => i.facility_type === t).length;
          return (
            <div key={t} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '14px 16px', border: '1px solid var(--border-light)', cursor: 'pointer' }}
              onClick={() => setFilters(f => ({ ...f, type: f.type === t ? '' : t }))}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{t.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      <div className="filters-bar">
        <div className="input-group" style={{ flex: 2 }}>
          <i className="bi bi-search input-icon" />
          <input className="form-control" placeholder="Search by name or facility code..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
        </div>
        <select className="form-control" value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
          <option value="">All Types</option>
          {FACILITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select className="form-control" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="form-control" value={filters.county} onChange={e => { setFilters(f => ({ ...f, county: e.target.value })); setPage(1); }}>
          <option value="">All Counties</option>
          {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
            : items.length === 0 ? <div className="empty-state"><i className="bi bi-hospital" /><h3>No facilities found</h3></div>
            : (
              <table className="sha-table">
                <thead>
                  <tr><th>Code</th><th>Name</th><th>Type</th><th>County</th><th>Phone</th><th>Beds</th><th>Claims</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{item.facility_code}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{item.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.email || ''}</div></td>
                      <td><span className={`badge badge-${item.facility_type}`}>{item.facility_type.replace('_', ' ')}</span></td>
                      <td>{item.county_name}</td>
                      <td>{item.phone}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.beds}</td>
                      <td style={{ textAlign: 'center' }}>{item.claim_count}</td>
                      <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => openEdit(item)}><i className="bi bi-pencil" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Facility' : 'Add Health Facility'} icon="bi-hospital-fill" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg" />{editItem ? 'Update' : 'Add Facility'}</>}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-16">
          <div className="form-group">
            <label className="form-label">Facility Name *</label>
            <input className="form-control" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Facility Code *</label>
            <input className="form-control" placeholder="e.g. FAC0001" value={form.facility_code} onChange={e => setForm(f => ({ ...f, facility_code: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Facility Type</label>
            <select className="form-control" value={form.facility_type} onChange={e => setForm(f => ({ ...f, facility_type: e.target.value }))}>
              {FACILITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">County</label>
            <select className="form-control" value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}>
              <option value="">Select County</option>
              {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className="form-control" placeholder="07XXXXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="facility@health.go.ke" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Address</label>
            <textarea className="form-control" placeholder="Physical address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Beds</label>
            <input className="form-control" type="number" min="0" value={form.beds} onChange={e => setForm(f => ({ ...f, beds: e.target.value }))} />
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
        title="Remove Facility?" message="This will permanently delete this facility record." />
    </div>
  );
}