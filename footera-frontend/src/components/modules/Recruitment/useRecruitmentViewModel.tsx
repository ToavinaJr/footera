import { useEffect,useState } from 'react';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { catalogsService } from '../../../services/catalogsService';
import { recruitmentService } from '../../../services/recruitmentService';
import { Application,RecruitmentAd } from '../../../types';
import { useListPagination } from '../../common/ListPage';

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function useRecruitmentViewModel() {
  const { t } = useTranslation();
  const { showToast, selectedResourceId, user } = useApp();
  const adModal = useRouteModal('/mercato');
  const [activeTab, setActiveTab] = useUrlState<'ads' | 'my-applications'>('tab', 'ads', ['ads', 'my-applications']);

  // Filters
  const [searchQuery, setSearchQuery] = useUrlState<string>('query', '');
  const [positionFilter, setPositionFilter] = useUrlState<string>('position', 'Tous');
  const [positionOptions, setPositionOptions] = useState<string[]>([]);

  const list = useResource<RecruitmentAd[]>(JSON.stringify([user?.id, searchQuery, positionFilter]), () => user ? recruitmentService.listAvailableAds({ query: searchQuery, position: positionFilter }) : recruitmentService.listAds({ query: searchQuery, position: positionFilter }), []);
  const applications = useResource<Application[]>(user?.id ?? '', () => recruitmentService.listMyApplications(), [], !!user);
  const ads = list.data, setAds = list.setData;
  const myApplications = applications.data, setMyApplications = applications.setData;
  const isLoading = list.loading;
  const page = useListPagination(ads);
  const applicationPage = useListPagination(myApplications);
  const detail = useResource<RecruitmentAd | null>(adModal.resourceId ?? '', () => recruitmentService.getAdById(adModal.resourceId!), null, !!adModal.resourceId);
  // Ad Detail & Apply
  const activeAd = detail.data?.id === adModal.resourceId ? detail.data : null;
  const [applicationAd, setApplicationAd] = useState<RecruitmentAd | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellingApplicationId, setCancellingApplicationId] = useState<string | null>(null);

  const openApplication = (ad: RecruitmentAd) => {
    // A candidate form is its own modal; leave the route-backed ad detail first.
    adModal.close();
    setApplicationAd(ad);
    setApplicantPhone(user?.phone || '');
    setApplyMessage('');
    setIsApplyModalOpen(true);
  };

  const closeApplication = () => {
    setIsApplyModalOpen(false);
    setApplicationAd(null);
  };

  useEffect(() => {
    catalogsService.getOptions()
      .then((options) => setPositionOptions(options.recruitmentPositions))
      .catch((error: unknown) => showToast(error instanceof Error ? error.message : t('recruitment.optionsError'), 'error'));
  }, [showToast]);

  const handleApply = async () => {
    if (!applicationAd || !applyMessage.trim() || !applicantPhone.trim()) return;
    setIsSubmitting(true);
    try {
      await recruitmentService.apply(applicationAd.id, {
        message: applyMessage,
        phone: applicantPhone,
      });
      showToast(t('recruitment.applicationSent', { team: applicationAd.teamName }));
      closeApplication();
      setApplyMessage('');
      const [availableAds, applications] = await Promise.all([
        recruitmentService.listAvailableAds({ query: searchQuery, position: positionFilter }),
        recruitmentService.listMyApplications(),
      ]);
      setAds(availableAds);
      setMyApplications(applications);
      setActiveTab('my-applications');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('recruitment.submitError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelApplication = async (application: Application) => {
    if (application.status !== 'EN_REVUE' || cancellingApplicationId) return;
    setCancellingApplicationId(application.id);
    try {
      await recruitmentService.cancelApplication(application.id);
      setMyApplications((current) => current.map((item) => item.id === application.id ? { ...item, status: 'RETIRÉE' } : item));
      const availableAds = await recruitmentService.listAvailableAds({ query: searchQuery, position: positionFilter });
      setAds(availableAds);
      showToast(t('recruitment.applicationCancelled'), 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : t('recruitment.cancelApplicationError'), 'error');
    } finally {
      setCancellingApplicationId(null);
    }
  };
  return { t, adModal, activeTab, setActiveTab, searchQuery, setSearchQuery, positionFilter, setPositionFilter, positionOptions, list, applications, ads, myApplications, isLoading, page, applicationPage, detail, activeAd, cancellingApplicationId, openApplication, handleCancelApplication, applicationAd, isApplyModalOpen, applyMessage, setApplyMessage, applicantPhone, setApplicantPhone, isSubmitting, closeApplication, handleApply };
}
