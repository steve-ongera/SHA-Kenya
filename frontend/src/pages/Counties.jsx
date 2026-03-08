import { useState, useEffect, useCallback } from 'react';
import { countiesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const PAGE_SIZE = 10;

export default function Counties() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // debounced separately

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  // Debounce: only fire search after user stops typing 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();

      const data = await countiesAPI.list(params);

      if (data && typeof data.count === 'number') {
        // Paginated DRF response: { count, results, next, previous }
        setItems(data.results);
        setTotal(data.count);
      } else {
        // Flat array fallback
        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setTotal(arr.length);
      }
    } catch {
      toast.error('Failed to load counties');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      return toast.warning('County name and code are required');
    }
    setSaving(true);
    try {
      if (editItem) {
        await countiesAPI.update(editItem.id, form);
        toast.success('County updated successfully');
      } else {
        await countiesAPI.create(form);
        toast.success('County added successfully');
      }
      setModalOpen(false);
      load();
    } catch (e) {
      // Surface DRF field errors properly
      const msg =
        e?.detail ||
        e?.code?.[0] ||
        e?.name?.[0] ||
        (typeof e === 'object' ? Object.values(e).flat()[0] : null) ||
        'Failed to save county';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await countiesAPI.delete(deleteId);
      toast.success('County removed');
      setConfirmOpen(false);
      // Step back if we just deleted the last item on this page
      if (items.length === 1 && page > 1) setPage(p => p - 1);
      else load();
    } catch {
      toast.error('Failed to delete county');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const pageWindow = () => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Counties</h1>
          <p>
            {loading ? 'Loading...' : `${total.toLocaleString()} ${total === 1 ? 'county' : 'counties'} of Kenya`}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} />Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', code: '' }); setModalOpen(true); }}>
            <i className="bi bi-plus-circle-fill" />Add County
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="filters-bar">
        <div className="input-group" style={{ flex: 1, maxWidth: 400 }}>
          <i className="bi bi-search input-icon" />
          <input
            className="form-control"
            placeholder="Search by county name or code..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        {searchInput && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
          >
            <i className="bi bi-x-circle" />Clear
          </button>
        )}
        {search && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-funnel-fill" style={{ color: 'var(--primary)' }} />
            Results for <b>"{search}"</b>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" /><span>Loading counties...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-geo-alt" style={{ fontSize: 40 }} />
              <h3>{search ? `No counties match "${search}"` : 'No counties yet'}</h3>
              {!search && <p style={{ marginTop: 4, fontSize: 13 }}>Click "Add County" to get started.</p>}
            </div>
          ) : (
            <table className="sha-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}>#</th>
                  <th>County Name</th>
                  <th>Code</th>
                  <th>Members</th>
                  <th>Facilities</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32,
                          background: 'var(--primary-light)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--primary)', fontSize: 14, flexShrink: 0,
                        }}>
                          <i className="bi bi-geo-fill" />
                        </div>
                        <span style={{ fontWeight: 600 }}>{item.name} County</span>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                        {item.code}
                      </span>
                    </td>

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
                        <button
                          className="action-btn edit"
                          title="Edit county"
                          onClick={() => { setEditItem(item); setForm({ name: item.name, code: item.code }); setModalOpen(true); }}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete county"
                          onClick={() => { setDeleteId(item.id); setConfirmOpen(true); }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="pagination-bar">
            <span>
              Showing{' '}
              <b>{(page - 1) * PAGE_SIZE + 1}</b>–<b>{Math.min(page * PAGE_SIZE, total)}</b>
              {' '}of <b>{total.toLocaleString()}</b> counties
              {search && <span style={{ color: 'var(--primary)' }}> matching "{search}"</span>}
            </span>

            <div className="pagination-buttons">
              <button title="First page" onClick={() => setPage(1)} disabled={page === 1}>
                <i className="bi bi-chevron-double-left" />
              </button>
              <button title="Previous" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <i className="bi bi-chevron-left" />
              </button>

              {pageWindow().map(p => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}

              <button title="Next" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <i className="bi bi-chevron-right" />
              </button>
              <button title="Last page" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                <i className="bi bi-chevron-double-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit County' : 'Add County'}
        icon="bi-geo-alt-fill"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14 }} />Saving...</>
                : <><i className="bi bi-check-lg" />{editItem ? 'Update' : 'Save'}</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">County Name *</label>
          <input
            className="form-control"
            placeholder="e.g. Nairobi"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">County Code *</label>
          <input
            className="form-control"
            placeholder="e.g. NBI"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            maxLength={10}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Short unique identifier — 2 to 4 letters, e.g. NBI, MSA, KSM
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete ── */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Remove County?"
        message="This will permanently remove the county. Ensure no members or facilities are assigned to it first."
      />
    </div>
  );
}