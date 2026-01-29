'use client'

import Script from 'next/script';

type AffiliateWidgetProps = {
  dataId?: string;
  html?: string;
  type?: 'DMM' | 'その他';
  className?: string;
}

export default function AffiliateWidget({ 
  dataId,
  html,
  type = 'DMM',
  className = "mt-12 mb-8" 
}: AffiliateWidgetProps) {
  // HTMLが直接渡された場合はそれをレンダリング
  if (html) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{__html: html}} 
      />
    );
  }

  // dataIdが渡された場合はDMMウィジェットをレンダリング
  if (dataId && type === 'DMM') {
    return (
      <div className={className}>
        <ins 
          className="dmm-widget-placement" 
          data-id={dataId} 
          style={{background: 'transparent'}}
        />
        <Script
          src="https://widget-view.dmm.co.jp/js/placement.js"
          strategy="afterInteractive"
        />
      </div>
    );
  }
  
  return null;
}