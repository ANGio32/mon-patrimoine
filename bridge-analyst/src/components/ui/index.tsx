import React from 'react';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8EBF0] p-[18px_16px] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#94A3B8] mb-3">{children}</p>
  );
}

// ─── PrimaryBtn ───────────────────────────────────────────────────────────────
export function PrimaryBtn({
  children, onClick, disabled = false, type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[54px] rounded-2xl bg-[#2563EB] text-white font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}

// ─── GhostBtn ─────────────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[#64748B] font-medium text-[14px] px-1 py-2 active:opacity-70 transition-opacity"
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
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-[#64748B]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(e.target.value)}
          className="w-full h-12 rounded-xl border-[1.5px] border-[#E8EBF0] bg-white px-3 text-[15px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors"
          style={unit ? { paddingRight: '2.75rem' } : {}}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#94A3B8]">{unit}</span>
        )}
      </div>
      {hint && <p className="text-[12px] text-[#94A3B8]">{hint}</p>}
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
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-medium text-[#64748B]">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full h-12 rounded-xl border-[1.5px] border-[#E8EBF0] bg-white px-3 text-[15px] text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition-colors appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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
      className="flex items-center justify-between w-full py-1"
      aria-pressed={checked}
    >
      <div className="text-left">
        <p className="text-[14px] font-medium text-[#0F172A]">{label}</p>
        {subtitle && <p className="text-[12px] text-[#94A3B8]">{subtitle}</p>}
      </div>
      <div
        className="relative w-11 h-[26px] rounded-full transition-colors duration-200 shrink-0"
        style={{ backgroundColor: checked ? '#2563EB' : '#E8EBF0' }}
      >
        <span
          className="absolute top-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(3px)' }}
        />
      </div>
    </button>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[10px] border-b border-[#E8EBF0] last:border-0">
      <span className="text-[14px] text-[#64748B]">{label}</span>
      <span className={`text-[14px] font-semibold text-[#0F172A] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ─── BigStat ──────────────────────────────────────────────────────────────────
export function BigStat({ label, value, unit, color = 'accent' }: { label: string; value: string; unit?: string; color?: 'accent' | 'error' | 'ok' }) {
  const colors = { accent: '#2563EB', error: '#DC2626', ok: '#16A34A' };
  return (
    <div className="bg-white rounded-2xl border border-[#E8EBF0] p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">{label}</p>
      <p className="font-mono font-bold text-[22px] leading-tight" style={{ color: colors[color] }}>
        {value}<span className="text-[13px] font-normal text-[#94A3B8] ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ─── CheckBadge ───────────────────────────────────────────────────────────────
export function CheckBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border"
      style={{
        backgroundColor: ok ? '#F0FDF4' : '#FEF2F2',
        color: ok ? '#16A34A' : '#DC2626',
        borderColor: ok ? '#BBF7D0' : '#FECACA',
      }}
    >
      <span>{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#EFF6FF] rounded-[20px] px-3 py-1.5">
      <span className="text-[11px] text-[#64748B]">{label}</span>
      <span className="text-[12px] font-bold text-[#2563EB]">{value}</span>
    </div>
  );
}

// ─── WarnBox ──────────────────────────────────────────────────────────────────
export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3 text-[12px] text-[#92400E] leading-relaxed">
      {children}
    </div>
  );
}

// ─── ErrorBox ─────────────────────────────────────────────────────────────────
export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3 text-[12px] text-[#991B1B] leading-relaxed">
      {children}
    </div>
  );
}

// ─── InfoBox ──────────────────────────────────────────────────────────────────
export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3 text-[12px] text-[#1E40AF] leading-relaxed">
      {children}
    </div>
  );
}
