'use client'

import Script from 'next/script';
import { useEffect } from 'react';

export default function DmmWidget() {
  return (
    <div className="mt-12 mb-8">
      <ins 
        className="dmm-widget-placement" 
        data-id="afc13b59f48c9eca6fbf159ddb8a8d7e" 
        style="background:'transparent'"
      />
      <Script
        src="https://widget-view.dmm.co.jp/js/placement.js"
        strategy="afterInteractive"
      />
    </div>
  );
}