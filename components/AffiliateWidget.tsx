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
  // HTMLが渡された場合（コンテンツページ用）
  if (html) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{__html: html}}
      />
    );
  }

  // dataIdが渡された場合（女優一覧ページ用）
  if (dataId) {
    return (
      <div className={className}>
        <iframe
          src="/dmm-widget.html"
          style= 
            {{width:'100%',
            height: '400px',
            border: 'none',
            overflow: 'hidden'}}
          
          title="DMMアフィリエイト"
        />
      </div>
    );
  }
  
  return null;
}