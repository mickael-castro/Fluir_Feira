// =====================================================================================
// TIPOGRAFIA INTERATIVA COM P5.JS E WEB MIDI API
// -------------------------------------------------------------------------------------
// Este sketch demonstra como criar tipografia interativa na web,
// manipulando propriedades de fontes variáveis através de controladores MIDI.
// Múltiplas imagens de fundo SVG, conjuntos de texto e cores são controlados
// via MIDI, com transições de fade.
// =====================================================================================

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES GERAIS DA ANIMAÇÃO E TEXTO
// -------------------------------------------------------------------------------------
// Define o conjunto de texto inicial. Será atualizado via MIDI e no setup.
let textosDasLinhas = [
  // Fallback caso a configuração inicial falhe.
  "Texto",
  "Padrão",
];

let tamanhoFonteDesejado = 90;
let tamanhoFonteAplicado;
let fatorEntrelinha = 1.2;
let anguloOnda = 0;
let velocidadeOnda = 0.03;

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE CONJUNTOS DE TEXTO E SELEÇÃO VIA MIDI
// -------------------------------------------------------------------------------------
/**
 * Array de objetos, cada um representando um conjunto de texto e a nota MIDI para ativá-lo.
 * Para adicionar mais conjuntos de texto:
 * 1. Adicione um novo objeto a este array, certificando-se de que cada objeto
 * esteja separado por uma vírgula.
 * 2. Especifique a 'note' (número da nota MIDI do seu pad).
 * 3. Especifique 'lines' (um array de strings, onde cada string é uma linha de texto).
 *
 * Exemplo para um terceiro conjunto de texto ativado pela nota MIDI 44:
 * {
 * note: 44, // Nota MIDI do pad para este conjunto de texto
 * lines: [
 * "Outro Texto",
 * "Linha Dois",
 * "Linha Três"
 * ]
 * }, // Não se esqueça da vírgula se houver mais objetos depois!
 */
const textSets = [
  {
    note: 32, // Pad para o texto original
    lines: ["Feira das", "Profissões", "Universidade", "Federal do Ceará"],
  },
  {
    note: 33,
    lines: ["Projeto", "Paisagens", "Tipográficas", "Interativas"],
  },
  {
    // Novo conjunto de texto adicionado pelo usuário
    note: 34,
    lines: ["A tipografia", "está em", "todos os", "lugares"],
  },
];

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE FONTES VARIÁVEIS E SELEÇÃO VIA MIDI
// -------------------------------------------------------------------------------------
let fontConfigurations = [
  {
    name: "Chivo - Animar Peso",
    fontFamily: "'Chivo', sans-serif",
    animatedAxes: [{ tag: "wght", min: 100, max: 900, useGlobalAxisRanges: true }],
    fixedAxes: [{ tag: "wdth", value: 100 }],
  },
  {
    name: "Fit - Animar Largura",
    fontFamily: "'Fit', sans-serif",
    animatedAxes: [{ tag: "wdth", min: 50, max: 200, useGlobalAxisRanges: true }],
    fixedAxes: [{ tag: "wght", value: 400 }],
  },
];
let currentFontIndex = 0;
let currentFontConfig;
const padNotesForFonts = [16, 17, 18, 19, 20, 21, 22, 23];

let minAxisControlado = 0.0;
let maxAxisControlado = 1.0;

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DOS FUNDOS SVG E SELEÇÃO VIA MIDI
// -------------------------------------------------------------------------------------
const padNotesForBackgrounds = [36, 37, 38, 39];
const backgroundContainerIds = [
  "background-svg-container-1",
  "background-svg-container-2",
  "background-svg-container-3",
  "background-svg-container-4",
];
let currentBackgroundIndex = 0;

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE CORES
// -------------------------------------------------------------------------------------
let bgColor = [25, 29, 59];
let textColor = [230, 226, 190];

// Cores alvo para notas MIDI específicas
const targetBgColorNote36 = [102, 102, 153];
const targetTextColorNote36 = [255, 255, 255];

const targetBgColorNote37 = [0, 51, 51];
const targetTextColorNote37 = [255, 255, 255];

const targetBgColorNote38 = [204, 153, 51];
const targetTextColorNote38 = [255, 255, 255];

const targetBgColorNote39 = [255, 102, 51];
const targetTextColorNote39 = [255, 255, 255];

