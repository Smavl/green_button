const box = document.getElementById("showNegative");
browser.storage.sync.get({ showNegative: true }).then((s) => { box.checked = s.showNegative; });
box.addEventListener("change", () => browser.storage.sync.set({ showNegative: box.checked }));
