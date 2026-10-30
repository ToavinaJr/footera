import React from 'react';
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, MapPin, Quote, Shield, ShoppingBag, Trophy, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LanguageSwitcher, useTranslation } from '../../../i18n';

export const LandingView: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Users, title: t('landing.featurePlayers'), description: t('landing.featurePlayersDescription') },
    { icon: CalendarDays, title: t('landing.featureMatches'), description: t('landing.featureMatchesDescription') },
    { icon: MapPin, title: t('landing.featurePitches'), description: t('landing.featurePitchesDescription') },
    { icon: ShoppingBag, title: t('landing.featureMarketplace'), description: t('landing.featureMarketplaceDescription') },
    { icon: UserPlus, title: t('landing.featureRecruitment'), description: t('landing.featureRecruitmentDescription') },
    { icon: BarChart3, title: t('landing.featureStats'), description: t('landing.featureStatsDescription') },
  ];

  const steps = [
    { number: '01', title: t('landing.step1Title'), description: t('landing.step1Description') },
    { number: '02', title: t('landing.step2Title'), description: t('landing.step2Description') },
    { number: '03', title: t('landing.step3Title'), description: t('landing.step3Description') },
  ];

  const stats = [
    { value: '2 500+', label: t('landing.statsPlayers') },
    { value: '180+', label: t('landing.statsTeams') },
    { value: '1 200+', label: t('landing.statsMatches') },
    { value: '45+', label: t('landing.statsPitches') },
  ];

  const testimonials = [
    { name: t('landing.testimonial1Name'), role: t('landing.testimonial1Role'), text: t('landing.testimonial1Text') },
    { name: t('landing.testimonial2Name'), role: t('landing.testimonial2Role'), text: t('landing.testimonial2Text') },
    { name: t('landing.testimonial3Name'), role: t('landing.testimonial3Role'), text: t('landing.testimonial3Text') },
  ];

  const footerLinks = {
    product: [
      { label: t('landing.footerMatches'), href: '/auth' },
      { label: t('landing.footerTournaments'), href: '/auth' },
      { label: t('landing.footerPitches'), href: '/auth' },
      { label: t('landing.footerMarketplace'), href: '/auth' },
    ],
    community: [
      { label: t('landing.footerPlayers'), href: '/auth' },
      { label: t('landing.footerTeams'), href: '/auth' },
      { label: t('landing.footerRecruitment'), href: '/auth' },
    ],
    legal: [
      { label: t('landing.footerPrivacy'), href: '#' },
      { label: t('landing.footerTerms'), href: '#' },
    ],
  };

  return (
    <main className="page-enter min-h-screen overflow-hidden bg-canvas-bg text-pitch-ink">
      {/* Header */}
      <header className="header-glass sticky top-0 z-40 border-b border-pitch-line/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch-primary font-display text-xl font-extrabold text-lime-volt">F</span>
            <span className="font-display text-2xl font-extrabold tracking-tight">Footera</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/auth" className="inline-flex min-h-11 items-center justify-center rounded-full border border-pitch-line bg-white px-5 text-sm font-bold text-pitch-ink transition-colors hover:border-pitch-primary hover:text-pitch-primary">
              {t('landing.login')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-pitch-line bg-white px-3 py-1.5 text-xs font-bold text-pitch-primary">
            <Shield className="h-4 w-4" aria-hidden="true" />
            {t('landing.connectedFootball')}
          </span>
          <h1 className="mt-6 max-w-2xl font-display text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[0.96] tracking-[-0.055em]">
            {t('landing.titleLead')} <span className="text-pitch-primary">{t('landing.titleAccent')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
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
          <p className="mt-4 text-xs text-slate-600">{t('landing.oneAccount')}</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="float-soft absolute -inset-8 rounded-[3rem] bg-lime-volt/20 blur-3xl" aria-hidden="true" />
          <div className="pitch-tactical-grid relative overflow-hidden rounded-4xl border border-pitch-primary/20 p-6 text-white shadow-2xl sm:p-8">
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

      {/* Stats Banner */}
      <section className="border-y border-pitch-line bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-5 py-10 sm:px-8 md:grid-cols-4 md:py-14">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-mono text-3xl font-bold tabular-nums text-pitch-primary sm:text-4xl">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="mb-10 max-w-xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.sectionTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('landing.sectionDescription')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="hover-lift rounded-3xl border border-pitch-line bg-white p-5 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pitch-light text-pitch-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-pitch-ink">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="mb-10 max-w-xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{t('landing.howItWorksTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('landing.howItWorksDescription')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                <span aria-hidden="true" className="font-display text-4xl font-extrabold text-lime-volt/80">{number}</span>
                <h3 className="mt-3 font-display text-lg font-extrabold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                <CheckCircle2 className="absolute right-5 top-5 h-5 w-5 text-lime-volt/40" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 md:py-24">
        <div className="mb-10 max-w-xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.testimonialsTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('landing.testimonialsDescription')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map(({ name, role, text }) => (
            <blockquote key={name} className="flex flex-col justify-between rounded-2xl border border-pitch-line bg-white p-6 shadow-sm">
              <div>
                <Quote className="mb-3 h-6 w-6 text-lime-volt" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-slate-700">{text}</p>
              </div>
              <footer className="mt-5 flex items-center gap-3 border-t border-pitch-separator pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pitch-light font-display text-sm font-extrabold text-pitch-primary">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-pitch-ink">{name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-pitch-primary p-8 text-center sm:p-12 md:p-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime-volt/15 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-lime-volt/10 blur-3xl" aria-hidden="true" />
          <div className="relative z-10">
            <h2 className="mx-auto max-w-lg font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/80">
              {t('landing.ctaDescription')}
            </p>
            <Link to="/auth?mode=register" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-volt px-8 font-bold text-pitch-ink shadow-sm transition-colors hover:bg-lime-hover">
              {t('landing.ctaButton')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pitch-line bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 md:py-16">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pitch-primary font-display text-lg font-extrabold text-lime-volt">F</span>
                <span className="font-display text-xl font-extrabold tracking-tight">Footera</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
                {t('landing.footerAbout')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pitch-ink">{t('landing.footerProduct')}</h3>
              <ul className="mt-4 space-y-2.5">
                {footerLinks.product.map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-slate-600 transition-colors hover:text-pitch-primary">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pitch-ink">{t('landing.footerCommunity')}</h3>
              <ul className="mt-4 space-y-2.5">
                {footerLinks.community.map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-slate-600 transition-colors hover:text-pitch-primary">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pitch-ink">{t('landing.footerLegal')}</h3>
              <ul className="mt-4 space-y-2.5">
                {footerLinks.legal.map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-slate-600 transition-colors hover:text-pitch-primary">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-pitch-separator pt-6 sm:flex-row">
            <p className="text-xs text-slate-500">{t('landing.footerCopyright', { year: new Date().getFullYear().toString() })}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </main>
  );
};
