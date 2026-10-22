import { IS_MOCK_MODE } from '../config/dataMode';
import { apiClient, mockDelay } from '../lib/api/client';
import { mockStorage } from '../mocks/mockStorage';
import { CatalogOptions } from '../types';

const unique = (values: Array<string | undefined>): string[] => [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];

export const catalogsService = {
  async getOptions(): Promise<CatalogOptions> {
    if (!IS_MOCK_MODE) return apiClient<CatalogOptions>('catalogs');

    const listings = mockStorage.getMarketplace();
    const players = mockStorage.getPlayers();
    const pitches = mockStorage.getPitches();
    const user = mockStorage.getProfile();
    const recruitmentAds = mockStorage.getRecruitmentAds();
    return mockDelay({
      pitchSurfaces: unique(pitches.map((pitch) => pitch.surface)),
      pitchAmenities: unique(pitches.flatMap((pitch) => pitch.amenities)),
      marketplaceCategories: unique(listings.map((item) => item.category)),
      marketplaceConditions: unique(listings.map((item) => item.condition)),
      marketplaceBrands: unique(listings.map((item) => item.brand)),
      playerPositions: unique(players.flatMap((player) => [player.primaryPosition, player.secondaryPosition])),
      recruitmentPositions: unique(recruitmentAds.map((ad) => ad.positionSought)),
      playerLevels: unique(players.map((player) => player.level)),
      strongFeet: unique([...players.map((player) => player.strongFoot), user.sportsCv.strongFoot]),
    }, 100);
  },
};
