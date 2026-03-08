import { useState, useEffect, useCallback } from 'react';
import { membersAPI, countiesAPI, formatDate, formatCurrency } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const STATUS_OPTIONS = ['active', 'inactive', 'suspended'];
const GENDER_OPTIONS = [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }];

const EMPTY_FORM = {
  sha_number: '', national_id: '', first_name: '', last_name: '',
  date_of_birth: '', gender: 'M', phone: '', email: '',
  county: '', employer: '', monthly_contribution: 500, status: 'active',
};

export default function Members() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [counties, setCounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', county: '' });

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
      const data = await membersAPI.list(params);
      setMembers(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { countiesAPI.list({ page_size: 100 }).then(d => setCounties(d.results || d)).catch(() => {}); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, county: item.county || '' }); setModalOpen(true); };
  const openView = (item) => { setViewItem(item); setViewModalOpen(true); };
  const openDelete = (id) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSave = async () => {
    if (!form.national_id || !form.first_name || !form.last_name || !form.phone) {
      return toast.warning('Please fill in all required fields');
    }
    setSaving(true);
    try {
      if (editItem) {
        await membersAPI.update(editItem.id, form);
        toast.success('Member updated successfully');
      } else {
        await membersAPI.create(form);
        toast.success('Member registered successfully');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast.error(e?.detail || Object.values(e || {})[0]?.[0] || 'Failed to save member');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await membersAPI.delete(deleteId);
      toast.success('Member removed successfully');
      setConfirmOpen(false);
      load();
    } catch { toast.error('Failed to delete member'); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Members</h1>
          <p>{total.toLocaleString()} registered beneficiaries</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load}><i className="bi bi-arrow-clockwise" />Refresh</button>
          <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-person-plus-fill" />Register Member</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="input-group" style={{ flex: 2 }}>
          <i className="bi bi-search input-icon" />
          <input className="form-control" placeholder="Search by name, SHA number, National ID..." value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
        </div>
        <select className="form-control" value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="form-control" value={filters.county} onChange={e => { setFilters(f => ({ ...f, county: e.target.value })); setPage(1); }}>
          <option value="">All Counties</option>
          {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filters.search || filters.status || filters.county) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ search: '', status: '', county: '' }); setPage(1); }}>
            <i className="bi bi-x-circle" />Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>Loading members...</span></div>
          ) : members.length === 0 ? (
            <div className="empty-state"><i className="bi bi-people" /><h3>No members found</h3></div>
          ) : (
            <table className="sha-table">
              <thead>
                <tr>
                  <th>SHA Number</th><th>Full Name</th><th>National ID</th><th>County</th>
                  <th>Phone</th><th>Contribution</th><th>Status</th><th>Registered</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td><span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{m.sha_number}</span></td>
                    <td><div style={{ fontWeight: 600 }}>{m.full_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.gender === 'M' ? '♂ Male' : m.gender === 'F' ? '♀ Female' : 'Other'}</div></td>
                    <td><span className="font-mono" style={{ fontSize: 12 }}>{m.national_id}</span></td>
                    <td>{m.county_name || '—'}</td>
                    <td>{m.phone}</td>
                    <td><span className="font-mono">{formatCurrency(m.monthly_contribution)}/mo</span></td>
                    <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(m.registration_date)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn view" onClick={() => openView(m)} title="View"><i className="bi bi-eye" /></button>
                        <button className="action-btn edit" onClick={() => openEdit(m)} title="Edit"><i className="bi bi-pencil" /></button>
                        <button className="action-btn delete" onClick={() => openDelete(m.id)} title="Delete"><i className="bi bi-trash" /></button>
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Member' : 'Register New Member'}
        icon={editItem ? 'bi-pencil-square' : 'bi-person-plus-fill'} size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</> : <><i className="bi bi-check-lg" />{editItem ? 'Update' : 'Register'}</>}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-16">
          <div className="form-group">
            <label className="form-label">SHA Number</label>
            <input className="form-control" placeholder="Auto-generated if empty" value={form.sha_number}
              onChange={e => setForm(f => ({ ...f, sha_number: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">National ID *</label>
            <input className="form-control" placeholder="e.g. 12345678" value={form.national_id}
              onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input className="form-control" placeholder="First name" value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input className="form-control" placeholder="Last name" value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-control" type="date" value={form.date_of_birth}
              onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-control" placeholder="07XXXXXXXX" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" placeholder="email@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">County</label>
            <select className="form-control" value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}>
              <option value="">Select County</option>
              {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Employer</label>
            <input className="form-control" placeholder="Employer name" value={form.employer}
              onChange={e => setForm(f => ({ ...f, employer: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Contribution (KES)</label>
            <input className="form-control" type="number" min="500" value={form.monthly_contribution}
              onChange={e => setForm(f => ({ ...f, monthly_contribution: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {viewItem && (
        <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Member Details" icon="bi-person-badge" size="md"
          footer={<><button className="btn btn-outline" onClick={() => setViewModalOpen(false)}>Close</button><button className="btn btn-primary" onClick={() => { setViewModalOpen(false); openEdit(viewItem); }}><i className="bi bi-pencil" />Edit</button></>}
        >
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
              {viewItem.first_name?.[0]}{viewItem.last_name?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{viewItem.full_name}</div>
              <div style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{viewItem.sha_number}</div>
              <span className={`badge badge-${viewItem.status}`} style={{ marginTop: 4 }}>{viewItem.status}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-16">
            {[
              { label: 'National ID', value: viewItem.national_id },
              { label: 'County', value: viewItem.county_name || '—' },
              { label: 'Phone', value: viewItem.phone },
              { label: 'Email', value: viewItem.email || '—' },
              { label: 'Gender', value: viewItem.gender === 'M' ? 'Male' : viewItem.gender === 'F' ? 'Female' : 'Other' },
              { label: 'Date of Birth', value: formatDate(viewItem.date_of_birth) },
              { label: 'Employer', value: viewItem.employer || '—' },
              { label: 'Monthly Contribution', value: formatCurrency(viewItem.monthly_contribution) },
              { label: 'Total Contributions', value: formatCurrency(viewItem.total_contributions || 0) },
              { label: 'Total Claims', value: viewItem.total_claims || 0 },
              { label: 'Registration Date', value: formatDate(viewItem.registration_date) },
            ].map((d, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{d.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{d.value}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} loading={saving}
        title="Remove Member?" message="This will permanently remove the member and all associated data. This action cannot be undone." />
    </div>
  );
}