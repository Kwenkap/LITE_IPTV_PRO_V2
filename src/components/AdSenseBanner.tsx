import React from "react";
import GoogleAd, { GoogleAdProps } from "./GoogleAd";

export default function AdSenseBanner(props: GoogleAdProps) {
  return <GoogleAd {...props} />;
}
