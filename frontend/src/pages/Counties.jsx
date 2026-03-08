import { useState, useEffect, useCallback } from 'react';
import { countiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

export default function Counties() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await countiesAPI.list({ page_size: 100 });
      setItems(data.results || data);
    } catch { toast.error('Failed to load counties'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name || !form.code) return toast.warning('Name and Code are required');
    setSaving(true);
    try {
      if (editItem) { await countiesAPI.update(editItem.id, form); toast.success('County updated'); }
      else { await countiesAPI.create(form); toast.success('County added'); }
      setModalOpen(false); load();
    } catch (e) { toast.error(e?.detail || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await countiesAPI.delete(deleteId); toast.success('County removed'); setConfirmOpen(false); load(); }
    catch { toast.error('Failed to delete'); }
    finally { setSaving(false); }
  };

  const filtered = items.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Counties</h1>
          <p>{items.length} counties of Kenya</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load}><i className="bi bi-arrow-clockwise" />Refresh</button>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', code: '' }); setModalOpen(true); }}>
            <i className="bi bi-plus-circle-fill" />Add County
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="input-group" style={{ flex: 1 }}>
          <i className="bi bi-search input-icon" />
          <input className="form-control" placeholder="Search counties..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="loading-spinner"><div className="spinner" /><span>Loading...</span></div>
            : filtered.length === 0 ? <div className="empty-state"><i className="bi bi-geo-alt" /><h3>No counties found</h3></div>
            : (
              <table className="sha-table">
                <thead>
                  <tr><th>#</th><th>County Name</th><th>Code</th><th>Members</th><th>Facilities</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: 14 }}>
                            <i className="bi bi-geo-fill" />
                          </div>
                          <div style={{ fontWeight: 600 }}>{item.name} County</div>
                        </div>
                      </td>
                      <td><span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{item.code}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-people-fill" style={{ color: 'var(--primary)', fontSize: 13 }} />
                          <span style={{ fontWeight: 600 }}>{(item.member_count || 0).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-hospital-fill" style={{ color: '#0891b2', fontSize: 13 }} />
                          <span style={{ fontWeight: 600 }}>{item.facility_count || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => { setEditItem(item); setForm({ name: item.name, code: item.code }); setModalOpen(true); }}><i className="bi bi-pencil" /></button>
                          <button className="action-btn delete" onClick={() => { setDeleteId(item.id); setConfirmOpen(true); }}><i className="bi bi-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit County' : 'Add County'} icon="bi-geo-alt-fill" size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg" />Save</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">County Name *</label>
          <input className="form-control" placeholder="e.g. Nairobi" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">County Code *</label>
          <input className="form-control" placeholder="e.g. NBI" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={10} />
        </div>
      </Modal>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving}
        title="Remove County?" message="This will remove the county. Ensure no members or facilities are assigned to it." />
    </div>
  );
}