/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */

function copyAddressUrl() {
  const address_url = document.getElementById("request_address_url");
  try {
    navigator.clipboard.writeText(address_url.textContent);
  } catch (err) {
    console.info(err);
  }
}

function copyJsonCode() {
  const code = document.getElementById("source_code");
  try {
    navigator.clipboard.writeText(code.textContent);
  } catch (err) {
    console.info(err);
  }
}

function downloadJsonCode(element) {
  const code = document.getElementById("source_code");
  const jsonText = code.textContent.trim();
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const sourceName = element.getAttribute("data-source-name");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const fileName = `${sourceName}-${timestamp}.json`;

  element.download = fileName;

  element.href = url;

  setTimeout(() => {
    URL.revokeObjectURL(url);
    element.download = "";
    element.href = "";
  });
}

function openSettings() {
  const element = document.getElementById("setting_overlay");
  element.setAttribute("data-visible", "true");
}

function handleCloseSetting(event) {
  const element = document.getElementById("setting_overlay");

  if (!event.target) return;
  if (!element.contains(event.target) && event.target.id !== "overlay_trigger") {
    element.setAttribute("data-visible", "false");
  }
}

function submitForm(event) {
  event.preventDefault();
  const resetReasons = new Set();
  const formData = new FormData(event.target);
  const countValue = formData.get("count")?.trim();
  const params = new URLSearchParams();

  if (countValue && Number(countValue) > 0) {
    params.set("count", countValue.toString());
    window.location.search = params.toString();
  } else {
    params.delete("count");
    resetReasons.add("count");
  }

  const hasCountReason = resetReasons.has("count");

  if (hasCountReason) {
    if (window.location.href.includes("?")) {
      [href] = window.location.href.split("?");

      window.location.href = href;
    }
  }
}

function resetForm(event) {
  event.preventDefault();
  const params = new URLSearchParams(window.location.search);
  params.delete("count");
  if (window.location.href.includes("?")) {
    window.location.href = window.location.href.split("?")[0];
  }
}

window.addEventListener("click", handleCloseSetting);

window.addEventListener("DOMContentLoaded", () => {
  const countElement = document.getElementById("count");

  const params = new URLSearchParams(window.location.search);
  const countValue = params.get("count");
  if (countValue) countElement.value = countValue;
});
