/** Pure validation for projects (unit-tested, no framework imports). */
import { clean, IMAGE_RE, tooLong } from '../common/text';

export const PROJECT_CATEGORIES = ['roofing', 'remodeling'] as const;
export const CATEGORY_LABELS: Record<string, string> = { roofing: 'Roofing', remodeling: 'Remodeling' };

export type ProjectInput = Partial<Record<'category' | 'title' | 'description' | 'image' | 'imageAlt' | 'beforeImage' | 'afterImage' | 'featured' | 'sample' | 'published', unknown>>;

export function validateProject(input: ProjectInput) {
  const e: Record<string, string> = {};
  const category = clean(input.category, 20).toLowerCase();
  const title = clean(input.title, 120);
  const description = clean(input.description, 1500, true);
  const image = clean(input.image, 500);
  const imageAlt = clean(input.imageAlt, 200);
  const beforeImage = clean(input.beforeImage, 500);
  const afterImage = clean(input.afterImage, 500);
  const published = input.published !== false;

  if (!(PROJECT_CATEGORIES as readonly string[]).includes(category)) e.category = 'Choose Roofing or Remodeling.';
  if (title.length < 2) e.title = 'Enter a project title.';
  tooLong(e, 'title', title, 120);
  tooLong(e, 'description', description, 1500);
  tooLong(e, 'imageAlt', imageAlt, 200);
  for (const [k, v] of [['image', image], ['beforeImage', beforeImage], ['afterImage', afterImage]] as const) {
    if (v && !IMAGE_RE.test(v)) e[k] = 'Upload an image or use an https:// URL.';
  }
  if (image && !imageAlt) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (!!beforeImage !== !!afterImage) e[beforeImage ? 'afterImage' : 'beforeImage'] = 'Add both a before and an after photo, or neither.';
  if (published && description.length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';

  return {
    value: {
      category,
      title,
      description,
      image: image || null,
      imageAlt,
      beforeImage: beforeImage || null,
      afterImage: afterImage || null,
      featured: input.featured === true,
      sample: input.sample === true,
      published,
    },
    errors: e,
  };
}
