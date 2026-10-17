import React, { FC, useMemo } from 'react';
import { WorldFlagItem } from '../types/flagGame';
import { FLAG_SVGS } from './flagSvgs';

export interface FlagProps {
  fillColor?: string; // The user's guessed color or the masked gray
  className?: string;
  showQuestionMark?: boolean;
}

// Layout definitions for declarative vector flag generation
export type FlagLayoutType =
  | 'horizontal-3'
  | 'horizontal-2'
  | 'vertical-3'
  | 'nordic-cross'
  | 'disc-center'
  | 'hoist-triangle'
  | 'canton-stripes'
  | 'special';

export interface FlagDefinition extends WorldFlagItem {
  layout: FlagLayoutType;
  colors?: string[];
  maskIndex?: number;
  extraProps?: Record<string, any>;
}

// 57 Comprehensive Official World Flags Dataset sourced from flag-icons
export const worldFlagsCatalog: FlagDefinition[] = [
  {
    id: 'sa',
    country: 'المملكة العربية السعودية',
    countryCode: 'sa',
    name: 'علم المملكة العربية السعودية',
    targetHex: '#165d31',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'qa',
    country: 'قطر',
    countryCode: 'qa',
    name: 'علم قطر',
    targetHex: '#8d1b3d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'kw',
    country: 'الكويت',
    countryCode: 'kw',
    name: 'علم الكويت',
    targetHex: '#00d941',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ae',
    country: 'الإمارات العربية المتحدة',
    countryCode: 'ae',
    name: 'علم الإمارات',
    targetHex: '#00732f',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'bh',
    country: 'البحرين',
    countryCode: 'bh',
    name: 'علم البحرين',
    targetHex: '#ce1126',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'om',
    country: 'سلطنة عمان',
    countryCode: 'om',
    name: 'علم عمان',
    targetHex: '#009025',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'eg',
    country: 'مصر',
    countryCode: 'eg',
    name: 'علم مصر',
    targetHex: '#ce1126',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'jo',
    country: 'الأردن',
    countryCode: 'jo',
    name: 'علم الأردن',
    targetHex: '#009900',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ps',
    country: 'فلسطين',
    countryCode: 'ps',
    name: 'علم فلسطين',
    targetHex: '#ed2e38',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'iq',
    country: 'العراق',
    countryCode: 'iq',
    name: 'علم العراق',
    targetHex: '#ce1126',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'sy',
    country: 'سوريا',
    countryCode: 'sy',
    name: 'علم سوريا',
    targetHex: '#ce1126',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'lb',
    country: 'لبنان',
    countryCode: 'lb',
    name: 'علم لبنان',
    targetHex: '#ee161f',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ye',
    country: 'اليمن',
    countryCode: 'ye',
    name: 'علم اليمن',
    targetHex: '#f10600',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ma',
    country: 'المغرب',
    countryCode: 'ma',
    name: 'علم المغرب',
    targetHex: '#c1272d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'dz',
    country: 'الجزائر',
    countryCode: 'dz',
    name: 'علم الجزائر',
    targetHex: '#006233',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'tn',
    country: 'تونس',
    countryCode: 'tn',
    name: 'علم تونس',
    targetHex: '#e70013',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ly',
    country: 'ليبيا',
    countryCode: 'ly',
    name: 'علم ليبيا',
    targetHex: '#239e46',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'sd',
    country: 'السودان',
    countryCode: 'sd',
    name: 'علم السودان',
    targetHex: '#009a00',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'so',
    country: 'الصومال',
    countryCode: 'so',
    name: 'علم الصومال',
    targetHex: '#40a6ff',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'mr',
    country: 'موريتانيا',
    countryCode: 'mr',
    name: 'علم موريتانيا',
    targetHex: '#006233',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'jp',
    country: 'اليابان',
    countryCode: 'jp',
    name: 'علم اليابان',
    targetHex: '#bc002d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'kr',
    country: 'كوريا الجنوبية',
    countryCode: 'kr',
    name: 'علم كوريا الجنوبية',
    targetHex: '#cd2e3a',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'cn',
    country: 'الصين',
    countryCode: 'cn',
    name: 'علم الصين',
    targetHex: '#ee1c25',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'in',
    country: 'الهند',
    countryCode: 'in',
    name: 'علم الهند',
    targetHex: '#ff9933',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'tr',
    country: 'تركيا',
    countryCode: 'tr',
    name: 'علم تركيا',
    targetHex: '#e30a17',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'id',
    country: 'إندونيسيا',
    countryCode: 'id',
    name: 'علم إندونيسيا',
    targetHex: '#e70011',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'my',
    country: 'ماليزيا',
    countryCode: 'my',
    name: 'علم ماليزيا',
    targetHex: '#000066',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'pk',
    country: 'باكستان',
    countryCode: 'pk',
    name: 'علم باكستان',
    targetHex: '#0c590b',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'vn',
    country: 'فيتنام',
    countryCode: 'vn',
    name: 'علم فيتنام',
    targetHex: '#da251d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'th',
    country: 'تايلاند',
    countryCode: 'th',
    name: 'علم تايلاند',
    targetHex: '#2d2a4a',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'de',
    country: 'ألمانيا',
    countryCode: 'de',
    name: 'علم ألمانيا',
    targetHex: '#ffcc00',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'fr',
    country: 'فرنسا',
    countryCode: 'fr',
    name: 'علم فرنسا',
    targetHex: '#000091',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'it',
    country: 'إيطاليا',
    countryCode: 'it',
    name: 'علم إيطاليا',
    targetHex: '#009246',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'es',
    country: 'إسبانيا',
    countryCode: 'es',
    name: 'علم إسبانيا',
    targetHex: '#aa151b',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'gb',
    country: 'المملكة المتحدة',
    countryCode: 'gb',
    name: 'علم المملكة المتحدة',
    targetHex: '#012169',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'nl',
    country: 'هولندا',
    countryCode: 'nl',
    name: 'علم هولندا',
    targetHex: '#21468b',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'be',
    country: 'بلجيكا',
    countryCode: 'be',
    name: 'علم بلجيكا',
    targetHex: '#ffd90c',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'se',
    country: 'السويد',
    countryCode: 'se',
    name: 'علم السويد',
    targetHex: '#005293',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ch',
    country: 'سويسرا',
    countryCode: 'ch',
    name: 'علم سويسرا',
    targetHex: '#ff0000',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'gr',
    country: 'اليونان',
    countryCode: 'gr',
    name: 'علم اليونان',
    targetHex: '#0d5eaf',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'pt',
    country: 'البرتغال',
    countryCode: 'pt',
    name: 'علم البرتغال',
    targetHex: '#006600',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ru',
    country: 'روسيا',
    countryCode: 'ru',
    name: 'علم روسيا',
    targetHex: '#0039a6',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'at',
    country: 'النمسا',
    countryCode: 'at',
    name: 'علم النمسا',
    targetHex: '#c8102e',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'br',
    country: 'البرازيل',
    countryCode: 'br',
    name: 'علم البرازيل',
    targetHex: '#229e45',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ar',
    country: 'الأرجنتين',
    countryCode: 'ar',
    name: 'علم الأرجنتين',
    targetHex: '#74acdf',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'co',
    country: 'كولومبيا',
    countryCode: 'co',
    name: 'علم كولومبيا',
    targetHex: '#ffe800',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'cl',
    country: 'تشيلي',
    countryCode: 'cl',
    name: 'علم تشيلي',
    targetHex: '#0039a6',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'mx',
    country: 'المكسيك',
    countryCode: 'mx',
    name: 'علم المكسيك',
    targetHex: '#006847',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'us',
    country: 'الولايات المتحدة',
    countryCode: 'us',
    name: 'علم الولايات المتحدة',
    targetHex: '#192f5d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ca',
    country: 'كندا',
    countryCode: 'ca',
    name: 'علم كندا',
    targetHex: '#d52b1e',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'pe',
    country: 'بيرو',
    countryCode: 'pe',
    name: 'علم بيرو',
    targetHex: '#d91023',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'za',
    country: 'جنوب أفريقيا',
    countryCode: 'za',
    name: 'علم جنوب أفريقيا',
    targetHex: '#007847',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'ng',
    country: 'نيجيريا',
    countryCode: 'ng',
    name: 'علم نيجيريا',
    targetHex: '#008753',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'gh',
    country: 'غانا',
    countryCode: 'gh',
    name: 'علم غانا',
    targetHex: '#fcd116',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'sn',
    country: 'السنغال',
    countryCode: 'sn',
    name: 'علم السنغال',
    targetHex: '#0b7226',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'au',
    country: 'أستراليا',
    countryCode: 'au',
    name: 'علم أستراليا',
    targetHex: '#00008b',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
  {
    id: 'nz',
    country: 'نيوزيلندا',
    countryCode: 'nz',
    name: 'علم نيوزيلندا',
    targetHex: '#00247d',
    svgMaskSelector: 'target-color',
    layout: 'special' as FlagLayoutType,
  },
];

// Backwards compatibility alias
export const flagsDataset = worldFlagsCatalog;

/**
 * Normalizes hex string (3-digit or 6-digit) and standard color names to lower-case #rrggbb
 */
export function normalizeHex(hex: string): string {
  if (!hex) return '';
  hex = hex.trim().toLowerCase();
  if (hex === 'red') return '#ff0000';
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  return '#' + hex;
}

/**
 * Multi-Element Color Masking Engine (Austria Rule)
 * Replaces ALL elements/paths/styles sharing the target hex color simultaneously
 */
export function maskSvgString(
  rawSvg: string,
  targetHex: string,
  fillColor: string = '#B0AAA0',
  showQuestionMark: boolean = false
): string {
  if (!rawSvg) return '';
  const targetNorm = normalizeHex(targetHex);

  // 1. Mask fill="..." and fill='...' attributes
  let masked = rawSvg.replace(/\bfill=["']([^"']+)["']/gi, (match: string, color: string) => {
    if (normalizeHex(color) === targetNorm) {
      return `fill="${fillColor}"`;
    }
    return match;
  });

  // 2. Mask style="...fill: HEX;..." inline CSS
  masked = masked.replace(/style=["']([^"']+)["']/gi, (match: string, styleContent: string) => {
    const newStyle = styleContent.replace(/fill:\s*([^;"]+)/gi, (m: string, color: string) => {
      if (normalizeHex(color) === targetNorm) {
        return `fill: ${fillColor}`;
      }
      return m;
    });
    return `style="${newStyle}"`;
  });

  // 3. Inject centered Question Mark layer if requested
  if (showQuestionMark) {
    const qMarkElement = `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" opacity="0.85" font-size="96" font-weight="900" font-family="sans-serif" style="text-shadow: 0 4px 10px rgba(0,0,0,0.7);">?</text></svg>`;
    masked = masked.replace(/<\/svg>\s*$/i, qMarkElement);
  }

  return masked;
}

/**
 * High-Fidelity World Flag Renderer
 * Renders authentic vector SVGs from flag-icons with multi-element color masking
 */
export const DynamicWorldFlag: FC<FlagProps & { flag: FlagDefinition }> = ({
  flag,
  fillColor = '#B0AAA0',
  className = '',
  showQuestionMark = false,
}) => {
  const rawSvg = FLAG_SVGS[flag.id] || FLAG_SVGS[flag.countryCode] || '';

  const processedSvg = useMemo(() => {
    if (!rawSvg) return '';
    return maskSvgString(rawSvg, flag.targetHex, fillColor, showQuestionMark);
  }, [rawSvg, flag.targetHex, fillColor, showQuestionMark]);

  if (!processedSvg) {
    return (
      <svg viewBox="0 0 640 480" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="480" fill={fillColor} />
        {showQuestionMark && (
          <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="96" fontWeight="bold">
            ?
          </text>
        )}
      </svg>
    );
  }

  return (
    <div
      className={`overflow-hidden flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
      dangerouslySetInnerHTML={{ __html: processedSvg }}
    />
  );
};

// Map of components for any specific flag ID lookup
export const FlagComponents: Record<string, FC<FlagProps>> = {};

worldFlagsCatalog.forEach((item) => {
  FlagComponents[item.id] = (props: FlagProps) => (
    <DynamicWorldFlag flag={item} {...props} />
  );
});