const targetBgColorNote40 = [153, 204, 51];
const targetTextColorNote40 = [255, 255, 255];

const targetBgColorNote41 = [102, 102, 102];
const targetTextColorNote41 = [255, 255, 255];

const targetBgColorNote42 = [51, 51, 51];
const targetTextColorNote42 = [204, 204, 204];

// -------------------------------------------------------------------------------------
// # VARIÁVEIS DE ESTADO E CONTROLE MIDI
// -------------------------------------------------------------------------------------
let midiStatusText = "Aguardando acesso MIDI...";
let lastCcValue = 0;
let lastCcNumber = 0;
let midiInputDevice = null;
let showMidiStatusBox = true;
let statusBoxPadding = 10;
let statusBoxTextSize = 12;
let statusBoxFont = "Arial, sans-serif";
let midiStatusBoxElement;

const TAM_FONTE_DESEJADO_MIN_MIDI = 10;
const TAM_FONTE_DESEJADO_MAX_MIDI = 350;
const FATOR_ENTRELINHA_MIN_MIDI = 0.7;
const FATOR_ENTRELINHA_MAX_MIDI = 3.0;
const VELOCIDADE_ONDA_MIN_MIDI = 0.001;
const VELOCIDADE_ONDA_MAX_MIDI = 0.15;
const notaDoPadParaStatusBox = 43;

// -------------------------------------------------------------------------------------
// # VARIÁVEIS DE ELEMENTOS DOM E ESTADO DO SKETCH
// -------------------------------------------------------------------------------------
let spansDasLinhas = [];
let textContainer;
let textContainerDOMElement; // Para acesso direto ao DOM element para opacity
let setupCompleto = false;
let isTextChanging = false; // Flag para controlar transição de texto

const textFadeDuration = 300; // milissegundos
const svgFadeDuration = 400; // milissegundos

// --- Variáveis para transição automática ---
let transitionInterval = 5000; // Intervalo de transição em milissegundos (5 segundos)
let transitionTimer;

// =====================================================================================
// # FUNÇÃO PRELOAD - Carregamento de Assets p5.js
// =====================================================================================
function preload() {
  // Nenhum asset p5.js sendo carregado aqui.
}

