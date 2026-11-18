/* Static Print center interface, mounted only inside an approved team workspace. */
(function () {
  "use strict";
  window.foodBrokerTeamPrintTemplate = `
<dialog id="teamPrintCenterDialog" aria-labelledby="tpPrintTitle">
  <form id="teamPrintForm">
    <div class="tp-dialog-header"><div><p class="tp-eyebrow">FoodBrokerBase</p><h2 id="tpPrintTitle">Print center</h2></div><button id="tpClose" class="ghost-action" type="button">Close</button></div>
    <p id="tpStatus" class="ps-status" role="status" aria-live="polite"></p>
    <div class="pc-navigation">
      <h3 class="pc-step-heading">1. Choose what to print</h3>
      <div id="tpPrintMode" class="pc-mode-bar" role="group" aria-label="Choose what to print">
        <button type="button" class="pc-mode-option" data-tp-mode="products" aria-pressed="true"><strong>Products</strong><span>Choose one or several products</span></button>
        <button type="button" class="pc-mode-option" data-tp-mode="event" aria-pressed="false"><strong>From an event</strong><span>Use a visit, test kitchen or foodshow</span></button>
      </div>
      <section id="tpCatalogPicker" class="pc-source-panel" aria-label="Choose products">
          <div id="pcCatalogFields">
        <div class="pc-catalog-toolbar">
          <label class="pc-search"><span>Find a product</span><input id="tpSearch" type="search" placeholder="Product, vendor, brand, MF#, APN or SUPC…" /></label>
          <fieldset class="pc-filter-field">
            <legend>Product list</legend>
            <select id="tpCollection" hidden><option value="stock">Stocked products</option><option value="new">New products</option></select>
            <div class="pc-filter-buttons" data-catalog-filter="tpCollection"></div>
          </fieldset>
          <fieldset class="pc-filter-field">
            <legend>Distributor</legend>
            <select id="tpDistributor" hidden><option value="">All distributors</option><option value="usFoods">US Foods</option><option value="sysco">Sysco</option><option value="linford">Linford</option><option value="qualitySales">Quality Sales</option><option value="other">Other</option></select>
            <div class="pc-filter-buttons" data-catalog-filter="tpDistributor"></div>
          </fieldset>
          <label class="pc-vendor-select"><span>Vendor</span><select id="tpVendor"><option value="">All vendors</option></select></label>
        </div>
        <div class="pc-catalog-layout">
          <aside class="pc-vendors" aria-label="Browse vendors"><h4>Vendors</h4><div id="tpVendorButtons"></div></aside>
          <div class="pc-catalog-main">
            <div class="pc-catalog-actions"><span id="tpCount" role="status" aria-live="polite"></span><button id="tpSelectedOnly" type="button" class="ps-text" aria-pressed="false">Selected only</button><button id="tpSelectShown" type="button" class="ps-text">Select shown</button><button id="tpClearSelection" type="button" class="ps-text">Clear selection</button><button id="tpRefresh" type="button" class="ps-text">Refresh</button></div>
            <div id="tpProductList" class="tp-product-list pc-catalog-products"></div>
            <div class="tp-load-more"><button id="tpLoadMore" type="button" class="ghost-action" hidden>Load more products</button></div>
          </div>
        </div>
          </div>
          <div class="pc-selected-summary"><strong id="tpSelectedCount" role="status" aria-live="polite">0 products selected</strong><button id="pcReviewProducts" type="button" aria-controls="pcCatalogFields" hidden>Review products</button><button id="pcChangeProducts" type="button" aria-controls="pcCatalogFields" hidden>Change products</button><ul id="pcSelectedNames" aria-label="Selected products" hidden></ul></div>
        </section>
      <section id="tpEventPanel" class="pc-source-panel pc-event-panel" aria-label="Choose an event" hidden>
        <fieldset class="pc-event-field">
          <legend>Event or visit</legend>
          <select id="tpEventPicker" hidden><option value="">Choose an event</option></select>
          <div class="pc-event-choices" hidden></div>
          <p class="pc-event-no-options" tabindex="-1">No upcoming or ongoing events.</p>
        </fieldset>
    <section id="psPrintProducts" class="ps-print-products pc-event-products">
          <h3 class="pc-event-selection-heading">Event products <span id="psPrintProductCount" role="status" aria-live="polite"></span></h3>
          <div class="ps-print-product-toolbar">
            <label class="ps-print-product-search"><span class="ps-print-sr-only">Find a product in this event</span><input id="psPrintProductSearch" type="search" placeholder="Find a product in this event…" /></label>
            <button id="psPrintSelectAll" type="button">Select all</button>
            <button id="psPrintSelectNone" type="button">Clear all</button>
          </div>
          <div id="psPrintProductList" class="ps-print-product-list pc-catalog-products"></div>
        </section>
      </section>
    </div>
    <label hidden><span>Print source</span><select id="psPrintSource" tabindex="-1"><option value="selected">Selected products</option><option value="shown">Current product search</option><option value="event:">Choose an event</option></select></label>
    <section class="pc-format-panel">
      <h3 class="pc-step-heading">2. Format &amp; print</h3>
    <div class="ps-print-options">
      <label><span>Format</span><select id="psPrintFormat"><option value="labels" selected>Sample bag labels · 4 × 2 in (Avery 8163)</option><option value="list">Product list</option><option value="cards">4 × 6 inch presentation cards</option></select></label>
      <div id="psBagQuantity" class="ps-bag-quantity" hidden>
        <span id="psBagQuantityTitle">Labels per product</span>
        <div class="ps-bag-quantity-buttons" role="group" aria-labelledby="psBagQuantityTitle">
          <button id="psBagOneEach" type="button" aria-pressed="false">1 each</button>
          <button id="psBagFullSheet" type="button" aria-pressed="false">10 each</button>
        </div>
      </div>
      <label data-print-document hidden><span>Distributor logo</span><select id="psPrintLogo"><option value="none">No distributor logo</option><option value="usFoods">US Foods</option><option value="sysco">Sysco</option><option value="linford">Linford</option><option value="qualitySales">Quality Sales</option></select></label>
      <label data-print-document hidden><span>Heading</span><input id="psPrintHeading" value="Product presentation" maxlength="120" /></label>
      <label data-print-document hidden><span>Copies of each card</span><input id="psPrintCopies" type="number" min="1" max="20" value="1" /></label>

    </div>
    </section>
    <p id="tpPrintEmpty" class="pc-empty-job">Choose products above to start a print job.</p>
        <details id="psPrintErrors" class="ps-print-errors" hidden><summary>Last print error</summary><pre id="psPrintErrorDetails"></pre><div class="ps-print-error-actions"><button id="psPrintCopyError" type="button">Copy error details</button><button id="psPrintDismissError" type="button" class="ps-text">Dismiss</button></div><p id="psPrintCopyStatus" role="status" aria-live="polite"></p></details>
        <div id="psPrintLayout" class="ps-print-layout" data-format="labels">
      <aside id="psBagSettings" class="ps-bag-settings" aria-labelledby="psBagSettingsTitle">
        <h3 id="psBagSettingsTitle">Label setup</h3>
        <div class="ps-bag-product-row">
          <label><span>Product</span><select id="psBagProduct"><option value="">Choose products to print first</option></select></label>
          <label><span>Copies</span><input id="psBagCopies" type="number" min="1" max="100" step="1" value="1" /></label>
        </div>
        <div class="ps-bag-placement">
          <div class="ps-bag-artwork">
            <div class="ps-bag-field-pair ps-bag-logo-fields">
              <label><span>Logo for this product</span><select id="psBagLogoMode"><option value="automatic">Automatic</option><option value="manufacturer">Manufacturer logo</option><option value="usFoodsEb">US Foods Exclusive Brand</option><option value="syscoEb">Sysco Exclusive Brand</option><option value="none">No logo</option><option value="custom">Uploaded logo</option></select></label>
              <label><span>Choose logo</span><select id="psBagLogoChoice"><option value="">Automatic for this product</option></select></label>
            </div>
            <div class="ps-bag-logo-tools">
              <div class="ps-bag-logo-actions"><button type="button" id="psBagBrowseLogos">Logo library</button><button type="button" id="psBagUploadLogo" title="Upload a PNG, JPEG, WebP, or GIF up to 4 MB">Upload logo</button></div>
              <p id="psBagLogoStatus" class="ps-bag-logo-status" role="status" aria-live="polite"></p>
              <div class="ps-bag-logo-upload" hidden><input id="psBagLogoFile" type="file" aria-label="Upload logo" accept="image/png,image/jpeg,image/webp,image/gif" hidden /><button type="button" id="psBagClearLogo">Remove from this label</button></div>
            </div>
            <fieldset class="ps-bag-code-options"><legend>Include item numbers</legend><label><input id="psBagShowMf" type="checkbox" checked />MF#</label><label><input id="psBagShowApn" type="checkbox" checked />APN</label><label><input id="psBagShowSupc" type="checkbox" checked />SUPC</label><label><input id="psBagShowItem" type="checkbox" checked />Item#</label></fieldset>
          </div>
          <fieldset class="ps-bag-position"><legend>First label on sheet</legend><div id="psBagStartGrid" class="ps-bag-start-grid"></div></fieldset>
          <select id="psBagStart" hidden aria-hidden="true"><option value="1">1 · top left</option><option value="2">2 · top right</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10 · bottom right</option></select>
        </div>
        <details class="ps-bag-edit"><summary>Edit label wording</summary><label><span>Product description</span><textarea id="psBagTitle" rows="2" maxlength="200"></textarea></label><div class="ps-bag-field-pair"><label><span>Short description / brand line</span><input id="psBagSubtitle" maxlength="180" /></label><label><span>Packaging</span><input id="psBagPackaging" maxlength="80" /></label></div><div class="ps-bag-field-pair ps-bag-number-fields"><label><span>MF#</span><input id="psBagMf" maxlength="80" /></label><label><span>US Foods APN</span><input id="psBagApn" maxlength="80" /></label><label><span>Sysco SUPC</span><input id="psBagSupc" maxlength="80" /></label><label><span>Other item #</span><input id="psBagItem" maxlength="80" /></label></div><button type="button" id="psBagReset" class="ps-text">Reset this label</button></details>
        <details class="ps-bag-appearance"><summary>Sheet appearance</summary><label><span>Preferred text size</span><select id="psBagTextSize"><option value="standard">Standard · 16 pt name / 12 pt details</option><option value="compact">Compact · 14 pt name / 11 pt details</option><option value="large">Large · 18 pt name / 14 pt details</option></select></label><p class="ps-hint">Long labels fit automatically. All wording and item numbers are kept.</p></details>
        <p id="psBagHelp" class="ps-hint">Preview the full sheet to check each label before printing.</p>
      </aside>
      <div class="ps-output-panel">
          <div class="ps-output-actions">
            <span id="psPreviewState" role="status"></span>
            <button id="psPreparePrint" type="button" hidden>Retry preview</button>
            <button id="psPrintNow" type="button" class="primary-action" aria-describedby="psPrintScaleNote" disabled>Print labels</button>
            <small id="psPrintScaleNote">Print at 100% / Actual size.</small>
          </div>
          <div id="psPrintPreview" class="ps-print-preview"><p class="ps-empty">Choose products to see a preview.</p></div>
        </div>
    </div>
    <p class="tp-print-note">Labels use Letter paper. Presentation cards are 6 inches wide × 4 inches tall. Check a plain-paper sheet before using label stock.</p>
  </form>
</dialog>`;
})();
