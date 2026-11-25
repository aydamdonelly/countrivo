import mapBordersData from '@/data/client-map-borders.json';

/** Land borders between countries, in the coastline's projection. Public geography, shown only once a pin is committed. */
export const mapBorders: { viewBox: string; borders: string } = mapBordersData;