// =====================================================================================
// # FUNÇÃO SETUP - Inicialização do Sketch p5.js
// =====================================================================================
function setup() {
  noCanvas();
  console.log("Setup: Tipografia Interativa com MIDI.");

  // --- 1. CONFIGURAÇÃO INICIAL DO TEXTO (Pad Nota 32) ---
  const initialTextSet = textSets.find((set) => set.note === 32);
  if (initialTextSet && initialTextSet.lines) {
    textosDasLinhas = [...initialTextSet.lines];
    console.log("Texto inicial (Nota 32) carregado:", textosDasLinhas.join(" / "));
  } else {
    console.warn("Conjunto de texto para nota 32 não encontrado. Usando texto padrão global.");
  }

  // --- 2. CONFIGURAÇÃO INICIAL DA FONTE (Pad Nota 16) ---
  const initialFontNoteIndex = padNotesForFonts.indexOf(16);
  if (initialFontNoteIndex !== -1 && initialFontNoteIndex < fontConfigurations.length) {
    currentFontIndex = initialFontNoteIndex;
    currentFontConfig = fontConfigurations[currentFontIndex];
    console.log("Fonte inicial (Nota 16) configurada:", currentFontConfig.name);
  } else {
    currentFontIndex = 0; // Fallback para a primeira fonte
    currentFontConfig = fontConfigurations[currentFontIndex];
    console.warn(
      "Nota 16 para fonte inicial não encontrada ou inválida. Usando a primeira fonte da lista:",
      currentFontConfig.name
    );
  }

  // --- 3. CONFIGURAÇÃO INICIAL DE CORES E FUNDO SVG (Pad Nota 36) ---
  bgColor = [...targetBgColorNote36];
  textColor = [...targetTextColorNote36];
  console.log(
    `Cores iniciais (Nota 36): BG -> rgb(${bgColor.join(",")}), Texto -> rgb(${textColor.join(",")})`
  );

  textContainer = createDiv("");
  textContainer.id("text-container");
  textContainerDOMElement = textContainer.elt; // Pega o elemento DOM real
  // As transições agora serão controladas pelas classes 'text-popup-hidden' e 'text-popup-visible'
  textContainerDOMElement.classList.add('text-popup-hidden'); // Começa escondido/pequeno

  // Inicializa as opacidades dos SVGs via CSS
  for (let i = 0; i < backgroundContainerIds.length; i++) {
    const container = document.getElementById(backgroundContainerIds[i]);
    if (container) {
      container.classList.add('svg-background-container'); // Adiciona classe para transição CSS
      container.style.opacity = 0; // Garante que todos começam ocultos
      // Adiciona a transição CSS para cada container SVG
      container.style.transition = `opacity ${svgFadeDuration / 1000}s ease-in-out`;
    }
  }

  const initialBackgroundNoteIndex = padNotesForBackgrounds.indexOf(36);
  if (initialBackgroundNoteIndex !== -1) {
    currentBackgroundIndex = initialBackgroundNoteIndex;
    showSpecificSvgBackground(currentBackgroundIndex); // Isso agora vai acionar a transição via CSS
  } else {
    console.warn(
      "Nota 36 para fundo SVG inicial não encontrada em padNotesForBackgrounds. Nenhum SVG será ativado inicialmente por esta lógica."
    );
    hideAllSvgBackgrounds(); // Isso também vai acionar a transição via CSS
  }

  ajustarTamanhoEElementos();

  if (showMidiStatusBox) {
    midiStatusBoxElement = createDiv("");
    midiStatusBoxElement.id("midi-status-box");
    midiStatusBoxElement.style("position", "fixed");
    midiStatusBoxElement.style("bottom", statusBoxPadding + "px");
    midiStatusBoxElement.style("right", statusBoxPadding + "px");
    midiStatusBoxElement.style("background-color", "rgba(0,0,0,0.7)");
    midiStatusBoxElement.style("color", "white");
    midiStatusBoxElement.style("padding", statusBoxPadding + "px");
    midiStatusBoxElement.style("font-family", statusBoxFont);
    midiStatusBoxElement.style("font-size", statusBoxTextSize + "px");
    midiStatusBoxElement.style("border-radius", "5px");
    midiStatusBoxElement.style("line-height", "1.4");
    midiStatusBoxElement.style("z-index", "1000");
    midiStatusBoxElement.html("Aguardando MIDI...");
    midiStatusBoxElement.style("display", showMidiStatusBox ? "block" : "none");
  }

  // --- Descomente para ativar a Web MIDI API ---
  /*
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
  } else {
    midiStatusText = "Seu navegador não suporta a Web MIDI API.";
    if (midiStatusBoxElement) midiStatusBoxElement.html(midiStatusText.replace(/\n/g, "<br>"));
    console.warn(midiStatusText);
  }
  */

  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  // Inicia o timer para transições automáticas
  startTransitionTimer();

  console.log("Setup Concluído.");
  setupCompleto = true;

  // Mostra o texto com a transição de popup após o setup inicial
  textContainerDOMElement.classList.remove('text-popup-hidden');
  textContainerDOMElement.classList.add('text-popup-visible');
}

// =====================================================================================
// # FUNÇÕES AUXILIARES PARA CORES E FUNDOS SVG
// =====================================================================================
function applyAndLogColors(noteNum) {
  aplicarCorTextoAtual();
  console.log(
    `Nota ${noteNum}: Cores definidas para BG: rgb(${bgColor.join(",")}), Texto: rgb(${textColor.join(
      ","
    )})`
  );
}

function hideAllSvgBackgrounds() {
  for (let i = 0; i < backgroundContainerIds.length; i++) {
    const container = document.getElementById(backgroundContainerIds[i]);
    if (container) {
      container.style.opacity = 0; // O CSS cuidará da transição
    }
  }
  currentBackgroundIndex = -1;
  console.log("Todos os fundos SVG ocultados (opacidade 0 via CSS).");
}

function showSpecificSvgBackground(indexToShow) {
  if (indexToShow < 0 || indexToShow >= backgroundContainerIds.length) {
    console.warn(`Tentativa de mostrar índice de fundo SVG inválido: ${indexToShow}. Ocultando todos.`);
    hideAllSvgBackgrounds();
    return;
  }
  for (let i = 0; i < backgroundContainerIds.length; i++) {
    const container = document.getElementById(backgroundContainerIds[i]);
    if (container) {
      if (i === indexToShow) {
        container.style.opacity = 1; // O CSS cuidará da transição
      } else {
        container.style.opacity = 0; // O CSS cuidará da transição
      }
    }
  }
  currentBackgroundIndex = indexToShow;
  console.log(`Mostrando fundo SVG: ${backgroundContainerIds[indexToShow]} (opacidade 1 via CSS).`);
}

