import { useEffect, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { teamsService } from '../../../services/teamsService';
import type { Team } from '../../../types';

interface CurrentTeamSelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  name: string;
}

export function CurrentTeamSelectField({ value, onChange, id, name }: CurrentTeamSelectFieldProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError('');
      teamsService.list({ query: query.trim() || undefined })
        .then((result) => { if (active) setTeams(result); })
        .catch(() => { if (active) setError(t('profile.teamsLoadError')); })
        .finally(() => { if (active) setIsLoading(false); });
    }, query ? 250 : 0);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [isOpen, query, t]);

  const selectTeam = (team: Team) => {
    onChange(team.name);
    setQuery('');
    setIsOpen(false);
  };

  return <div className="min-w-0">
    <div className="relative flex min-w-0 items-center">
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
      <input
        id={id}
        name={name}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        value={isOpen ? query : value}
        onFocus={() => { setQuery(''); setIsOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setIsOpen(true); }}
        onBlur={() => setIsOpen(false)}
        placeholder={t('profile.searchCurrentTeam')}
        autoComplete="off"
        className="min-h-11 w-full min-w-0 rounded-2xl border border-pitch-line bg-pitch-panel py-2.5 pl-10 pr-11 text-sm text-pitch-ink placeholder:text-slate-400 focus:border-pitch-primary focus:outline-hidden focus:ring-2 focus:ring-pitch-primary/15"
      />
      {value && !isOpen && <button type="button" onClick={() => onChange('')} aria-label={t('profile.clearCurrentTeam')} className="absolute right-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-rose-700">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>}
    </div>
    {isOpen && <div id={`${id}-options`} role="listbox" aria-label={t('profile.searchCurrentTeam')} className="mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-2xl border border-pitch-line bg-white p-1 shadow-xs">
      {isLoading ? <p className="p-3 text-sm text-slate-500">{t('common.loading')}</p> : error ? <p role="alert" className="p-3 text-sm text-rose-700">{error}</p> : teams.length === 0 ? <p className="p-3 text-sm text-slate-500">{t('profile.noTeamsFound')}</p> : teams.map((team) => <button
        key={team.id}
        type="button"
        role="option"
        aria-selected={value === team.name}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => selectTeam(team)}
        className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-pitch-panel focus-visible:outline-2 focus-visible:outline-pitch-primary"
      >
        <img src={team.logoUrl} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-lg border border-pitch-line bg-pitch-panel object-cover" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-pitch-ink">{team.name}</span><span className="block truncate text-xs text-slate-500">{team.city}</span></span>
        {value === team.name && <Check className="h-4 w-4 shrink-0 text-pitch-primary" aria-hidden="true" />}
      </button>) }
    </div>}
  </div>;
}
