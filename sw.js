/* Service Worker — App-Shell im Cache, damit die Anwendung offline startet.
   Bei jeder Änderung an den Dateien VERSION erhöhen. */
var VERSION = "v8";
var CACHE = "behandlungsplaetze-" + VERSION;
var SHELL = [
  "./",
  "./index.html",
  "./bericht.html",
  "./logbuch.html",
  "./module.html",
  "./abschluss.html",
  "./monitoring.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(namen){
      return Promise.all(namen.map(function(n){
        return n === CACHE ? null : caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("message", function(ev){
  if(ev.data === "uebernehmen") self.skipWaiting();
});

/* Navigationen: erst Netz, bei Ausfall die zwischengespeicherte Seite.
   Übrige Anfragen: erst Cache, sonst Netz und nachtragen. */
self.addEventListener("fetch", function(ev){
  var anfrage = ev.request;
  if(anfrage.method !== "GET") return;
  if(new URL(anfrage.url).origin !== self.location.origin) return;

  if(anfrage.mode === "navigate"){
    ev.respondWith(
      fetch(anfrage).then(function(antwort){
        var kopie = antwort.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", kopie); });
        return antwort;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(anfrage).then(function(treffer){
      if(treffer) return treffer;
      return fetch(anfrage).then(function(antwort){
        if(antwort && antwort.status === 200 && antwort.type === "basic"){
          var kopie = antwort.clone();
          caches.open(CACHE).then(function(c){ c.put(anfrage, kopie); });
        }
        return antwort;
      });
    })
  );
});
