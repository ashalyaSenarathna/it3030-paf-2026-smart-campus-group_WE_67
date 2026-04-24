import React, { useEffect, useRef, useState, useCallback } from 'react';
import { notificationApi } from './notificationApi';
import './NotificationPanel.css';

const TYPE_ICONS = {
  BOOKING_APPROVED: '✅',
  BOOKING_REJECTED: '❌',
  TICKET_STATUS_CHANGED: '🔧',
  TICKET_COMMENT: '💬',
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationPanel = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const pollRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationApi.getUnreadCount(user.id);
      setUnreadCount(data?.count ?? 0);
    } catch {/* silent */}
  }, [user?.id]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await notificationApi.getAll(user.id);
      setNotifications(data ?? []);
      setUnreadCount((data ?? []).filter(n => !n.read).length);
    } catch {/* silent */}
    finally { setLoading(false); }
  }, [user?.id]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount, user?.id]);

  // Load notifications when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {/* silent */}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {/* silent */}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {/* silent */}
  };

  if (!user) return null;

  return (
    <div className="notif-wrapper" ref={panelRef}>
      {/* Bell button */}
      <button
        className={`notif-bell global-nav-item ${open ? 'notif-bell--active' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notifications"
        style={{ position: 'relative', fontSize: '1rem' }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span className="notif-panel__title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-panel__body">
            {loading ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <span className="notif-item__icon">
                    {TYPE_ICONS[n.type] ?? '🔔'}
                  </span>
                  <div className="notif-item__content">
                    <p className="notif-item__title">{n.title}</p>
                    <p className="notif-item__msg">{n.message}</p>
                    <span className="notif-item__time">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                  <button
                    className="notif-item__delete"
                    onClick={(e) => handleDelete(n.id, e)}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
