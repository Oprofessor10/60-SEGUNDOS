// =======================
// ESTADO DO JOGO
// =======================
let tabuada = 1;
let numeroAtual = 1;

let fase = "facil";
let meta = 20;

let etapa = "normal"; // "normal" ou "aleatorio"

let tempo = 60;
let intervalo = null;

let acertos = 0;
let erros = 0;

let jogoAtivo = false;
let cronometroAtivo = false;

let aguardandoDecisao = false;
let tabuadaAtual = 1;
let faseAtual = "facil";

// =======================
// ELEMENTOS (com segurança)
// =======================
const faseSelect = document.getElementById("faseSelect");
const tabuadaSelect = document.getElementById("tabuadaSelect");

const cartaEsquerda = document.getElementById("cartaEsquerda");
const cartaDireita  = document.getElementById("cartaDireita");
const numEsquerda   = document.getElementById("numEsquerda");
const numDireita    = document.getElementById("numDireita");

const respostaInput = document.getElementById("respostaInput");
const tempoSpan = document.getElementById("tempo");
const acertosSpan = document.getElementById("acertos");
const errosSpan = document.getElementById("erros");
const fimJogoDiv = document.getElementById("fimJogo");

// Pilha direita + label fixa "Tabuada do X"
const pilhaDireita = document.getElementById("pilhaDireita");
const contadorCartas = document.getElementById("contadorCartas");
const pilhaZerouMsg = document.getElementById("pilhaZerouMsg");
const labelTabuada = document.getElementById("labelTabuada");

// Modal + FX
const modal = document.getElementById("modal");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const btnSim = document.getElementById("btnSim");
const btnNao = document.getElementById("btnNao");

const fxCanvas = document.getElementById("fxCanvas");
const fxCtx = fxCanvas ? fxCanvas.getContext("2d") : null;

// =======================
// CARTAS
// =======================
function virarParaFrente(carta) {
  if (!carta) return;
  carta.classList.remove("back");
  carta.classList.add("front");
}
function virarParaVersoComNumero(carta, numeroDiv, valor) {
  if (!carta || !numeroDiv) return;
  carta.classList.remove("front");
  carta.classList.add("back");
  numeroDiv.textContent = String(valor);
}

// =======================
// LABEL FIXA (TABUADA DO X)
// =======================
function atualizarLabelTabuada() {
  if (!labelTabuada) return;

  const v = tabuadaSelect ? tabuadaSelect.value : "";
  if (v === "") {
    labelTabuada.textContent = "";
    return;
  }
  labelTabuada.textContent = `Tabuada do ${tabuada}`;
}

// =======================
// PILHA DIREITA (MONTE)
// =======================
function setPilhaDireita(remaining) {
  const rest = Math.max(0, Number(remaining || 0));

  if (contadorCartas) contadorCartas.textContent = String(rest);

  if (pilhaDireita) pilhaDireita.style.setProperty("--stack", String(rest));

  if (rest <= 0) {
    if (cartaDireita) cartaDireita.classList.add("hidden");
    if (pilhaZerouMsg) pilhaZerouMsg.classList.remove("hidden");
  } else {
    if (cartaDireita) cartaDireita.classList.remove("hidden");
    if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  }
}

function atualizarPilhaPorMeta() {
  const remaining = meta - acertos;
  setPilhaDireita(remaining);
}

// =======================
// META / FASE
// =======================
function setMetaByFase(f) {
  if (f === "facil") return 20;
  if (f === "media") return 40;
  return 60;
}

function syncFaseEMeta() {
  faseAtual = faseSelect ? faseSelect.value : "facil";
  fase = faseAtual;
  meta = setMetaByFase(fase);
}

if (faseSelect) {
  faseSelect.addEventListener("change", () => {
    syncFaseEMeta();
    if (!jogoAtivo) {
      acertos = 0;
      atualizarPainel();
      setPilhaDireita(meta);
    }
  });
}

// =======================
// UTIL
// =======================
function atualizarPainel() {
  if (tempoSpan) tempoSpan.textContent = String(tempo);
  if (acertosSpan) acertosSpan.textContent = String(acertos);
  if (errosSpan) errosSpan.textContent = String(erros);

  atualizarPilhaPorMeta();
}

