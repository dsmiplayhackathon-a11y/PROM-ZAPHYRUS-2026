"use strict";

/* CONFIGURACIÓN */

/*
 * scriptUrl: pega aquí la URL de tu implementación de Apps Script
 *            (la que termina en /exec).
 * starHoldDuration: tiempo que quedan quietas las 3 estrellas.
 * fadeDuration debe coincidir con la transición de opacidad
 * de #machineScreen en styles.css (0.5s).
 */

const CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/AKfycbzYBCS1Unw0hKl527jABu6anGza8pbZN59AoNQaJcI3EJFXEVxpwXKuYdOsizhWnHCN/exec",
  requestTimeout: 15000,

  curtainOpenDuration: 2000,
  reelSpinDuration: 2000,
  starHoldDuration: 1000,
  fadeDuration: 500,
  totalTables: 14,
  tablesPerSide: 7
};

/* MENSAJES */

const MESSAGES = {
  incomplete: "Escribe tu nombre completo.",
  notFound: "No encontramos ese invitado. Revisa el nombre.",
  ambiguous: "Hay coincidencias ambiguas. Solicita ayuda.",
  needSecondSurname:
    "Hay más de una persona con ese nombre. Escribe también tu segundo apellido.",
  connection: "No pudimos conectar. Inténtalo de nuevo en unos segundos.",
  notConfigured: "Falta configurar la dirección del script."
};

/* ESTADO */

/*
 * confirmedGuest: { name, table } con los datos que devuelve el script.
 */

const state = {
  confirmedGuest: null,
  assignedTable: null,
  verifying: false,
  spinStarted: false,
  finishing: false
};

/* ELEMENTOS */

const $ = id => document.getElementById(id);

const welcomeScreen = $("welcomeScreen");
const loginScreen = $("loginScreen");
const machineScreen = $("machineScreen");
const resultScreen = $("resultScreen");

const curtainLayer = $("curtainLayer");
const openCurtainBtn = $("openCurtainBtn");

const guestName = $("guestName");
const guestForm = $("guestForm");
const formMessage = $("formMessage");
const verifyBtn = $("verifyBtn");

const machine = document.querySelector(".machine");
const spinBtn = $("spinBtn");
const reels = $("reels");
const stageInstruction = $("stageInstruction");

const leftTables = $("leftTables");
const rightTables = $("rightTables");

const finishBtn = $("finishBtn");

/* CAMBIO DE PANTALLAS */

