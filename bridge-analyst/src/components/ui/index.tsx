import type { ReactNode } from 'react';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[20px] p-5 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
      {children}
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[#8E8E93] mb-4">{children}</p>
  );
}

// ─── PrimaryBtn ───────────────────────────────────────────────────────────────
export function PrimaryBtn({
  children, onClick, disabled = false, type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[56px] rounded-[16px] text-white font-semibold text-[17px] tracking-[-0.2px] disabled:opacity-40 active:opacity-80 transition-opacity"
      style={{ backgroundColor: '#007AFF' }}
    >
      {children}
    </button>
  );
}

// ─── GhostBtn ─────────────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-[15px] px-2 py-2 active:opacity-60 transition-opacity"
      style={{ color: '#007AFF' }}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  unit?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}
export function Input({ label, value, onChange, type = 'text', unit, hint, min, max, step }: InputProps) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[13px] font-medium text-[#3C3C43]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value)}
          className="w-full h-[44px] rounded-[10px] px-3 text-[16px] text-black focus:outline-none transition-all"
          style={{
            border: '1px solid #C6C6C8',
            backgroundColor: '#F2F2F7',
            paddingRight: unit ? '2.75rem' : undefined,
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#007AFF';
            e.currentTarget.style.backgroundColor = '#fff';
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = '#C6C6C8';
            e.currentTarget.style.backgroundColor = '#F2F2F7';
          }}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8E8E93] pointer-events-none">{unit}</span>
        )}
      </div>
      {hint && <p className="text-[12px] text-[#8E8E93]">{hint}</p>}
    </div>
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────
interface SelectInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}
export function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[13px] font-medium text-[#3C3C43]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full h-[44px] rounded-[10px] px-3 text-[16px] text-black focus:outline-none appearance-none"
          style={{ border: '1px solid #C6C6C8', backgroundColor: '#F2F2F7' }}
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  subtitle?: string;
}
export function Toggle({ label, checked, onChange, subtitle }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-1 gap-3"
      aria-pressed={checked}
    >
      <div className="text-left">
        <p className="text-[16px] text-black">{label}</p>
        {subtitle && <p className="text-[13px] text-[#8E8E93] mt-[2px]">{subtitle}</p>}
      </div>
      <div
        className="relative shrink-0 transition-colors duration-200"
        style={{
          width: 51, height: 31, borderRadius: 15.5,
          backgroundColor: checked ? '#34C759' : '#E5E5EA',
        }}
      >
        <span
          className="absolute bg-white rounded-full shadow-sm transition-transform duration-200"
          style={{
            top: 2, width: 27, height: 27,
            transform: checked ? 'translateX(20px)' : 'translateX(2px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </button>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[11px]" style={{ borderBottom: '0.5px solid #C6C6C8' }}>
      <span className="text-[15px] text-[#3C3C43]">{label}</span>
      <span className={`text-[15px] font-semibold text-black ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

// ─── BigStat ──────────────────────────────────────────────────────────────────
export function BigStat({ label, value, unit, color = 'accent' }: { label: string; value: string; unit?: string; color?: 'accent' | 'error' | 'ok' }) {
  const c = { accent: '#007AFF', error: '#FF3B30', ok: '#34C759' }[color];
  return (
    <div className="bg-white rounded-[20px] p-4 flex flex-col"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8E8E93] mb-2">{label}</p>
      <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: c }}>
        {value}
      </p>
      {unit && <p className="text-[13px] text-[#8E8E93] mt-1">{unit}</p>}
    </div>
  );
}

// ─── CheckBadge ───────────────────────────────────────────────────────────────
export function CheckBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className="inline-flex items-center gap-[6px] px-3 py-[6px] rounded-full text-[13px] font-semibold"
      style={{
        backgroundColor: ok ? '#F0FFF4' : '#FFF2F1',
        color: ok ? '#1A8A3C' : '#D70015',
      }}
    >
      <span style={{ fontSize: 12 }}>{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-[5px] rounded-full px-3 py-[5px]"
      style={{ backgroundColor: '#EAF3FF' }}>
      <span className="text-[12px] text-[#8E8E93]">{label}</span>
      <span className="text-[13px] font-bold" style={{ color: '#007AFF' }}>{value}</span>
    </div>
  );
}

// ─── WarnBox ──────────────────────────────────────────────────────────────────
export function WarnBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] p-4 text-[13px] leading-relaxed"
      style={{ backgroundColor: '#FFF8EE', border: '1px solid #FFCC80', color: '#7A4F00' }}>
      {children}
    </div>
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] p-4 text-[13px] leading-relaxed"
      style={{ backgroundColor: '#FFF2F1', border: '1px solid #FFBBB8', color: '#D70015' }}>
      {children}
    </div>
  );
}

// ─── InfoBox ──────────────────────────────────────────────────────────────────
export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] p-4 text-[13px] leading-relaxed"
      style={{ backgroundColor: '#EAF3FF', border: '1px solid #B3D4FF', color: '#004DB3' }}>
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: '0.5px', backgroundColor: '#C6C6C8' }} />;
}
