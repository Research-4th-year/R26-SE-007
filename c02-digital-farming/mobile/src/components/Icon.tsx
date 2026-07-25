import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg';

export type IconName =
  | 'thermometer'
  | 'droplets'
  | 'cloud-rain'
  | 'sun'
  | 'activity'
  | 'sprout'
  | 'info'
  | 'check-circle'
  | 'alert-triangle'
  | 'trending-up'
  | 'wind'
  | 'camera'
  | 'image'
  | 'book-open'
  | 'settings'
  | 'user'
  | 'globe'
  | 'chevron-right'
  | 'chevron-down'
  | 'dollar-sign'
  | 'check'
  | 'upload-cloud'
  | 'beaker'
  | 'clock'
  | 'repeat';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000000', style }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
  };

  switch (name) {
    case 'thermometer':
      return (
        <Svg {...commonProps}>
          <Path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </Svg>
      );
    case 'droplets':
      return (
        <Svg {...commonProps}>
          <Path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
        </Svg>
      );
    case 'cloud-rain':
      return (
        <Svg {...commonProps}>
          <Path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
          <Line x1="8" y1="16" x2="8" y2="22" />
          <Line x1="12" y1="18" x2="12" y2="22" />
          <Line x1="16" y1="16" x2="16" y2="22" />
        </Svg>
      );
    case 'sun':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="5" />
          <Line x1="12" y1="1" x2="12" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="23" />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <Line x1="1" y1="12" x2="3" y2="12" />
          <Line x1="21" y1="12" x2="23" y2="12" />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </Svg>
      );
    case 'activity':
      return (
        <Svg {...commonProps}>
          <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </Svg>
      );
    case 'sprout':
      return (
        <Svg {...commonProps}>
          <Path d="M7 20h10" />
          <Path d="M10 20V12a4 4 0 0 1 8 0v0a4 4 0 0 1-8 0" />
          <Path d="M14 20V8a6 6 0 0 0-12 0v0a6 6 0 0 0 12 0" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="16" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12.01" y2="8" />
        </Svg>
      );
    case 'check-circle':
      return (
        <Svg {...commonProps}>
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <Polyline points="22 4 12 14.01 9 11.01" />
        </Svg>
      );
    case 'alert-triangle':
      return (
        <Svg {...commonProps}>
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <Line x1="12" y1="9" x2="12" y2="13" />
          <Line x1="12" y1="17" x2="12.01" y2="17" />
        </Svg>
      );
    case 'trending-up':
      return (
        <Svg {...commonProps}>
          <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <Polyline points="17 6 23 6 23 12" />
        </Svg>
      );
    case 'wind':
      return (
        <Svg {...commonProps}>
          <Path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...commonProps}>
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <Circle cx="8.5" cy="8.5" r="1.5" />
          <Polyline points="21 15 16 10 5 21" />
        </Svg>
      );
    case 'book-open':
      return (
        <Svg {...commonProps}>
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...commonProps}>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case 'globe':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="2" y1="12" x2="22" y2="12" />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...commonProps}>
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...commonProps}>
          <Polyline points="6 9 12 15 18 9" />
        </Svg>
      );
    case 'dollar-sign':
      return (
        <Svg {...commonProps}>
          <Line x1="12" y1="1" x2="12" y2="23" />
          <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...commonProps}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );
    case 'upload-cloud':
      return (
        <Svg {...commonProps}>
          <Polyline points="16 16 12 12 8 16" />
          <Line x1="12" y1="12" x2="12" y2="21" />
          <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          <Polyline points="16 16 12 12 8 16" />
        </Svg>
      );
    case 'beaker':
      return (
        <Svg {...commonProps}>
          <Path d="M6 3h12" />
          <Path d="M18 3v2a4 4 0 0 1-1.07 2.72L12 13l-4.93-5.28A4 4 0 0 1 6 5V3" />
          <Path d="M8.5 10h7" />
          <Path d="M12 13v8" />
          <Path d="M9 21h6" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );
    case 'repeat':
      return (
        <Svg {...commonProps}>
          <Polyline points="17 1 21 5 17 9" />
          <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <Polyline points="7 23 3 19 7 15" />
          <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </Svg>
      );
    default:
      return null;
  }
};
