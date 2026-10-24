export interface PublicSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  address: string;
  mapHref: string | null;
  locationLabel: string;
  statement: string;
  privacyPolicy: string;
  showReviewFlags: boolean;
  estimatesOpen: boolean;
  photoUploadsOpen: boolean;
}

export type Category = 'roofing' | 'remodeling';

export interface ServiceItem {
  id: number;
  name: string;
  need: string;
  image: string | null;
  alt: string;
}
export interface Step {
  id: number;
  title: string;
  body: string;
}
export interface Faq {
  id: number;
  q: string;
  a: string;
}
export interface Option {
  label: string;
  icon: string;
}
export interface Project {
  id: number;
  category: Category;
  categoryLabel: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  beforeImage: string | null;
  afterImage: string | null;
  featured: boolean;
  sample: boolean;
}
export type SiteImages = Record<string, { url: string; alt: string } | undefined>;

export interface SiteData {
  settings: PublicSettings;
  services: { roofing: ServiceItem[]; remodeling: ServiceItem[] };
  steps: Step[];
  faqs: { roofing: Faq[]; remodeling: Faq[]; general: Faq[] };
  options: { property: Option[]; timeline: Option[]; budget: Option[]; roofIssue: Option[]; roofAge: Option[]; remodelArea: Option[] };
  projects: Project[];
  images: SiteImages;
}

export interface EstimateOptions {
  open: boolean;
  photosOpen: boolean;
  maxPhotos: number;
  maxPhotoMb: number;
}

export type Opt = { value: string; label: string };

// ---------- admin ----------

export interface HistoryEvent {
  status: string;
  label: string;
  by: string;
  at: string;
}

export interface EstimatePhotoRef {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
}

export interface Estimate {
  id: number;
  publicRef: string | null;
  type: Category;
  typeLabel: string;
  roofIssues: string[];
  roofAge: string;
  areas: string[];
  property: string;
  location: string;
  timeline: string;
  budget: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  statusLabel: string;
  notes: string;
  notificationState: string;
  acknowledgementState: string;
  createdAt: string;
  photoCount?: number;
  photos?: EstimatePhotoRef[];
  history?: HistoryEvent[];
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<string, number>;
  notificationsConfigured: boolean;
}

export interface AdminProject {
  id: number;
  category: Category;
  categoryLabel: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  beforeImage: string | null;
  afterImage: string | null;
  featured: boolean;
  sample: boolean;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  options?: Opt[];
  help?: string;
}
export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  uniqueBy?: string;
}
export interface AdminContentItem {
  id: number;
  type: string;
  sortOrder: number;
  fields: Record<string, unknown>;
  published: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locationLabel: string;
  statement: string;
  privacyPolicy: string;
  showReviewFlags: boolean;
  estimatesOpen: boolean;
  photoUploadsOpen: boolean;
  updatedAt: string;
}
