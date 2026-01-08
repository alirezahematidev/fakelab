/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-undef */

if (typeof EventSource !== "undefined") {
  if (window.__fakelabEventSource) {
    window.__fakelabEventSource.close();
  }

  const source = new EventSource("/__reload");
  window.__fakelabEventSource = source;

  source.addEventListener("reload", () => {
    console.log("Reloading …");
    source.close();
    window.location.reload();
  });

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    if (source.readyState !== EventSource.CLOSED) {
      source.close();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  var o = document.querySelector(".error"),
    e = document.querySelector(".preview-loading"),
    r = document.querySelector(".code"),
    t = document.querySelector(".preview_toolbar"),
    l = document.querySelector(".loader");
  try {
    hljs.highlightAll(), r && r.classList.remove("loading"), e && e.classList.remove("loading"), t && t.classList.remove("loading");
  } catch (e) {
    console.info(e), o && o.classList.add("visible"), l && l.classList.remove("visible");
  }
});
