initFetch();

//Easier storage api
const storage = {
    get: (item) => {
        return new Promise((resolve, reject) => {  
            chrome.storage.local.get(Array.isArray(item) ? item : [item], (res) => {
                if (chrome.runtime.lastError) {
                  return reject(chrome.runtime.lastError);
                }
                var _return = Array.isArray(item) ? res : res[item];
                resolve(_return);
            });
        })
    },
    set: (item, val) => {
        return new Promise((resolve, reject) => {  
            chrome.storage.local.set(item instanceof Object ? item : {[item]: val}, (res) => {
                if (chrome.runtime.lastError) {
                  return reject(chrome.runtime.lastError);
                }
                //res is nothing here
                var _return = item
                resolve(_return);
            });
        })
    }
}

var app = Vue.createApp({
  data() {
    return {
      //list of addons
      addons: [],
      //Current addon
      addon: null,
      //Addon options (actual options + values)
      options: {},
    };
  },
  async mounted() {
    var last = await storage.get("last_used_app")
    if (last && last !== "home"){
        await this.loadAddon(last);
    }
    document.querySelector(".loading").style.opacity = 0;
    setTimeout(() => document.querySelector(".loading").remove(), 600);
    var {addon_settings: existing}  = await new Promise(res => chrome.storage.sync.get(["addon_settings"], res));
    if (!existing) (existing = {})
    console.log("Got existing settings: %o", existing)
    this.addons = await getAddons();
    for (let addon of this.addons){
        if (!addon.options) continue;
        console.log("Addon options for %o: %o", addon.id, addon.options)
        //Basically transform default options into array, then map, then back to object
        this.options[addon.id] = existing[addon.id] || Object.fromEntries(Object.entries(addon.options).map(([key, val]) => ([key, val.default])));
    }
  },
  methods: {
    storeSettings(){
        console.log("Saving settings");
        chrome.storage.sync.set({"addon_settings": this.options});
    },
    closeAddon(){
        storage.set("last_used_app", "home");
        location.reload();
    },
    async loadAddon(id) {
      console.log("Loading %o", id);
      const addons = await $f("/addons.json").then((res) => res.json());
      const _addon = addons.find((i) => i.id === id);
      this.addon = _addon;
      if (!_addon) return console.log("No addon with that ID", id);
      const html = await $f(
        `/addons/${_addon.id}/${_addon.html || "index.html"}`
      ).then((res) => res.text());
      this.addon.html = html;
      requestAnimationFrame(async () => {
        if (_addon.dependencies?.length){
            await Promise.all(_addon.dependencies.map((s) => load(`/libs/${s}`)));
            console.log("Loaded dependencies")
        }
        if (_addon.styles?.length){
            await Promise.all(_addon.styles.map((s) => loadStyle(`/addons/${_addon.id}/${s}`)));
            console.log("Loaded styles")
        }
        if (_addon.scripts){
            _addon.scripts.forEach((s) => loadScript(`/addons/${_addon.id}/${s}`));
        }
        storage.set("last_used_app", id);
      })
    },
  },
}).mount("#app");

function load(src){
    return new Promise((resolve, reject) => {
        var s = document.createElement("script");
        s.src = src;
            //Fixes Range out of order err
        s.setAttribute("charset", "utf-8");
        (document.head || document.body || document.documentElement).appendChild(s);
        s.onload = resolve;
        s.onerror = reject;
    });
}
async function loadStyle(style){
    var s = document.createElement("style");
    s.innerHTML = await $f(style).then(res => res.text());
    (document.head || document.body || document.documentElement).appendChild(s);
    return;
}
async function loadScript(src) {
    console.log("Loading script %o", src);
    const exports = await import(src);
    console.log("Loaded, %o", exports);
    const permissions = {
        getPermission: (permission) => {
            return new Promise(resolve => {
                chrome.permissions.request({
                    permissions: Array.isArray(permission) ? permission : [permission],
                    origins: ['*://*/*']
                }, resolve)
            })
        },
        removePermission: (permission) => {
            return new Promise(resolve => {
                chrome.permissions.remove({
                    permissions: Array.isArray(permission) ? permission : [permission],
                    origins: ['*://*/*']
                }, resolve)
            })
        },
        hasPermission: (permission) => {
            return new Promise(resolve => {
                chrome.permissions.contains({
                    permissions: Array.isArray(permission) ? permission : [permission],
                    origins: ['*://*/*']
                }, resolve)
            })
        },
    }
    exports.default({
        ...permissions,
        withPermissions: async (list, fn) => {
            //Can't request permissions from background pages =|
            return fn();
            if (await permissions.hasPermission(list)) {
                return fn();
            }
            var has = await permissions.getPermission(list);
            if (!has) {
                throw new Error(`User denied permission`);
                return;
            };
            var result = fn();
            await Promise.all(list.map(permissions.removePermission));
            return result;
        },
        options: app.options[app.addon.id] || {},
        runScript: (s, ...args) => {
            if (typeof s === 'function'){
                s = `(${s})(...${JSON.stringify(args)})`;
            }
            chrome.devtools.inspectedWindow.eval(s)
        }, 
        addStyle: (s) => {
            chrome.devtools.inspectedWindow.eval(`(${(style) => {
                var s = document.createElement("style");
                s.innerHTML = style;
                (document.body || document.documentElement).appendChild(s);
            }})(${JSON.stringify(s)})`)
        },
        browser: chrome, 
        Snackbar,
        copy: (_text) => {
            //navigator.clipboard.writeText(_text);
            var t = document.createElement("textarea");
            document.body.appendChild(t);
            t.value = _text;
            t.select();
            document.execCommand("copy");
            t.remove();
            t.blur();
            return;
        },
        closeAddon: app.closeAddon,
        storage: {
            sync: {
                get: (item) => {
                    return new Promise((resolve, reject) => {  
                        chrome.storage.sync.get(Array.isArray(item) ? item : [item], (res) => {
                            if (chrome.runtime.lastError) {
                              return reject(chrome.runtime.lastError);
                            }
                            var _return = Array.isArray(item) ? res : res[item];
                            resolve(_return);
                        });
                    })
                },
                set: (item, val) => {
                    return new Promise((resolve, reject) => {  
                        chrome.storage.sync.set(item instanceof Object ? item : {[item]: val}, (res) => {
                            if (chrome.runtime.lastError) {
                              return reject(chrome.runtime.lastError);
                            }
                            //res is nothing here
                            var _return = item
                            resolve(_return);
                        });
                    })
                }
            },
            local: storage,
        },
        inspectedWindow: chrome.devtools.inspectedWindow, 
        devtools: chrome.devtools,
    })
}

Function.prototype.$p = function(...args){
    return new Promise(resolve => {
        this(...args, resolve);
    })
}

async function getAddons() {
  return await $f("/addons.json").then((res) => res.json());
}

function initFetch() {
  const _fetch = window.fetch;
  window.$f = (e, i = {}) => (
    window.FETCH_CACHE || (window.FETCH_CACHE = {}),
    new Promise((o) => {
      var n = JSON.stringify({
        url: e,
        method: i.method,
        body: i.body,
        headers: JSON.stringify(i.headers),
      });
      if (window.FETCH_CACHE[n])
        return (
          o(window.FETCH_CACHE[n].clone()),
          void console.log("Fetched from cache")
        );
      _fetch(e, i).then((e) => {
        (window.FETCH_CACHE[n] = e.clone()),
          o(e),
          console.log("Fetched new version");
      });
    })
  );
}
