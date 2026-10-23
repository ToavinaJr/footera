import React, { useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';

interface AuthViewProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) await onRegister({ name, email, password });
      else await onLogin({ email, password });
      setName('');
      setEmail('');
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de vous authentifier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas-bg px-4 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-pitch-line bg-white p-7 shadow-lg sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch-primary text-xl font-extrabold text-lime-volt">F</div>
          <div>
            <p className="font-display text-2xl font-extrabold text-pitch-ink">Footera</p>
            <p className="text-sm text-slate-500">Votre espace football</p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-pitch-ink">{isRegistering ? 'Créer un compte' : 'Bon retour'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRegistering ? 'Rejoignez la communauté Footera.' : 'Connectez-vous pour accéder à votre espace.'}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isRegistering && (
            <label className="block text-sm font-semibold text-pitch-ink">
              Nom complet
              <span className="relative mt-1 block">
                <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-3 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
              </span>
            </label>
          )}

          <label className="block text-sm font-semibold text-pitch-ink">
            Adresse e-mail
            <span className="relative mt-1 block">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-3 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
            </span>
          </label>

          <label className="block text-sm font-semibold text-pitch-ink">
            Mot de passe
            <span className="relative mt-1 block">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input required type="password" minLength={isRegistering ? 12 : 1} maxLength={256} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-3 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
            </span>
            {isRegistering && <span className="mt-1 block text-xs font-normal text-slate-500">12 caractères minimum.</span>}
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pitch-action px-4 font-bold text-white transition-colors hover:bg-pitch-action-hover disabled:cursor-wait disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            {isSubmitting ? 'Veuillez patienter…' : isRegistering ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegistering ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button type="button" disabled={isSubmitting} onClick={() => { setIsRegistering((current) => !current); setError(''); }} className="font-bold text-pitch-primary hover:underline disabled:cursor-wait disabled:opacity-60">
            {isRegistering ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </section>
    </main>
  );
};
