'use client';

import React, { useEffect, useRef } from 'react';

export default function ShopifyBuyButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';

    function initShopify() {
      if ((window as any).ShopifyBuy) {
        if ((window as any).ShopifyBuy.UI) {
          ShopifyBuyInit();
        } else {
          loadScript();
        }
      } else {
        loadScript();
      }
    }

    function loadScript() {
      const existingScript = document.querySelector(`script[src="${scriptURL}"]`);
      if (existingScript) {
        if ((window as any).ShopifyBuy?.UI) {
          ShopifyBuyInit();
        } else {
          existingScript.addEventListener('load', ShopifyBuyInit);
        }
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptURL;
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
      script.onload = ShopifyBuyInit;
    }

    function ShopifyBuyInit() {
      if (!containerRef.current) return;
      // Clear container if re-rendering
      containerRef.current.innerHTML = '';
      const client = (window as any).ShopifyBuy.buildClient({
        domain: '3tcih5-pv.myshopify.com',
        storefrontAccessToken: 'dcfbffee074a1abd122a380e32ca7ad6',
      });
      (window as any).ShopifyBuy.UI.onReady(client).then(function (ui: any) {
        ui.createComponent('product', {
          id: '8152250122309',
          node: containerRef.current,
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: {
            "product": {
              "styles": {
                "product": {
                  "@media (min-width: 601px)": {
                    "max-width": "100%",
                    "margin-left": "0px",
                    "margin-bottom": "0px"
                  }
                },
                "button": {
                  "font-family": "Inter, sans-serif",
                  "font-weight": "900",
                  "font-size": "12px",
                  "letter-spacing": "0.1em",
                  "text-transform": "uppercase",
                  "padding-top": "14px",
                  "padding-bottom": "14px",
                  "padding-left": "32px",
                  "padding-right": "32px",
                  "color": "#FFEFBF",
                  "background-color": "#6E0B64",
                  ":hover": {
                    "background-color": "#E65C17"
                  },
                  "border-radius": "9999px",
                  ":focus": {
                    "background-color": "#E65C17"
                  }
                }
              },
              "buttonDestination": "checkout",
              "text": {
                "button": "Buy Now via Shopify"
              }
            },
            "productSet": {
              "styles": {
                "products": {
                  "@media (min-width: 601px)": {
                    "margin-left": "-20px"
                  }
                }
              }
            },
            "modalProduct": {
              "contents": {
                "img": false,
                "imgWithCarousel": true,
                "button": false,
                "buttonWithQuantity": true
              },
              "styles": {
                "product": {
                  "@media (min-width: 601px)": {
                    "max-width": "100%",
                    "margin-left": "0px",
                    "margin-bottom": "0px"
                  }
                }
              },
              "text": {
                "button": "Add to cart"
              }
            },
            "option": {},
            "cart": {
              "text": {
                "total": "Subtotal",
                "button": "Checkout"
              }
            },
            "toggle": {}
          },
        });
      });
    }

    initShopify();
  }, []);

  return (
    <div className="py-2">
      <div id="product-component-1783021228227" ref={containerRef} />
    </div>
  );
}
