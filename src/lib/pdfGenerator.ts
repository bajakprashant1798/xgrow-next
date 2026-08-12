export interface QuoteDetails {
  quoteId: string;
  couponCode: string;
  clientName: string;
  businessName: string;
  clientEmail: string;
  clientPhone: string;
  businessType: string;
  pagesCount: string;
  currency: "INR" | "USD";
  currencySymbol: string;
  features: { name: string; included: boolean; costText: string }[];
  minPrice: number;
  maxPrice: number;
  discountPercent: number;
  finalMinPrice: number;
  finalMaxPrice: number;
  date: string;
  validUntil: string;
}

export interface ResourceDetails {
  resourceTitle: string;
  resourceCategory: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  businessName: string;
  couponCode: string;
  date: string;
}

/**
 * Generates an official, printable quotation document with discount coupon
 * and triggers window print / PDF saving.
 */
export function downloadQuotationPDF(quote: QuoteDetails) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download or view your quotation PDF.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>XGRO Quotation #${quote.quoteId} - ${quote.clientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      padding: 40px;
      line-height: 1.5;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-b: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }

    .logo-box h1 {
      font-size: 28px;
      font-weight: 900;
      color: #0284c7;
      letter-spacing: -0.5px;
    }
    .logo-box p {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }

    .meta-box {
      text-align: right;
    }
    .quote-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
    .meta-line {
      font-size: 13px;
      color: #475569;
    }
    .meta-line strong {
      color: #0f172a;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }

    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
    }
    .info-card h3 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0284c7;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .info-card p {
      font-size: 14px;
      color: #334155;
      margin-bottom: 4px;
    }
    .info-card strong {
      color: #0f172a;
    }

    .coupon-banner {
      background: linear-gradient(135deg, #0284c7 0%, #0f172a 100%);
      color: #ffffff;
      padding: 18px 24px;
      border-radius: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    .coupon-banner .code {
      background: #ffffff;
      color: #0284c7;
      font-weight: 800;
      font-size: 16px;
      padding: 8px 18px;
      border-radius: 8px;
      letter-spacing: 1px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      text-align: left;
      padding: 12px 16px;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #334155;
    }
    td strong {
      color: #0f172a;
    }

    .totals-box {
      margin-left: auto;
      width: 320px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .totals-row.discount {
      color: #16a34a;
      font-weight: 600;
    }
    .totals-row.final {
      border-top: 2px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    .terms {
      border-t: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 12px;
      color: #64748b;
    }
    .terms h4 {
      font-size: 13px;
      color: #334155;
      margin-bottom: 6px;
    }
    .terms ul {
      margin-left: 18px;
    }

    .footer-stamp {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#f0f9ff; border:1px solid #bae6fd; padding:12px; border-radius:8px; margin-bottom:20px; text-align:center;">
    <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:10px 24px; font-weight:700; border-radius:6px; cursor:pointer;">
      🖨️ Save as PDF / Print Document
    </button>
  </div>

  <div class="header">
    <div class="logo-box">
      <h1>XGRO</h1>
      <p>Premium Digital Growth & AI Automation Agency</p>
      <p>MDA, Moradabad, UP | India & USA | Phone: +91 63953 19725</p>
    </div>
    <div class="meta-box">
      <span class="quote-badge">OFFICIAL ESTIMATED QUOTATION</span>
      <div class="meta-line">Quote ID: <strong>#${quote.quoteId}</strong></div>
      <div class="meta-line">Date: <strong>${quote.date}</strong></div>
      <div class="meta-line">Valid Until: <strong>${quote.validUntil}</strong></div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <h3>Prepared For</h3>
      <p><strong>Name:</strong> ${quote.clientName}</p>
      <p><strong>Business:</strong> ${quote.businessName || "Not specified"}</p>
      <p><strong>Email:</strong> ${quote.clientEmail}</p>
      <p><strong>Phone / WA:</strong> ${quote.clientPhone}</p>
    </div>
    <div class="info-card">
      <h3>Scope Summary</h3>
      <p><strong>Project Type:</strong> ${quote.businessType}</p>
      <p><strong>Page Scale:</strong> ${quote.pagesCount}</p>
      <p><strong>Tech Stack:</strong> Next.js, Tailwind, React, AI Bot</p>
      <p><strong>Estimated Delivery:</strong> 7 - 21 Days</p>
    </div>
  </div>

  <div class="coupon-banner">
    <div>
      <h4 style="font-size:16px; font-weight:700;">🎁 Special Discount Coupon Included</h4>
      <p style="font-size:13px; opacity:0.9;">Present this code to your account manager to claim 15% instant reduction!</p>
    </div>
    <div class="code">${quote.couponCode}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Selected Feature / Module</th>
        <th>Included Status</th>
        <th style="text-align:right;">Estimated Value</th>
      </tr>
    </thead>
    <tbody>
      ${quote.features
        .map(
          (f) => `
        <tr>
          <td><strong>${f.name}</strong></td>
          <td>${f.included ? '<span style="color:#16a34a; font-weight:600;">✓ Included</span>' : '<span style="color:#94a3b8;">Optional</span>'}</td>
          <td style="text-align:right;">${f.costText}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row">
      <span>Standard Estimated Price:</span>
      <span>${quote.currencySymbol}${quote.minPrice.toLocaleString("en-IN")} – ${quote.currencySymbol}${quote.maxPrice.toLocaleString("en-IN")}</span>
    </div>
    <div class="totals-row discount">
      <span>Discount Coupon (-${quote.discountPercent}%):</span>
      <span>Included</span>
    </div>
    <div class="totals-row final">
      <span>Final Estimate:</span>
      <span>${quote.currencySymbol}${quote.finalMinPrice.toLocaleString("en-IN")} – ${quote.currencySymbol}${quote.finalMaxPrice.toLocaleString("en-IN")}</span>
    </div>
  </div>

  <div class="terms">
    <h4>Terms & Next Steps:</h4>
    <ul>
      <li>This estimate is valid for 14 days from date of generation.</li>
      <li>Includes 100% source code ownership, free launch deployment & support.</li>
      <li>To lock in this pricing and redeem coupon <strong>${quote.couponCode}</strong>, contact your advisor at +91 63953 19725 or email xgro.services@gmail.com.</li>
    </ul>
  </div>

  <div class="footer-stamp">
    <p>© ${new Date().getFullYear()} XGRO Digital Agency. Generated automatically for ${quote.clientName}.</p>
  </div>

  <script>
    window.onload = function() {
      // Auto open print box if desired
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Downloads official 2026 Price List PDF & Rate Card
 */
export function downloadPriceListPDF(details: ResourceDetails) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to view/download the price list.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>XGRO Official Price List & Rate Card 2026</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a;
      padding: 40px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-b: 2px solid #0284c7;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo { font-size: 30px; font-weight: 900; color: #0284c7; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 12px; }

    .user-welcome {
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .coupon-card {
      background: linear-gradient(135deg, #0284c7, #0f172a);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .coupon-code {
      background: #ffffff;
      color: #0284c7;
      font-weight: 900;
      font-size: 18px;
      padding: 10px 20px;
      border-radius: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 24px 0 12px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 700; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .price { font-weight: 800; color: #0284c7; text-align: right; }

    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px; text-align:center;">
    <button onclick="window.print()" style="background:#0284c7; color:white; border:none; padding:12px 28px; font-weight:800; border-radius:8px; cursor:pointer;">
      🖨️ Save as PDF / Print Rate Card
    </button>
  </div>

  <div class="header">
    <div>
      <div class="logo">XGRO</div>
      <p style="font-size:12px; color:#64748b;">Official 2026 Agency Rate Card & Service Directory</p>
    </div>
    <div>
      <span class="badge">OFFICIAL PRICE LIST</span>
    </div>
  </div>

  <div class="user-welcome">
    <p style="font-size:14px; color:#334155;"><strong>Issued To:</strong> ${details.clientName} (${details.businessName || "Business Executive"})</p>
    <p style="font-size:13px; color:#64748b;"><strong>Contact:</strong> ${details.clientEmail} | ${details.clientPhone} | Generated: ${details.date}</p>
  </div>

  <div class="coupon-card">
    <div>
      <h3 style="margin:0; font-size:16px;">🎟️ Your Exclusive Discount Coupon</h3>
      <p style="margin:4px 0 0 0; font-size:13px; opacity:0.9;">Apply code to receive 15% OFF any project package!</p>
    </div>
    <div class="coupon-code">${details.couponCode}</div>
  </div>

  <h3 class="section-title">1. Website & Mobile App Packages</h3>
  <table>
    <thead>
      <tr>
        <th>Package Name</th>
        <th>Best Suited For</th>
        <th>Key Deliverables</th>
        <th style="text-align:right;">Investment</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Starter Web</strong></td>
        <td>Small Business / Personal</td>
        <td>5 Responsive Pages, Mobile Optimized, WhatsApp Chat</td>
        <td class="price">₹14,999</td>
      </tr>
      <tr>
        <td><strong>Growth Web + AI</strong></td>
        <td>Local Business & Clinics</td>
        <td>12 Pages, AI Chatbot, Local SEO, CRM Lead Routing</td>
        <td class="price">₹39,999</td>
      </tr>
      <tr>
        <td><strong>E-Commerce Store</strong></td>
        <td>Retail & Direct Brands</td>
        <td>Unlimited Products, Payment Gateway, Admin Dashboard</td>
        <td class="price">₹49,999</td>
      </tr>
      <tr>
        <td><strong>Custom Web App / SaaS</strong></td>
        <td>Startups & Platforms</td>
        <td>Bespoke Next.js Build, Database, Authentication</td>
        <td class="price">₹74,999+</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">2. AI Automation & WhatsApp Solutions</h3>
  <table>
    <thead>
      <tr>
        <th>Module Name</th>
        <th>Capability</th>
        <th style="text-align:right;">Investment</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>AI Smart Assistant</strong></td>
        <td>Custom trained chatbot for site lead qualification</td>
        <td class="price">₹14,999</td>
      </tr>
      <tr>
        <td><strong>WhatsApp Automation Bot</strong></td>
        <td>24/7 Auto-reply, catalog sharing & lead capture</td>
        <td class="price">₹11,999</td>
      </tr>
      <tr>
        <td><strong>CRM & Webhook Sync</strong></td>
        <td>Instant sync leads into Google Sheets, Notion or HubSpot</td>
        <td class="price">₹7,999</td>
      </tr>
    </tbody>
  </table>

  <h3 class="section-title">3. SEO & Growth Retainers</h3>
  <table>
    <thead>
      <tr>
        <th>Plan</th>
        <th>Features</th>
        <th style="text-align:right;">Monthly Fee</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Local SEO Accelerator</strong></td>
        <td>Google Maps ranking, 10 local keywords, review system</td>
        <td class="price">₹9,999 / mo</td>
      </tr>
      <tr>
        <td><strong>Full Scale Growth</strong></td>
        <td>Meta & Google Ads management + SEO + Social Creatives</td>
        <td class="price">₹24,999 / mo</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:40px; border-top:1px solid #cbd5e1; pt-4; font-size:12px; color:#64748b; text-align:center;">
    <p>XGRO Digital Growth Agency · MDA Moradabad UP India · Phone: +91 63953 19725 · Email: xgro.services@gmail.com</p>
  </div>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
