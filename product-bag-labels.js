/* Local preview renderer for the supplied 4 × 2 inch bag-label references.
 * This module does not read or save products, identities, preferences or files.
 * Logos are resolved by the caller and supplied as raster data URLs.
 */
(function (scope) {
  "use strict";

  const TEMPLATE = Object.freeze({
    id: "bag-label-4x2",
    pageWidthIn: 8.5,
    pageHeightIn: 11,
    labelWidthIn: 4,
    labelHeightIn: 2,
    leftIn: 0.15625,
    topIn: 36.1 / 72,
    topPt: 36.1,
    columnGapIn: 0.1875,
    columns: 2,
    rows: 5,
    slotsPerPage: 10
  });
  const FONT_FAMILIES = Object.freeze(["Arial", "Calibri", "Times New Roman", "Verdana"]);
  const LAYOUT_LIMITS = Object.freeze({topPaddingPt: 72, sidePaddingPt: 72, bottomPaddingPt: 72, logoGapPt: 24, titleGapPt: 24, bodyGapPt: 24});
  const LOGO_MODES = Object.freeze(["automatic", "brand", "manufacturer", "none"]);
  const TEXT_FIELDS = Object.freeze(["title", "subtitle", "packaging", "manufacturerNumber", "apn", "supc", "itemNumber", "logoAlt"]);
  const BASE_CSS = `
.bag-label-page,.bag-label-page *{box-sizing:border-box}
.bag-label-page{position:relative;width:8.5in;height:11in;flex:none;background:#fff;color:#000;margin:0 auto 18px;box-shadow:0 2px 10px #203d3925;break-after:page;page-break-after:always;overflow:visible}
.bag-label-page:last-child{break-after:auto;page-break-after:auto}
.bag-label-grid{position:absolute;left:.15625in;top:var(--bag-top-pt,36.1pt);display:grid;grid-template-columns:4in 4in;grid-template-rows:repeat(5,2in);column-gap:.1875in;row-gap:0;width:8.1875in;height:10in}
.bag-label{position:relative;width:4in;height:2in;margin:0;padding:0;min-width:0;min-height:0;overflow:visible}
.bag-label::before{content:"";position:absolute;inset:0;border:.25pt solid #bfbfbf;border-radius:.2in;pointer-events:none}
.bag-label-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;padding:var(--bag-padding-top,3.75pt) var(--bag-padding-side,21.55pt) var(--bag-padding-bottom,3.75pt);text-align:center;font-family:var(--bag-font-family,Arial),sans-serif;overflow:visible;line-height:1.15}
.bag-label-inner>*{flex-shrink:0;max-width:100%}
.bag-label-logos{display:flex;justify-content:center;align-items:flex-end;gap:0;margin:0 0 var(--bag-logo-gap,5.7pt);max-width:100%}
.bag-label-logo-box{position:relative;display:flex;flex:none;justify-content:center;align-items:center;margin:0;overflow:hidden}
.bag-label-logo{display:block;width:100%;height:100%;object-fit:contain;object-position:center}
.bag-label-logo-cropped{position:absolute;max-width:none;object-fit:fill}
.bag-label-title{font-size:var(--bag-title-pt,16pt);font-weight:700;line-height:1.15;margin:0 0 var(--bag-title-gap,2.85pt);overflow-wrap:break-word;white-space:pre-line}
.bag-label-line{font-size:var(--bag-body-pt,12pt);font-weight:400;line-height:1.15;margin:0 0 var(--bag-body-gap,2.85pt);overflow-wrap:break-word;white-space:pre-line}
.bag-label-inner>:last-child{margin-bottom:0}
.bag-label[data-overflow=true]{outline:2px solid #b23523;outline-offset:-2px;background:#fff2ed}
@media print{
  @page{size:Letter portrait;margin:0}
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  .bag-label-page{margin:0;box-shadow:none;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .bag-label-page[data-print-outlines=false] .bag-label::before{display:none}
  .bag-label-blank::before{display:none}
  .bag-label{outline:none!important}
  .bag-label[data-overflow=true]{background:#fff!important}
}
`;

  const string = value => String(value == null ? "" : value);
  const escape = value => string(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const finiteNumber = value => typeof value === "number" && Number.isFinite(value);
  const integerInRange = (value, min, max) => finiteNumber(value) && Number.isInteger(value) && value >= min && value <= max;
  const rasterDataUrl = value => /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value) && value.length <= 4 * Math.ceil(4 * 1024 * 1024 / 3) + 64;
  const localObjectUrl = value => {
    const origin = scope.location?.origin;
    const prefix = "blob:" + origin + "/";
    return typeof value === "string" && typeof origin === "string" && /^https?:\/\//.test(origin) && value.startsWith(prefix) && /^[a-f0-9-]{36}$/i.test(value.slice(prefix.length));
  };

  function validateLayout(layout, errors, prefix) {
    if (layout == null) return;
    if (!layout || typeof layout !== "object" || Array.isArray(layout)) { errors.push(prefix + "choose valid label spacing."); return; }
    Object.keys(LAYOUT_LIMITS).forEach(field => {
      if (layout[field] != null && (!finiteNumber(layout[field]) || layout[field] < 0 || layout[field] > LAYOUT_LIMITS[field])) errors.push(prefix + field + " must be between 0 and " + LAYOUT_LIMITS[field] + " points.");
    });
  }

  function validate(job) {
    const errors = [];
    if (!job || typeof job !== "object" || Array.isArray(job)) return { valid: false, errors: ["Choose a label job."], labelCount: 0, pageCount: 0 };
    const products = job.products;
    const imageUrls = job.imageUrls == null ? [] : job.imageUrls;
    if (!Array.isArray(imageUrls) || imageUrls.length > 6000 || imageUrls.some(value => !localObjectUrl(value))) errors.push("Use only image resources created for this label job.");
    const allowedImages = new Set(Array.isArray(imageUrls) ? imageUrls : []);
    if (!Array.isArray(products) || !products.length) errors.push("Choose at least one product to label.");
    if (Array.isArray(products) && products.length > 1000) errors.push("A label job can contain no more than 1,000 products.");
    const startPosition = job.startPosition == null ? 1 : job.startPosition;
    if (!integerInRange(startPosition, 1, 10)) errors.push("The first label position must be a whole number from 1 to 10.");
    if (job.logoMode != null && !LOGO_MODES.includes(job.logoMode)) errors.push("Choose Automatic, Brand, Manufacturer or No logo.");
    ["showMf", "showApn", "showSupc", "showItem", "showOutlines"].forEach(field => {
      if (job[field] != null && typeof job[field] !== "boolean") errors.push(field + " must be true or false.");
    });
    if (job.geometry != null && (!job.geometry || typeof job.geometry !== "object" || Array.isArray(job.geometry))) errors.push("Choose valid label sheet geometry.");
    else if (job.geometry?.topPt != null && (!finiteNumber(job.geometry.topPt) || job.geometry.topPt < 0 || job.geometry.topPt > 72)) errors.push("The top label position must be between 0 and 72 points.");
    validateLayout(job.layout, errors, "");
    const typography = job.typography == null ? {} : job.typography;
    if (!typography || typeof typography !== "object" || Array.isArray(typography)) errors.push("Choose valid label type settings.");
    else {
      if (typography.fontFamily != null && !FONT_FAMILIES.includes(typography.fontFamily)) errors.push("Choose a supported label font.");
      if (typography.titlePt != null && (!finiteNumber(typography.titlePt) || typography.titlePt < 8 || typography.titlePt > 32)) errors.push("Product title size must be between 8 and 32 points.");
      if (typography.bodyPt != null && (!finiteNumber(typography.bodyPt) || typography.bodyPt < 6 || typography.bodyPt > 24)) errors.push("Label detail size must be between 6 and 24 points.");
    }
    let labelCount = 0;
    if (Array.isArray(products) && products.length <= 1000) products.forEach((product, index) => {
      const prefix = "Product " + (index + 1) + ": ";
      if (!product || typeof product !== "object" || Array.isArray(product)) { errors.push(prefix + "choose valid label details."); return; }
      TEXT_FIELDS.forEach(field => {
        if (product[field] != null && typeof product[field] !== "string") errors.push(prefix + field + " must be text.");
        if (typeof product[field] === "string" && product[field].length > 2000) errors.push(prefix + field + " is too long (maximum 2,000 characters).");
      });
      if (typeof product.title !== "string" || !product.title.trim()) errors.push(prefix + "enter a product title.");
      const copies = product.copies == null ? 1 : product.copies;
      if (!integerInRange(copies, 1, 100)) errors.push(prefix + "copies must be a whole number from 1 to 100.");
      else labelCount += copies;
      if (product.logoDataUrl != null && product.logoDataUrl !== "" && (typeof product.logoDataUrl !== "string" || !rasterDataUrl(product.logoDataUrl))) errors.push(prefix + "use a PNG, JPEG, WebP or GIF logo supplied as a data image.");
      if (product.logoWidthIn != null && (!finiteNumber(product.logoWidthIn) || product.logoWidthIn <= 0 || product.logoWidthIn > 3.25)) errors.push(prefix + "logo width must be above 0 and no more than 3.25 inches.");
      if (product.logoHeightIn != null && (!finiteNumber(product.logoHeightIn) || product.logoHeightIn <= 0 || product.logoHeightIn > 0.7)) errors.push(prefix + "logo height must be above 0 and no more than 0.7 inch.");
      validateLayout(product.layout, errors, prefix);
      if (product.typography != null) {
        const type = product.typography;
        if (!type || typeof type !== "object" || Array.isArray(type)) errors.push(prefix + "choose valid label type settings.");
        else {
          if (type.fontFamily != null && !FONT_FAMILIES.includes(type.fontFamily)) errors.push(prefix + "choose a supported label font.");
          if (type.titlePt != null && (!finiteNumber(type.titlePt) || type.titlePt < 8 || type.titlePt > 32)) errors.push(prefix + "product title size must be between 8 and 32 points.");
          if (type.bodyPt != null && (!finiteNumber(type.bodyPt) || type.bodyPt < 6 || type.bodyPt > 24)) errors.push(prefix + "label detail size must be between 6 and 24 points.");
        }
      }
      if (product.logos != null) {
        if (!Array.isArray(product.logos) || product.logos.length > 6) errors.push(prefix + "choose no more than six product logos.");
        else product.logos.forEach((logo, logoIndex) => {
          const logoPrefix = prefix + "logo " + (logoIndex + 1) + ": ";
          if (!logo || typeof logo !== "object" || Array.isArray(logo)) { errors.push(logoPrefix + "choose valid image settings."); return; }
          const objectImage = typeof logo.objectUrl === "string" && localObjectUrl(logo.objectUrl) && allowedImages.has(logo.objectUrl);
          if (logo.objectUrl != null && !objectImage) errors.push(logoPrefix + "use an image resource created for this label job.");
          if (!objectImage && (typeof logo.dataUrl !== "string" || !rasterDataUrl(logo.dataUrl))) errors.push(logoPrefix + "use a PNG, JPEG, WebP or GIF data image.");
          if (logo.dataUrl != null && (typeof logo.dataUrl !== "string" || !rasterDataUrl(logo.dataUrl))) errors.push(logoPrefix + "use a valid raster data image.");
          if (logo.alt != null && (typeof logo.alt !== "string" || logo.alt.length > 2000)) errors.push(logoPrefix + "enter an image description of no more than 2,000 characters.");
          ["widthPt", "heightPt"].forEach(field => {
            if (logo[field] != null && (!finiteNumber(logo[field]) || logo[field] <= 0 || logo[field] > (field === "widthPt" ? 288 : 144))) errors.push(logoPrefix + field + " must fit within the 4 × 2 inch label.");
          });
          ["cropTop", "cropBottom", "cropLeft", "cropRight"].forEach(field => {
            if (logo[field] != null && (!finiteNumber(logo[field]) || logo[field] < 0 || logo[field] >= 1)) errors.push(logoPrefix + field + " must be a fraction from 0 up to 1.");
          });
          if ((logo.cropLeft || 0) + (logo.cropRight || 0) >= 1 || (logo.cropTop || 0) + (logo.cropBottom || 0) >= 1) errors.push(logoPrefix + "the crop must leave a visible part of the image.");
        });
      }
    });
    if (labelCount > 1000) errors.push("This job contains " + labelCount + " labels. Reduce copies or split it into jobs of no more than 1,000 labels.");
    return { valid: !errors.length, errors, labelCount, pageCount: labelCount && integerInRange(startPosition, 1, 10) ? Math.ceil((labelCount + startPosition - 1) / TEMPLATE.slotsPerPage) : 0 };
  }

  function labelMarkup(product, index, job) {
    const typography = { ...(job.typography || {}), ...(product.typography || {}) };
    const layout = { topPaddingPt: 3.75, sidePaddingPt: 21.55, bottomPaddingPt: 3.75, logoGapPt: 5.7, titleGapPt: 2.85, bodyGapPt: 2.85, ...(job.layout || {}), ...(product.layout || {}) };
    const style = "--bag-title-pt:" + (typography.titlePt == null ? 16 : typography.titlePt) + "pt;--bag-body-pt:" + (typography.bodyPt == null ? 12 : typography.bodyPt) + "pt;--bag-font-family:" + (typography.fontFamily || "Arial") + ";--bag-padding-top:" + layout.topPaddingPt + "pt;--bag-padding-side:" + layout.sidePaddingPt + "pt;--bag-padding-bottom:" + layout.bottomPaddingPt + "pt;--bag-logo-gap:" + layout.logoGapPt + "pt;--bag-title-gap:" + layout.titleGapPt + "pt;--bag-body-gap:" + layout.bodyGapPt + "pt";
    const resolvedLogos = Array.isArray(product.logos) ? product.logos : product.logoDataUrl ? [{ dataUrl: product.logoDataUrl, alt: product.logoAlt, widthPt: (product.logoWidthIn == null ? 3.25 : product.logoWidthIn) * 72, heightPt: (product.logoHeightIn == null ? 0.7 : product.logoHeightIn) * 72 }] : [];
    const logo = job.logoMode !== "none" && resolvedLogos.length ? `<div class="bag-label-logos">${resolvedLogos.map(image => {
      const width = image.widthPt == null ? 234 : image.widthPt, height = image.heightPt == null ? 50.4 : image.heightPt;
      const left = image.cropLeft || 0, right = image.cropRight || 0, top = image.cropTop || 0, bottom = image.cropBottom || 0;
      const cropped = Boolean(left || right || top || bottom);
      const cropStyle = cropped ? `width:${100 / (1 - left - right)}%;height:${100 / (1 - top - bottom)}%;left:${-100 * left / (1 - left - right)}%;top:${-100 * top / (1 - top - bottom)}%` : "";
      return `<div class="bag-label-logo-box" style="width:${width}pt;height:${height}pt"><img class="bag-label-logo${cropped ? " bag-label-logo-cropped" : ""}" src="${escape(image.objectUrl || image.dataUrl)}" alt="${escape(image.alt || "Product logo")}"${cropped ? ` style="${escape(cropStyle)}"` : ""} /></div>`;
    }).join("")}</div>` : "";
    const lines = [];
    if (product.subtitle) lines.push(product.subtitle);
    if (product.packaging) lines.push(product.packaging);
    if (job.showMf !== false && product.manufacturerNumber) lines.push("MF# " + product.manufacturerNumber);
    if (job.showApn !== false && product.apn) lines.push("US Foods # " + product.apn);
    if (job.showSupc === true && product.supc) lines.push("SUPC# " + product.supc);
    if (job.showItem === true && product.itemNumber) lines.push("Item# " + product.itemNumber);
    return `<article class="bag-label" data-label-index="${index}" data-label-title="${escape(product.title)}"><div class="bag-label-inner" style="${escape(style)}">${logo}<h2 class="bag-label-title">${escape(product.title)}</h2>${lines.map(line => `<p class="bag-label-line">${escape(line)}</p>`).join("")}</div></article>`;
  }

  function build(job) {
    const result = validate(job);
    if (!result.valid) {
      const error = new Error(result.errors.join("\n"));
      error.name = "BagLabelValidationError";
      error.details = Object.freeze(result.errors.slice());
      throw error;
    }
    const slots = Array.from({ length: (job.startPosition || 1) - 1 }, () => null);
    const labels = [];
    job.products.forEach(product => {
      for (let copy = 0; copy < (product.copies || 1); copy++) {
        labels.push(Object.freeze({ labelIndex: labels.length + 1, title: product.title }));
        slots.push(labelMarkup(product, labels.length, job));
      }
    });
    while (slots.length % TEMPLATE.slotsPerPage) slots.push(null);
    const pages = [];
    for (let start = 0; start < slots.length; start += TEMPLATE.slotsPerPage) {
      pages.push(`<section class="bag-label-page" aria-label="Label sheet ${pages.length + 1}" data-print-outlines="${job.showOutlines !== false}" style="--bag-top-pt:${job.geometry?.topPt == null ? 36.1 : job.geometry.topPt}pt"><div class="bag-label-grid">${slots.slice(start, start + TEMPLATE.slotsPerPage).map(slot => slot || '<div class="bag-label bag-label-blank" aria-hidden="true"></div>').join("")}</div></section>`);
    }
    return Object.freeze({ html: pages.join(""), css: BASE_CSS, labelCount: result.labelCount, pageCount: result.pageCount, labels: Object.freeze(labels) });
  }

  function inspectOverflow(root) {
    if (!root || typeof root.querySelectorAll !== "function") throw new TypeError("Pass the rendered label preview element.");
    const issues = [];
    root.querySelectorAll(".bag-label[data-label-index]").forEach(label => {
      const inner = label.querySelector(".bag-label-inner");
      const reasons = [];
      if (!inner || !inner.getBoundingClientRect().width || !inner.getBoundingClientRect().height) reasons.push("The label is not visible for layout checking.");
      else {
        if (inner.scrollWidth > inner.clientWidth + 1) reasons.push("Text exceeds the label width.");
        if (inner.scrollHeight > inner.clientHeight + 1) reasons.push("Content exceeds the label height.");
        const bounds = inner.getBoundingClientRect();
        Array.from(inner.children).forEach(child => {
          const childBounds = child.getBoundingClientRect();
          if ((childBounds.right > bounds.right + 1 || childBounds.left < bounds.left - 1) && !reasons.includes("Text exceeds the label width.")) reasons.push("Text exceeds the label width.");
          if ((childBounds.bottom > bounds.bottom + 1 || childBounds.top < bounds.top - 1) && !reasons.includes("Content exceeds the label height.")) reasons.push("Content exceeds the label height.");
        });
        inner.querySelectorAll("img").forEach(image => {
          if (!image.complete) reasons.push("The logo has not finished loading.");
          else if (!image.naturalWidth || !image.naturalHeight) reasons.push("The logo could not be loaded.");
        });
      }
      if (reasons.length) issues.push(Object.freeze({ labelIndex: Number(label.dataset.labelIndex), title: label.dataset.labelTitle || "", reasons: Object.freeze(reasons) }));
    });
    if (!root.querySelector(".bag-label[data-label-index]")) issues.push(Object.freeze({ labelIndex: 0, title: "", reasons: Object.freeze(["No labels were rendered for checking."]) }));
    return Object.freeze({ ok: !issues.length, issues: Object.freeze(issues) });
  }

  function printDocument(job) {
    const output = build(job);
    return `<!doctype html><html><head><meta charset="utf-8"><title>Product bag labels</title><style>${output.css}</style></head><body>${output.html}</body></html>`;
  }

  scope.foodBrokerBagLabels = Object.freeze({ template: TEMPLATE, fontFamilies: FONT_FAMILIES, logoModes: LOGO_MODES, validate, build, inspectOverflow, printDocument });
})(typeof window === "object" ? window : globalThis);
