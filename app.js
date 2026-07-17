const columns = [
  "New Lead",
  "Need Action",
  "Samples Requested",
  "Ready to Show / Send Out",
  "Showed / Waiting on Feedback",
  "Follow Up",
  "Done"
];
const todoColumns = ["New", "In Progress", "Waiting on Someone", "Done"];
const priorities = { High: 3, Medium: 2, Low: 1 };
const storageKey = "broker-whiteboard-cards";
const todoStorageKey = "broker-whiteboard-todos";
const manualVendorStorageKey = "broker-whiteboard-manual-vendor-reports";
const addressBookStorageKey = "broker-whiteboard-address-book";
const stockStorageKey = "broker-whiteboard-stock-lists";
const sampleStorageKey = "broker-whiteboard-sample-tracker";
const dotOrderStorageKey = "broker-whiteboard-dot-orders";
const nestleMachineStorageKey = "broker-whiteboard-nestle-machines";
const marketVisitStorageKey = "broker-whiteboard-market-visits";
const stockFileDbName = "foodbrokerbase-stock-files";
const stockFileStoreName = "files";
const sampleStatuses = ["Requested", "Ordered", "Added to PO", "Received", "Delivered / Shown", "Cancelled"];
const dotOrderStatuses = ["Need to Order", "Ordered", "In Transit", "Received", "Delivered", "Cancelled"];
const nestleMachineStatuses = ["Requested", "Approved", "Ordered", "Installed", "Needs Service", "Returned", "Cancelled"];
const marketVisitTypes = { pc: "P. C. Market Visit", manufacturer: "Vendor Market Visit" };
const marketStatuses = ["Planned", "In Progress", "Completed", "Follow Up Needed"];
const stockListGroups = {
  usFoods: {
    label: "US Foods Stock List",
    distributors: ["US Foods Anchorage", "US Foods Southeast"],
    defaultDistributor: "US Foods Anchorage"
  },
  sysco: {
    label: "Sysco Stock List",
    distributors: ["Sysco"],
    defaultDistributor: "Sysco"
  },
  linford: {
    label: "Linford Stock List",
    distributors: ["Linford"],
    defaultDistributor: "Linford"
  }
};
const stockPrintColumns = [
  { key: "description", label: "Product Description" },
  { key: "brandName", label: "Brand Name" },
  { key: "brandType", label: "Brand Type" },
  { key: "apn", label: "US Foods #" },
  { key: "supc", label: "SUPC" },
  { key: "manufacturerNumber", label: "MF#" },
  { key: "gtin", label: "GTIN" },
  { key: "packaging", label: "Packaging" },
  { key: "storage", label: "Storage" },
  { key: "category", label: "Category" },
  { key: "so", label: "SO" }
];
const vendorLogoFiles = {
  ajinomoto: "vendor-logos/ajinomoto.png",
  aquastar: "vendor-logos/aquastar.webp",
  aquastarfoods: "vendor-logos/aquastar.webp",
  backpackyogurt: "vendor-logos/backpack-yogurt.png",
  bakerboy: "vendor-logos/baker-boy.png",
  brakebush: "vendor-logos/brakebush.png",
  campbell: "vendor-logos/campbells-foodservice.png",
  campbells: "vendor-logos/campbells-foodservice.png",
  campbellsfoodservice: "vendor-logos/campbells-foodservice.png",
  dakotagrowers: "vendor-logos/dakota-growers.png",
  dakotagrowerspasta: "vendor-logos/dakota-growers.png",
  delizza: "vendor-logos/delizza.png",
  delizzapatisserie: "vendor-logos/delizza.png",
  esfoods: "vendor-logos/es-foods.png",
  fosterfarms: "vendor-logos/foster-farms.png",
  generalmills: "vendor-logos/general-mills.webp",
  generalmillsfoodservice: "vendor-logos/general-mills.webp",
  graincraft: "vendor-logos/grain-craft.png",
  greciandelight: "vendor-logos/grecian-delight-kronos.png",
  greciandelightkronos: "vendor-logos/grecian-delight-kronos.png",
  idahoan: "vendor-logos/idahoan.png",
  kerry: "vendor-logos/kerry.png",
  kingscommand: "vendor-logos/kings-command.png",
  kingscommandfoods: "vendor-logos/kings-command.png",
  knouse: "vendor-logos/knouse-foods.png",
  knousefoods: "vendor-logos/knouse-foods.png",
  kronos: "vendor-logos/grecian-delight-kronos.png",
  michaelfoods: "vendor-logos/michael-foods.png",
  mountfranklin: "vendor-logos/mount-franklin-foods.png",
  mountfranklinfoods: "vendor-logos/mount-franklin-foods.png",
  nestle: "vendor-logos/nestle.png",
  nestleprofessional: "vendor-logos/nestle.png",
  pacificcoastproducers: "vendor-logos/pacific-coast-producers.png",
  piercecartwright: "vendor-logos/pierce-cartwright.png",
  saputo: "vendor-logos/saputo.png",
  schwans: "vendor-logos/cj-schwans.png",
  schwansfoodservice: "vendor-logos/cj-schwans.png",
  cjschwans: "vendor-logos/cj-schwans.png",
  cjschwansfoodservice: "vendor-logos/cj-schwans.png",
  simplot: "vendor-logos/simplot.png",
  smithfield: "vendor-logos/smithfield.png",
  soules: "vendor-logos/soules-foods.png",
  soulesfoods: "vendor-logos/soules-foods.png",
  johnsoules: "vendor-logos/soules-foods.png",
  johnsoulesfoods: "vendor-logos/soules-foods.png",
  superbakery: "vendor-logos/super-bakery.png",
  thecheesecakefactory: "vendor-logos/the-cheesecake-factory.png",
  cheesecakefactory: "vendor-logos/the-cheesecake-factory.png",
  trident: "vendor-logos/trident-seafoods.png",
  tridentseafoods: "vendor-logos/trident-seafoods.png",
  ventura: "vendor-logos/ventura-foods.jpg",
  venturafoods: "vendor-logos/ventura-foods.jpg",
  westminsterbakers: "vendor-logos/westminster-bakers.png",
  westminsterbakersco: "vendor-logos/westminster-bakers.png",
  westminster: "vendor-logos/westminster-bakers.png",
  wheatmontana: "vendor-logos/wheat-montana.png"
};
const vendorNameRenames = {
  johnsoules: "Soules Foods",
  johnsoulesfood: "Soules Foods",
  johnsoulesfoods: "Soules Foods"
};
const stockCategoryRenames = {
  beverage: "Beverage",
  beverages: "Beverage",
  dessert: "Dessert",
  desserts: "Dessert",
  dairy: "Dairy and Eggs",
  dairyeggs: "Dairy and Eggs",
  dairyandeggs: "Dairy and Eggs"
};
const stockDefaultCategories = [
  "Soup",
  "Appetizer",
  "Chicken",
  "Meat",
  "Seafood",
  "Beverage",
  "Baking",
  "Snacks",
  "Cereal",
  "Baked goods",
  "Dessert",
  "Sauces and Dressings",
  "Pasta",
  "Other",
  "School",
  "Mexican",
  "Asian",
  "Dairy and Eggs",
  "Potato",
  "Canned Veggies and Fruit",
  "Frozen Veggies and Fruit",
  "Pizza",
  "Breakfast Meats"
];
const resetFlagKey = "broker-whiteboard-cleared-2026-04-29";
const backupVersion = 1;
const icons = {
  archive:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5h7l2 2h9v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z"/><path d="M3 7.5V5a2 2 0 0 1 2-2h4.5l2 2H19a2 2 0 0 1 2 2v2.5"/></svg>',
  edit:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'
};
const closedStatus = "Done";
const statusMap = {
  New: "New Lead",
  "Follow Up": "Follow Up",
  Waiting: "Showed / Waiting on Feedback",
  Samples: "Samples Requested",
  Done: closedStatus,
  Lost: closedStatus,
  "Closed: Won / Lost": closedStatus
};

const sampleCards = [];
const cloudRecordType = "app_section";
let cloudSyncReady = false;
let cloudSyncLoading = false;
let cloudSyncUserId = "";
let cloudSaveTimer = null;
let pendingCloudSections = new Set();
let lastCloudError = "";

const cloudSectionConfigs = [
  { key: storageKey, label: "Leads", get: () => cards, set: (value) => (cards = Array.isArray(value) ? value.map(normalizeCard) : []) },
  { key: todoStorageKey, label: "To-Do List", get: () => todos, set: (value) => (todos = Array.isArray(value) ? value.map(normalizeTodo) : []) },
  {
    key: manualVendorStorageKey,
    label: "Vendor Reporting",
    get: () => manualVendorReports,
    set: (value) => (manualVendorReports = Array.isArray(value) ? value.map(normalizeManualVendorReport) : [])
  },
  {
    key: addressBookStorageKey,
    label: "Address Book",
    get: () => addressBook,
    set: (value) => (addressBook = Array.isArray(value) ? value.map(normalizeAddressBookEntry) : [])
  },
  {
    key: stockStorageKey,
    label: "Stock Lists",
    get: () => stockProducts,
    set: (value) => (stockProducts = Array.isArray(value) ? value.map(normalizeStockProduct) : [])
  },
  { key: sampleStorageKey, label: "Samples", get: () => samples, set: (value) => (samples = Array.isArray(value) ? value.map(normalizeSample) : []) },
  { key: dotOrderStorageKey, label: "DOT Orders", get: () => dotOrders, set: (value) => (dotOrders = Array.isArray(value) ? value.map(normalizeDotOrder) : []) },
  {
    key: nestleMachineStorageKey,
    label: "Nestle Machines",
    get: () => nestleMachines,
    set: (value) => (nestleMachines = Array.isArray(value) ? value.map(normalizeNestleMachine) : [])
  },
  {
    key: marketVisitStorageKey,
    label: "Market Visits",
    get: () => marketVisits,
    set: (value) => (marketVisits = Array.isArray(value) ? value.map(normalizeMarketVisit) : [])
  }
];

if (!localStorage.getItem(resetFlagKey)) {
  localStorage.removeItem(storageKey);
  localStorage.setItem(resetFlagKey, "true");
}

let cards = loadCards();
let todos = loadTodos();
let manualVendorReports = loadManualVendorReports();
let addressBook = loadAddressBook();
let stockProducts = loadStockProducts();
migrateStockProductData();
let samples = loadSamples();
let dotOrders = loadDotOrders();
let nestleMachines = loadNestleMachines();
let marketVisits = loadMarketVisits();
let draggedId = null;
let draggedTodoId = null;
let leadQuickListMode = false;
let todoQuickListMode = false;
let activeLeadQuickFilter = "";
let activeTodoQuickFilter = "";
let activeSampleQuickFilter = "";
let activeTrackerTab = "samples";
let activeDotQuickFilter = "";
let activeNestleQuickFilter = "";
let activeMarketType = "pc";
let activeMarketView = "list";
let activeMarketDetailId = "";
let pcMarketNumberMode = "apn";
let activeStockList = "";
let calendarMonth = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
let calendarView = "month";
let calendarRangeStart = startOfCalendarWeek(startOfToday());
let activeCalendarControl = "calendarThisMonth";
let datePickerInput = null;
let datePickerMonth = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
let currentAttachments = [];
let currentLeadNoteHistory = [];
let currentStockAttachments = [];
let currentSampleAttachments = [];
let currentDotAttachments = [];

const elements = {
  board: document.querySelector("#board"),
  dialog: document.querySelector("#noteDialog"),
  accountDialog: document.querySelector("#accountDialog"),
  archiveDialog: document.querySelector("#archiveDialog"),
  trashDialog: document.querySelector("#trashDialog"),
  calendarDialog: document.querySelector("#calendarDialog"),
  calendarDayDialog: document.querySelector("#calendarDayDialog"),
  attachmentDialog: document.querySelector("#attachmentDialog"),
  form: document.querySelector("#noteForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  accountDialogTitle: document.querySelector("#accountDialogTitle"),
  accountDialogSubtitle: document.querySelector("#accountDialogSubtitle"),
  accountNotes: document.querySelector("#accountNotes"),
  archiveSearch: document.querySelector("#archiveSearch"),
  archiveList: document.querySelector("#archiveList"),
  trashSearch: document.querySelector("#trashSearch"),
  trashList: document.querySelector("#trashList"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarDayTitle: document.querySelector("#calendarDayTitle"),
  calendarDayList: document.querySelector("#calendarDayList"),
  attachmentTitle: document.querySelector("#attachmentTitle"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  timelineSearches: [...document.querySelectorAll(".timeline-search-input")],
  openTimelineSearchButtons: [...document.querySelectorAll(".timeline-search-action")],
  timelineSearchSuggestions: document.querySelector("#timelineSearchSuggestions"),
  timelineDialog: document.querySelector("#timelineDialog"),
  timelineDialogSearch: document.querySelector("#timelineDialogSearchInput"),
  timelineSummary: document.querySelector("#timelineSummary"),
  timelineResults: document.querySelector("#timelineResults"),
  clearTimelineSearch: document.querySelector("#clearTimelineSearch"),
  cardId: document.querySelector("#cardId"),
  account: document.querySelector("#accountInput"),
  accountSuggestions: document.querySelector("#accountSuggestions"),
  vendorSuggestions: document.querySelector("#vendorSuggestions"),
  apnSuggestions: document.querySelector("#apnSuggestions"),
  productSearchSuggestions: document.querySelector("#productSearchSuggestions"),
  salesRepSuggestions: document.querySelector("#salesRepSuggestions"),
  accountNumber: document.querySelector("#accountNumberInput"),
  syscoAccountNumber: document.querySelector("#syscoAccountNumberInput"),
  leadDistributor: document.querySelector("#leadDistributorInput"),
  note: document.querySelector("#noteInput"),
  leadNoteHistory: document.querySelector("#leadNoteHistory"),
  saveLeadNoteEntry: document.querySelector("#saveLeadNoteEntry"),
  priority: document.querySelector("#priorityInput"),
  due: document.querySelector("#dueInput"),
  status: document.querySelector("#statusInput"),
  source: document.querySelector("#sourceInput"),
  salesRep: document.querySelector("#salesRepInput"),
  syscoSalesRep: document.querySelector("#syscoSalesRepInput"),
  productList: document.querySelector("#productList"),
  productSearch: document.querySelector("#productSearchInput"),
  addProduct: document.querySelector("#addProduct"),
  addProductFromSearch: document.querySelector("#addProductFromSearch"),
  attachmentInput: document.querySelector("#attachmentInput"),
  attachmentList: document.querySelector("#attachmentList"),
  addAttachment: document.querySelector("#addAttachment"),
  attachmentPasteTarget: document.querySelector("#attachmentPasteTarget"),
  search: document.querySelector("#searchInput"),
  vendorFilter: document.querySelector("#vendorFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  dueFilter: document.querySelector("#dueFilter"),
  sourceFilter: document.querySelector("#sourceFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  sort: document.querySelector("#sortSelect"),
  deleteCard: document.querySelector("#deleteCard"),
  archiveCard: document.querySelector("#archiveCard"),
  printLead: document.querySelector("#printLead"),
  printProducts: document.querySelector("#printProducts"),
  openArchive: document.querySelector("#openArchive"),
  openTrash: document.querySelector("#openTrash"),
  openCalendar: document.querySelector("#openCalendar"),
  openTodo: document.querySelector("#openTodo"),
  openVendorReport: document.querySelector("#openVendorReport"),
  openAddressBook: document.querySelector("#openAddressBook"),
  openStockLists: document.querySelector("#openStockLists"),
  openSampleTracker: document.querySelector("#openSampleTracker"),
  openMarketVisits: document.querySelector("#openMarketVisits"),
  marketVisitsDialog: document.querySelector("#marketVisitsDialog"),
  marketContent: document.querySelector("#marketContent"),
  marketSearch: document.querySelector("#marketSearch"),
  marketManufacturerFilter: document.querySelector("#marketManufacturerFilter"),
  marketRepFilter: document.querySelector("#marketRepFilter"),
  marketStatusFilter: document.querySelector("#marketStatusFilter"),
  marketDateFilter: document.querySelector("#marketDateFilter"),
  marketVisitFormDialog: document.querySelector("#marketVisitFormDialog"),
  marketVisitForm: document.querySelector("#marketVisitForm"),
  marketVisitFormTitle: document.querySelector("#marketVisitFormTitle"),
  marketVisitId: document.querySelector("#marketVisitId"),
  marketVisitType: document.querySelector("#marketVisitType"),
  marketVisitName: document.querySelector("#marketVisitName"),
  marketVisitVendor: document.querySelector("#marketVisitVendor"),
  marketVisitorName: document.querySelector("#marketVisitorName"),
  marketStartDate: document.querySelector("#marketStartDate"),
  marketEndDate: document.querySelector("#marketEndDate"),
  marketStartTime: document.querySelector("#marketStartTime"),
  marketEndTime: document.querySelector("#marketEndTime"),
  marketLocation: document.querySelector("#marketLocation"),
  marketSalesReps: document.querySelector("#marketSalesReps"),
  marketStatus: document.querySelector("#marketStatus"),
  marketNotes: document.querySelector("#marketNotes"),
  deleteMarketVisit: document.querySelector("#deleteMarketVisit"),
  marketPrintDialog: document.querySelector("#marketPrintDialog"),
  marketPrintForm: document.querySelector("#marketPrintForm"),
  marketPrintVisitId: document.querySelector("#marketPrintVisitId"),
  marketPrintSchedule: document.querySelector("#marketPrintSchedule"),
  marketPrintProducts: document.querySelector("#marketPrintProducts"),
  sampleTrackerDialog: document.querySelector("#sampleTrackerDialog"),
  sampleTable: document.querySelector("#sampleTable"),
  sampleCount: document.querySelector("#sampleCount"),
  sampleSearch: document.querySelector("#sampleSearch"),
  sampleDateFilter: document.querySelector("#sampleDateFilter"),
  sampleStatusFilter: document.querySelector("#sampleStatusFilter"),
  sampleFormDialog: document.querySelector("#sampleFormDialog"),
  sampleForm: document.querySelector("#sampleForm"),
  sampleFormTitle: document.querySelector("#sampleFormTitle"),
  sampleId: document.querySelector("#sampleId"),
  sampleProduct: document.querySelector("#sampleProduct"),
  sampleOrderedBy: document.querySelector("#sampleOrderedBy"),
  sampleExpected: document.querySelector("#sampleExpected"),
  sampleOrderType: document.querySelector("#sampleOrderType"),
  sampleStatus: document.querySelector("#sampleStatus"),
  sampleRequestedFor: document.querySelector("#sampleRequestedFor"),
  sampleNote: document.querySelector("#sampleNote"),
  sampleAttachmentInput: document.querySelector("#sampleAttachmentInput"),
  sampleAttachmentList: document.querySelector("#sampleAttachmentList"),
  sampleAttachmentPasteTarget: document.querySelector("#sampleAttachmentPasteTarget"),
  addSampleAttachment: document.querySelector("#addSampleAttachment"),
  deleteSample: document.querySelector("#deleteSample"),
  trackerTabs: [...document.querySelectorAll("[data-tracker-tab]")],
  trackerPanels: [...document.querySelectorAll("[data-tracker-panel]")],
  dotTable: document.querySelector("#dotTable"),
  dotCount: document.querySelector("#dotCount"),
  dotSearch: document.querySelector("#dotSearch"),
  dotDateFilter: document.querySelector("#dotDateFilter"),
  dotStatusFilter: document.querySelector("#dotStatusFilter"),
  dotFormDialog: document.querySelector("#dotFormDialog"),
  dotForm: document.querySelector("#dotForm"),
  dotFormTitle: document.querySelector("#dotFormTitle"),
  dotId: document.querySelector("#dotId"),
  dotProduct: document.querySelector("#dotProduct"),
  dotOrderedDate: document.querySelector("#dotOrderedDate"),
  dotPo: document.querySelector("#dotPo"),
  dotOrderedBy: document.querySelector("#dotOrderedBy"),
  dotExpected: document.querySelector("#dotExpected"),
  dotStorageType: document.querySelector("#dotStorageType"),
  dotStatus: document.querySelector("#dotStatus"),
  dotRequestedFor: document.querySelector("#dotRequestedFor"),
  dotNote: document.querySelector("#dotNote"),
  dotAttachmentInput: document.querySelector("#dotAttachmentInput"),
  dotAttachmentList: document.querySelector("#dotAttachmentList"),
  dotAttachmentPasteTarget: document.querySelector("#dotAttachmentPasteTarget"),
  addDotAttachment: document.querySelector("#addDotAttachment"),
  deleteDotOrder: document.querySelector("#deleteDotOrder"),
  nestleTable: document.querySelector("#nestleTable"),
  nestleCount: document.querySelector("#nestleCount"),
  nestleSearch: document.querySelector("#nestleSearch"),
  nestleDateFilter: document.querySelector("#nestleDateFilter"),
  nestleStatusFilter: document.querySelector("#nestleStatusFilter"),
  nestleFormDialog: document.querySelector("#nestleFormDialog"),
  nestleForm: document.querySelector("#nestleForm"),
  nestleFormTitle: document.querySelector("#nestleFormTitle"),
  nestleId: document.querySelector("#nestleId"),
  nestleMachine: document.querySelector("#nestleMachine"),
  nestleAccount: document.querySelector("#nestleAccount"),
  nestleLocation: document.querySelector("#nestleLocation"),
  nestleContact: document.querySelector("#nestleContact"),
  nestleSerial: document.querySelector("#nestleSerial"),
  nestleExpected: document.querySelector("#nestleExpected"),
  nestleStatus: document.querySelector("#nestleStatus"),
  nestleSalesRep: document.querySelector("#nestleSalesRep"),
  nestleNote: document.querySelector("#nestleNote"),
  deleteNestleMachine: document.querySelector("#deleteNestleMachine"),
  vendorReportDialog: document.querySelector("#vendorReportDialog"),
  vendorReportVendorFilter: document.querySelector("#vendorReportVendorFilter"),
  vendorReportMonthFilter: document.querySelector("#vendorReportMonthFilter"),
  vendorReportSubmittedFilter: document.querySelector("#vendorReportSubmittedFilter"),
  vendorReportTable: document.querySelector("#vendorReportTable"),
  vendorReportCount: document.querySelector("#vendorReportCount"),
  addManualVendorReport: document.querySelector("#addManualVendorReport"),
  manualVendorDialog: document.querySelector("#manualVendorDialog"),
  manualVendorForm: document.querySelector("#manualVendorForm"),
  manualVendorId: document.querySelector("#manualVendorId"),
  manualVendorAccount: document.querySelector("#manualVendorAccount"),
  manualVendorVendor: document.querySelector("#manualVendorVendor"),
  manualVendorProduct: document.querySelector("#manualVendorProduct"),
  manualVendorOpportunity: document.querySelector("#manualVendorOpportunity"),
  manualVendorOutcome: document.querySelector("#manualVendorOutcome"),
  manualVendorSubmittedDate: document.querySelector("#manualVendorSubmittedDate"),
  addressBookDialog: document.querySelector("#addressBookDialog"),
  addressBookSearch: document.querySelector("#addressBookSearch"),
  addressBookTable: document.querySelector("#addressBookTable"),
  addressBookCount: document.querySelector("#addressBookCount"),
  addAddressEntry: document.querySelector("#addAddressEntry"),
  addressBookFormDialog: document.querySelector("#addressBookFormDialog"),
  addressBookForm: document.querySelector("#addressBookForm"),
  addressBookFormTitle: document.querySelector("#addressBookFormTitle"),
  addressBookId: document.querySelector("#addressBookId"),
  addressOperation: document.querySelector("#addressOperation"),
  addressAccountNumber: document.querySelector("#addressAccountNumber"),
  addressSyscoAccountNumber: document.querySelector("#addressSyscoAccountNumber"),
  addressLocations: document.querySelector("#addressLocations"),
  addressWebsite: document.querySelector("#addressWebsite"),
  addressUsfSalesRep: document.querySelector("#addressUsfSalesRep"),
  addressSyscoSalesRep: document.querySelector("#addressSyscoSalesRep"),
  addressLastUpdated: document.querySelector("#addressLastUpdated"),
  addressPrimaryName: document.querySelector("#addressPrimaryName"),
  addressPrimaryRole: document.querySelector("#addressPrimaryRole"),
  addressPrimaryEmail: document.querySelector("#addressPrimaryEmail"),
  addressPrimaryPhone: document.querySelector("#addressPrimaryPhone"),
  addressSecondaryName: document.querySelector("#addressSecondaryName"),
  addressSecondaryRole: document.querySelector("#addressSecondaryRole"),
  addressSecondaryEmail: document.querySelector("#addressSecondaryEmail"),
  addressSecondaryPhone: document.querySelector("#addressSecondaryPhone"),
  addressStreet: document.querySelector("#addressStreet"),
  addressNotes: document.querySelector("#addressNotes"),
  addressContactList: document.querySelector("#addressContactList"),
  addAddressContact: document.querySelector("#addAddressContact"),
  openAddressMap: document.querySelector("#openAddressMap"),
  deleteAddressEntry: document.querySelector("#deleteAddressEntry"),
  stockListsDialog: document.querySelector("#stockListsDialog"),
  stockSearch: document.querySelector("#stockSearch"),
  stockDistributorFilter: document.querySelector("#stockDistributorFilter"),
  stockVendorFilter: document.querySelector("#stockVendorFilter"),
  stockCategoryFilter: document.querySelector("#stockCategoryFilter"),
  stockStorageFilter: document.querySelector("#stockStorageFilter"),
  stockBrandTypeFilter: document.querySelector("#stockBrandTypeFilter"),
  stockListPicker: document.querySelector("#stockListPicker"),
  stockListActions: document.querySelector("#stockListActions"),
  stockListTitle: document.querySelector("#stockListTitle"),
  stockCategorySuggestions: document.querySelector("#stockCategorySuggestions"),
  stockTable: document.querySelector("#stockTable"),
  stockCount: document.querySelector("#stockCount"),
  addStockProduct: document.querySelector("#addStockProduct"),
  importStockList: document.querySelector("#importStockList"),
  stockImportFile: document.querySelector("#stockImportFile"),
  printStockList: document.querySelector("#printStockList"),
  stockFormDialog: document.querySelector("#stockFormDialog"),
  stockForm: document.querySelector("#stockForm"),
  stockFormTitle: document.querySelector("#stockFormTitle"),
  stockId: document.querySelector("#stockId"),
  stockDistributor: document.querySelector("#stockDistributor"),
  stockDistributorNumber: document.querySelector("#stockDistributorNumber"),
  stockApn: document.querySelector("#stockApn"),
  stockSupc: document.querySelector("#stockSupc"),
  stockManufacturerNumber: document.querySelector("#stockManufacturerNumber"),
  stockGtin: document.querySelector("#stockGtin"),
  stockDescription: document.querySelector("#stockDescription"),
  stockPackaging: document.querySelector("#stockPackaging"),
  stockStorage: document.querySelector("#stockStorage"),
  stockSo: document.querySelector("#stockSo"),
  stockVendor: document.querySelector("#stockVendor"),
  stockBrandType: document.querySelector("#stockBrandType"),
  stockBrandName: document.querySelector("#stockBrandName"),
  stockCategory: document.querySelector("#stockCategory"),
  stockAttachmentCategory: document.querySelector("#stockAttachmentCategory"),
  addStockAttachment: document.querySelector("#addStockAttachment"),
  stockAttachmentInput: document.querySelector("#stockAttachmentInput"),
  stockAttachmentList: document.querySelector("#stockAttachmentList"),
  deleteStockProduct: document.querySelector("#deleteStockProduct"),
  stockImportDialog: document.querySelector("#stockImportDialog"),
  stockImportForm: document.querySelector("#stockImportForm"),
  stockImportDistributor: document.querySelector("#stockImportDistributor"),
  stockImportVendor: document.querySelector("#stockImportVendor"),
  stockImportCategory: document.querySelector("#stockImportCategory"),
  stockImportStorage: document.querySelector("#stockImportStorage"),
  stockPrintDialog: document.querySelector("#stockPrintDialog"),
  stockPrintForm: document.querySelector("#stockPrintForm"),
  stockPrintVendor: document.querySelector("#stockPrintVendor"),
  stockPrintLayout: document.querySelector("#stockPrintLayout"),
  stockPrintColumns: document.querySelector("#stockPrintColumns"),
  todoDialog: document.querySelector("#todoDialog"),
  todoBoard: document.querySelector("#todoBoard"),
  addTodo: document.querySelector("#addTodo"),
  todoSearch: document.querySelector("#todoSearch"),
  todoPriorityFilter: document.querySelector("#todoPriorityFilter"),
  todoDueFilter: document.querySelector("#todoDueFilter"),
  todoAssignedFilter: document.querySelector("#todoAssignedFilter"),
  todoStatusFilter: document.querySelector("#todoStatusFilter"),
  todoFormDialog: document.querySelector("#todoFormDialog"),
  todoForm: document.querySelector("#todoForm"),
  todoFormTitle: document.querySelector("#todoFormTitle"),
  todoId: document.querySelector("#todoId"),
  todoTitle: document.querySelector("#todoTitle"),
  todoPriority: document.querySelector("#todoPriority"),
  todoDue: document.querySelector("#todoDue"),
  todoAssignedBy: document.querySelector("#todoAssignedBy"),
  todoStatus: document.querySelector("#todoStatus"),
  todoAccount: document.querySelector("#todoAccount"),
  todoVendor: document.querySelector("#todoVendor"),
  todoNotes: document.querySelector("#todoNotes"),
  subtaskList: document.querySelector("#subtaskList"),
  addSubtask: document.querySelector("#addSubtask"),
  todoCreated: document.querySelector("#todoCreated"),
  todoCompleted: document.querySelector("#todoCompleted"),
  deleteTodo: document.querySelector("#deleteTodo"),
  convertTodoToLead: document.querySelector("#convertTodoToLead"),
  exportBackup: document.querySelector("#exportBackup"),
  importBackup: document.querySelector("#importBackup"),
  backupFile: document.querySelector("#backupFile"),
  weeklyRecapDialog: document.querySelector("#weeklyRecapDialog")
};

document.querySelector("#addNoteTop").addEventListener("click", () => openForm());
document.querySelector("#printWeeklyRecapTop").addEventListener("click", openWeeklyRecapDialog);
elements.saveLeadNoteEntry.addEventListener("click", saveLeadNoteEntry);
elements.note.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    saveLeadNoteEntry();
  }
});
document.querySelector("#closeWeeklyRecapDialog").addEventListener("click", closeWeeklyRecapDialog);
document.querySelector("#printSelectedWeeklyRecap").addEventListener("click", printSelectedWeeklyRecap);
document.querySelector("#closeDialog").addEventListener("click", closeForm);
document.querySelector("#closeAccountDialog").addEventListener("click", closeAccountWindow);
document.querySelector("#closeArchiveDialog").addEventListener("click", closeArchiveWindow);
document.querySelector("#closeTrashDialog").addEventListener("click", closeTrashWindow);
document.querySelector("#closeCalendarDialog").addEventListener("click", closeCalendarWindow);
document.querySelector("#closeCalendarDayDialog").addEventListener("click", closeCalendarDayWindow);
document.querySelector("#closeAttachmentDialog").addEventListener("click", closeAttachmentPreview);
document.querySelector("#closeTodoDialog").addEventListener("click", closeTodoWindow);
document.querySelector("#closeVendorReport").addEventListener("click", closeVendorReportWindow);
document.querySelector("#closeAddressBook").addEventListener("click", closeAddressBookWindow);
document.querySelector("#closeStockLists").addEventListener("click", closeStockListsWindow);
document.querySelector("#closeSampleTracker").addEventListener("click", closeSampleTrackerWindow);
document.querySelector("#closeMarketVisits").addEventListener("click", closeMarketVisitsWindow);
document.querySelector("#openCalendarTodo").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarVendor").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarAddress").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarStock").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarSample").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarMarket").addEventListener("click", openCalendarWindow);
document.querySelector("#openArchiveTodo").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveVendor").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveAddress").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveStock").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveSample").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveMarket").addEventListener("click", openArchiveWindow);
document.querySelector("#openTrashTodo").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashVendor").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashAddress").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashStock").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashSample").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashMarket").addEventListener("click", openTrashWindow);
document.querySelector("#exportBackupTodo").addEventListener("click", exportBackup);
document.querySelector("#exportBackupVendor").addEventListener("click", exportBackup);
document.querySelector("#exportBackupAddress").addEventListener("click", exportBackup);
document.querySelector("#exportBackupStock").addEventListener("click", exportBackup);
document.querySelector("#exportBackupSample").addEventListener("click", exportBackup);
document.querySelector("#exportBackupMarket").addEventListener("click", exportBackup);
document.querySelector("#importBackupTodo").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupVendor").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupAddress").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupStock").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupSample").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupMarket").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#openVendorReportTodo").addEventListener("click", openVendorReportWindow);
document.querySelector("#openTodoVendor").addEventListener("click", openTodoWindow);
document.querySelector("#openAddressBookTodo").addEventListener("click", openAddressBookWindow);
document.querySelector("#openAddressBookVendor").addEventListener("click", openAddressBookWindow);
document.querySelector("#openStockListsTodo").addEventListener("click", openStockListsWindow);
document.querySelector("#openStockListsVendor").addEventListener("click", openStockListsWindow);
document.querySelector("#openStockListsAddress").addEventListener("click", openStockListsWindow);
document.querySelector("#openSampleTrackerTodo").addEventListener("click", openSampleTrackerWindow);
document.querySelector("#openSampleTrackerVendor").addEventListener("click", openSampleTrackerWindow);
document.querySelector("#openSampleTrackerAddress").addEventListener("click", openSampleTrackerWindow);
document.querySelector("#openSampleTrackerStock").addEventListener("click", openSampleTrackerWindow);
document.querySelector("#openMarketVisitsTodo").addEventListener("click", openMarketVisitsWindow);
document.querySelector("#openMarketVisitsVendor").addEventListener("click", openMarketVisitsWindow);
document.querySelector("#openMarketVisitsAddress").addEventListener("click", openMarketVisitsWindow);
document.querySelector("#openMarketVisitsStock").addEventListener("click", openMarketVisitsWindow);
document.querySelector("#openMarketVisitsSample").addEventListener("click", openMarketVisitsWindow);
document.querySelector("#openTodoAddress").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportAddress").addEventListener("click", openVendorReportWindow);
document.querySelector("#openTodoStock").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportStock").addEventListener("click", openVendorReportWindow);
document.querySelector("#openAddressBookStock").addEventListener("click", openAddressBookWindow);
document.querySelector("#openTodoSample").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportSample").addEventListener("click", openVendorReportWindow);
document.querySelector("#openAddressBookSample").addEventListener("click", openAddressBookWindow);
document.querySelector("#openStockListsSample").addEventListener("click", openStockListsWindow);
document.querySelector("#openTodoMarket").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportMarket").addEventListener("click", openVendorReportWindow);
document.querySelector("#openAddressBookMarket").addEventListener("click", openAddressBookWindow);
document.querySelector("#openStockListsMarket").addEventListener("click", openStockListsWindow);
document.querySelector("#openSampleTrackerMarket").addEventListener("click", openSampleTrackerWindow);
document.querySelector("#clearVendorReportFilters").addEventListener("click", clearVendorReportFilters);
document.querySelector("#closeManualVendorForm").addEventListener("click", closeManualVendorForm);
document.querySelector("#cancelManualVendorForm").addEventListener("click", closeManualVendorForm);
document.querySelector("#closeAddressBookForm").addEventListener("click", closeAddressBookForm);
document.querySelector("#cancelAddressBookForm").addEventListener("click", closeAddressBookForm);
document.querySelector("#clearAddressBookSearch").addEventListener("click", clearAddressBookSearch);
document.querySelector("#closeStockForm").addEventListener("click", closeStockForm);
document.querySelector("#cancelStockForm").addEventListener("click", closeStockForm);
document.querySelector("#closeStockImport").addEventListener("click", closeStockImportDialog);
document.querySelector("#cancelStockImport").addEventListener("click", closeStockImportDialog);
document.querySelector("#closeStockPrint").addEventListener("click", closeStockPrintDialog);
document.querySelector("#cancelStockPrint").addEventListener("click", closeStockPrintDialog);
document.querySelector("#closeTodoForm").addEventListener("click", closeTodoForm);
document.querySelector("#cancelTodoForm").addEventListener("click", closeTodoForm);
document.querySelector("#closeSampleForm").addEventListener("click", closeSampleForm);
document.querySelector("#cancelSampleForm").addEventListener("click", closeSampleForm);
document.querySelector("#closeMarketVisitForm").addEventListener("click", closeMarketVisitForm);
document.querySelector("#cancelMarketVisitForm").addEventListener("click", closeMarketVisitForm);
document.querySelector("#clearTodoFilters").addEventListener("click", clearTodoFilters);
document.querySelector("#clearMarketFilters").addEventListener("click", clearMarketFilters);
document.querySelector("#calendarThisMonth").addEventListener("click", showThisCalendarMonth);
document.querySelector("#calendarNextMonth").addEventListener("click", showNextCalendarMonth);
document.querySelector("#calendarThisWeek").addEventListener("click", showThisCalendarWeek);
document.querySelector("#calendarNextWeek").addEventListener("click", showNextCalendarWeek);
document.querySelector("#calendarToday").addEventListener("click", showTodayInCalendar);
document.querySelector("#printCalendar").addEventListener("click", printCalendarView);
document.querySelector("#cancelForm").addEventListener("click", closeForm);
document.querySelector("#clearFilters").addEventListener("click", clearFilters);
setupDatePicker(elements.due);
setupDatePicker(elements.todoDue);
setupDatePicker(elements.sampleExpected);
setupDatePicker(elements.dotOrderedDate);
setupDatePicker(elements.dotExpected);
setupDatePicker(elements.nestleExpected);
setupDatePicker(elements.marketStartDate);
setupDatePicker(elements.marketEndDate);
elements.addProduct.addEventListener("click", () => addProductRow());
elements.addProductFromSearch.addEventListener("click", addProductFromSearch);
elements.productSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addProductFromSearch();
});
elements.leadDistributor.addEventListener("change", () => {
  updateProductNumberLabels();
  updateVendorControls();
  elements.productSearch.value = "";
});
elements.addAttachment.addEventListener("click", () => elements.attachmentInput.click());
elements.attachmentInput.addEventListener("change", handleAttachmentFiles);
elements.attachmentPasteTarget.addEventListener("paste", handleAttachmentPaste);
elements.account.addEventListener("input", fillAccountNumberFromName);
elements.account.addEventListener("change", () => normalizeAccountInputFromDirectory(elements.account));
elements.manualVendorAccount.addEventListener("change", () => normalizeAccountInputFromDirectory(elements.manualVendorAccount));
elements.exportBackup.addEventListener("click", exportBackup);
elements.importBackup.addEventListener("click", () => elements.backupFile.click());
elements.backupFile.addEventListener("change", importBackup);
elements.openArchive.addEventListener("click", openArchiveWindow);
elements.archiveSearch.addEventListener("input", renderArchive);
elements.openTrash.addEventListener("click", openTrashWindow);
elements.trashSearch.addEventListener("input", renderTrash);
elements.openCalendar.addEventListener("click", openCalendarWindow);
elements.openTodo.addEventListener("click", openTodoWindow);
elements.openVendorReport.addEventListener("click", openVendorReportWindow);
elements.openAddressBook.addEventListener("click", openAddressBookWindow);
elements.openStockLists.addEventListener("click", openStockListsWindow);
elements.openSampleTracker.addEventListener("click", openSampleTrackerWindow);
elements.openMarketVisits.addEventListener("click", openMarketVisitsWindow);
elements.openTimelineSearchButtons.forEach((button) => button.addEventListener("click", openTimelineSearchWindow));
elements.timelineSearches.forEach((input) => {
  input.addEventListener("input", () => syncTimelineSearchInputs(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    openTimelineSearchWindow();
  });
});
elements.timelineDialogSearch.addEventListener("input", () => {
  syncTimelineSearchInputs(elements.timelineDialogSearch.value);
  renderTimelineSearch();
});
elements.timelineDialog.querySelector(".timeline-form").addEventListener("submit", (event) => {
  event.preventDefault();
  renderTimelineSearch();
});
elements.clearTimelineSearch.addEventListener("click", () => {
  syncTimelineSearchInputs("");
  elements.timelineDialogSearch.value = "";
  renderTimelineSearch();
  elements.timelineDialogSearch.focus();
});
document.querySelector("#closeTimelineDialog").addEventListener("click", () => elements.timelineDialog.close());
document.addEventListener("mouseup", clearLeadDragState);
document.addEventListener("pointerup", clearLeadDragState);
document.addEventListener("dragend", clearLeadDragState);
document.addEventListener("drop", (event) => {
  if (!draggedId) return;
  event.preventDefault();
  clearLeadDragState();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") clearLeadDragState();
});
window.addEventListener("blur", clearLeadDragState);
document.addEventListener("visibilitychange", clearLeadDragState);
document.querySelectorAll("[data-market-type]").forEach((button) => {
  button.addEventListener("click", () => {
    activeMarketType = button.dataset.marketType;
    activeMarketDetailId = "";
    renderMarketVisits();
  });
});
document.querySelectorAll("[data-market-view]").forEach((button) => {
  button.addEventListener("click", () => {
    activeMarketView = button.dataset.marketView;
    renderMarketVisits();
  });
});
document.querySelector("#addPcMarketVisit").addEventListener("click", () => openMarketVisitForm(null, "pc"));
document.querySelector("#addManufacturerMarketVisit").addEventListener("click", () => openMarketVisitForm(null, "manufacturer"));
elements.marketVisitVendor.addEventListener("change", () => {
  if (!elements.marketVisitName.value && activeMarketType === "manufacturer") {
    elements.marketVisitName.value = `${elements.marketVisitVendor.value} Market Visit`.trim();
  }
});
elements.marketVisitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveMarketVisit();
});
elements.marketPrintForm.addEventListener("submit", (event) => {
  event.preventDefault();
  printMarketVisit(elements.marketPrintVisitId.value, {
    schedule: elements.marketPrintSchedule.checked,
    products: elements.marketPrintProducts.checked
  });
});
document.querySelector("#closeMarketPrint").addEventListener("click", closeMarketPrintOptions);
document.querySelector("#cancelMarketPrint").addEventListener("click", closeMarketPrintOptions);
elements.deleteMarketVisit.addEventListener("click", deleteCurrentMarketVisit);
[elements.marketSearch, elements.marketManufacturerFilter, elements.marketRepFilter, elements.marketStatusFilter, elements.marketDateFilter].forEach((control) => {
  control.addEventListener("input", renderMarketVisits);
  control.addEventListener("change", renderMarketVisits);
});
elements.addManualVendorReport.addEventListener("click", () => openManualVendorForm());
setupDatePicker(elements.manualVendorSubmittedDate);
elements.manualVendorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveManualVendorReport();
});
elements.addTodo.addEventListener("click", () => openTodoForm());
document.querySelector("#addSample").addEventListener("click", openActiveTrackerForm);
elements.addSampleAttachment.addEventListener("click", () => elements.sampleAttachmentInput.click());
elements.sampleAttachmentInput.addEventListener("change", handleSampleAttachmentFiles);
elements.sampleAttachmentPasteTarget.addEventListener("paste", handleSampleAttachmentPaste);
elements.deleteSample.addEventListener("click", deleteCurrentSample);
elements.sampleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSample();
});
elements.trackerTabs.forEach((button) => {
  button.addEventListener("click", () => setActiveTrackerTab(button.dataset.trackerTab));
});
document.querySelectorAll("[data-sample-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    activeSampleQuickFilter = button.dataset.sampleQuick;
    renderSamples();
  });
});
[elements.sampleSearch, elements.sampleDateFilter, elements.sampleStatusFilter].forEach((control) => {
  control.addEventListener("input", renderSamples);
  control.addEventListener("change", renderSamples);
});
document.querySelector("#clearSampleFilters").addEventListener("click", clearSampleFilters);
document.querySelectorAll("[data-dot-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    activeDotQuickFilter = button.dataset.dotQuick;
    renderDotOrders();
  });
});
[elements.dotSearch, elements.dotDateFilter, elements.dotStatusFilter].forEach((control) => {
  control.addEventListener("input", renderDotOrders);
  control.addEventListener("change", renderDotOrders);
});
document.querySelector("#clearDotFilters").addEventListener("click", clearDotFilters);
elements.addDotAttachment.addEventListener("click", () => elements.dotAttachmentInput.click());
elements.dotAttachmentInput.addEventListener("change", handleDotAttachmentFiles);
elements.dotAttachmentPasteTarget.addEventListener("paste", handleDotAttachmentPaste);
elements.dotForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveDotOrder();
});
document.querySelector("#closeDotForm").addEventListener("click", closeDotForm);
document.querySelector("#cancelDotForm").addEventListener("click", closeDotForm);
elements.deleteDotOrder.addEventListener("click", deleteCurrentDotOrder);
document.querySelectorAll("[data-nestle-quick]").forEach((button) => {
  button.addEventListener("click", () => {
    activeNestleQuickFilter = button.dataset.nestleQuick;
    renderNestleMachines();
  });
});
[elements.nestleSearch, elements.nestleDateFilter, elements.nestleStatusFilter].forEach((control) => {
  control.addEventListener("input", renderNestleMachines);
  control.addEventListener("change", renderNestleMachines);
});
document.querySelector("#clearNestleFilters").addEventListener("click", clearNestleFilters);
elements.nestleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveNestleMachine();
});
document.querySelector("#closeNestleForm").addEventListener("click", closeNestleForm);
document.querySelector("#cancelNestleForm").addEventListener("click", closeNestleForm);
elements.deleteNestleMachine.addEventListener("click", deleteCurrentNestleMachine);
elements.addAddressEntry.addEventListener("click", () => openAddressBookForm());
elements.addressBookSearch.addEventListener("input", renderAddressBook);
elements.addAddressContact.addEventListener("click", () => addAddressContactRow());
elements.openAddressMap.addEventListener("click", openCurrentAddressInMap);
elements.deleteAddressEntry.addEventListener("click", deleteCurrentAddressEntry);
elements.addressBookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveAddressBookEntry();
});
elements.addStockProduct.addEventListener("click", () => openStockForm());
elements.importStockList.addEventListener("click", openStockImportDialog);
elements.printStockList.addEventListener("click", openStockPrintDialog);
elements.addStockAttachment.addEventListener("click", () => elements.stockAttachmentInput.click());
elements.stockAttachmentInput.addEventListener("change", handleStockAttachmentFiles);
elements.stockListPicker.querySelectorAll("[data-stock-list]").forEach((button) => {
  button.addEventListener("click", () => selectStockList(button.dataset.stockList));
});
elements.stockImportForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.stockImportFile.click();
});
elements.stockImportFile.addEventListener("change", importStockFile);
elements.stockPrintForm.addEventListener("submit", (event) => {
  event.preventDefault();
  printSelectedStockList();
});
elements.deleteStockProduct.addEventListener("click", deleteCurrentStockProduct);
elements.stockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveStockProduct();
});
[
  elements.stockSearch,
  elements.stockDistributorFilter,
  elements.stockVendorFilter,
  elements.stockCategoryFilter,
  elements.stockStorageFilter,
  elements.stockBrandTypeFilter
].forEach((control) => {
  control.addEventListener("input", renderStockLists);
  control.addEventListener("change", renderStockLists);
});
document.querySelector("#clearStockFilters").addEventListener("click", clearStockFilters);
elements.addSubtask.addEventListener("click", () => addSubtaskRow(undefined, { focus: true }));
elements.deleteTodo.addEventListener("click", deleteCurrentTodo);
elements.convertTodoToLead.addEventListener("click", convertCurrentTodoToLead);
elements.todoAccount.addEventListener("change", () => {
  const match = getMatchedAccountDirectoryEntry(elements.todoAccount.value);
  if (match) elements.todoAccount.value = match.name;
});
elements.todoVendor.addEventListener("change", () => {
  const match = getMatchedVendorName(elements.todoVendor.value);
  if (match) elements.todoVendor.value = match;
});
elements.todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveTodo();
});
[
  elements.todoSearch,
  elements.todoPriorityFilter,
  elements.todoDueFilter,
  elements.todoAssignedFilter,
  elements.todoStatusFilter
].forEach((control) =>
  control.addEventListener("input", () => {
    todoQuickListMode = false;
    activeTodoQuickFilter = "";
    renderTodoBoard();
  })
);
document.querySelectorAll("[data-todo-quick]").forEach((button) => {
  button.addEventListener("click", () => applyTodoQuickFilter(button.dataset.todoQuick));
});
document.querySelectorAll(".summary-grid:not(.todo-summary-grid) .summary-tile").forEach((button) => {
  button.addEventListener("click", () => applyQuickFilter(button.dataset.quickFilter));
});

[
  elements.search,
  elements.vendorFilter,
  elements.priorityFilter,
  elements.dueFilter,
  elements.sourceFilter,
  elements.statusFilter,
  elements.sort
].forEach((control) =>
  control.addEventListener("input", () => {
    leadQuickListMode = false;
    activeLeadQuickFilter = "";
    render();
  })
);

[
  elements.vendorReportVendorFilter,
  elements.vendorReportMonthFilter,
  elements.vendorReportSubmittedFilter
].forEach((control) => control.addEventListener("input", renderVendorReport));

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCard();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-preview-attachment]");
  if (!button) return;
  event.preventDefault();
  previewAttachment(button.dataset.previewAttachment);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-print-id]");
  if (!button) return;
  event.preventDefault();
  const note = cards.find((item) => item.id === button.dataset.printId);
  if (note) openPrintWindow(renderLeadPrintDocument(note, "lead"));
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-print-products-id]");
  if (!button) return;
  event.preventDefault();
  const note = cards.find((item) => item.id === button.dataset.printProductsId);
  if (note) openPrintWindow(renderLeadPrintDocument(note, "products"));
});

document.addEventListener("paste", (event) => {
  if (!elements.dialog.open) return;
  handleAttachmentPaste(event);
});

elements.deleteCard.addEventListener("click", () => {
  const id = elements.cardId.value;
  if (!id) return;
  deleteCard(id);
  closeForm();
});

elements.archiveCard.addEventListener("click", () => {
  const id = elements.cardId.value;
  if (!id) return;
  archiveCard(id);
  closeForm();
});
elements.printLead.addEventListener("click", () => printCurrentLead("lead"));
elements.printProducts.addEventListener("click", () => printCurrentLead("products"));

render();

function loadCards() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return sampleCards;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCard) : sampleCards;
  } catch {
    return sampleCards;
  }
}

function loadTodos() {
  const raw = localStorage.getItem(todoStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeTodo) : [];
  } catch {
    return [];
  }
}

function loadManualVendorReports() {
  const raw = localStorage.getItem(manualVendorStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeManualVendorReport) : [];
  } catch {
    return [];
  }
}

function loadAddressBook() {
  const raw = localStorage.getItem(addressBookStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeAddressBookEntry) : [];
  } catch {
    return [];
  }
}

function loadStockProducts() {
  const raw = localStorage.getItem(stockStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeStockProduct) : [];
  } catch {
    return [];
  }
}

function loadSamples() {
  const raw = localStorage.getItem(sampleStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSample) : [];
  } catch {
    return [];
  }
}

function loadDotOrders() {
  const raw = localStorage.getItem(dotOrderStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeDotOrder) : [];
  } catch {
    return [];
  }
}

function loadNestleMachines() {
  const raw = localStorage.getItem(nestleMachineStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeNestleMachine) : [];
  } catch {
    return [];
  }
}

function loadMarketVisits() {
  const raw = localStorage.getItem(marketVisitStorageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeMarketVisit) : [];
  } catch {
    return [];
  }
}

function normalizeMarketVisit(visit) {
  const type = visit.type === "manufacturer" ? "manufacturer" : "pc";
  return {
    id: visit.id || crypto.randomUUID(),
    type,
    name: visit.name || (type === "manufacturer" ? `${visit.vendor || "Manufacturer"} Market Visit` : "Market Visit"),
    vendor: visit.vendor || "",
    visitorName: visit.visitorName || "",
    startDate: visit.startDate || visit.date || "",
    endDate: visit.endDate || visit.startDate || visit.date || "",
    startTime: visit.startTime || "",
    endTime: visit.endTime || "",
    location: visit.location || "",
    salesReps: normalizeStringList(visit.salesReps),
    notes: visit.notes || "",
    status: marketStatuses.includes(visit.status) ? visit.status : "Planned",
    productIds: Array.isArray(visit.productIds) ? visit.productIds : [],
    productNotes: visit.productNotes || {},
    operatorLinks: Array.isArray(visit.operatorLinks) ? visit.operatorLinks.map(normalizeMarketOperatorLink) : [],
    calls: Array.isArray(visit.calls) ? visit.calls.map(normalizeMarketCall) : [],
    createdAt: visit.createdAt || new Date().toISOString(),
    updatedAt: visit.updatedAt || ""
  };
}

function normalizeMarketOperatorLink(link) {
  return {
    id: link.id || crypto.randomUUID(),
    operatorId: link.operatorId || "",
    operatorName: link.operatorName || "",
    productIds: Array.isArray(link.productIds) ? link.productIds : [],
    notes: link.notes || "",
    productNotes: link.productNotes || {}
  };
}

function normalizeMarketCall(call) {
  return {
    id: call.id || crypto.randomUUID(),
    date: call.date || "",
    startTime: call.startTime || "",
    endTime: call.endTime || "",
    operatorId: call.operatorId || "",
    operatorName: call.operatorName || "",
    location: call.location || "",
    salesReps: normalizeStringList(call.salesReps),
    manufacturerContact: call.manufacturerContact || "",
    productIds: Array.isArray(call.productIds) ? call.productIds : [],
    notes: call.notes || "",
    status: call.status || "Planned"
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSample(sample) {
  return {
    id: sample.id || crypto.randomUUID(),
    product: sample.product || "",
    orderedBy: sample.orderedBy || "",
    expected: sample.expected || "",
    orderType: sample.orderType || "Direct from manufacturer",
    requestedFor: sample.requestedFor || "",
    status: sampleStatuses.includes(sample.status) ? sample.status : "Requested",
    note: sample.note || "",
    attachments: Array.isArray(sample.attachments) ? sample.attachments.map(normalizeAttachment).filter((file) => file.name && file.data) : [],
    createdAt: sample.createdAt || new Date().toISOString(),
    updatedAt: sample.updatedAt || "",
    archivedAt: sample.archivedAt || (sample.status === "Delivered / Shown" ? sample.updatedAt || new Date().toISOString() : "")
  };
}

function normalizeTodo(todo) {
  return {
    id: todo.id || crypto.randomUUID(),
    title: todo.title || "",
    priority: todo.priority || "Medium",
    due: todo.due || "",
    assignedBy: todo.assignedBy || "",
    account: todo.account || "",
    vendor: todo.vendor || "",
    notes: todo.notes || "",
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks.map((subtask) => ({
          id: subtask.id || crypto.randomUUID(),
          text: subtask.text || "",
          done: Boolean(subtask.done)
        }))
      : [],
    status: todoColumns.includes(todo.status) ? todo.status : "New",
    createdAt: todo.createdAt || new Date().toISOString(),
    completedAt: todo.completedAt || "",
    archivedAt: todo.archivedAt || ""
  };
}

function normalizeAddressBookEntry(entry) {
  return {
    id: entry.id || crypto.randomUUID(),
    operation: entry.operation || "",
    accountNumber: entry.accountNumber || "",
    syscoAccountNumber: entry.syscoAccountNumber || "",
    locations: entry.locations || "",
    deliveryDays: Array.isArray(entry.deliveryDays) ? entry.deliveryDays.filter(Boolean) : [],
    website: entry.website || "",
    usfSalesRep: entry.usfSalesRep || "",
    syscoSalesRep: entry.syscoSalesRep || "",
    primaryContact: {
      name: entry.primaryContact?.name || entry.primaryContact || "",
      role: entry.primaryContact?.role || "",
      email: entry.primaryContact?.email || entry.email || "",
      phone: entry.primaryContact?.phone || entry.phone || ""
    },
    secondaryContact: {
      name: entry.secondaryContact?.name || "",
      role: entry.secondaryContact?.role || "",
      email: entry.secondaryContact?.email || "",
      phone: entry.secondaryContact?.phone || ""
    },
    address: entry.address || "",
    notes: entry.notes || [entry.chef && `Chef: ${entry.chef}`, entry.owner && `Owner: ${entry.owner}`].filter(Boolean).join("\n"),
    contacts: Array.isArray(entry.contacts)
      ? entry.contacts.map((contact) => ({
          id: contact.id || crypto.randomUUID(),
          name: contact.name || "",
          role: contact.role || "",
          email: contact.email || "",
          phone: contact.phone || ""
        }))
      : [],
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || "",
    archivedAt: entry.archivedAt || ""
  };
}

function normalizeStockProduct(product) {
  const oldDistributorNumber = product.distributorNumber || "";
  const existingApn = product.apn || (/^US Foods/i.test(product.distributor || "") ? oldDistributorNumber : "");
  const existingSupc = product.supc || ((product.distributor || "") === "Sysco" ? oldDistributorNumber : "");
  return {
    id: product.id || crypto.randomUUID(),
    distributor: product.distributor || "US Foods Anchorage",
    distributorNumber: product.distributorNumber || existingApn || existingSupc || "",
    apn: existingApn,
    supc: existingSupc,
    manufacturerNumber: product.manufacturerNumber || "",
    gtin: product.gtin || "",
    description: product.description || "",
    packaging: product.packaging || "",
    storage: product.storage || "",
    vendor: normalizeVendorName(product.vendor),
    brandType: normalizeBrandType(product.brandType),
    brandName: normalizeVendorName(product.brandName),
    category: normalizeStockCategory(product.category),
    so: normalizeYes(product.so),
    attachments: Array.isArray(product.attachments) ? product.attachments.map(normalizeStockAttachment).filter((file) => file.name && (file.data || file.storageId)) : [],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || ""
  };
}

function normalizeStockAttachment(file) {
  return {
    ...normalizeAttachment(file),
    category: ["Specsheet", "Coupon", "POS", "Other"].includes(file.category) ? file.category : "Other"
  };
}

function normalizeManualVendorReport(report) {
  return {
    id: report.id || crypto.randomUUID(),
    account: report.account || "",
    vendor: report.vendor || "",
    productShown: report.productShown || "",
    opportunityNote: report.opportunityNote || "",
    outcome: report.outcome || "Unsure",
    submitted: Boolean(report.submitted),
    submittedDate: report.submittedDate || "",
    promotedCardId: report.promotedCardId || "",
    createdAt: report.createdAt || new Date().toISOString()
  };
}

function normalizeCard(card) {
  return {
    ...card,
    accountNumber: card.accountNumber || "",
    syscoAccountNumber: card.syscoAccountNumber || "",
    distributor: card.distributor || "US Foods",
    salesRep: card.salesRep || "",
    syscoSalesRep: card.syscoSalesRep || "",
    products: normalizeProducts(card),
    vendorReports: normalizeVendorReports(card.vendorReports),
    status: normalizeStatus(card.status),
    attachments: Array.isArray(card.attachments) ? card.attachments.map(normalizeAttachment).filter((file) => file.name && file.data) : [],
    archivedAt: card.archivedAt || "",
    archiveOutcome: card.archiveOutcome || "",
    deletedAt: card.deletedAt || ""
  };
}

function normalizeVendorReports(reports = {}) {
  return Object.fromEntries(
    Object.entries(reports || {}).map(([key, report]) => [
      key,
      {
        productShown: report.productShown || "",
        opportunityNote: report.opportunityNote || "",
        outcome: report.outcome || "Unsure",
        submitted: Boolean(report.submitted),
        submittedDate: report.submittedDate || "",
        submissionNote: report.submissionNote || ""
      }
    ])
  );
}

function normalizeAttachment(file) {
  return {
    id: file.id || crypto.randomUUID(),
    name: String(file.name || "Attachment").trim(),
    type: String(file.type || "application/octet-stream").trim(),
    size: Number(file.size) || 0,
    data: String(file.data || ""),
    storageId: String(file.storageId || ""),
    addedAt: file.addedAt || new Date().toISOString()
  };
}

function normalizeVendorName(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return vendorNameRenames[normalizeVendorLogoKey(text)] || text;
}

function normalizeStockCategory(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return stockCategoryRenames[normalizeVendorLogoKey(text)] || text;
}

function migrateStockProductData() {
  let changed = false;
  stockProducts = stockProducts.map((product) => {
    const vendor = normalizeVendorName(product.vendor);
    const brandName = normalizeVendorName(product.brandName);
    const category = normalizeStockCategory(product.category);
    const productChanged = vendor !== product.vendor || brandName !== product.brandName || category !== product.category;
    if (productChanged) changed = true;
    return productChanged
      ? { ...product, vendor, brandName, category, updatedAt: product.updatedAt || new Date().toISOString() }
      : product;
  });
  if (changed) persistStockProducts();
}

function normalizeDotProducts(order) {
  if (Array.isArray(order.products) && order.products.length) {
    return order.products
      .map((product) => ({
        text: String(product.text || product.product || product.description || "").trim()
      }))
      .filter((product) => product.text);
  }
  return String(order.product || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ text: line }));
}

function normalizeDotOrder(order) {
  const products = normalizeDotProducts(order);
  return {
    id: order.id || crypto.randomUUID(),
    product: products.map((product) => product.text).join("\n"),
    products,
    vendor: order.vendor || "",
    dotNumber: order.dotNumber || "",
    orderedDate: order.orderedDate || "",
    poNumber: order.poNumber || "",
    orderedBy: order.orderedBy || "",
    expected: order.expected || "",
    storageType: order.storageType || "",
    requestedFor: order.requestedFor || "",
    status: dotOrderStatuses.includes(order.status) ? order.status : "Need to Order",
    note: order.note || "",
    attachments: Array.isArray(order.attachments) ? order.attachments.map(normalizeAttachment) : [],
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || "",
    archivedAt: order.archivedAt || (["Delivered", "Cancelled"].includes(order.status) ? order.updatedAt || new Date().toISOString() : "")
  };
}

function normalizeNestleMachine(machine) {
  return {
    id: machine.id || crypto.randomUUID(),
    machine: machine.machine || "",
    account: machine.account || "",
    location: machine.location || "",
    contact: machine.contact || "",
    serial: machine.serial || "",
    expected: machine.expected || "",
    status: nestleMachineStatuses.includes(machine.status) ? machine.status : "Requested",
    salesRep: machine.salesRep || "",
    note: machine.note || "",
    createdAt: machine.createdAt || new Date().toISOString(),
    updatedAt: machine.updatedAt || "",
    archivedAt: machine.archivedAt || (["Installed", "Returned", "Cancelled"].includes(machine.status) ? machine.updatedAt || new Date().toISOString() : "")
  };
}

function normalizeStatus(status) {
  if (columns.includes(status)) return status;
  return statusMap[status] || "New Lead";
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cards));
    scheduleCloudSave(storageKey);
    return true;
  } catch (error) {
    alert("This browser could not save the board. One or more attachments may be too large for local storage.");
    console.error(error);
    return false;
  }
}

function persistTodos() {
  try {
    localStorage.setItem(todoStorageKey, JSON.stringify(todos));
    scheduleCloudSave(todoStorageKey);
    return true;
  } catch (error) {
    alert("This task could not save because the browser storage is full. Try exporting a backup, then removing a very large attachment or old file.");
    console.error(error);
    return false;
  }
}

function persistManualVendorReports() {
  localStorage.setItem(manualVendorStorageKey, JSON.stringify(manualVendorReports));
  scheduleCloudSave(manualVendorStorageKey);
}

function persistAddressBook() {
  localStorage.setItem(addressBookStorageKey, JSON.stringify(addressBook));
  scheduleCloudSave(addressBookStorageKey);
}

function persistStockProducts() {
  try {
    localStorage.setItem(stockStorageKey, JSON.stringify(stockProducts));
    scheduleCloudSave(stockStorageKey);
    return true;
  } catch (error) {
    alert("This product could not save because the browser storage is full. I kept the product window open. Try removing a very large attachment or export a backup before adding more files.");
    console.error(error);
    return false;
  }
}

function persistSamples() {
  localStorage.setItem(sampleStorageKey, JSON.stringify(samples));
  scheduleCloudSave(sampleStorageKey);
}

function persistDotOrders() {
  localStorage.setItem(dotOrderStorageKey, JSON.stringify(dotOrders));
  scheduleCloudSave(dotOrderStorageKey);
}

function persistNestleMachines() {
  localStorage.setItem(nestleMachineStorageKey, JSON.stringify(nestleMachines));
  scheduleCloudSave(nestleMachineStorageKey);
}

function persistMarketVisits() {
  localStorage.setItem(marketVisitStorageKey, JSON.stringify(marketVisits));
  scheduleCloudSave(marketVisitStorageKey);
}

function getCloudClient() {
  return window.foodBrokerBaseAuth?.client || null;
}

function getCloudUser() {
  return window.foodBrokerBaseAuth?.getCurrentUser?.() || null;
}

function getCloudConfig(sectionKey) {
  return cloudSectionConfigs.find((section) => section.key === sectionKey);
}

function extractCloudValue(row) {
  if (row?.data && Object.prototype.hasOwnProperty.call(row.data, "value")) return row.data.value;
  return row?.data;
}

function hasLocalAppData() {
  return cloudSectionConfigs.some((section) => {
    const value = section.get();
    return Array.isArray(value) && value.length > 0;
  });
}

function writeCloudSectionsToLocalStorage(sectionKeys = cloudSectionConfigs.map((section) => section.key)) {
  sectionKeys.forEach((sectionKey) => {
    const section = getCloudConfig(sectionKey);
    if (!section) return;
    try {
      localStorage.setItem(section.key, JSON.stringify(section.get()));
    } catch (error) {
      console.warn(`Could not refresh local cache for ${section.label}.`, error);
    }
  });
}

function renderAfterCloudSync() {
  render();
  renderTodoBoard();
  renderVendorReport();
  renderAddressBook();
  renderStockLists();
  renderSamples();
  renderDotOrders();
  renderNestleMachines();
  renderMarketVisits();
  renderCalendar();
  updateTimelineSearchSuggestions();
}

function scheduleCloudSave(sectionKey) {
  if (!cloudSyncReady || !getCloudClient() || !getCloudUser()) return;
  pendingCloudSections.add(sectionKey);
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => {
    pushPendingCloudSections();
  }, 900);
}

async function pushPendingCloudSections() {
  if (!pendingCloudSections.size) return;
  const sectionKeys = Array.from(pendingCloudSections);
  pendingCloudSections.clear();
  await saveCloudSections(sectionKeys);
}

async function saveCloudSections(sectionKeys = cloudSectionConfigs.map((section) => section.key), options = {}) {
  const client = getCloudClient();
  const user = getCloudUser();
  if (!client || !user || (!cloudSyncReady && !options.force)) return false;

  const now = new Date().toISOString();
  const payload = sectionKeys
    .map((sectionKey) => getCloudConfig(sectionKey))
    .filter(Boolean)
    .map((section) => ({
      record_type: cloudRecordType,
      record_key: section.key,
      owner_id: user.id,
      created_by: user.id,
      updated_by: user.id,
      data: {
        label: section.label,
        value: section.get(),
        backupVersion,
        savedAt: now
      }
    }));

  if (!payload.length) return true;

  try {
    const { error } = await client.from("app_records").upsert(payload, {
      onConflict: "owner_id,record_type,record_key"
    });
    if (error) throw error;
    lastCloudError = "";
    return true;
  } catch (error) {
    lastCloudError = error?.message || "Unknown cloud save error.";
    console.warn("FoodBrokerBase cloud save failed.", error);
    pendingCloudSections = new Set([...sectionKeys, ...pendingCloudSections]);
    return false;
  }
}

async function loadCloudSections() {
  const client = getCloudClient();
  const user = getCloudUser();
  if (!client || !user || cloudSyncLoading) return;

  cloudSyncLoading = true;
  cloudSyncReady = false;
  cloudSyncUserId = user.id;

  try {
    const { data, error } = await client
      .from("app_records")
      .select("record_key,data,updated_at")
      .eq("record_type", cloudRecordType)
      .eq("owner_id", user.id);

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    if (rows.length) {
      const rowMap = new Map(rows.map((row) => [row.record_key, row]));
      const appliedKeys = [];
      const localUploadKeys = [];
      cloudSectionConfigs.forEach((section) => {
        if (!rowMap.has(section.key)) {
          const localValue = section.get();
          if (Array.isArray(localValue) && localValue.length) localUploadKeys.push(section.key);
          return;
        }
        const cloudValue = extractCloudValue(rowMap.get(section.key));
        const localValue = section.get();
        if (Array.isArray(localValue) && localValue.length && Array.isArray(cloudValue) && !cloudValue.length) {
          localUploadKeys.push(section.key);
          return;
        }
        section.set(cloudValue);
        appliedKeys.push(section.key);
      });
      writeCloudSectionsToLocalStorage(appliedKeys);
      renderAfterCloudSync();
      if (localUploadKeys.length) await saveCloudSections(localUploadKeys, { force: true });
    }

    cloudSyncReady = true;
    if (!rows.length && hasLocalAppData()) {
      await saveCloudSections(undefined, { force: true });
    }
  } catch (error) {
    console.warn("FoodBrokerBase cloud load failed.", error);
  } finally {
    cloudSyncLoading = false;
  }
}

function handleCloudAuthChange(event) {
  const user = event.detail?.user || getCloudUser();
  if (!user) {
    cloudSyncReady = false;
    cloudSyncUserId = "";
    pendingCloudSections.clear();
    return;
  }
  if (cloudSyncLoading && cloudSyncUserId === user.id) return;
  loadCloudSections();
}

window.addEventListener("foodbrokerbase:auth", handleCloudAuthChange);
window.setTimeout(() => {
  if (getCloudUser()) loadCloudSections();
}, 0);
window.foodBrokerBaseCloud = {
  pull: loadCloudSections,
  pushAll: () => syncLocalDataToCloud({ silent: true }),
  isReady: () => cloudSyncReady,
  syncNow: syncLocalDataToCloud
};

function setCloudSyncButtonsBusy(isBusy) {
  document.querySelectorAll("[data-cloud-sync-action]").forEach((button) => {
    button.disabled = isBusy;
    button.textContent = isBusy ? "Uploading..." : "Upload This Browser to Cloud";
  });
}

async function syncLocalDataToCloud(options = {}) {
  const client = getCloudClient();
  const user = getCloudUser();
  if (!client) {
    if (!options.silent) alert("Cloud sync did not load. Check your internet connection, refresh the page, and try again.");
    return false;
  }
  if (!user) {
    if (!options.silent) {
      alert("Please sign in first. Then open Settings and click Upload This Browser to Cloud again.");
      window.foodBrokerBaseAuth?.openDialog?.();
    }
    return false;
  }

  setCloudSyncButtonsBusy(true);
  const uploaded = await saveCloudSections(undefined, { force: true });
  setCloudSyncButtonsBusy(false);

  if (!options.silent) {
    if (uploaded) {
      alert("Uploaded this browser's FoodBrokerBase data to Supabase. Now sign in on your phone or another browser and the same data should load there.");
    } else {
      alert(`This browser still has the data, but Supabase did not save it yet. ${lastCloudError || "Please try again."}`);
    }
  }

  return uploaded;
}

function setupCloudSyncButtons() {
  document.querySelectorAll(".settings-panel").forEach((panel) => {
    if (panel.querySelector("[data-cloud-sync-action]")) return;
    const button = document.createElement("button");
    button.className = "ghost-action cloud-sync-action";
    button.type = "button";
    button.dataset.cloudSyncAction = "upload";
    button.textContent = "Upload This Browser to Cloud";
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const uploaded = await syncLocalDataToCloud();
      if (uploaded) panel.closest("details")?.removeAttribute("open");
    });
    panel.appendChild(button);
  });
}

setupCloudSyncButtons();

function openStockFileDb() {
  if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB is not available."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(stockFileDbName, 1);
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(stockFileStoreName)) {
        db.createObjectStore(stockFileStoreName, { keyPath: "id" });
      }
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function saveStockFileData(id, data) {
  const db = await openStockFileDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stockFileStoreName, "readwrite");
    transaction.objectStore(stockFileStoreName).put({ id, data, savedAt: new Date().toISOString() });
    transaction.addEventListener("complete", () => {
      db.close();
      resolve();
    });
    transaction.addEventListener("error", () => {
      db.close();
      reject(transaction.error);
    });
  });
}

async function loadStockFileData(id) {
  const db = await openStockFileDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stockFileStoreName, "readonly");
    const request = transaction.objectStore(stockFileStoreName).get(id);
    request.addEventListener("success", () => resolve(request.result?.data || ""));
    request.addEventListener("error", () => reject(request.error));
    transaction.addEventListener("complete", () => db.close());
    transaction.addEventListener("error", () => db.close());
  });
}

async function removeStockFileData(id) {
  if (!id) return;
  try {
    const db = await openStockFileDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(stockFileStoreName, "readwrite");
      transaction.objectStore(stockFileStoreName).delete(id);
      transaction.addEventListener("complete", () => {
        db.close();
        resolve();
      });
      transaction.addEventListener("error", () => {
        db.close();
        reject(transaction.error);
      });
    });
  } catch {
    // If the browser cannot remove it, the product record still stops referencing it.
  }
}

function exportBackup() {
  const date = new Date().toISOString().slice(0, 10);
  const backup = {
    app: "Broker Whiteboard",
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    cards,
    todos,
    manualVendorReports,
    addressBook,
    stockProducts,
    samples,
    dotOrders,
    nestleMachines,
    marketVisits
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `broker-whiteboard-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const importedCards = Array.isArray(parsed) ? parsed : parsed.cards;
      if (!Array.isArray(importedCards)) {
        throw new Error("Backup file does not contain cards.");
      }
      const shouldImport = confirm("Import this backup? This will replace the current board in this browser.");
      if (!shouldImport) return;
      cards = importedCards.map(normalizeCard);
      todos = Array.isArray(parsed.todos) ? parsed.todos.map(normalizeTodo) : todos;
      manualVendorReports = Array.isArray(parsed.manualVendorReports) ? parsed.manualVendorReports.map(normalizeManualVendorReport) : [];
      addressBook = Array.isArray(parsed.addressBook) ? parsed.addressBook.map(normalizeAddressBookEntry) : [];
      stockProducts = Array.isArray(parsed.stockProducts) ? parsed.stockProducts.map(normalizeStockProduct) : [];
      samples = Array.isArray(parsed.samples) ? parsed.samples.map(normalizeSample) : [];
      dotOrders = Array.isArray(parsed.dotOrders) ? parsed.dotOrders.map(normalizeDotOrder) : [];
      nestleMachines = Array.isArray(parsed.nestleMachines) ? parsed.nestleMachines.map(normalizeNestleMachine) : [];
      marketVisits = Array.isArray(parsed.marketVisits) ? parsed.marketVisits.map(normalizeMarketVisit) : [];
      persist();
      persistTodos();
      persistManualVendorReports();
      persistAddressBook();
      persistStockProducts();
      persistSamples();
      persistDotOrders();
      persistNestleMachines();
      persistMarketVisits();
      clearFilters(false);
      render();
      if (getCloudClient() && getCloudUser()) {
        const uploaded = await syncLocalDataToCloud({ silent: true });
        alert(
          uploaded
            ? "Backup imported and uploaded to Supabase."
            : `Backup imported into this browser, but Supabase did not save it yet. ${lastCloudError || "Open Settings and try Upload This Browser to Cloud."}`
        );
      } else {
        alert("Backup imported into this browser. Sign in, then open Settings and click Upload This Browser to Cloud so your phone and other browsers can see it.");
      }
    } catch {
      alert("That file does not look like a Broker Whiteboard backup.");
    } finally {
      elements.backupFile.value = "";
    }
  });
  reader.readAsText(file);
}

function render() {
  clearLeadDragState();
  updateSummary();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  updateVendorControls();
  updateTimelineSearchSuggestions();
  if (elements.vendorReportDialog.open || !elements.vendorReportDialog.hidden) renderVendorReport();
  const visibleCards = getVisibleCards();
  elements.board.innerHTML = "";
  setActiveLeadQuickTile();

  if (leadQuickListMode) {
    renderLeadQuickList(visibleCards);
    return;
  }

  elements.board.className = "board";

  columns.forEach((status) => {
    const columnCards = visibleCards.filter((card) => normalizeStatus(card.status) === status);
    const column = document.createElement("section");
    column.className = "column";
    column.dataset.status = status;
    column.innerHTML = `
      <div class="column-header">
        <h2>${status}</h2>
        <span class="count-pill">${columnCards.length}</span>
      </div>
      <div class="card-list"></div>
    `;

    column.addEventListener("dragover", onDragOver);
    column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
    column.addEventListener("drop", onDrop);

    const list = column.querySelector(".card-list");
    if (columnCards.length === 0) {
      list.innerHTML = `<div class="empty-state">Drop a note here</div>`;
    } else {
      columnCards.forEach((card) => list.appendChild(createCard(card)));
    }

    elements.board.appendChild(column);
  });
}

function renderLeadQuickList(visibleCards) {
  elements.board.className = "board quick-list-board";
  const panel = document.createElement("section");
  panel.className = "quick-list-panel lead-quick-list-panel";
  panel.innerHTML = `
    <div class="quick-list-header">
      <div>
        <p class="eyebrow">Lead list</p>
        <h2>${escapeHtml(getLeadQuickFilterLabel(activeLeadQuickFilter))}</h2>
      </div>
      <div class="quick-list-actions">
        <button class="ghost-action print-action" type="button" data-print-lead-list>Print Lead List</button>
        <span class="count-pill">${visibleCards.length}</span>
      </div>
    </div>
    <div class="quick-table-wrap"></div>
  `;
  const list = panel.querySelector(".quick-table-wrap");
  if (visibleCards.length) {
    list.innerHTML = `
      <table class="quick-table lead-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Vendor / Product</th>
            <th>Note</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
            <th>Source</th>
            <th>Rep</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${visibleCards.map(renderLeadTableRow).join("")}</tbody>
      </table>
    `;
    bindLeadTableActions(panel);
  } else {
    list.innerHTML = `<div class="empty-state">No leads found for this view</div>`;
  }
  elements.board.appendChild(panel);
}

function renderLeadTableRow(card) {
  const products = normalizeProducts(card);
  const productText = products.length
    ? products
        .map((product) => {
          const vendor = product.vendor ? `${escapeHtml(product.vendor)}: ` : "";
          const apn = product.apn ? ` (${escapeHtml(product.apn)})` : "";
          return `${vendor}${escapeHtml(product.description || "Product")}${apn}`;
        })
        .join("<br>")
    : "";
  return `
    <tr>
      <td><button class="table-link" type="button" data-lead-edit="${escapeAttribute(card.id)}">${escapeHtml(card.account)}</button>${card.accountNumber ? `<small>${escapeHtml(card.accountNumber)}</small>` : ""}</td>
      <td>${productText || `<span class="muted-cell">No product</span>`}</td>
      <td class="note-cell">${escapeHtml(card.note)}</td>
      <td>${renderInlineSelect("lead-priority-select", card.id, card.priority, Object.keys(priorities))}</td>
      <td>${card.due ? formatDate(card.due) : "No date"}</td>
      <td>${renderInlineSelect("lead-status-select", card.id, normalizeStatus(card.status), columns)}</td>
      <td>${escapeHtml(card.source)}</td>
      <td>${card.salesRep ? escapeHtml(card.salesRep) : ""}</td>
      <td><button class="edit-card" type="button" data-lead-edit="${escapeAttribute(card.id)}">Edit</button></td>
    </tr>
  `;
}

function bindLeadTableActions(panel) {
  panel.querySelector("[data-print-lead-list]")?.addEventListener("click", () => printLeadList(getVisibleCards(), getLeadQuickFilterLabel(activeLeadQuickFilter)));
  panel.querySelectorAll("[data-lead-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = cards.find((item) => item.id === button.dataset.leadEdit);
      if (card) openForm(card);
    });
  });
  panel.querySelectorAll(".lead-priority-select").forEach((select) => {
    select.addEventListener("change", () => {
      cards = cards.map((card) => (card.id === select.dataset.id ? { ...card, priority: select.value } : card));
      persist();
      render();
    });
  });
  panel.querySelectorAll(".lead-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      cards = cards.map((card) => (card.id === select.dataset.id ? { ...card, status: select.value } : card));
      persist();
      render();
    });
  });
}

function createCard(card) {
  const article = document.createElement("article");
  article.className = `note-card priority-${card.priority.toLowerCase()}`;
  if (isOverdue(card)) article.classList.add("overdue");
  article.draggable = true;
  article.dataset.id = card.id;

  const dueText = card.due ? formatDate(card.due) : "No date";
  const products = normalizeProducts(card);
  const productNumberLabel = getDistributorItemLabel(card.distributor);
  const optionalMeta = [
    card.accountNumber && `Acct #: ${escapeHtml(card.accountNumber)}`,
    card.salesRep && `USF Rep: ${escapeHtml(card.salesRep)}`,
    card.syscoSalesRep && `Sysco Rep: ${escapeHtml(card.syscoSalesRep)}`,
    card.attachments?.length && `${card.attachments.length} file${card.attachments.length === 1 ? "" : "s"}`,
    products.length &&
      `<span class="product-stack">${products
        .map((product) => {
          const vendor = product.vendor ? `<span class="product-vendor">${escapeHtml(product.vendor)}</span> ` : "";
          const apn = product.apn ? ` <small>${escapeHtml(productNumberLabel)}: ${escapeHtml(product.apn)}</small>` : "";
          return `<span class="product-line">${vendor}${escapeHtml(product.description)}${apn}</span>`;
        })
        .join("")}</span>`
  ].filter(Boolean);

  article.innerHTML = `
    <div class="card-summary">
      <button class="account-link" type="button">${escapeHtml(card.account)}</button>
      <div class="summary-badges">
        <span class="badge">${card.priority}</span>
        <span class="badge">${dueText}</span>
      </div>
    </div>
    <div class="card-details">
      <div class="badge-row">
        <span class="badge">${card.source}</span>
        ${isOverdue(card) ? `<span class="badge">Overdue</span>` : ""}
      </div>
      ${optionalMeta.length ? `<div class="meta-row">${optionalMeta.map((item) => `<span class="meta">${item}</span>`).join("")}</div>` : ""}
      <p class="card-note">${escapeHtml(card.note)}</p>
      ${renderAttachmentLinks(card.attachments)}
      <div class="card-actions">
        <button class="edit-card lead-to-vendor-report" type="button">Turn into Vendor Report</button>
        <button class="card-action archive-card" type="button" aria-label="Archive" data-tooltip="Archive">${icons.archive}</button>
        <button class="card-action edit-note" type="button" aria-label="Edit" data-tooltip="Edit">${icons.edit}</button>
        <button class="card-action delete-note" type="button" aria-label="Delete" data-tooltip="Delete">${icons.trash}</button>
      </div>
    </div>
  `;

  article.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, a, input, select, textarea")) return;
    document.body.classList.add("lead-drag-suppressed");
  });
  article.addEventListener("dragstart", (event) => {
    draggedId = card.id;
    document.body.classList.add("lead-drag-active", "lead-drag-suppressed");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.id);
    article.classList.add("dragging");
  });
  article.addEventListener("dragend", () => {
    clearLeadDragState();
  });
  article.querySelector(".account-link").addEventListener("click", (event) => {
    event.stopPropagation();
    openAccountWindow(card);
  });
  article.querySelector(".archive-card").addEventListener("click", (event) => {
    event.stopPropagation();
    archiveCard(card.id);
  });
  article.querySelector(".lead-to-vendor-report").addEventListener("click", (event) => {
    event.stopPropagation();
    turnLeadIntoVendorReport(card.id);
  });
  article.querySelector(".edit-note").addEventListener("click", (event) => {
    event.stopPropagation();
    openForm(card);
  });
  article.querySelector(".delete-note").addEventListener("click", (event) => {
    event.stopPropagation();
    deleteCard(card.id);
  });
  article.addEventListener("dblclick", () => openForm(card));
  return article;
}

function turnLeadIntoVendorReport(id) {
  let changed = false;
  let productCount = 0;
  let leadName = "";

  cards = cards.map((card) => {
    if (card.id !== id) return card;
    leadName = card.account || "this lead";
    const products = normalizeProducts(card).filter((product) => product.vendor);
    if (!products.length) return card;

    const reports = normalizeVendorReports(card.vendorReports);
    products.forEach((product) => {
      const current = getVendorReport(card, product);
      reports[product.id] = {
        ...current,
        productShown: current.productShown || product.description || "",
        opportunityNote: current.opportunityNote || card.note || "",
        outcome: current.outcome || "Unsure",
        submitted: Boolean(current.submitted),
        submittedDate: current.submittedDate || "",
        submissionNote: current.submissionNote || ""
      };
    });
    productCount = products.length;
    changed = true;
    return { ...card, vendorReports: reports };
  });

  if (!changed) {
    alert("Add at least one product with a Vendor / Brand before turning this lead into Vendor Reporting.");
    return;
  }

  if (!persist()) return;
  render();
  if (activeView === "vendor") renderVendorReport();
  alert(`${leadName} is ready in Vendor Reporting with ${productCount} product${productCount === 1 ? "" : "s"}.`);
}

function archiveCard(id) {
  const outcome = askArchiveOutcome();
  if (!outcome) return;
  cards = cards.map((card) =>
    card.id === id
      ? {
          ...card,
          archivedAt: new Date().toISOString(),
          archiveOutcome: outcome
        }
      : card
  );
  persist();
  render();
  if (elements.archiveDialog.open) renderArchive();
}

function restoreCard(id) {
  cards = cards.map((card) => (card.id === id ? { ...card, archivedAt: "", archiveOutcome: "" } : card));
  persist();
  render();
  renderArchive();
}

function restoreTodo(id) {
  todos = todos.map((todo) => (todo.id === id ? { ...todo, archivedAt: "" } : todo));
  persistTodos();
  renderTodoBoard();
  renderArchive();
}

function restoreSample(id) {
  samples = samples.map((sample) => (sample.id === id ? { ...sample, archivedAt: "" } : sample));
  persistSamples();
  renderSamples();
  renderArchive();
}

function restoreDeletedCard(id) {
  cards = cards.map((card) => (card.id === id ? { ...card, deletedAt: "" } : card));
  persist();
  render();
  renderTrash();
}

function askArchiveOutcome() {
  const answer = prompt("Archive outcome? Type Won, Lost, or Unsure.", "Unsure");
  if (answer === null) return "";
  const normalized = answer.trim().toLowerCase();
  if (normalized === "won" || normalized === "win") return "Won";
  if (normalized === "lost" || normalized === "loss") return "Lost";
  if (normalized === "unsure" || normalized === "unknown" || normalized === "") return "Unsure";
  alert("Please type Won, Lost, or Unsure.");
  return askArchiveOutcome();
}

function deleteCard(id) {
  const card = cards.find((item) => item.id === id);
  const label = card?.account ? `Move this note for ${card.account} to Trash?` : "Move this note to Trash?";
  if (!confirm(label)) return;
  cards = cards.map((item) => (item.id === id ? { ...item, deletedAt: new Date().toISOString() } : item));
  persist();
  render();
  if (elements.archiveDialog.open) renderArchive();
  if (elements.trashDialog.open) renderTrash();
}

function permanentlyDeleteCard(id) {
  const card = cards.find((item) => item.id === id);
  const label = card?.account ? `Permanently delete this note for ${card.account}?` : "Permanently delete this note?";
  if (!confirm(label)) return;
  cards = cards.filter((item) => item.id !== id);
  persist();
  renderTrash();
}

function openArchiveWindow() {
  elements.archiveSearch.value = "";
  renderArchive();
  elements.archiveDialog.showModal();
  setTimeout(() => elements.archiveSearch.focus(), 0);
}

function closeArchiveWindow() {
  elements.archiveDialog.close();
}

function openTrashWindow() {
  elements.trashSearch.value = "";
  renderTrash();
  elements.trashDialog.showModal();
  setTimeout(() => elements.trashSearch.focus(), 0);
}

function closeTrashWindow() {
  elements.trashDialog.close();
}

function openCalendarWindow() {
  showThisCalendarMonth();
  elements.calendarDialog.showModal();
}

function closeCalendarWindow() {
  elements.calendarDialog.close();
}

function showThisCalendarMonth() {
  const today = startOfToday();
  calendarView = "month";
  activeCalendarControl = "calendarThisMonth";
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  calendarRangeStart = startOfCalendarWeek(calendarMonth);
  renderCalendar();
}

function showNextCalendarMonth() {
  const today = startOfToday();
  calendarView = "month";
  activeCalendarControl = "calendarNextMonth";
  calendarMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  calendarRangeStart = startOfCalendarWeek(calendarMonth);
  renderCalendar();
}

function showThisCalendarWeek() {
  calendarView = "week";
  activeCalendarControl = "calendarThisWeek";
  calendarRangeStart = startOfCalendarWeek(startOfToday());
  calendarMonth = new Date(calendarRangeStart.getFullYear(), calendarRangeStart.getMonth(), 1);
  renderCalendar();
}

function showNextCalendarWeek() {
  const today = startOfToday();
  calendarView = "week";
  activeCalendarControl = "calendarNextWeek";
  calendarRangeStart = startOfCalendarWeek(today);
  calendarRangeStart.setDate(calendarRangeStart.getDate() + 7);
  calendarMonth = new Date(calendarRangeStart.getFullYear(), calendarRangeStart.getMonth(), 1);
  renderCalendar();
}

function showTodayInCalendar() {
  calendarView = "day";
  activeCalendarControl = "calendarToday";
  calendarRangeStart = startOfToday();
  calendarMonth = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
  renderCalendar();
}

function renderCalendar() {
  const isWeekView = calendarView === "week";
  const isDayView = calendarView === "day";
  const gridStart = isDayView ? startOfToday() : isWeekView ? new Date(calendarRangeStart) : startOfCalendarWeek(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
  const dayTotal = isDayView ? 1 : isWeekView ? 7 : 42;
  const rangeEnd = new Date(gridStart);
  rangeEnd.setDate(gridStart.getDate() + dayTotal - 1);
  elements.calendarTitle.textContent = isDayView
    ? gridStart.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : isWeekView
    ? `${gridStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${rangeEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  elements.calendarGrid.classList.toggle("week-view", isWeekView);
  elements.calendarGrid.classList.toggle("day-view", isDayView);
  const weekdayRow = document.querySelector(".calendar-weekdays");
  if (weekdayRow) {
    weekdayRow.classList.toggle("day-view", isDayView);
    weekdayRow.innerHTML = isDayView
      ? `<span>${gridStart.toLocaleDateString(undefined, { weekday: "long" })}</span>`
      : "<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>";
  }
  setActiveCalendarButton();

  const todayTime = startOfToday().getTime();
  const activeCards = cards.filter((card) => card.due && !card.archivedAt && !card.deletedAt);
  const activeTodos = todos.filter((todo) => todo.due && todo.status !== "Done" && !todo.archivedAt);
  const activeSamples = samples.filter((sample) => sample.expected && !["Delivered / Shown", "Cancelled"].includes(sample.status));
  const days = [];

  for (let i = 0; i < dayTotal; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    const dayCards = activeCards.filter((card) => card.due === key).sort(compareCards);
    const dayTodos = activeTodos.filter((todo) => todo.due === key).sort(compareTodos);
    const daySamples = activeSamples.filter((sample) => sample.expected === key).sort((a, b) => a.product.localeCompare(b.product));
    const classes = [
      "calendar-day",
      date.getMonth() !== calendarMonth.getMonth() ? "outside-month" : "",
      date.getTime() === todayTime ? "today" : ""
    ]
      .filter(Boolean)
      .join(" ");

    days.push(`
      <section class="${classes}" data-calendar-day="${key}">
        <div class="calendar-date">
          <span>${date.getDate()}</span>
        </div>
        <div class="calendar-items">
          ${dayCards
            .map(
              (card) => `
                <button class="calendar-item lead-calendar-item priority-${card.priority.toLowerCase()}" type="button" data-calendar-id="${escapeAttribute(card.id)}">
                  <strong>${escapeHtml(card.account)}</strong>
                  <span>${escapeHtml([card.priority, normalizeStatus(card.status), card.source, card.salesRep && `USF: ${card.salesRep}`, card.syscoSalesRep && `Sysco: ${card.syscoSalesRep}`].filter(Boolean).join(" - "))}</span>
                </button>
              `
            )
            .join("")}
          ${dayTodos
            .map(
              (todo) => `
                <button class="calendar-item todo-calendar-item priority-${todo.priority.toLowerCase()}" type="button" data-calendar-todo-id="${escapeAttribute(todo.id)}">
                  <strong>${escapeHtml(todo.title)}</strong>
                  <span>${escapeHtml([todo.priority, todo.status, todo.assignedBy && `By: ${todo.assignedBy}`].filter(Boolean).join(" - "))}</span>
                </button>
              `
            )
            .join("")}
          ${daySamples
            .map(
              (sample) => `
                <button class="calendar-item sample-calendar-item" type="button" data-calendar-sample-id="${escapeAttribute(sample.id)}">
                  <strong>${escapeHtml(sample.product)}</strong>
                  <span>${escapeHtml(["Sample", sample.status, sample.orderedBy && `By: ${sample.orderedBy}`].filter(Boolean).join(" - "))}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>
    `);
  }

  elements.calendarGrid.innerHTML = days.join("");
  elements.calendarGrid.querySelectorAll("[data-calendar-day]").forEach((day) => {
    day.addEventListener("click", () => openCalendarDayWindow(day.dataset.calendarDay));
  });
  elements.calendarGrid.querySelectorAll("[data-calendar-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const card = cards.find((item) => item.id === button.dataset.calendarId);
      if (!card) return;
      closeCalendarWindow();
      openForm(card);
    });
  });
  elements.calendarGrid.querySelectorAll("[data-calendar-todo-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const todo = todos.find((item) => item.id === button.dataset.calendarTodoId);
      if (!todo) return;
      closeCalendarWindow();
      openTodoWindow();
      openTodoForm(todo);
    });
  });
  elements.calendarGrid.querySelectorAll("[data-calendar-sample-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const sample = samples.find((item) => item.id === button.dataset.calendarSampleId);
      if (!sample) return;
      closeCalendarWindow();
      openSampleTrackerWindow();
      openSampleForm(sample);
    });
  });
}

function setActiveCalendarButton() {
  ["calendarThisMonth", "calendarNextMonth", "calendarThisWeek", "calendarNextWeek", "calendarToday"].forEach((id) => {
    document.querySelector(`#${id}`)?.classList.toggle("active-calendar-control", id === activeCalendarControl);
  });
}

function getCalendarViewData() {
  const isWeekView = calendarView === "week";
  const isDayView = calendarView === "day";
  const gridStart = isDayView ? startOfToday() : isWeekView ? new Date(calendarRangeStart) : startOfCalendarWeek(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
  const dayTotal = isDayView ? 1 : isWeekView ? 7 : 42;
  const rangeEnd = new Date(gridStart);
  rangeEnd.setDate(gridStart.getDate() + dayTotal - 1);
  const title = isDayView
    ? gridStart.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : isWeekView
    ? `${gridStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${rangeEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const activeCards = cards.filter((card) => card.due && !card.archivedAt && !card.deletedAt);
  const activeTodos = todos.filter((todo) => todo.due && todo.status !== "Done" && !todo.archivedAt);
  const days = [];
  for (let i = 0; i < dayTotal; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    days.push({
      date,
      key,
      cards: activeCards.filter((card) => card.due === key).sort(compareCards),
      todos: activeTodos.filter((todo) => todo.due === key).sort(compareTodos)
    });
  }
  return { isWeekView, isDayView, title, days };
}

function printCalendarView() {
  openPrintWindow(renderCalendarPrintDocument(getCalendarViewData()));
}

function renderCalendarPrintDocument({ isWeekView, isDayView, title, days }) {
  const columnCount = isDayView ? 1 : 7;
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Broker Whiteboard Calendar - ${escapeHtml(title)}</title>
        <style>
          body { margin: 0; padding: 20px; color: #211d18; font: 12px Arial, sans-serif; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .muted { margin-bottom: 14px; color: #5d554b; font-weight: 700; }
          .weekdays, .calendar { display: grid; grid-template-columns: repeat(${columnCount}, 1fr); gap: 6px; }
          .weekdays { margin-bottom: 6px; color: #5d554b; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          .day { min-height: ${isDayView ? "720px" : isWeekView ? "560px" : "118px"}; border: 1px solid #d8cdbc; border-radius: 6px; padding: 7px; break-inside: avoid; }
          .date { display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 900; }
          .item { display: block; margin: 0 0 4px; border-left: 5px solid #2f7fb5; border-radius: 4px; padding: 4px 5px; background: #fff3ba; font-weight: 800; }
          .todo { border-left-color: #4c9b57; background: #e3f4d5; }
          .meta { color: #5d554b; font-size: 10px; font-weight: 700; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <h1>Broker Whiteboard Calendar</h1>
        <div class="muted">${escapeHtml(title)} &middot; Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
        <div class="weekdays">${isDayView ? `<span>${escapeHtml(days[0].date.toLocaleDateString(undefined, { weekday: "long" }))}</span>` : "<span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>"}</div>
        <div class="calendar">
          ${days.map(renderCalendarPrintDay).join("")}
        </div>
      </body>
    </html>`;
}

function renderCalendarPrintDay(day) {
  return `<section class="day">
    <div class="date"><span>${escapeHtml(day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }))}</span></div>
    ${day.cards
      .map((card) => `<div class="item">${escapeHtml(card.account)}<div class="meta">Lead &middot; ${escapeHtml(card.priority)} &middot; ${escapeHtml(normalizeStatus(card.status))}</div></div>`)
      .join("")}
    ${day.todos
      .map((todo) => `<div class="item todo">${escapeHtml(todo.title)}<div class="meta">To-Do &middot; ${escapeHtml(todo.priority)} &middot; ${escapeHtml(todo.status)}</div></div>`)
      .join("")}
  </section>`;
}

function openCalendarDayWindow(dateKey) {
  const date = parseLocalDate(dateKey);
  const dayCards = cards
    .filter((card) => card.due === dateKey && !card.archivedAt && !card.deletedAt)
    .sort(compareCards);
  const dayTodos = todos.filter((todo) => todo.due === dateKey && todo.status !== "Done").sort(compareTodos);

  elements.calendarDayTitle.textContent = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  elements.calendarDayList.innerHTML = dayCards.length || dayTodos.length
    ? `${dayCards.length ? `<div class="calendar-section-label">Leads</div>${dayCards.map((card) => renderAccountNote(card)).join("")}` : ""}
       ${dayTodos.length ? `<div class="calendar-section-label">To-Do List</div>${dayTodos.map(renderCalendarTodo).join("")}` : ""}`
    : `<div class="empty-state">No tasks due this day</div>`;
  elements.calendarDayList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = cards.find((item) => item.id === button.dataset.editId);
      if (!note) return;
      closeCalendarDayWindow();
      closeCalendarWindow();
      openForm(note);
    });
  });
  elements.calendarDayList.querySelectorAll("[data-calendar-todo-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const todo = todos.find((item) => item.id === button.dataset.calendarTodoEdit);
      if (!todo) return;
      closeCalendarDayWindow();
      closeCalendarWindow();
      openTodoWindow();
      openTodoForm(todo);
    });
  });
  elements.calendarDayDialog.showModal();
}

function renderCalendarTodo(todo) {
  const progress = getTodoProgress(todo);
  const related = [todo.account, todo.vendor].filter(Boolean).join(" / ");
  return `
    <article class="account-note calendar-todo-note priority-${todo.priority.toLowerCase()}">
      <div class="account-note-header">
        <div>
          <h3>${escapeHtml(todo.title)}</h3>
          <div class="badge-row">
            <span class="badge">${escapeHtml(todo.priority)}</span>
            <span class="badge">${escapeHtml(todo.status)}</span>
            <span class="badge">${progress}% complete</span>
          </div>
        </div>
        <button class="edit-card" type="button" data-calendar-todo-edit="${escapeAttribute(todo.id)}">Edit</button>
      </div>
      <div class="badge-row">
        ${todo.assignedBy ? `<span class="meta">By: ${escapeHtml(todo.assignedBy)}</span>` : ""}
        ${related ? `<span class="meta">${escapeHtml(related)}</span>` : ""}
      </div>
      ${todo.notes ? `<p class="card-note">${escapeHtml(todo.notes)}</p>` : ""}
    </article>
  `;
}

function closeCalendarDayWindow() {
  elements.calendarDayDialog.close();
}

function setupDatePicker(input) {
  input.addEventListener("click", () => openDatePicker(input));
  input.addEventListener("focus", () => openDatePicker(input));
}

function getDatePicker() {
  let picker = document.querySelector("#datePicker");
  if (picker) return picker;
  picker = document.createElement("div");
  picker.id = "datePicker";
  picker.className = "date-picker-popover";
  picker.hidden = true;
  document.body.appendChild(picker);
  picker.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", (event) => {
    if (!datePickerInput) return;
    if (event.target === datePickerInput || picker.contains(event.target)) return;
    closeDatePicker();
  });
  window.addEventListener("resize", positionDatePicker);
  window.addEventListener("scroll", positionDatePicker, true);
  return picker;
}

function getDatePickerHost(input) {
  return input?.closest("dialog[open]") || document.body;
}

function openDatePicker(input) {
  datePickerInput = input;
  const picker = getDatePicker();
  const host = getDatePickerHost(input);
  if (picker.parentElement !== host) host.appendChild(picker);
  const selected = input.value ? parseLocalDate(input.value) : startOfToday();
  datePickerMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  renderDatePicker();
}

function closeDatePicker() {
  const picker = getDatePicker();
  picker.hidden = true;
  datePickerInput = null;
}

function renderDatePicker() {
  const picker = getDatePicker();
  const selectedValue = datePickerInput?.value || "";
  const firstOfMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1);
  const gridStart = startOfCalendarWeek(firstOfMonth);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    const classes = [
      "date-picker-day",
      date.getMonth() !== datePickerMonth.getMonth() ? "outside-month" : "",
      key === selectedValue ? "selected" : "",
      key === toDateKey(startOfToday()) ? "today" : ""
    ]
      .filter(Boolean)
      .join(" ");
    days.push(`<button class="${classes}" type="button" data-picker-date="${key}">${date.getDate()}</button>`);
  }
  picker.innerHTML = `
    <div class="date-picker-header">
      <button type="button" data-picker-prev>Previous</button>
      <strong>${datePickerMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
      <button type="button" data-picker-next>Next</button>
    </div>
    <div class="date-picker-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
    <div class="date-picker-grid">${days.join("")}</div>
    <div class="date-picker-actions">
      <button type="button" data-picker-clear>Clear</button>
      <button type="button" data-picker-today>Today</button>
      <button type="button" data-picker-close>Close</button>
    </div>
  `;
  picker.hidden = false;
  positionDatePicker();
  picker.querySelector("[data-picker-prev]").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    datePickerMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1, 1);
    renderDatePicker();
  });
  picker.querySelector("[data-picker-next]").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    datePickerMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 1);
    renderDatePicker();
  });
  picker.querySelector("[data-picker-today]").addEventListener("click", () => selectDatePickerValue(toDateKey(startOfToday())));
  picker.querySelector("[data-picker-clear]").addEventListener("click", () => selectDatePickerValue(""));
  picker.querySelector("[data-picker-close]").addEventListener("click", closeDatePicker);
  picker.querySelectorAll("[data-picker-date]").forEach((button) => {
    button.addEventListener("click", () => selectDatePickerValue(button.dataset.pickerDate));
  });
}

function selectDatePickerValue(value) {
  if (!datePickerInput) return;
  datePickerInput.value = value;
  datePickerInput.dispatchEvent(new Event("input", { bubbles: true }));
  datePickerInput.dispatchEvent(new Event("change", { bubbles: true }));
  closeDatePicker();
}

function openTodoWindow() {
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  renderTodoBoard();
  elements.todoDialog.hidden = false;
  document.body.classList.add("todo-mode");
  elements.todoDialog.scrollTop = 0;
}

function closeTodoWindow() {
  elements.todoDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  showLeadsWorkflow();
}

function openVendorReportWindow() {
  elements.todoDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  updateVendorControls();
  renderVendorReport();
  elements.vendorReportDialog.hidden = false;
  elements.vendorReportDialog.scrollTop = 0;
}

function closeVendorReportWindow() {
  elements.vendorReportDialog.hidden = true;
  showLeadsWorkflow();
}

function openAddressBookWindow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  renderAddressBook();
  elements.addressBookDialog.hidden = false;
  elements.addressBookDialog.scrollTop = 0;
}

function closeAddressBookWindow() {
  elements.addressBookDialog.hidden = true;
  showLeadsWorkflow();
}

function openStockListsWindow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  updateStockCategorySuggestions();
  renderStockLists();
  elements.stockListsDialog.hidden = false;
  elements.stockListsDialog.scrollTop = 0;
}

function closeStockListsWindow() {
  elements.stockListsDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  showLeadsWorkflow();
}

function openSampleTrackerWindow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  setActiveTrackerTab(activeTrackerTab);
  elements.sampleTrackerDialog.hidden = false;
  elements.sampleTrackerDialog.scrollTop = 0;
}

function closeSampleTrackerWindow() {
  elements.sampleTrackerDialog.hidden = true;
  showLeadsWorkflow();
}

function openMarketVisitsWindow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  updateMarketVisitControls();
  renderMarketVisits();
  elements.marketVisitsDialog.hidden = false;
  elements.marketVisitsDialog.scrollTop = 0;
}

function closeMarketVisitsWindow() {
  elements.marketVisitsDialog.hidden = true;
  showLeadsWorkflow();
}

function showLeadsWorkflow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
  elements.sampleTrackerDialog.hidden = true;
  elements.marketVisitsDialog.hidden = true;
  document.body.classList.remove("todo-mode");
  clearFilters(false);
  leadQuickListMode = false;
  activeLeadQuickFilter = "";
  render();
}

function clearVendorReportFilters() {
  elements.vendorReportVendorFilter.value = "";
  elements.vendorReportMonthFilter.value = "";
  elements.vendorReportSubmittedFilter.value = "";
  renderVendorReport();
}

function renderVendorReport() {
  if (!elements.vendorReportTable) return;
  const rows = getVendorReportRows();
  elements.vendorReportCount.textContent = rows.length;
  if (!rows.length) {
    elements.vendorReportTable.innerHTML = `<div class="empty-state">No vendor lead rows found for these filters</div>`;
    return;
  }
  elements.vendorReportTable.innerHTML = `
    <table class="quick-table vendor-report-table">
      <thead>
        <tr>
          <th>Vendor / Brand</th>
          <th>Account name</th>
          <th>Product</th>
          <th>Opportunity / target note</th>
          <th>Won / Lost / Unsure</th>
          <th>Submitted date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows.map(renderVendorReportRow).join("")}</tbody>
    </table>
  `;
  bindVendorReportActions();
}

function getVendorReportRows() {
  const vendorFilter = elements.vendorReportVendorFilter.value;
  const monthFilter = elements.vendorReportMonthFilter.value;
  const submittedFilter = elements.vendorReportSubmittedFilter.value;
  const leadRows = cards
    .filter((card) => !card.deletedAt)
    .flatMap((card) =>
      normalizeProducts(card)
        .filter((product) => product.vendor)
        .map((product) => {
          const report = getVendorReport(card, product);
          return { type: "lead", card, product, report };
        })
    );
  const manualRows = manualVendorReports.map((manual) => ({
    type: "manual",
    manual,
    product: { id: manual.id, vendor: manual.vendor, description: manual.productShown },
    report: manual
  }));
  return [...leadRows, ...manualRows]
    .filter(({ card, product, report }) => {
      if (vendorFilter && product.vendor !== vendorFilter) return false;
      if (submittedFilter === "submitted" && !report.submitted) return false;
      if (submittedFilter === "not-submitted" && report.submitted) return false;
      if (monthFilter && !vendorRowMatchesMonth(card, report, monthFilter)) return false;
      return true;
    })
    .sort((a, b) => a.product.vendor.localeCompare(b.product.vendor) || compareVendorReportDate(a, b));
}

function compareVendorReportDate(a, b) {
  const aDate = a.card?.due || a.report.submittedDate || a.report.createdAt || "";
  const bDate = b.card?.due || b.report.submittedDate || b.report.createdAt || "";
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return parseLocalDate(aDate.slice(0, 10)) - parseLocalDate(bDate.slice(0, 10));
}

function renderVendorReportRow(row) {
  const { card, product, report, manual, type } = row;
  const rowId = type === "manual" ? `manual::${manual.id}` : getVendorReportRowId(card.id, product.id);
  const accountName = type === "manual" ? manual.account : card.account;
  const accountNumber = type === "manual" ? "" : card.accountNumber;
  return `
    <tr data-report-row="${escapeAttribute(rowId)}">
      <td class="vendor-name-cell">${escapeHtml(product.vendor)}</td>
      <td class="vendor-account-cell">${type === "manual" ? `<button class="table-link" type="button" data-edit-manual-report="${escapeAttribute(manual.id)}">${escapeHtml(accountName)}</button><small>Report only</small>` : `<button class="table-link" type="button" data-vendor-open-lead="${escapeAttribute(card.id)}">${escapeHtml(accountName)}</button>${accountNumber ? `<small>${escapeHtml(accountNumber)}</small>` : ""}`}</td>
      <td class="vendor-product-cell">${escapeHtml(report.productShown || product.description)}</td>
      <td><textarea class="vendor-report-textarea" data-report-field="opportunityNote" rows="2">${escapeHtml(report.opportunityNote)}</textarea></td>
      <td>
        <select class="vendor-report-input" data-report-field="outcome">
          <option ${report.outcome === "Unsure" ? "selected" : ""}>Unsure</option>
          <option ${report.outcome === "Won" ? "selected" : ""}>Won</option>
          <option ${report.outcome === "Lost" ? "selected" : ""}>Lost</option>
        </select>
      </td>
      <td><input class="vendor-report-input date-picker-input" data-report-field="submittedDate" type="text" value="${escapeAttribute(report.submittedDate)}" readonly /></td>
      <td class="vendor-row-actions">
        <button class="edit-card mark-submitted" type="button" data-toggle-submitted="${escapeAttribute(rowId)}">${report.submitted ? "Mark as Unsubmitted" : "Mark as Submitted"}</button>
        ${type === "manual" && !manual.promotedCardId ? `<button class="edit-card promote-report" type="button" data-promote-report="${escapeAttribute(manual.id)}">Turn into Lead</button>` : ""}
        ${type === "manual" && manual.promotedCardId ? `<span class="meta">In Leads</span>` : ""}
      </td>
    </tr>
  `;
}

function bindVendorReportActions() {
  elements.vendorReportTable.querySelectorAll("[data-vendor-open-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = cards.find((item) => item.id === button.dataset.vendorOpenLead);
      if (card) openForm(card);
    });
  });
  elements.vendorReportTable.querySelectorAll("[data-edit-manual-report]").forEach((button) => {
    button.addEventListener("click", () => {
      const report = manualVendorReports.find((item) => item.id === button.dataset.editManualReport);
      if (report) openManualVendorForm(report);
    });
  });
  elements.vendorReportTable.querySelectorAll("[data-report-field]").forEach((field) => {
    field.addEventListener("change", () => saveVendorReportField(field));
    if (field.dataset.reportField !== "submittedDate") {
      field.addEventListener("blur", () => saveVendorReportField(field));
    }
  });
  elements.vendorReportTable.querySelectorAll('[data-report-field="submittedDate"]').forEach(setupDatePicker);
  elements.vendorReportTable.querySelectorAll("[data-toggle-submitted]").forEach((button) => {
    button.addEventListener("click", () => toggleVendorReportSubmitted(button.dataset.toggleSubmitted));
  });
  elements.vendorReportTable.querySelectorAll("[data-promote-report]").forEach((button) => {
    button.addEventListener("click", () => promoteManualVendorReport(button.dataset.promoteReport));
  });
}

function saveVendorReportField(field) {
  const rowId = field.closest("[data-report-row]")?.dataset.reportRow;
  const fieldName = field.dataset.reportField;
  if (!rowId || !fieldName) return;
  updateVendorReport(rowId, (report) => {
    report[fieldName] = field.value.trim();
    if (fieldName === "submittedDate") {
      report.submitted = Boolean(report.submittedDate);
    }
  });
  if (fieldName === "submittedDate") renderVendorReport();
}

function toggleVendorReportSubmitted(rowId) {
  const current = getVendorReportByRowId(rowId);
  const shouldSubmit = !current?.submitted;
  updateVendorReport(rowId, (report) => {
    report.submitted = shouldSubmit;
    report.submittedDate = shouldSubmit ? toDateKey(startOfToday()) : "";
  });
  renderVendorReport();
}

function getVendorReportByRowId(rowId) {
  if (rowId.startsWith("manual::")) {
    const id = rowId.split("::")[1];
    return manualVendorReports.find((report) => report.id === id) || null;
  }
  const [cardId, productId] = rowId.split("::");
  const card = cards.find((item) => item.id === cardId);
  const product = normalizeProducts(card || {}).find((item) => item.id === productId);
  return card && product ? getVendorReport(card, product) : null;
}

function updateVendorReport(rowId, updater) {
  if (rowId.startsWith("manual::")) {
    const id = rowId.split("::")[1];
    manualVendorReports = manualVendorReports.map((report) => {
      if (report.id !== id) return report;
      const next = normalizeManualVendorReport(report);
      updater(next);
      return next;
    });
    persistManualVendorReports();
    return;
  }
  const [cardId, productId] = rowId.split("::");
  cards = cards.map((card) => {
    if (card.id !== cardId) return card;
    const reportKey = productId;
    const reports = normalizeVendorReports(card.vendorReports);
    const product = normalizeProducts(card).find((item) => item.id === productId);
    const current = getVendorReport(card, product || { id: productId, description: "" });
    updater(current);
    reports[reportKey] = current;
    return { ...card, vendorReports: reports };
  });
  persist();
}

function getVendorReport(card, product) {
  const report = normalizeVendorReports(card.vendorReports)[product.id] || {};
  return {
    productShown: report.productShown || product.description || "",
    opportunityNote: report.opportunityNote || "",
    outcome: report.outcome || "Unsure",
    submitted: Boolean(report.submitted),
    submittedDate: report.submittedDate || "",
    submissionNote: report.submissionNote || ""
  };
}

function getVendorReportRowId(cardId, productId) {
  return `${cardId}::${productId}`;
}

function vendorRowMatchesMonth(card, report, month) {
  return [card?.due, report.submittedDate, card?.createdAt, report.createdAt]
    .filter(Boolean)
    .some((value) => String(value).slice(0, 7) === month);
}

function openManualVendorForm(report) {
  elements.manualVendorForm.reset();
  updateAccountSuggestions();
  elements.manualVendorId.value = report?.id || "";
  elements.manualVendorAccount.value = report?.account || "";
  elements.manualVendorVendor.value = report?.vendor || elements.vendorReportVendorFilter.value || "";
  elements.manualVendorProduct.value = report?.productShown || "";
  elements.manualVendorOpportunity.value = report?.opportunityNote || "";
  elements.manualVendorOutcome.value = report?.outcome || "Unsure";
  elements.manualVendorSubmittedDate.value = report?.submittedDate || "";
  elements.manualVendorDialog.showModal();
  setTimeout(() => elements.manualVendorAccount.focus(), 0);
}

function closeManualVendorForm() {
  elements.manualVendorDialog.close();
}

function saveManualVendorReport() {
  const id = elements.manualVendorId.value || crypto.randomUUID();
  const existing = manualVendorReports.find((report) => report.id === id);
  const next = normalizeManualVendorReport({
    id,
    account: elements.manualVendorAccount.value.trim(),
    vendor: elements.manualVendorVendor.value.trim(),
    productShown: elements.manualVendorProduct.value.trim(),
    opportunityNote: elements.manualVendorOpportunity.value.trim(),
    outcome: elements.manualVendorOutcome.value,
    submitted: Boolean(elements.manualVendorSubmittedDate.value),
    submittedDate: elements.manualVendorSubmittedDate.value,
    promotedCardId: existing?.promotedCardId || "",
    createdAt: existing?.createdAt || new Date().toISOString()
  });
  manualVendorReports = existing
    ? manualVendorReports.map((report) => (report.id === id ? next : report))
    : [next, ...manualVendorReports];
  persistManualVendorReports();
  closeManualVendorForm();
  updateVendorControls();
  renderVendorReport();
}

function promoteManualVendorReport(id) {
  const report = manualVendorReports.find((item) => item.id === id);
  if (!report) return;
  const shouldPromote = confirm("Turn this vendor report row into a real lead on the Leads board?");
  if (!shouldPromote) return;
  const productId = crypto.randomUUID();
  const cardId = crypto.randomUUID();
  const card = normalizeCard({
    id: cardId,
    account: report.account,
    accountNumber: "",
    distributor: "US Foods",
    note: report.opportunityNote || "Vendor reporting target",
    priority: "Medium",
    due: "",
    status: "New Lead",
    source: "Market Visit",
    salesRep: "",
    products: [{ id: productId, vendor: report.vendor, description: report.productShown, apn: "" }],
    vendorReports: {
      [productId]: {
        productShown: report.productShown,
        opportunityNote: report.opportunityNote,
        outcome: report.outcome,
        submitted: report.submitted,
        submittedDate: report.submittedDate,
        submissionNote: ""
      }
    },
    attachments: [],
    archivedAt: "",
    archiveOutcome: "",
    deletedAt: "",
    createdAt: new Date().toISOString()
  });
  cards = [card, ...cards];
  manualVendorReports = manualVendorReports.filter((item) => item.id !== id);
  persist();
  persistManualVendorReports();
  updateVendorControls();
  render();
  renderVendorReport();
  alert("This report lead is now on the Leads board.");
}

function clearAddressBookSearch() {
  elements.addressBookSearch.value = "";
  renderAddressBook();
}

function renderAddressBook() {
  if (!elements.addressBookTable) return;
  const entries = getVisibleAddressBookEntries();
  elements.addressBookCount.textContent = entries.length;
  if (!entries.length) {
    elements.addressBookTable.innerHTML = `<div class="empty-state">No operators found</div>`;
    return;
  }
  elements.addressBookTable.innerHTML = `
    <table class="quick-table address-book-table">
      <thead>
        <tr>
          <th>Operator</th>
          <th>Primary contact</th>
          <th>USF Acct. #</th>
          <th>Sysco Acct. #</th>
          <th>Sales reps</th>
          <th>Website</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${entries.map(renderAddressBookRow).join("")}</tbody>
    </table>
  `;
  bindAddressBookActions();
}

function getVisibleAddressBookEntries() {
  const query = elements.addressBookSearch.value.trim().toLowerCase();
  return addressBook
    .filter((entry) => !entry.archivedAt)
    .filter((entry) => !query || getAddressBookSearchText(entry).includes(query))
    .sort((a, b) => a.operation.localeCompare(b.operation));
}

function getAddressBookSearchText(entry) {
  return [
    entry.operation,
    entry.accountNumber,
    entry.syscoAccountNumber,
    entry.locations,
    entry.website,
    entry.usfSalesRep,
    entry.syscoSalesRep,
    entry.primaryContact.name,
    entry.primaryContact.role,
    entry.primaryContact.phone,
    entry.primaryContact.email,
    entry.secondaryContact.name,
    entry.secondaryContact.role,
    entry.secondaryContact.phone,
    entry.secondaryContact.email,
    entry.address,
    entry.notes,
    entry.contacts.map((contact) => [contact.name, contact.role, contact.email, contact.phone].join(" ")).join(" ")
  ]
    .join(" ")
    .toLowerCase();
}

function renderAddressBookRow(entry) {
  const primaryContactDetails = [
    entry.primaryContact.role,
    entry.primaryContact.phone,
    entry.primaryContact.email
  ].filter(Boolean);
  const salesReps = [
    entry.usfSalesRep && `USF: ${entry.usfSalesRep}`,
    entry.syscoSalesRep && `Sysco: ${entry.syscoSalesRep}`
  ].filter(Boolean);
  return `
    <tr>
      <td><button class="table-link" type="button" data-address-edit="${escapeAttribute(entry.id)}">${escapeHtml(entry.operation)}</button></td>
      <td>
        <strong>${entry.primaryContact.name ? escapeHtml(entry.primaryContact.name) : ""}</strong>
        ${primaryContactDetails.length ? `<br><span class="products">${escapeHtml(primaryContactDetails.join(" | "))}</span>` : ""}
      </td>
      <td>${entry.accountNumber ? escapeHtml(entry.accountNumber) : ""}</td>
      <td>${entry.syscoAccountNumber ? escapeHtml(entry.syscoAccountNumber) : ""}</td>
      <td>${salesReps.map((rep) => escapeHtml(rep)).join("<br>")}</td>
      <td>${entry.website ? `<a class="website-icon-link" href="${escapeAttribute(normalizeWebsiteUrl(entry.website))}" target="_blank" rel="noopener" aria-label="Open website for ${escapeAttribute(entry.operation)}" title="Open website">&#127760;</a>` : ""}</td>
      <td>
        <div class="table-actions">
          <button class="edit-card" type="button" data-address-leads="${escapeAttribute(entry.id)}">Leads</button>
          <button class="edit-card" type="button" data-address-archive="${escapeAttribute(entry.id)}">Archive</button>
          <button class="edit-card" type="button" data-address-edit="${escapeAttribute(entry.id)}">Edit</button>
        </div>
      </td>
    </tr>
  `;
}

function bindAddressBookActions() {
  elements.addressBookTable.querySelectorAll("[data-address-map]").forEach((button) => {
    button.addEventListener("click", () => openAddressInMap(button.dataset.addressMap));
  });
  elements.addressBookTable.querySelectorAll("[data-address-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = addressBook.find((item) => item.id === button.dataset.addressEdit);
      if (entry) openAddressBookForm(entry);
    });
  });
  elements.addressBookTable.querySelectorAll("[data-address-leads]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = addressBook.find((item) => item.id === button.dataset.addressLeads);
      if (!entry) return;
      const lead = cards.find((card) => !card.deletedAt && card.account.trim().toLowerCase() === entry.operation.trim().toLowerCase());
      if (lead) {
        openAccountWindow(lead);
      } else {
        alert("No leads found for this operator yet.");
      }
    });
  });
  elements.addressBookTable.querySelectorAll("[data-address-archive]").forEach((button) => {
    button.addEventListener("click", () => archiveAddressBookEntry(button.dataset.addressArchive));
  });
}

function formatAddressContact(contact) {
  if (!contact?.name && !contact?.role) return "";
  return `${contact.name ? escapeHtml(contact.name) : ""}${contact.role ? `<br><span class="products">${escapeHtml(contact.role)}</span>` : ""}`;
}

function openAddressBookForm(entry) {
  elements.addressBookForm.reset();
  elements.addressContactList.innerHTML = "";
  const existing = entry ? normalizeAddressBookEntry(entry) : null;
  elements.addressBookFormTitle.textContent = existing ? "Edit Operator" : "Add Operator";
  elements.addressBookId.value = existing?.id || "";
  elements.deleteAddressEntry.hidden = !existing;
  elements.addressOperation.value = existing?.operation || "";
  elements.addressAccountNumber.value = existing?.accountNumber || "";
  elements.addressSyscoAccountNumber.value = existing?.syscoAccountNumber || "";
  elements.addressLocations.value = existing?.locations || "";
  setAddressDeliveryDays(existing?.deliveryDays || []);
  elements.addressWebsite.value = existing?.website || "";
  elements.addressUsfSalesRep.value = existing?.usfSalesRep || "";
  elements.addressSyscoSalesRep.value = existing?.syscoSalesRep || "";
  elements.addressLastUpdated.value = existing?.updatedAt ? formatDateTime(existing.updatedAt) : "";
  elements.addressPrimaryName.value = existing?.primaryContact.name || "";
  elements.addressPrimaryRole.value = existing?.primaryContact.role || "";
  elements.addressPrimaryEmail.value = existing?.primaryContact.email || "";
  elements.addressPrimaryPhone.value = existing?.primaryContact.phone || "";
  elements.addressSecondaryName.value = existing?.secondaryContact.name || "";
  elements.addressSecondaryRole.value = existing?.secondaryContact.role || "";
  elements.addressSecondaryEmail.value = existing?.secondaryContact.email || "";
  elements.addressSecondaryPhone.value = existing?.secondaryContact.phone || "";
  elements.addressStreet.value = existing?.address || "";
  elements.addressNotes.value = existing?.notes || "";
  (existing?.contacts || []).forEach((contact) => addAddressContactRow(contact));
  elements.addressBookFormDialog.showModal();
  setTimeout(() => elements.addressOperation.focus(), 0);
}

function closeAddressBookForm() {
  elements.addressBookFormDialog.close();
}

function openCurrentAddressInMap() {
  openAddressInMap(elements.addressStreet.value.trim());
}

function openAddressInMap(address) {
  const value = String(address || "").trim();
  if (!value) {
    alert("Add an address first.");
    return;
  }
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, "_blank", "noopener");
}

function normalizeWebsiteUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function setAddressDeliveryDays(days) {
  const selectedDays = new Set(Array.isArray(days) ? days : []);
  document.querySelectorAll('input[name="addressDeliveryDays"]').forEach((input) => {
    input.checked = selectedDays.has(input.value);
  });
}

function readAddressDeliveryDays() {
  return [...document.querySelectorAll('input[name="addressDeliveryDays"]:checked')].map((input) => input.value);
}

function saveAddressBookEntry() {
  const id = elements.addressBookId.value || crypto.randomUUID();
  const existing = addressBook.find((entry) => entry.id === id);
  const entry = normalizeAddressBookEntry({
    id,
    operation: elements.addressOperation.value.trim(),
    accountNumber: elements.addressAccountNumber.value.trim(),
    syscoAccountNumber: elements.addressSyscoAccountNumber.value.trim(),
    locations: elements.addressLocations.value.trim(),
    deliveryDays: readAddressDeliveryDays(),
    website: elements.addressWebsite.value.trim(),
    usfSalesRep: elements.addressUsfSalesRep.value.trim(),
    syscoSalesRep: elements.addressSyscoSalesRep.value.trim(),
    primaryContact: {
      name: elements.addressPrimaryName.value.trim(),
      role: elements.addressPrimaryRole.value.trim(),
      email: elements.addressPrimaryEmail.value.trim(),
      phone: elements.addressPrimaryPhone.value.trim()
    },
    secondaryContact: {
      name: elements.addressSecondaryName.value.trim(),
      role: elements.addressSecondaryRole.value.trim(),
      email: elements.addressSecondaryEmail.value.trim(),
      phone: elements.addressSecondaryPhone.value.trim()
    },
    address: elements.addressStreet.value.trim(),
    notes: elements.addressNotes.value.trim(),
    contacts: readAddressContacts(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  addressBook = existing ? addressBook.map((item) => (item.id === id ? entry : item)) : [entry, ...addressBook];
  persistAddressBook();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  closeAddressBookForm();
  renderAddressBook();
}

function deleteCurrentAddressEntry() {
  const id = elements.addressBookId.value;
  if (!id) return;
  const entry = addressBook.find((item) => item.id === id);
  if (!confirm(entry?.operation ? `Delete "${entry.operation}" from the address book?` : "Delete this address book entry?")) return;
  addressBook = addressBook.filter((item) => item.id !== id);
  persistAddressBook();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  closeAddressBookForm();
  renderAddressBook();
}

function archiveAddressBookEntry(id) {
  const entry = addressBook.find((item) => item.id === id);
  if (!entry) return;
  const shouldArchive = confirm(entry.operation ? `Archive operator "${entry.operation}"?` : "Archive this operator?");
  if (!shouldArchive) return;
  addressBook = addressBook.map((item) => (item.id === id ? { ...item, archivedAt: new Date().toISOString() } : item));
  persistAddressBook();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  renderAddressBook();
  if (elements.archiveDialog.open) renderArchive();
}

function restoreAddressBookEntry(id) {
  addressBook = addressBook.map((entry) => (entry.id === id ? { ...entry, archivedAt: "" } : entry));
  persistAddressBook();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  renderAddressBook();
  renderArchive();
}

function addAddressContactRow(contact = { name: "", role: "", email: "", phone: "" }) {
  const row = document.createElement("div");
  row.className = "address-contact-row";
  row.dataset.contactId = contact.id || crypto.randomUUID();
  row.innerHTML = `
    <label><span>Name</span><input class="address-contact-name" autocomplete="off" value="${escapeAttribute(contact.name)}" /></label>
    <label><span>Role</span><input class="address-contact-role" autocomplete="off" value="${escapeAttribute(contact.role)}" /></label>
    <label><span>Email</span><input class="address-contact-email" type="email" autocomplete="off" value="${escapeAttribute(contact.email)}" /></label>
    <label><span>Phone</span><input class="address-contact-phone" autocomplete="off" value="${escapeAttribute(contact.phone)}" /></label>
    <button class="remove-product" type="button">Remove</button>
  `;
  row.querySelector(".remove-product").addEventListener("click", () => row.remove());
  elements.addressContactList.appendChild(row);
}

function readAddressContacts() {
  return [...elements.addressContactList.querySelectorAll(".address-contact-row")]
    .map((row) => ({
      id: row.dataset.contactId || crypto.randomUUID(),
      name: row.querySelector(".address-contact-name").value.trim(),
      role: row.querySelector(".address-contact-role").value.trim(),
      email: row.querySelector(".address-contact-email").value.trim(),
      phone: row.querySelector(".address-contact-phone").value.trim()
    }))
    .filter((contact) => contact.name || contact.role || contact.email || contact.phone);
}

function clearStockFilters() {
  elements.stockSearch.value = "";
  elements.stockDistributorFilter.value = "";
  elements.stockVendorFilter.value = "";
  elements.stockCategoryFilter.value = "";
  elements.stockStorageFilter.value = "";
  elements.stockBrandTypeFilter.value = "";
  renderStockLists();
}

function selectStockList(group) {
  activeStockList = stockListGroups[group] ? group : "";
  elements.stockDistributorFilter.value = "";
  clearStockFilters();
}

function getActiveStockGroup() {
  return stockListGroups[activeStockList] || null;
}

function getActiveStockDefaultDistributor() {
  return getActiveStockGroup()?.defaultDistributor || "US Foods Anchorage";
}

function setActiveStockListControls() {
  const group = getActiveStockGroup();
  elements.stockListTitle.textContent = group?.label || "Choose a stock list";
  elements.stockListActions.hidden = !group;
  elements.stockListPicker.querySelectorAll("[data-stock-list]").forEach((button) => {
    button.classList.toggle("active-stock-list", button.dataset.stockList === activeStockList);
  });
}

function renderStockLists() {
  if (!elements.stockTable) return;
  updateStockCategorySuggestions();
  updateStockFilterOptions();
  setActiveStockListControls();
  if (!getActiveStockGroup()) {
    elements.stockCount.textContent = "0";
    elements.stockTable.innerHTML = `<div class="empty-state stock-choice-empty">Choose US Foods, Sysco, or Linford to view that stock list.</div>`;
    return;
  }
  const products = getVisibleStockProducts();
  elements.stockCount.textContent = products.length;
  if (!products.length) {
    elements.stockTable.innerHTML = `<div class="empty-state">No stock products found</div>`;
    return;
  }
  elements.stockTable.innerHTML = renderStockVendorGroups(products);
  bindStockActions();
}

function renderStockVendorGroups(products) {
  const groups = new Map();
  products.forEach((product) => {
    const vendor = product.vendor || "No vendor";
    if (!groups.has(vendor)) groups.set(vendor, []);
    groups.get(vendor).push(product);
  });
  return [...groups.entries()]
    .map(([vendor, vendorProducts]) => {
      const logo = getVendorLogo(vendor);
      return `
      <section class="stock-vendor-group">
        <div class="stock-vendor-header">
          <div class="stock-vendor-title">
            ${logo ? `<img class="vendor-logo" src="${escapeAttribute(logo.src)}" alt="${escapeAttribute(logo.alt)}" />` : ""}
            <div>
            <p class="eyebrow">Vendor</p>
            <h3>${escapeHtml(vendor)}</h3>
            </div>
          </div>
          <span class="count-pill">${vendorProducts.length} item${vendorProducts.length === 1 ? "" : "s"}</span>
        </div>
        <table class="quick-table stock-table">
          <thead>
            <tr>
              <th>Product Description</th>
              <th>Brand Name</th>
              <th>Brand Type</th>
              <th>APN</th>
              <th>SUPC</th>
              <th>MF#</th>
              <th>GTIN</th>
              <th>Packaging</th>
              <th>Storage</th>
              <th>Category</th>
              <th>SO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${vendorProducts.map(renderStockRow).join("")}</tbody>
        </table>
      </section>
    `;
    })
    .join("");
}

function getVisibleStockProducts() {
  const query = elements.stockSearch.value.trim().toLowerCase();
  const vendor = elements.stockVendorFilter.value.trim().toLowerCase();
  const category = elements.stockCategoryFilter.value.trim().toLowerCase();
  const group = getActiveStockGroup();
  return stockProducts
    .filter((product) => {
      if (group && !group.distributors.includes(product.distributor)) return false;
      if (elements.stockDistributorFilter.value && product.distributor !== elements.stockDistributorFilter.value) return false;
      if (elements.stockStorageFilter.value && product.storage !== elements.stockStorageFilter.value) return false;
      if (elements.stockBrandTypeFilter.value && product.brandType !== elements.stockBrandTypeFilter.value) return false;
      if (vendor && !product.vendor.toLowerCase().includes(vendor)) return false;
      if (category && product.category.toLowerCase() !== category) return false;
      if (query && !getStockSearchText(product).includes(query)) return false;
      return true;
    })
    .sort((a, b) => a.distributor.localeCompare(b.distributor) || a.vendor.localeCompare(b.vendor) || a.description.localeCompare(b.description));
}

function getStockSearchText(product) {
  return [
    product.distributor,
    product.distributorNumber,
    product.apn,
    product.supc,
    product.manufacturerNumber,
    product.gtin,
    product.description,
    product.packaging,
    product.storage,
    product.vendor,
    product.brandType,
    product.brandName,
    product.category,
    product.so
  ]
    .join(" ")
    .toLowerCase();
}

function renderStockRow(product) {
  const attachmentCount = (product.attachments || []).filter((file) => file?.name && (file?.data || file?.storageId)).length;
  const attachmentIcon = attachmentCount
    ? `<span class="stock-attachment-clip" title="${attachmentCount} attached file${attachmentCount === 1 ? "" : "s"}" aria-label="${attachmentCount} attached file${attachmentCount === 1 ? "" : "s"}">&#128206;</span>`
    : "";
  return `
    <tr>
      <td><button class="table-link stock-product-link" type="button" data-stock-edit="${escapeAttribute(product.id)}">${escapeHtml(product.description)}${attachmentIcon}</button></td>
      <td>${escapeHtml(product.brandName)}</td>
      <td>${escapeHtml(product.brandType)}</td>
      <td>${escapeHtml(product.apn)}</td>
      <td>${escapeHtml(product.supc)}</td>
      <td>${escapeHtml(product.manufacturerNumber)}</td>
      <td>${escapeHtml(product.gtin)}</td>
      <td>${escapeHtml(product.packaging)}</td>
      <td>${escapeHtml(product.storage)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.so)}</td>
      <td><button class="edit-card" type="button" data-stock-edit="${escapeAttribute(product.id)}">Edit</button></td>
    </tr>
  `;
}

function bindStockActions() {
  elements.stockTable.querySelectorAll("[data-stock-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = stockProducts.find((item) => item.id === button.dataset.stockEdit);
      if (product) openStockForm(product);
    });
  });
}

function openStockForm(product) {
  elements.stockForm.reset();
  const existing = product ? normalizeStockProduct(product) : null;
  currentStockAttachments = existing?.attachments ? existing.attachments.map(normalizeStockAttachment) : [];
  elements.stockFormTitle.textContent = existing ? "Edit Product" : "Add Product";
  elements.stockId.value = existing?.id || "";
  elements.deleteStockProduct.hidden = !existing;
  elements.stockDistributor.value = existing?.distributor || elements.stockDistributorFilter.value || getActiveStockDefaultDistributor();
  elements.stockApn.value = existing?.apn || "";
  elements.stockSupc.value = existing?.supc || "";
  elements.stockManufacturerNumber.value = existing?.manufacturerNumber || "";
  elements.stockGtin.value = existing?.gtin || "";
  elements.stockDescription.value = existing?.description || "";
  elements.stockPackaging.value = existing?.packaging || "";
  elements.stockStorage.value = existing?.storage || "";
  elements.stockSo.checked = existing?.so === "Yes";
  elements.stockVendor.value = existing?.vendor || "";
  elements.stockBrandType.value = existing?.brandType || "";
  elements.stockBrandName.value = existing?.brandName || "";
  elements.stockCategory.value = existing?.category || "";
  renderStockAttachmentList();
  elements.stockFormDialog.showModal();
  setTimeout(() => elements.stockVendor.focus(), 0);
}

function closeStockForm() {
  elements.stockFormDialog.close();
}

function handleStockAttachmentFiles(event) {
  const files = [...(event.target.files || [])];
  elements.stockAttachmentInput.value = "";
  if (!files.length) return;
  addStockAttachmentFiles(files, elements.stockAttachmentCategory.value || "Other");
}

function addStockAttachmentFiles(files, category) {
  const maxFileSize = 4 * 1024 * 1024;
  const oversized = files.filter((file) => file.size > maxFileSize);
  if (oversized.length) {
    alert(`${oversized.map((file) => file.name).join(", ")} is too large for this local version. Please keep attachments under 4 MB each.`);
  }
  const readableFiles = files.filter((file) => file.size <= maxFileSize);
  if (!readableFiles.length) return;
  Promise.all(
    readableFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.addEventListener("load", async () => {
            const id = crypto.randomUUID();
            const data = String(reader.result || "");
            const attachment = {
              id,
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              category,
              addedAt: new Date().toISOString()
            };
            try {
              await saveStockFileData(id, data);
              resolve(normalizeStockAttachment({ ...attachment, storageId: id }));
            } catch {
              resolve(normalizeStockAttachment({ ...attachment, data }));
            }
          });
          reader.addEventListener("error", reject);
          reader.readAsDataURL(file);
        })
    )
  )
    .then((attachments) => {
      currentStockAttachments = [...currentStockAttachments, ...attachments];
      renderStockAttachmentList();
    })
    .catch(() => alert("One of the product files could not be added."));
}

function renderStockAttachmentList() {
  if (!elements.stockAttachmentList) return;
  if (!currentStockAttachments.length) {
    elements.stockAttachmentList.innerHTML = `<div class="empty-state attachment-empty">No product files attached yet</div>`;
    return;
  }
  elements.stockAttachmentList.innerHTML = currentStockAttachments
    .map(
      (file) => `
        <div class="attachment-row stock-file-row">
          <div class="attachment-main">
            <strong>
              <span class="file-clip" aria-hidden="true">&#128206;</span>
              <span class="file-type-badge">${escapeHtml(file.category || "Other")}</span>
              <span class="file-name" title="${escapeAttribute(file.name)}">${escapeHtml(file.name)}</span>
            </strong>
            <span>${formatFileSize(file.size)}</span>
          </div>
          <div class="attachment-actions">
            <button class="attachment-link" type="button" data-preview-attachment="${escapeAttribute(file.id)}">Preview</button>
            <button class="remove-product" type="button" data-remove-stock-attachment="${escapeAttribute(file.id)}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
  elements.stockAttachmentList.querySelectorAll("[data-remove-stock-attachment]").forEach((button) => {
    button.addEventListener("click", () => {
      const removed = currentStockAttachments.find((file) => file.id === button.dataset.removeStockAttachment);
      if (removed?.storageId) removeStockFileData(removed.storageId);
      currentStockAttachments = currentStockAttachments.filter((file) => file.id !== button.dataset.removeStockAttachment);
      renderStockAttachmentList();
    });
  });
}

function positionDatePicker() {
  if (!datePickerInput) return;
  const picker = getDatePicker();
  const inputRect = datePickerInput.getBoundingClientRect();
  const pickerRect = picker.getBoundingClientRect();
  const margin = 8;
  const left = Math.min(Math.max(inputRect.left, margin), window.innerWidth - pickerRect.width - margin);
  const roomBelow = window.innerHeight - inputRect.bottom - margin;
  const top =
    roomBelow >= pickerRect.height || inputRect.top < pickerRect.height + margin
      ? inputRect.bottom + margin
      : inputRect.top - pickerRect.height - margin;
  picker.style.left = `${left}px`;
  picker.style.top = `${Math.max(margin, top)}px`;
}

async function prepareStockAttachmentsForSave(attachments) {
  const prepared = await Promise.all(
    attachments.map(async (file) => {
      const attachment = normalizeStockAttachment(file);
      if (!attachment.data || attachment.storageId) return attachment;
      try {
        const storageId = attachment.storageId || attachment.id;
        await saveStockFileData(storageId, attachment.data);
        return normalizeStockAttachment({ ...attachment, data: "", storageId });
      } catch {
        return attachment;
      }
    })
  );
  return prepared;
}

async function saveStockProduct() {
  const id = elements.stockId.value || crypto.randomUUID();
  const existing = stockProducts.find((product) => product.id === id);
  const attachments = await prepareStockAttachmentsForSave(currentStockAttachments);
  currentStockAttachments = attachments;
  const product = normalizeStockProduct({
    id,
    distributor: elements.stockDistributor.value,
    distributorNumber: elements.stockApn.value.trim() || elements.stockSupc.value.trim(),
    apn: elements.stockApn.value.trim(),
    supc: elements.stockSupc.value.trim(),
    manufacturerNumber: elements.stockManufacturerNumber.value.trim(),
    gtin: elements.stockGtin.value.trim(),
    description: elements.stockDescription.value.trim(),
    packaging: elements.stockPackaging.value.trim(),
    storage: elements.stockStorage.value,
    so: elements.stockSo.checked ? "Yes" : "",
    vendor: elements.stockVendor.value.trim(),
    brandType: elements.stockBrandType.value,
    brandName: elements.stockBrandName.value.trim(),
    category: elements.stockCategory.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    attachments,
    updatedAt: new Date().toISOString()
  });
  const previousProducts = stockProducts;
  stockProducts = existing ? stockProducts.map((item) => (item.id === id ? product : item)) : [product, ...stockProducts];
  if (!persistStockProducts()) {
    stockProducts = previousProducts;
    return;
  }
  updateStockCategorySuggestions();
  closeStockForm();
  renderStockLists();
}

function deleteCurrentStockProduct() {
  const id = elements.stockId.value;
  if (!id) return;
  const product = stockProducts.find((item) => item.id === id);
  if (!confirm(product?.description ? `Delete "${product.description}" from stock lists?` : "Delete this stock product?")) return;
  (product?.attachments || []).forEach((file) => {
    if (file.storageId) removeStockFileData(file.storageId);
  });
  stockProducts = stockProducts.filter((item) => item.id !== id);
  persistStockProducts();
  closeStockForm();
  renderStockLists();
}

function openStockImportDialog() {
  elements.stockImportForm.reset();
  elements.stockImportDistributor.value = elements.stockDistributorFilter.value || getActiveStockDefaultDistributor();
  elements.stockImportVendor.value = elements.stockVendorFilter.value.trim();
  elements.stockImportCategory.value = elements.stockCategoryFilter.value.trim();
  elements.stockImportDialog.showModal();
}

function closeStockImportDialog() {
  elements.stockImportDialog.close();
}

function openStockPrintDialog() {
  const products = getVisibleStockProducts();
  if (!products.length) {
    alert("No stock products to print in this view.");
    return;
  }
  const vendors = [...new Set(products.map((product) => product.vendor || "No vendor"))].sort((a, b) => a.localeCompare(b));
  elements.stockPrintVendor.innerHTML = `<option value="">All vendors</option>${vendors.map((vendor) => `<option value="${escapeAttribute(vendor)}">${escapeHtml(vendor)}</option>`).join("")}`;
  elements.stockPrintColumns.innerHTML = stockPrintColumns
    .map(
      (column) => `
        <label class="stock-print-column">
          <input type="checkbox" value="${escapeAttribute(column.key)}" checked />
          <span>${escapeHtml(column.label)}</span>
        </label>
      `
    )
    .join("");
  elements.stockPrintDialog.showModal();
}

function closeStockPrintDialog() {
  elements.stockPrintDialog.close();
}

function printSelectedStockList() {
  const selectedVendor = elements.stockPrintVendor.value;
  const printLayout = elements.stockPrintLayout.value || "continuous";
  const selectedColumns = [...elements.stockPrintColumns.querySelectorAll("input:checked")]
    .map((input) => input.value)
    .filter((key) => stockPrintColumns.some((column) => column.key === key));
  if (!selectedColumns.length) {
    alert("Please select at least one column to print.");
    return;
  }
  const products = getVisibleStockProducts().filter((product) => !selectedVendor || (product.vendor || "No vendor") === selectedVendor);
  if (!products.length) {
    alert("No products match that print selection.");
    return;
  }
  closeStockPrintDialog();
  openPrintWindow(renderStockPrintDocument(products, selectedColumns, selectedVendor, printLayout));
}

function importStockFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    alert("This local app can import CSV or tab-delimited files. In Excel, use Save As CSV, then upload that file here.");
    elements.stockImportFile.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const imported = parseStockText(String(reader.result || ""));
    if (!imported.length) {
      alert("No products were found. Make sure the file has a product/description column.");
      elements.stockImportFile.value = "";
      return;
    }
    const result = mergeImportedStockProducts(imported);
    persistStockProducts();
    updateStockCategorySuggestions();
    closeStockImportDialog();
    renderStockLists();
    elements.stockImportFile.value = "";
    alert(`Upload complete. Added ${result.added} new product${result.added === 1 ? "" : "s"} and updated ${result.updated} existing product${result.updated === 1 ? "" : "s"}.`);
  });
  reader.readAsText(file);
}

function mergeImportedStockProducts(imported) {
  let added = 0;
  let updated = 0;
  imported.forEach((rawProduct) => {
    const incoming = normalizeStockProduct(rawProduct);
    const matchIndex = stockProducts.findIndex((product) => stockProductsMatch(product, incoming));
    if (matchIndex < 0) {
      stockProducts = [incoming, ...stockProducts];
      added += 1;
      return;
    }
    const current = normalizeStockProduct(stockProducts[matchIndex]);
    const merged = mergeStockProduct(current, incoming);
    if (JSON.stringify(current) !== JSON.stringify(merged)) updated += 1;
    stockProducts = stockProducts.map((product, index) => (index === matchIndex ? merged : product));
  });
  return { added, updated };
}

function stockProductsMatch(existing, incoming) {
  const current = normalizeStockProduct(existing);
  const next = normalizeStockProduct(incoming);
  if (current.distributor !== next.distributor) return false;
  const exactFields = ["apn", "supc", "manufacturerNumber", "gtin"];
  if (exactFields.some((field) => current[field] && next[field] && current[field].toLowerCase() === next[field].toLowerCase())) return true;
  return Boolean(
    current.description &&
      next.description &&
      current.vendor &&
      next.vendor &&
      current.description.toLowerCase() === next.description.toLowerCase() &&
      current.vendor.toLowerCase() === next.vendor.toLowerCase()
  );
}

function mergeStockProduct(current, incoming) {
  const merged = { ...current };
  const fields = ["distributorNumber", "apn", "supc", "manufacturerNumber", "gtin", "description", "packaging", "storage", "vendor", "brandType", "brandName", "category", "so"];
  fields.forEach((field) => {
    if (!String(merged[field] || "").trim() && String(incoming[field] || "").trim()) {
      merged[field] = incoming[field];
    }
  });
  merged.updatedAt = new Date().toISOString();
  return normalizeStockProduct(merged);
}

function parseStockText(text) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows = parseDelimitedText(text, delimiter).filter((row) => row.some((cell) => String(cell).trim()));
  if (!rows.length) return [];
  const headerIndex = rows.findIndex((row) => row.some((cell) => /product|description|usf|supc|apn|brand/i.test(cell)));
  if (headerIndex < 0) return [];
  const headers = rows[headerIndex].map(normalizeHeader);
  const defaults = {
    distributor: elements.stockImportDistributor.value,
    vendor: elements.stockImportVendor.value.trim(),
    category: elements.stockImportCategory.value.trim(),
    storage: elements.stockImportStorage.value
  };
  let currentCategory = defaults.category;
  let currentVendor = defaults.vendor;
  const products = [];
  rows.slice(headerIndex + 1).forEach((row) => {
    const result = mapStockRow(row, headers, defaults, currentCategory, currentVendor);
    if (result.categoryOnly) {
      currentCategory = result.categoryOnly;
      return;
    }
    if (result.vendorOnly) {
      currentVendor = result.vendorOnly;
      return;
    }
    if (result.description) products.push(normalizeStockProduct(result));
  });
  return products;
}

function mapStockRow(row, headers, defaults, currentCategory, currentVendor) {
  const get = (...names) => {
    let index = headers.findIndex((header) => names.some((name) => header === name));
    if (index < 0) index = headers.findIndex((header) => names.some((name) => header.includes(name)));
    return index >= 0 ? String(row[index] || "").trim() : "";
  };
  const description = get("product", "description", "item");
  const apn = get("apn", "usf", "us foods");
  const supc = get("supc", "sysco");
  const distributorNumber = apn || supc || get("distributor");
  const manufacturerNumber = get("manufacturer number", "mfr", "upc");
  const gtin = get("gtin");
  const pack = get("pack");
  const size = get("size");
  const packaging = get("packaging") || [pack, size].filter(Boolean).join("/");
  const brandName = get("brand name", "brand");
  const vendor = get("vendor", "manufacturer") || currentVendor;
  const category = get("category") || currentCategory;
  const storage = normalizeStorage(get("storage", "temperature", "storage type")) || defaults.storage;
  const brandType = normalizeBrandType(get("brand type", "eb", "brand class"));
  const so = normalizeYes(get("so", "special order", "special"));
  if (!description && row.some((cell) => String(cell).trim())) {
    const label = row.find((cell) => String(cell).trim());
    return { categoryOnly: String(label || "").trim() };
  }
  return {
    id: crypto.randomUUID(),
    distributor: defaults.distributor,
    distributorNumber,
    apn,
    supc,
    manufacturerNumber,
    gtin,
    description,
    packaging,
    storage,
    vendor,
    brandType,
    brandName,
    category,
    so,
    createdAt: new Date().toISOString()
  };
}

function parseDelimitedText(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[#_/.-]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeStorage(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("frozen")) return "Frozen";
  if (text.includes("chill") || text.includes("refriger")) return "Chill";
  if (text.includes("dry")) return "Dry";
  return "";
}

function normalizeBrandType(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text === "eb" || text.includes("exclusive")) return "EB";
  if (text.includes("manufacturer") || text === "mb") return "MB";
  return "";
}

function normalizeYes(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (["yes", "y", "true", "1", "so"].includes(text)) return "Yes";
  return "";
}

function updateStockCategorySuggestions() {
  if (!elements.stockCategorySuggestions) return;
  const categories = [...new Set(stockDefaultCategories.concat(stockProducts.map((product) => product.category.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b));
  elements.stockCategorySuggestions.innerHTML = categories.map((category) => `<option value="${escapeAttribute(category)}"></option>`).join("");
}

function updateStockFilterOptions() {
  const selectedVendor = elements.stockVendorFilter.value;
  const selectedCategory = elements.stockCategoryFilter.value;
  const group = getActiveStockGroup();
  const groupedProducts = stockProducts.filter((product) => !group || group.distributors.includes(product.distributor));
  const vendors = [...new Set(groupedProducts.map((product) => product.vendor.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const categories = [...new Set(stockDefaultCategories.concat(groupedProducts.map((product) => product.category.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b));
  elements.stockVendorFilter.innerHTML = `<option value="">All</option>${vendors.map((vendor) => `<option value="${escapeAttribute(vendor)}">${escapeHtml(vendor)}</option>`).join("")}`;
  elements.stockCategoryFilter.innerHTML = `<option value="">All</option>${categories.map((category) => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`).join("")}`;
  if (selectedVendor && vendors.includes(selectedVendor)) elements.stockVendorFilter.value = selectedVendor;
  if (selectedCategory && categories.includes(selectedCategory)) elements.stockCategoryFilter.value = selectedCategory;
}

function updateMarketVisitControls() {
  const vendors = getVendorOptions();
  fillSelect(elements.marketManufacturerFilter, vendors, "All", elements.marketManufacturerFilter.value);
  fillSelect(elements.marketVisitVendor, vendors, "Choose vendor", elements.marketVisitVendor.value);
}

function renderMarketVisits() {
  updateMarketVisitControls();
  document.querySelectorAll("[data-market-type]").forEach((button) => button.classList.toggle("active-market-subtab", button.dataset.marketType === activeMarketType));
  document.querySelectorAll("[data-market-view]").forEach((button) => button.classList.toggle("active-market-view", button.dataset.marketView === activeMarketView));
  const visits = getVisibleMarketVisits();

  if (activeMarketView === "calendar") {
    renderMarketCalendar(visits);
    return;
  }

  const title = marketVisitTypes[activeMarketType];
  elements.marketContent.innerHTML = `
    <section class="quick-list-panel market-list-panel">
      <div class="quick-list-header market-list-header-compact">
        <div><p class="eyebrow">${escapeHtml(title)}</p></div>
        <span class="count-pill">${visits.length}</span>
      </div>
      ${visits.length ? `<div class="market-card-grid">${visits.map(renderMarketVisitCard).join("")}</div>` : `<div class="empty-state">No market visits yet</div>`}
    </section>
    <section class="market-detail-panel" id="marketDetailPanel"></section>
  `;
  elements.marketContent.querySelectorAll("[data-market-edit]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketVisitForm(marketVisits.find((visit) => visit.id === button.dataset.marketEdit));
    });
  });
  elements.marketContent.querySelectorAll("[data-market-view-detail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketVisitDetail(button.dataset.marketViewDetail);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea")) return;
      openMarketVisitDetail(card.dataset.marketCard);
    });
    card.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openMarketVisitDetail(card.dataset.marketCard);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-print]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketPrintOptions(button.dataset.marketPrint);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-ics]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      exportMarketVisitIcs(button.dataset.marketIcs);
    });
  });
  if (activeMarketDetailId) {
    const visit = marketVisits.find((item) => item.id === activeMarketDetailId);
    if (visit) renderMarketVisitDetail(visit);
  }
}

function openMarketVisitDetail(id, shouldScroll = true) {
  if (!id) return;
  activeMarketDetailId = id;
  activeMarketView = "list";
  renderMarketVisits();
  if (!shouldScroll) return;
  requestAnimationFrame(() => {
    elements.marketContent.querySelector("#marketDetailPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderMarketVisitCard(visit) {
  const dateText = visit.type === "manufacturer" ? formatDateRange(visit.startDate, visit.endDate) : [visit.startDate && formatDate(visit.startDate), visit.startTime].filter(Boolean).join(" ");
  return `
    <article class="market-card ${visit.id === activeMarketDetailId ? "active-market-card" : ""}" data-market-card="${escapeAttribute(visit.id)}" tabindex="0" role="button" aria-label="Open ${escapeAttribute(getMarketVisitDisplayName(visit))}">
      <div class="market-card-main">
        <h3>${escapeHtml(getMarketVisitDisplayName(visit))}</h3>
        ${dateText ? `<p class="market-card-date">${escapeHtml(dateText)}</p>` : `<p class="market-card-date">No date</p>`}
      </div>
      <div class="table-actions">
        <button class="edit-card market-card-action" type="button" data-market-view-detail="${escapeAttribute(visit.id)}">View</button>
        <button class="edit-card market-card-action" type="button" data-market-edit="${escapeAttribute(visit.id)}">Edit</button>
        <button class="edit-card market-card-action" type="button" data-market-print="${escapeAttribute(visit.id)}">Print Schedule</button>
        <button class="edit-card market-card-action" type="button" data-market-ics="${escapeAttribute(visit.id)}">Add to calendar</button>
      </div>
    </article>
  `;
}

function renderMarketVisitDetail(visit) {
  const panel = elements.marketContent.querySelector("#marketDetailPanel");
  if (!panel) return;
  const products = getMarketVisitProducts(visit);
  const operators = getMarketVisitOperators(visit);
  if (visit.type === "manufacturer") {
    renderManufacturerVisitDetail(panel, visit, products, operators);
    return;
  }
  panel.innerHTML = `
    <div class="market-detail-header">
      <div>
        <h2 class="market-detail-title">${escapeHtml(getMarketVisitDisplayName(visit) || "Market Visit")}</h2>
      </div>
      <div class="table-actions">
        <button class="edit-card" type="button" data-detail-print="${escapeAttribute(visit.id)}">Print</button>
        <button class="edit-card" type="button" data-detail-followup="${escapeAttribute(visit.id)}">Create Follow-Up</button>
        <button class="edit-card" type="button" data-detail-close>Close</button>
      </div>
    </div>
    <div class="market-detail-tabs">
      <section><h3>Overview</h3>${renderMarketOverview(visit)}</section>
      <section><h3>Products</h3>${renderMarketProductsSection(visit, products)}</section>
      <section><h3>Calendar / Schedule</h3>${renderMarketCallsSection(visit)}</section>
      <section><h3>Operators</h3>${renderMarketOperatorsSection(visit, operators)}</section>
      <section><h3>Notes</h3><textarea class="market-notes-editor" data-market-notes="${escapeAttribute(visit.id)}">${escapeHtml(visit.notes)}</textarea></section>
    </div>
  `;
  bindMarketDetailActions(panel, visit);
}

function renderManufacturerVisitDetail(panel, visit, products, operators) {
  const calls = getMarketVisitCalendarCalls(visit);
  const selectedCall = calls[0] || null;
  panel.innerHTML = `
    <div class="manufacturer-visit-hero">
      <div>
        <div class="badge-row">
          ${visit.vendor ? `<span class="badge manufacturer-pill">${escapeHtml(visit.vendor)}</span>` : ""}
          ${visit.location ? `<span class="badge">${escapeHtml(visit.location)}</span>` : ""}
          <span class="badge">${escapeHtml(formatDateRange(visit.startDate, visit.endDate) || "No date")}</span>
        </div>
        <h2>${escapeHtml(getMarketVisitDisplayName(visit))}</h2>
        ${visit.notes ? `<p>${escapeHtml(visit.notes)}</p>` : `<p>Build the appointment schedule, products, operators, and follow-ups for this manufacturer visit.</p>`}
        <div class="manufacturer-stats">
          <div><span>Time in market</span><strong>${getMarketVisitDateKeys(visit).length || 0}</strong><small>${getMarketVisitDateKeys(visit).length === 1 ? "day" : "days"}</small></div>
          <div><span>Active schedule</span><strong>${calls.length}</strong><small>${calls.length === 1 ? "appointment" : "appointments"}</small></div>
          <div><span>Products</span><strong>${products.length}</strong><small>selected</small></div>
          <div><span>Operators</span><strong>${operators.length}</strong><small>planned</small></div>
        </div>
      </div>
      <div class="manufacturer-actions">
        <button class="edit-card" type="button" data-detail-close>Back to market visits</button>
        <button class="primary-action market-add-action" type="button" data-scroll-add-call>Add appointment</button>
        <button class="edit-card" type="button" data-detail-print="${escapeAttribute(visit.id)}">Print calendar</button>
        <button class="edit-card" type="button" data-market-ics="${escapeAttribute(visit.id)}">Share calendar</button>
      </div>
    </div>
    <div class="manufacturer-detail-grid">
      <section class="market-detail-tabs">
        <section><h3>Products</h3>${renderMarketProductsSection(visit, products)}</section>
        <section><h3>Schedule</h3>${renderMarketCallsSection(visit, false)}</section>
        <section><h3>Operators</h3>${renderMarketOperatorsSection(visit, operators)}</section>
        <section><h3>Notes</h3><textarea class="market-notes-editor" data-market-notes="${escapeAttribute(visit.id)}">${escapeHtml(visit.notes)}</textarea></section>
      </section>
      <section class="manufacturer-week-panel">
        <div class="quick-list-header"><div><p class="eyebrow">Weekly overview</p><h2>Monday to Friday schedule</h2></div></div>
        <div class="manufacturer-calendar-layout">
          ${renderManufacturerWeekGrid(visit, selectedCall?.id || "")}
          <aside class="market-call-preview" data-market-call-preview>
            ${renderMarketCallPreview(visit, selectedCall)}
          </aside>
        </div>
      </section>
    </div>
  `;
  bindMarketDetailActions(panel, visit);
  panel.querySelector("[data-scroll-add-call]")?.addEventListener("click", () => panel.querySelector(".market-call-add")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  panel.querySelector("[data-market-ics]")?.addEventListener("click", () => exportMarketVisitIcs(visit.id));
}

function bindMarketWeekPreview(panel, visit) {
  panel.querySelectorAll("[data-week-call]").forEach((button) => {
    button.addEventListener("click", () => {
      const call = getMarketVisitCalendarCalls(visit).find((item) => item.id === button.dataset.weekCall);
      panel.querySelectorAll("[data-week-call]").forEach((item) => item.classList.toggle("active-week-call", item === button));
      const preview = panel.querySelector("[data-market-call-preview]");
      if (preview) preview.innerHTML = renderMarketCallPreview(visit, call);
    });
  });
}

function renderMarketOverview(visit) {
  return `
    <dl class="market-overview-grid">
      <div><dt>Type</dt><dd>${escapeHtml(marketVisitTypes[visit.type])}</dd></div>
      <div><dt>Date</dt><dd>${escapeHtml(formatDateRange(visit.startDate, visit.endDate) || "No date")}</dd></div>
      <div><dt>Time</dt><dd>${escapeHtml([visit.startTime, visit.endTime].filter(Boolean).join(" - ") || "No time")}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(visit.location || "No location")}</dd></div>
      <div><dt>Sales reps</dt><dd>${escapeHtml(visit.salesReps.join(", ") || "No reps")}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(visit.status)}</dd></div>
      ${visit.vendor ? `<div><dt>Manufacturer</dt><dd>${escapeHtml(visit.vendor)}</dd></div>` : ""}
      ${visit.visitorName ? `<div><dt>Visitor</dt><dd>${escapeHtml(visit.visitorName)}</dd></div>` : ""}
    </dl>
  `;
}

function renderMarketOperatorsSection(visit, operators) {
  return `
    <div class="market-inline-add">
      <select data-add-operator-select><option value="">Choose existing operator</option>${addressBook.filter((entry) => !entry.archivedAt).map((entry) => `<option value="${escapeAttribute(entry.id)}">${escapeHtml(entry.operation)}</option>`).join("")}</select>
      <input data-add-operator-name placeholder="Or type new operator" />
      <button class="small-action" type="button" data-add-market-operator="${escapeAttribute(visit.id)}">+ Operator</button>
    </div>
    ${operators.length ? operators.map((operator) => renderMarketOperator(visit, operator)).join("") : `<div class="empty-state">No operators attached yet</div>`}
  `;
}

function renderMarketOperator(visit, operator) {
  const products = getMarketVisitProducts(visit);
  const operatorName = operator.operatorName || getOperatorName(operator.operatorId) || "Operator";
  return `
    <details class="market-nested-card market-operator-card">
      <summary class="market-operator-summary">
        <span>
          <strong>${escapeHtml(operatorName)}</strong>
          <small>${products.length} ${products.length === 1 ? "product" : "products"} planned</small>
        </span>
        <span class="market-operator-actions">
          <button class="edit-card market-convert-lead" type="button" data-convert-market-operator="${escapeAttribute(operator.id)}">Convert to Lead</button>
          <button class="remove-product" type="button" data-remove-market-operator="${escapeAttribute(operator.id)}" data-remove-market-operator-id="${escapeAttribute(operator.operatorId || "")}" data-remove-market-operator-name="${escapeAttribute(operatorName)}">Remove</button>
        </span>
      </summary>
      <div class="market-operator-detail">
        ${products.length ? `<div class="operator-product-notes">${products.map((product) => renderOperatorProductNote(operator, product)).join("")}</div>` : `<div class="empty-state">Add products to this visit, then they will show here for this operator.</div>`}
        <label class="operator-general-note"><span>Operator note</span><textarea class="market-operator-note" data-market-operator-notes="${escapeAttribute(operator.id)}" placeholder="Operator notes, feedback, next step...">${escapeHtml(operator.notes)}</textarea></label>
      </div>
    </details>
  `;
}

function renderOperatorProductNote(operator, product) {
  const number = product.apn || product.supc || product.manufacturerNumber || "";
  const note = operator.productNotes?.[product.id]?.note || "";
  return `
    <div class="operator-product-note-row">
      <label class="operator-product-select">
        <input type="checkbox" data-operator-lead-product="${escapeAttribute(operator.id)}" value="${escapeAttribute(product.id)}" checked />
      </label>
      <div>
        <strong>${escapeHtml(product.description || "Product")}</strong>
        <span>${escapeHtml([number, product.vendor, product.packaging, product.storage].filter(Boolean).join(" | "))}</span>
      </div>
      <textarea data-market-operator-product-note="${escapeAttribute(operator.id)}" data-product-id="${escapeAttribute(product.id)}" placeholder="Product note for this operator...">${escapeHtml(note)}</textarea>
    </div>
  `;
}

function renderMarketProductsSection(visit, products) {
  if (visit.type === "pc") return renderPcMarketProductsSection(visit, products);
  return `
    <div class="section-label-row market-product-actions-row">
      <span>Products</span>
      <div class="market-section-actions">
        <button class="edit-card market-section-action" type="button" data-market-print-products="${escapeAttribute(visit.id)}">Print Products</button>
      </div>
    </div>
    <div class="market-product-add-row">
      <input data-add-product-search list="marketProductSuggestions" placeholder="Search product, APN, SUPC, vendor..." autocomplete="off" />
      <datalist id="marketProductSuggestions">${getMarketProductCandidates(visit).map((product) => `<option value="${escapeAttribute(formatMarketProductOption(product))}"></option>`).join("")}</datalist>
      <button class="small-action" type="button" data-add-market-product="${escapeAttribute(visit.id)}">+ Product</button>
    </div>
    ${products.length ? `<div class="market-product-list">${products.map(renderMarketProductChip).join("")}</div>` : `<div class="empty-state">No products selected yet</div>`}
  `;
}

function renderPcMarketProductsSection(visit, products) {
  const numberLabel = pcMarketNumberMode === "supc" ? "SUPC" : "APN";
  return `
    <div class="pc-market-products">
      <div class="section-label-row">
        <span>Products</span>
        <div class="market-section-actions">
          <div class="pc-product-number-toggle" role="group" aria-label="Product number shown">
            <label><input type="radio" name="pcMarketNumberMode" value="apn" ${pcMarketNumberMode === "apn" ? "checked" : ""} /> APN</label>
            <label><input type="radio" name="pcMarketNumberMode" value="supc" ${pcMarketNumberMode === "supc" ? "checked" : ""} /> SUPC</label>
          </div>
          <button class="edit-card market-section-action" type="button" data-market-print-products="${escapeAttribute(visit.id)}">Print Products</button>
        </div>
      </div>
      <div class="pc-market-product-entry">
        <input data-add-product-search list="marketProductSuggestions" placeholder="Search APN, SUPC, product, vendor, pack, or storage..." autocomplete="off" />
        <button class="small-action market-add-product-row" type="button" data-add-market-product="${escapeAttribute(visit.id)}">+ Add Product</button>
        <datalist id="marketProductSuggestions">${getMarketProductCandidates(visit).map((product) => `<option value="${escapeAttribute(formatMarketProductOption(product))}"></option>`).join("")}</datalist>
      </div>
      <div class="pc-market-product-head">
        <span>${numberLabel}</span>
        <span>Vendor / Brand</span>
        <span>Description</span>
        <span>Packaging</span>
        <span>Storage</span>
        <span></span>
      </div>
      <div class="pc-market-product-list">
        ${products.length ? products.map(renderPcMarketProductRow).join("") : `<div class="empty-state">No products selected yet</div>`}
      </div>
    </div>
  `;
}

function renderPcMarketProductRow(product) {
  const number = pcMarketNumberMode === "supc" ? product.supc || "" : product.apn || "";
  return `
    <div class="pc-market-product-row" data-pc-product-row="${escapeAttribute(product.id)}">
      <input class="pc-product-number" data-pc-product-number="${escapeAttribute(product.id)}" list="marketProductSuggestions" value="${escapeAttribute(number)}" placeholder="${pcMarketNumberMode === "supc" ? "SUPC" : "APN"}" />
      <input class="pc-product-vendor" value="${escapeAttribute(product.vendor || product.brandName || "")}" readonly />
      <input class="pc-product-description" value="${escapeAttribute(product.description || "")}" readonly />
      <input class="pc-product-packaging" value="${escapeAttribute(product.packaging || "")}" readonly />
      <input class="pc-product-storage" value="${escapeAttribute(product.storage || "")}" readonly />
      <button class="remove-product" type="button" data-remove-market-product="${escapeAttribute(product.id)}">Remove</button>
    </div>
  `;
}

function renderMarketProductChip(product) {
  const number = product.apn || product.supc || product.manufacturerNumber || "";
  return `
    <div class="market-product-chip">
      <div>
        <strong>${escapeHtml(product.description || "Product")}</strong>
        <span>${escapeHtml([number, product.vendor, product.brandName].filter(Boolean).join(" | "))}</span>
      </div>
      <button class="remove-product" type="button" data-remove-market-product="${escapeAttribute(product.id)}">Remove</button>
    </div>
  `;
}

function renderMarketCallsSection(visit, includeCalendar = visit.type === "pc") {
  const calls = getMarketVisitCalendarCalls(visit);
  const selectedCall = calls[0] || null;
  return `
    <div class="section-label-row market-calendar-actions-row">
      <span></span>
      <div class="market-section-actions">
        <button class="edit-card market-section-action" type="button" data-market-print-calendar="${escapeAttribute(visit.id)}">Print Calendar</button>
        <button class="edit-card market-section-action" type="button" data-market-share-calendar="${escapeAttribute(visit.id)}">Share Calendar</button>
        <button class="edit-card market-section-action" type="button" data-market-download-calendar="${escapeAttribute(visit.id)}">Download Calendar</button>
      </div>
    </div>
    <div class="market-inline-add market-call-add">
      <input data-call-date type="date" value="${escapeAttribute(visit.startDate || "")}" />
      <select data-call-start>${renderMarketTimeOptions("8:00 AM")}</select>
      <select data-call-end>${renderMarketTimeOptions("9:00 AM")}</select>
      <select data-call-operator><option value="">Choose operator</option>${addressBook.filter((entry) => !entry.archivedAt).map((entry) => `<option value="${escapeAttribute(entry.id)}">${escapeHtml(entry.operation)}</option>`).join("")}</select>
      <input data-call-operator-name placeholder="Or type new operator" />
      <input data-call-reps placeholder="Sales reps" value="${escapeAttribute(visit.salesReps.join(", "))}" />
      <button class="small-action" type="button" data-add-market-call="${escapeAttribute(visit.id)}">+ Call</button>
    </div>
    ${
      includeCalendar
        ? `<div class="market-schedule-calendar">
            <div class="quick-list-header"><div><h2>Weekly Overview</h2></div></div>
            <div class="manufacturer-calendar-layout">
              ${renderManufacturerWeekGrid(visit, selectedCall?.id || "")}
              <aside class="market-call-preview" data-market-call-preview>
                ${renderMarketCallPreview(visit, selectedCall)}
              </aside>
            </div>
          </div>`
        : visit.calls.length
          ? `<table class="quick-table market-call-table"><thead><tr><th>Date</th><th>Time</th><th>Operator</th><th>Location</th><th>Reps</th><th>Notes</th><th></th></tr></thead><tbody>${visit.calls.map((call) => renderMarketCallRow(visit, call)).join("")}</tbody></table>`
          : `<div class="empty-state">No calls scheduled yet</div>`
    }
  `;
}

function renderMarketTimeOptions(selectedValue = "") {
  const options = [];
  for (let hour = 7; hour <= 18; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 18 && minute > 0) continue;
      const label = formatTimeOption(hour, minute);
      options.push(`<option value="${escapeAttribute(label)}"${label === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`);
    }
  }
  return options.join("");
}

function formatTimeOption(hour, minute) {
  const meridiem = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function renderMarketCallRow(visit, call) {
  return `<tr>
    <td>${call.date ? formatDate(call.date) : ""}</td>
    <td>${escapeHtml([call.startTime, call.endTime].filter(Boolean).join(" - "))}</td>
    <td>${escapeHtml(call.operatorName || getOperatorName(call.operatorId) || "")}</td>
    <td>${escapeHtml(call.location || "")}</td>
    <td>${escapeHtml(call.salesReps.join(", ") || visit.salesReps.join(", "))}</td>
    <td><input data-call-note="${escapeAttribute(call.id)}" value="${escapeAttribute(call.notes)}" /></td>
    <td><button class="remove-product" type="button" data-remove-market-call="${escapeAttribute(call.id)}">Remove</button></td>
  </tr>`;
}

function renderManufacturerWeekGrid(visit, selectedCallId = "") {
  const weekStart = startOfCalendarWeek(visit.startDate ? parseLocalDate(visit.startDate) : startOfToday());
  const days = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const calls = getMarketVisitCalendarCalls(visit).filter((call) => call.date);
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  return `
    <div class="manufacturer-week-grid">
      <div class="week-time-heading">Time</div>
      ${days.map((date) => `<div class="week-day-heading ${isDateInMarketVisit(visit, date) ? "" : "week-day-outside"}"><strong>${escapeHtml(date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))}</strong><span>${calls.filter((call) => call.date === toDateKey(date)).length} appointments</span></div>`).join("")}
      ${hours
        .map(
          (hour) => `
            <div class="week-time-slot">${formatHourLabel(hour)}</div>
            ${days
              .map((date) => {
                const dayCalls = calls.filter((call) => call.date === toDateKey(date) && getCallHour(call) === hour);
                return `<div class="week-cell ${isDateInMarketVisit(visit, date) ? "" : "week-day-outside"}">${dayCalls.map((call) => renderWeekCallBlock(call, selectedCallId)).join("")}</div>`;
              })
              .join("")}
          `
        )
        .join("")}
    </div>
  `;
}

function isDateInMarketVisit(visit, date) {
  if (!visit.startDate && !visit.endDate) return true;
  const key = toDateKey(date);
  const start = visit.startDate || visit.endDate;
  const end = visit.endDate || visit.startDate;
  return key >= start && key <= end;
}

function getCallHour(call) {
  const match = String(call.startTime || "").match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return 8;
  let hour = Number(match[1]);
  const meridiem = (match[2] || "").toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return Math.max(8, Math.min(17, hour));
}

function formatHourLabel(hour) {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function renderWeekCallBlock(call, selectedCallId = "") {
  return `
    <button class="week-call-block ${call.id === selectedCallId ? "active-week-call" : ""}" type="button" data-week-call="${escapeAttribute(call.id)}">
      <strong>${escapeHtml(call.operatorName || getOperatorName(call.operatorId) || "Appointment")}</strong>
      <span>${escapeHtml([call.startTime, call.endTime].filter(Boolean).join(" - "))}</span>
      ${call.status ? `<small>${escapeHtml(call.status)}</small>` : ""}
    </button>
  `;
}

function renderMarketCallPreview(visit, call) {
  if (!call) {
    return `
      <div class="market-call-preview-empty">
        <p class="eyebrow">Appointment details</p>
        <h3>No appointment selected</h3>
        <p>Add a call or meeting, then click it on the calendar to preview the details here.</p>
      </div>
    `;
  }
  return `
    <p class="eyebrow">Appointment details</p>
    <h3>${escapeHtml(call.operatorName || getOperatorName(call.operatorId) || "Appointment")}</h3>
    <dl class="market-call-preview-grid">
      <div><dt>Date</dt><dd>${escapeHtml(call.date ? formatDate(call.date) : "No date")}</dd></div>
      <div><dt>Time</dt><dd>${escapeHtml([call.startTime, call.endTime].filter(Boolean).join(" - ") || "No time")}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(call.location || visit.location || "No location")}</dd></div>
      <div><dt>Sales reps</dt><dd>${escapeHtml((call.salesReps?.length ? call.salesReps : visit.salesReps).join(", ") || "No reps")}</dd></div>
      ${call.manufacturerContact || visit.visitorName ? `<div><dt>Manufacturer contact</dt><dd>${escapeHtml(call.manufacturerContact || visit.visitorName)}</dd></div>` : ""}
    </dl>
    ${call.notes ? `<div class="market-call-preview-notes"><strong>Notes</strong><p>${escapeHtml(call.notes)}</p></div>` : ""}
  `;
}

function renderMarketCalendar(visits) {
  const calls = visits.flatMap((visit) => getMarketVisitCalendarCalls(visit));
  const grouped = groupBy(calls, (call) => call.date || "No date");
  const dates = Object.keys(grouped).sort();
  const selectedCall = calls[0] || null;
  const selectedVisit = selectedCall ? visits.find((visit) => visit.id === selectedCall.visitId) : null;
  elements.marketContent.innerHTML = `
    <div class="market-agenda-layout">
      <section class="quick-list-panel market-calendar-panel">
        <div class="quick-list-header"><div><p class="eyebrow">${escapeHtml(marketVisitTypes[activeMarketType])}</p><h2>Calendar / agenda</h2></div><span class="count-pill">${calls.length}</span></div>
        ${dates.length ? dates.map((date) => `<section class="market-agenda-day"><h3>${date === "No date" ? "No date" : escapeHtml(formatDate(date))}</h3>${grouped[date].map((call) => renderMarketAgendaCall(call, selectedCall?.id || "")).join("")}</section>`).join("") : `<div class="empty-state">No scheduled calls for this view</div>`}
      </section>
      <aside class="market-call-preview market-agenda-preview" data-market-agenda-preview>
        ${selectedVisit ? renderMarketCallPreview(selectedVisit, selectedCall) : renderMarketCallPreview({ salesReps: [] }, null)}
      </aside>
    </div>
  `;
  elements.marketContent.querySelectorAll("[data-market-agenda-call]").forEach((button) => {
    button.addEventListener("click", () => {
      const call = calls.find((item) => item.id === button.dataset.marketAgendaCall);
      const visit = call ? visits.find((item) => item.id === call.visitId) : null;
      elements.marketContent.querySelectorAll("[data-market-agenda-call]").forEach((item) => item.classList.toggle("active-agenda-call", item === button));
      const preview = elements.marketContent.querySelector("[data-market-agenda-preview]");
      if (preview && visit) preview.innerHTML = renderMarketCallPreview(visit, call);
    });
  });
}

function renderMarketAgendaCall(call, selectedCallId = "") {
  return `<button class="market-agenda-call ${call.id === selectedCallId ? "active-agenda-call" : ""}" type="button" data-market-agenda-call="${escapeAttribute(call.id)}">
    <strong>${escapeHtml(call.title)}</strong>
    <span>${escapeHtml([call.startTime, call.endTime].filter(Boolean).join(" - "))}</span>
    <span>${escapeHtml([call.operatorName, call.location, call.salesReps.join(", ")].filter(Boolean).join(" | "))}</span>
  </button>`;
}

function bindMarketDetailActions(panel, visit) {
  panel.querySelector("[data-detail-close]")?.addEventListener("click", () => {
    activeMarketDetailId = "";
    renderMarketVisits();
  });
  panel.querySelector("[data-detail-print]")?.addEventListener("click", () => openMarketPrintOptions(visit.id));
  panel.querySelector("[data-detail-followup]")?.addEventListener("click", () => createMarketFollowUp(visit));
  panel.querySelector("[data-market-print-products]")?.addEventListener("click", () => printMarketVisit(visit.id, { schedule: false, products: true }));
  panel.querySelector("[data-market-print-calendar]")?.addEventListener("click", () => printMarketVisit(visit.id, { schedule: true, products: false }));
  panel.querySelector("[data-market-download-calendar]")?.addEventListener("click", () => exportMarketVisitIcs(visit.id));
  panel.querySelector("[data-market-share-calendar]")?.addEventListener("click", () => shareMarketVisitCalendar(visit.id));
  panel.querySelectorAll("input[name='pcMarketNumberMode']").forEach((input) => {
    input.addEventListener("change", () => {
      pcMarketNumberMode = input.value === "supc" ? "supc" : "apn";
      renderMarketVisits();
    });
  });
  panel.querySelector("[data-add-market-product]")?.addEventListener("click", () => {
    const product = findMarketProductFromSearch(panel.querySelector("[data-add-product-search]")?.value || "", visit);
    if (!product || visit.productIds.includes(product.id)) return;
    updateMarketVisit(visit.id, { productIds: [...visit.productIds, product.id] });
  });
  panel.querySelector("[data-add-product-search]")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    setTimeout(() => panel.querySelector("[data-add-market-product]")?.click(), 0);
  });
  panel.querySelectorAll("[data-pc-product-number]").forEach((input) => {
    const replaceProduct = () => {
      const oldProductId = input.dataset.pcProductNumber;
      const product = findMarketProductFromSearch(input.value || "", { ...visit, productIds: visit.productIds.filter((id) => id !== oldProductId) });
      if (!product || product.id === oldProductId || visit.productIds.includes(product.id)) return;
      updateMarketVisit(visit.id, {
        productIds: visit.productIds.map((id) => (id === oldProductId ? product.id : id)),
        operatorLinks: visit.operatorLinks.map((link) => ({ ...link, productIds: link.productIds.map((id) => (id === oldProductId ? product.id : id)) })),
        calls: visit.calls.map((call) => ({ ...call, productIds: call.productIds.map((id) => (id === oldProductId ? product.id : id)) }))
      });
    };
    input.addEventListener("change", replaceProduct);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      replaceProduct();
    });
  });
  panel.querySelectorAll("[data-remove-market-product]").forEach((button) => {
    button.addEventListener("click", () => {
      updateMarketVisit(visit.id, {
        productIds: visit.productIds.filter((id) => id !== button.dataset.removeMarketProduct),
        operatorLinks: visit.operatorLinks.map((link) => ({ ...link, productIds: link.productIds.filter((id) => id !== button.dataset.removeMarketProduct) })),
        calls: visit.calls.map((call) => ({ ...call, productIds: call.productIds.filter((id) => id !== button.dataset.removeMarketProduct) }))
      });
    });
  });
  panel.querySelector("[data-add-market-operator]")?.addEventListener("click", () => {
    const operatorId = panel.querySelector("[data-add-operator-select]")?.value || "";
    const typedName = panel.querySelector("[data-add-operator-name]")?.value.trim() || "";
    const operatorName = operatorId ? getOperatorName(operatorId) : typedName;
    if (!operatorName) return;
    updateMarketVisit(visit.id, { operatorLinks: [...visit.operatorLinks, normalizeMarketOperatorLink({ operatorId, operatorName, productIds: [...visit.productIds] })] });
  });
  panel.querySelectorAll("[data-remove-market-operator]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const removeId = button.dataset.removeMarketOperator || "";
      const removeOperatorId = button.dataset.removeMarketOperatorId || "";
      const removeName = button.dataset.removeMarketOperatorName || "";
      updateMarketVisit(visit.id, {
        operatorLinks: visit.operatorLinks.filter((link) => {
          const linkName = link.operatorName || getOperatorName(link.operatorId);
          return link.id !== removeId && link.operatorId !== removeOperatorId && linkName !== removeName;
        }),
        calls: visit.calls.filter((call) => {
          const callName = call.operatorName || getOperatorName(call.operatorId);
          return `call-${call.id}` !== removeId && call.operatorId !== removeOperatorId && callName !== removeName;
        })
      });
    })
  );
  panel.querySelectorAll("[data-convert-market-operator]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      convertMarketOperatorToLead(visit, button.dataset.convertMarketOperator, panel);
    })
  );
  panel.querySelectorAll("[data-market-operator-notes]").forEach((textarea) => {
    textarea.addEventListener("input", () => saveMarketOperatorDataWithoutRender(visit.id, textarea.dataset.marketOperatorNotes, { notes: textarea.value }));
  });
  panel.querySelectorAll("[data-market-operator-product-note]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const operatorId = textarea.dataset.marketOperatorProductNote;
      const productId = textarea.dataset.productId;
      saveMarketOperatorProductNoteWithoutRender(visit.id, operatorId, productId, textarea.value);
    });
  });
  panel.querySelector("[data-add-market-call]")?.addEventListener("click", () => {
    const operatorId = panel.querySelector("[data-call-operator]")?.value || "";
    const typedOperator = panel.querySelector("[data-call-operator-name]")?.value.trim() || "";
    const operatorName = operatorId ? getOperatorName(operatorId) : typedOperator;
    const call = normalizeMarketCall({
      date: panel.querySelector("[data-call-date]")?.value || visit.startDate,
      startTime: panel.querySelector("[data-call-start]")?.value || "",
      endTime: panel.querySelector("[data-call-end]")?.value || "",
      operatorId,
      operatorName,
      location: visit.location,
      salesReps: normalizeStringList(panel.querySelector("[data-call-reps]")?.value || visit.salesReps.join(", ")),
      manufacturerContact: visit.visitorName,
      productIds: [...visit.productIds],
      status: "Planned"
    });
    updateMarketVisit(visit.id, { calls: [...visit.calls, call] });
  });
  panel.querySelectorAll("[data-remove-market-call]").forEach((button) => button.addEventListener("click", () => updateMarketVisit(visit.id, { calls: visit.calls.filter((call) => call.id !== button.dataset.removeMarketCall) })));
  panel.querySelectorAll("[data-call-note]").forEach((input) => input.addEventListener("change", () => updateMarketVisit(visit.id, { calls: visit.calls.map((call) => (call.id === input.dataset.callNote ? { ...call, notes: input.value } : call)) })));
  panel.querySelector("[data-market-notes]")?.addEventListener("change", (event) => updateMarketVisit(visit.id, { notes: event.target.value }));
  bindMarketWeekPreview(panel, visit);
}

function openMarketVisitForm(visit, typeOverride) {
  const existing = visit || null;
  const type = existing?.type || typeOverride || activeMarketType;
  if (!existing) activeMarketType = type;
  elements.marketVisitFormTitle.textContent = existing ? "Edit Market Visit" : `Create ${marketVisitTypes[type]}`;
  elements.marketVisitId.value = existing?.id || "";
  elements.marketVisitType.value = type;
  elements.marketVisitName.value = existing?.name || "";
  elements.marketVisitVendor.value = existing?.vendor || "";
  elements.marketVisitorName.value = existing?.visitorName || "";
  elements.marketStartDate.value = existing?.startDate || "";
  elements.marketEndDate.value = existing?.endDate || existing?.startDate || "";
  elements.marketStartTime.value = existing?.startTime || "";
  elements.marketEndTime.value = existing?.endTime || "";
  elements.marketLocation.value = existing?.location || "";
  elements.marketSalesReps.value = existing?.salesReps?.join(", ") || "";
  elements.marketStatus.value = existing?.status || "Planned";
  elements.marketNotes.value = existing?.notes || "";
  document.querySelectorAll(".market-pc-field").forEach((field) => (field.hidden = type !== "pc"));
  document.querySelectorAll(".market-mfr-field").forEach((field) => (field.hidden = type !== "manufacturer"));
  elements.deleteMarketVisit.hidden = !existing;
  elements.marketVisitFormDialog.showModal();
}

function closeMarketVisitForm() {
  elements.marketVisitFormDialog.close();
}

function saveMarketVisit() {
  const id = elements.marketVisitId.value || crypto.randomUUID();
  const existing = marketVisits.find((visit) => visit.id === id);
  const type = elements.marketVisitType.value || activeMarketType;
  const vendor = elements.marketVisitVendor.value.trim();
  const visit = normalizeMarketVisit({
    ...(existing || {}),
    id,
    type,
    name: elements.marketVisitName.value.trim() || (type === "manufacturer" ? `${vendor || "Manufacturer"} Market Visit` : "Market Visit"),
    vendor,
    visitorName: elements.marketVisitorName.value.trim(),
    startDate: elements.marketStartDate.value,
    endDate: elements.marketEndDate.value || elements.marketStartDate.value,
    startTime: elements.marketStartTime.value,
    endTime: elements.marketEndTime.value,
    location: elements.marketLocation.value.trim(),
    salesReps: normalizeStringList(elements.marketSalesReps.value),
    status: elements.marketStatus.value,
    notes: elements.marketNotes.value.trim(),
    productIds: existing?.productIds || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  marketVisits = existing ? marketVisits.map((item) => (item.id === id ? visit : item)) : [visit, ...marketVisits];
  activeMarketType = type;
  activeMarketDetailId = id;
  persistMarketVisits();
  closeMarketVisitForm();
  renderMarketVisits();
}

function deleteCurrentMarketVisit() {
  const id = elements.marketVisitId.value;
  if (!id) return;
  if (!confirm("Delete this market visit?")) return;
  marketVisits = marketVisits.filter((visit) => visit.id !== id);
  persistMarketVisits();
  closeMarketVisitForm();
  activeMarketDetailId = "";
  renderMarketVisits();
}

function updateMarketVisit(id, patch) {
  marketVisits = marketVisits.map((visit) => (visit.id === id ? normalizeMarketVisit({ ...visit, ...patch, updatedAt: new Date().toISOString() }) : visit));
  persistMarketVisits();
  renderMarketVisits();
}

function saveMarketProductNote(visit, productId, key, value) {
  updateMarketVisit(visit.id, { productNotes: { ...visit.productNotes, [productId]: { ...(visit.productNotes?.[productId] || {}), [key]: value } } });
}

function saveMarketOperatorDataWithoutRender(visitId, operatorId, patch) {
  marketVisits = marketVisits.map((visit) => {
    if (visit.id !== visitId) return visit;
    return normalizeMarketVisit({
      ...visit,
      operatorLinks: visit.operatorLinks.map((link) => (link.id === operatorId ? { ...link, ...patch } : link)),
      updatedAt: new Date().toISOString()
    });
  });
  persistMarketVisits();
}

function saveMarketOperatorProductNoteWithoutRender(visitId, operatorId, productId, note) {
  marketVisits = marketVisits.map((visit) => {
    if (visit.id !== visitId) return visit;
    return normalizeMarketVisit({
      ...visit,
      operatorLinks: visit.operatorLinks.map((link) => {
        if (link.id !== operatorId) return link;
        return {
          ...link,
          productNotes: {
            ...(link.productNotes || {}),
            [productId]: { ...(link.productNotes?.[productId] || {}), note }
          }
        };
      }),
      updatedAt: new Date().toISOString()
    });
  });
  persistMarketVisits();
}

function convertMarketOperatorToLead(visit, operatorId, panel) {
  const currentVisit = marketVisits.find((item) => item.id === visit.id) || visit;
  const operator = currentVisit.operatorLinks.find((link) => link.id === operatorId) || getMarketVisitOperators(currentVisit).find((link) => link.id === operatorId);
  if (!operator) return;
  const selectedProductIds = [...panel.querySelectorAll("[data-operator-lead-product]")]
    .filter((input) => input.dataset.operatorLeadProduct === operatorId && input.checked)
    .map((input) => input.value);
  const products = getMarketVisitProducts(currentVisit).filter((product) => selectedProductIds.includes(product.id));
  if (!products.length && !confirm("No products are selected. Create the lead without products?")) return;
  const operatorName = operator.operatorName || getOperatorName(operator.operatorId) || getMarketVisitDisplayName(currentVisit);
  const addressEntry = operator.operatorId ? addressBook.find((entry) => entry.id === operator.operatorId) : null;
  const now = new Date().toISOString();
  const productNotes = products
    .map((product) => {
      const note = operator.productNotes?.[product.id]?.note;
      return note ? `${product.description}: ${note}` : "";
    })
    .filter(Boolean)
    .join("\n");
  const lead = normalizeCard({
    id: crypto.randomUUID(),
    account: operatorName,
    accountNumber: addressEntry?.accountNumber || "",
    syscoAccountNumber: addressEntry?.syscoAccountNumber || "",
    distributor: "US Foods",
    note: [`Created from market visit: ${getMarketVisitDisplayName(currentVisit)}`, operator.notes, productNotes].filter(Boolean).join("\n\n"),
    priority: "Medium",
    due: currentVisit.endDate || currentVisit.startDate || "",
    status: "New Lead",
    source: "Market Visit",
    salesRep: currentVisit.salesReps.join(", "),
    products: products.map((product) => ({
      id: crypto.randomUUID(),
      apn: product.apn || product.supc || product.manufacturerNumber || "",
      description: product.description || "",
      vendor: product.vendor || product.brandName || ""
    })),
    attachments: [],
    vendorReports: {},
    createdAt: now,
    archivedAt: "",
    archiveOutcome: "",
    deletedAt: ""
  });
  cards = [lead, ...cards];
  if (!persist()) return;
  render();
  alert(`Lead created for ${operatorName}.`);
}

function getVisibleMarketVisits() {
  const query = elements.marketSearch.value.trim().toLowerCase();
  return marketVisits
    .filter((visit) => {
      if (visit.type !== activeMarketType) return false;
      if (elements.marketManufacturerFilter.value && visit.vendor !== elements.marketManufacturerFilter.value) return false;
      if (elements.marketStatusFilter.value && visit.status !== elements.marketStatusFilter.value) return false;
      if (elements.marketRepFilter.value && !visit.salesReps.join(" ").toLowerCase().includes(elements.marketRepFilter.value.trim().toLowerCase())) return false;
      if (elements.marketDateFilter.value && !matchesMarketDateFilter(visit, elements.marketDateFilter.value)) return false;
      if (!query) return true;
      const products = getMarketVisitProducts(visit).map((product) => product.description).join(" ");
      const operators = getMarketVisitOperators(visit).map((operator) => operator.operatorName || getOperatorName(operator.operatorId)).join(" ");
      return [visit.name, visit.vendor, visit.visitorName, visit.location, visit.salesReps.join(" "), visit.notes, products, operators].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31"));
}

function matchesMarketDateFilter(visit, filter) {
  const dates = getMarketVisitDateKeys(visit);
  if (!dates.length) return false;
  if (filter === "today") return dates.includes(toDateKey(startOfToday()));
  if (filter === "week") return dates.some((date) => parseLocalDate(date) >= startOfToday() && parseLocalDate(date) <= endOfWeek(startOfToday()));
  if (filter === "nextWeek") return dates.some((date) => parseLocalDate(date) >= startOfNextWeek() && parseLocalDate(date) <= endOfWeek(startOfNextWeek()));
  if (filter === "month") {
    const today = startOfToday();
    return dates.some((date) => {
      const parsed = parseLocalDate(date);
      return parsed.getFullYear() === today.getFullYear() && parsed.getMonth() === today.getMonth();
    });
  }
  return true;
}

function getMarketVisitDateKeys(visit) {
  if (!visit.startDate) return [];
  const dates = [];
  const start = parseLocalDate(visit.startDate);
  const end = parseLocalDate(visit.endDate || visit.startDate);
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) dates.push(toDateKey(date));
  return dates;
}

function getMarketVisitProducts(visit) {
  return visit.productIds.map((id) => stockProducts.find((product) => product.id === id)).filter(Boolean);
}

function getProductsByVendor(vendor) {
  return vendor ? stockProducts.filter((product) => product.vendor === vendor) : [];
}

function getMarketProductCandidates(visit) {
  const source = visit.type === "manufacturer" && visit.vendor ? getProductsByVendor(visit.vendor) : stockProducts;
  return source.filter((product) => !visit.productIds.includes(product.id));
}

function formatMarketProductOption(product) {
  const number = product.apn || product.supc || product.manufacturerNumber || "";
  return [number, product.description, product.vendor, product.packaging, product.storage].filter(Boolean).join(" | ");
}

function findMarketProductFromSearch(value, visit) {
  const query = normalizeProductSearchText(value);
  if (!query) return null;
  const candidates = getMarketProductCandidates(visit);
  const exactMatch = candidates.find((product) =>
    [product.apn, product.supc, product.manufacturerNumber, product.gtin]
      .filter(Boolean)
      .some((number) => normalizeProductSearchText(number) === query)
  );
  if (exactMatch) return exactMatch;
  const scored = candidates
    .map((product) => ({ product, score: getMarketProductSearchScore(product, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.product.description || "").localeCompare(b.product.description || ""));
  return scored[0]?.product || null;
}

function normalizeProductSearchText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getMarketProductSearchScore(product, query) {
  const option = normalizeProductSearchText(formatMarketProductOption(product));
  const description = normalizeProductSearchText(product.description);
  const vendor = normalizeProductSearchText(product.vendor);
  const brand = normalizeProductSearchText(product.brandName);
  const numbers = [product.apn, product.supc, product.manufacturerNumber, product.gtin].filter(Boolean).map(normalizeProductSearchText);
  if (option === query) return 100;
  if (numbers.some((number) => number === query)) return 95;
  if (description === query) return 90;
  if (description.startsWith(query)) return 85;
  if (description.split(/\s+/).some((word) => word.startsWith(query))) return 80;
  if (description.includes(query)) return 75;
  if (numbers.some((number) => number.includes(query))) return 70;
  if (vendor === query || brand === query) return 55;
  if (vendor.startsWith(query) || brand.startsWith(query)) return 45;
  if (option.includes(query)) return 25;
  return 0;
}

function getMarketVisitOperators(visit) {
  const callOperators = visit.calls.map((call) => ({ id: `call-${call.id}`, operatorId: call.operatorId, operatorName: call.operatorName || getOperatorName(call.operatorId), productIds: call.productIds, notes: call.notes, productNotes: {} })).filter((operator) => operator.operatorId || operator.operatorName);
  const keyed = new Map();
  [...visit.operatorLinks, ...callOperators].forEach((operator) => {
    const key = operator.operatorId || operator.operatorName;
    if (!key || keyed.has(key)) return;
    keyed.set(key, operator);
  });
  return [...keyed.values()];
}

function getOperatorName(operatorId) {
  return addressBook.find((entry) => entry.id === operatorId)?.operation || "";
}

function getMarketVisitDisplayName(visit) {
  return visit.type === "manufacturer" ? visit.name || `${visit.vendor || "Manufacturer"} Market Visit` : visit.name;
}

function formatDateRange(start, end) {
  if (!start && !end) return "";
  if (!end || start === end) return start ? formatDate(start) : "";
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getMarketVisitCalendarCalls(visit) {
  const directCalls = visit.calls.map((call) => ({ ...call, visitId: visit.id, title: `${getMarketVisitDisplayName(visit)}${call.operatorName || getOperatorName(call.operatorId) ? ` - ${call.operatorName || getOperatorName(call.operatorId)}` : ""}`, salesReps: call.salesReps.length ? call.salesReps : visit.salesReps }));
  return directCalls;
}

function clearMarketFilters() {
  elements.marketSearch.value = "";
  elements.marketManufacturerFilter.value = "";
  elements.marketRepFilter.value = "";
  elements.marketStatusFilter.value = "";
  elements.marketDateFilter.value = "";
  renderMarketVisits();
}

function getVendorOptions() {
  return [...new Set([...stockProducts.map((product) => product.vendor), ...cards.flatMap((card) => (card.products || []).map((product) => product.vendor)), ...manualVendorReports.map((report) => report.vendor)].filter(Boolean))].sort();
}

function fillSelect(select, values, placeholder, selectedValue = "") {
  const current = selectedValue || select.value;
  select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`).join("")}`;
  if (current && values.includes(current)) select.value = current;
}

function groupBy(items, keyGetter) {
  return items.reduce((groups, item) => {
    const key = keyGetter(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function createMarketFollowUp(visit) {
  const title = `Follow up: ${getMarketVisitDisplayName(visit)}`;
  todos = [
    normalizeTodo({
      title,
      priority: "Medium",
      due: visit.endDate || visit.startDate || "",
      assignedBy: visit.salesReps.join(", "),
      status: "New",
      account: getMarketVisitOperators(visit).map((operator) => operator.operatorName || getOperatorName(operator.operatorId)).filter(Boolean).join(", "),
      vendor: visit.vendor,
      notes: `Created from market visit: ${getMarketVisitDisplayName(visit)}\n${visit.notes || ""}`
    }),
    ...todos
  ];
  persistTodos();
  alert("Follow-up task added to the To-Do List.");
}

function openMarketPrintOptions(id) {
  const visit = marketVisits.find((item) => item.id === id);
  if (!visit) return;
  elements.marketPrintVisitId.value = id;
  elements.marketPrintSchedule.checked = true;
  elements.marketPrintProducts.checked = true;
  elements.marketPrintDialog.showModal();
}

function closeMarketPrintOptions() {
  elements.marketPrintDialog.close();
}

function printMarketVisit(id, sections = { schedule: true, products: true }) {
  const visit = marketVisits.find((item) => item.id === id);
  if (!visit) return;
  if (!sections.schedule && !sections.products) {
    alert("Choose at least one section to print.");
    return;
  }
  closeMarketPrintOptions();
  openPrintWindow(renderMarketVisitPrintDocument(visit, sections));
}

function renderMarketVisitPrintDocument(visit, sections = { schedule: true, products: true }) {
  const calls = getMarketVisitCalendarCalls(visit).sort((a, b) => `${a.date || ""}${a.startTime || ""}`.localeCompare(`${b.date || ""}${b.startTime || ""}`));
  const products = getMarketVisitProducts(visit);
  const titleSuffix = [sections.schedule ? "Schedule" : "", sections.products ? "Product List" : ""].filter(Boolean).join(" + ");
  const printedNumberKey = pcMarketNumberMode === "supc" ? "supc" : "apn";
  const printedNumberLabel = printedNumberKey === "supc" ? "Sysco #" : "US Foods #";
  const visitDateText = formatDateRange(visit.startDate, visit.endDate) || "No date";
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Market Visit</title>
        <style>
          @page { size: landscape; margin: 0.35in; }
          body { font: 12px Arial, sans-serif; color: #211d18; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          h2 { margin: 18px 0 8px; font-size: 15px; }
          .meta { color: #5d554b; font-weight: 700; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d4c6b4; padding: 6px; vertical-align: top; text-align: left; }
          th { background: #f5e4c7; font-size: 10px; text-transform: uppercase; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; color: #6a5e4e; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>Market Visit</h1>
        <div class="meta">${escapeHtml(visitDateText)}</div>
        <div class="meta">${escapeHtml(titleSuffix)}</div>
        ${sections.schedule ? `<h2>Schedule</h2>
        <table>
          <thead><tr><th>Date</th><th>Time</th><th>Operator</th><th>Location</th><th>Sales reps</th><th>Notes</th></tr></thead>
          <tbody>
            ${calls.map((call) => `<tr><td>${call.date ? formatDate(call.date) : ""}</td><td>${escapeHtml([call.startTime, call.endTime].filter(Boolean).join(" - "))}</td><td>${escapeHtml(call.operatorName || getOperatorName(call.operatorId) || "")}</td><td>${escapeHtml(call.location || visit.location || "")}</td><td>${escapeHtml(call.salesReps.join(", ") || visit.salesReps.join(", "))}</td><td>${escapeHtml(call.notes || "")}</td></tr>`).join("") || `<tr><td colspan="6">No calls scheduled yet.</td></tr>`}
          </tbody>
        </table>` : ""}
        ${sections.products ? `<h2>Products</h2>
        <table>
          <thead><tr><th>Vendor</th><th>Product</th><th>${escapeHtml(printedNumberLabel)}</th><th>Packaging</th><th>Storage</th></tr></thead>
          <tbody>${products.map((product) => `<tr><td>${escapeHtml(product.vendor || "")}</td><td>${escapeHtml(product.description || "")}</td><td>${escapeHtml(product[printedNumberKey] || "")}</td><td>${escapeHtml(product.packaging || "")}</td><td>${escapeHtml(product.storage || "")}</td></tr>`).join("") || `<tr><td colspan="5">No products selected.</td></tr>`}</tbody>
        </table>` : ""}
        ${visit.notes ? `<h2>General notes</h2><p>${escapeHtml(visit.notes)}</p>` : ""}
        <div class="footer">Represented by Pierce Cartwright</div>
      </body>
    </html>`;
}

async function shareMarketVisitCalendar(id) {
  const visit = marketVisits.find((item) => item.id === id);
  if (!visit) return;
  const text = getMarketVisitCalendarShareText(visit);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${getMarketVisitDisplayName(visit)} Calendar`, text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    alert("Calendar summary copied. You can paste it into an email or message.");
    return;
  }
  alert(text);
}

function getMarketVisitCalendarShareText(visit) {
  const calls = getMarketVisitCalendarCalls(visit).sort((a, b) => `${a.date || ""}${a.startTime || ""}`.localeCompare(`${b.date || ""}${b.startTime || ""}`));
  const lines = [
    getMarketVisitDisplayName(visit),
    `${marketVisitTypes[visit.type]}${formatDateRange(visit.startDate, visit.endDate) ? ` | ${formatDateRange(visit.startDate, visit.endDate)}` : ""}`,
    ""
  ];
  if (!calls.length) {
    lines.push("No calls scheduled yet.");
    return lines.join("\n");
  }
  calls.forEach((call) => {
    lines.push(
      `${call.date ? formatDate(call.date) : "No date"} | ${[call.startTime, call.endTime].filter(Boolean).join(" - ") || "No time"} | ${call.operatorName || getOperatorName(call.operatorId) || "No operator"}`
    );
    const reps = call.salesReps?.length ? call.salesReps.join(", ") : visit.salesReps.join(", ");
    if (reps) lines.push(`Reps: ${reps}`);
    if (call.location || visit.location) lines.push(`Location: ${call.location || visit.location}`);
    if (call.notes) lines.push(`Notes: ${call.notes}`);
    lines.push("");
  });
  return lines.join("\n").trim();
}

function exportMarketVisitIcs(id) {
  const visit = marketVisits.find((item) => item.id === id);
  if (!visit) return;
  const calls = getMarketVisitCalendarCalls(visit).filter((call) => call.date);
  if (!calls.length) {
    alert("Add a date or scheduled call before exporting a calendar file.");
    return;
  }
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FoodBrokerBase//Market Visits//EN", "CALSCALE:GREGORIAN"];
  calls.forEach((call) => {
    const start = makeIcsDateTime(call.date, call.startTime || "09:00");
    const end = makeIcsDateTime(call.date, call.endTime || call.startTime || "10:00", call.endTime ? 0 : 60);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${call.id || crypto.randomUUID()}@foodbrokerbase`,
      `DTSTAMP:${makeIcsDateTime(toDateKey(new Date()), "00:00")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcsText(call.title || getMarketVisitDisplayName(visit))}`,
      `LOCATION:${escapeIcsText(call.location || visit.location || "")}`,
      `DESCRIPTION:${escapeIcsText([visit.vendor && `Manufacturer: ${visit.vendor}`, visit.visitorName && `Visitor: ${visit.visitorName}`, call.operatorName && `Operator: ${call.operatorName}`, call.salesReps?.length && `Reps: ${call.salesReps.join(", ")}`, call.notes || visit.notes].filter(Boolean).join("\\n"))}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  downloadTextFile(`${getMarketVisitDisplayName(visit).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "market-visit"}.ics`, lines.join("\r\n"), "text/calendar");
}

function makeIcsDateTime(dateKey, time, addMinutes = 0) {
  const match = String(time || "09:00").match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  let hours = match ? Number(match[1]) : 9;
  const minutes = match ? Number(match[2] || 0) : 0;
  const meridiem = (match?.[3] || "").toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const date = parseLocalDate(dateKey);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  if (addMinutes) date.setMinutes(date.getMinutes() + addMinutes);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function escapeIcsText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCurrentTimelineSearchValue() {
  const active = document.activeElement?.classList?.contains("timeline-search-input") ? document.activeElement.value : "";
  return active || elements.timelineSearches.find((input) => input.value.trim())?.value || "";
}

function syncTimelineSearchInputs(value) {
  elements.timelineSearches.forEach((input) => {
    if (input.value !== value) input.value = value;
  });
}

function openTimelineSearchWindow() {
  elements.timelineDialogSearch.value = getCurrentTimelineSearchValue().trim();
  syncTimelineSearchInputs(elements.timelineDialogSearch.value);
  renderTimelineSearch();
  elements.timelineDialog.showModal();
  setTimeout(() => elements.timelineDialogSearch.focus(), 0);
}

function getTimelineTerms() {
  return elements.timelineDialogSearch.value
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

function timelineMatches(haystack, terms) {
  if (!terms.length) return false;
  const text = haystack.filter(Boolean).join(" ").toLowerCase();
  return terms.every((term) => text.includes(term));
}

function timelineDateValue(item) {
  const raw = item.date || item.createdAt || "";
  if (!raw) return 0;
  return parseLocalDate(String(raw).slice(0, 10)).getTime();
}

function timelineDisplayDate(item) {
  if (item.date) return formatDate(String(item.date).slice(0, 10));
  if (item.createdAt) return formatDate(String(item.createdAt).slice(0, 10));
  return "No date";
}

function pushTimelineItem(items, item, terms, searchParts) {
  if (timelineMatches(searchParts, terms)) items.push(item);
}

function getTimelineLeadProducts(card) {
  if (!Array.isArray(card.products)) return normalizeProducts(card);
  return card.products
    .map((product) => ({
      id: product.id || crypto.randomUUID(),
      vendor: String(product.vendor || card.vendor || "").trim(),
      description: String(product.description || "").trim(),
      apn: String(product.apn || "").trim(),
      supc: String(product.supc || "").trim(),
      packaging: String(product.packaging || "").trim(),
      storage: String(product.storage || "").trim()
    }))
    .filter((product) => product.vendor || product.description || product.apn || product.supc);
}

function getLeadTimelineItems(terms) {
  const items = [];
  cards.filter((card) => !card.deletedAt).forEach((card) => {
    const products = getTimelineLeadProducts(card);
    const productText = products.map((product) => [product.vendor, product.description, product.apn, product.supc].filter(Boolean).join(" ")).join(" ");
    pushTimelineItem(
      items,
      {
        type: "Lead",
        title: card.account || "Untitled lead",
        subtitle: [normalizeStatus(card.status), card.priority, card.source, card.salesRep && `USF Rep: ${card.salesRep}`, card.syscoSalesRep && `Sysco Rep: ${card.syscoSalesRep}`].filter(Boolean).join(" | "),
        body: card.note || productText,
        date: card.due || card.createdAt || "",
        createdAt: card.createdAt,
        meta: products.map((product) => [product.vendor, product.description, product.apn && `APN: ${product.apn}`, product.supc && `SUPC: ${product.supc}`].filter(Boolean).join(" ")).filter(Boolean),
        actionLabel: "Open Lead",
        actionType: "lead",
        actionId: card.id
      },
      terms,
      [card.account, card.accountNumber, card.syscoAccountNumber, card.distributor, card.note, card.status, card.priority, card.source, card.salesRep, card.syscoSalesRep, productText]
    );
  });
  return items;
}

function getTodoTimelineItems(terms) {
  const items = [];
  todos.filter((todo) => !todo.deletedAt).forEach((todo) => {
    const checklist = todo.subtasks.map((subtask) => subtask.text).join(" ");
    pushTimelineItem(
      items,
      {
        type: "To-Do",
        title: todo.title || "Untitled task",
        subtitle: [todo.status, todo.priority, todo.assignedBy && `By: ${todo.assignedBy}`, todo.account, todo.vendor].filter(Boolean).join(" | "),
        body: todo.notes || checklist,
        date: todo.due || todo.completedAt || todo.createdAt || "",
        createdAt: todo.createdAt,
        meta: todo.subtasks.map((subtask) => `${subtask.done ? "Done" : "Open"}: ${subtask.text}`),
        actionLabel: "Open Task",
        actionType: "todo",
        actionId: todo.id
      },
      terms,
      [todo.title, todo.assignedBy, todo.account, todo.vendor, todo.notes, todo.status, todo.priority, checklist]
    );
  });
  return items;
}

function getSampleTimelineItems(terms) {
  const items = [];
  samples.filter((sample) => !sample.deletedAt).forEach((sample) => {
    pushTimelineItem(
      items,
      {
        type: "Sample",
        title: sample.product || "Untitled sample",
        subtitle: [sample.status, sample.orderType, sample.orderedBy && `By: ${sample.orderedBy}`, sample.requestedFor].filter(Boolean).join(" | "),
        body: sample.note || "",
        date: sample.expected || sample.createdAt || "",
        createdAt: sample.createdAt,
        meta: sample.attachments?.length ? [`${sample.attachments.length} attachment${sample.attachments.length === 1 ? "" : "s"}`] : [],
        actionLabel: "Open Sample",
        actionType: "sample",
        actionId: sample.id
      },
      terms,
      [sample.product, sample.orderedBy, sample.requestedFor, sample.orderType, sample.status, sample.note]
    );
  });
  return items;
}

function getDotTimelineItems(terms) {
  const items = [];
  dotOrders.forEach((order) => {
    const productText = getDotProductText(order);
    pushTimelineItem(
      items,
      {
        type: "DOT Order",
        title: productText || "Untitled DOT order",
        subtitle: [order.status, order.storageType, order.orderedBy && `By: ${order.orderedBy}`, order.requestedFor].filter(Boolean).join(" | "),
        body: order.note || "",
        date: order.expected || order.orderedDate || order.updatedAt || order.createdAt || "",
        createdAt: order.createdAt,
        meta: [order.orderedDate && `Ordered: ${formatDate(order.orderedDate)}`, order.poNumber && `PO: ${order.poNumber}`, order.attachments?.length && `${order.attachments.length} attachment${order.attachments.length === 1 ? "" : "s"}`].filter(Boolean),
        actionLabel: "Open DOT Order",
        actionType: "dot",
        actionId: order.id
      },
      terms,
      [productText, order.vendor, order.dotNumber, order.orderedDate, order.poNumber, order.orderedBy, order.expected, order.storageType, order.requestedFor, order.status, order.note, ...(order.attachments || []).map((file) => file.name)]
    );
  });
  return items;
}

function getNestleTimelineItems(terms) {
  const items = [];
  nestleMachines.forEach((machine) => {
    pushTimelineItem(
      items,
      {
        type: "Nestle Machine",
        title: machine.machine || "Untitled machine",
        subtitle: [machine.status, machine.account, machine.location, machine.salesRep].filter(Boolean).join(" | "),
        body: machine.note || "",
        date: machine.expected || machine.updatedAt || machine.createdAt || "",
        createdAt: machine.createdAt,
        meta: [machine.serial && `Serial: ${machine.serial}`, machine.contact && `Contact: ${machine.contact}`].filter(Boolean),
        actionLabel: "Open Machine",
        actionType: "nestle",
        actionId: machine.id
      },
      terms,
      [machine.machine, machine.account, machine.location, machine.contact, machine.serial, machine.salesRep, machine.status, machine.note]
    );
  });
  return items;
}

function getVendorReportTimelineItems(terms) {
  const items = [];
  const leadRows = cards
    .filter((card) => !card.deletedAt)
    .flatMap((card) =>
      getTimelineLeadProducts(card)
        .filter((product) => product.vendor)
        .map((product) => ({ type: "lead", card, product, report: getVendorReport(card, product) }))
    );
  const manualRows = manualVendorReports.map((manual) => ({
    type: "manual",
    manual,
    product: { id: manual.id, vendor: manual.vendor, description: manual.productShown },
    report: manual
  }));
  [...leadRows, ...manualRows].forEach((row) => {
    const card = row.card;
    const manual = row.manual;
    const report = row.report;
    const product = row.product;
    const account = row.type === "manual" ? manual.account : card.account;
    const rowId = row.type === "manual" ? manual.id : card.id;
    pushTimelineItem(
      items,
      {
        type: "Vendor Report",
        title: `${product.vendor || "Vendor"} - ${account || "No account"}`,
        subtitle: [report.outcome || "Unsure", report.submitted ? "Submitted" : "Not submitted", report.submittedDate && `Submitted ${formatDate(report.submittedDate)}`].filter(Boolean).join(" | "),
        body: report.opportunityNote || product.description || report.productShown || "",
        date: report.submittedDate || card?.due || manual?.createdAt || "",
        createdAt: manual?.createdAt || card?.createdAt || "",
        meta: [report.productShown || product.description].filter(Boolean),
        actionLabel: row.type === "manual" ? "Open Report" : "Open Lead",
        actionType: row.type === "manual" ? "manual-vendor" : "lead",
        actionId: rowId
      },
      terms,
      [account, product.vendor, product.description, report.productShown, report.opportunityNote, report.outcome, report.submittedDate]
    );
  });
  return items;
}

function getMarketVisitTimelineItems(terms) {
  const items = [];
  marketVisits.forEach((visit) => {
    const products = getMarketVisitProducts(visit);
    const operators = getMarketVisitOperators(visit);
    const productText = products.map((product) => [product.vendor, product.description, product.apn, product.supc, product.packaging, product.storage].filter(Boolean).join(" ")).join(" ");
    const operatorText = operators.map((operator) => [operator.operatorName || getOperatorName(operator.operatorId), operator.notes].filter(Boolean).join(" ")).join(" ");
    pushTimelineItem(
      items,
      {
        type: visit.type === "manufacturer" ? "Vendor Market Visit" : "P. C. Market Visit",
        title: getMarketVisitDisplayName(visit),
        subtitle: [formatDateRange(visit.startDate, visit.endDate), visit.vendor, visit.location, visit.salesReps.join(", ")].filter(Boolean).join(" | "),
        body: visit.notes || operatorText || productText,
        date: visit.startDate || visit.createdAt || "",
        createdAt: visit.createdAt,
        meta: [`${operators.length} operator${operators.length === 1 ? "" : "s"}`, `${products.length} product${products.length === 1 ? "" : "s"}`, `${visit.calls.length} call${visit.calls.length === 1 ? "" : "s"}`],
        actionLabel: "Open Visit",
        actionType: "market",
        actionId: visit.id
      },
      terms,
      [visit.name, visit.vendor, visit.visitorName, visit.location, visit.notes, visit.status, visit.salesReps.join(" "), productText, operatorText]
    );
    visit.calls.forEach((call) => {
      const callProducts = products.filter((product) => call.productIds?.includes(product.id));
      const callProductText = callProducts.map((product) => [product.vendor, product.description, product.apn, product.supc].filter(Boolean).join(" ")).join(" ");
      const operatorName = call.operatorName || getOperatorName(call.operatorId);
      pushTimelineItem(
        items,
        {
          type: "Market Call",
          title: `${operatorName || "Appointment"} - ${getMarketVisitDisplayName(visit)}`,
          subtitle: [call.startTime && call.endTime ? `${call.startTime} - ${call.endTime}` : "", call.location || visit.location, (call.salesReps?.length ? call.salesReps : visit.salesReps).join(", ")].filter(Boolean).join(" | "),
          body: call.notes || callProductText,
          date: call.date || visit.startDate || "",
          createdAt: visit.createdAt,
          meta: callProducts.map((product) => [product.description, product.vendor].filter(Boolean).join(" | ")),
          actionLabel: "Open Visit",
          actionType: "market",
          actionId: visit.id
        },
        terms,
        [operatorName, call.location, call.notes, call.status, call.manufacturerContact, (call.salesReps || []).join(" "), visit.name, visit.vendor, callProductText]
      );
    });
  });
  return items;
}

function getStockTimelineItems(terms) {
  const items = [];
  stockProducts.forEach((product) => {
    pushTimelineItem(
      items,
      {
        type: "Stock Product",
        title: product.description || "Untitled product",
        subtitle: [product.vendor, product.brandName, product.category, product.storage].filter(Boolean).join(" | "),
        body: [product.apn && `APN: ${product.apn}`, product.supc && `SUPC: ${product.supc}`, product.manufacturerNumber && `MF#: ${product.manufacturerNumber}`, product.packaging].filter(Boolean).join(" | "),
        date: product.updatedAt || product.createdAt || "",
        createdAt: product.createdAt,
        meta: product.attachments?.length ? [`${product.attachments.length} file${product.attachments.length === 1 ? "" : "s"}`] : [],
        actionLabel: "Open Product",
        actionType: "stock",
        actionId: product.id
      },
      terms,
      [product.description, product.vendor, product.brandName, product.brandType, product.apn, product.supc, product.manufacturerNumber, product.gtin, product.packaging, product.storage, product.category]
    );
  });
  return items;
}

function getAddressTimelineItems(terms) {
  const items = [];
  addressBook.filter((entry) => !entry.archivedAt && !entry.deletedAt).forEach((entry) => {
    pushTimelineItem(
      items,
      {
        type: "Operator",
        title: entry.operation || "Unnamed operator",
        subtitle: [entry.primaryContact?.name, entry.usfSalesRep && `USF Rep: ${entry.usfSalesRep}`, entry.syscoSalesRep && `Sysco Rep: ${entry.syscoSalesRep}`].filter(Boolean).join(" | "),
        body: [entry.address, entry.notes, entry.website].filter(Boolean).join("\n"),
        date: entry.lastUpdated || entry.createdAt || "",
        createdAt: entry.createdAt,
        meta: [entry.accountNumber && `USF Acct #: ${entry.accountNumber}`, entry.syscoAccountNumber && `Sysco Acct #: ${entry.syscoAccountNumber}`, entry.deliveryDays?.length && `Delivery: ${entry.deliveryDays.join(", ")}`].filter(Boolean),
        actionLabel: "Open Operator",
        actionType: "address",
        actionId: entry.id
      },
      terms,
      [entry.operation, entry.address, entry.accountNumber, entry.syscoAccountNumber, entry.usfSalesRep, entry.syscoSalesRep, entry.website, entry.notes, entry.primaryContact?.name, entry.primaryContact?.role, entry.primaryContact?.email, entry.primaryContact?.phone]
    );
  });
  return items;
}

function getTimelineItems() {
  const terms = getTimelineTerms();
  if (!terms.length) return [];
  return [
    ...getLeadTimelineItems(terms),
    ...getTodoTimelineItems(terms),
    ...getSampleTimelineItems(terms),
    ...getDotTimelineItems(terms),
    ...getNestleTimelineItems(terms),
    ...getVendorReportTimelineItems(terms),
    ...getMarketVisitTimelineItems(terms),
    ...getStockTimelineItems(terms),
    ...getAddressTimelineItems(terms)
  ]
    .sort((a, b) => timelineDateValue(b) - timelineDateValue(a))
    .slice(0, 120);
}

function renderTimelineSearch() {
  const terms = getTimelineTerms();
  const items = getTimelineItems();
  if (!terms.length) {
    elements.timelineSummary.textContent = "Type an operator, product, vendor, APN, or note to see related activity.";
    elements.timelineResults.innerHTML = "";
    return;
  }
  elements.timelineSummary.textContent = `${items.length} related item${items.length === 1 ? "" : "s"} found for "${elements.timelineDialogSearch.value.trim()}".`;
  elements.timelineResults.innerHTML = items.length
    ? items.map(renderTimelineItem).join("")
    : `<div class="empty-state">No related history found yet.</div>`;
  bindTimelineActions();
}

function renderTimelineItem(item) {
  return `
    <article class="timeline-item">
      <div class="timeline-date">${escapeHtml(timelineDisplayDate(item))}</div>
      <div class="timeline-card">
        <div class="timeline-card-header">
          <div>
            <span class="timeline-type">${escapeHtml(item.type)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            ${item.subtitle ? `<div class="timeline-subtitle">${escapeHtml(item.subtitle)}</div>` : ""}
          </div>
          <button class="edit-card" type="button" data-timeline-action="${escapeAttribute(item.actionType)}" data-timeline-id="${escapeAttribute(item.actionId)}">${escapeHtml(item.actionLabel)}</button>
        </div>
        ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ""}
        ${item.meta?.length ? `<div class="meta-row">${item.meta.slice(0, 8).map((meta) => `<span class="meta">${escapeHtml(meta)}</span>`).join("")}</div>` : ""}
      </div>
    </article>
  `;
}

function bindTimelineActions() {
  elements.timelineResults.querySelectorAll("[data-timeline-action]").forEach((button) => {
    button.addEventListener("click", () => openTimelineItem(button.dataset.timelineAction, button.dataset.timelineId));
  });
}

function openTimelineItem(type, id) {
  elements.timelineDialog.close();
  if (type === "lead") {
    const card = cards.find((item) => item.id === id);
    if (card) openForm(card);
    return;
  }
  if (type === "todo") {
    const todo = todos.find((item) => item.id === id);
    if (todo) openTodoForm(todo);
    return;
  }
  if (type === "sample") {
    const sample = samples.find((item) => item.id === id);
    if (sample) openSampleForm(sample);
    return;
  }
  if (type === "dot") {
    const order = dotOrders.find((item) => item.id === id);
    if (order) {
      openSampleTrackerWindow();
      setActiveTrackerTab("dot");
      openDotForm(order);
    }
    return;
  }
  if (type === "nestle") {
    const machine = nestleMachines.find((item) => item.id === id);
    if (machine) {
      openSampleTrackerWindow();
      setActiveTrackerTab("nestle");
      openNestleForm(machine);
    }
    return;
  }
  if (type === "manual-vendor") {
    const report = manualVendorReports.find((item) => item.id === id);
    if (report) openManualVendorForm(report);
    return;
  }
  if (type === "stock") {
    const product = stockProducts.find((item) => item.id === id);
    if (product) openStockForm(product);
    return;
  }
  if (type === "address") {
    const entry = addressBook.find((item) => item.id === id);
    if (entry) openAddressBookForm(entry);
    return;
  }
  if (type === "market") {
    const visit = marketVisits.find((item) => item.id === id);
    if (!visit) return;
    activeMarketType = visit.type;
    activeMarketDetailId = visit.id;
    openMarketVisitsWindow();
  }
}

function setActiveTrackerTab(tab) {
  activeTrackerTab = ["samples", "dot", "nestle"].includes(tab) ? tab : "samples";
  elements.trackerTabs.forEach((button) => {
    const isActive = button.dataset.trackerTab === activeTrackerTab;
    button.classList.toggle("active-tracker-tab", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  elements.trackerPanels.forEach((panel) => {
    panel.hidden = panel.dataset.trackerPanel !== activeTrackerTab;
  });
  const labels = {
    samples: "+ Add Sample",
    dot: "+ Add DOT Order",
    nestle: "+ Add Nestle Machine"
  };
  document.querySelector("#addSample").textContent = labels[activeTrackerTab];
  if (activeTrackerTab === "samples") renderSamples();
  if (activeTrackerTab === "dot") renderDotOrders();
  if (activeTrackerTab === "nestle") renderNestleMachines();
}

function openActiveTrackerForm() {
  if (activeTrackerTab === "dot") {
    openDotForm();
    return;
  }
  if (activeTrackerTab === "nestle") {
    openNestleForm();
    return;
  }
  openSampleForm();
}

function renderSamples() {
  updateSampleSummary();
  const visibleSamples = getVisibleSamples();
  setActiveSampleQuickTile();
  elements.sampleCount.textContent = visibleSamples.length;

  if (!visibleSamples.length) {
    elements.sampleTable.innerHTML = `<div class="empty-state">No samples found</div>`;
    return;
  }

  elements.sampleTable.innerHTML = `
    <table class="quick-table sample-table">
      <thead>
        <tr>
          <th>Product ordered</th>
          <th>Who ordered</th>
          <th>Expected</th>
          <th>For account / distributor</th>
          <th>Order type</th>
          <th>Status</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${visibleSamples.map(renderSampleRow).join("")}</tbody>
    </table>
  `;
  bindSampleTableActions();
}

function renderSampleRow(sample) {
  return `
    <tr>
      <td><button class="table-link sample-product-link" type="button" data-sample-edit="${escapeAttribute(sample.id)}">${escapeHtml(sample.product)}</button></td>
      <td>${sample.orderedBy ? escapeHtml(sample.orderedBy) : ""}</td>
      <td>${sample.expected ? formatDate(sample.expected) : "No date"}</td>
      <td>${sample.requestedFor ? escapeHtml(sample.requestedFor) : ""}</td>
      <td>${escapeHtml(sample.orderType)}</td>
      <td>${renderInlineSelect("sample-status-select", sample.id, sample.status, sampleStatuses)}</td>
      <td class="note-cell">${sample.note ? escapeHtml(sample.note) : ""}${sample.attachments?.length ? `<div><span class="badge">${sample.attachments.length} file${sample.attachments.length === 1 ? "" : "s"}</span></div>` : ""}</td>
      <td><button class="edit-card" type="button" data-sample-edit="${escapeAttribute(sample.id)}">Edit</button></td>
    </tr>
  `;
}

function bindSampleTableActions() {
  elements.sampleTable.querySelectorAll("[data-sample-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = samples.find((item) => item.id === button.dataset.sampleEdit);
      if (sample) openSampleForm(sample);
    });
  });
  elements.sampleTable.querySelectorAll(".sample-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      samples = samples.map((sample) =>
        sample.id === select.dataset.id
          ? {
              ...sample,
              status: select.value,
              archivedAt: select.value === "Delivered / Shown" ? sample.archivedAt || new Date().toISOString() : sample.archivedAt,
              updatedAt: new Date().toISOString()
            }
          : sample
      );
      persistSamples();
      renderSamples();
    });
  });
}

function getVisibleSamples() {
  const query = elements.sampleSearch.value.trim().toLowerCase();
  return samples
    .filter((sample) => !sample.archivedAt)
    .filter((sample) => {
      if (activeSampleQuickFilter && activeSampleQuickFilter !== "all" && !matchesSampleQuickFilter(sample, activeSampleQuickFilter)) return false;
      if (elements.sampleDateFilter.value && !matchesSampleQuickFilter(sample, elements.sampleDateFilter.value)) return false;
      if (elements.sampleStatusFilter.value && sample.status !== elements.sampleStatusFilter.value) return false;
      if (!query) return true;
      return [sample.product, sample.orderedBy, sample.requestedFor, sample.orderType, sample.status, sample.note].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aDate = a.expected || "9999-12-31";
      const bDate = b.expected || "9999-12-31";
      return aDate.localeCompare(bDate) || a.product.localeCompare(b.product);
    });
}

function matchesSampleQuickFilter(sample, filter) {
  if (filter === "overdue") return isSampleOverdue(sample);
  if (filter === "today") return isSampleDueToday(sample);
  if (filter === "week") return isSampleDueThisWeek(sample);
  if (filter === "ordered") return ["Ordered", "Added to PO"].includes(sample.status);
  if (filter === "received") return sample.status === "Received";
  if (filter === "none") return !sample.expected;
  return true;
}

function updateSampleSummary() {
  const activeSamples = samples.filter((sample) => !sample.archivedAt && sample.status !== "Cancelled");
  document.querySelector("#sampleAll").textContent = activeSamples.length;
  document.querySelector("#sampleToday").textContent = activeSamples.filter(isSampleDueToday).length;
  document.querySelector("#sampleWeek").textContent = activeSamples.filter(isSampleDueThisWeek).length;
  document.querySelector("#sampleOverdue").textContent = activeSamples.filter(isSampleOverdue).length;
  document.querySelector("#sampleOrdered").textContent = activeSamples.filter((sample) => ["Ordered", "Added to PO"].includes(sample.status)).length;
  document.querySelector("#sampleReceived").textContent = activeSamples.filter((sample) => sample.status === "Received").length;
}

function setActiveSampleQuickTile() {
  document.querySelectorAll("[data-sample-quick]").forEach((button) => {
    button.classList.toggle("active-summary", button.dataset.sampleQuick === activeSampleQuickFilter);
  });
}

function openSampleForm(sample) {
  const existing = sample || null;
  elements.sampleFormTitle.textContent = existing ? "Edit Sample" : "Add Sample";
  elements.sampleId.value = existing?.id || "";
  elements.sampleProduct.value = existing?.product || "";
  elements.sampleOrderedBy.value = existing?.orderedBy || "";
  elements.sampleExpected.value = existing?.expected || "";
  elements.sampleOrderType.value = existing?.orderType || "Direct from manufacturer";
  elements.sampleRequestedFor.value = existing?.requestedFor || "";
  elements.sampleStatus.value = existing?.status || "Requested";
  elements.sampleNote.value = existing?.note || "";
  currentSampleAttachments = existing?.attachments ? existing.attachments.map(normalizeAttachment) : [];
  renderSampleAttachmentList();
  elements.deleteSample.hidden = !existing;
  elements.sampleFormDialog.showModal();
  elements.sampleProduct.focus();
}

function closeSampleForm() {
  elements.sampleFormDialog.close();
}

function saveSample() {
  const id = elements.sampleId.value || crypto.randomUUID();
  const existing = samples.find((sample) => sample.id === id);
  const status = elements.sampleStatus.value;
  const sample = normalizeSample({
    id,
    product: elements.sampleProduct.value.trim(),
    orderedBy: elements.sampleOrderedBy.value.trim(),
    expected: elements.sampleExpected.value,
    orderType: elements.sampleOrderType.value,
    requestedFor: elements.sampleRequestedFor.value.trim(),
    status,
    note: elements.sampleNote.value.trim(),
    attachments: currentSampleAttachments.map(normalizeAttachment),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: status === "Delivered / Shown" ? existing?.archivedAt || new Date().toISOString() : ""
  });
  samples = existing ? samples.map((item) => (item.id === id ? sample : item)) : [sample, ...samples];
  persistSamples();
  closeSampleForm();
  renderSamples();
}

function deleteCurrentSample() {
  const id = elements.sampleId.value;
  if (!id) return;
  if (!confirm("Delete this sample?")) return;
  samples = samples.filter((sample) => sample.id !== id);
  persistSamples();
  closeSampleForm();
  renderSamples();
}

function clearSampleFilters() {
  elements.sampleSearch.value = "";
  elements.sampleDateFilter.value = "";
  elements.sampleStatusFilter.value = "";
  activeSampleQuickFilter = "";
  renderSamples();
}

function handleSampleAttachmentFiles(event) {
  const files = [...(event.target.files || [])];
  elements.sampleAttachmentInput.value = "";
  if (!files.length) return;
  addSampleAttachmentFiles(files);
}

function handleSampleAttachmentPaste(event) {
  const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  event.preventDefault();
  addSampleAttachmentFiles(
    files.map((file, index) => {
      const extension = file.type.split("/")[1] || "png";
      const name = `Screenshot ${formatDateTimeForFile(new Date())}${files.length > 1 ? ` ${index + 1}` : ""}.${extension}`;
      return new File([file], name, { type: file.type, lastModified: file.lastModified });
    })
  );
}

function addSampleAttachmentFiles(files) {
  readAttachmentFiles(files)
    .then((attachments) => {
      currentSampleAttachments = [...currentSampleAttachments, ...attachments];
      renderSampleAttachmentList();
    })
    .catch(() => alert("One of the attachments could not be added."));
}

function renderSampleAttachmentList() {
  if (!currentSampleAttachments.length) {
    elements.sampleAttachmentList.innerHTML = `<div class="empty-state attachment-empty">No files attached yet</div>`;
    return;
  }
  elements.sampleAttachmentList.innerHTML = currentSampleAttachments
    .map(
      (file) => `
        <div class="attachment-row">
          <div class="attachment-main">
            <strong>${escapeHtml(file.name)}</strong>
            <span>${formatFileSize(file.size)}</span>
          </div>
          <div class="attachment-actions">
            <button class="attachment-link" type="button" data-preview-attachment="${escapeAttribute(file.id)}">Preview</button>
            <button class="remove-product" type="button" data-remove-sample-attachment="${escapeAttribute(file.id)}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
  elements.sampleAttachmentList.querySelectorAll("[data-remove-sample-attachment]").forEach((button) => {
    button.addEventListener("click", () => {
      currentSampleAttachments = currentSampleAttachments.filter((file) => file.id !== button.dataset.removeSampleAttachment);
      renderSampleAttachmentList();
    });
  });
}

function isDueToday(dateKey) {
  return dateKey && parseLocalDate(dateKey).getTime() === startOfToday().getTime();
}

function isDueThisWeek(dateKey) {
  if (!dateKey) return false;
  const date = parseLocalDate(dateKey);
  const today = startOfToday();
  return date >= today && date <= endOfWeek(today);
}

function isDotOverdue(order) {
  return order.expected && !["Received", "Delivered", "Cancelled"].includes(order.status) && parseLocalDate(order.expected) < startOfToday();
}

function isNestleOverdue(machine) {
  return machine.expected && !["Installed", "Returned", "Cancelled"].includes(machine.status) && parseLocalDate(machine.expected) < startOfToday();
}

function isSampleOverdue(sample) {
  return sample.expected && !["Received", "Delivered / Shown", "Cancelled"].includes(sample.status) && parseLocalDate(sample.expected) < startOfToday();
}

function isSampleDueToday(sample) {
  return isDueToday(sample.expected);
}

function isSampleDueThisWeek(sample) {
  return isDueThisWeek(sample.expected);
}

function renderTodoBoard() {
  updateTodoSummary();
  const visibleTodos = getVisibleTodos();
  elements.todoBoard.innerHTML = "";
  setActiveTodoQuickTile();

  if (todoQuickListMode) {
    renderTodoQuickList(visibleTodos);
    return;
  }

  elements.todoBoard.className = "todo-board";
  todoColumns.forEach((status) => {
    const columnTodos = visibleTodos.filter((todo) => todo.status === status);
    const column = document.createElement("section");
    column.className = "column todo-column";
    column.dataset.todoStatus = status;
    column.innerHTML = `<div class="column-header"><h2>${status}</h2><span class="count-pill">${columnTodos.length}</span></div><div class="card-list"></div>`;
    column.addEventListener("dragover", onTodoDragOver);
    column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
    column.addEventListener("drop", onTodoDrop);
    const list = column.querySelector(".card-list");
    list.innerHTML = columnTodos.length ? "" : `<div class="empty-state">Drop a task here</div>`;
    columnTodos.forEach((todo) => list.appendChild(createTodoCard(todo)));
    elements.todoBoard.appendChild(column);
  });
}

function renderTodoQuickList(visibleTodos) {
  elements.todoBoard.className = "todo-board quick-list-board todo-quick-list-board";
  const panel = document.createElement("section");
  panel.className = "quick-list-panel todo-quick-list-panel";
  panel.innerHTML = `
    <div class="quick-list-header">
      <div>
        <p class="eyebrow">Task list</p>
        <h2>${escapeHtml(getTodoQuickFilterLabel(activeTodoQuickFilter))}</h2>
      </div>
      <span class="count-pill">${visibleTodos.length}</span>
    </div>
    <div class="quick-table-wrap"></div>
  `;
  const list = panel.querySelector(".quick-table-wrap");
  if (visibleTodos.length) {
    list.innerHTML = `
      <table class="quick-table todo-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assigned by</th>
            <th>Account / Vendor</th>
            <th>Notes</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Status</th>
            <th>Progress</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${visibleTodos.map(renderTodoTableRow).join("")}</tbody>
      </table>
    `;
    bindTodoTableActions(panel);
  } else {
    list.innerHTML = `<div class="empty-state">No tasks found for this view</div>`;
  }
  elements.todoBoard.appendChild(panel);
}

function renderTodoTableRow(todo) {
  const related = [todo.account, todo.vendor].filter(Boolean).join(" / ");
  const progress = getTodoProgress(todo);
  return `
    <tr>
      <td><button class="table-link" type="button" data-todo-edit="${escapeAttribute(todo.id)}">${escapeHtml(todo.title)}</button></td>
      <td>${todo.assignedBy ? escapeHtml(todo.assignedBy) : ""}</td>
      <td>${related ? escapeHtml(related) : `<span class="muted-cell">None</span>`}</td>
      <td class="note-cell">${todo.notes ? escapeHtml(todo.notes) : ""}</td>
      <td>${renderInlineSelect("todo-priority-select", todo.id, todo.priority, Object.keys(priorities))}</td>
      <td>${todo.due ? formatDate(todo.due) : "No date"}</td>
      <td>${renderInlineSelect("todo-status-select", todo.id, todo.status, todoColumns)}</td>
      <td><span class="progress-pill">${progress}%</span></td>
      <td>
        <div class="table-actions">
          <button class="edit-card promote-lead-button" type="button" data-todo-to-lead="${escapeAttribute(todo.id)}">Turn into Lead</button>
          <button class="edit-card" type="button" data-todo-edit="${escapeAttribute(todo.id)}">Edit</button>
        </div>
      </td>
    </tr>
  `;
}

function renderInlineSelect(className, id, value, options) {
  return `
    <select class="inline-select ${className}" data-id="${escapeAttribute(id)}">
      ${options.map((option) => `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
    </select>
  `;
}

function bindTodoTableActions(panel) {
  panel.querySelectorAll("[data-todo-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const todo = todos.find((item) => item.id === button.dataset.todoEdit);
      if (todo) openTodoForm(todo);
    });
  });
  panel.querySelectorAll("[data-todo-to-lead]").forEach((button) => {
    button.addEventListener("click", () => convertTodoToLead(button.dataset.todoToLead));
  });
  panel.querySelectorAll(".todo-priority-select").forEach((select) => {
    select.addEventListener("change", () => {
      todos = todos.map((todo) => (todo.id === select.dataset.id ? { ...todo, priority: select.value } : todo));
      persistTodos();
      renderTodoBoard();
    });
  });
  panel.querySelectorAll(".todo-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      todos = todos.map((todo) =>
        todo.id === select.dataset.id
          ? {
              ...todo,
              status: select.value,
              completedAt: select.value === "Done" ? todo.completedAt || new Date().toISOString() : ""
            }
          : todo
      );
      persistTodos();
      renderTodoBoard();
    });
  });
}

function createTodoCard(todo) {
  const card = document.createElement("article");
  card.className = `note-card todo-card priority-${todo.priority.toLowerCase()}`;
  if (isTodoOverdue(todo)) card.classList.add("overdue");
  card.draggable = true;
  const progress = getTodoProgress(todo);
  const related = [todo.account, todo.vendor].filter(Boolean).join(" / ");
  const subtasks = todo.subtasks.filter((subtask) => subtask.text);
  card.innerHTML = `
    <div class="card-summary">
      <button class="account-link todo-title-button" type="button">${escapeHtml(todo.title)}</button>
      <div class="summary-badges">
        <span class="badge">${escapeHtml(todo.priority)}</span>
        <span class="badge">${todo.due ? formatDate(todo.due) : "No date"}</span>
      </div>
    </div>
    <div class="card-details">
      <div class="badge-row">
        <span class="badge">${escapeHtml(todo.status)}</span>
        <span class="badge">${progress}% complete</span>
        ${isTodoOverdue(todo) ? `<span class="badge">Overdue</span>` : ""}
      </div>
      <div class="badge-row todo-card-meta">
        ${todo.assignedBy ? `<span class="meta">By: ${escapeHtml(todo.assignedBy)}</span>` : ""}
        ${related ? `<span class="meta">${escapeHtml(related)}</span>` : ""}
      </div>
      ${todo.notes ? `<p class="card-note">${escapeHtml(todo.notes)}</p>` : ""}
      ${
        subtasks.length
          ? `<div class="todo-subtask-preview">${subtasks
              .map((subtask) => `<div class="${subtask.done ? "done" : ""}">${subtask.done ? "Done: " : ""}${escapeHtml(subtask.text)}</div>`)
              .join("")}</div>`
          : ""
      }
      <div class="card-actions">
        <button class="edit-card promote-lead-button todo-to-lead-card" type="button">Turn into Lead</button>
        <button class="card-action archive-card todo-archive-card" type="button" aria-label="Archive" data-tooltip="Archive">${icons.archive}</button>
        <button class="card-action edit-note todo-edit-card" type="button" aria-label="Edit" data-tooltip="Edit">${icons.edit}</button>
        <button class="card-action delete-note todo-delete-card" type="button" aria-label="Delete" data-tooltip="Delete">${icons.trash}</button>
      </div>
    </div>
  `;
  card.addEventListener("dragstart", () => {
    draggedTodoId = todo.id;
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    draggedTodoId = null;
    card.classList.remove("dragging");
  });
  card.querySelector(".todo-title-button").addEventListener("click", () => openTodoForm(todo));
  card.querySelector(".todo-to-lead-card").addEventListener("click", (event) => {
    event.stopPropagation();
    convertTodoToLead(todo.id);
  });
  card.querySelector(".todo-archive-card").addEventListener("click", (event) => {
    event.stopPropagation();
    archiveTodo(todo.id);
  });
  card.querySelector(".todo-edit-card").addEventListener("click", (event) => {
    event.stopPropagation();
    openTodoForm(todo);
  });
  card.querySelector(".todo-delete-card").addEventListener("click", (event) => {
    event.stopPropagation();
    deleteTodoById(todo.id);
  });
  card.addEventListener("dblclick", () => openTodoForm(todo));
  return card;
}

function getVisibleTodos() {
  const query = elements.todoSearch.value.trim().toLowerCase();
  return todos
    .filter((todo) => {
      if (todo.archivedAt) return false;
      if (query && !getTodoSearchText(todo).includes(query)) return false;
      if (elements.todoPriorityFilter.value && todo.priority !== elements.todoPriorityFilter.value) return false;
      if (elements.todoAssignedFilter.value && !todo.assignedBy.toLowerCase().includes(elements.todoAssignedFilter.value.trim().toLowerCase())) return false;
      if (elements.todoStatusFilter.value && todo.status !== elements.todoStatusFilter.value) return false;
      if (elements.todoDueFilter.value && !matchesTodoDueFilter(todo, elements.todoDueFilter.value)) return false;
      return true;
    })
    .sort(compareTodos);
}

function getTodoSearchText(todo) {
  return [todo.title, todo.assignedBy, todo.account, todo.vendor, todo.notes, todo.status, todo.subtasks.map((subtask) => subtask.text).join(" ")].join(" ").toLowerCase();
}

function getSampleSearchText(sample) {
  return [sample.product, sample.orderedBy, sample.requestedFor, sample.orderType, sample.status, sample.note, (sample.attachments || []).map((file) => file.name).join(" ")]
    .join(" ")
    .toLowerCase();
}

function compareTodos(a, b) {
  return compareDue(a, b) || priorities[b.priority] - priorities[a.priority] || new Date(b.createdAt) - new Date(a.createdAt);
}

function openTodoForm(todo) {
  elements.todoForm.reset();
  elements.subtaskList.innerHTML = "";
  updateAccountSuggestions();
  updateVendorControls();
  const existing = todo ? normalizeTodo(todo) : null;
  elements.todoFormTitle.textContent = existing ? "Edit Task" : "Add Task";
  elements.todoId.value = existing?.id || "";
  elements.deleteTodo.hidden = !existing;
  elements.convertTodoToLead.hidden = !existing;
  elements.todoTitle.value = existing?.title || "";
  elements.todoPriority.value = existing?.priority || "Medium";
  elements.todoDue.value = existing?.due || "";
  elements.todoAssignedBy.value = existing?.assignedBy || "";
  elements.todoStatus.value = existing?.status || "New";
  elements.todoAccount.value = existing?.account || "";
  elements.todoVendor.value = existing?.vendor || "";
  elements.todoNotes.value = existing?.notes || "";
  elements.todoCreated.value = existing?.createdAt ? formatDateTime(existing.createdAt) : "";
  elements.todoCompleted.value = existing?.completedAt ? formatDateTime(existing.completedAt) : "";
  (existing?.subtasks.length ? existing.subtasks : [{ text: "", done: false }]).forEach((subtask) => addSubtaskRow(subtask));
  elements.todoFormDialog.showModal();
  setTimeout(() => elements.todoTitle.focus(), 0);
}

function closeTodoForm() {
  elements.todoFormDialog.close();
}

function saveTodo() {
  const id = elements.todoId.value || crypto.randomUUID();
  const existing = todos.find((todo) => todo.id === id);
  const status = elements.todoStatus.value;
  const operatorMatch = getMatchedAccountDirectoryEntry(elements.todoAccount.value);
  const vendorMatch = getMatchedVendorName(elements.todoVendor.value);
  const next = normalizeTodo({
    id,
    title: elements.todoTitle.value.trim(),
    priority: elements.todoPriority.value,
    due: elements.todoDue.value,
    assignedBy: elements.todoAssignedBy.value.trim(),
    account: operatorMatch?.name || elements.todoAccount.value.trim(),
    vendor: vendorMatch || elements.todoVendor.value.trim(),
    notes: elements.todoNotes.value.trim(),
    subtasks: readSubtasks(),
    status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    completedAt: status === "Done" ? existing?.completedAt || new Date().toISOString() : "",
    archivedAt: existing?.archivedAt || ""
  });
  const previousTodos = todos;
  todos = existing ? todos.map((todo) => (todo.id === id ? next : todo)) : [next, ...todos];
  if (!persistTodos()) {
    todos = previousTodos;
    return;
  }
  updateVendorControls();
  updateTimelineSearchSuggestions();
  closeTodoForm();
  renderTodoBoard();
}

function deleteCurrentTodo() {
  const id = elements.todoId.value;
  if (!id) return;
  deleteTodoById(id, () => {
    closeTodoForm();
    renderTodoBoard();
  });
}

function deleteTodoById(id, afterDelete = renderTodoBoard) {
  const todo = todos.find((item) => item.id === id);
  if (!confirm(todo?.title ? `Delete task "${todo.title}"?` : "Delete this task?")) return;
  todos = todos.filter((item) => item.id !== id);
  persistTodos();
  afterDelete();
}

function convertCurrentTodoToLead() {
  const id = elements.todoId.value;
  if (!id) return;
  const existing = todos.find((todo) => todo.id === id);
  if (!existing) return;
  const status = elements.todoStatus.value;
  const operatorMatch = getMatchedAccountDirectoryEntry(elements.todoAccount.value);
  const vendorMatch = getMatchedVendorName(elements.todoVendor.value);
  const updatedTodo = normalizeTodo({
    ...existing,
    title: elements.todoTitle.value.trim(),
    priority: elements.todoPriority.value,
    due: elements.todoDue.value,
    assignedBy: elements.todoAssignedBy.value.trim(),
    account: operatorMatch?.name || elements.todoAccount.value.trim(),
    vendor: vendorMatch || elements.todoVendor.value.trim(),
    notes: elements.todoNotes.value.trim(),
    subtasks: readSubtasks(),
    status,
    completedAt: status === "Done" ? existing.completedAt || new Date().toISOString() : ""
  });
  todos = todos.map((todo) => (todo.id === id ? updatedTodo : todo));
  convertTodoToLead(id, { closeFormAfter: true });
}

function convertTodoToLead(id, options = {}) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;
  const shouldConvert = confirm(todo.title ? `Turn task "${todo.title}" into a lead?` : "Turn this task into a lead?");
  if (!shouldConvert) return;
  const now = new Date().toISOString();
  const lead = normalizeCard({
    id: crypto.randomUUID(),
    account: todo.account || todo.title || "New Lead",
    accountNumber: "",
    distributor: "US Foods",
    note: buildLeadNoteFromTodo(todo),
    priority: todo.priority || "Medium",
    due: todo.due || "",
    status: "New Lead",
    source: "Email",
    salesRep: todo.assignedBy || "",
    products: todo.vendor
      ? [
          {
            id: crypto.randomUUID(),
            apn: "",
            description: "",
            vendor: todo.vendor
          }
        ]
      : [],
    attachments: [],
    vendorReports: {},
    createdAt: now,
    archivedAt: "",
    archiveOutcome: "",
    deletedAt: ""
  });
  cards = [lead, ...cards];
  todos = todos.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "Done",
          completedAt: item.completedAt || now,
          archivedAt: now
        }
      : item
  );
  if (!persist()) return;
  persistTodos();
  if (options.closeFormAfter && elements.todoFormDialog.open) closeTodoForm();
  render();
  renderTodoBoard();
  if (elements.archiveDialog.open) renderArchive();
  alert("That task is now a lead. The original task was moved to Archive.");
}

function buildLeadNoteFromTodo(todo) {
  const lines = [`Converted from To-Do: ${todo.title}`];
  if (todo.notes) lines.push("", todo.notes);
  if (todo.assignedBy) lines.push("", `Assigned by: ${todo.assignedBy}`);
  if (todo.vendor) lines.push(`Vendor: ${todo.vendor}`);
  const checklist = todo.subtasks.filter((subtask) => subtask.text);
  if (checklist.length) {
    lines.push("", "Checklist:");
    checklist.forEach((subtask) => lines.push(`${subtask.done ? "[x]" : "[ ]"} ${subtask.text}`));
  }
  return lines.join("\n");
}

function archiveTodo(id) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return;
  const shouldArchive = confirm(todo.title ? `Move task "${todo.title}" to Archive?` : "Move this task to Archive?");
  if (!shouldArchive) return;
  todos = todos.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "Done",
          completedAt: item.completedAt || new Date().toISOString(),
          archivedAt: new Date().toISOString()
        }
      : item
  );
  persistTodos();
  renderTodoBoard();
  if (elements.archiveDialog.open) renderArchive();
}

function addSubtaskRow(subtask = { text: "", done: false }, options = {}) {
  const row = document.createElement("div");
  row.className = "subtask-row";
  row.dataset.subtaskId = subtask.id || crypto.randomUUID();
  row.innerHTML = `
    <label class="subtask-check"><input class="subtask-done" type="checkbox" ${subtask.done ? "checked" : ""} /><span>Done</span></label>
    <input class="subtask-text" autocomplete="off" value="${escapeAttribute(subtask.text)}" placeholder="Checklist item" />
    <div class="subtask-actions">
      <button class="small-action subtask-edit" type="button">Edit</button>
      <button class="remove-product" type="button">Remove</button>
    </div>
  `;
  row.querySelector(".remove-product").addEventListener("click", () => row.remove());
  row.querySelector(".subtask-edit").addEventListener("click", () => toggleSubtaskEdit(row));
  row.querySelector(".subtask-done").addEventListener("change", maybePromptTodoDone);
  row.querySelector(".subtask-text").addEventListener("keydown", (event) => handleSubtaskTextKeydown(event, row));
  elements.subtaskList.appendChild(row);
  if (subtask.text && !options.focus) lockSubtaskRow(row);
  if (options.focus) row.querySelector(".subtask-text").focus();
}

function lockSubtaskRow(row) {
  const input = row.querySelector(".subtask-text");
  if (!input.value.trim()) return;
  input.readOnly = true;
  row.classList.add("subtask-locked");
  row.querySelector(".subtask-edit").textContent = "Edit";
}

function toggleSubtaskEdit(row) {
  const input = row.querySelector(".subtask-text");
  if (!input.readOnly) {
    lockSubtaskRow(row);
    return;
  }
  input.readOnly = false;
  row.classList.remove("subtask-locked");
  row.querySelector(".subtask-edit").textContent = "Done";
  input.focus();
  input.select();
}

function focusOrCreateNextSubtask(row) {
  const currentText = row.querySelector(".subtask-text").value.trim();
  if (!currentText) return;
  lockSubtaskRow(row);
  const nextRow = row.nextElementSibling;
  if (nextRow?.classList.contains("subtask-row")) {
    nextRow.querySelector(".subtask-text")?.focus();
    return;
  }
  addSubtaskRow(undefined, { focus: true });
}

function handleSubtaskTextKeydown(event, row) {
  if (event.key === "Enter") {
    event.preventDefault();
    focusOrCreateNextSubtask(row);
    return;
  }
  if (event.key === "Tab" && !event.shiftKey && !row.nextElementSibling?.classList.contains("subtask-row") && row.querySelector(".subtask-text").value.trim()) {
    event.preventDefault();
    focusOrCreateNextSubtask(row);
  }
}

function readSubtasks() {
  return [...elements.subtaskList.querySelectorAll(".subtask-row")]
    .map((row) => ({ id: row.dataset.subtaskId || crypto.randomUUID(), text: row.querySelector(".subtask-text").value.trim(), done: row.querySelector(".subtask-done").checked }))
    .filter((subtask) => subtask.text);
}

function maybePromptTodoDone() {
  const subtasks = readSubtasks();
  if (!subtasks.length || elements.todoStatus.value === "Done") return;
  if (subtasks.every((subtask) => subtask.done) && confirm("All subtasks are complete. Mark the main task Done?")) {
    elements.todoStatus.value = "Done";
  }
}

function getTodoProgress(todo) {
  if (!todo.subtasks.length) return todo.status === "Done" ? 100 : 0;
  return Math.round((todo.subtasks.filter((subtask) => subtask.done).length / todo.subtasks.length) * 100);
}

function onTodoDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function onTodoDrop(event) {
  event.preventDefault();
  const status = event.currentTarget.dataset.todoStatus;
  event.currentTarget.classList.remove("drag-over");
  if (!draggedTodoId || !status) return;
  todos = todos.map((todo) => (todo.id === draggedTodoId ? { ...todo, status, completedAt: status === "Done" ? todo.completedAt || new Date().toISOString() : "" } : todo));
  persistTodos();
  renderTodoBoard();
}

function updateTodoSummary() {
  const unarchivedTodos = todos.filter((todo) => !todo.archivedAt);
  const active = unarchivedTodos.filter((todo) => todo.status !== "Done");
  setText("todoAll", active.length);
  setText("todoOverdue", active.filter(isTodoOverdue).length);
  setText("todoToday", active.filter(isTodoDueToday).length);
  setText("todoWeek", active.filter(isTodoDueThisWeek).length);
  setText("todoNextWeek", active.filter(isTodoDueNextWeek).length);
  setText("todoMonth", active.filter(isTodoDueThisMonth).length);
  setText("todoNextMonth", active.filter(isTodoDueNextMonth).length);
}

function applyTodoQuickFilter(filter) {
  clearTodoFilters(false);
  if (filter === "all") {
    todoQuickListMode = false;
    activeTodoQuickFilter = "";
    renderTodoBoard();
    return;
  }
  todoQuickListMode = true;
  activeTodoQuickFilter = filter;
  if (["overdue", "today", "week", "nextWeek", "month", "nextMonth"].includes(filter)) elements.todoDueFilter.value = filter;
  else elements.todoStatusFilter.value = filter;
  renderTodoBoard();
}

function clearTodoFilters(shouldRender = true) {
  todoQuickListMode = false;
  activeTodoQuickFilter = "";
  elements.todoSearch.value = "";
  elements.todoPriorityFilter.value = "";
  elements.todoDueFilter.value = "";
  elements.todoAssignedFilter.value = "";
  elements.todoStatusFilter.value = "";
  if (shouldRender) renderTodoBoard();
}

function matchesTodoDueFilter(todo, filter) {
  if (filter === "none") return !todo.due;
  if (filter === "overdue") return isTodoOverdue(todo);
  if (filter === "today") return isTodoDueToday(todo);
  if (filter === "week") return isTodoDueThisWeek(todo);
  if (filter === "nextWeek") return isTodoDueNextWeek(todo);
  if (filter === "month") return isTodoDueThisMonth(todo);
  if (filter === "nextMonth") return isTodoDueNextMonth(todo);
  return true;
}

function getTodoQuickFilterLabel(filter) {
  const labels = {
    overdue: "Overdue tasks",
    today: "Due today",
    week: "Due this week",
    nextWeek: "Due next week",
    month: "Due this month",
    nextMonth: "Due next month"
  };
  return labels[filter] || "Task list";
}

function setActiveTodoQuickTile() {
  document.querySelectorAll("[data-todo-quick]").forEach((button) => {
    button.classList.toggle("active-summary", todoQuickListMode && button.dataset.todoQuick === activeTodoQuickFilter);
  });
}

function isTodoOverdue(todo) {
  return todo.due && todo.status !== "Done" && parseLocalDate(todo.due) < startOfToday();
}

function isTodoDueToday(todo) {
  return todo.due && todo.status !== "Done" && parseLocalDate(todo.due).getTime() === startOfToday().getTime();
}

function isTodoDueThisWeek(todo) {
  if (!todo.due || todo.status === "Done") return false;
  const date = parseLocalDate(todo.due);
  const today = startOfToday();
  return date >= today && date <= endOfWeek(today);
}

function isTodoDueNextWeek(todo) {
  if (!todo.due || todo.status === "Done") return false;
  const date = parseLocalDate(todo.due);
  const nextWeekStart = startOfNextWeek();
  const nextWeekEnd = endOfWeek(nextWeekStart);
  return date >= nextWeekStart && date <= nextWeekEnd;
}

function isTodoDueThisMonth(todo) {
  if (!todo.due || todo.status === "Done") return false;
  const date = parseLocalDate(todo.due);
  const today = startOfToday();
  return date >= today && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function isTodoDueNextMonth(todo) {
  if (!todo.due || todo.status === "Done") return false;
  const date = parseLocalDate(todo.due);
  const today = startOfToday();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return date.getFullYear() === nextMonth.getFullYear() && date.getMonth() === nextMonth.getMonth();
}

function isTodoCompletedThisMonth(todo) {
  if (!todo.completedAt) return false;
  const completed = new Date(todo.completedAt);
  const today = startOfToday();
  return completed.getFullYear() === today.getFullYear() && completed.getMonth() === today.getMonth();
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderArchive() {
  const query = elements.archiveSearch.value.trim().toLowerCase();
  const archivedCards = cards
    .filter((card) => card.archivedAt && !card.deletedAt)
    .filter((card) => !query || getCardSearchText(card).includes(query))
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
  const archivedTodos = todos
    .filter((todo) => todo.archivedAt)
    .filter((todo) => !query || getTodoSearchText(todo).includes(query))
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
  const archivedOperators = addressBook
    .filter((entry) => entry.archivedAt)
    .filter((entry) => !query || getAddressBookSearchText(entry).includes(query))
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
  const archivedSamples = samples
    .filter((sample) => sample.archivedAt)
    .filter((sample) => !query || getSampleSearchText(sample).includes(query))
    .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  const archiveHtml = [
    archivedCards.length ? `<div class="calendar-section-label">Leads</div>${archivedCards.map((card) => renderAccountNote(card, { archived: true })).join("")}` : "",
    archivedTodos.length ? `<div class="calendar-section-label">Tasks</div>${archivedTodos.map(renderArchivedTodo).join("")}` : "",
    archivedOperators.length ? `<div class="calendar-section-label">Operators</div>${archivedOperators.map(renderArchivedAddressBookEntry).join("")}` : "",
    archivedSamples.length ? `<div class="calendar-section-label">Samples</div>${archivedSamples.map(renderArchivedSample).join("")}` : ""
  ]
    .filter(Boolean)
    .join("");

  elements.archiveList.innerHTML = archiveHtml || `<div class="empty-state">No archived leads, tasks, operators, or samples found</div>`;

  elements.archiveList.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = cards.find((item) => item.id === button.dataset.editId);
      if (!note) return;
      closeArchiveWindow();
      openForm(note);
    });
  });
  elements.archiveList.querySelectorAll("[data-restore-id]").forEach((button) => {
    button.addEventListener("click", () => restoreCard(button.dataset.restoreId));
  });
  elements.archiveList.querySelectorAll("[data-restore-todo-id]").forEach((button) => {
    button.addEventListener("click", () => restoreTodo(button.dataset.restoreTodoId));
  });
  elements.archiveList.querySelectorAll("[data-archive-todo-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const todo = todos.find((item) => item.id === button.dataset.archiveTodoEdit);
      if (!todo) return;
      closeArchiveWindow();
      openTodoWindow();
      openTodoForm(todo);
    });
  });
  elements.archiveList.querySelectorAll("[data-restore-address-id]").forEach((button) => {
    button.addEventListener("click", () => restoreAddressBookEntry(button.dataset.restoreAddressId));
  });
  elements.archiveList.querySelectorAll("[data-archive-address-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = addressBook.find((item) => item.id === button.dataset.archiveAddressEdit);
      if (!entry) return;
      closeArchiveWindow();
      openAddressBookWindow();
      openAddressBookForm(entry);
    });
  });
  elements.archiveList.querySelectorAll("[data-restore-sample-id]").forEach((button) => {
    button.addEventListener("click", () => restoreSample(button.dataset.restoreSampleId));
  });
  elements.archiveList.querySelectorAll("[data-archive-sample-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = samples.find((item) => item.id === button.dataset.archiveSampleEdit);
      if (!sample) return;
      closeArchiveWindow();
      openSampleTrackerWindow();
      openSampleForm(sample);
    });
  });
}

function renderArchivedSample(sample) {
  return `
    <article class="account-note">
      <div class="account-note-header">
        <h3>${escapeHtml(sample.product || "Sample")}</h3>
        <div class="card-actions">
          <button class="edit-card" type="button" data-restore-sample-id="${escapeAttribute(sample.id)}">Restore</button>
          <button class="edit-card" type="button" data-archive-sample-edit="${escapeAttribute(sample.id)}">Edit</button>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">Sample</span>
        <span class="badge">${escapeHtml(sample.status)}</span>
        <span class="badge">${sample.expected ? formatDate(sample.expected) : "No date"}</span>
        ${sample.orderedBy ? `<span class="badge">By: ${escapeHtml(sample.orderedBy)}</span>` : ""}
      </div>
      ${sample.requestedFor ? `<div class="meta-row"><span class="meta">${escapeHtml(sample.requestedFor)}</span></div>` : ""}
      ${sample.note ? `<p class="card-note">${escapeHtml(sample.note)}</p>` : ""}
    </article>
  `;
}

function renderArchivedAddressBookEntry(entry) {
  return `
    <article class="account-note">
      <div class="account-note-header">
        <h3>${escapeHtml(entry.operation)}</h3>
        <div class="card-actions">
          <button class="edit-card" type="button" data-restore-address-id="${escapeAttribute(entry.id)}">Restore</button>
          <button class="edit-card" type="button" data-archive-address-edit="${escapeAttribute(entry.id)}">Edit</button>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">Operator</span>
        <span class="badge">Archived</span>
        ${entry.accountNumber ? `<span class="badge">USF: ${escapeHtml(entry.accountNumber)}</span>` : ""}
        ${entry.syscoAccountNumber ? `<span class="badge">Sysco: ${escapeHtml(entry.syscoAccountNumber)}</span>` : ""}
      </div>
      ${entry.address ? `<p class="card-note">${escapeHtml(entry.address)}</p>` : ""}
      ${entry.usfSalesRep || entry.syscoSalesRep ? `<div class="meta-row">${entry.usfSalesRep ? `<span class="meta">USF Rep: ${escapeHtml(entry.usfSalesRep)}</span>` : ""}${entry.syscoSalesRep ? `<span class="meta">Sysco Rep: ${escapeHtml(entry.syscoSalesRep)}</span>` : ""}</div>` : ""}
    </article>
  `;
}

function renderArchivedTodo(todo) {
  const related = [todo.account, todo.vendor].filter(Boolean).join(" / ");
  return `
    <article class="account-note priority-${todo.priority.toLowerCase()}">
      <div class="account-note-header">
        <h3>${escapeHtml(todo.title)}</h3>
        <div class="card-actions">
          <button class="edit-card" type="button" data-restore-todo-id="${escapeAttribute(todo.id)}">Restore</button>
          <button class="edit-card" type="button" data-archive-todo-edit="${escapeAttribute(todo.id)}">Edit</button>
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">Task</span>
        <span class="badge">${escapeHtml(todo.priority)}</span>
        <span class="badge">${todo.due ? formatDate(todo.due) : "No date"}</span>
        <span class="badge">${escapeHtml(todo.status)}</span>
        <span class="badge">Archived</span>
        ${todo.assignedBy ? `<span class="badge">By: ${escapeHtml(todo.assignedBy)}</span>` : ""}
      </div>
      ${related ? `<div class="meta-row"><span class="meta">${escapeHtml(related)}</span></div>` : ""}
      ${todo.notes ? `<p class="card-note">${escapeHtml(todo.notes)}</p>` : ""}
    </article>
  `;
}

function renderTrash() {
  const query = elements.trashSearch.value.trim().toLowerCase();
  const deletedCards = cards
    .filter((card) => card.deletedAt)
    .filter((card) => !query || getCardSearchText(card).includes(query))
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

  elements.trashList.innerHTML = deletedCards.length
    ? deletedCards.map((card) => renderAccountNote(card, { deleted: true })).join("")
    : `<div class="empty-state">Trash is empty</div>`;

  elements.trashList.querySelectorAll("[data-restore-deleted-id]").forEach((button) => {
    button.addEventListener("click", () => restoreDeletedCard(button.dataset.restoreDeletedId));
  });
  elements.trashList.querySelectorAll("[data-permanent-delete-id]").forEach((button) => {
    button.addEventListener("click", () => permanentlyDeleteCard(button.dataset.permanentDeleteId));
  });
}

function openAccountWindow(card) {
  const accountName = card.account || "Account";
  const matchingCards = cards
    .filter((item) => !item.deletedAt && item.account.trim().toLowerCase() === accountName.trim().toLowerCase())
    .sort(compareCards);
  const accountNumber = matchingCards.find((item) => item.accountNumber)?.accountNumber || "";

  elements.accountDialogTitle.textContent = accountName;
  elements.accountDialogSubtitle.textContent = accountNumber
    ? `Account # ${accountNumber} - ${matchingCards.length} note${matchingCards.length === 1 ? "" : "s"}`
    : `${matchingCards.length} note${matchingCards.length === 1 ? "" : "s"}`;

  elements.accountNotes.innerHTML = matchingCards.map(renderAccountNote).join("");
  elements.accountNotes.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = cards.find((item) => item.id === button.dataset.editId);
      if (!note) return;
      closeAccountWindow();
      openForm(note);
    });
  });
  elements.accountDialog.showModal();
}

function closeAccountWindow() {
  elements.accountDialog.close();
}

function renderAccountNote(card, options = {}) {
  const products = normalizeProducts(card);
  const productNumberLabel = getDistributorItemLabel(card.distributor);
  const productHtml = products.length
    ? `<div class="meta-row">${products
        .map((product) => {
          const vendor = product.vendor ? `${escapeHtml(product.vendor)}: ` : "";
          const apn = product.apn ? ` ${escapeHtml(productNumberLabel)}: ${escapeHtml(product.apn)}` : "";
          return `<span class="meta">${vendor}${escapeHtml(product.description)}${apn}</span>`;
        })
        .join("")}</div>`
    : "";
  return `
    <article class="account-note priority-${card.priority.toLowerCase()}">
      <div class="account-note-header">
        <h3>${escapeHtml(normalizeStatus(card.status))}</h3>
        <div class="card-actions">
          ${options.archived ? `<button class="edit-card" type="button" data-restore-id="${escapeAttribute(card.id)}">Restore</button>` : ""}
          ${options.deleted ? `<button class="edit-card" type="button" data-restore-deleted-id="${escapeAttribute(card.id)}">Restore</button>` : ""}
          ${options.deleted ? "" : `<button class="edit-card print-account-lead" type="button" data-print-id="${escapeAttribute(card.id)}">Print</button>`}
          ${options.deleted ? "" : `<button class="edit-card print-account-lead print-action" type="button" data-print-products-id="${escapeAttribute(card.id)}">Print Products</button>`}
          ${options.deleted ? `<button class="edit-card" type="button" data-permanent-delete-id="${escapeAttribute(card.id)}">Delete Forever</button>` : `<button class="edit-card" type="button" data-edit-id="${escapeAttribute(card.id)}">Edit</button>`}
        </div>
      </div>
      <div class="badge-row">
        <span class="badge">${escapeHtml(card.priority)}</span>
        <span class="badge">${card.due ? formatDate(card.due) : "No date"}</span>
        <span class="badge">${escapeHtml(card.source)}</span>
        ${card.archivedAt ? `<span class="badge">Archived${card.archiveOutcome ? `: ${escapeHtml(card.archiveOutcome)}` : ""}</span>` : ""}
        ${card.deletedAt ? `<span class="badge">Trash</span>` : ""}
        ${card.salesRep ? `<span class="badge">USF Rep: ${escapeHtml(card.salesRep)}</span>` : ""}
        ${card.syscoSalesRep ? `<span class="badge">Sysco Rep: ${escapeHtml(card.syscoSalesRep)}</span>` : ""}
      </div>
      <p class="card-note">${escapeHtml(card.note)}</p>
      ${productHtml}
      ${renderAttachmentLinks(card.attachments)}
    </article>
  `;
}

function getVisibleCards() {
  const query = elements.search.value.trim().toLowerCase();
  return cards
    .filter((card) => {
      if (card.archivedAt || card.deletedAt) return false;
      if (query && !getCardSearchText(card).includes(query)) return false;
      if (elements.vendorFilter.value && !cardHasVendor(card, elements.vendorFilter.value)) return false;
      if (elements.priorityFilter.value && card.priority !== elements.priorityFilter.value) return false;
      if (elements.sourceFilter.value && card.source !== elements.sourceFilter.value) return false;
      if (elements.statusFilter.value && normalizeStatus(card.status) !== elements.statusFilter.value) return false;
      if (elements.dueFilter.value && !matchesDueFilter(card, elements.dueFilter.value)) return false;
      return true;
    })
    .sort(compareCards);
}

function getCardSearchText(card) {
  const productText = normalizeProducts(card)
    .map((product) => `${product.vendor} ${product.description} ${product.apn}`)
    .join(" ");
  const attachmentText = (card.attachments || []).map((file) => file.name).join(" ");
  return [card.account, card.distributor, card.accountNumber, card.syscoAccountNumber, card.salesRep, card.syscoSalesRep, card.vendor, card.archiveOutcome, productText, attachmentText, card.note]
    .join(" ")
    .toLowerCase();
}

function cardHasVendor(card, vendor) {
  const target = String(vendor || "").trim().toLowerCase();
  if (!target) return true;
  return normalizeProducts(card).some((product) => product.vendor.toLowerCase() === target);
}

function compareCards(a, b) {
  if (elements.sort.value === "priority") {
    return priorities[b.priority] - priorities[a.priority] || compareDue(a, b);
  }
  if (elements.sort.value === "newest") {
    return new Date(b.createdAt) - new Date(a.createdAt);
  }
  return compareDue(a, b) || priorities[b.priority] - priorities[a.priority];
}

function compareDue(a, b) {
  if (!a.due && !b.due) return 0;
  if (!a.due) return 1;
  if (!b.due) return -1;
  return parseLocalDate(a.due) - parseLocalDate(b.due);
}

function openForm(card) {
  elements.form.reset();
  updateAccountSuggestions();
  elements.cardId.value = card?.id || "";
  elements.dialogTitle.textContent = card ? "Edit Lead" : "Add Lead";
  elements.deleteCard.hidden = !card;
  elements.archiveCard.hidden = !card || Boolean(card.archivedAt);
  elements.productList.innerHTML = "";
  currentAttachments = card?.attachments ? card.attachments.map(normalizeAttachment) : [];
  currentLeadNoteHistory = normalizeLeadNoteHistory(card);
  renderLeadNoteHistory();
  renderAttachmentList();

  if (card) {
    elements.account.value = card.account;
    elements.accountNumber.value = card.accountNumber || "";
    elements.syscoAccountNumber.value = card.syscoAccountNumber || "";
    elements.leadDistributor.value = card.distributor || "US Foods";
    elements.note.value = "";
    elements.priority.value = card.priority;
    elements.due.value = card.due;
    elements.status.value = normalizeStatus(card.status);
    elements.source.value = card.source;
    elements.salesRep.value = card.salesRep || "";
    elements.syscoSalesRep.value = card.syscoSalesRep || "";
    const products = normalizeProducts(card);
    if (products.length) products.forEach((product) => addProductRow(product));
    else addProductRow();
  } else {
    elements.priority.value = "Medium";
    elements.accountNumber.value = "";
    elements.syscoAccountNumber.value = "";
    elements.leadDistributor.value = "US Foods";
    elements.status.value = elements.statusFilter.value || "New Lead";
    elements.source.value = "Email";
    elements.salesRep.value = "";
    elements.syscoSalesRep.value = "";
    elements.note.value = "";
    addProductRow();
  }

  updateProductNumberLabels();
  elements.dialog.showModal();
  setTimeout(() => elements.account.focus(), 0);
}

function closeForm() {
  elements.dialog.close();
}

function saveCard() {
  const id = elements.cardId.value || crypto.randomUUID();
  const existing = cards.find((card) => card.id === id);
  const noteHistory = buildLeadNoteHistoryForSave();
  const next = {
    id,
    account: elements.account.value.trim(),
    accountNumber: elements.accountNumber.value.trim(),
    syscoAccountNumber: elements.syscoAccountNumber.value.trim(),
    distributor: elements.leadDistributor.value || "US Foods",
    note: getLeadNoteHistoryText(noteHistory),
    noteHistory,
    priority: elements.priority.value,
    due: elements.due.value,
    status: normalizeStatus(elements.status.value),
    source: elements.source.value,
    salesRep: elements.salesRep.value.trim(),
    syscoSalesRep: elements.syscoSalesRep.value.trim(),
    products: readProducts(),
    vendorReports: existing?.vendorReports || {},
    attachments: currentAttachments.map(normalizeAttachment),
    archivedAt: existing?.archivedAt || "",
    archiveOutcome: existing?.archiveOutcome || "",
    deletedAt: existing?.deletedAt || "",
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  syncLeadProductsToStock(next.products, next.distributor);

  if (existing) {
    cards = cards.map((card) => (card.id === id ? next : card));
  } else {
    cards = [next, ...cards];
  }

  if (!persist()) return;
  closeForm();
  render();
}

function renderDotOrders() {
  updateDotSummary();
  const visibleOrders = getVisibleDotOrders();
  setActiveDotQuickTile();
  elements.dotCount.textContent = visibleOrders.length;
  if (!visibleOrders.length) {
    elements.dotTable.innerHTML = `<div class="empty-state">No DOT orders found</div>`;
    return;
  }
  elements.dotTable.innerHTML = `
    <table class="quick-table sample-table">
      <thead>
        <tr>
          <th>Products ordered</th>
          <th>Ordered date</th>
          <th>PO / order #</th>
          <th>Who ordered</th>
          <th>ETA</th>
          <th>Storage</th>
          <th>For account / distributor</th>
          <th>Status</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${visibleOrders.map(renderDotRow).join("")}</tbody>
    </table>
  `;
  bindDotTableActions();
}

function renderDotRow(order) {
  const productText = getDotProductText(order);
  return `
    <tr>
      <td><button class="table-link sample-product-link" type="button" data-dot-edit="${escapeAttribute(order.id)}">${escapeHtml(productText || "DOT order")}</button></td>
      <td>${order.orderedDate ? formatDate(order.orderedDate) : ""}</td>
      <td>${escapeHtml(order.poNumber)}</td>
      <td>${escapeHtml(order.orderedBy)}</td>
      <td>${order.expected ? formatDate(order.expected) : "No date"}</td>
      <td>${escapeHtml(order.storageType)}</td>
      <td>${escapeHtml(order.requestedFor)}</td>
      <td>${renderInlineSelect("dot-status-select", order.id, order.status, dotOrderStatuses)}</td>
      <td class="note-cell">${escapeHtml(order.note)}${order.attachments?.length ? `<div><span class="badge">${order.attachments.length} file${order.attachments.length === 1 ? "" : "s"}</span></div>` : ""}</td>
      <td><button class="edit-card" type="button" data-dot-edit="${escapeAttribute(order.id)}">Edit</button></td>
    </tr>
  `;
}

function getDotProductText(order) {
  const products = normalizeDotProducts(order);
  return products.map((product) => product.text).join(", ") || order.product || "";
}

function bindDotTableActions() {
  elements.dotTable.querySelectorAll("[data-dot-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = dotOrders.find((item) => item.id === button.dataset.dotEdit);
      if (order) openDotForm(order);
    });
  });
  elements.dotTable.querySelectorAll(".dot-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      dotOrders = dotOrders.map((order) =>
        order.id === select.dataset.id
          ? {
              ...order,
              status: select.value,
              archivedAt: ["Delivered", "Cancelled"].includes(select.value) ? order.archivedAt || new Date().toISOString() : order.archivedAt,
              updatedAt: new Date().toISOString()
            }
          : order
      );
      persistDotOrders();
      renderDotOrders();
    });
  });
}

function getVisibleDotOrders() {
  const query = elements.dotSearch.value.trim().toLowerCase();
  return dotOrders
    .filter((order) => !order.archivedAt)
    .filter((order) => {
      if (activeDotQuickFilter && activeDotQuickFilter !== "all" && !matchesDotQuickFilter(order, activeDotQuickFilter)) return false;
      if (elements.dotDateFilter.value && !matchesDotQuickFilter(order, elements.dotDateFilter.value)) return false;
      if (elements.dotStatusFilter.value && order.status !== elements.dotStatusFilter.value) return false;
      if (!query) return true;
      return [
        getDotProductText(order),
        order.vendor,
        order.dotNumber,
        order.orderedDate,
        order.poNumber,
        order.orderedBy,
        order.expected,
        order.storageType,
        order.requestedFor,
        order.status,
        order.note,
        ...(order.attachments || []).map((file) => file.name)
      ].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => (a.expected || "9999-12-31").localeCompare(b.expected || "9999-12-31") || getDotProductText(a).localeCompare(getDotProductText(b)));
}

function matchesDotQuickFilter(order, filter) {
  if (filter === "overdue") return isDotOverdue(order);
  if (filter === "today") return isDueToday(order.expected);
  if (filter === "week") return isDueThisWeek(order.expected);
  if (filter === "ordered") return ["Ordered", "In Transit"].includes(order.status);
  if (filter === "received") return order.status === "Received";
  if (filter === "none") return !order.expected;
  return true;
}

function updateDotSummary() {
  const activeOrders = dotOrders.filter((order) => !order.archivedAt && order.status !== "Cancelled");
  document.querySelector("#dotAll").textContent = activeOrders.length;
  document.querySelector("#dotToday").textContent = activeOrders.filter((order) => isDueToday(order.expected)).length;
  document.querySelector("#dotWeek").textContent = activeOrders.filter((order) => isDueThisWeek(order.expected)).length;
  document.querySelector("#dotOverdue").textContent = activeOrders.filter(isDotOverdue).length;
  document.querySelector("#dotOrdered").textContent = activeOrders.filter((order) => ["Ordered", "In Transit"].includes(order.status)).length;
  document.querySelector("#dotReceived").textContent = activeOrders.filter((order) => order.status === "Received").length;
}

function setActiveDotQuickTile() {
  document.querySelectorAll("[data-dot-quick]").forEach((button) => {
    button.classList.toggle("active-summary", button.dataset.dotQuick === activeDotQuickFilter);
  });
}

function openDotForm(order) {
  const existing = order || null;
  elements.dotFormTitle.textContent = existing ? "Edit DOT Order" : "Add DOT Order";
  elements.dotId.value = existing?.id || "";
  elements.dotProduct.value = existing ? normalizeDotProducts(existing).map((product) => product.text).join("\n") : "";
  elements.dotOrderedDate.value = existing?.orderedDate || "";
  elements.dotPo.value = existing?.poNumber || "";
  elements.dotOrderedBy.value = existing?.orderedBy || "";
  elements.dotExpected.value = existing?.expected || "";
  elements.dotStorageType.value = existing?.storageType || "";
  elements.dotRequestedFor.value = existing?.requestedFor || "";
  elements.dotStatus.value = existing?.status || "Need to Order";
  elements.dotNote.value = existing?.note || "";
  currentDotAttachments = existing?.attachments ? existing.attachments.map(normalizeAttachment) : [];
  renderDotAttachmentList();
  elements.deleteDotOrder.hidden = !existing;
  elements.dotFormDialog.showModal();
  elements.dotProduct.focus();
}

function closeDotForm() {
  elements.dotFormDialog.close();
}

function saveDotOrder() {
  const id = elements.dotId.value || crypto.randomUUID();
  const existing = dotOrders.find((order) => order.id === id);
  const status = elements.dotStatus.value;
  const order = normalizeDotOrder({
    id,
    product: elements.dotProduct.value.trim(),
    vendor: existing?.vendor || "",
    dotNumber: existing?.dotNumber || "",
    orderedDate: elements.dotOrderedDate.value,
    poNumber: elements.dotPo.value.trim(),
    orderedBy: elements.dotOrderedBy.value.trim(),
    expected: elements.dotExpected.value,
    storageType: elements.dotStorageType.value,
    requestedFor: elements.dotRequestedFor.value.trim(),
    status,
    note: elements.dotNote.value.trim(),
    attachments: currentDotAttachments.map(normalizeAttachment),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: ["Delivered", "Cancelled"].includes(status) ? existing?.archivedAt || new Date().toISOString() : ""
  });
  dotOrders = existing ? dotOrders.map((item) => (item.id === id ? order : item)) : [order, ...dotOrders];
  persistDotOrders();
  closeDotForm();
  renderDotOrders();
}

function deleteCurrentDotOrder() {
  const id = elements.dotId.value;
  if (!id) return;
  if (!confirm("Delete this DOT order?")) return;
  dotOrders = dotOrders.filter((order) => order.id !== id);
  persistDotOrders();
  closeDotForm();
  renderDotOrders();
}

function clearDotFilters() {
  elements.dotSearch.value = "";
  elements.dotDateFilter.value = "";
  elements.dotStatusFilter.value = "";
  activeDotQuickFilter = "";
  renderDotOrders();
}

function handleDotAttachmentFiles(event) {
  const files = [...(event.target.files || [])];
  elements.dotAttachmentInput.value = "";
  if (!files.length) return;
  addDotAttachmentFiles(files);
}

function handleDotAttachmentPaste(event) {
  const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  event.preventDefault();
  addDotAttachmentFiles(
    files.map((file, index) => {
      const extension = file.type.split("/")[1] || "png";
      const name = `Screenshot ${formatDateTimeForFile(new Date())}${files.length > 1 ? ` ${index + 1}` : ""}.${extension}`;
      return new File([file], name, { type: file.type, lastModified: file.lastModified });
    })
  );
}

function addDotAttachmentFiles(files) {
  readAttachmentFiles(files)
    .then((attachments) => {
      currentDotAttachments = [...currentDotAttachments, ...attachments];
      renderDotAttachmentList();
    })
    .catch(() => alert("One of the attachments could not be added."));
}

function renderDotAttachmentList() {
  if (!currentDotAttachments.length) {
    elements.dotAttachmentList.innerHTML = `<div class="empty-state attachment-empty">No files attached yet</div>`;
    return;
  }
  elements.dotAttachmentList.innerHTML = currentDotAttachments
    .map(
      (file) => `
        <div class="attachment-row">
          <div class="attachment-main">
            <strong>${escapeHtml(file.name)}</strong>
            <span>${formatFileSize(file.size)}</span>
          </div>
          <div class="attachment-actions">
            <button class="attachment-link" type="button" data-preview-attachment="${escapeAttribute(file.id)}">Preview</button>
            <button class="remove-product" type="button" data-remove-dot-attachment="${escapeAttribute(file.id)}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
  elements.dotAttachmentList.querySelectorAll("[data-remove-dot-attachment]").forEach((button) => {
    button.addEventListener("click", () => {
      currentDotAttachments = currentDotAttachments.filter((file) => file.id !== button.dataset.removeDotAttachment);
      renderDotAttachmentList();
    });
  });
}

function renderNestleMachines() {
  updateNestleSummary();
  const visibleMachines = getVisibleNestleMachines();
  setActiveNestleQuickTile();
  elements.nestleCount.textContent = visibleMachines.length;
  if (!visibleMachines.length) {
    elements.nestleTable.innerHTML = `<div class="empty-state">No Nestle machines found</div>`;
    return;
  }
  elements.nestleTable.innerHTML = `
    <table class="quick-table sample-table">
      <thead>
        <tr>
          <th>Machine / program</th>
          <th>Operator</th>
          <th>Location</th>
          <th>Contact</th>
          <th>Serial #</th>
          <th>Due / follow-up</th>
          <th>Sales rep</th>
          <th>Status</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${visibleMachines.map(renderNestleRow).join("")}</tbody>
    </table>
  `;
  bindNestleTableActions();
}

function renderNestleRow(machine) {
  return `
    <tr>
      <td><button class="table-link sample-product-link" type="button" data-nestle-edit="${escapeAttribute(machine.id)}">${escapeHtml(machine.machine)}</button></td>
      <td>${escapeHtml(machine.account)}</td>
      <td>${escapeHtml(machine.location)}</td>
      <td>${escapeHtml(machine.contact)}</td>
      <td>${escapeHtml(machine.serial)}</td>
      <td>${machine.expected ? formatDate(machine.expected) : "No date"}</td>
      <td>${escapeHtml(machine.salesRep)}</td>
      <td>${renderInlineSelect("nestle-status-select", machine.id, machine.status, nestleMachineStatuses)}</td>
      <td class="note-cell">${escapeHtml(machine.note)}</td>
      <td><button class="edit-card" type="button" data-nestle-edit="${escapeAttribute(machine.id)}">Edit</button></td>
    </tr>
  `;
}

function bindNestleTableActions() {
  elements.nestleTable.querySelectorAll("[data-nestle-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const machine = nestleMachines.find((item) => item.id === button.dataset.nestleEdit);
      if (machine) openNestleForm(machine);
    });
  });
  elements.nestleTable.querySelectorAll(".nestle-status-select").forEach((select) => {
    select.addEventListener("change", () => {
      nestleMachines = nestleMachines.map((machine) =>
        machine.id === select.dataset.id
          ? {
              ...machine,
              status: select.value,
              archivedAt: ["Installed", "Returned", "Cancelled"].includes(select.value) ? machine.archivedAt || new Date().toISOString() : machine.archivedAt,
              updatedAt: new Date().toISOString()
            }
          : machine
      );
      persistNestleMachines();
      renderNestleMachines();
    });
  });
}

function getVisibleNestleMachines() {
  const query = elements.nestleSearch.value.trim().toLowerCase();
  return nestleMachines
    .filter((machine) => !machine.archivedAt)
    .filter((machine) => {
      if (activeNestleQuickFilter && activeNestleQuickFilter !== "all" && !matchesNestleQuickFilter(machine, activeNestleQuickFilter)) return false;
      if (elements.nestleDateFilter.value && !matchesNestleQuickFilter(machine, elements.nestleDateFilter.value)) return false;
      if (elements.nestleStatusFilter.value && machine.status !== elements.nestleStatusFilter.value) return false;
      if (!query) return true;
      return [machine.machine, machine.account, machine.location, machine.contact, machine.serial, machine.salesRep, machine.status, machine.note].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (a.expected || "9999-12-31").localeCompare(b.expected || "9999-12-31") || a.machine.localeCompare(b.machine));
}

function matchesNestleQuickFilter(machine, filter) {
  if (filter === "overdue") return isNestleOverdue(machine);
  if (filter === "today") return isDueToday(machine.expected);
  if (filter === "week") return isDueThisWeek(machine.expected);
  if (filter === "installed") return machine.status === "Installed";
  if (filter === "service") return machine.status === "Needs Service";
  if (filter === "none") return !machine.expected;
  return true;
}

function updateNestleSummary() {
  const activeMachines = nestleMachines.filter((machine) => !machine.archivedAt && machine.status !== "Cancelled");
  document.querySelector("#nestleAll").textContent = activeMachines.length;
  document.querySelector("#nestleToday").textContent = activeMachines.filter((machine) => isDueToday(machine.expected)).length;
  document.querySelector("#nestleWeek").textContent = activeMachines.filter((machine) => isDueThisWeek(machine.expected)).length;
  document.querySelector("#nestleOverdue").textContent = activeMachines.filter(isNestleOverdue).length;
  document.querySelector("#nestleInstalled").textContent = activeMachines.filter((machine) => machine.status === "Installed").length;
  document.querySelector("#nestleService").textContent = activeMachines.filter((machine) => machine.status === "Needs Service").length;
}

function setActiveNestleQuickTile() {
  document.querySelectorAll("[data-nestle-quick]").forEach((button) => {
    button.classList.toggle("active-summary", button.dataset.nestleQuick === activeNestleQuickFilter);
  });
}

function openNestleForm(machine) {
  const existing = machine || null;
  elements.nestleFormTitle.textContent = existing ? "Edit Nestle Machine" : "Add Nestle Machine";
  elements.nestleId.value = existing?.id || "";
  elements.nestleMachine.value = existing?.machine || "";
  elements.nestleAccount.value = existing?.account || "";
  elements.nestleLocation.value = existing?.location || "";
  elements.nestleContact.value = existing?.contact || "";
  elements.nestleSerial.value = existing?.serial || "";
  elements.nestleExpected.value = existing?.expected || "";
  elements.nestleStatus.value = existing?.status || "Requested";
  elements.nestleSalesRep.value = existing?.salesRep || "";
  elements.nestleNote.value = existing?.note || "";
  elements.deleteNestleMachine.hidden = !existing;
  elements.nestleFormDialog.showModal();
  elements.nestleMachine.focus();
}

function closeNestleForm() {
  elements.nestleFormDialog.close();
}

function saveNestleMachine() {
  const id = elements.nestleId.value || crypto.randomUUID();
  const existing = nestleMachines.find((machine) => machine.id === id);
  const status = elements.nestleStatus.value;
  const machine = normalizeNestleMachine({
    id,
    machine: elements.nestleMachine.value.trim(),
    account: elements.nestleAccount.value.trim(),
    location: elements.nestleLocation.value.trim(),
    contact: elements.nestleContact.value.trim(),
    serial: elements.nestleSerial.value.trim(),
    expected: elements.nestleExpected.value,
    status,
    salesRep: elements.nestleSalesRep.value.trim(),
    note: elements.nestleNote.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: ["Installed", "Returned", "Cancelled"].includes(status) ? existing?.archivedAt || new Date().toISOString() : ""
  });
  nestleMachines = existing ? nestleMachines.map((item) => (item.id === id ? machine : item)) : [machine, ...nestleMachines];
  persistNestleMachines();
  closeNestleForm();
  renderNestleMachines();
}

function deleteCurrentNestleMachine() {
  const id = elements.nestleId.value;
  if (!id) return;
  if (!confirm("Delete this Nestle machine entry?")) return;
  nestleMachines = nestleMachines.filter((machine) => machine.id !== id);
  persistNestleMachines();
  closeNestleForm();
  renderNestleMachines();
}

function clearNestleFilters() {
  elements.nestleSearch.value = "";
  elements.nestleDateFilter.value = "";
  elements.nestleStatusFilter.value = "";
  activeNestleQuickFilter = "";
  renderNestleMachines();
}

function normalizeLeadNoteHistory(card) {
  if (!card) return [];
  if (Array.isArray(card.noteHistory) && card.noteHistory.length) {
    return card.noteHistory
      .map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        text: String(entry.text || "").trim(),
        createdAt: entry.createdAt || card.createdAt || new Date().toISOString(),
        updatedAt: entry.updatedAt || ""
      }))
      .filter((entry) => entry.text);
  }
  const legacyNote = String(card.note || "").trim();
  return legacyNote
    ? [
        {
          id: crypto.randomUUID(),
          text: legacyNote,
          createdAt: card.createdAt || new Date().toISOString(),
          updatedAt: ""
        }
      ]
    : [];
}

function renderLeadNoteHistory() {
  if (!elements.leadNoteHistory) return;
  elements.leadNoteHistory.hidden = !currentLeadNoteHistory.length;
  elements.leadNoteHistory.innerHTML = currentLeadNoteHistory
    .map(
      (entry) => `
        <article class="lead-note-entry" data-note-entry="${escapeAttribute(entry.id)}">
          <div class="lead-note-entry-header">
            <strong>${escapeHtml(formatDateTime(entry.createdAt))}</strong>
            <button class="ghost-action note-edit-action" type="button" data-edit-lead-note="${escapeAttribute(entry.id)}">Edit</button>
          </div>
          <p>${escapeHtml(entry.text)}</p>
          ${entry.updatedAt ? `<small>Edited ${escapeHtml(formatDateTime(entry.updatedAt))}</small>` : ""}
        </article>
      `
    )
    .join("");
  elements.leadNoteHistory.querySelectorAll("[data-edit-lead-note]").forEach((button) => {
    button.addEventListener("click", () => editLeadNoteHistoryEntry(button.dataset.editLeadNote));
  });
}

function editLeadNoteHistoryEntry(entryId) {
  const entry = currentLeadNoteHistory.find((item) => item.id === entryId);
  const entryEl = elements.leadNoteHistory?.querySelector(`[data-note-entry="${CSS.escape(entryId)}"]`);
  if (!entry || !entryEl) return;
  entryEl.innerHTML = `
    <div class="lead-note-entry-header">
      <strong>${escapeHtml(formatDateTime(entry.createdAt))}</strong>
      <div class="lead-note-edit-actions">
        <button class="ghost-action note-cancel-action" type="button" data-cancel-lead-note="${escapeAttribute(entry.id)}">Cancel</button>
        <button class="primary-action note-save-action" type="button" data-save-lead-note="${escapeAttribute(entry.id)}">Save</button>
      </div>
    </div>
    <textarea class="lead-note-edit-input" rows="4">${escapeHtml(entry.text)}</textarea>
  `;
  const textarea = entryEl.querySelector(".lead-note-edit-input");
  textarea.focus();
  entryEl.querySelector("[data-cancel-lead-note]").addEventListener("click", renderLeadNoteHistory);
  entryEl.querySelector("[data-save-lead-note]").addEventListener("click", () => {
    const text = textarea.value.trim();
    currentLeadNoteHistory = currentLeadNoteHistory.map((item) =>
      item.id === entryId ? { ...item, text, updatedAt: new Date().toISOString() } : item
    ).filter((item) => item.text);
    renderLeadNoteHistory();
  });
}

function saveLeadNoteEntry() {
  const text = elements.note.value.trim();
  if (!text) {
    elements.note.focus();
    return;
  }
  currentLeadNoteHistory.push({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString(),
    updatedAt: ""
  });
  elements.note.value = "";
  renderLeadNoteHistory();
  elements.note.focus();
}

function buildLeadNoteHistoryForSave() {
  const newNote = elements.note.value.trim();
  const history = currentLeadNoteHistory.map((entry) => ({ ...entry }));
  if (newNote) {
    history.push({
      id: crypto.randomUUID(),
      text: newNote,
      createdAt: new Date().toISOString(),
      updatedAt: ""
    });
  }
  return history;
}

function getLeadNoteHistoryText(noteHistory) {
  return noteHistory
    .map((entry) => `${formatDateTime(entry.createdAt)}\n${entry.text}`)
    .join("\n\n");
}

function getCurrentLeadForPrint() {
  const id = elements.cardId.value;
  const existing = cards.find((card) => card.id === id);
  const noteHistory = buildLeadNoteHistoryForSave();
  return normalizeCard({
    id: id || "preview",
    account: elements.account.value.trim() || "Untitled account",
    accountNumber: elements.accountNumber.value.trim(),
    syscoAccountNumber: elements.syscoAccountNumber.value.trim(),
    distributor: elements.leadDistributor.value || "US Foods",
    note: getLeadNoteHistoryText(noteHistory),
    noteHistory,
    priority: elements.priority.value,
    due: elements.due.value,
    status: normalizeStatus(elements.status.value),
    source: elements.source.value,
    salesRep: elements.salesRep.value.trim(),
    syscoSalesRep: elements.syscoSalesRep.value.trim(),
    products: readProducts(),
    attachments: currentAttachments.map(normalizeAttachment),
    vendorReports: existing?.vendorReports || {},
    archivedAt: existing?.archivedAt || "",
    archiveOutcome: existing?.archiveOutcome || "",
    deletedAt: existing?.deletedAt || "",
    createdAt: existing?.createdAt || new Date().toISOString()
  });
}

function printCurrentLead(mode) {
  const card = getCurrentLeadForPrint();
  const products = normalizeProducts(card);
  if (mode === "products" && !products.length) {
    alert("No products to print for this lead yet.");
    return;
  }
  openPrintWindow(renderLeadPrintDocument(card, mode));
}

function renderLeadPrintDocument(card, mode) {
  const isProductsOnly = mode === "products";
  const title = isProductsOnly ? `${card.account} - Product List` : `${card.account} - Lead`;
  const products = normalizeProducts(card);
  const imageAttachments = (card.attachments || []).filter((file) => String(file.type || "").startsWith("image/"));
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 0; padding: 28px; color: #211d18; font: 14px Arial, sans-serif; }
          h1 { margin: 0 0 4px; font-size: 26px; }
          h2 { margin: 24px 0 8px; font-size: 16px; }
          .muted { color: #5d554b; font-weight: 700; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 18px 0; }
          .meta-box { border: 1px solid #d8cdbc; border-radius: 8px; padding: 9px; }
          .label { display: block; color: #635848; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #d8cdbc; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f6d66f; font-size: 12px; text-transform: uppercase; }
          .note { border: 1px solid #d8cdbc; border-radius: 8px; padding: 12px; white-space: pre-wrap; }
          .images { display: grid; gap: 16px; }
          .images img { max-width: 100%; border: 1px solid #d8cdbc; border-radius: 8px; }
          @media print { body { padding: 18px; } button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
        ${isProductsOnly ? "" : renderLeadPrintMeta(card)}
        ${isProductsOnly ? "" : `<h2>Note</h2><div class="note">${escapeHtml(card.note || "No note")}</div>`}
        <h2>Products</h2>
        ${renderProductPrintTable(products, card.distributor)}
        ${!isProductsOnly && imageAttachments.length ? `<h2>Attached Screenshots / Images</h2><div class="images">${imageAttachments.map((file) => `<div><strong>${escapeHtml(file.name)}</strong><img src="${escapeAttribute(file.data)}" alt="${escapeAttribute(file.name)}" /></div>`).join("")}</div>` : ""}
      </body>
    </html>`;
}

function renderLeadPrintMeta(card) {
  const fields = [
    ["Distributor", card.distributor || "US Foods"],
    ["USF Acct. #", card.accountNumber || "None"],
    ["Sysco Acct. #", card.syscoAccountNumber || "None"],
    ["Priority", card.priority],
    ["Follow-up date", card.due ? formatDate(card.due) : "No date"],
    ["Status", normalizeStatus(card.status)],
    ["Source", card.source],
    ["USF Sales rep", card.salesRep || "None"],
    ["Sysco Sales rep", card.syscoSalesRep || "None"]
  ];
  return `<div class="meta-grid">${fields
    .map(([label, value]) => `<div class="meta-box"><span class="label">${escapeHtml(label)}</span>${escapeHtml(value)}</div>`)
    .join("")}</div>`;
}

function renderProductPrintTable(products, distributor = "US Foods") {
  if (!products.length) return `<div class="note">No products entered.</div>`;
  return `<table>
    <thead><tr><th>${escapeHtml(getDistributorItemLabel(distributor))}</th><th>Description</th><th>Vendor / Brand</th></tr></thead>
    <tbody>${products
      .map(
        (product) =>
          `<tr><td>${escapeHtml(product.apn || "")}</td><td>${escapeHtml(product.description || "")}</td><td>${escapeHtml(product.vendor || "")}</td></tr>`
      )
      .join("")}</tbody>
  </table>`;
}

function printLeadList(leadCards, title) {
  if (!leadCards.length) {
    alert("No leads to print in this view.");
    return;
  }
  openPrintWindow(renderLeadListPrintDocument(leadCards, title));
}

function openWeeklyRecapDialog() {
  elements.weeklyRecapDialog.showModal();
}

function closeWeeklyRecapDialog() {
  elements.weeklyRecapDialog.close();
}

function printSelectedWeeklyRecap() {
  const selectedRanges = [...document.querySelectorAll("[data-weekly-recap-check]:checked")].map((input) => input.value);
  if (!selectedRanges.length) {
    alert("Choose at least one week to print.");
    return;
  }
  closeWeeklyRecapDialog();
  printWeeklyLeadRecap(selectedRanges);
}

function printWeeklyLeadRecap(rangeKeys = ["this"]) {
  const activeLeads = cards.filter((card) => !card.archivedAt && !card.deletedAt);
  openPrintWindow(renderWeeklyLeadRecapPrintDocument(activeLeads, rangeKeys));
}

function renderWeeklyLeadRecapPrintDocument(leadCards, rangeKeys = ["this"]) {
  const selectedRangeKeys = Array.isArray(rangeKeys) ? rangeKeys : [rangeKeys];
  const thisWeekStart = startOfCalendarWeek(startOfToday());
  const lastWeekStart = addDays(thisWeekStart, -7);
  const nextWeekStart = addDays(thisWeekStart, 7);
  const allSections = [
    { key: "last", title: "Last Week", start: lastWeekStart, end: addDays(lastWeekStart, 6) },
    { key: "this", title: "This Week", start: thisWeekStart, end: addDays(thisWeekStart, 6) },
    { key: "next", title: "Next Week", start: nextWeekStart, end: addDays(nextWeekStart, 6) }
  ];
  const sections = allSections.filter((section) => selectedRangeKeys.includes(section.key)).map((section) => ({
    ...section,
    leads: leadCards
      .filter((card) => isDateInRange(card.due, section.start, section.end))
      .sort(compareCards)
  }));
  const title = sections.length === 1 ? `${sections[0].title} Lead Recap` : "Weekly Lead Recap";

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FoodBrokerBase - ${escapeHtml(title)}</title>
        <style>
          @page { size: landscape; margin: 0.35in; }
          body { margin: 0; color: #211d18; font: 12px Arial, sans-serif; }
          h1 { margin: 0 0 4px; font-size: 25px; }
          h2 { margin: 0 0 5px; font-size: 17px; }
          .muted { margin-bottom: 16px; color: #5d554b; font-weight: 700; }
          .section { margin: 0 0 14px; break-inside: avoid; border: 1px solid #d8cdbc; }
          .section-head { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; background: #f6d66f; }
          .section-head span { color: #5d554b; font-weight: 800; }
          ul { margin: 0; padding: 8px 12px 10px 26px; }
          li { margin: 0 0 8px; padding-bottom: 8px; border-bottom: 1px solid #ead8c5; line-height: 1.35; }
          li:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }
          .lead-title { font-weight: 900; }
          .meta { color: #4f453b; font-weight: 700; }
          .products { color: #3a332d; font-size: 11px; }
          .note { white-space: pre-wrap; }
          .empty { padding: 10px 12px; color: #6e655c; font-weight: 700; }
          .footer { position: fixed; right: 0; bottom: -0.18in; left: 0; color: #5d554b; font-size: 10px; font-weight: 800; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
        ${sections.map(renderWeeklyLeadRecapSection).join("")}
        <div class="footer">Represented by Pierce Cartwright</div>
      </body>
    </html>`;
}

function renderWeeklyLeadRecapSection(section) {
  const dateRange = `${formatDate(toDateKey(section.start))} - ${formatDate(toDateKey(section.end))}`;
  return `
    <section class="section">
      <div class="section-head">
        <h2>${escapeHtml(section.title)}</h2>
        <span>${escapeHtml(dateRange)} | ${section.leads.length} lead${section.leads.length === 1 ? "" : "s"}</span>
      </div>
      ${
        section.leads.length
          ? `<ul>${section.leads.map(renderWeeklyLeadRecapBullet).join("")}</ul>`
          : `<div class="empty">No leads scheduled for this week.</div>`
      }
    </section>
  `;
}

function renderWeeklyLeadRecapBullet(card) {
  const products = getLeadRecapProductText(card);
  const reps = [card.salesRep && `USF Rep: ${card.salesRep}`, card.syscoSalesRep && `Sysco Rep: ${card.syscoSalesRep}`].filter(Boolean).join(" | ");
  const meta = [
    card.due ? `Due ${formatDate(card.due)}` : "No due date",
    card.priority,
    normalizeStatus(card.status),
    card.source,
    reps
  ].filter(Boolean).join(" | ");
  return `
    <li>
      <div class="lead-title">${escapeHtml(card.account || "No account")}${card.accountNumber ? ` <span class="meta"># ${escapeHtml(card.accountNumber)}</span>` : ""}</div>
      <div class="meta">${escapeHtml(meta)}</div>
      ${products ? `<div class="products">Products: ${products}</div>` : ""}
      ${card.note ? `<div class="note">${escapeHtml(shortenText(card.note, 260))}</div>` : ""}
    </li>
  `;
}

function getLeadRecapProductText(card) {
  return normalizeProducts(card)
    .map((product) => {
      const vendor = product.vendor ? `${escapeHtml(product.vendor)}: ` : "";
      const number = product.apn ? ` (${escapeHtml(product.apn)})` : product.supc ? ` (${escapeHtml(product.supc)})` : "";
      return `${vendor}${escapeHtml(product.description || "Product")}${number}`;
    })
    .join("; ");
}

function isDateInRange(value, start, end) {
  if (!value) return false;
  const date = parseLocalDate(value);
  return date >= start && date <= end;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function shortenText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function normalizeVendorLogoKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

function getVendorLogo(vendor) {
  const src = vendorLogoFiles[normalizeVendorLogoKey(vendor)];
  return src ? { src, absoluteSrc: new URL(src, window.location.href).href, alt: `${vendor} logo` } : null;
}

function renderStockPrintDocument(products, selectedColumnKeys, selectedVendor = "", printLayout = "continuous") {
  const columns = stockPrintColumns.filter((column) => selectedColumnKeys.includes(column.key));
  const selectedVendorLogo = selectedVendor ? getVendorLogo(selectedVendor) : null;
  const title = `${getActiveStockGroup()?.label || "Stock List"}${selectedVendor && !selectedVendorLogo ? ` - ${selectedVendor}` : ""}`;
  const isVendorPageLayout = printLayout === "vendor-page" && !selectedVendor;
  const groups = new Map();
  products.forEach((product) => {
    const vendor = product.vendor || "No vendor";
    if (!groups.has(vendor)) groups.set(vendor, []);
    groups.get(vendor).push(product);
  });
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: landscape; margin: 0.32in 0.35in 0.72in; }
          body { margin: 0; color: #211d18; font: 10px Arial, sans-serif; }
          h1 { margin: 0 0 2px; font-size: 18px; }
          .muted { margin-bottom: 8px; color: #5d554b; font-weight: 700; }
          .vendor { margin: 0 0 10px; border: 1px solid #d8cdbc; break-inside: avoid; }
          .vendor.vendor-page { break-before: page; page-break-before: always; }
          .vendor.vendor-page.first-vendor { break-before: auto; page-break-before: auto; }
          .vendor-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 42px; padding: 7px 9px; color: #fff; background: #2a1c13; }
          .vendor-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .print-vendor-logo { display: block; max-width: 130px; max-height: 36px; object-fit: contain; padding: 4px 7px; border-radius: 4px; background: #fffaf5; }
          .vendor-label { color: #f0a544; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          h2 { margin: 2px 0 0; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d8cdbc; padding: 3px 4px; text-align: left; vertical-align: top; }
          th { background: #ead8c5; font-size: 9px; text-transform: uppercase; }
          td:first-child { font-weight: 800; }
          .footer { position: fixed; right: 0; bottom: -0.46in; left: 0; color: #5d554b; font-size: 10px; font-weight: 800; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
        ${[...groups.entries()]
          .map(
            ([vendor, vendorProducts], index) => {
              const logo = getVendorLogo(vendor);
              return `
              <section class="vendor${isVendorPageLayout ? ` vendor-page${index === 0 ? " first-vendor" : ""}` : ""}">
                <div class="vendor-head">
                  <div class="vendor-title">
                    ${logo ? `<img class="print-vendor-logo" src="${escapeAttribute(logo.absoluteSrc)}" alt="${escapeAttribute(logo.alt)}" />` : ""}
                    ${logo ? "" : `<div><div class="vendor-label">Vendor</div><h2>${escapeHtml(vendor)}</h2></div>`}
                  </div>
                </div>
                <table>
                  <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
                  <tbody>${vendorProducts
                    .map((product) => `<tr>${columns.map((column) => `<td>${escapeHtml(product[column.key] || "")}</td>`).join("")}</tr>`)
                    .join("")}</tbody>
                </table>
              </section>
            `;
            }
          )
          .join("")}
        <div class="footer">Represented by Pierce Cartwright</div>
      </body>
    </html>`;
}

function renderLeadListPrintDocument(leadCards, title) {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Broker Whiteboard - ${escapeHtml(title)}</title>
        <style>
          @page { size: landscape; margin: 0.35in; }
          body { margin: 0; padding: 0; color: #211d18; font: 11px Arial, sans-serif; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .muted { margin-bottom: 14px; color: #5d554b; font-weight: 700; }
          .print-wrap { width: 100%; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d8cdbc; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f6d66f; font-size: 11px; text-transform: uppercase; }
          th:nth-child(1), td:nth-child(1) { width: 12%; }
          th:nth-child(2), td:nth-child(2) { width: 22%; }
          th:nth-child(3), td:nth-child(3) { width: 25%; }
          th:nth-child(4), td:nth-child(4) { width: 8%; }
          th:nth-child(5), td:nth-child(5) { width: 7%; }
          th:nth-child(6), td:nth-child(6) { width: 12%; }
          th:nth-child(7), td:nth-child(7) { width: 7%; }
          th:nth-child(8), td:nth-child(8) { width: 7%; }
          td:first-child { font-weight: 800; }
          .products { font-size: 11px; line-height: 1.25; }
          .note { white-space: pre-wrap; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="print-wrap">
          <h1>${escapeHtml(title)}</h1>
          <div class="muted">${leadCards.length} lead${leadCards.length === 1 ? "" : "s"} &middot; Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
          <table>
            <thead>
              <tr><th>Account</th><th>Vendor / Product</th><th>Note</th><th>Priority</th><th>Due</th><th>Status</th><th>Source</th><th>Rep</th></tr>
            </thead>
            <tbody>${leadCards.map(renderLeadListPrintRow).join("")}</tbody>
          </table>
        </div>
      </body>
    </html>`;
}

function renderLeadListPrintRow(card) {
  const products = normalizeProducts(card);
  const productText = products.length
    ? products
        .map((product) => {
          const vendor = product.vendor ? `${escapeHtml(product.vendor)}: ` : "";
          const apn = product.apn ? ` (${escapeHtml(product.apn)})` : "";
          return `${vendor}${escapeHtml(product.description || "Product")}${apn}`;
        })
        .join("<br>")
    : "No product";
  return `<tr>
    <td>${escapeHtml(card.account)}${card.accountNumber ? `<br><span class="products"># ${escapeHtml(card.accountNumber)}</span>` : ""}</td>
    <td class="products">${productText}</td>
    <td class="note">${escapeHtml(card.note)}</td>
    <td>${escapeHtml(card.priority)}</td>
    <td>${card.due ? formatDate(card.due) : "No date"}</td>
    <td>${escapeHtml(normalizeStatus(card.status))}</td>
    <td>${escapeHtml(card.source)}</td>
    <td>${escapeHtml(card.salesRep || "")}</td>
  </tr>`;
}

function openPrintWindow(html) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Please allow popups for this page so the print view can open.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function getAccountDirectory() {
  const directory = new Map();
  addressBook.forEach((entry) => {
    if (entry.archivedAt) return;
    const name = String(entry.operation || "").trim();
    if (!name) return;
    directory.set(name.toLowerCase(), {
      name,
      accountNumber: String(entry.accountNumber || "").trim(),
      syscoAccountNumber: String(entry.syscoAccountNumber || "").trim(),
      usfSalesRep: String(entry.usfSalesRep || "").trim(),
      syscoSalesRep: String(entry.syscoSalesRep || "").trim()
    });
  });
  cards.forEach((card) => {
    const name = String(card.account || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const accountNumber = String(card.accountNumber || "").trim();
    const syscoAccountNumber = String(card.syscoAccountNumber || "").trim();
    const current = directory.get(key);
    if (!current || accountNumber || syscoAccountNumber) {
      directory.set(key, {
        name,
        accountNumber: accountNumber || current?.accountNumber || "",
        syscoAccountNumber: syscoAccountNumber || current?.syscoAccountNumber || "",
        usfSalesRep: current?.usfSalesRep || "",
        syscoSalesRep: current?.syscoSalesRep || ""
      });
    }
  });
  return [...directory.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function updateAccountSuggestions() {
  elements.accountSuggestions.innerHTML = getAccountDirectory()
    .map((account) => {
      const details = [account.accountNumber && `USF ${account.accountNumber}`, account.syscoAccountNumber && `Sysco ${account.syscoAccountNumber}`].filter(Boolean).join(" - ");
      const label = details ? `${escapeAttribute(account.name)} - ${escapeAttribute(details)}` : escapeAttribute(account.name);
      return `<option value="${escapeAttribute(account.name)}" label="${label}"></option>`;
    })
    .join("");
}

function updateTimelineSearchSuggestions() {
  if (!elements.timelineSearchSuggestions) return;
  const suggestions = [
    ...getAccountDirectory().map((account) => account.name),
    ...addressBook.map((entry) => entry.operation),
    ...stockProducts.flatMap((product) => [product.description, product.vendor, product.brandName, product.apn, product.supc]),
    ...cards.flatMap((card) => getTimelineLeadProducts(card).flatMap((product) => [product.description, product.vendor, product.apn, product.supc])),
    ...manualVendorReports.flatMap((report) => [report.account, report.vendor, report.productShown]),
    ...samples.flatMap((sample) => [sample.product, sample.requestedFor, sample.orderedBy]),
    ...todos.flatMap((todo) => [todo.title, todo.account, todo.vendor, todo.assignedBy]),
    ...marketVisits.flatMap((visit) => [
      visit.name,
      visit.vendor,
      visit.visitorName,
      ...getMarketVisitOperators(visit).map((operator) => operator.operatorName || getOperatorName(operator.operatorId)),
      ...getMarketVisitProducts(visit).flatMap((product) => [product.description, product.vendor, product.apn, product.supc])
    ])
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  elements.timelineSearchSuggestions.innerHTML = [...new Set(suggestions)]
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 500)
    .map((value) => `<option value="${escapeAttribute(value)}"></option>`)
    .join("");
}

function getSalesRepDirectory() {
  return [
    ...new Set(
      cards
        .map((card) => card.salesRep)
        .concat(cards.map((card) => card.syscoSalesRep))
        .concat(addressBook.flatMap((entry) => [entry.usfSalesRep, entry.syscoSalesRep]))
        .map((rep) => String(rep || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function updateSalesRepSuggestions() {
  if (!elements.salesRepSuggestions) return;
  elements.salesRepSuggestions.innerHTML = getSalesRepDirectory()
    .map((rep) => `<option value="${escapeAttribute(rep)}"></option>`)
    .join("");
}

function getVendorNames() {
  return [
    ...new Set(
      cards
        .flatMap((card) => normalizeProducts(card).map((product) => product.vendor.trim()))
        .concat(manualVendorReports.map((report) => report.vendor.trim()))
        .concat(stockProducts.flatMap((product) => [product.vendor, product.brandName]))
        .concat(todos.map((todo) => todo.vendor))
        .concat(marketVisits.map((visit) => visit.vendor))
        .filter(Boolean)
        .map((vendor) => String(vendor || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function getMatchedVendorName(value) {
  const typed = String(value || "").trim().toLowerCase();
  if (!typed) return "";
  return getVendorNames().find((vendor) => vendor.toLowerCase() === typed) || "";
}

function updateVendorControls() {
  const selected = elements.vendorFilter.value;
  const selectedReportVendor = elements.vendorReportVendorFilter?.value || "";
  const vendors = getVendorNames();
  elements.vendorSuggestions.innerHTML = vendors.map((vendor) => `<option value="${escapeAttribute(vendor)}"></option>`).join("");
  elements.apnSuggestions.innerHTML = getProductDirectory(elements.leadDistributor?.value || "US Foods")
    .map((product) => {
      const label = [product.description, product.vendor].filter(Boolean).join(" - ");
      return `<option value="${escapeAttribute(product.number)}" label="${escapeAttribute(label)}"></option>`;
    })
    .join("");
  elements.productSearchSuggestions.innerHTML = getLeadProductSearchDirectory(elements.leadDistributor?.value || "US Foods")
    .map((product) => `<option value="${escapeAttribute(product.label)}"></option>`)
    .join("");
  elements.vendorFilter.innerHTML = `<option value="">All</option>${vendors
    .map((vendor) => `<option value="${escapeAttribute(vendor)}">${escapeHtml(vendor)}</option>`)
    .join("")}`;
  if (selected && vendors.includes(selected)) elements.vendorFilter.value = selected;
  if (elements.vendorReportVendorFilter) {
    elements.vendorReportVendorFilter.innerHTML = `<option value="">All</option>${vendors
      .map((vendor) => `<option value="${escapeAttribute(vendor)}">${escapeHtml(vendor)}</option>`)
      .join("")}`;
    if (selectedReportVendor && vendors.includes(selectedReportVendor)) elements.vendorReportVendorFilter.value = selectedReportVendor;
  }
}

function distributorMatchesStock(product, distributor) {
  const productDistributor = String(product.distributor || "").toLowerCase();
  const target = String(distributor || "US Foods").toLowerCase();
  if (target === "us foods") return productDistributor.startsWith("us foods");
  return productDistributor === target;
}

function getProductNumberForDistributor(product, distributor) {
  if (distributor === "Sysco") return String(product.supc || "").trim();
  if (distributor === "Linford") return String(product.distributorNumber || product.apn || product.supc || "").trim();
  return String(product.apn || product.distributorNumber || "").trim();
}

function getProductDirectory(distributor = elements.leadDistributor?.value || "US Foods") {
  const directory = new Map();
  stockProducts.forEach((product) => {
    if (!distributorMatchesStock(product, distributor)) return;
    const number = getProductNumberForDistributor(product, distributor);
    if (!number) return;
    const key = number.toLowerCase();
    if (!directory.has(key) || product.description || product.vendor) {
      directory.set(key, {
        number,
        description: String(product.description || "").trim(),
        vendor: String(product.vendor || product.brandName || "").trim()
      });
    }
  });
  cards.forEach((card) => {
    const cardDistributor = card.distributor || "US Foods";
    if (cardDistributor !== distributor) return;
    normalizeProducts(card).forEach((product) => {
      const number = String(product.apn || "").trim();
      if (!number) return;
      const key = number.toLowerCase();
      if (!directory.has(key) || product.description || product.vendor) {
        directory.set(key, {
          number,
          description: String(product.description || "").trim(),
          vendor: String(product.vendor || "").trim()
        });
      }
    });
  });
  return [...directory.values()].sort((a, b) => a.number.localeCompare(b.number));
}

function getLeadProductSearchDirectory(distributor = elements.leadDistributor?.value || "US Foods") {
  const directory = new Map();
  const addProduct = (product) => {
    const number = String(product.number || product.apn || "").trim();
    const description = String(product.description || "").trim();
    const vendor = String(product.vendor || "").trim();
    if (!number && !description && !vendor) return;
    const key = [number, description, vendor].join("|").toLowerCase();
    if (directory.has(key)) return;
    const label = [number, description, vendor].filter(Boolean).join(" | ");
    directory.set(key, { number, description, vendor, label });
  };

  stockProducts.forEach((product) => {
    if (!distributorMatchesStock(product, distributor)) return;
    addProduct({
      number: getProductNumberForDistributor(product, distributor),
      description: product.description,
      vendor: product.vendor || product.brandName
    });
  });

  cards.forEach((card) => {
    const cardDistributor = card.distributor || "US Foods";
    if (cardDistributor !== distributor) return;
    normalizeProducts(card).forEach((product) => {
      addProduct({
        number: product.apn,
        description: product.description,
        vendor: product.vendor
      });
    });
  });

  return [...directory.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function findLeadProductSearchMatch(value) {
  const typed = String(value || "").trim().toLowerCase();
  if (!typed) return null;
  const products = getLeadProductSearchDirectory(elements.leadDistributor.value);
  const exact = products.find((product) => product.label.toLowerCase() === typed || product.number.toLowerCase() === typed);
  if (exact) return exact;
  const terms = typed.split(/\s+/).filter(Boolean);
  return products.find((product) => {
    const haystack = [product.number, product.description, product.vendor, product.label].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

function addProductFromSearch() {
  const match = findLeadProductSearchMatch(elements.productSearch.value);
  if (!match) {
    elements.productSearch.focus();
    return;
  }
  const product = {
    vendor: match.vendor,
    description: match.description,
    apn: match.number
  };
  const emptyRow = [...elements.productList.querySelectorAll(".product-row")].find((row) => {
    return !row.querySelector(".product-apn").value.trim() && !row.querySelector(".product-description").value.trim() && !row.querySelector(".product-vendor-input").value.trim();
  });
  if (emptyRow) {
    emptyRow.querySelector(".product-apn").value = product.apn;
    emptyRow.querySelector(".product-description").value = product.description;
    emptyRow.querySelector(".product-vendor-input").value = product.vendor;
  } else {
    addProductRow(product);
  }
  elements.productSearch.value = "";
  elements.productSearch.focus();
}

function getStockDistributorForLead(distributor) {
  if (distributor === "Sysco") return "Sysco";
  return "US Foods Anchorage";
}

function getLeadProductStockFields(product, distributor) {
  const number = String(product.apn || "").trim();
  const stockDistributor = getStockDistributorForLead(distributor);
  return normalizeStockProduct({
    distributor: stockDistributor,
    distributorNumber: number,
    apn: distributor === "US Foods" ? number : "",
    supc: distributor === "Sysco" ? number : "",
    description: product.description || "",
    vendor: product.vendor || ""
  });
}

function stockProductsMatchLeadProduct(existing, incoming) {
  const current = normalizeStockProduct(existing);
  const next = normalizeStockProduct(incoming);
  const sameUsFoodsGroup = current.distributor.startsWith("US Foods") && next.distributor.startsWith("US Foods");
  if (current.distributor !== next.distributor && !sameUsFoodsGroup) return false;
  const exactFields = ["apn", "supc", "manufacturerNumber", "gtin"];
  if (exactFields.some((field) => current[field] && next[field] && current[field].toLowerCase() === next[field].toLowerCase())) return true;
  return Boolean(
    current.description &&
      next.description &&
      current.vendor &&
      next.vendor &&
      current.description.toLowerCase() === next.description.toLowerCase() &&
      current.vendor.toLowerCase() === next.vendor.toLowerCase()
  );
}

function syncLeadProductsToStock(products, distributor) {
  let changed = false;
  normalizeProducts({ products }).forEach((product) => {
    if (!["US Foods", "Sysco"].includes(distributor)) return;
    const number = String(product.apn || "").trim();
    const description = String(product.description || "").trim();
    if (!number || !description) return;
    const incoming = getLeadProductStockFields(product, distributor);
    if (!incoming.apn && !incoming.supc) return;
    const matchIndex = stockProducts.findIndex((stockProduct) => stockProductsMatchLeadProduct(stockProduct, incoming));
    if (matchIndex < 0) {
      stockProducts = [incoming, ...stockProducts];
      changed = true;
      return;
    }
    const current = normalizeStockProduct(stockProducts[matchIndex]);
    const merged = mergeStockProduct(current, incoming);
    if (JSON.stringify(current) !== JSON.stringify(merged)) {
      stockProducts = stockProducts.map((stockProduct, index) => (index === matchIndex ? merged : stockProduct));
      changed = true;
    }
  });
  if (changed) {
    persistStockProducts();
    updateVendorControls();
  }
}

function fillProductFromApn(row) {
  const apnInput = row.querySelector(".product-apn");
  const typed = apnInput.value.trim().toLowerCase();
  if (!typed) return;
  const match = getProductDirectory(elements.leadDistributor.value).find((product) => product.number.toLowerCase() === typed);
  if (!match) return;
  const description = row.querySelector(".product-description");
  const vendor = row.querySelector(".product-vendor-input");
  if (!description.value.trim()) description.value = match.description;
  if (!vendor.value.trim()) vendor.value = match.vendor;
}

function fillAccountNumberFromName() {
  const match = getMatchedAccountDirectoryEntry(elements.account.value);
  if (!match) return;
  fillLeadAccountDetails(match);
}

function getMatchedAccountDirectoryEntry(value) {
  const typed = String(value || "").trim().toLowerCase();
  if (!typed) return;
  return getAccountDirectory().find((account) => account.name.toLowerCase() === typed);
}

function normalizeAccountInputFromDirectory(input) {
  const match = getMatchedAccountDirectoryEntry(input.value);
  if (!match) return;
  input.value = match.name;
  if (input === elements.account) fillLeadAccountDetails(match);
}

function fillLeadAccountDetails(match) {
  if (match?.accountNumber && !elements.accountNumber.value.trim()) {
    elements.accountNumber.value = match.accountNumber;
  }
  if (match?.syscoAccountNumber && !elements.syscoAccountNumber.value.trim()) {
    elements.syscoAccountNumber.value = match.syscoAccountNumber;
  }
  if (match?.usfSalesRep && !elements.salesRep.value.trim()) {
    elements.salesRep.value = match.usfSalesRep;
  }
  if (match?.syscoSalesRep && !elements.syscoSalesRep.value.trim()) {
    elements.syscoSalesRep.value = match.syscoSalesRep;
  }
}

function getDistributorItemLabel(distributor = elements.leadDistributor?.value || "US Foods") {
  if (distributor === "Sysco") return "SUPC";
  if (distributor === "Linford") return "Item #";
  return "APN";
}

function updateProductNumberLabels() {
  const label = getDistributorItemLabel();
  elements.productList.querySelectorAll(".product-number-label").forEach((item) => {
    item.textContent = label;
  });
}

function addProductRow(product = { vendor: "", description: "", apn: "" }) {
  const row = document.createElement("div");
  row.className = "product-row";
  row.dataset.productId = product.id || crypto.randomUUID();
  row.innerHTML = `
    <label>
      <span class="product-number-label">${escapeHtml(getDistributorItemLabel())}</span>
      <input class="product-apn" list="apnSuggestions" autocomplete="off" value="${escapeAttribute(product.apn)}" />
    </label>
    <label>
      <span>Description</span>
      <input class="product-description" autocomplete="off" value="${escapeAttribute(product.description)}" />
    </label>
    <label>
      <span>Vendor / brand</span>
      <input class="product-vendor-input" list="vendorSuggestions" autocomplete="off" value="${escapeAttribute(product.vendor)}" />
    </label>
    <button class="remove-product" type="button">Remove</button>
  `;
  row.querySelector(".product-apn").addEventListener("input", () => fillProductFromApn(row));
  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const rows = [...elements.productList.querySelectorAll(".product-row")];
      const isLastRow = rows[rows.length - 1] === row;
      const nextRow = row.nextElementSibling;
      if (!isLastRow && nextRow?.classList.contains("product-row")) {
        nextRow.querySelector(".product-apn")?.focus();
        return;
      }
      addProductRow();
      elements.productList.lastElementChild?.querySelector(".product-apn")?.focus();
    });
  });
  row.querySelector(".remove-product").addEventListener("click", () => {
    row.remove();
    if (!elements.productList.children.length) addProductRow();
  });
  elements.productList.appendChild(row);
}

function readProducts() {
  return [...elements.productList.querySelectorAll(".product-row")]
    .map((row) => ({
      id: row.dataset.productId || crypto.randomUUID(),
      vendor: row.querySelector(".product-vendor-input").value.trim(),
      description: row.querySelector(".product-description").value.trim(),
      apn: row.querySelector(".product-apn").value.trim()
    }))
    .filter((product) => product.vendor || product.description || product.apn);
}

function handleAttachmentFiles(event) {
  const files = [...(event.target.files || [])];
  elements.attachmentInput.value = "";
  if (!files.length) return;
  addAttachmentFiles(files);
}

function handleAttachmentPaste(event) {
  if (event.attachmentHandled) return;
  const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  event.attachmentHandled = true;
  event.preventDefault();
  addAttachmentFiles(
    files.map((file, index) => {
      const extension = file.type.split("/")[1] || "png";
      const name = `Screenshot ${formatDateTimeForFile(new Date())}${files.length > 1 ? ` ${index + 1}` : ""}.${extension}`;
      return new File([file], name, { type: file.type, lastModified: file.lastModified });
    })
  );
}

function addAttachmentFiles(files) {
  readAttachmentFiles(files)
    .then((attachments) => {
      currentAttachments = [...currentAttachments, ...attachments];
      renderAttachmentList();
    })
    .catch(() => alert("One of the attachments could not be added."));
}

function readAttachmentFiles(files) {
  const maxFileSize = 4 * 1024 * 1024;
  const oversized = files.filter((file) => file.size > maxFileSize);
  if (oversized.length) {
    alert(`${oversized.map((file) => file.name).join(", ")} is too large for this local version. Please keep attachments under 4 MB each.`);
  }
  const readableFiles = files.filter((file) => file.size <= maxFileSize);
  if (!readableFiles.length) return Promise.resolve([]);

  return Promise.all(
    readableFiles.map(async (file) => {
      const prepared = file.type.startsWith("image/") ? await compressImageAttachment(file) : await readFileAttachment(file);
      return normalizeAttachment({
        id: crypto.randomUUID(),
        name: prepared.name,
        type: prepared.type,
        size: prepared.size,
        data: prepared.data,
        addedAt: new Date().toISOString()
      });
    })
  );
}

function readFileAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        data: String(reader.result || "")
      })
    );
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function compressImageAttachment(file) {
  return readFileAttachment(file).then((original) => {
    const image = new Image();
    return new Promise((resolve) => {
      image.addEventListener("load", () => {
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(image.width || maxSide, image.height || maxSide));
        const width = Math.max(1, Math.round((image.width || maxSide) * scale));
        const height = Math.max(1, Math.round((image.height || maxSide) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(original);
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const mime = canvas.toDataURL("image/webp", 0.62).startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
        const data = canvas.toDataURL(mime, 0.62);
        const size = estimateDataUrlSize(data);
        if (!data || data.length >= original.data.length) {
          resolve(original);
          return;
        }
        resolve({
          name: replaceFileExtension(file.name, mime === "image/webp" ? "webp" : "jpg"),
          type: mime,
          size,
          data
        });
      });
      image.addEventListener("error", () => resolve(original));
      image.src = original.data;
    });
  });
}

function estimateDataUrlSize(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

function replaceFileExtension(name, extension) {
  const cleanName = String(name || "Screenshot").replace(/\.[^.]+$/, "");
  return `${cleanName}.${extension}`;
}

function formatDateTimeForFile(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function renderAttachmentList() {
  if (!elements.attachmentList) return;
  if (!currentAttachments.length) {
    elements.attachmentList.innerHTML = `<div class="empty-state attachment-empty">No files attached yet</div>`;
    return;
  }
  elements.attachmentList.innerHTML = currentAttachments
    .map(
      (file) => `
        <div class="attachment-row">
          <div class="attachment-main">
            <strong>${escapeHtml(file.name)}</strong>
            <span>${formatFileSize(file.size)}</span>
          </div>
          <div class="attachment-actions">
            <button class="attachment-link" type="button" data-preview-attachment="${escapeAttribute(file.id)}">Preview</button>
            <button class="remove-product" type="button" data-remove-attachment="${escapeAttribute(file.id)}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
  elements.attachmentList.querySelectorAll("[data-remove-attachment]").forEach((button) => {
    button.addEventListener("click", () => {
      currentAttachments = currentAttachments.filter((file) => file.id !== button.dataset.removeAttachment);
      renderAttachmentList();
    });
  });
}

function renderAttachmentLinks(attachments = []) {
  const files = attachments.map(normalizeAttachment).filter((file) => file.name && file.data);
  if (!files.length) return "";
  return `
    <div class="attachment-links">
      ${files
        .map(
          (file) =>
            `<button class="attachment-chip" type="button" data-preview-attachment="${escapeAttribute(file.id)}">${escapeHtml(file.name)}</button>`
        )
        .join("")}
    </div>
  `;
}

async function previewAttachment(id) {
  const file = findAttachment(id);
  if (!file) return;
  elements.attachmentTitle.textContent = file.name;
  elements.attachmentPreview.innerHTML = renderAttachmentPreviewLoading(file);
  elements.attachmentDialog.showModal();

  let data = file.data;
  if (!data && file.storageId) {
    try {
      data = await loadStockFileData(file.storageId);
    } catch {
      data = "";
    }
  }
  if (!data) {
    elements.attachmentPreview.innerHTML = renderUnsupportedAttachment(file);
    return;
  }

  const type = file.type || "";
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) {
    elements.attachmentPreview.innerHTML = `<img src="${escapeAttribute(data)}" alt="${escapeAttribute(file.name)}" />`;
    return;
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    elements.attachmentPreview.innerHTML = `<iframe title="${escapeAttribute(file.name)}" src="${escapeAttribute(data)}"></iframe>`;
    return;
  }
  if (type.startsWith("text/") || name.endsWith(".csv") || name.endsWith(".txt")) {
    try {
      const response = await fetch(data);
      const text = await response.text();
      elements.attachmentPreview.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
    } catch {
      elements.attachmentPreview.innerHTML = renderUnsupportedAttachment(file);
    }
    return;
  }
  elements.attachmentPreview.innerHTML = renderUnsupportedAttachment(file);
}

function findAttachment(id) {
  return [
    ...currentAttachments,
    ...currentStockAttachments,
    ...currentSampleAttachments,
    ...currentDotAttachments,
    ...cards.flatMap((card) => card.attachments || []),
    ...stockProducts.flatMap((product) => product.attachments || []),
    ...samples.flatMap((sample) => sample.attachments || []),
    ...dotOrders.flatMap((order) => order.attachments || [])
  ].find((file) => file.id === id);
}

function closeAttachmentPreview() {
  elements.attachmentDialog.close();
  elements.attachmentPreview.innerHTML = "";
}

function renderAttachmentPreviewLoading(file) {
  return `<div class="attachment-preview-message"><strong>${escapeHtml(file.name)}</strong><span>Loading preview...</span></div>`;
}

function renderUnsupportedAttachment(file) {
  return `
    <div class="attachment-preview-message">
      <strong>${escapeHtml(file.name)}</strong>
      <span>This file type cannot preview inside this local app. PDFs, screenshots, photos, text files, and CSV files preview best.</span>
    </div>
  `;
}

function formatFileSize(bytes) {
  if (!bytes) return "File";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeProducts(card) {
  if (Array.isArray(card.products)) {
    return card.products
      .map((product) => ({
        id: product.id || crypto.randomUUID(),
        vendor: String(product.vendor || card.vendor || "").trim(),
        description: String(product.description || "").trim(),
        apn: String(product.apn || "").trim()
      }))
      .filter((product) => product.vendor || product.description || product.apn);
  }
  if (card.product || card.apn) {
    return [{ id: crypto.randomUUID(), vendor: card.vendor || "", description: card.product || "", apn: card.apn || "" }];
  }
  return [];
}

function onDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function clearLeadDragState() {
  draggedId = null;
  document.body.classList.remove("lead-drag-active", "lead-drag-suppressed");
  document.querySelectorAll(".note-card.dragging").forEach((card) => card.classList.remove("dragging"));
  document.querySelectorAll(".column.drag-over").forEach((column) => column.classList.remove("drag-over"));
}

function onDrop(event) {
  event.preventDefault();
  const id = draggedId || event.dataTransfer.getData("text/plain");
  const status = event.currentTarget.dataset.status;
  clearLeadDragState();
  if (!id || !status) return;
  const existing = cards.find((card) => card.id === id);
  if (!existing || normalizeStatus(existing.status) === status) return;
  cards = cards.map((card) => (card.id === id ? { ...card, status } : card));
  persist();
  render();
}

function updateSummary() {
  const activeCards = cards.filter((card) => !card.archivedAt && !card.deletedAt && normalizeStatus(card.status) !== closedStatus);
  setText("summaryAll", activeCards.length);
  setText("summaryOverdue", activeCards.filter(isOverdue).length);
  setText("summaryToday", activeCards.filter(isDueToday).length);
  setText("summaryWeek", activeCards.filter(isDueThisWeek).length);
  setText("summaryNextWeek", activeCards.filter(isDueNextWeek).length);
  setText("summaryMonth", activeCards.filter(isDueThisMonth).length);
  setText("summaryHigh", activeCards.filter((card) => card.priority === "High").length);
  setText("summaryWaiting", cards.filter((card) => !card.archivedAt && !card.deletedAt && normalizeStatus(card.status) === "Need Action").length);
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function applyQuickFilter(filter) {
  clearFilters(false);
  if (filter === "all") {
    leadQuickListMode = false;
    activeLeadQuickFilter = "";
    render();
    return;
  }
  leadQuickListMode = true;
  activeLeadQuickFilter = filter;
  if (filter === "high") elements.priorityFilter.value = "High";
  else if (["overdue", "today", "week", "nextWeek", "month"].includes(filter)) elements.dueFilter.value = filter;
  else elements.statusFilter.value = filter;
  render();
}

function clearFilters(shouldRender = true) {
  leadQuickListMode = false;
  activeLeadQuickFilter = "";
  elements.search.value = "";
  elements.vendorFilter.value = "";
  elements.priorityFilter.value = "";
  elements.dueFilter.value = "";
  elements.sourceFilter.value = "";
  elements.statusFilter.value = "";
  elements.sort.value = "due";
  if (shouldRender) render();
}

function matchesDueFilter(card, filter) {
  if (filter === "none") return !card.due;
  if (filter === "overdue") return isOverdue(card);
  if (filter === "today") return isDueToday(card);
  if (filter === "week") return isDueThisWeek(card);
  if (filter === "nextWeek") return isDueNextWeek(card);
  if (filter === "month") return isDueThisMonth(card);
  return true;
}

function getLeadQuickFilterLabel(filter) {
  const labels = {
    overdue: "Overdue leads",
    today: "Due today",
    week: "Due this week",
    nextWeek: "Due next week",
    month: "Due this month",
    high: "High priority",
    "Need Action": "Need Action",
    all: "All leads / workflow"
  };
  return labels[filter] || "Lead list";
}

function setActiveLeadQuickTile() {
  document.querySelectorAll("[data-quick-filter]").forEach((button) => {
    button.classList.toggle("active-summary", leadQuickListMode && button.dataset.quickFilter === activeLeadQuickFilter);
  });
}

function isOverdue(card) {
  return card.due && !card.archivedAt && !card.deletedAt && normalizeStatus(card.status) !== closedStatus && parseLocalDate(card.due) < startOfToday();
}

function isDueToday(card) {
  return card.due && parseLocalDate(card.due).getTime() === startOfToday().getTime();
}

function isDueThisWeek(card) {
  if (!card.due) return false;
  const date = parseLocalDate(card.due);
  const today = startOfToday();
  const end = endOfWeek(today);
  return date >= today && date <= end;
}

function isDueNextWeek(card) {
  if (!card.due) return false;
  const date = parseLocalDate(card.due);
  const start = startOfNextWeek();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return date >= start && date <= end;
}

function isDueThisMonth(card) {
  if (!card.due) return false;
  const date = parseLocalDate(card.due);
  const today = startOfToday();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return date >= today && date <= monthEnd;
}

function endOfWeek(date) {
  const end = startOfCalendarWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

function startOfNextWeek() {
  const start = endOfWeek(startOfToday());
  start.setDate(start.getDate() + 1);
  return start;
}

function startOfCalendarWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function todayOffset(days) {
  const date = startOfToday();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}


