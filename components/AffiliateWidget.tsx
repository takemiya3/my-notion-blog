'use client'

export default function AffiliateWidget({ 
  dataId,
  html,
  className = "mt-12 mb-8" 
}: {
  dataId?: string;
  html?: string;
  className?: string;
}) {
  // HTMLが渡された場合
  if (html) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML=__html: html
      />
    );
  }

  // dataIdが渡された場合
  if (dataId) {
    return (
      <div className={className}>
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <ins class="dmm-widget-placement" data-id="${dataId}" style="background:transparent"></ins>
              <script src="https://widget-view.dmm.co.jp/js/placement.js" class="dmm-widget-scripts" data-id="${dataId}"></script>
            `
          }}
        />
      </div>
    );
  }
  
  return null;
}