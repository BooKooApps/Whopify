import {
  amber,
  amberA,
  amberDark,
  amberDarkA,
  blue,
  blueA,
  blueDark,
  blueDarkA,
  violet,
  violetA,
  violetDark,
  violetDarkA,
  gray,
  grayA,
  grayDark,
  grayDarkA,
  green,
  greenA,
  greenDark,
  greenDarkA,
  red,
  redA,
  redDark,
  redDarkA,
} from "@radix-ui/colors";

export function useColors() {
  // For now, we'll use light mode. In a real app, you'd detect dark mode
  const isDark = true;

  // Create all the color groups
  const _grayA = isDark ? grayDarkA : grayA;
  const _gray = isDark ? grayDark : gray;
  const _blueA = isDark ? blueDarkA : blueA;
  const _blue = isDark ? blueDark : blue;
  const _redA = isDark ? redDarkA : redA;
  const _red = isDark ? redDark : red;
  const _amberA = isDark ? amberDarkA : amberA;
  const _amber = isDark ? amberDark : amber;
  const _greenA = isDark ? greenDarkA : greenA;
  const _green = isDark ? greenDark : green;

  // Merge them
  return {
    transparent: "transparent" as const,
    ..._grayA,
    ..._gray,
    ..._blueA,
    ..._blue,
    ...(isDark ? violetDarkA : violetA),
    ...(isDark ? violetDark : violet),
    ..._redA,
    ..._red,
    ..._amberA,
    ..._amber,
    ..._greenA,
    ..._green,
  };
}
