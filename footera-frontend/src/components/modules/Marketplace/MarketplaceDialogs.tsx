import { MarketplaceListing } from '../../../types';
import { ImageUploadField } from '../../common/ImageUploadField';
import { Modal } from '../../common/Modal';
import { SelectField } from '../../common/SelectField';

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

import type { useMarketplaceViewModel } from './useMarketplaceViewModel';

export function MarketplaceDialogs({ model }: { model: ReturnType<typeof useMarketplaceViewModel> }) {
  const { t, showToast, user, itemModal, categories, conditions, brands, condition, brand, selectedItem, formTitle, setFormTitle, formCategory, formPrice, setFormPrice, formCondition, setFormCondition, formBrand, setFormBrand, customBrand, setCustomBrand, isAddingBrand, handleAddBrand, formCity, setFormCity, formDescription, setFormDescription, formImageUrl, setFormImageUrl, isSubmitting, canCreateListing, handleCategoryChange, handleCreateListing } = model;
  return <>
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
                showToast(t('market.contactSent', { seller: selectedItem.sellerName }), 'success');
                itemModal.close();
              }}
              className="w-full py-3.5 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-sm flex items-center justify-center cursor-pointer shadow-xs transition-colors"
            >
              <span>{t('market.contact')}</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Create Listing Modal */}
      {itemModal.mode === 'create' && (
        <Modal
          isOpen={itemModal.mode === 'create'}
          onClose={itemModal.close}
          title={t('market.sell')}
          subtitle={t('market.createSubtitle')}
          maxWidth="lg"
        >
          <form onSubmit={handleCreateListing} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('market.itemTitle')}
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('market.itemExample')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('market.category')}</label>
                <SelectField
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as MarketplaceListing['category'])}
                  required
                  disabled={categories.length === 0}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>{t('market.chooseCategory')}</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('market.price')}</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('market.condition')}</label>
                <SelectField
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  required
                  disabled={!conditions.length}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                >
                  <option value="" disabled>{t('market.chooseCondition')}</option>
                  {conditions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                </SelectField>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('market.city')}</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder={t('market.cityExample')}
                  className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('market.brand')}</label>
              <SelectField
                required
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
                disabled={!brands.length}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              >
                <option value="" disabled>{t('market.chooseBrand')}</option>
                {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                <option value="__custom__">{t('market.addBrand')}</option>
              </SelectField>
              {formBrand === '__custom__' && <div className="mt-2 flex gap-2">
                <input value={customBrand} onChange={(event) => setCustomBrand(event.target.value)} maxLength={80} placeholder={t('market.customBrand')} className="min-w-0 flex-1 rounded-xl border border-pitch-line px-3 py-2 text-sm" />
                <button type="button" onClick={() => void handleAddBrand()} disabled={isAddingBrand || !customBrand.trim()} className="rounded-xl bg-pitch-action px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isAddingBrand ? t('market.savingBrand') : t('market.saveBrand')}</button>
              </div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('market.description')}
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('market.descriptionHint')}
                className="w-full p-3 bg-pitch-panel border border-pitch-line rounded-2xl text-xs text-pitch-ink focus:border-pitch-primary outline-hidden"
              />
            </div>

            {/* Photo Preset Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('market.photo')}
              </label>
              <ImageUploadField purpose="marketplace" label={t('market.importPhoto')} onUploaded={setFormImageUrl} disabled={isSubmitting || !user?.roles?.includes('Vendeur')} disabledHint={t('market.sellerRoleRequired')} />
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
                {t('market.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canCreateListing}
                className="px-6 py-2 min-h-11 rounded-xl bg-pitch-action hover:bg-pitch-action-hover text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? t('market.publishing') : t('market.publish')}
              </button>
            </div>
          </form>
        </Modal>
      )}

  </>;
}
