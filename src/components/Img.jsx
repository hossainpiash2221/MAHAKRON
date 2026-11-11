
/* eslint-disable @next/next/no-img-element */

export default function Img({
  src,
  alt = '',
  className = '',
  priority = false,
  style,
}) {
  if (!src) {
    return (
      <div
        className={`bg-mist ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
