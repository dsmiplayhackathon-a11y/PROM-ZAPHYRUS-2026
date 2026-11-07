"use strict";

/* CONFIGURACIÓN */

/*
 * starHoldDuration: tiempo que quedan quietas las 3 estrellas.
 * fadeDuration debe coincidir con la transición de opacidad
 * de #machineScreen en styles.css (0.5s).
 */

const CONFIG = {
  curtainOpenDuration: 2000,
  reelSpinDuration: 2000,
  starHoldDuration: 1000,
  fadeDuration: 500,
  totalTables: 14,
  tablesPerSide: 7
};

/* INVITADO TEMPORAL */

const TEST_GUESTS = [
  {
    firstName: "Pepito",
    secondName: "",
    firstSurname: "Perez",
    secondSurname: "",
    table: 7,
    status: "ACTIVO"
  }
];

/* ESTADO */

const state = {
  confirmedGuest: null,
  assignedTable: null,
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

/* NORMALIZAR NOMBRES */

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getFullName(guest) {
  return [
    guest.firstName,
    guest.secondName,
    guest.firstSurname,
    guest.secondSurname
  ].filter(Boolean).join(" ");
}

/* ABRIR CORTINAS */

function openCurtain() {
  curtainLayer.classList.add("is-opening");

  setTimeout(() => {
    curtainLayer.classList.add("is-gone");
    showScreen(loginScreen);
    guestName.focus();
  }, CONFIG.curtainOpenDuration);
}

/* VALIDAR INVITADO */

function validateGuest(name) {
  const normalizedInput = normalizeName(name);

  if (!normalizedInput || normalizedInput.split(" ").length < 2) {
    return {
      ok: false,
      message: "Escribe tu nombre completo."
    };
  }

  const matches = TEST_GUESTS.filter(guest => {
    return normalizeName(getFullName(guest)) === normalizedInput &&
      guest.status === "ACTIVO";
  });

  if (matches.length === 0) {
    return {
      ok: false,
      message: "No encontramos ese invitado. Revisa el nombre."
    };
  }

  if (matches.length > 1) {
    return {
      ok: false,
      message: "Hay coincidencias ambiguas. Solicita ayuda."
    };
  }

  return {
    ok: true,
    guest: matches[0]
  };
}

/* MENSAJES */

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

/* VERIFICAR INVITADO (botón INGRESAR) */

function verifyGuest() {
  if (state.confirmedGuest) return;

  const validation = validateGuest(guestName.value);

  if (!validation.ok) {
    setFormMessage(validation.message, "error");
    guestName.focus();
    return;
  }

  state.confirmedGuest = validation.guest;

  guestName.disabled = true;
  verifyBtn.disabled = true;

  stageInstruction.textContent =
    "Identidad confirmada. Pulsa START para girar la máquina.";

  showScreen(machineScreen);
}

/* GIRAR LA MÁQUINA (botón START) */

function spinMachine() {
  if (!state.confirmedGuest || state.spinStarted) return;

  state.spinStarted = true;
  spinBtn.disabled = true;

  reels.classList.add("is-spinning");

  stageInstruction.textContent =
    "¡Los rodillos están girando!";

  /* Debe ir antes del temporizador principal: ambos terminan a la vez */
  animateReels();

  setTimeout(() => {
    reels.classList.remove("is-spinning");

    /* Con las 3 estrellas a la vista, la máquina brilla y parpadea */
    machine.classList.add("is-winning");

    state.assignedTable =
      Number(state.confirmedGuest.table);

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
 */

function buildFloorplan(selectedTable) {
  leftTables.innerHTML = "";
  rightTables.innerHTML = "";

  for (let number = 1; number <= CONFIG.totalTables; number++) {
    const table = document.createElement("div");

    table.className = "table-node";

    if (number === selectedTable) {
      table.textContent = String(number).padStart(2, "0");
      table.classList.add("is-selected");
      table.setAttribute("aria-current", "true");
    }

    if (number <= CONFIG.tablesPerSide) {
      leftTables.appendChild(table);
    } else {
      rightTables.appendChild(table);
    }
  }
}

/* REVELAR RESULTADO */

function revealResult() {
  $("resultGuest").textContent =
    getFullName(state.confirmedGuest).toUpperCase();

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
  state.spinStarted = false;
  state.finishing = false;

  guestForm.reset();

  guestName.disabled = false;
  verifyBtn.disabled = true;
  spinBtn.disabled = false;

  reels.classList.remove("is-spinning");
  machine.classList.remove("is-winning");
  machineScreen.classList.remove("is-fading");

  reels.querySelectorAll(".reel-symbol").forEach((symbol, index) => {
    symbol.textContent = ["7", "★", "7"][index];
  });

  stageInstruction.textContent =
    "Pulsa START para girar la máquina.";

  setFormMessage(
    "Escribe tu nombre. Después pulsa INGRESAR."
  );

  leftTables.innerHTML = "";
  rightTables.innerHTML = "";

  showScreen(welcomeScreen);

  curtainLayer.classList.remove(
    "is-opening",
    "is-gone"
  );
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
      : "Escribe tu nombre. Después pulsa INGRESAR."
  );
});

guestForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!verifyBtn.disabled) {
    verifyGuest();
  }
});