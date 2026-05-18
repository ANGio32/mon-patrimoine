interface TopBarProps {
  loading: boolean;
  onRefresh: () => void;
}

export function TopBar({ loading, onRefresh }: TopBarProps) {
  const today = new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ background: '#F2F1ED' }} className="sticky top-0 z-20 px-5 pt-5 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D0D0D', margin: 0, lineHeight: 1.2 }}>
            Bonjour, Ange
          </h1>
          <p style={{ fontSize: 12, color: '#999999', marginTop: 2, fontFamily: 'Manrope, sans-serif', textTransform: 'capitalize' }}>
            {today}
          </p>
        </div>
        <button
          onClick={onRefresh}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#0D0D0D', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontFamily: 'monospace',
          }}
        >
          <span className={loading ? 'spinning' : ''} style={{ display: 'inline-block', lineHeight: 1 }}>↻</span>
        </button>
      </div>
    </div>
  );
}
