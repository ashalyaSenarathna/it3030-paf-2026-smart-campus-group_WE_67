import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resourceApi } from '../../api/api';
import { getCurrentUser } from '../../auth/api';
import RequestBookingModal from '../Booking/RequestBookingModal';
import './ResourceCatalogue.css';
import { RESOURCE_TYPE_ICONS, RESOURCE_TYPES, RESOURCE_STATUSES } from './resourceConstants';
const STATUS_OPTIONS = [
  { value: 'All',         label: 'All Statuses', color: '#6b7280', bg: '#f3f4f6' },
  { value: 'Available',   label: 'Available',    color: '#065f46', bg: '#d1fae5' },
  { value: 'Occupied',    label: 'Occupied',     color: '#92400e', bg: '#fef3c7' },
  { value: 'Maintenance', label: 'Maintenance',  color: '#991b1b', bg: '#fee2e2' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: '#991b1b', bg: '#fee2e2' },
];

const SORT_OPTIONS = [
  { value: 'default',      label: 'Default Order' },
  { value: 'name-asc',     label: 'Name (A → Z)' },
  { value: 'name-desc',    label: 'Name (Z → A)' },
  { value: 'capacity-asc', label: 'Capacity (Low → High)' },
  { value: 'capacity-desc',label: 'Capacity (High → Low)' },
];

function ResourceCatalogue() {
  const [resources, setResources]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy]           = useState('default');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await resourceApi.getAll();
        setResources(response.data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch(e){}
    }
    fetchUser();
    fetchResources();
  }, []);

  const types = useMemo(
    () => ['All', ...Array.from(new Set(resources.map((r) => r.type).filter(Boolean)))],
    [resources]
  );

  const filteredResources = useMemo(() => {
    let list = resources.filter((resource) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        (resource.name && resource.name.toLowerCase().startsWith(q));
      const matchesType   = typeFilter === 'All' || resource.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || resource.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });

    switch (sortBy) {
      case 'name-asc':      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'name-desc':     list = [...list].sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
      case 'capacity-asc':  list = [...list].sort((a, b) => (a.capacity || 0) - (b.capacity || 0)); break;
      case 'capacity-desc': list = [...list].sort((a, b) => (b.capacity || 0) - (a.capacity || 0)); break;
      default: break;
    }
    return list;
  }, [query, resources, statusFilter, typeFilter, sortBy]);

  const hasActiveFilters = query || typeFilter !== 'All' || statusFilter !== 'All' || sortBy !== 'default';

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('All');
    setStatusFilter('All');
    setSortBy('default');
  };

  return (
    <div className="resource-catalogue">


      {/* ---- HEADER ---- */}
      <header className="catalogue-header">
        <h1>Resource Catalogue</h1>
        <p>Explore, search, and filter all campus resources.</p>
      </header>

      {/* ---- FILTER PANEL ---- */}
      <div className="filter-panel">

        {/* Search Bar */}
        <div className="filter-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="resource-search"
            className="catalogue-search"
            type="text"
            placeholder="Search by name..."
            aria-label="Search resources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Filter Row */}
        <div className="filter-row">
          {/* Type Dropdown */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="type-filter">Type</label>
            <select
              id="type-filter"
              className="filter-select-dropdown"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
              data-active={typeFilter !== 'All' ? 'true' : 'false'}
            >
              <option value="All">All Types</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{RESOURCE_TYPE_ICONS[t] || '🏫'} {t}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              className="filter-select-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              data-active={statusFilter !== 'All' ? 'true' : 'false'}
            >
              <option value="All">All Statuses</option>
              {RESOURCE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sort + Clear */}
          <div className="filter-group filter-group-right">
            <span className="filter-label">Sort By</span>
            <div className="sort-and-clear">
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort resources"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  ✕ Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-bar">
          <span className="results-count">
            {loading ? 'Loading…' : `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found`}
          </span>
          {hasActiveFilters && (
            <div className="active-filter-tags">
              {query && <span className="active-tag">🔍 "{query}"</span>}
              {typeFilter !== 'All' && <span className="active-tag">{RESOURCE_TYPE_ICONS[typeFilter] || '🏫'} {typeFilter}</span>}
              {statusFilter !== 'All' && <span className="active-tag">⚡ {statusFilter}</span>}
              {sortBy !== 'default' && <span className="active-tag">↕ {SORT_OPTIONS.find(o=>o.value===sortBy)?.label}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ---- GRID ---- */}
      {loading ? (
        <div className="catalogue-loading">
          <div className="loading-spinner"></div>
          <p>Loading resources…</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="resource-grid" id="resource-grid">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="resource-card" id={`resource-card-${resource.id}`}>
              <div className="card-glass-effect"></div>
              <div className="resource-icon">{RESOURCE_TYPE_ICONS[resource.type] || '🏫'}</div>
              <div className="card-header-flex">
                <div className={`status-dot ${(resource.status || '').toLowerCase()}`}></div>
              </div>
              <h2>{resource.name}</h2>
              <p className="resource-description">{resource.description || 'No description provided.'}</p>
              <div className="resource-meta">
                <span className="type-tag">{resource.type}</span>
                <span className="capacity-tag">
                  {(resource.type === 'Equipment' || resource.type === 'Sports Equipment') ? '📦 ' : '👥 '}
                  {resource.capacity}
                  {(resource.type === 'Equipment' || resource.type === 'Sports Equipment') ? '' : ' Seats'}
                </span>
                <span className="location-tag">
                  {(resource.type === 'Equipment' || resource.type === 'Sports Equipment') ? '🚚 ' : '📍 '}
                  {resource.location}
                </span>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={`resource-status-badge ${(resource.status || '').toLowerCase()}`}>
                  {resource.status}
                </div>
                {resource.status !== 'Maintenance' && resource.status !== 'OUT_OF_SERVICE' && (
                  <button 
                    className="clear-filters-btn-lg" 
                    onClick={() => {
                      if (!currentUser) alert("Please log in to book this resource.");
                      else setSelectedResource(resource);
                    }}
                    style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="catalogue-empty-state">
          <div className="empty-icon">🔎</div>
          <h3>No resources found</h3>
          <p>Try adjusting your search or filters.</p>
          {hasActiveFilters && (
            <button className="clear-filters-btn-lg" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {selectedResource && (
        <RequestBookingModal
          resource={selectedResource}
          user={currentUser}
          onClose={() => setSelectedResource(null)}
          onSuccess={() => {
            alert('Booking requested successfully!');
            setSelectedResource(null);
          }}
        />
      )}
    </div>
  );
}

export default ResourceCatalogue;
