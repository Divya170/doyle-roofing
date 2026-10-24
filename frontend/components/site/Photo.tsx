/* eslint-disable @next/next/no-img-element */
import { Icon } from './Bits';

/**
 * Photo slot: the approved image when one is set, otherwise the design's labelled
 * "Illustrative placeholder" so missing photography stays obvious.
 */
export function Photo({
  img,
  alt,
  placeholder,
  tone = 'light',
  className = '',
  style,
  eager,
}: {
  img?: { url: string; alt?: string } | null;
  alt: string;
  placeholder: string;
  tone?: 'light' | 'dark' | 'sand';
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}) {
  const cls = `ph${tone === 'dark' ? ' ph--dark' : tone === 'sand' ? ' ph--sand' : ''} ${className}`.trim();
  if (img?.url) {
    return (
      <div className={cls} style={style}>
        <img src={img.url} alt={img.alt || alt} loading={eager ? 'eager' : 'lazy'} />
      </div>
    );
  }
  return (
    <div className={cls} style={style} role="img" aria-label={`Placeholder: ${alt}`}>
      <div className="ph__ph">
        <span>
          <Icon n="image" />
          {placeholder}
        </span>
      </div>
    </div>
  );
}
