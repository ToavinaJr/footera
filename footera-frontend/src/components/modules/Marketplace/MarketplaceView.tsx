import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Plus, Tag, Star, MapPin, Check, Sparkles } from 'lucide-react';
import { marketplaceService, CreateListingInput } from '../../../services/marketplaceService';
import { MarketplaceListing } from '../../../types';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { CardSkeleton } from '../../common/Skeleton';
import { EmptyState } from '../../common/EmptyState';
import { useApp } from '../../../context/useApp';
import { useRouteModal } from '../../../hooks/useRouteModal';
import { ImageUploadField } from '../../common/ImageUploadField';
import { catalogsService } from '../../../services/catalogsService';

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

export const MarketplaceView: React.FC = () => {
  const { showToast, user } = useApp();
  const itemModal = useRouteModal('/marketplace');
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const selectedItem = itemModal.resourceId
    ? items.find((item) => item.id === itemModal.resourceId) ?? null
    : null;
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MarketplaceListing['category']>('');
  const [formPrice, setFormPrice] = useState('');
  const [formCondition, setFormCondition] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    catalogsService.getOptions()
      .then((options) => {
        setCategories(options.marketplaceCategories);
        setConditions(options.marketplaceConditions);
        setBrands(options.marketplaceBrands);
      })
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Impossible de charger les options Marketplace.', 'error'));
  }, [showToast]);

  useEffect(() => {
    async function loadItems() {
      setIsLoading(true);
      try {
        const data = await marketplaceService.list({
          query: searchQuery,
          category: categoryFilter,
        });
        setItems(data);
      } catch (err: any) {
        showToast(err.message || 'Erreur lors du chargement des équipements', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadItems();
  }, [searchQuery, categoryFilter, showToast]);

  const handleCategoryChange = (cat: MarketplaceListing['category']) => {
    setFormCategory(cat);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice || !formCategory || !formCondition || !formBrand || !formCity.trim() || !formImageUrl) {
      showToast('Veuillez renseigner tous les champs obligatoires et choisir une photo.', 'info');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      showToast('Veuillez indiquer un prix valide supérieur à 0.', 'info');
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
      showToast('Votre article a été publié dans la Marketplace avec succès !', 'success');
      // Reset fields
      resetCreateListingForm();

      // Refresh listings
      const updated = await marketplaceService.list({ category: categoryFilter });
      setItems(updated);
      itemModal.openDetail(created.id, true);
    } catch {
      showToast('Erreur lors de la mise en vente', 'error');
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
    setFormCity('');
    setFormDescription('');
    setFormImageUrl('');
  };

  const handleOpenCreateListing = () => {
    resetCreateListingForm();
    itemModal.openCreate();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            Marketplace Football
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Achetez et vendez vos crampons, maillots collectors, ballons et équipements de match.
          </p>
        </div>

        <button
          onClick={handleOpenCreateListing}
          className="px-5 py-2.5 min-h-11 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Vendre un équipement</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-3xl bg-white border border-pitch-line grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle, marque, ville..."
            className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white outline-hidden"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrer par catégorie d'équipement"
            className="w-full bg-pitch-input border border-pitch-line rounded-full px-4 py-2.5 text-xs md:text-sm text-pitch-ink focus:border-pitch-primary outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'Toutes' ? 'Toutes les catégories' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Aucun équipement en vente"
          description="Soyez le premier à publier une annonce dans cette catégorie !"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => itemModal.openDetail(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  itemModal.openDetail(item.id);
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={`Voir l'annonce ${item.title}`}
              className="rounded-3xl bg-white border border-pitch-line hover:border-pitch-primary/50 overflow-hidden transition-all cursor-pointer group shadow-xs flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-pitch-primary"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-pitch-ink font-bold text-caption shadow-xs">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-lime-volt text-pitch-ink font-extrabold text-caption shadow-xs">
                      {item.condition}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>{item.brand}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <MapPin className="w-3 h-3 text-pitch-primary" />
                      {item.city}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-pitch-ink group-hover:text-pitch-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-pitch-panel border-t border-pitch-separator flex items-center justify-between">
                <span className="text-base font-extrabold text-pitch-primary tabular-nums">
                  {item.price} €
                </span>
                <span className="text-xs font-bold text-slate-600 group-hover:text-pitch-primary transition-colors">
                  Voir l&apos;offre →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={itemModal.close}
          title={selectedItem.title}
          subtitle={`${selectedItem.brand} · ${selectedItem.city}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="h-60 rounded-3xl overflow-hidden bg-slate-100 border border-pitch-line">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-extrabold text-pitch-primary tabular-nums">
                  {selectedItem.price} €
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  État : <strong className="text-pitch-ink">{selectedItem.condition}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Vendeur vérifié</span>
                <strong className="text-sm text-pitch-ink">{selectedItem.sellerName}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-pitch-panel p-3.5 rounded-2xl border border-border-subtle leading-relaxed">
              {selectedItem.description}
            </p>

            <button
              onClick={() => {
                showToast(`Message transmis à ${selectedItem.sellerName} !`, 'success');
                itemModal.close();
              }}
              className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-xs transition-colors"
            >
              <span>Contacter le vendeur pour convenir d&apos;une remise</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Create Listing Modal */}
      {itemModal.mode === 'create' && (
        <Modal
          isOpen={itemModal.mode === 'create'}
          onClose={itemModal.close}
          title="Vendre un équipement"
          subtitle="Publiez votre article dans la marketplace de la communauté"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateListing} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre de l&apos;article *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Crampons Nike Phantom GX Elite Taille 43"
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie *</label>
                <select
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as MarketplaceListing['category'])}
                  required
                  disabled={categories.length === 0}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>Choisir une catégorie</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prix de vente (€) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="65"
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">État de l&apos;article *</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  required
                  disabled={!conditions.length}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>Choisir un état</option>
                  {conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ville de remise *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: Fianarantsoa ou Antananarivo"
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marque *</label>
              <select
                required
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                disabled={!brands.length}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              >
                <option value="" disabled>Choisir une marque</option>
                {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Détails de l&apos;article
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Précisez la pointure/taille, la couleur, les crampons (SG/FG/AG) et l'historique d'utilisation..."
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            {/* Photo Preset Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Photo illustrative de l&apos;article *
              </label>
              <ImageUploadField purpose="marketplace" label="Importer une photo" onUploaded={setFormImageUrl} disabled={isSubmitting || !user?.roles?.includes('Vendeur')} disabledHint="Le rôle Vendeur doit être attribué à votre compte pour importer l’image." />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {MARKETPLACE_IMAGE_PRESETS.map((preset) => {
                  const isSelected = formImageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`relative h-20 rounded-2xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-pitch-primary ring-2 ring-lime-volt' : 'border-transparent hover:opacity-90'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-end p-1.5">
                        <span className="text-micro font-bold text-white leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-lime-volt text-pitch-ink flex items-center justify-center font-bold text-tiny">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-pitch-separator">
              <button
                type="button"
                onClick={itemModal.close}
                className="px-4 py-2 min-h-11 rounded-xl bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Publication...' : 'Publier mon annonce'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
