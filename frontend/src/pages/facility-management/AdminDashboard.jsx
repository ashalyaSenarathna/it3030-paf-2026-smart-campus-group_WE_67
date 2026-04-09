import React, { useState, useEffect } from 'react';
import { resourceApi } from '../../api/api';
import { Link } from 'react-router-dom';
import { RESOURCE_TYPES, RESOURCE_STATUSES } from './resourceConstants';
import './AdminDashboard.css';

const TABS = {
  DASHBOARD: 'Dashboard',
  RESOURCES: 'Manage Resources',
  BOOKINGS: 'Booking Management',
  MAINTENANCE: 'Maintenance & Support'
};


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(TABS.RESOURCES); // Defaulting to Resources for this task
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const defaultForm = {
    name: '',
    type: RESOURCE_TYPES[0],
    capacity: 0,
    location: '',
    description: '',
    status: RESOURCE_STATUSES[0]
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await resourceApi.getAll();
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      showNotification('Failed to fetch resources');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData(resource);
    } else {
      setEditingResource(null);
      setFormData(defaultForm);
    }
    setIsModalOpen(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingResource) {
        await resourceApi.update(editingResource.id, formData);
        showNotification('Resource updated successfully!');
      } else {
        await resourceApi.create(formData);
        showNotification('New resource added successfully!');
      }
      fetchResources();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving resource:', error);
      showNotification('Failed to save resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await resourceApi.delete(id);
        showNotification('Resource deleted successfully!');
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        showNotification('Failed to delete resource');
      }
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || res.type === filterType;
    const matchesStatus = filterStatus === 'All' || res.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: resources.length,
    available: resources.filter(r => r.status === 'Available').length,
    maintenance: resources.filter(r => r.status === 'Maintenance').length
  };

  const renderResourcesTab = () => (
    <div className="tab-pane">
      <header className="tab-header">
        <h1>Manage Resources</h1>
        <p>Complete control over university facilities and equipment.</p>
      </header>

      {/* Statistics Recap */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Resources</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active/Available</div>
          <div className="value">{stats.available}</div>
        </div>
        <div className="stat-card">
          <div className="label">Under Maintenance</div>
          <div className="value">{stats.maintenance}</div>
        </div>
        <div className="stat-card">
          <div className="label">Occupied</div>
          <div className="value">{resources.length - stats.available - stats.maintenance}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-left">
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="filter-select" 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Categories</option>
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {RESOURCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="action-right">
          <Link to="/facility-management/resource-catalogue" className="btn-secondary" style={{ textDecoration: 'none' }}>
            👁️ View Catalogue
          </Link>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <span>+</span> Add New Resource
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="data-table-container">
        {filteredResources.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((res) => (
                <tr key={res.id}>
                  <td style={{ fontWeight: 600, color: '#c084fc' }}>{res.id}</td>
                  <td>{res.name}</td>
                  <td><span style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: '#c8c7cc', border: '1px solid rgba(255,255,255,0.08)' }}>{res.type}</span></td>
                  <td>{res.capacity} Seats</td>
                  <td>{res.location}</td>
                  <td>
                    <span className={`status-pill status-${res.status.toLowerCase()}`}>
                      {res.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" title="Edit" onClick={() => handleOpenModal(res)}>✏️</button>
                      <button className="icon-btn" title="Delete" onClick={() => handleDeleteResource(res.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">SmartHub Admin</div>
        <ul className="sidebar-nav">
          {[
            { id: TABS.DASHBOARD, icon: '📊' },
            { id: TABS.RESOURCES, icon: '🏢' },
            { id: TABS.BOOKINGS, icon: '📅' },
            { id: TABS.MAINTENANCE, icon: '🛠️' }
          ].map((tab) => (
            <li 
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.id}</span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        {activeTab === TABS.RESOURCES ? renderResourcesTab() : (
          <div className="tab-pane">
            <h1>{activeTab}</h1>
            <p>Content for {activeTab} will appear here.</p>
          </div>
        )}
      </main>

      {/* Success/Error Toast */}
      {toast && <div className="toast">✅ {toast}</div>}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveResource}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Resource Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {RESOURCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacity (Seats)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Location</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description (Extra Details)</label>
                  <textarea 
                    rows="3" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {RESOURCE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Image Upload (Optional)</label>
                  <input type="file" accept="image/*" disabled />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingResource ? 'Update Resource' : 'Add Resource')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