function showScreen(screen) {
  [welcomeScreen, loginScreen, machineScreen, resultScreen].forEach(item => {
    item.classList.remove("is-active");
  });

  screen.classList.add("is-active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* CONEXIÓN CON EL SCRIPT DE GOOGLE */

function isScriptConfigured() {
  return CONFIG.scriptUrl.startsWith("https://script.google.com/");
}

/*
 * Aviso silencioso: despierta el script y carga la lista en su memoria
 * temporal, para que la consulta real del invitado responda más rápido.
 * No envía ningún nombre y no muestra nada en pantalla.
 */

function warmUpScript() {
  if (!isScriptConfigured()) return;

  fetch(`${CONFIG.scriptUrl}?ping=1`, {
    mode: "no-cors",
    cache: "no-store"
  }).catch(() => {});
}

/* Consulta al script; se cancela si tarda más de requestTimeout */

async function lookupGuest(name) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, CONFIG.requestTimeout);

  try {
    const response = await fetch(
      `${CONFIG.scriptUrl}?nombre=${encodeURIComponent(name)}`,
      {
        signal: controller.signal,
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

  } finally {
    clearTimeout(timer);
  }
}

function getFailureMessage(result) {
  switch (result && result.motivo) {
    case "incompleto":
      return MESSAGES.incomplete;

    case "no_encontrado":
      return MESSAGES.notFound;

    case "segundo_apellido":
      return MESSAGES.needSecondSurname;

    case "ambiguo":
      return MESSAGES.ambiguous;

    default:
      return MESSAGES.connection;
  }
}

/* ABRIR CORTINAS */

function openCurtain() {
  warmUpScript();

  curtainLayer.classList.add("is-opening");

  setTimeout(() => {
    curtainLayer.classList.add("is-gone");
    showScreen(loginScreen);
    guestName.focus();
  }, CONFIG.curtainOpenDuration);
}

/* MENSAJES DEL FORMULARIO */

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function countWords(value) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/* VERIFICAR INVITADO (botón INGRESAR) */

async function verifyGuest() {
  if (state.confirmedGuest || state.verifying) return;

  const typedName = guestName.value.trim().replace(/\s+/g, " ");

  /* Revisión simple antes de consultar; la validación real la hace el script */

  if (countWords(typedName) < 2) {
    setFormMessage(MESSAGES.incomplete, "error");
    guestName.focus();
    return;
  }

  if (!isScriptConfigured()) {
    setFormMessage(MESSAGES.notConfigured, "error");
    return;
  }

  state.verifying = true;

  guestName.readOnly = true;
  verifyBtn.disabled = true;
  verifyBtn.textContent = "BUSCANDO…";

  setFormMessage("Buscando tu nombre…");

  try {
    const result = await lookupGuest(typedName);
    const table = Number(result.mesa);

    /* Solo se acepta una respuesta completa y con una mesa válida */

    if (
      result.ok &&
      result.nombre &&
      Number.isInteger(table) &&
      table >= 1 &&
      table <= CONFIG.totalTables
    ) {
      state.confirmedGuest = {
        name: String(result.nombre),
        table: table
      };

      guestName.disabled = true;
      verifyBtn.disabled = true;

      stageInstruction.textContent =
        "Identidad confirmada. Pulsa START para girar la máquina.";

      showScreen(machineScreen);
      return;
    }

    setFormMessage(getFailureMessage(result), "error");

  } catch (error) {
    setFormMessage(MESSAGES.connection, "error");

  } finally {
    state.verifying = false;
    verifyBtn.textContent = "INGRESAR";

    /* Si no se pudo confirmar, se devuelve el formulario para reintentar */

    if (!state.confirmedGuest) {
      guestName.readOnly = false;
      verifyBtn.disabled = guestName.value.trim().length === 0;
      guestName.focus();
    }
  }
}

/* GIRAR LA MÁQUINA (botón START) */

function spinMachine() {
  if (!state.confirmedGuest || state.spinStarted) return;

  state.spinStarted = true;
  spinBtn.disabled = true;

  reels.classList.add("is-spinning");

  /* Al pulsar START el texto cambia y crece (ver #stageInstruction.is-searching) */
  stageInstruction.textContent = "Buscando tu mesa...";
  stageInstruction.classList.add("is-searching");

  /* Debe ir antes del temporizador principal: ambos terminan a la vez */
  animateReels();

  setTimeout(() => {
    reels.classList.remove("is-spinning");

    /* Con las 3 estrellas a la vista, la máquina brilla y parpadea */
    machine.classList.add("is-winning");

    state.assignedTable = state.confirmedGuest.table;

    /* Las 3 estrellas quedan a la vista, luego la pantalla se desvanece */

    setTimeout(() => {
      machineScreen.classList.add("is-fading");

      setTimeout(revealResult, CONFIG.fadeDuration);
    }, CONFIG.starHoldDuration);

  }, CONFIG.reelSpinDuration);
}

/* ANIMACIÓN DE RODILLOS (terminan en 3 estrellas) */

function animateReels() {
  const symbols = ["7", "★", "♦", "♛", "✦", "♠"];

  const reelSymbols = [
    ...reels.querySelectorAll(".reel-symbol")
  ];

  reelSymbols.forEach((symbol, index) => {
    const interval = setInterval(() => {
      symbol.textContent =
        symbols[Math.floor(Math.random() * symbols.length)];
    }, 90);

    /* Rodillos 1, 2 y 3 se detienen escalonados; el último justo al final */

    setTimeout(() => {
      clearInterval(interval);
      symbol.textContent = "★";
    }, CONFIG.reelSpinDuration - 240 + index * 120);
  });
}

/* CONSTRUIR PLANO */

/*
 * Se dibujan las 14 mesas, pero solo la mesa del invitado
 * muestra su número y se ilumina.
 *
 * Distribución (de la tarima hacia la entrada):
 *  - Lado derecho: mesas 7, 6, 5, 4, 3, 2, 1 (la 1 queda junto a la entrada).
 *  - Lado izquierdo: mesas 8, 9, 10, 11, 12, 13, 14.
 */

function createTableNode(number, selectedTable) {
  const table = document.createElement("div");

  table.className = "table-node";

  if (number === selectedTable) {
    table.textContent = String(number).padStart(2, "0");
    table.classList.add("is-selected");
    table.setAttribute("aria-current", "true");
  }

  return table;
}

function buildFloorplan(selectedTable) {
  leftTables.innerHTML = "";
  rightTables.innerHTML = "";

  /* Derecha: de la mesa 7 (arriba) a la mesa 1 (abajo) */
  for (let number = CONFIG.tablesPerSide; number >= 1; number--) {
    rightTables.appendChild(createTableNode(number, selectedTable));
  }

  /* Izquierda: de la mesa 8 (arriba) a la mesa 14 (abajo) */
  for (
    let number = CONFIG.tablesPerSide + 1;
    number <= CONFIG.totalTables;
    number++
  ) {
    leftTables.appendChild(createTableNode(number, selectedTable));
  }
}

/* REVELAR RESULTADO */

function revealResult() {
  $("resultGuest").textContent =
    state.confirmedGuest.name.toUpperCase();

  $("resultTableNumber").textContent =
    String(state.assignedTable).padStart(2, "0");

  buildFloorplan(state.assignedTable);

  showScreen(resultScreen);

  launchFireworks();
}

/* PIROTECNIA */

function launchFireworks() {
  const container = $("fireworks");

  container.innerHTML = "";

  for (let i = 0; i < 85; i++) {
    const spark = document.createElement("span");

    spark.className = "spark";

    spark.style.left = Math.random() * 100 + "%";
    spark.style.top = (35 + Math.random() * 55) + "%";

    spark.style.setProperty(
      "--dx",
      (Math.random() - 0.5) * 230 + "px"
    );

    spark.style.setProperty(
      "--dy",
      (-50 - Math.random() * 220) + "px"
    );

    spark.style.setProperty(
      "--duration",
      (1.1 + Math.random() * 1.8) + "s"
    );

    spark.style.animationDelay =
      Math.random() * .7 + "s";

    container.appendChild(spark);
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 3500);
}

/* FINALIZAR */

function finishExperience() {
  if (state.finishing) return;

  state.finishing = true;

  /* Misma cortina y mismo bloque de marca que la pantalla de inicio */

  const curtain = document.createElement("div");

  curtain.className = "closing-curtain";

  curtain.innerHTML = `
    <div class="curtain-panel curtain-left"></div>
    <div class="curtain-panel curtain-right"></div>

    <div class="curtain-brand">
      <img
        class="curtain-logo"
        src="assets/logo-zaphyrus-2026.png"
        alt=""
      >
      <h1>PROM</h1>
      <h2>ZAPHYRUS</h2>
      <span>2026</span>
    </div>
  `;

  document.body.appendChild(curtain);

  setTimeout(() => {
    curtain.remove();
    resetExperience();
  }, 1800);
}

/* REINICIAR */

function resetExperience() {
  state.confirmedGuest = null;
  state.assignedTable = null;
  state.verifying = false;
  state.spinStarted = false;
  state.finishing = false;

  guestForm.reset();

  guestName.disabled = false;
  guestName.readOnly = false;
  verifyBtn.disabled = true;
  verifyBtn.textContent = "INGRESAR";
  spinBtn.disabled = false;

  reels.classList.remove("is-spinning");
  machine.classList.remove("is-winning");
  machineScreen.classList.remove("is-fading");

  reels.querySelectorAll(".reel-symbol").forEach((symbol, index) => {
    symbol.textContent = ["7", "★", "7"][index];
  });

  stageInstruction.classList.remove("is-searching");

  stageInstruction.textContent =
    "Pulsa START para girar la máquina.";

  setFormMessage(
    "Después pulsa INGRESAR."
  );

  leftTables.innerHTML = "";
  rightTables.innerHTML = "";

  showScreen(welcomeScreen);

  curtainLayer.classList.remove(
    "is-opening",
    "is-gone"
  );

  warmUpScript();
}

/* EVENTOS */

openCurtainBtn.addEventListener(
  "click",
  openCurtain
);

spinBtn.addEventListener(
  "click",
  spinMachine
);

finishBtn.addEventListener(
  "click",
  finishExperience
);

guestName.addEventListener("input", () => {
  verifyBtn.disabled =
    guestName.value.trim().length === 0;

  setFormMessage(
    guestName.value.trim()
      ? "Cuando termines de escribir tu nombre, pulsa INGRESAR."
      : "Después pulsa INGRESAR."
  );
});

guestForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!verifyBtn.disabled) {
    verifyGuest();
  }
});

/* Al abrir la página, se despierta el script en segundo plano */

warmUpScript();