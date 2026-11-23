import React, { useId } from 'react';

interface MyConvertLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Official MYConvert Vector Brand Logo
 * - "MY" adapts automatically: Deep Charcoal (#2C313A) in Light/Pastel Mode, Crisp White (#FFFFFF) in Dark Mode
 * - "Co" forms the signature infinity-arrow loop flowing seamlessly into "nvert"
 *   with the Lime-Green (#A3F459) -> Mint-Aqua (#5CE6A0) -> Cyan (#28C7EA) -> Azure Blue (#1496F2) gradient.
 */
export const MyConvertLogo: React.FC<MyConvertLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `myconvert-grad-${uid}`;

  const heightClass =
    size === 'sm'
      ? 'h-6'
      : size === 'lg'
      ? showSubtitle
        ? 'h-16 sm:h-20'
        : 'h-11 sm:h-14'
      : 'h-8 sm:h-9';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox={showSubtitle ? '0 0 602 132' : '0 0 602 100'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClass} w-auto overflow-visible`}
        role="img"
        aria-label="MYConvert - Digital Converter Platform"
      >
        <defs>
          <linearGradient id={gradId} x1="176" y1="52" x2="592" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9EF253" />
            <stop offset="32%" stopColor="#5BE59B" />
            <stop offset="68%" stopColor="#27C6EA" />
            <stop offset="100%" stopColor="#1494F2" />
          </linearGradient>
        </defs>

        {/* "MY" — Charcoal in Light Mode, White in Dark Mode */}
        <g className="fill-[#2C313A] dark:fill-white transition-colors duration-300">
          {/* M */}
          <path d="M 10 88 L 10 16 L 28 16 L 49 56 L 70 16 L 88 16 L 88 88 L 71 88 L 71 43 L 54 75 L 44 75 L 27 43 L 27 88 Z" />
          {/* Y */}
          <path d="M 96 16 L 116 16 L 134 47 L 152 16 L 172 16 L 143 63 L 143 88 L 125 88 L 125 63 Z" />
        </g>

        {/* "Co" Infinity-Arrow Loop */}
        <path
          d="M 228 27 A 31 31 0 1 0 230 81 C 248 81 259 64 269 51 C 276 41 285 36 297 36 A 21.5 21.5 0 1 1 278 69"
          stroke={`url(#${gradId})`}
          strokeWidth="15.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead on top-right of C */}
        <path d="M 221 10 L 250 28 L 216 39 Z" fill="#8BEF65" />

        {/* "nvert" in the same continuous Lime -> Aqua -> Cyan -> Blue gradient */}
        <g fill={`url(#${gradId})`}>
          {/* n */}
          <path d="M 332 88 L 332 34 L 348 34 L 348 42 C 352 36 359 33 368 33 C 381 33 389 41 389 55 L 389 88 L 373 88 L 373 58 C 373 49.5 369 45.5 361.5 45.5 C 354 45.5 348 50 348 58.5 L 348 88 Z" />
          {/* v */}
          <path d="M 395 34 L 412 34 L 424.5 70 L 437 34 L 454 34 L 432 88 L 417 88 Z" />
          {/* e */}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M 483 33 C 499 33 510 44.5 510 61 C 510 63 509.8 65 509.5 66.5 L 471 66.5 C 472.5 73 477.5 76.5 484.5 76.5 C 490 76.5 494.5 74.5 497.5 71 L 508 79 C 502.5 85 494.5 88.5 484 88.5 C 467 88.5 455.5 77 455.5 61 C 455.5 44.5 467 33 483 33 Z M 471 55.5 L 494.5 55.5 C 493.5 49 489 45 483 45 C 477 45 472.5 49 471 55.5 Z"
          />
          {/* r */}
          <path d="M 517 88 L 517 34 L 533 34 L 533 43 C 536.5 36.5 542.5 33.5 550 33.5 L 550 48.5 C 548 48 546 48 544 48 C 537 48 533 52.5 533 61 L 533 88 Z" />
          {/* t */}
          <path d="M 556 34 L 563 34 L 563 19 L 579 19 L 579 34 L 591 34 L 591 46.5 L 579 46.5 L 579 69.5 C 579 74 581 76 585.5 76 C 587.5 76 589.5 75.7 591 75.2 L 591 87.5 C 588 88.3 584.5 88.8 581 88.8 C 568.5 88.8 563 82.5 563 70.5 L 563 46.5 L 556 46.5 Z" />
        </g>

        {showSubtitle && (
          <text
            x="300"
            y="122"
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400"
            fontFamily="'Plus Jakarta Sans', Inter, sans-serif"
            fontWeight="600"
            fontSize="14.5"
            letterSpacing="6.5"
          >
            DIGITAL CONVERTER PLATFORM
          </text>
        )}
      </svg>
    </div>
  );
};
