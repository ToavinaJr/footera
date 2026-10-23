import React from 'react';
import { ArrowRight, CalendarDays, MapPin, Shield, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher, useTranslation } from '../../../i18n';

export const LandingView: React.FC = () => {
  const { t } = useTranslation();
  const features = [
    { icon: Users, title: t('landing.featurePlayers'), description: t('landing.featurePlayersDescription') },
    { icon: CalendarDays, title: t('landing.featureMatches'), description: t('landing.featureMatchesDescription') },
    { icon: MapPin, title: t('landing.featurePitches'), description: t('landing.featurePitchesDescription') },
  ];

  return (
  <main className="page-enter min-h-screen overflow-hidden bg-canvas-bg text-pitch-ink">
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-2.5" aria-label={t('landing.brand')}>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch-primary font-display text-xl font-extrabold text-lime-volt">F</span>
        <span className="font-display text-2xl font-extrabold tracking-tight">Footera</span>
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link to="/auth" className="inline-flex min-h-11 items-center justify-center rounded-full border border-pitch-line bg-white px-5 text-sm font-bold text-pitch-ink transition-colors hover:border-pitch-primary hover:text-pitch-primary">
          {t('landing.login')}
        </Link>
      </div>
    </header>

    <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-pitch-line bg-white px-3 py-1.5 text-xs font-bold text-pitch-primary">
          <Shield className="h-4 w-4" aria-hidden="true" />
          {t('landing.connectedFootball')}
        </span>
        <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          {t('landing.titleLead')} <span className="text-pitch-primary">{t('landing.titleAccent')}</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          {t('landing.description')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/auth?mode=register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pitch-action px-6 font-bold text-white shadow-sm transition-colors hover:bg-pitch-action-hover">
            {t('landing.join')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/auth" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-pitch-line bg-white px-6 font-bold text-pitch-ink transition-colors hover:border-pitch-primary hover:text-pitch-primary">
            {t('landing.haveAccount')}
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">{t('landing.oneAccount')}</p>
      </div>

      <div className="relative mx-auto w-full max-w-lg">
        <div className="float-soft absolute -inset-8 rounded-[3rem] bg-lime-volt/20 blur-3xl" aria-hidden="true" />
        <div className="pitch-tactical-grid relative overflow-hidden rounded-[2rem] border border-pitch-primary/20 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-volt">{t('landing.season')}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{t('landing.playTogether')}</h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-volt text-pitch-ink">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="relative my-8 aspect-[1.25] overflow-hidden rounded-2xl border border-white/20 bg-[#0e5632]">
            <div className="absolute inset-4 rounded-xl border border-white/50" />
            <div className="absolute left-1/2 top-0 h-full border-l border-white/50" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50" />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-volt shadow-lg" />
            <div className="absolute bottom-7 left-8 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-pitch-ink shadow-lg">
              <Users className="h-4 w-4 text-pitch-primary" aria-hidden="true" />
              {t('landing.community')}
            </div>
          </div>
          <p className="text-sm leading-6 text-white/80">{t('landing.tools')}</p>
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 md:pb-24">
      <div className="mb-6 max-w-xl">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{t('landing.sectionTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t('landing.sectionDescription')}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="hover-lift rounded-2xl border border-pitch-line bg-white p-5 shadow-sm sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pitch-light text-pitch-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-lg font-extrabold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>

    <footer className="border-t border-pitch-line bg-white px-5 py-6 text-center text-xs text-slate-500">
      {t('landing.footer')}
    </footer>
  </main>
  );
};
