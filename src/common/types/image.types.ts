export const IMAGE_TYPE = {
  PROFILE: 'profile',
  PRODUCT: 'product',
  ESTABLISHMENT: 'establishment'
} as const;

export type ImageType = typeof IMAGE_TYPE[keyof typeof IMAGE_TYPE];

export const IMAGE_TYPE_ARRAY = Object.values(IMAGE_TYPE);
