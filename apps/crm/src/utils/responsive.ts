import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  return { width, height, isMobile, isTablet, isDesktop };
}

export function rs(mobileVal: number, tabletVal?: number, desktopVal?: number) {
  // Runtime responsive scale - use with useWindowDimensions
  return (width: number) => {
    if (width < BREAKPOINTS.mobile) return mobileVal;
    if (width < BREAKPOINTS.tablet) return tabletVal ?? mobileVal;
    return desktopVal ?? tabletVal ?? mobileVal;
  };
}

export function cols(width: number, mobileN = 2, tabletN = 3, desktopN = 4) {
  if (width < BREAKPOINTS.mobile) return mobileN;
  if (width < BREAKPOINTS.tablet) return tabletN;
  return desktopN;
}
