/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */

let timer;
let showingTooltipIndex;

function showTooltip(element, index) {
  if (showingTooltipIndex === index) return;

  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  const container = document.querySelector(".faker_cheatsheet_grid");

  showingTooltipIndex = index;
  copy_tooltip.textContent = "Copied";
  copy_tooltip.style.display = "flex";
  copy_tooltip.style.left = `${element.offsetLeft + (element.clientWidth - copy_tooltip.clientWidth) / 2}px`;
  copy_tooltip.style.top = `${element.offsetTop - 30 - (container.scrollTop || 0)}px`;
  copy_tooltip.style.zIndex = 99;

  timer = setTimeout(() => {
    resetTooltip();
  }, 2000);
}

function resetTooltip() {
  copy_tooltip.style.display = "none";
  copy_tooltip.style.left = `0px`;
  copy_tooltip.style.top = `0px`;

  showingTooltipIndex = undefined;
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function openMenu(element, signature) {
  const container = document.querySelector(".faker_cheatsheet_grid");

  open_menu_popup.textContent = "Copy as JSDoc annotation";
  open_menu_popup.style.display = "flex";
  open_menu_popup.style.left = `${element.offsetLeft}px`;
  open_menu_popup.style.top = `${element.offsetTop + 30 - (container.scrollTop || 0)}px`;
  open_menu_popup.style.zIndex = 99;

  open_menu_popup.onclick = async function () {
    try {
      resetMenuPopup();

      await navigator.clipboard.writeText(`/** @faker ${signature} */`);
    } catch (error) {
      console.error(error);
    }
  };
}

async function onItemMouseDown(event, element, index, signature) {
  if (event.button !== 0) return;

  try {
    await navigator.clipboard.writeText(signature);

    showTooltip(element, index);
  } catch (error) {
    console.error(error);
  }
}

function openMenuPopup(event, element, signature) {
  event.preventDefault();

  openMenu(element, signature);
}

function resetMenuPopup() {
  open_menu_popup.style.display = "none";
  open_menu_popup.style.left = `0px`;
  open_menu_popup.style.top = `0px`;
  open_menu_popup.style.zIndex = 0;
}

window.addEventListener("click", (event) => {
  if (event.target.contains(open_menu_popup)) return;

  resetMenuPopup();
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "escape") {
    resetMenuPopup();
  }
});
