'use client';

import React, { useEffect, useRef } from 'react';

interface DynamicShopifyEmbedProps {
  embedCode: string;
}

export default function DynamicShopifyEmbed({ embedCode }: DynamicShopifyEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !embedCode) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create container div from script's target div ID or fallback ID
    const divMatch = embedCode.match(/<div[^>]*id=['"]([^'"]+)['"][^>]*>/);
    const divId = divMatch ? divMatch[1] : `shopify-product-component-${Math.random().toString(36).substring(7)}`;

    const targetDiv = document.createElement('div');
    targetDiv.id = divId;
    containerRef.current.appendChild(targetDiv);

    // Extract raw JS code inside <script> tags
    const scriptMatches = embedCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (!scriptMatches) return;

    // Concat all inner script texts
    const scriptContent = scriptMatches
      .map(s => s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, ''))
      .join('\n');

    // Execute script safely in client scope
    try {
      const runEmbed = new Function(scriptContent);
      runEmbed();
    } catch (e) {
      console.error('Failed to execute Shopify embed code', e);
    }
  }, [embedCode]);

  return (
    <div className="py-2 w-full min-h-[60px]">
      <div ref={containerRef} />
    </div>
  );
}
