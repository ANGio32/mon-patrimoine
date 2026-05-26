import { useState } from 'react';
import { Loader, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Auth() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (tab === 'signup' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Mot de passe trop court (6 caractères minimum).');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signup') {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setSuccess('Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.');
        setTab('signin');
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        // AppContext detects session change automatically
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue.';
      setError(msg.includes('Invalid login') ? 'Email ou mot de passe incorrect.' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-[72px] h-[72px] rounded-[22px] bg-[#3D4A2F] flex items-center justify-center shadow-lg mb-4">
          <Zap size={36} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-black text-text tracking-tight">Morphiq</h1>
        <p className="text-muted text-sm mt-1">Ton coach nutrition & fitness IA</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-border shadow-card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['signin', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                tab === t ? 'text-text border-b-2 border-text' : 'text-muted'
              }`}
            >
              {t === 'signin' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field pl-10 pr-11 w-full"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Confirm password (signup only) */}
          {tab === 'signup' && (
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="input-field pl-10 w-full"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
          {success && <p className="text-green-500 text-xs text-center px-2">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 !mt-5"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {tab === 'signin' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-muted mt-8 px-6">
        Tes données sont chiffrées et synchronisées dans le cloud.
      </p>
    </div>
  );
}
