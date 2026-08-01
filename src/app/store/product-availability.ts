type ProductStatus = 'available' | 'unavailable' | 'coming-soon';

type InventoryAvailability = {
  available?: number;
};

export type ProductAvailability = {
  isAvailable: boolean;
  isComingSoon: boolean;
  isSoldOut: boolean;
  label: 'Available' | 'Coming Soon' | 'Sold Out' | 'Unavailable';
};

export function getProductAvailability(
  status: ProductStatus,
  inventory: InventoryAvailability[],
): ProductAvailability {
  const isComingSoon = status === 'coming-soon';
  const isAvailable = status === 'available';
  const isSoldOut = isAvailable
    && inventory.every(item => (item.available ?? 0) < 1);

  return {
    isAvailable,
    isComingSoon,
    isSoldOut,
    label: isComingSoon
      ? 'Coming Soon'
      : isSoldOut
        ? 'Sold Out'
        : isAvailable
          ? 'Available'
          : 'Unavailable',
  };
}
