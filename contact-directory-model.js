/* Contact-only projections shared by the team and Product Support directories. */
(function (scope) {
  "use strict";
  const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const scalar = value => value == null ? "" : ["string", "number", "boolean", "bigint"].includes(typeof value) ? String(value) : "";
  const label = value => scalar(value).trim().replace(/\s+/g, " ");
  const key = value => label(value).normalize("NFKC").toLowerCase();
  const list = value => Array.isArray(value) ? value.map(label).filter(Boolean) : label(value) ? [label(value)] : [];
  function unique(values) {
    const found = new Map();
    values.forEach(value => { const name = label(value); if (name && !found.has(key(name))) found.set(key(name), name); });
    return [...found.values()];
  }
  function canonicalGroup(value) {
    const name = label(value), normalized = key(name).replace(/[\s_-]+/g, "");
    if (["school", "schools", "schoolcontact", "schoolcontacts"].includes(normalized)) return "School";
    if (["admin", "admincontact", "admincontacts"].includes(normalized)) return "Admin Contact";
    return name;
  }
  function extraValue(value) {
    if (Array.isArray(value)) {
      if (value.some(item => item != null && !["string", "number", "boolean", "bigint"].includes(typeof item))) throw new TypeError("Additional contact details must contain text, numbers or yes/no values.");
      return value.map(scalar).join("\n");
    }
    if (value != null && !["string", "number", "boolean", "bigint"].includes(typeof value)) throw new TypeError("Additional contact details must contain text, numbers or yes/no values.");
    return scalar(value);
  }
  function normalizeExtraFields(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(field => {
      if (!field || typeof field !== "object" || Array.isArray(field) || !owns(field, "label") || !owns(field, "value")) throw new TypeError("Additional contact details need a label and a value.");
      return {label:scalar(field.label), value:extraValue(field.value)};
    });
    if (typeof value === "object") return Object.entries(value).map(([name, item]) => ({label:name, value:extraValue(item)}));
    throw new TypeError("Additional contact details must be a list of labeled values.");
  }
  function normalizeContact(value = {}) {
    const person = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const legacy = scalar(person.contact).trim();
    const explicit = owns(person, "email") || owns(person, "phone");
    const email = explicit ? scalar(person.email).trim() : (legacy.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [""])[0];
    const phone = explicit ? scalar(person.phone).trim() : legacy.replace(email, "").replace(/^[\s·|,;]+|[\s·|,;]+$/g, "");
    const contact = explicit ? [email, phone].filter(Boolean).join(" · ") : legacy;
    const result = {
      id:scalar(person.id), name:person.name === "[object Object]" ? "" : scalar(person.name),
      organization:scalar(person.organization), role:scalar(person.role), contact, email, phone,
      category:canonicalGroup(person.category) || "Other", previousNames:list(person.previousNames),
      updatedAt:scalar(person.updatedAt), archivedAt:scalar(person.archivedAt),
      schoolName:scalar(person.schoolName), groups:unique(list(person.groups).map(canonicalGroup)),
      extraFields:normalizeExtraFields(person.extraFields)
    };
    for (const field of ["location", "address", "website", "notes"]) if (owns(person, field)) result[field] = scalar(person[field]);
    return result;
  }
  function schoolName(person = {}) { return label(person.schoolName) || label(person.organization); }
  function isSchool(person = {}) {
    return Boolean(label(person.schoolName)) || [person.category, ...list(person.groups)].some(value => canonicalGroup(value) === "School") || /\bschools?\b|\bschool[\s-]*district\b|\bk[\s-]*12\b/i.test(scalar(person.organization));
  }
  function isAdmin(person) {
    return [person.category, ...list(person.groups)].some(value => canonicalGroup(value) === "Admin Contact") || /\badmin(?:istrative|istrator|istration)?\b/i.test(scalar(person.role));
  }
  function groupsFor(person = {}) {
    const groups = [...list(person.groups).map(canonicalGroup), canonicalGroup(person.category)];
    const organization = key(person.organization).replace(/[^a-z0-9]/g, "");
    if (organization.startsWith("usfoods") || organization === "usf") groups.push("US Foods");
    if (organization.startsWith("sysco")) groups.push("Sysco");
    if (/regional.*manager/i.test(scalar(person.role))) groups.push("Regional Managers");
    if (organization === "pc" || organization.includes("piercecartwright") || key(person.category) === "our team") groups.push("Pierce Cartwright");
    if (isSchool(person)) groups.push("School");
    if (isAdmin(person)) groups.push("Admin Contact");
    return unique(groups);
  }
  function matchesGroup(person = {}, filter = "all") {
    const requested = scalar(filter), custom = requested.startsWith("group:");
    const name = custom ? requested.slice(6) : requested, normalized = key(name).replace(/[\s_-]+/g, "");
    if (!custom && (!normalized || normalized === "all")) return true;
    const aliases = {usfoods:"US Foods", usf:"US Foods", sysco:"Sysco", regional:"Regional Managers", regionalmanager:"Regional Managers", regionalmanagers:"Regional Managers", pc:"Pierce Cartwright", piercecartwright:"Pierce Cartwright", school:"School", schools:"School", schoolcontact:"School", schoolcontacts:"School", admin:"Admin Contact", admincontact:"Admin Contact", admincontacts:"Admin Contact"};
    const target = custom ? canonicalGroup(name) : aliases[normalized] || canonicalGroup(name);
    return groupsFor(person).some(value => key(value) === key(target));
  }
  function groupSchools(people = []) {
    const schools = new Map();
    people.forEach(value => {
      const person = normalizeContact(value);
      if (!isSchool(person) || person.archivedAt) return;
      const name = schoolName(person) || "School", schoolKey = key(name);
      if (!schools.has(schoolKey)) schools.set(schoolKey, {key:schoolKey, name, contacts:[]});
      schools.get(schoolKey).contacts.push(person);
    });
    return [...schools.values()].sort((a,b) => a.name.localeCompare(b.name));
  }
  function searchText(value = {}) {
    const person = normalizeContact(value);
    return [person.name, person.organization, person.schoolName, person.role, person.contact, person.email, person.phone, person.category, person.location, person.address, person.website, person.notes, ...person.previousNames, ...groupsFor(person), ...person.extraFields.flatMap(field => [field.label, field.value])].filter(value => value !== undefined && value !== "").join("\n");
  }
  scope.foodBrokerContactDirectory = Object.freeze({normalizeContact, schoolName, isSchool, groupSchools, searchText, groupsFor, matchesGroup});
})(typeof window === "object" ? window : globalThis);