// =====================================================================================
// # FUNÇÕES DE MANIPULAÇÃO DE TEXTO E ELEMENTOS DOM
// =====================================================================================
function ajustarTamanhoEElementos() {
  tamanhoFonteAplicado = tamanhoFonteDesejado;
  if (tamanhoFonteAplicado < 8) tamanhoFonteAplicado = 8;
  criarElementosDeTexto(tamanhoFonteAplicado);
}

function criarElementosDeTexto(tamanhoFonteAtual) {
  if (!textContainer) return;
  textContainer.html("");
  spansDasLinhas = [];
  let numLinhasAtual = textosDasLinhas.length;
  if (numLinhasAtual === 0) return;

  for (let i = 0; i < numLinhasAtual; i++) {
    let linhaDiv = createDiv("");
    linhaDiv.parent(textContainer);
    linhaDiv.class("text-line");
    linhaDiv.style("line-height", fatorEntrelinha.toString());

    let textoDaLinha = textosDasLinhas[i];
    let spansNestaLinha = [];
    if (textoDaLinha && typeof textoDaLinha === "string") {
      for (let j = 0; j < textoDaLinha.length; j++) {
        let char = textoDaLinha[j];
        let charSpan = createSpan(char === " " ? "&nbsp;" : char);
        charSpan.parent(linhaDiv);
        charSpan.class("char-span");
        charSpan.style("font-size", `${tamanhoFonteAtual}px`);
        charSpan.style("color", `rgb(${textColor.join(",")})`);
        if (currentFontConfig && currentFontConfig.fontFamily) {
          charSpan.style("font-family", currentFontConfig.fontFamily);
        } else {
          charSpan.style("font-family", "'Chivo', sans-serif");
        }
        spansNestaLinha.push(charSpan);
      }
    }
    spansDasLinhas.push(spansNestaLinha);
  }
}

function aplicarCorTextoAtual() {
  if (spansDasLinhas && spansDasLinhas.length > 0) {
    for (let i = 0; i < spansDasLinhas.length; i++) {
      if (spansDasLinhas[i] && spansDasLinhas[i].length > 0) {
        for (let j = 0; j < spansDasLinhas[i].length; j++) {
          let span = spansDasLinhas[i][j];
          if (span && span.elt) {
            span.style("color", `rgb(${textColor.join(",")})`);
          }
        }
      }
    }
  }
}