function resetTudoParaInicio() {
  clearInterval(intervalo);
  intervalo = null;

  jogoAtivo = false;
  cronometroAtivo = false;
  aguardandoDecisao = false;

  tempo = 60;
  acertos = 0;
  erros = 0;
  etapa = "normal";
  numeroAtual = 1;

  if (fimJogoDiv) fimJogoDiv.innerHTML = "";

  virarParaFrente(cartaEsquerda);
  virarParaFrente(cartaDireita);
  if (numEsquerda) numEsquerda.textContent = "";
  if (numDireita) numDireita.textContent = "";

  syncFaseEMeta();
  atualizarPainel();
  setPilhaDireita(meta);

  if (labelTabuada) labelTabuada.textContent = "";

  if (respostaInput) {
    respostaInput.value = "";
    respostaInput.blur();
  }
}

// =======================
// CRONÔMETRO
// =======================
function iniciarCronometro() {
  if (cronometroAtivo) return;
  cronometroAtivo = true;

  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tempo--;
    if (tempo < 0) tempo = 0;
    if (tempoSpan) tempoSpan.textContent = String(tempo);

    if (tempo <= 0) finalizarJogoTempo();
  }, 1000);
}

function finalizarJogoTempo() {
  clearInterval(intervalo);
  jogoAtivo = false;
  cronometroAtivo = false;

  if (fimJogoDiv) {
    fimJogoDiv.innerHTML = `⏰ TEMPO ESGOTADO <br> Pressione ENTER para reiniciar.`;
  }

  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  if (cartaDireita) cartaDireita.classList.remove("hidden");

  virarParaFrente(cartaDireita);
  if (numDireita) numDireita.textContent = "";
}

// =======================
// MODAL / FALLBACK
// =======================
let onSim = null;
let onNao = null;

function abrirModal(titulo, textoHtml, simCb, naoCb) {
  aguardandoDecisao = true;
  onSim = simCb;
  onNao = naoCb;

  if (modal && modalTitulo && modalTexto) {
    modalTitulo.textContent = titulo;
    modalTexto.innerHTML = textoHtml;
    modal.classList.remove("hidden");
    if (btnSim) btnSim.focus();
    return;
  }

  if (fimJogoDiv) {
    fimJogoDiv.innerHTML = `${titulo}<br>${textoHtml}<br><br>ENTER = SIM | ESC = NÃO`;
  }
}

function fecharModal() {
  if (modal) modal.classList.add("hidden");
  if (fimJogoDiv) fimJogoDiv.innerHTML = "";

  aguardandoDecisao = false;
  onSim = null;
  onNao = null;
}

function confirmarSim() {
  if (!aguardandoDecisao || !onSim) return;
  const cb = onSim;
  fecharModal();
  cb();
}

function confirmarNao() {
  if (!aguardandoDecisao || !onNao) return;
  const cb = onNao;
  fecharModal();
  cb();
}

if (btnSim) btnSim.addEventListener("click", (e) => {
  e.preventDefault();
  confirmarSim();
});
if (btnNao) btnNao.addEventListener("click", (e) => {
  e.preventDefault();
  confirmarNao();
});

// =======================
// SOM
// =======================
function beep(freq=880, dur=0.12, vol=0.12) {
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
    o.onended = () => ctx.close();
  }catch(e){}
}
function fanfarraCurta(){
  beep(740, 0.09); setTimeout(()=>beep(880,0.09), 90);
  setTimeout(()=>beep(988,0.10), 180);
}
function fanfarraGrande(){
  beep(523,0.10); setTimeout(()=>beep(659,0.10), 110);
  setTimeout(()=>beep(784,0.10), 220);
  setTimeout(()=>beep(988,0.12), 340);
  setTimeout(()=>beep(1175,0.14), 480);
}

// =======================
// FX (Fogos tipo virada de ano)
// =======================
let particles = [];
let rockets = [];

function resizeFx(){
  if (!fxCanvas || !fxCtx) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
  fxCanvas.style.width = window.innerWidth + "px";
  fxCanvas.style.height = window.innerHeight + "px";
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeFx);
resizeFx();

function rand(min, max){ return Math.random() * (max - min) + min; }

