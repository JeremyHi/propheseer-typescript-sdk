/**
 * A market category with its subcategories.
 */
export interface Category {
  /** Category identifier */
  id: string;
  /** Display name */
  name: string;
  /** List of subcategory identifiers */
  subcategories: string[];
}
