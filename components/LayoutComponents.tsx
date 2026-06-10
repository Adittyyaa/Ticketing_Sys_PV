export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {children}
    </div>
  )
}

export function Navbar() {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>Ticketing App</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
            PV Advisory
          </span>
          <span style={{ padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '12px', color: '#6b7280' }}>
            Enterprise
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search tickets... ⌘K"
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            width: '250px',
            backgroundColor: '#F9FAFB',
          }}
        />
        <span style={{ fontSize: '20px', cursor: 'pointer' }}>🔔</span>
        <span style={{ fontSize: '20px', cursor: 'pointer' }}>⚙️</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#1f2937',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            SB
          </div>
          <span style={{ fontSize: '14px', color: '#1f2937' }}>Saurav Bhandari</span>
        </div>
      </div>
    </nav>
  )
}

export function Sidebar({ onViewChange }: { onViewChange: (view: any) => void }) {
  const sections = [
    { title: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard' }] },
    { title: 'TICKETS', items: [{ id: 'tickets', label: 'Manage Tickets' }] },
  ]

  return (
    <aside
      style={{
        width: '280px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        padding: '24px 16px',
        height: 'calc(100vh - 70px)',
        overflowY: 'auto',
      }}
    >
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
            {section.title}
          </div>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange('dashboard')}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1f2937',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  )
}
