import localFont from "next/font/local";

export const Kento = localFont({
  src: [
    {
      path: "./kento-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./kento-bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./kento-light.ttf",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-kento",
});
