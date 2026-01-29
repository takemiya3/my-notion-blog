'use client'

import { useEffect } from 'react';

export default function AffiliateWidget({ 
  dataId,
  html,
  className = "mt-12 mb-8" 
}: {
  dataId?: string;
  html?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!dataId) return;

    // スクリプトを動的に追加
    const script = document.createElement('script');
    script.src = 'https://widget-view.dmm.co.jp/js/placement.js';
    script.className = 'dmm-widget-scripts';
    script.setAttribute('data-id', dataId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // クリーンアップ
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [dataId]);

  // HTMLが渡された場合
  if (html) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{__html: html}}
      />
    );
  }

  // dataIdが渡された場合
  if (dataId) {
    return (
      <div className={className}>
        <ins 
          className="dmm-widget-placement" 
          data-id={dataId} 
          style={{background: 'transparent'}}
        />
      </div>
    );
  }
  
  return null;
}