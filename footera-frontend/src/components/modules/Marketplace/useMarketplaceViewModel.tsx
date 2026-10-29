import React,{ useEffect,useState, type SubmitEvent } from 'react';
import { useApp } from '../../../context/useApp';
import { useResource } from '../../../hooks/useResource';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { useUrlState } from '../../../hooks/useUrlState';
import { useTranslation } from '../../../i18n';
import { catalogsService } from '../../../services/catalogsService';
import { CreateListingInput,marketplaceService } from '../../../services/marketplaceService';
import { MarketplaceListing } from '../../../types';
import { useListPagination } from '../../../hooks/useListPagination';
import { useSearchParams } from 'react-router-dom';

const MARKETPLACE_IMAGE_PRESETS = [
  {
    name: 'Crampons Pro Moulés',
    url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Maillot Domicile Match',
    url: 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Ballon Officiel Match',
    url: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Gants Gardien Pro Grip',
    url: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=600&h=450&q=80',
  },
  {
    name: 'Chasubles & Entraînement',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&h=450&q=80',
  },
];

/** Data, URL state and mutations shared by the list and its routed dialogs. */
export function useMarketplaceViewModel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { showToast, user } = useApp();
  const itemModal = useRouteModal('/marketplace');
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const categoryFilter = searchParams.getAll('category').filter((category) => category !== 'Toutes');
  const [searchQuery, setSearchQuery] = useUrlState<string>('query', '');
  const [mine, setMine] = useUrlState<boolean>('mine', false);
  const [sort, setSort] = useUrlState<string>('sort', 'recent');
  const [maxPrice, setMaxPrice] = useUrlState<string>('maxPrice', '');
  const [minPrice, setMinPrice] = useUrlState<string>('minPrice', '');
  const condition = searchParams.getAll('condition');
  const brand = searchParams.getAll('brand');
  const setCategoryFilter = (values: string[]) => setSearchParams((current) => updateMultiFilter(current, 'category', values));
  const setCondition = (values: string[]) => setSearchParams((current) => updateMultiFilter(current, 'condition', values));
  const setBrand = (values: string[]) => setSearchParams((current) => updateMultiFilter(current, 'brand', values));
  const list = useResource<MarketplaceListing[]>(JSON.stringify([searchQuery, minPrice, maxPrice]), () => marketplaceService.list({ query: searchQuery, minPrice: Number(minPrice) || undefined, maxPrice: Number(maxPrice) || undefined }), []);
  const items = list.data;
  const setItems = list.setData;
  const isLoading = list.loading;
  const page = useListPagination(items.filter((item) => (!mine || item.isMine) && (!categoryFilter.length || categoryFilter.includes(item.category)) && (!condition.length || condition.includes(item.condition)) && (!brand.length || brand.includes(item.brand)))
    .sort((a, b) => sort === 'price' ? a.price - b.price : sort === 'name' ? a.title.localeCompare(b.title) : (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)));
  const detail = useResource<MarketplaceListing | null>(itemModal.resourceId ?? '', () => marketplaceService.getById(itemModal.resourceId!), null, !!itemModal.resourceId);

  // Detail Modal
  const selectedItem = detail.data?.id === itemModal.resourceId ? detail.data : null;
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MarketplaceListing['category']>('');
  const [formPrice, setFormPrice] = useState('');
  const [formCondition, setFormCondition] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [formCity, setFormCity] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreateListing = Boolean(formTitle.trim() && formCategory && formCondition && formBrand && formBrand !== '__custom__'
    && formCity.trim() && formImageUrl && Number.isFinite(Number(formPrice)) && Number(formPrice) > 0);

  useEffect(() => {
    catalogsService.getOptions()
      .then((options) => {
        setCategories(options.marketplaceCategories);
        setConditions(options.marketplaceConditions);
        setBrands(options.marketplaceBrands);
      })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : t('common.loading'), 'error'));
  }, [showToast]);

  const handleCategoryChange = (cat: MarketplaceListing['category']) => {
    setFormCategory(cat);
  };

  const handleAddBrand = async () => {
    const value = customBrand.trim();
    if (!value) return;
    setIsAddingBrand(true);
    try {
      const savedBrand = await marketplaceService.addBrand(value);
      setBrands((current) => current.includes(savedBrand) ? current : [...current, savedBrand].sort((a, b) => a.localeCompare(b)));
      setFormBrand(savedBrand);
      setCustomBrand('');
      showToast(t('market.brandAdded'), 'success');
    } catch {
      showToast(t('market.brandAddError'), 'error');
    } finally {
      setIsAddingBrand(false);
    }
  };

  const handleCreateListing = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice || !formCategory || !formCondition || !formBrand || !formCity.trim() || !formImageUrl) {
      showToast(t('market.required'), 'info');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showToast(t('market.invalidPrice'), 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateListingInput = {
        title: formTitle.trim(),
        category: formCategory,
        price: priceNum,
        condition: formCondition,
        brand: formBrand,
        city: formCity.trim(),
        imageUrl: formImageUrl,
        description: formDescription.trim(),
      };

      const created = await marketplaceService.createListing(input);
      showToast(t('market.created'), 'success');
      // Reset fields
      resetCreateListingForm();

      // Refresh listings
      const updated = await marketplaceService.list();
      setItems(updated);
      itemModal.openDetail(created.id, true);
    } catch {
      showToast(t('market.createError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateListingForm = () => {
    setFormTitle('');
    setFormCategory('');
    setFormPrice('');
    setFormCondition('');
    setFormBrand('');
    setCustomBrand('');
    setFormCity('');
    setFormDescription('');
    setFormImageUrl('');
  };

  const handleOpenCreateListing = () => {
    resetCreateListingForm();
    itemModal.openCreate();
  };
  return { t, itemModal, categories, conditions, brands, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, mine, setMine, sort, setSort, minPrice, setMinPrice, maxPrice, setMaxPrice, condition, setCondition, brand, setBrand, list, items, isLoading, page, detail, selectedItem, handleOpenCreateListing, showToast, user, formTitle, setFormTitle, formCategory, formPrice, setFormPrice, formCondition, setFormCondition, formBrand, setFormBrand, customBrand, setCustomBrand, isAddingBrand, handleAddBrand, formCity, setFormCity, formDescription, setFormDescription, formImageUrl, setFormImageUrl, isSubmitting, canCreateListing, handleCategoryChange, handleCreateListing };
}

function updateMultiFilter(params: URLSearchParams, key: string, values: string[]): URLSearchParams {
  const updated = new URLSearchParams(params);
  updated.delete(key);
  values.forEach((value) => updated.append(key, value));
  updated.delete('page');
  return updated;
}