function spawnRocket() {
  if (!fxCanvas) return;

  const x = rand(window.innerWidth * 0.15, window.innerWidth * 0.85);
  const y = window.innerHeight + 10;

  rockets.push({
    x, y,
    vx: rand(-1.2, 1.2),
    vy: rand(-13, -10),
    life: rand(45, 70),
    hue: Math.floor(rand(0, 360))
  });
}

function explode(x, y, hue, count = 160, power = 7.5) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(power * 0.35, power);
    particles.push({
      x, y,
      px: x, py: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(55, 95),
      size: rand(1.6, 3.2),
      hue: (hue + rand(-18, 18) + 360) % 360
    });
  }
}

function animateFx(){
  if (!fxCtx || !fxCanvas) return;

  fxCtx.globalCompositeOperation = "source-over";
  fxCtx.fillStyle = "rgba(0,0,0,0.18)";
  fxCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  fxCtx.globalCompositeOperation = "lighter";

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life -= 1;

    const px = r.x, py = r.y;
    r.vy += 0.16;
    r.x += r.vx;
    r.y += r.vy;

    fxCtx.lineWidth = 2.2;
    fxCtx.strokeStyle = `hsla(${r.hue} 95% 70% / 0.95)`;
    fxCtx.beginPath();
    fxCtx.moveTo(px, py);
    fxCtx.lineTo(r.x, r.y);
    fxCtx.stroke();

    if (r.life <= 0 || r.vy > -2.5) {
      explode(r.x, r.y, r.hue, 170, 8.2);
      rockets.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 1;

    p.px = p.x;
    p.py = p.y;

    p.vy += 0.08;
    p.vx *= 0.992;
    p.vy *= 0.992;

    p.x += p.vx;
    p.y += p.vy;

    const a = Math.max(0, p.life / 95);

    fxCtx.lineWidth = 2.0;
    fxCtx.strokeStyle = `hsla(${p.hue} 100% 70% / ${0.55 * a})`;
    fxCtx.beginPath();
    fxCtx.moveTo(p.px, p.py);
    fxCtx.lineTo(p.x, p.y);
    fxCtx.stroke();

    fxCtx.fillStyle = `hsla(${p.hue} 100% 75% / ${0.95 * a})`;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fxCtx.fill();

    if (p.life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(animateFx);
}
animateFx();

function fogosMedios(){
  fanfarraCurta();
  for (let i = 0; i < 6; i++) {
    setTimeout(spawnRocket, i * 140);
  }
}

function fogosGrandes(){
  fanfarraGrande();
  for (let i = 0; i < 16; i++) {
    setTimeout(spawnRocket, i * 95);
  }
}

// =======================
// TABUADA SELECT: mostra tabuada × 1 (sem tempo)
// =======================
if (tabuadaSelect) {
  tabuadaSelect.addEventListener("change", () => {
    const v = tabuadaSelect.value;

    if (v === "") {
      tabuada = 1;
      numeroAtual = 1;
      virarParaFrente(cartaEsquerda);
      virarParaFrente(cartaDireita);
      if (numEsquerda) numEsquerda.textContent = "";
      if (numDireita) numDireita.textContent = "";
      if (labelTabuada) labelTabuada.textContent = "";
      return;
    }

    tabuada = Number(v);
    numeroAtual = 1;

    atualizarLabelTabuada();

    virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
    virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

    if (respostaInput) respostaInput.focus();
  });
}

// =======================
// INICIAR (global por causa do onclick)
// =======================
window.iniciarJogo = function iniciarJogo(preservarDigitado = false) {
  syncFaseEMeta();

  tabuadaAtual = Number((tabuadaSelect && tabuadaSelect.value) || 1);
  tabuada = tabuadaAtual;

  atualizarLabelTabuada();

  etapa = "normal";
  numeroAtual = 1;

  tempo = 60;
  acertos = 0;
  erros = 0;

  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  if (fimJogoDiv) fimJogoDiv.innerHTML = "";
  atualizarPainel();

  setPilhaDireita(meta);

  virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    if (!preservarDigitado) respostaInput.value = "";
    respostaInput.focus();
  }
};

// =======================
// PRÓXIMO NÚMERO
// =======================
function proximoNumero() {
  if (etapa === "normal") {
    numeroAtual = (numeroAtual < 10) ? (numeroAtual + 1) : 1;
  } else {
    numeroAtual = Math.floor(Math.random() * 10) + 1;
  }
}

// =======================
// TRANSIÇÕES DE META
// =======================
function iniciarDesafioAleatorio() {
  etapa = "aleatorio";

  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");
  if (cartaDireita) cartaDireita.classList.remove("hidden");

  meta = setMetaByFase(faseAtual);

  tempo = 60;
  acertos = 0;
  erros = 0;
  atualizarPainel();
  setPilhaDireita(meta);

  numeroAtual = Math.floor(Math.random() * 10) + 1;
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  if (respostaInput) {
    respostaInput.value = "";
    respostaInput.focus();
  }
}

function avancarParaProximaTabuadaOuFase() {
  tabuadaAtual++;

  if (tabuadaAtual > 10) {
    if (faseAtual === "facil") faseAtual = "media";
    else if (faseAtual === "media") faseAtual = "dificil";
    else {
      abrirModal(
        "🏆 Parabéns!",
        `Você completou até a tabuada 10 no <b>Difícil</b>!`,
        () => { resetTudoParaInicio(); },
        () => { resetTudoParaInicio(); }
      );
      return;
    }

    if (faseSelect) faseSelect.value = faseAtual;
    meta = setMetaByFase(faseAtual);

    tabuadaAtual = 1;
    abrirModal(
      "⬆️ Você subiu de nível!",
      `Agora você está no nível <b>${faseAtual.toUpperCase()}</b>.<br>Quer começar?`,
      () => {
        if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);
        window.iniciarJogo(false);
      },
      () => { resetTudoParaInicio(); }
    );
    return;
  }

  if (tabuadaSelect) tabuadaSelect.value = String(tabuadaAtual);

  tabuada = tabuadaAtual;
  fase = faseAtual;
  meta = setMetaByFase(faseAtual);

  atualizarLabelTabuada();

  etapa = "normal";
  numeroAtual = 1;

  tempo = 60;
  acertos = 0;
  erros = 0;
  atualizarPainel();
  setPilhaDireita(meta);

  virarParaVersoComNumero(cartaEsquerda, numEsquerda, tabuada);
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);

  jogoAtivo = true;
  cronometroAtivo = false;
  clearInterval(intervalo);

  if (respostaInput) {
    respostaInput.value = "";
    respostaInput.focus();
  }
}

