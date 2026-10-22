import React, { useState, useEffect } from 'react';
import { Briefcase, Search, CheckCircle2, Send } from 'lucide-react';
import { recruitmentService } from '../../../services/recruitmentService';
import { RecruitmentAd, Application } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { EntityLink } from '../../common/EntityLink';
import { catalogsService } from '../../../services/catalogsService';

export const RecruitmentView: React.FC = () => {
  const { showToast, selectedResourceId, user } = useApp();
  const adModal = useRouteModal('/recruitment');
  const [activeTab, setActiveTab] = useState<'ads' | 'my-applications'>('ads');
  const [ads, setAds] = useState<RecruitmentAd[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('Tous');
  const [positionOptions, setPositionOptions] = useState<string[]>([]);

  // Ad Detail & Apply
  const activeAd = adModal.resourceId
    ? ads.find((ad) => ad.id === adModal.resourceId) ?? null
    : selectedResourceId
      ? ads.find((ad) => ad.id === selectedResourceId) ?? null
      : null;
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || '06 12 34 56 78');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    catalogsService.getOptions()
      .then((options) => setPositionOptions(options.recruitmentPositions))
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : 'Impossible de charger les postes recherchés.', 'error'));
  }, [showToast]);

  useEffect(() => {
    async function loadRecruitmentData() {
      setIsLoading(true);
      try {
        const [adsData, appsData] = await Promise.all([
          recruitmentService.listAds({ query: searchQuery, position: positionFilter }),
          recruitmentService.listMyApplications(),
        ]);
        setAds(adsData);
        setMyApplications(appsData);

      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement du Mercato', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadRecruitmentData();
  }, [searchQuery, positionFilter, selectedResourceId, showToast]);

  const handleApply = async () => {
    if (!activeAd || !applyMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await recruitmentService.apply(activeAd.id, {
        message: applyMessage,
        phone: applicantPhone,
      });
      showToast(`Candidature transmise à ${activeAd.teamName} !`);
      setIsApplyModalOpen(false);
      setApplyMessage('');
      adModal.close();
      const updatedApps = await recruitmentService.listMyApplications();
      setMyApplications(updatedApps);
      setActiveTab('my-applications');
    } catch {
      showToast('Erreur lors de la candidature', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Mercato & Recrutement
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Recherchez des opportunités officielles ou postulez directement auprès des clubs.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-pitch-line rounded-2xl self-start md:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ads'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Offres ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab('my-applications')}
            className={`px-4 py-2 min-h-11 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'my-applications'
                ? 'bg-pitch-primary text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mes candidatures ({myApplications.length})
          </button>
        </div>
      </div>

      {activeTab === 'ads' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-3xl bg-white border border-pitch-line shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par poste, club, ville..."
                className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white outline-hidden"
              />
            </div>
            <div>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                aria-label="Filtrer par poste recherché"
                className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
              >
                <option value="Tous">Tous les postes</option>
                {positionOptions.map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : ads.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Aucune annonce trouvée"
              description="Modifiez vos filtres de recherche."
            />
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => adModal.openDetail(ad.id)}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={ad.teamLogoUrl}
                      alt={ad.teamName}
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-pitch-line shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-pitch-ink">{ad.positionSought}</h2>
                        <Badge variant="emerald" size="sm">{ad.division}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        <EntityLink section="teams" id={ad.teamId}>{ad.teamName}</EntityLink> · {ad.city}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl mt-1">
                        {ad.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-pitch-separator">
                    <span className="text-xs font-bold text-pitch-primary">
                      {ad.candidatesCount} candidatures
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adModal.openDetail(ad.id);
                        setIsApplyModalOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Postuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Aucune candidature active"
              description="Vous n'avez pas encore postulé à une offre."
              actionLabel="Voir les offres du Mercato"
              onAction={() => setActiveTab('ads')}
            />
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-3xl bg-white border border-pitch-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-pitch-ink">{app.adTitle}</h2>
                      <Badge variant={app.status === 'ACCEPTEE' ? 'emerald' : 'amber'} size="sm">
                        {app.status === 'EN_REVUE' ? 'En cours d’examen' : 'Acceptée'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Club : <strong className="text-slate-800"><EntityLink section="teams" id={ads.find((ad) => ad.id === app.adId)?.teamId}>{app.teamName}</EntityLink></strong> · Téléphone : {app.phone}
                    </p>
                    <p className="text-xs text-slate-600 italic mt-1">« {app.message} »</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ad Details Modal */}
      {activeAd && (
        <Modal
          isOpen={!!activeAd}
          onClose={adModal.close}
          title={activeAd.positionSought}
          subtitle={`${activeAd.teamName} · ${activeAd.division}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-pitch-panel border border-pitch-line flex items-center gap-3">
              <img
                src={activeAd.teamLogoUrl}
                alt={activeAd.teamName}
                className="w-12 h-12 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-bold text-pitch-ink"><EntityLink section="teams" id={activeAd.teamId}>{activeAd.teamName}</EntityLink></h3>
                <span className="text-xs text-slate-500">{activeAd.city} · {activeAd.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-pitch-panel p-3 rounded-2xl border border-border-subtle">
              {activeAd.description}
            </p>

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Postuler à cette opportunité</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Apply Modal */}
      {isApplyModalOpen && activeAd && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title={`Candidater — ${activeAd.positionSought}`}
          subtitle={activeAd.teamName}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro de téléphone *
              </label>
              <input
                type="tel"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className="w-full p-2.5 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Message & Disponibilités *
              </label>
              <textarea
                rows={4}
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                placeholder="Présentez brièvement vos atouts et disponibilités..."
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                disabled={!applyMessage.trim() || isSubmitting}
                className="px-5 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
