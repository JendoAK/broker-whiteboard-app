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
  { key: "apn", label: "APN" },
  { key: "supc", label: "SUPC" },
  { key: "manufacturerNumber", label: "MF#" },
  { key: "gtin", label: "GTIN" },
  { key: "packaging", label: "Packaging" },
  { key: "storage", label: "Storage" },
  { key: "category", label: "Category" },
  { key: "so", label: "SO" }
];
const stockDefaultCategories = [
  "Soup",
  "Appetizer",
  "Chicken",
  "Meat",
  "Seafood",
  "Beverages",
  "Baking",
  "Snacks",
  "Cereal",
  "Baked goods",
  "Sauces and Dressings",
  "Pasta",
  "Other",
  "School",
  "Mexican",
  "Asian",
  "Dairy",
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

if (!localStorage.getItem(resetFlagKey)) {
  localStorage.removeItem(storageKey);
  localStorage.setItem(resetFlagKey, "true");
}

let cards = loadCards();
let todos = loadTodos();
let manualVendorReports = loadManualVendorReports();
let addressBook = loadAddressBook();
let stockProducts = loadStockProducts();
let draggedId = null;
let draggedTodoId = null;
let leadQuickListMode = false;
let todoQuickListMode = false;
let activeLeadQuickFilter = "";
let activeTodoQuickFilter = "";
let activeStockList = "";
let calendarMonth = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
let calendarView = "month";
let calendarRangeStart = startOfCalendarWeek(startOfToday());
let activeCalendarControl = "calendarThisMonth";
let datePickerInput = null;
let datePickerMonth = new Date(startOfToday().getFullYear(), startOfToday().getMonth(), 1);
let currentAttachments = [];
let currentStockAttachments = [];

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
  cardId: document.querySelector("#cardId"),
  account: document.querySelector("#accountInput"),
  accountSuggestions: document.querySelector("#accountSuggestions"),
  vendorSuggestions: document.querySelector("#vendorSuggestions"),
  apnSuggestions: document.querySelector("#apnSuggestions"),
  salesRepSuggestions: document.querySelector("#salesRepSuggestions"),
  accountNumber: document.querySelector("#accountNumberInput"),
  syscoAccountNumber: document.querySelector("#syscoAccountNumberInput"),
  leadDistributor: document.querySelector("#leadDistributorInput"),
  note: document.querySelector("#noteInput"),
  priority: document.querySelector("#priorityInput"),
  due: document.querySelector("#dueInput"),
  status: document.querySelector("#statusInput"),
  source: document.querySelector("#sourceInput"),
  salesRep: document.querySelector("#salesRepInput"),
  syscoSalesRep: document.querySelector("#syscoSalesRepInput"),
  productList: document.querySelector("#productList"),
  addProduct: document.querySelector("#addProduct"),
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
  backupFile: document.querySelector("#backupFile")
};

