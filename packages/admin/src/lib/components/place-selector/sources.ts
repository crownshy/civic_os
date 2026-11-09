import { createSeedGeometrySource, createSeedPlaceSource } from './seed-places';

// The one place admin picks where the selector's data comes from. Seeded Oregon and
// Utah for now; swap these two for comhairle-backed sources once Hosts can read
// region areas (#561) and the tag convention is settled (#509).
export const createPlaceSource = createSeedPlaceSource;
export const createPlaceGeometrySource = createSeedGeometrySource;
