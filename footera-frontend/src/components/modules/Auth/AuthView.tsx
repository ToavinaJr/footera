import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { LanguageSwitcher, useTranslation } from '../../../i18n';

interface AuthViewProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onRegister: (input: { name: string; email: string; password: string }) => Promise<void>;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(searchParams.get('mode') === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      setError(cause instanceof Error ? cause.message : t('auth.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas-bg px-4 py-12 flex items-center justify-center">
      <div className="fixed right-4 top-4 z-10"><LanguageSwitcher /></div>
      <section className="w-full max-w-md rounded-3xl border border-pitch-line bg-white p-7 shadow-lg sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch-primary text-xl font-extrabold text-lime-volt">F</div>
          <div>
            <p className="font-display text-2xl font-extrabold text-pitch-ink">Footera</p>
            <p className="text-sm text-slate-500">{t('auth.brandSubtitle')}</p>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-pitch-ink">{isRegistering ? t('auth.register') : t('auth.welcomeBack')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRegistering ? t('auth.joinCommunity') : t('auth.signInPrompt')}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isRegistering && (
            <label className="block text-sm font-semibold text-pitch-ink">
              {t('auth.name')}
              <span className="relative mt-1 block">
                <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input id="auth-name" name="name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-3 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
              </span>
            </label>
          )}

          <label className="block text-sm font-semibold text-pitch-ink">
            {t('auth.email')}
            <span className="relative mt-1 block">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input id="auth-email" name="email" required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-10 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
            </span>
          </label>

          <label className="block text-sm font-semibold text-pitch-ink">
            {t('auth.password')}
            <span className="relative mt-1 block">
              <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input id="auth-password" name="password" required type={isPasswordVisible ? 'text' : 'password'} minLength={isRegistering ? 12 : 1} maxLength={256} autoComplete={isRegistering ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} className="min-h-11 w-full rounded-xl border border-pitch-line bg-pitch-input pl-10 pr-12 text-sm outline-hidden focus:border-pitch-primary disabled:cursor-wait disabled:opacity-60" />
              <button
                type="button"
                aria-label={isPasswordVisible ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={isPasswordVisible}
                disabled={isSubmitting}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-pitch-light hover:text-pitch-primary disabled:cursor-wait"
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </span>
            {isRegistering && <span className="mt-1 block text-xs font-normal text-slate-500">{t('auth.passwordMinimum')}</span>}
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pitch-action px-4 font-bold text-white transition-colors hover:bg-pitch-action-hover disabled:cursor-wait disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            {isSubmitting ? t('auth.wait') : isRegistering ? t('auth.createAccount') : t('auth.login')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegistering ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <button type="button" disabled={isSubmitting} onClick={() => { setIsRegistering((current) => !current); setError(''); }} className="font-bold text-pitch-primary hover:underline disabled:cursor-wait disabled:opacity-60">
            {isRegistering ? t('auth.login') : t('auth.register')}
          </button>
        </p>
      </section>
    </main>
  );
};