document.querySelector("#addNoteTop").addEventListener("click", () => openForm());
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
document.querySelector("#openCalendarTodo").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarVendor").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarAddress").addEventListener("click", openCalendarWindow);
document.querySelector("#openCalendarStock").addEventListener("click", openCalendarWindow);
document.querySelector("#openArchiveTodo").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveVendor").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveAddress").addEventListener("click", openArchiveWindow);
document.querySelector("#openArchiveStock").addEventListener("click", openArchiveWindow);
document.querySelector("#openTrashTodo").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashVendor").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashAddress").addEventListener("click", openTrashWindow);
document.querySelector("#openTrashStock").addEventListener("click", openTrashWindow);
document.querySelector("#exportBackupTodo").addEventListener("click", exportBackup);
document.querySelector("#exportBackupVendor").addEventListener("click", exportBackup);
document.querySelector("#exportBackupAddress").addEventListener("click", exportBackup);
document.querySelector("#exportBackupStock").addEventListener("click", exportBackup);
document.querySelector("#importBackupTodo").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupVendor").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupAddress").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#importBackupStock").addEventListener("click", () => elements.backupFile.click());
document.querySelector("#openVendorReportTodo").addEventListener("click", openVendorReportWindow);
document.querySelector("#openTodoVendor").addEventListener("click", openTodoWindow);
document.querySelector("#openAddressBookTodo").addEventListener("click", openAddressBookWindow);
document.querySelector("#openAddressBookVendor").addEventListener("click", openAddressBookWindow);
document.querySelector("#openStockListsTodo").addEventListener("click", openStockListsWindow);
document.querySelector("#openStockListsVendor").addEventListener("click", openStockListsWindow);
document.querySelector("#openStockListsAddress").addEventListener("click", openStockListsWindow);
document.querySelector("#openTodoAddress").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportAddress").addEventListener("click", openVendorReportWindow);
document.querySelector("#openTodoStock").addEventListener("click", openTodoWindow);
document.querySelector("#openVendorReportStock").addEventListener("click", openVendorReportWindow);
document.querySelector("#openAddressBookStock").addEventListener("click", openAddressBookWindow);
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
document.querySelector("#clearTodoFilters").addEventListener("click", clearTodoFilters);
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
elements.addProduct.addEventListener("click", () => addProductRow());
elements.leadDistributor.addEventListener("change", () => {
  updateProductNumberLabels();
  updateVendorControls();
});
elements.addAttachment.addEventListener("click", () => elements.attachmentInput.click());
elements.attachmentInput.addEventListener("change", handleAttachmentFiles);
elements.attachmentPasteTarget.addEventListener("paste", handleAttachmentPaste);
elements.account.addEventListener("input", fillAccountNumberFromName);
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
elements.addManualVendorReport.addEventListener("click", () => openManualVendorForm());
setupDatePicker(elements.manualVendorSubmittedDate);
elements.manualVendorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveManualVendorReport();
});
elements.addTodo.addEventListener("click", () => openTodoForm());
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
elements.addSubtask.addEventListener("click", () => addSubtaskRow());
elements.deleteTodo.addEventListener("click", deleteCurrentTodo);
elements.convertTodoToLead.addEventListener("click", convertCurrentTodoToLead);
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
    vendor: product.vendor || "",
    brandType: normalizeBrandType(product.brandType),
    brandName: product.brandName || "",
    category: product.category || "",
    so: normalizeYes(product.so),
    attachments: Array.isArray(product.attachments) ? product.attachments.map(normalizeStockAttachment).filter((file) => file.name && file.data) : [],
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
    addedAt: file.addedAt || new Date().toISOString()
  };
}

function normalizeStatus(status) {
  if (columns.includes(status)) return status;
  return statusMap[status] || "New Lead";
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cards));
    return true;
  } catch (error) {
    alert("This browser could not save the board. One or more attachments may be too large for local storage.");
    console.error(error);
    return false;
  }
}

function persistTodos() {
  localStorage.setItem(todoStorageKey, JSON.stringify(todos));
}

function persistManualVendorReports() {
  localStorage.setItem(manualVendorStorageKey, JSON.stringify(manualVendorReports));
}

function persistAddressBook() {
  localStorage.setItem(addressBookStorageKey, JSON.stringify(addressBook));
}

function persistStockProducts() {
  localStorage.setItem(stockStorageKey, JSON.stringify(stockProducts));
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
    stockProducts
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
  reader.addEventListener("load", () => {
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
      persist();
      persistTodos();
      persistManualVendorReports();
      persistAddressBook();
      persistStockProducts();
      clearFilters(false);
      render();
      alert("Backup imported.");
    } catch {
      alert("That file does not look like a Broker Whiteboard backup.");
    } finally {
      elements.backupFile.value = "";
    }
  });
  reader.readAsText(file);
}

