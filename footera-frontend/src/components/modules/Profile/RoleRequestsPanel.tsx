import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { SelectField } from '../../common/SelectField';
import { useTranslation } from '../../../i18n';
import { roleRequestsService, type RequestableRole, type RoleRequest, type RoleRequestsData } from '../../../services/roleRequestsService';
import { formatDateForDisplay } from '../../../utils/date';

function roleLabel(role: RequestableRole, t: ReturnType<typeof useTranslation>['t']): string {
  const keys: Record<RequestableRole, Parameters<typeof t>[0]> = {
    'Gestionnaire Terrain': 'roles.pitchManager',
    Entraîneur: 'roles.coach',
    'Organisateur Tournoi': 'roles.tournamentOrganizer',
    Vendeur: 'roles.seller',
  };
  return t(keys[role]);
}

export function RoleRequestsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<RoleRequestsData>({ availableRoles: [], requests: [] });
  const [selectedRole, setSelectedRole] = useState<RequestableRole | ''>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await roleRequestsService.list();
      setData(result);
      setSelectedRole((current) => current && result.availableRoles.includes(current) ? current : result.availableRoles[0] ?? '');
      setError('');
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : t('roles.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole || isSubmitting) return;
    setIsSubmitting(true);
    setNotice('');
    setError('');
    try {
      const request = await roleRequestsService.create({ role: selectedRole, reason: reason.trim() || undefined });
      setData((current) => ({
        availableRoles: current.availableRoles.filter((role) => role !== request.role),
        requests: [request, ...current.requests],
      }));
      setSelectedRole((current) => current === request.role ? data.availableRoles.find((role) => role !== request.role) ?? '' : current);
      setReason('');
      setNotice(t('roles.submitted'));
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t('roles.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section className="rounded-3xl border border-pitch-line bg-white p-5 shadow-xs md:p-6">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pitch-light text-pitch-primary"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
      <div><h2 className="text-lg font-extrabold text-pitch-ink">{t('roles.title')}</h2><p className="mt-1 text-sm text-slate-500">{t('roles.description')}</p></div>
    </div>

    {isLoading ? <p className="mt-5 text-sm text-slate-500">{t('common.loading')}</p> : data.availableRoles.length > 0 ? <form onSubmit={(event) => void submit(event)} className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end">
      <label className="block min-w-0 text-sm font-semibold text-slate-700">{t('roles.selectRole')}
        <SelectField name="requestedRole" value={selectedRole} required onChange={(event) => setSelectedRole(event.target.value as RequestableRole)} className="mt-1 rounded-xl border border-pitch-line bg-pitch-panel px-3 text-pitch-ink">
          {data.availableRoles.map((role) => <option key={role} value={role}>{roleLabel(role, t)}</option>)}
        </SelectField>
      </label>
      <label className="block min-w-0 text-sm font-semibold text-slate-700">{t('roles.reason')}
        <textarea name="roleRequestReason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} rows={2} maxLength={1000} placeholder={t('roles.reasonPlaceholder')} className="mt-1 w-full resize-y rounded-xl border border-pitch-line bg-pitch-panel p-3 text-sm font-normal text-pitch-ink focus:border-pitch-primary focus:outline-hidden" />
      </label>
      <button type="submit" disabled={!selectedRole || isSubmitting} className="min-h-11 rounded-xl bg-pitch-action px-4 py-3 text-sm font-bold text-white hover:bg-pitch-action-hover disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? t('roles.sending') : t('roles.submit')}</button>
    </form> : <p className="mt-5 rounded-2xl bg-pitch-panel p-4 text-sm text-slate-600">{t('roles.noAvailable')}</p>}

    {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="mt-4 flex items-center gap-2 text-sm font-semibold text-pitch-primary"><CheckCircle2 className="h-4 w-4" />{notice}</p>}
    <div className="mt-5 border-t border-pitch-line pt-4">
      <h3 className="text-sm font-bold text-pitch-ink">{t('roles.history')}</h3>
      {data.requests.length ? <ul className="mt-3 space-y-2">{data.requests.map((request: RoleRequest) => <li key={request.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-pitch-panel p-3 text-sm">
        <div className="min-w-0"><p className="font-bold text-pitch-ink">{roleLabel(request.role, t)}</p>{request.reason && <p className="mt-1 whitespace-pre-wrap break-words text-slate-600">{request.reason}</p>}<time className="mt-1 block text-xs text-slate-500" dateTime={request.createdAt}>{formatDateForDisplay(request.createdAt)}</time></div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : request.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
          {request.status === 'PENDING' && <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
          {t(request.status === 'APPROVED' ? 'roles.approved' : request.status === 'REJECTED' ? 'roles.rejected' : 'roles.pending')}
        </span>
      </li>)}</ul> : <p className="mt-2 text-sm text-slate-500">{t('roles.historyEmpty')}</p>}
    </div>
  </section>;
}