function bateuMetaNormal() {
  setPilhaDireita(0);
  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");

  fogosMedios();
  clearInterval(intervalo);
  cronometroAtivo = false;

  abrirModal(
    "🎉 Você conseguiu!",
    `Está pronto para o <b>próximo desafio</b>?`,
    () => { iniciarDesafioAleatorio(); },
    () => { resetTudoParaInicio(); }
  );
}

function bateuMetaAleatorio() {
  setPilhaDireita(0);
  if (pilhaZerouMsg) pilhaZerouMsg.classList.add("hidden");

  fogosGrandes();
  clearInterval(intervalo);
  cronometroAtivo = false;

  abrirModal(
    "🚀 Você subiu de nível!",
    "Vamos começar a próxima etapa?",
    () => { avancarParaProximaTabuadaOuFase(); },
    () => { resetTudoParaInicio(); }
  );
}

// =======================
// VERIFICAR
// =======================
function verificar() {
  if (!jogoAtivo) return;
  if (aguardandoDecisao) return;
  if (!respostaInput) return;

  const valor = respostaInput.value;
  if (valor === "") return;

  if (!cronometroAtivo) iniciarCronometro();

  const resposta = Number(valor);
  const correta = tabuada * numeroAtual;

  if (resposta === correta) acertos++;
  else erros++;

  respostaInput.value = "";
  atualizarPainel();

  if (acertos >= meta) {
    if (etapa === "normal") bateuMetaNormal();
    else bateuMetaAleatorio();
    return;
  }

  proximoNumero();
  virarParaVersoComNumero(cartaDireita, numDireita, numeroAtual);
  respostaInput.focus();
}

