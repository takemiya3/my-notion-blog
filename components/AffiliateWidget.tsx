'use client';

import { useEffect, useRef } from 'react';

interface AffiliateWidgetProps {
  html: string;
}

export default function AffiliateWidget({ html }: AffiliateWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !html) return;

    // HTMLを挿入
    containerRef.current.innerHTML = html;

    // スクリプトタグを抽出して実行
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [html]);

  return <div ref={containerRef} />;
}