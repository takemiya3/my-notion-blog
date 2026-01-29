'use client'

import Script from 'next/script';

export default function DmmWidget() {
  return (
    <div className="mt-12 mb-8">
      <ins 
        className="dmm-widget-placement" 
        data-id="00234802da6988d09ff706bbb6f8512d" 
        style={{background:'transparent'}}
      />
      <Script
        src="https://widget-view.dmm.co.jp/js/placement.js"
        strategy="afterInteractive"
      />
    </div>
  );
}