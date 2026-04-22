import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 20, color = 'currentColor', stroke = 2 }: IconProps) {
  const s = stroke;
  const c = color;
  const props = { fill: 'none', stroke: c, strokeWidth: s, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const icons: Record<string, React.ReactNode> = {
    home: <><Path {...props} d="M3 10.5 12 3l9 7.5"/><Path {...props} d="M5 9.5V20h14V9.5"/></>,
    utensils: <><Path {...props} d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3"/><Path {...props} d="M6 12v9"/><Path {...props} d="M16 3c-2 0-3 2-3 5s1 5 3 5v8"/></>,
    car: <><Path {...props} d="M5 16h14M6 16l1.5-5A2 2 0 0 1 9.4 9.5h5.2a2 2 0 0 1 1.9 1.5L18 16"/><Path {...props} d="M4 16v3M20 16v3"/><Circle cx="8" cy="16" r="1.5" fill={c}/><Circle cx="16" cy="16" r="1.5" fill={c}/></>,
    music: <><Path {...props} d="M9 18V6l12-2v12"/><Circle cx="6" cy="18" r="3" fill={c}/><Circle cx="18" cy="16" r="3" fill={c}/></>,
    heart: <Path {...props} d="M12 20s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z"/>,
    repeat: <><Path {...props} d="M4 8h13l-3-3M20 16H7l3 3"/></>,
    bag: <><Path {...props} d="M5 8h14l-1 12H6L5 8z"/><Path {...props} d="M9 8V6a3 3 0 0 1 6 0v2"/></>,
    book: <><Path {...props} d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><Path {...props} d="M5 17a3 3 0 0 1 3-3h10"/></>,
    dots: <><Circle cx="6" cy="12" r="1.5" fill={c}/><Circle cx="12" cy="12" r="1.5" fill={c}/><Circle cx="18" cy="12" r="1.5" fill={c}/></>,
    plus: <Path {...props} d="M12 5v14M5 12h14"/>,
    minus: <Path {...props} d="M5 12h14"/>,
    chevR: <Path {...props} d="M9 6l6 6-6 6"/>,
    chevL: <Path {...props} d="M15 6l-6 6 6 6"/>,
    chevD: <Path {...props} d="M6 9l6 6 6-6"/>,
    chevU: <Path {...props} d="M6 15l6-6 6 6"/>,
    arrR: <><Path {...props} d="M5 12h14M13 6l6 6-6 6"/></>,
    arrUp: <><Path {...props} d="M12 19V5M6 11l6-6 6 6"/></>,
    arrDn: <><Path {...props} d="M12 5v14M18 13l-6 6-6-6"/></>,
    send: <Path {...props} d="M4 4 20 12 4 20l3-8-3-8z"/>,
    search: <><Circle cx="11" cy="11" r="7" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M20 20l-3.5-3.5"/></>,
    bell: <><Path {...props} d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9z"/><Path {...props} d="M10 20a2 2 0 0 0 4 0"/></>,
    check: <Path {...props} d="M5 12l5 5L20 7"/>,
    close: <><Path {...props} d="M6 6l12 12M18 6 6 18"/></>,
    calendar: <><Path {...props} d="M5 6h14v14H5zM5 10h14M9 3v4M15 3v4"/></>,
    pie: <Path {...props} d="M12 3v9h9a9 9 0 1 1-9-9z"/>,
    home2: <Path {...props} d="M4 10.5 12 4l8 6.5V20h-5v-6h-6v6H4v-9.5z"/>,
    list: <Path {...props} d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>,
    chat: <Path {...props} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V6z"/>,
    user: <><Circle cx="12" cy="8" r="4" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M4 21a8 8 0 0 1 16 0"/></>,
    settings: <><Path {...props} d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><Path {...props} d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2L5 5.8l-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.5.9 2-3.5-2-1.5c0-.4.1-.8.1-1.2z"/></>,
    sparkle: <Path {...props} d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>,
    trend: <><Path {...props} d="M3 17l6-6 4 4 8-8M15 7h6v6"/></>,
    wallet: <><Path {...props} d="M4 7a2 2 0 0 1 2-2h11v4h3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"/><Circle cx="17" cy="13" r="1.5" fill={c}/></>,
    filter: <Path {...props} d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/>,
    pencil: <Path {...props} d="M4 20h4L20 8l-4-4L4 16v4z"/>,
    trash: <><Path {...props} d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M7 7l1 12h8l1-12"/></>,
    flag: <><Path {...props} d="M5 3v18M5 4h12l-2 4 2 4H5"/></>,
    mic: <><Path {...props} d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"/><Path {...props} d="M5 12a7 7 0 0 0 14 0M12 19v3"/></>,
    eye: <><Path {...props} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><Circle cx="12" cy="12" r="3" fill="none" stroke={c} strokeWidth={s}/></>,
    eyeOff: <><Path {...props} d="M3 3l18 18M6.7 6.7C4 8.5 2 12 2 12s3.5 7 10 7c2 0 3.7-.6 5.2-1.5M10 5.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.3 3.2"/></>,
    shield: <Path {...props} d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"/>,
    globe: <><Circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    moon: <Path {...props} d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>,
    sun: <><Circle cx="12" cy="12" r="4" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></>,
    lock: <><Path {...props} d="M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z"/></>,
    key: <><Circle cx="8" cy="15" r="4" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M11 12l10-10-3-3M16 7l3 3"/></>,
    logout: <><Path {...props} d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h11"/></>,
    card: <><Path {...props} d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 10h18"/></>,
    tag: <><Path {...props} d="M4 4h8l8 8-8 8-8-8V4z"/><Circle cx="8" cy="8" r="1.5" fill={c}/></>,
    clock: <><Circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={s}/><Path {...props} d="M12 7v5l3 2"/></>,
    copy: <><Path {...props} d="M8 4h10v14M4 8h10v12H4z"/></>,
    zap: <Path {...props} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {icons[name] || icons.dots}
    </Svg>
  );
}