// =====================================================================================
// # FUNÇÕES DE CALLBACK E PROCESSAMENTO MIDI (Descomentadas se for usar MIDI)
// =====================================================================================
/*
function onMIDISuccess(midiAccess) {
  midiStatusText = "Acesso MIDI concedido!";
  console.log(midiStatusText, midiAccess);
  const inputs = midiAccess.inputs.values();
  let inputFound = false;
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiInputDevice = input.value;
    midiStatusText = `Conectado: ${midiInputDevice.name}`;
    console.log(`Ouvindo o dispositivo MIDI: ${midiInputDevice.name}`);
    midiInputDevice.onmidimessage = onMIDIMessage;
    inputFound = true;
    break;
  }
  if (!inputFound) {
    midiStatusText = "Nenhum dispositivo MIDI de entrada encontrado.";
    console.warn(midiStatusText);
  }
  if (midiStatusBoxElement) midiStatusBoxElement.html(midiStatusText.replace(/\n/g, "<br>"));
  midiAccess.onstatechange = onMIDIStateChange;
}

function onMIDIFailure(e) {
  midiStatusText = "Falha ao acessar MIDI: " + e;
  console.error(midiStatusText);
  if (midiStatusBoxElement) midiStatusBoxElement.html(midiStatusText.replace(/\n/g, "<br>"));
}

function onMIDIStateChange(event) {
  console.log("Estado MIDI mudou:", event.port.name, event.port.type, event.port.state);
  let needsUpdate = false;
  if (event.port.type === "input") {
    if (event.port.state === "connected" && (!midiInputDevice || midiInputDevice.id !== event.port.id)) {
      console.log("Novo dispositivo MIDI conectado ou reconectando...");
      navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure).catch(onMIDIFailure);
      needsUpdate = true;
    } else if (event.port.state === "disconnected") {
      if (midiInputDevice && midiInputDevice.id === event.port.id) {
        midiStatusText = `MIDI Desconectado: ${event.port.name}. Tentando reconectar...`;
        console.warn(midiStatusText);
        midiInputDevice = null;
        navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure).catch(onMIDIFailure);
        needsUpdate = true;
      }
    }
  }
  if (needsUpdate && midiStatusBoxElement) {
    midiStatusBoxElement.html(midiStatusText.replace(/\n/g, "<br>"));
  }
}

function onMIDIMessage(event) {
  const [status, data1, data2] = event.data;
  const command = status & 0xf0;

  if (command === 0x90 && data2 > 0) {
    // Note On
    let noteNumber = data1;
    let actionProcessedForNote = false;

    // Prioridade 0: Troca de conjunto de TEXTO com fade
    const selectedTextSet = textSets.find((set) => set.note === noteNumber);
    if (selectedTextSet) {
      if (isTextChanging) return; // Evita múltiplas transições simultâneas
      isTextChanging = true;
      textContainerDOMElement.classList.remove('text-popup-visible');
      textContainerDOMElement.classList.add('text-popup-hidden'); // Esconde/diminui o texto

      setTimeout(() => {
        textosDasLinhas = [...selectedTextSet.lines];
        ajustarTamanhoEElementos(); // Re-cria os elementos DOM
        textContainerDOMElement.classList.remove('text-popup-hidden');
        textContainerDOMElement.classList.add('text-popup-visible'); // Mostra/aumenta o novo texto
        console.log(`Pad de Texto (Nota ${noteNumber}): Carregado texto - "${textosDasLinhas.join(" / ")}"`);
        isTextChanging = false;
      }, textFadeDuration); // Tempo para o fade out completo antes de trocar o texto
    }

    // Prioridade 1: Notas que definem cores e ESCONDEM fundos SVG (40, 41, 42)
    if (noteNumber === 40) {
      bgColor = [...targetBgColorNote40];
      textColor = [...targetTextColorNote40];
      applyAndLogColors(noteNumber);
      hideAllSvgBackgrounds();
      actionProcessedForNote = true;
    } else if (noteNumber === 41) {
      bgColor = [...targetBgColorNote41];
      textColor = [...targetTextColorNote41];
      applyAndLogColors(noteNumber);
      hideAllSvgBackgrounds();
      actionProcessedForNote = true;
    } else if (noteNumber === 42) {
      bgColor = [...targetBgColorNote42];
      textColor = [...targetTextColorNote42];
      applyAndLogColors(noteNumber);
      hideAllSvgBackgrounds();
      actionProcessedForNote = true;
    }
    if (actionProcessedForNote) return;

    // Prioridade 2: Notas que definem cores e MOSTRAM um fundo SVG específico (36, 37, 38, 39)
    const backgroundShowIndex = padNotesForBackgrounds.indexOf(noteNumber);
    if (backgroundShowIndex !== -1) {
      if (noteNumber === 36) {
        bgColor = [...targetBgColorNote36];
        textColor = [...targetTextColorNote36];
      } else if (noteNumber === 37) {
        bgColor = [...targetBgColorNote37];
        textColor = [...targetTextColorNote37];
      } else if (noteNumber === 38) {
        bgColor = [...targetBgColorNote38];
        textColor = [...targetTextColorNote38];
      } else if (noteNumber === 39) {
        bgColor = [...targetBgColorNote39];
        textColor = [...targetTextColorNote39];
      }

      applyAndLogColors(noteNumber);
      showSpecificSvgBackground(backgroundShowIndex);
      actionProcessedForNote = true;
    }
    if (actionProcessedForNote) return;

    // Prioridade 3: Ações para troca de FONTE
    const fontPadIndex = padNotesForFonts.indexOf(noteNumber);
    if (fontPadIndex !== -1 && fontPadIndex < fontConfigurations.length) {
      if (currentFontIndex !== fontPadIndex) {
        currentFontIndex = fontPadIndex;
        currentFontConfig = fontConfigurations[currentFontIndex];
        console.log(`Pad de fonte ${fontPadIndex + 1} (Nota ${noteNumber}): Trocando para ${currentFontConfig.name}`);
        ajustarTamanhoEElementos(); // Re-cria elementos com a nova fonte
      }
      actionProcessedForNote = true;
    }
    if (actionProcessedForNote) return;

    // Prioridade 4: Ação para toggle da caixa de status MIDI
    if (noteNumber === notaDoPadParaStatusBox) {
      showMidiStatusBox = !showMidiStatusBox;
      if (midiStatusBoxElement) {
        midiStatusBoxElement.style("display", showMidiStatusBox ? "block" : "none");
      }
      console.log(`Nota ${noteNumber}: Toggle Status Box para ${showMidiStatusBox}`);
    }
  } else if (command === 0xb0) {
    // Control Change
    const ccNumber = data1;
    const ccValue = data2;
    lastCcNumber = ccNumber;
    lastCcValue = ccValue;
    handleMidiCC(ccNumber, ccValue);
  }
}

function handleMidiCC(ccNumber, value) {
  let normalizedValue = value / 127.0;
  let colorChangedByCC = false;

  if (ccNumber === 16) {
    tamanhoFonteDesejado = map(
      normalizedValue,
      0,
      1,
      TAM_FONTE_DESEJADO_MIN_MIDI,
      TAM_FONTE_DESEJADO_MAX_MIDI
    );
    if (tamanhoFonteDesejado < 8) tamanhoFonteDesejado = 8;
    ajustarTamanhoEElementos();
  } else if (ccNumber === 17) {
    fatorEntrelinha = map(normalizedValue, 0, 1, FATOR_ENTRELINHA_MIN_MIDI, FATOR_ENTRELINHA_MAX_MIDI);
    ajustarTamanhoEElementos();
  } else if (ccNumber === 18) {
    let newMinNormalized = normalizedValue;
    minAxisControlado = Math.min(newMinNormalized, maxAxisControlado);
    console.log(`MIDI CC#18: minAxisControlado (normalizado) -> ${minAxisControlado.toFixed(2)}`);
  } else if (ccNumber === 19) {
    let newMaxNormalized = normalizedValue;
    maxAxisControlado = Math.max(newMaxNormalized, minAxisControlado);
    console.log(`MIDI CC#19: maxAxisControlado (normalizado) -> ${maxAxisControlado.toFixed(2)}`);
  } else if (ccNumber === 20) {
    velocidadeOnda = map(normalizedValue, 0, 1, VELOCIDADE_ONDA_MIN_MIDI, VELOCIDADE_ONDA_MAX_MIDI);
  } else if (ccNumber >= 5 && ccNumber <= 7) {
    bgColor[ccNumber - 5] = Math.round(map(normalizedValue, 0, 1, 0, 255));
    colorChangedByCC = true;
  } else if (ccNumber >= 1 && ccNumber <= 3) {
    textColor[ccNumber - 1] = Math.round(map(normalizedValue, 0, 1, 0, 255));
    colorChangedByCC = true;
  }

  if (colorChangedByCC) {
    aplicarCorTextoAtual();
    console.log(`Cores Alteradas via CC: BG -> rgb(${bgColor.join(",")}), Texto -> rgb(${textColor.join(",")})`);
  }
}
*/

