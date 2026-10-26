/* Static Print center interface, mounted only inside an approved team workspace. */
(function () {
  "use strict";
  window.foodBrokerTeamPrintTemplate = `
<dialog id="teamPrintCenterDialog" aria-labelledby="tpPrintTitle">
  <form id="teamPrintForm">
    <div class="tp-dialog-header"><div><p class="tp-eyebrow">FoodBrokerBase</p><h2 id="tpPrintTitle">Print center</h2></div><button id="tpClose" class="ghost-action" type="button">Close</button></div>
    <p id="tpStatus" class="ps-status" role="status" aria-live="polite"></p>
    <details id="tpCatalogPicker" class="tp-picker" open>
      <summary>Choose from stock or new products <span id="tpSelectedCount" role="status" aria-live="polite">0 selected</span></summary>
      <div class="tp-picker-filters">
        <label class="tp-search"><span>Search products</span><input id="tpSearch" type="search" placeholder="Product, manufacturer, brand, MF#, APN or SUPC…" /></label>
        <label><span>Product list</span><select id="tpCollection"><option value="stock">Stocked products</option><option value="new">New products</option></select></label>
        <label><span>Distributor</span><select id="tpDistributor"><option value="">All distributors</option><option value="usFoods">US Foods</option><option value="sysco">Sysco</option><option value="linford">Linford</option><option value="qualitySales">Quality Sales</option><option value="other">Other</option></select></label>
      </div>
      <div class="tp-picker-actions"><span id="tpCount" role="status" aria-live="polite"></span><button id="tpSelectShown" type="button" class="ps-text">Select shown</button><button id="tpClearSelection" type="button" class="ps-text">Clear selection</button><button id="tpRefresh" type="button" class="ghost-action">Refresh products</button></div>
      <div id="tpProductList" class="tp-product-list"></div>
      <div class="tp-load-more"><button id="tpLoadMore" type="button" class="ghost-action" hidden>Load more products</button></div>
    </details>
    <div class="ps-print-options">
      <label><span>Products to print</span><select id="psPrintSource"><option value="selected">Selected products</option><option value="shown">Current product search</option></select></label>
      <label><span>Format</span><select id="psPrintFormat"><option value="labels" selected>Sample bag labels · 4 × 2 in (Avery 8163)</option><option value="list">Product list</option><option value="cards">4 × 6 inch presentation cards</option></select></label>
      <label data-print-document hidden><span>Distributor logo</span><select id="psPrintLogo"><option value="none">No distributor logo</option><option value="usFoods">US Foods</option><option value="sysco">Sysco</option><option value="linford">Linford</option><option value="qualitySales">Quality Sales</option></select></label>
      <label data-print-document hidden><span>Heading</span><input id="psPrintHeading" value="Product presentation" maxlength="120" /></label>
      <label data-print-document hidden><span>Copies of each card</span><input id="psPrintCopies" type="number" min="1" max="20" value="1" /></label>
      <button type="button" id="psPreparePrint" class="primary-action">Preview layout</button>
    </div>
    <p id="psPrintSummary" class="ps-hint"></p>
    <details id="psPrintProducts" class="ps-print-products" open>
          <summary>Choose products to print <span id="psPrintProductCount" role="status" aria-live="polite"></span></summary>
          <div class="ps-print-product-toolbar"><label class="ps-print-product-search"><span class="ps-print-sr-only">Find a product in this print job</span><input id="psPrintProductSearch" type="search" placeholder="Find a product in this print job…" /></label><button id="psPrintSelectAll" type="button" class="ps-text">Select all</button><button id="psPrintSelectNone" type="button" class="ps-text">Clear</button></div>
          <div id="psPrintProductList" class="ps-print-product-list"></div>
        </details>
        <div id="psBagQuantity" class="ps-bag-quantity"><span>Labels for selected products</span><div class="ps-bag-quantity-buttons" role="group" aria-label="Labels for selected products"><button id="psBagOneEach" type="button" aria-pressed="true">1 per product</button><button id="psBagFullSheet" type="button" aria-pressed="false">10 per product</button></div><small>Automatic fitting is on for every selected product. Change quantities in Label setup.</small></div>
        <details id="psPrintErrors" class="ps-print-errors" hidden><summary>Last print error</summary><pre id="psPrintErrorDetails"></pre><div class="ps-print-error-actions"><button id="psPrintCopyError" type="button">Copy error details</button><button id="psPrintDismissError" type="button" class="ps-text">Dismiss</button></div><p id="psPrintCopyStatus" role="status" aria-live="polite"></p></details>
        <div id="psPrintLayout" class="ps-print-layout" data-format="labels">
      <aside id="psBagSettings" class="ps-bag-settings" aria-labelledby="psBagSettingsTitle">
        <h3 id="psBagSettingsTitle">Label setup</h3>
        <label><span>Product</span><select id="psBagProduct"><option value="">Choose products to print first</option></select></label>
        <label><span>Logo for this product</span><select id="psBagLogoMode"><option value="automatic">Automatic product logo</option><option value="manufacturer">Manufacturer logo</option><option value="usFoodsEb">US Foods Exclusive Brand</option><option value="syscoEb">Sysco Exclusive Brand</option><option value="none">No logo</option><option value="custom">Upload a logo</option></select></label>
        <label><span>Choose logo</span><select id="psBagLogoChoice"><option value="">Automatic for this product</option></select></label>
        <p id="psBagLogoStatus" class="ps-bag-logo-status" role="status" aria-live="polite"></p>
        <div class="ps-bag-logo-upload" hidden><label><span>Logo image · up to 4 MB</span><input id="psBagLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label><button type="button" id="psBagClearLogo">Remove uploaded logo</button><p class="ps-hint">Uploaded logos are used only for this print job.</p></div>
        <div class="ps-bag-field-pair"><label><span>Copies of this product</span><input id="psBagCopies" type="number" min="1" max="100" step="1" value="1" /></label><label><span>First label on sheet</span><select id="psBagStart"><option value="1">1 · top left</option><option value="2">2 · top right</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10 · bottom right</option></select></label></div>
        <fieldset class="ps-bag-code-options"><legend>Include item numbers</legend><label><input id="psBagShowMf" type="checkbox" checked />MF#</label><label><input id="psBagShowApn" type="checkbox" checked />APN</label><label><input id="psBagShowSupc" type="checkbox" checked />SUPC</label><label><input id="psBagShowItem" type="checkbox" checked />Item#</label></fieldset>
        <details class="ps-bag-edit"><summary>Edit label wording</summary><p class="ps-hint">Changes apply only to this print job. The shared product stays unchanged.</p><label><span>Product description</span><textarea id="psBagTitle" rows="3" maxlength="200"></textarea></label><label><span>Short description / brand line</span><input id="psBagSubtitle" maxlength="180" /></label><label><span>Packaging</span><input id="psBagPackaging" maxlength="80" /></label><div class="ps-bag-field-pair"><label><span>MF#</span><input id="psBagMf" maxlength="80" /></label><label><span>US Foods APN</span><input id="psBagApn" maxlength="80" /></label><label><span>Sysco SUPC</span><input id="psBagSupc" maxlength="80" /></label><label><span>Other item number</span><input id="psBagItem" maxlength="80" /></label></div><button type="button" id="psBagReset" class="ps-text">Reset this label</button></details>
        <details class="ps-bag-appearance"><summary>Sheet appearance</summary><label class="ps-bag-check"><input id="psBagOutlines" type="checkbox" checked />Show label outlines</label><label><span>Preferred text size</span><select id="psBagTextSize"><option value="standard">Standard · 16 pt name / 12 pt details</option><option value="compact">Compact · 14 pt name / 11 pt details</option><option value="large">Large · 18 pt name / 14 pt details</option></select></label><p class="ps-hint">Long labels fit automatically. All wording and item numbers are kept.</p></details>
        <p id="psBagHelp" class="ps-hint">Preview the full sheet to check each label before printing.</p>
      </aside>
      <div id="psPrintPreview" class="ps-print-preview"><p class="ps-empty">Choose products, then select Preview layout.</p></div>
    </div>
    <p class="tp-print-note">Labels use Letter paper at 100% / actual size. Presentation cards are 6 inches wide × 4 inches tall. Check a plain-paper sheet before using label stock.</p>
  </form>
</dialog>`;
})();
