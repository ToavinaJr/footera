import React from 'react';
import { ArrowRight, CalendarDays, MapPin, Shield, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Users, title: 'Joueurs et équipes', description: 'Découvrez les profils, les effectifs et les opportunités de recrutement.' },
  { icon: CalendarDays, title: 'Matchs et tournois', description: 'Suivez les compétitions, les résultats et les statistiques.' },
  { icon: MapPin, title: 'Terrains', description: 'Trouvez un terrain, consultez ses disponibilités et réservez vos créneaux.' },
];

export const LandingView: React.FC = () => (
  <main className="min-h-screen overflow-hidden bg-canvas-bg text-pitch-ink">
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-2.5" aria-label="Footera — accueil">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch-primary font-display text-xl font-extrabold text-lime-volt">F</span>
        <span className="font-display text-2xl font-extrabold tracking-tight">Footera</span>
      </Link>
      <Link to="/auth" className="inline-flex min-h-11 items-center justify-center rounded-full border border-pitch-line bg-white px-5 text-sm font-bold text-pitch-ink transition-colors hover:border-pitch-primary hover:text-pitch-primary">
        Se connecter
      </Link>
    </header>

    <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-pitch-line bg-white px-3 py-1.5 text-xs font-bold text-pitch-primary">
          <Shield className="h-4 w-4" aria-hidden="true" />
          Le football, connecté
        </span>
        <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Tout le football local, <span className="text-pitch-primary">au même endroit.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Footera rassemble joueurs, clubs, matchs, tournois et terrains dans une seule plateforme. Organisez votre saison, trouvez votre prochaine équipe et faites vivre le football autour de vous.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/auth?mode=register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pitch-action px-6 font-bold text-white shadow-sm transition-colors hover:bg-pitch-action-hover">
            Rejoindre Footera <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/auth" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-pitch-line bg-white px-6 font-bold text-pitch-ink transition-colors hover:border-pitch-primary hover:text-pitch-primary">
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">Un seul compte pour découvrir, participer et organiser.</p>
      </div>

      <div className="relative mx-auto w-full max-w-lg">
        <div className="absolute -inset-8 rounded-[3rem] bg-lime-volt/20 blur-3xl" aria-hidden="true" />
        <div className="pitch-tactical-grid relative overflow-hidden rounded-[2rem] border border-pitch-primary/20 p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-volt">Votre saison commence ici</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Le jeu se joue ensemble.</h2>
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
              Joueurs, clubs et passion
            </div>
          </div>
          <p className="text-sm leading-6 text-white/80">Des outils simples pour les joueurs, les clubs et tous ceux qui font avancer le football.</p>
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 md:pb-24">
      <div className="mb-6 max-w-xl">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Une plateforme pensée pour le terrain</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Retrouvez au même endroit les essentiels de votre quotidien footballistique.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-pitch-line bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 sm:p-6">
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
      Footera — Faites grandir le football, ensemble.
    </footer>
  </main>
);