// =====================================================================================
// # FUNÇÕES DE TRANSIÇÃO AUTOMÁTICA
// =====================================================================================
function startTransitionTimer() {
  transitionTimer = setInterval(performTransition, transitionInterval);
}

function performTransition() {
  // Transição de Texto
  if (!isTextChanging) {
    isTextChanging = true;
    // Adiciona a classe para esconder/diminuir o texto
    textContainerDOMElement.classList.remove('text-popup-visible');
    textContainerDOMElement.classList.add('text-popup-hidden');

    // Espera a transição de saída terminar antes de trocar o texto e iniciar a de entrada
    setTimeout(() => {
      // Seleciona um novo conjunto de texto aleatoriamente
      const newTextSetIndex = Math.floor(Math.random() * textSets.length);
      textosDasLinhas = [...textSets[newTextSetIndex].lines];
      ajustarTamanhoEElementos(); // Re-cria os elementos DOM

      // Remove a classe de esconder e adiciona a de mostrar para o novo texto
      textContainerDOMElement.classList.remove('text-popup-hidden');
      textContainerDOMElement.classList.add('text-popup-visible');
      
      console.log(`Transição Automática: Carregado texto - "${textosDasLinhas.join(" / ")}"`);
      isTextChanging = false;
    }, textFadeDuration); // Tempo para o fade/popup-out completo antes de trocar o texto
  }

  // Transição de SVG (mantém a lógica anterior de fade)
  const newBackgroundIndex = Math.floor(Math.random() * backgroundContainerIds.length);
  showSpecificSvgBackground(newBackgroundIndex);
}

