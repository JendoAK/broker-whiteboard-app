/* Uploaded Print Center artwork is shared across the team and Product Support workspaces. */
(() => {
  "use strict";
  const table = "print_logo_assets";
  const client = () => {
    const db = window.foodBrokerBaseAuth?.client;
    if (!db?.from) throw new Error("Connect to the shared logo library and try again.");
    return db;
  };
  async function save(name, image) {
    const {error} = await client().from(table).upsert({
      name, image_data:image.dataUrl, width:image.width, height:image.height, thumbnail:image.thumbnail
    }, {onConflict:"id", ignoreDuplicates:true});
    if (error) throw error;
  }
  async function savedLogos(valid) {
    const rows = [];
    const pageSize = 120;
    let last = "";
    while (valid()) {
      let query = client().from(table).select("id,name,thumbnail").order("id").limit(pageSize);
      if (last) query = query.gt("id",last);
      const {data,error} = await query;
      if (error) throw error;
      rows.push(...data.map(row => ({id:row.id,name:row.name,thumbnail:row.thumbnail,saved:true})));
      if (data.length < pageSize) break;
      last = data[data.length - 1].id;
    }
    return rows;
  }
  async function read(id) {
    const {data,error} = await client().from(table).select("name,image_data,width,height").eq("id",id).single();
    if (error) throw error;
    return {name:data.name,dataUrl:data.image_data,width:data.width,height:data.height};
  }
  function open({valid,choose}) {
    const dialog = document.createElement("dialog");
    dialog.className = "print-logo-library";
    dialog.setAttribute("aria-labelledby","printLogoLibraryTitle");
    dialog.innerHTML = '<header><h2 id="printLogoLibraryTitle">Logo library</h2><button type="button" aria-label="Close logo library">Close</button></header><input type="search" placeholder="Search logos by name" aria-label="Search logos by name"><p role="status"></p><div class="print-logo-results"></div>';
    const results = dialog.querySelector(".print-logo-results");
    const status = dialog.querySelector("[role=status]");
    const search = dialog.querySelector("input");
    const included = window.foodBrokerPrintLogos.options("automatic").map(entry =>
      ({id:entry.id,name:entry.name,thumbnail:entry.src,saved:false}));
    let saved = [], pending = false;
    const active = () => valid() && dialog.open;
    function render() {
      const query = search.value.trim().toLowerCase();
      results.replaceChildren();
      for (const entry of [...saved,...included].filter(e => e.name.toLowerCase().includes(query))) {
        const button = document.createElement("button");
        button.type = "button";
        const img = new Image();
        img.loading = "lazy"; img.alt = ""; img.src = entry.thumbnail;
        const name = document.createElement("span");
        name.textContent = entry.name;
        button.append(img,name);
        if (entry.saved) {
          const badge = document.createElement("small");
          badge.textContent = "Uploaded";
          button.append(badge);
        }
        button.onclick = async () => {
          if (!active() || pending) return;
          pending = true;
          try {
            if (entry.saved) status.textContent = "Loading logo…";
            const image = entry.saved ? await read(entry.id) : null;
            if (!active()) return;
            choose(entry,image);
            dialog.close();
          } catch {
            if (active()) status.textContent = "Could not load this logo. Check your connection and try again.";
          } finally { pending = false; }
        };
        results.append(button);
      }
      if (!results.childElementCount) results.textContent = "No matching logos.";
    }
    dialog.querySelector("header button").onclick = () => dialog.close();
    dialog.addEventListener("close",() => dialog.remove(),{once:true});
    search.oninput = render;
    document.body.append(dialog);
    dialog.showModal();
    search.focus();
    render();
    status.textContent = "Loading shared uploads…";
    savedLogos(active).then(rows => {
      if (!active()) return;
      saved = rows.sort((a,b) => a.name.localeCompare(b.name));
      if (!pending) status.textContent = "";
      render();
    }).catch(() => {
      if (active()) status.textContent = "Shared uploads could not load. Reopen the library to retry.";
    });
    return dialog;
  }
  window.foodBrokerLogoLibrary = Object.freeze({save,open});
})();
