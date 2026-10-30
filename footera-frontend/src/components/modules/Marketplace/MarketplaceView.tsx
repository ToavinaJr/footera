import { Check, ChevronDown, MapPin,Plus,Search,ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from '../../../i18n';
import { EmptyState } from '../../common/EmptyState';
import { ListError,ListPageLayout,Pagination } from '../../common/ListPage';
import { ListToolbar } from '../../common/ListToolbar';
import { MultiSelectField } from '../../common/MultiSelectField';
import { SelectField } from '../../common/SelectField';
import { CardSkeleton } from '../../common/Skeleton';
import { MarketplaceDialogs } from './MarketplaceDialogs';
import { useMarketplaceViewModel } from './useMarketplaceViewModel';


export const MarketplaceView: React.FC = () => {
  const model = useMarketplaceViewModel();
  const { t, itemModal, categories, conditions, brands, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, mine, setMine, sort, setSort, minPrice, setMinPrice, maxPrice, setMaxPrice, condition, setCondition, brand, setBrand, list, items, isLoading, page, detail, selectedItem, handleOpenCreateListing } = model;

  return (
    <ListPageLayout>
      <ListError error={list.error || detail.error} onRetry={() => { list.refresh(); detail.refresh(); }} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-pitch-ink tracking-tight">
            {t('market.title')}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('market.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenCreateListing}
          className="px-5 py-2.5 min-h-11 rounded-2xl bg-pitch-action hover:bg-pitch-action-hover text-white font-extrabold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('market.sell')}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="relative z-50 p-4 rounded-3xl bg-white border border-pitch-line grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('market.search')}
            className="w-full bg-pitch-input border border-pitch-line rounded-full pl-10 pr-4 py-2.5 text-xs md:text-sm text-pitch-ink placeholder-slate-400 focus:border-pitch-primary focus:bg-white outline-hidden"
          />
        </div>

        <div>
          <MarketplaceMultiSelect label={t('market.allCategories')} options={categories.filter((category) => category !== 'Toutes')} value={categoryFilter} onChange={setCategoryFilter} />
        </div>
      </div>

      {/* Items Grid */}
      <div className="relative z-40">
        <ListToolbar mine={mine} onMine={setMine}>
          <MarketplaceMultiSelect label={t('market.condition')} options={conditions} value={condition} onChange={setCondition} />
          <MultiSelectField value={brand} onChange={setBrand} ariaLabel={t('market.brand')} placeholder={t('market.brand')} options={brands.map((option) => ({ value: option, label: option }))} searchable searchPlaceholder={t('market.searchBrand')} emptyMessage={t('market.noBrandsFound')} />
          <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} aria-label={t('market.minPrice')} placeholder={t('market.minPrice')} className="min-h-11 w-32 rounded-xl border border-pitch-line px-3 text-sm" />
          <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} aria-label={t('market.maxPrice')} placeholder={t('market.maxPrice')} className="min-h-11 w-32 rounded-xl border border-pitch-line px-3 text-sm" />
          <SelectField value={sort} onChange={(event) => setSort(event.target.value)} aria-label={t('list.sort')} className="min-h-11 rounded-xl border border-pitch-line px-3 text-sm"><option value="recent">{t('list.recent')}</option><option value="price">{t('market.price')}</option><option value="name">{t('list.name')}</option></SelectField>
        </ListToolbar>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : page.total === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t('market.emptyTitle')}
          description={t('market.emptyDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {page.items.map((item) => (
            <div
              key={item.id}
              onClick={() => itemModal.openDetail(item.id)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
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

      <Pagination {...page} />
      {itemModal.resourceId && detail.loading && !selectedItem && <CardSkeleton />}
      <MarketplaceDialogs model={model} />
    </ListPageLayout>
  );
};

function MarketplaceMultiSelect({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const summary = value.length ? `${label} (${value.length})` : label;
  const allSelected = options.length > 0 && options.every((option) => value.includes(option));

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-pitch-line bg-white px-3 text-left text-sm text-pitch-ink transition-colors hover:border-pitch-primary focus-visible:outline-2 focus-visible:outline-pitch-primary"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-pitch-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-60 w-full min-w-48 overflow-y-auto rounded-xl border border-pitch-line bg-white p-2 shadow-xl">
          <button type="button" aria-pressed={allSelected} disabled={!options.length} onClick={() => onChange(allSelected ? [] : [...options])} className="flex min-h-10 w-full items-center gap-2 border-b border-pitch-separator px-2 text-left text-xs font-bold text-pitch-primary hover:bg-pitch-panel disabled:opacity-50">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-pitch-primary">{allSelected && <Check className="h-3 w-3" aria-hidden="true" />}</span>
            {allSelected ? t('common.deselectAll') : t('common.selectAll')}
          </button>
          {options.map((option) => {
            const checked = value.includes(option);
            return (
              <label key={option} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-pitch-ink hover:bg-pitch-panel">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? value.filter((item) => item !== option) : [...value, option])}
                  className="h-4 w-4 accent-pitch-primary"
                />
                <span className="min-w-0 flex-1">{option}</span>
              </label>
            );
          })}
          {options.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">{label}</p>}
        </div>
      )}
    </div>
  );
}