// =====================================================================================
// # FUNÇÃO DRAW - Loop de Renderização p5.js
// =====================================================================================
function draw() {
  document.body.style.backgroundColor = `rgb(${bgColor.join(",")})`;

  // As interpolações de opacidade para texto e SVG agora são tratadas pelo CSS,
  // então não precisamos mais de `lerp` aqui para elas.

  if (spansDasLinhas && spansDasLinhas.length > 0 && currentFontConfig) {
    for (let i = 0; i < spansDasLinhas.length; i++) {
      if (spansDasLinhas[i] && spansDasLinhas[i].length > 0) {
        for (let j = 0; j < spansDasLinhas[i].length; j++) {
          let span = spansDasLinhas[i][j];
          if (!span) continue;

          let fvsSettings = [];
          const fatorOndaChar = (sin(anguloOnda + j * 0.7 + i * 0.5) + 1) / 2;

          if (currentFontConfig.animatedAxes) {
            currentFontConfig.animatedAxes.forEach((axis) => {
              const absoluteMinForAxis = axis.min;
              const absoluteMaxForAxis = axis.max;
              let currentAnimationMin, currentAnimationMax;

              if (axis.useGlobalAxisRanges) {
                const rangeSize = absoluteMaxForAxis - absoluteMinForAxis;
                currentAnimationMin = absoluteMinForAxis + minAxisControlado * rangeSize;
                currentAnimationMax = absoluteMinForAxis + maxAxisControlado * rangeSize;
              } else {
                currentAnimationMin = absoluteMinForAxis;
                currentAnimationMax = absoluteMaxForAxis;
              }
              if (currentAnimationMin > currentAnimationMax) {
                [currentAnimationMin, currentAnimationMax] = [currentAnimationMax, currentAnimationMin];
              }
              let axisValue = lerp(currentAnimationMin, currentAnimationMax, fatorOndaChar);
              fvsSettings.push(`'${axis.tag}' ${axisValue.toFixed(0)}`);
            });
          }

          if (currentFontConfig.fixedAxes) {
            currentFontConfig.fixedAxes.forEach((axis) => {
              if (!fvsSettings.some((s) => s.startsWith(`'${axis.tag}'`))) {
                fvsSettings.push(`'${axis.tag}' ${axis.value}`);
              }
            });
          }

          if (fvsSettings.length > 0) {
            span.style("font-variation-settings", fvsSettings.join(", "));
          } else {
            span.style("font-variation-settings", "normal");
          }
        }
      }
    }
  }
  anguloOnda += velocidadeOnda;

  if (midiStatusBoxElement) {
    if (showMidiStatusBox) {
      let statusHTML = midiStatusText.replace(/\n/g, "<br>");
      if (midiInputDevice !== null && typeof lastCcValue !== "undefined") {
        statusHTML += `<br>Último CC: #${lastCcNumber} | Valor: ${lastCcValue}`;
      }
      if (midiStatusBoxElement.html() !== statusHTML) {
        midiStatusBoxElement.html(statusHTML);
      }
      if (midiStatusBoxElement.style("display") === "none") {
        midiStatusBoxElement.style("display", "block");
      }
    } else {
      if (midiStatusBoxElement.style("display") !== "none") {
        midiStatusBoxElement.style("display", "none");
      }
    }
  }
}

function windowResized() {
  if (!setupCompleto) {
    console.log("windowResized chamado ANTES do setup completar. Ignorando.");
    return;
  }
  console.log("Janela redimensionada. Recalculando texto...");
  ajustarTamanhoEElementos();
}

document.addEventListener("DOMContentLoaded", (event) => {
  // console.log("DOM completamente carregado e parseado.");
});