function render() {
  updateSummary();
  updateAccountSuggestions();
  updateSalesRepSuggestions();
  updateVendorControls();
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
        <button class="card-action archive-card" type="button" aria-label="Archive" data-tooltip="Archive">${icons.archive}</button>
        <button class="card-action edit-note" type="button" aria-label="Edit" data-tooltip="Edit">${icons.edit}</button>
        <button class="card-action delete-note" type="button" aria-label="Delete" data-tooltip="Delete">${icons.trash}</button>
      </div>
    </div>
  `;

  article.addEventListener("dragstart", () => {
    draggedId = card.id;
    article.classList.add("dragging");
  });
  article.addEventListener("dragend", () => {
    draggedId = null;
    article.classList.remove("dragging");
  });
  article.querySelector(".account-link").addEventListener("click", (event) => {
    event.stopPropagation();
    openAccountWindow(card);
  });
  article.querySelector(".archive-card").addEventListener("click", (event) => {
    event.stopPropagation();
    archiveCard(card.id);
  });
  article.querySelector(".edit-note").addEventListener("click", () => openForm(card));
  article.querySelector(".delete-note").addEventListener("click", (event) => {
    event.stopPropagation();
    deleteCard(card.id);
  });
  article.addEventListener("dblclick", () => openForm(card));
  return article;
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
  const days = [];

  for (let i = 0; i < dayTotal; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    const dayCards = activeCards.filter((card) => card.due === key).sort(compareCards);
    const dayTodos = activeTodos.filter((todo) => todo.due === key).sort(compareTodos);
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
                  <span>${escapeHtml([card.priority, normalizeStatus(card.status), card.source, card.salesRep && `USF: ${card.salesRep}`, card.syscoSalesRep && `Sysco: ${card.syscoSalesRep}`].filter(Boolean).join(" · "))}</span>
                </button>
              `
            )
            .join("")}
          ${dayTodos
            .map(
              (todo) => `
                <button class="calendar-item todo-calendar-item priority-${todo.priority.toLowerCase()}" type="button" data-calendar-todo-id="${escapeAttribute(todo.id)}">
                  <strong>${escapeHtml(todo.title)}</strong>
                  <span>${escapeHtml([todo.priority, todo.status, todo.assignedBy && `By: ${todo.assignedBy}`].filter(Boolean).join(" · "))}</span>
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
        <div class="muted">${escapeHtml(title)} · Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
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
      .map((card) => `<div class="item">${escapeHtml(card.account)}<div class="meta">Lead · ${escapeHtml(card.priority)} · ${escapeHtml(normalizeStatus(card.status))}</div></div>`)
      .join("")}
    ${day.todos
      .map((todo) => `<div class="item todo">${escapeHtml(todo.title)}<div class="meta">To-Do · ${escapeHtml(todo.priority)} · ${escapeHtml(todo.status)}</div></div>`)
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
  document.addEventListener("click", (event) => {
    if (!datePickerInput) return;
    if (event.target === datePickerInput || picker.contains(event.target)) return;
    closeDatePicker();
  });
  return picker;
}

function openDatePicker(input) {
  datePickerInput = input;
  const picker = getDatePicker();
  const host = input.parentElement || document.body;
  host.classList.add("date-picker-host");
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
  picker.style.left = "";
  picker.style.top = "";
  picker.hidden = false;
  picker.querySelector("[data-picker-prev]").addEventListener("click", () => {
    datePickerMonth = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1, 1);
    renderDatePicker();
  });
  picker.querySelector("[data-picker-next]").addEventListener("click", () => {
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
  document.body.classList.remove("todo-mode");
  updateStockCategorySuggestions();
  renderStockLists();
  elements.stockListsDialog.hidden = false;
  elements.stockListsDialog.scrollTop = 0;
}

function closeStockListsWindow() {
  elements.stockListsDialog.hidden = true;
  showLeadsWorkflow();
}

function showLeadsWorkflow() {
  elements.todoDialog.hidden = true;
  elements.vendorReportDialog.hidden = true;
  elements.addressBookDialog.hidden = true;
  elements.stockListsDialog.hidden = true;
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
    field.addEventListener("blur", () => saveVendorReportField(field));
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
          <th>Operation</th>
          <th>Locations</th>
          <th>Primary contact</th>
          <th>Phone / Email</th>
          <th>Address</th>
          <th>US Foods #</th>
          <th>Sysco #</th>
          <th>Sales reps</th>
          <th>Website</th>
          <th>Last updated</th>
          <th>Contacts</th>
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
  const contacts = entry.contacts.filter((contact) => contact.name || contact.email || contact.phone);
  const contactHtml = contacts.length
    ? contacts
        .map((contact) => {
          const role = contact.role ? ` (${escapeHtml(contact.role)})` : "";
          const email = contact.email ? `<br><span class="products">${escapeHtml(contact.email)}</span>` : "";
          const phone = contact.phone ? `<br><span class="products">${escapeHtml(contact.phone)}</span>` : "";
          return `<div>${escapeHtml(contact.name || "Contact")}${role}${email}${phone}</div>`;
        })
        .join("")
    : `<span class="muted-cell">No extra contacts</span>`;
  return `
    <tr>
      <td><button class="table-link" type="button" data-address-edit="${escapeAttribute(entry.id)}">${escapeHtml(entry.operation)}</button></td>
      <td>${entry.locations ? escapeHtml(entry.locations) : ""}</td>
      <td>${formatAddressContact(entry.primaryContact)}</td>
      <td>${entry.primaryContact.phone ? escapeHtml(entry.primaryContact.phone) : ""}${entry.primaryContact.email ? `<br><span class="products">${escapeHtml(entry.primaryContact.email)}</span>` : ""}</td>
      <td class="note-cell">${entry.address ? `<button class="table-link" type="button" data-address-map="${escapeAttribute(entry.address)}">${escapeHtml(entry.address)}</button>` : ""}</td>
      <td>${entry.accountNumber ? escapeHtml(entry.accountNumber) : ""}</td>
      <td>${entry.syscoAccountNumber ? escapeHtml(entry.syscoAccountNumber) : ""}</td>
      <td>${entry.usfSalesRep ? `<strong>USF:</strong> ${escapeHtml(entry.usfSalesRep)}<br>` : ""}${entry.syscoSalesRep ? `<strong>Sysco:</strong> ${escapeHtml(entry.syscoSalesRep)}` : ""}</td>
      <td>${entry.website ? `<a class="attachment-link" href="${escapeAttribute(normalizeWebsiteUrl(entry.website))}" target="_blank" rel="noopener">Website</a>` : ""}</td>
      <td>${entry.updatedAt ? formatDate(entry.updatedAt.slice(0, 10)) : ""}</td>
      <td>${contactHtml}</td>
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

function saveAddressBookEntry() {
  const id = elements.addressBookId.value || crypto.randomUUID();
  const existing = addressBook.find((entry) => entry.id === id);
  const entry = normalizeAddressBookEntry({
    id,
    operation: elements.addressOperation.value.trim(),
    accountNumber: elements.addressAccountNumber.value.trim(),
    syscoAccountNumber: elements.addressSyscoAccountNumber.value.trim(),
    locations: elements.addressLocations.value.trim(),
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
    .map(([vendor, vendorProducts]) => `
      <section class="stock-vendor-group">
        <div class="stock-vendor-header">
          <div>
            <p class="eyebrow">Vendor</p>
            <h3>${escapeHtml(vendor)}</h3>
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
    `)
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
  return `
    <tr>
      <td><button class="table-link" type="button" data-stock-edit="${escapeAttribute(product.id)}">${escapeHtml(product.description)}</button></td>
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
  elements.stockSo.value = existing?.so || "";
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
          reader.addEventListener("load", () =>
            resolve(
              normalizeStockAttachment({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                data: String(reader.result || ""),
                category,
                addedAt: new Date().toISOString()
              })
            )
          );
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
        <div class="attachment-row">
          <div class="attachment-main">
            <strong>${escapeHtml(file.name)}</strong>
            <span>${escapeHtml(file.category)} · ${formatFileSize(file.size)}</span>
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
      currentStockAttachments = currentStockAttachments.filter((file) => file.id !== button.dataset.removeStockAttachment);
      renderStockAttachmentList();
    });
  });
}

function saveStockProduct() {
  const id = elements.stockId.value || crypto.randomUUID();
  const existing = stockProducts.find((product) => product.id === id);
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
    so: elements.stockSo.value,
    vendor: elements.stockVendor.value.trim(),
    brandType: elements.stockBrandType.value,
    brandName: elements.stockBrandName.value.trim(),
    category: elements.stockCategory.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    attachments: currentStockAttachments.map(normalizeStockAttachment),
    updatedAt: new Date().toISOString()
  });
  stockProducts = existing ? stockProducts.map((item) => (item.id === id ? product : item)) : [product, ...stockProducts];
  persistStockProducts();
  updateStockCategorySuggestions();
  closeStockForm();
  renderStockLists();
}

function deleteCurrentStockProduct() {
  const id = elements.stockId.value;
  if (!id) return;
  const product = stockProducts.find((item) => item.id === id);
  if (!confirm(product?.description ? `Delete "${product.description}" from stock lists?` : "Delete this stock product?")) return;
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
  openPrintWindow(renderStockPrintDocument(products, selectedColumns, selectedVendor));
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

function compareTodos(a, b) {
  return compareDue(a, b) || priorities[b.priority] - priorities[a.priority] || new Date(b.createdAt) - new Date(a.createdAt);
}

function openTodoForm(todo) {
  elements.todoForm.reset();
  elements.subtaskList.innerHTML = "";
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
  const next = normalizeTodo({
    id,
    title: elements.todoTitle.value.trim(),
    priority: elements.todoPriority.value,
    due: elements.todoDue.value,
    assignedBy: elements.todoAssignedBy.value.trim(),
    account: elements.todoAccount.value.trim(),
    vendor: elements.todoVendor.value.trim(),
    notes: elements.todoNotes.value.trim(),
    subtasks: readSubtasks(),
    status,
    createdAt: existing?.createdAt || new Date().toISOString(),
    completedAt: status === "Done" ? existing?.completedAt || new Date().toISOString() : "",
    archivedAt: existing?.archivedAt || ""
  });
  todos = existing ? todos.map((todo) => (todo.id === id ? next : todo)) : [next, ...todos];
  persistTodos();
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
  const updatedTodo = normalizeTodo({
    ...existing,
    title: elements.todoTitle.value.trim(),
    priority: elements.todoPriority.value,
    due: elements.todoDue.value,
    assignedBy: elements.todoAssignedBy.value.trim(),
    account: elements.todoAccount.value.trim(),
    vendor: elements.todoVendor.value.trim(),
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

function addSubtaskRow(subtask = { text: "", done: false }) {
  const row = document.createElement("div");
  row.className = "subtask-row";
  row.innerHTML = `<label class="subtask-check"><input class="subtask-done" type="checkbox" ${subtask.done ? "checked" : ""} /><span>Done</span></label><input class="subtask-text" autocomplete="off" value="${escapeAttribute(subtask.text)}" placeholder="Checklist item" /><button class="remove-product" type="button">Remove</button>`;
  row.querySelector(".remove-product").addEventListener("click", () => row.remove());
  row.querySelector(".subtask-done").addEventListener("change", maybePromptTodoDone);
  elements.subtaskList.appendChild(row);
}

function readSubtasks() {
  return [...elements.subtaskList.querySelectorAll(".subtask-row")]
    .map((row) => ({ id: crypto.randomUUID(), text: row.querySelector(".subtask-text").value.trim(), done: row.querySelector(".subtask-done").checked }))
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

  const archiveHtml = [
    archivedCards.length ? `<div class="calendar-section-label">Leads</div>${archivedCards.map((card) => renderAccountNote(card, { archived: true })).join("")}` : "",
    archivedTodos.length ? `<div class="calendar-section-label">Tasks</div>${archivedTodos.map(renderArchivedTodo).join("")}` : "",
    archivedOperators.length ? `<div class="calendar-section-label">Operators</div>${archivedOperators.map(renderArchivedAddressBookEntry).join("")}` : ""
  ]
    .filter(Boolean)
    .join("");

  elements.archiveList.innerHTML = archiveHtml || `<div class="empty-state">No archived leads or tasks found</div>`;

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
  renderAttachmentList();

  if (card) {
    elements.account.value = card.account;
    elements.accountNumber.value = card.accountNumber || "";
    elements.syscoAccountNumber.value = card.syscoAccountNumber || "";
    elements.leadDistributor.value = card.distributor || "US Foods";
    elements.note.value = card.note;
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
  const next = {
    id,
    account: elements.account.value.trim(),
    accountNumber: elements.accountNumber.value.trim(),
    syscoAccountNumber: elements.syscoAccountNumber.value.trim(),
    distributor: elements.leadDistributor.value || "US Foods",
    note: elements.note.value.trim(),
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

  if (existing) {
    cards = cards.map((card) => (card.id === id ? next : card));
  } else {
    cards = [next, ...cards];
  }

  if (!persist()) return;
  closeForm();
  render();
}

function getCurrentLeadForPrint() {
  const id = elements.cardId.value;
  const existing = cards.find((card) => card.id === id);
  return normalizeCard({
    id: id || "preview",
    account: elements.account.value.trim() || "Untitled account",
    accountNumber: elements.accountNumber.value.trim(),
    syscoAccountNumber: elements.syscoAccountNumber.value.trim(),
    distributor: elements.leadDistributor.value || "US Foods",
    note: elements.note.value.trim(),
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

function renderStockPrintDocument(products, selectedColumnKeys, selectedVendor = "") {
  const columns = stockPrintColumns.filter((column) => selectedColumnKeys.includes(column.key));
  const title = `${getActiveStockGroup()?.label || "Stock List"}${selectedVendor ? ` - ${selectedVendor}` : ""}`;
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
          @page { size: landscape; margin: 0.32in 0.35in 0.42in; }
          body { margin: 0; color: #211d18; font: 10px Arial, sans-serif; }
          h1 { margin: 0 0 2px; font-size: 18px; }
          .muted { margin-bottom: 8px; color: #5d554b; font-weight: 700; }
          .vendor { margin: 0 0 10px; border: 1px solid #d8cdbc; break-inside: avoid; }
          .vendor-head { padding: 7px 9px; color: #fff; background: #2a1c13; }
          .vendor-label { color: #f0a544; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          h2 { margin: 2px 0 0; font-size: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d8cdbc; padding: 3px 4px; text-align: left; vertical-align: top; }
          th { background: #ead8c5; font-size: 9px; text-transform: uppercase; }
          td:first-child { font-weight: 800; }
          .footer { position: fixed; right: 0; bottom: -0.25in; left: 0; color: #5d554b; font-size: 10px; font-weight: 800; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
        ${[...groups.entries()]
          .map(
            ([vendor, vendorProducts]) => `
              <section class="vendor">
                <div class="vendor-head">
                  <div><div class="vendor-label">Vendor</div><h2>${escapeHtml(vendor)}</h2></div>
                </div>
                <table>
                  <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
                  <tbody>${vendorProducts
                    .map((product) => `<tr>${columns.map((column) => `<td>${escapeHtml(product[column.key] || "")}</td>`).join("")}</tr>`)
                    .join("")}</tbody>
                </table>
              </section>
            `
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
          <div class="muted">${leadCards.length} lead${leadCards.length === 1 ? "" : "s"} · Printed ${escapeHtml(new Date().toLocaleDateString())}</div>
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
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
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
  const typed = elements.account.value.trim().toLowerCase();
  if (!typed) return;
  const match = getAccountDirectory().find((account) => account.name.toLowerCase() === typed);
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
          reader.addEventListener("load", () =>
            resolve(
              normalizeAttachment({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                data: String(reader.result || ""),
                addedAt: new Date().toISOString()
              })
            )
          );
          reader.addEventListener("error", reject);
          reader.readAsDataURL(file);
        })
    )
  )
    .then((attachments) => {
      currentAttachments = [...currentAttachments, ...attachments];
      renderAttachmentList();
    })
    .catch(() => alert("One of the attachments could not be added."));
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

  const type = file.type || "";
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) {
    elements.attachmentPreview.innerHTML = `<img src="${escapeAttribute(file.data)}" alt="${escapeAttribute(file.name)}" />`;
    return;
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    elements.attachmentPreview.innerHTML = `<iframe title="${escapeAttribute(file.name)}" src="${escapeAttribute(file.data)}"></iframe>`;
    return;
  }
  if (type.startsWith("text/") || name.endsWith(".csv") || name.endsWith(".txt")) {
    try {
      const response = await fetch(file.data);
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
    ...cards.flatMap((card) => card.attachments || []),
    ...stockProducts.flatMap((product) => product.attachments || [])
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

function onDrop(event) {
  event.preventDefault();
  const status = event.currentTarget.dataset.status;
  event.currentTarget.classList.remove("drag-over");
  if (!draggedId || !status) return;
  cards = cards.map((card) => (card.id === draggedId ? { ...card, status } : card));
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
  const end = new Date(date);
  const day = end.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  end.setDate(end.getDate() + daysUntilSunday);
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
