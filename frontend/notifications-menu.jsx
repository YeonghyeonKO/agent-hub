// ─────────────────────────────────────────────────────────────────────
// NotificationsMenu — bell icon with unread badge + dropdown
// ─────────────────────────────────────────────────────────────────────

function NotificationsMenu() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const ref = React.useRef(null);

  const refreshCount = React.useCallback(() => {
    api.notifications.unreadCount().then(r => setUnread(r.unread_count || 0)).catch(() => {});
  }, []);

  const loadList = React.useCallback(() => {
    api.notifications.list().then(r => {
      setItems(r.items || []);
      setUnread(r.unread_count || 0);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 60000);  // 1-min poll
    return () => clearInterval(id);
  }, [refreshCount]);

  React.useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  React.useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleOpen = (n) => {
    api.notifications.read(n.id).catch(() => {});
    if (n.link) {
      window.location.hash = n.link.replace(/^#/, '');
      // force re-evaluation if route is same
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    setOpen(false);
    setUnread(u => Math.max(0, u - (n.is_read ? 0 : 1)));
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const handleReadAll = async () => {
    await api.notifications.readAll().catch(() => {});
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnread(0);
  };

  return (
    <div ref={ref} className="notif-menu" style={{position: 'relative'}}>
      <button className="btn btn-ghost notif-bell" onClick={() => setOpen(o => !o)} title={t('notif_title')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span style={{fontWeight: 600}}>{t('notif_title')}</span>
            {unread > 0 && (
              <button className="btn btn-ghost btn-sm" style={{fontSize: 11}} onClick={handleReadAll}>
                {t('notif_read_all')}
              </button>
            )}
          </div>
          <div className="notif-dropdown-body">
            {items.length === 0 && (
              <div className="muted-sm" style={{padding: 20, textAlign: 'center'}}>{t('notif_empty')}</div>
            )}
            {items.map(n => (
              <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`} onClick={() => handleOpen(n)}>
                <div className="notif-item-msg">{n.message}</div>
                <div className="notif-item-meta">{fmtDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

window.NotificationsMenu = NotificationsMenu;