// =======================
// TECLADO (ENTER/ESC) - ÚNICO LISTENER
// =======================
document.addEventListener("keydown", (e) => {
  // Modal aberto: ENTER=SIM | ESC=NÃO
  if (aguardandoDecisao) {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmarSim();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      confirmarNao();
      return;
    }
    return;
  }

  // Enter: iniciar (se precisar) e enviar resposta
  if (e.key === "Enter") {
    e.preventDefault();

    if (!respostaInput) return;

    // garante foco no input
    if (document.activeElement !== respostaInput) {
      respostaInput.focus();
    }

    const digitado = respostaInput.value;

    // ✅ se o jogo ainda não começou, inicia e preserva o que foi digitado
    if (!jogoAtivo) {
      window.iniciarJogo(true);
      respostaInput.value = digitado;
    }

    // envia resposta (se tiver)
    verificar();
  }
});
// =======================
// PWA REGISTRO
// =======================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("PWA ativado"))
      .catch(err => console.log("Erro PWA:", err));
  });
}

// =======================
// TECLADO VIRTUAL (MOBILE)
// =======================
const keypad = document.getElementById("keypad");

function isMobileCoarse() {
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function showKeypad() {
  if (!keypad) return;
  keypad.classList.remove("hidden");
  keypad.setAttribute("aria-hidden", "false");
}

function hideKeypad() {
  if (!keypad) return;
  keypad.classList.add("hidden");
  keypad.setAttribute("aria-hidden", "true");
}

function ensureMobileInputMode() {
  if (!respostaInput) return;

  if (isMobileCoarse()) {
    // trava teclado do celular
    respostaInput.setAttribute("readonly", "readonly");
    // e garante que o teclado virtual aparece
    showKeypad();

    // se o usuário tentar focar, a gente impede o teclado nativo
    respostaInput.addEventListener("focus", () => {
      respostaInput.blur();
      showKeypad();
    });
  } else {
    // desktop normal
    respostaInput.removeAttribute("readonly");
    hideKeypad();
  }
}

function keypadAppend(d) {
  if (!respostaInput) return;
  const s = (respostaInput.value || "").toString();

  // evita números gigantes (ajuste se quiser)
  if (s.length >= 4) return;

  // evita "000..."
  if (s === "0") respostaInput.value = String(d);
  else respostaInput.value = s + String(d);
}

function keypadBackspace() {
  if (!respostaInput) return;
  const s = (respostaInput.value || "").toString();
  respostaInput.value = s.slice(0, -1);
}

function keypadClear() {
  if (!respostaInput) return;
  respostaInput.value = "";
}

// OK do teclado virtual:
// - se modal aberto -> SIM
// - senão -> verifica resposta
function keypadOk() {
  if (aguardandoDecisao) {
    confirmarSim();
    return;
  }
  verificar();
}

// Clique nos botões
if (keypad) {
  keypad.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const k = btn.getAttribute("data-k");
    if (!k) return;

    // mantém o foco "lógico" no jogo
    if (respostaInput) respostaInput.blur();

    if (k === "back") return keypadBackspace();
    if (k === "clear") return keypadClear();
    if (k === "ok") return keypadOk();
    keypadAppend(k);
  });
}

// liga/desliga quando gira a tela
window.addEventListener("resize", ensureMobileInputMode);
ensureMobileInputMode();

// ====== FORÇAR TECLADO VIRTUAL NO CELULAR ======
const keypad = document.getElementById("keypad");

function isMobileLike() {
  const byPointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const byTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  const byWidth = window.innerWidth <= 900;
  return byPointer || byTouch || byWidth;
}

function showKeypad() {
  if (!keypad) return;
  keypad.classList.remove("hidden");
  keypad.style.display = "block";
}

function hideKeypad() {
  if (!keypad) return;
  keypad.classList.add("hidden");
  keypad.style.display = "";
}

function applyMobileKeyboardMode() {
  if (!respostaInput) return;

  if (isMobileLike()) {
    respostaInput.setAttribute("readonly", "readonly");
    showKeypad();
    respostaInput.addEventListener("focus", () => respostaInput.blur());
  } else {
    respostaInput.removeAttribute("readonly");
    hideKeypad();
  }
}

window.addEventListener("resize", applyMobileKeyboardMode);
applyMobileKeyboardMode();





