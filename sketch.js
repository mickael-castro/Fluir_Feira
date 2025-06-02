// =====================================================================================
// TIPOGRAFIA INTERATIVA COM P5.JS E WEB MIDI API
// -------------------------------------------------------------------------------------
// Checkpoint: 02 de Junho de 2025 (v17 - Controle de Velocidade de Rotação SVG BG)
// Este sketch demonstra como criar tipografia interativa na web,
// manipulando propriedades de fontes variáveis através de controladores MIDI.
// Múltiplas imagens de fundo SVG, conjuntos de texto e cores são controlados
// via MIDI, com transições de fade. Novas "Cenas de Imagem" (MIDI Notes 44-51)
// utilizam DIVs pré-carregadas. Velocidade de rotação dos SVGs de fundo controlada por CC#04.
// =====================================================================================

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES GERAIS DA ANIMAÇÃO E TEXTO
// -------------------------------------------------------------------------------------
let textosDasLinhas = ["Texto", "Padrão"];
let tamanhoFonteDesejado = 90;
let tamanhoFonteAplicado;
let fatorEntrelinha = 1.2;
let anguloOnda = 0;
let velocidadeOnda = 0.03; // Controlado pelo CC #20
let isWaveAnimationActive = true;

// --- Variáveis para Posição do Texto e Joystick ---
let textPosX = 0;
let textPosY = 0;
let joystickSpeedX = 0;
let joystickSpeedY = 0;
const JOYSTICK_CC_X = 80;
const JOYSTICK_CC_Y = 81;
const JOYSTICK_CENTER_VALUE = 64;
const JOYSTICK_SENSITIVITY = 0.2;
const MAX_TEXT_OFFSET_X_PERCENT = 0.35;
const MAX_TEXT_OFFSET_Y_PERCENT = 0.35;

// --- Variável para Opacidade do Texto ---
let textOpacity = 1.0; // Controlada pelo CC #21

// --- Variáveis para Controle de Velocidade de Rotação do SVG de Fundo ---
let svgRotationMidiValue = 64; // Valor MIDI inicial (0-127), 64 é o meio (para uma velocidade "padrão")
const MIN_SVG_ROTATION_DURATION_S = 10;  // Duração em segundos para a rotação mais rápida (MIDI valor 0)
const MAX_SVG_ROTATION_DURATION_S = 300; // Duração em segundos para a rotação mais lenta (MIDI valor 127)


// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE CONJUNTOS DE TEXTO E SELEÇÃO VIA MIDI (Pads 56-71)
// -------------------------------------------------------------------------------------
const textSets = [
    { note: 56, lines: [ "FEIRA DAS", "PROFISSÕES", "UFC 2025"]},
    { note: 57, lines: [ "Projeto", "Paisagens", "Tipográficas", "Interativas"]},
    { note: 58, lines: [ "A tipografia", "está em todos", "os lugares"]},
    { note: 59, lines: [ "Design", "Coding", "Typography"]} ,
    { note: 60, lines: [ "Exemplo", "Teste", "60"]} ,
    { note: 61, lines: [ "Exemplo", "Teste", "61"]} ,
    { note: 62, lines: [ "Exemplo", "Teste", "62"]} ,
    { note: 63, lines: [ "Exemplo", "Teste", "63"]} ,
    { note: 64, lines: [ "Exemplo", "Teste", "64"]} ,
    { note: 65, lines: [ "Exemplo", "Teste", "65"]} ,
    { note: 66, lines: [ "Exemplo", "Teste", "66"]} ,
    { note: 67, lines: [ "Exemplo", "Teste", "67"]} ,
    { note: 68, lines: [ "Exemplo", "Teste", "68"]} ,
    { note: 69, lines: [ "Exemplo", "Teste", "69"]} ,
    { note: 70, lines: [ "Exemplo", "Teste", "70"]} ,
    { note: 71, lines: [ "Exemplo", "Teste", "71"]}
];

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE FONTES VARIÁVEIS E SELEÇÃO VIA MIDI
// -------------------------------------------------------------------------------------
let fontConfigurations = [
    { name: "Chivo", fontFamily: "'Chivo', sans-serif", animatedAxes: [{ tag: 'wght', min: 100, max: 900, useGlobalAxisRanges: true }], fixedAxes: [{ tag: 'wdth', value: 120 }] },
    { name: "Fit", fontFamily: "'Fit', sans-serif", animatedAxes: [{ tag: 'wdth', min: 0, max: 1000, useGlobalAxisRanges: true }], fixedAxes: [] },
    { name: "Grade", fontFamily: "'Grade', serif", animatedAxes: [{ tag: 'wght', min: 80, max: 150, useGlobalAxisRanges: true }], fixedAxes: [{ tag: 'wdth', value: 90 }] },
    { name: "Zeitung", fontFamily: "'Zeitung', serif", animatedAxes: [{ tag: 'wght', min: 100, max: 900, useGlobalAxisRanges: true }], fixedAxes: [{ tag: 'opsz', value: 20 }] },
    { name: "Hela", fontFamily: "'Hela', sans-serif", animatedAxes: [{ tag: 'wght', min: 100, max: 700, useGlobalAxisRanges: true }], fixedAxes: [] },
    { name: "Tonal", fontFamily: "'tonal-variable', sans-serif", animatedAxes: [{ tag: 'wdth', min: 20, max: 100, useGlobalAxisRanges: true }], fixedAxes: [] }
];
let currentFontIndex = 0;
let currentFontConfig;
const padNotesForFonts = [16, 17, 18, 19, 20, 21];
let minAxisControlado = 0.0;
let maxAxisControlado = 1.0;

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DOS FUNDOS SVG E SELEÇÃO VIA MIDI
// -------------------------------------------------------------------------------------
const padNotesForBackgrounds = [36, 37, 38, 39];
const backgroundContainerIds = ["background-svg-container-1", "background-svg-container-2", "background-svg-container-3", "background-svg-container-4"];
let currentBackgroundIndex = -1;

// -------------------------------------------------------------------------------------
// # CONFIGURAÇÕES DE CORES
// -------------------------------------------------------------------------------------
let bgColor = [25, 29, 59];
let textColor = [230, 226, 190];
const targetBgColorNote36 = [81, 106, 174]; const targetTextColorNote36 = [255, 255, 255];
const targetBgColorNote37 = [19, 42, 54];    const targetTextColorNote37 = [255, 255, 255];
const targetBgColorNote38 = [186, 147, 45];  const targetTextColorNote38 = [255, 255, 255];
const targetBgColorNote39 = [81, 106, 174];  const targetTextColorNote39 = [255, 255, 255];
const targetBgColorNote40 = [153, 204, 51];  const targetTextColorNote40 = [255, 255, 255];
const targetBgColorNote41 = [102, 102, 102]; const targetTextColorNote41 = [255, 255, 255];
const targetBgColorNote42 = [51, 51, 51];    const targetTextColorNote42 = [204, 204, 204];

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
let statusBoxFont = 'Arial, sans-serif';
let midiStatusBoxElement;
let statusTextDiv;

const TAM_FONTE_DESEJADO_MIN_MIDI = 10; const TAM_FONTE_DESEJADO_MAX_MIDI = 350;
const FATOR_ENTRELINHA_MIN_MIDI = 0.7; const FATOR_ENTRELINHA_MAX_MIDI = 3.0;
const VELOCIDADE_ONDA_MIN_MIDI = 0.001; const VELOCIDADE_ONDA_MAX_MIDI = 0.15;
const notaDoPadParaStatusBox = 43;
const notaPadParaAtivarWaveAnimation = 77;
const notaPadParaDesativarWaveAnimation = 76;

// -------------------------------------------------------------------------------------
// # VARIÁVEIS DE ELEMENTOS DOM E ESTADO DO SKETCH
// -------------------------------------------------------------------------------------
let spansDasLinhas = [];
let textContainer;
let textContainerDOMElement;
let setupCompleto = false;
let isTextChanging = false;

// --- Variáveis para Cenas de Imagem (Método de DIVs Pré-carregadas) ---
let imageSceneElements = {}; 
let currentActiveImageSceneNote = null; 
let isImageSceneActive = false;

const imageScenesConfig = [
    { note: 44, bgColorHex: '#516AAE', elementId: 'image-scene-44' },
    { note: 45, bgColorHex: '#CF4A35', elementId: 'image-scene-45' },
    { note: 46, bgColorHex: '#1FA69B', elementId: 'image-scene-46' },
    { note: 47, bgColorHex: '#DA8CB7', elementId: 'image-scene-47' },
    { note: 48, bgColorHex: '#FFFFFF', elementId: 'image-scene-48' },
    { note: 49, bgColorHex: '#FFFFFF', elementId: 'image-scene-49' },
    { note: 50, bgColorHex: '#FFFFFF', elementId: 'image-scene-50' },
    { note: 51, bgColorHex: '#FFFFFF', elementId: 'image-scene-51' }
];

// =====================================================================================
// # FUNÇÃO PRELOAD
// =====================================================================================
function preload() {}

// =====================================================================================
// # FUNÇÃO SETUP
// =====================================================================================
function setup() {
    noCanvas();
    console.log("Setup: Tipografia Interativa com MIDI.");

    const initialTextSet = textSets.find(set => set.note === 56) || textSets[0];
    if (initialTextSet) textosDasLinhas = [...initialTextSet.lines];
    currentFontConfig = fontConfigurations[currentFontIndex];
    
    const initialColorNote = 36;
    applyAndLogColors(initialColorNote);
    const initialSvgIndex = padNotesForBackgrounds.indexOf(initialColorNote);
    if (initialSvgIndex !== -1) {
        showSpecificSvgBackground(initialSvgIndex);
    } else {
        hideAllSvgBackgrounds();
    }

    textContainer = createDiv('');
    textContainer.id('text-container');
    textContainerDOMElement = textContainer.elt;
    if (!textContainerDOMElement) {
        console.error("ERRO CRÍTICO: #text-container não pôde ser criado.");
    } else {
        textContainerDOMElement.style.transform = `translate(${textPosX}px, ${textPosY}px)`;
        textContainerDOMElement.style.opacity = textOpacity;
    }

    imageScenesConfig.forEach(scene => {
        const el = document.getElementById(scene.elementId);
        if (el) {
            imageSceneElements[scene.note] = el;
        } else {
            console.error(`ERRO CRÍTICO: Elemento da cena de imagem #${scene.elementId} (Nota ${scene.note}) não encontrado no HTML.`);
        }
    });

    ajustarTamanhoEElementos();

    if (showMidiStatusBox) {
        midiStatusBoxElement = createDiv('');
        midiStatusBoxElement.id('midi-status-box');
        midiStatusBoxElement.style('position', 'fixed').style('bottom', statusBoxPadding + 'px').style('right', statusBoxPadding + 'px')
                          .style('background-color', 'rgba(0,0,0,0.7)').style('color', 'white').style('padding', statusBoxPadding + 'px')
                          .style('font-family', statusBoxFont).style('font-size', statusBoxTextSize + 'px')
                          .style('border-radius', '5px').style('line-height', '1.4').style('z-index', '1000')
                          .style('display', showMidiStatusBox ? 'block' : 'none');
        statusTextDiv = createDiv('');
        statusTextDiv.parent(midiStatusBoxElement);
    }

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
    } else {
        midiStatusText = "Seu navegador não suporta a Web MIDI API.";
        if (showMidiStatusBox && statusTextDiv) updateMidiStatusBoxContent();
        console.warn(midiStatusText);
    }

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    
    updateSvgRotationSpeed(); // Define a velocidade de rotação inicial dos SVGs
    
    setupCompleto = true;
    updateMidiStatusBoxContent();
    console.log("Setup Concluído.");
}

// =====================================================================================
// # FUNÇÕES AUXILIARES GERAIS (Cores, SVG, Status, Rotação SVG)
// =====================================================================================
function hexToRgbArray(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#')) hex = hex.slice(1);
    if (hex.length === 3) { r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16); }
    else if (hex.length === 6) { r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16); }
    return [r, g, b];
}

function applyAndLogColors(noteNum) {
    if (noteNum === 36) { bgColor = [...targetBgColorNote36]; textColor = [...targetTextColorNote36]; }
    else if (noteNum === 37) { bgColor = [...targetBgColorNote37]; textColor = [...targetTextColorNote37]; }
    else if (noteNum === 38) { bgColor = [...targetBgColorNote38]; textColor = [...targetTextColorNote38]; }
    else if (noteNum === 39) { bgColor = [...targetBgColorNote39]; textColor = [...targetTextColorNote39]; }
    else if (noteNum === 40) { bgColor = [...targetBgColorNote40]; textColor = [...targetTextColorNote40]; }
    else if (noteNum === 41) { bgColor = [...targetBgColorNote41]; textColor = [...targetTextColorNote41]; }
    else if (noteNum === 42) { bgColor = [...targetBgColorNote42]; textColor = [...targetTextColorNote42]; }
    aplicarCorTextoAtual();
    console.log(`Nota ${noteNum}: Cores definidas para BG: rgb(${bgColor.join(',')}), Texto: rgb(${textColor.join(',')})`);
}

function hideAllSvgBackgrounds() {
    backgroundContainerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) container.classList.remove('active-background');
    });
    currentBackgroundIndex = -1;
}

function showSpecificSvgBackground(indexToShow) {
    if (indexToShow < 0 || indexToShow >= backgroundContainerIds.length) {
        hideAllSvgBackgrounds(); return;
    }
    backgroundContainerIds.forEach((id, i) => {
        const container = document.getElementById(id);
        if (container) {
            if (i === indexToShow) container.classList.add('active-background');
            else container.classList.remove('active-background');
        }
    });
    currentBackgroundIndex = indexToShow;
}

function updateMidiStatusBoxContent() {
    if (!statusTextDiv || !showMidiStatusBox) return;
    let statusHTML = "<strong>ESTATÍSTICAS PARA NERDS</strong><br>---<br>";
    if (isImageSceneActive && currentActiveImageSceneNote !== null) {
        const activeSceneConfig = imageScenesConfig.find(s => s.note === currentActiveImageSceneNote);
        statusHTML += `Cena Atual: Imagem (${activeSceneConfig ? activeSceneConfig.elementId : 'N/A'})<br>`;
    } else if (currentFontConfig) {
        statusHTML += `Fonte Atual: ${currentFontConfig.name}<br>`;
        statusHTML += `Animação de Texto: ${isWaveAnimationActive ? 'WAVE' : 'STOP'}<br>`;
    } else { statusHTML += `Cena/Fonte: N/A<br>`; }
    statusHTML += "---<br>";
    statusHTML += midiStatusText.replace(/\n/g, '<br>');
    if (midiInputDevice && typeof lastCcValue !== 'undefined' && typeof lastCcNumber !== 'undefined') {
        statusHTML += `<br>---<br>Último CC: #${lastCcNumber} | Valor: ${lastCcValue}`;
    }
    if (statusTextDiv.html() !== statusHTML) statusTextDiv.html(statusHTML);
}

function updateSvgRotationSpeed() {
    // Mapeia o valor MIDI (0-127) para a duração da animação.
    // MIDI 0 = rotação mais rápida (menor duração)
    // MIDI 127 = rotação mais lenta (maior duração)
    let newDuration = map(svgRotationMidiValue, 0, 127, MIN_SVG_ROTATION_DURATION_S, MAX_SVG_ROTATION_DURATION_S);
    newDuration = constrain(newDuration, MIN_SVG_ROTATION_DURATION_S, MAX_SVG_ROTATION_DURATION_S); // Garante que está dentro dos limites

    const durationString = `${newDuration.toFixed(1)}s`;
    // console.log(`MIDI CC#04: SVG Rotation MIDI Value: ${svgRotationMidiValue}, Mapped Duration: ${durationString}`); // Descomente para depurar se necessário

    // Aplica a nova duração a todos os elementos SVG de fundo
    // através da variável CSS --svg-rotation-duration.
    backgroundContainerIds.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            const svgElement = container.querySelector('.background-svg-element');
            if (svgElement) {
                svgElement.style.setProperty('--svg-rotation-duration', durationString);
                // REMOVEMOS O BLOCO DE REINÍCIO DA ANIMAÇÃO DAQUI:
                // if (container.classList.contains('active-background')) {
                //     svgElement.style.animationName = 'none';
                //     void svgElement.offsetWidth; // Trigger reflow
                //     svgElement.style.animationName = 'rotateBackgroundSVG';
                // }
            }
        }
    });
}


// =====================================================================================
// # FUNÇÕES DE MANIPULAÇÃO DE TEXTO
// =====================================================================================
function ajustarTamanhoEElementos() {
    tamanhoFonteAplicado = tamanhoFonteDesejado;
    if (tamanhoFonteAplicado < 8) tamanhoFonteAplicado = 8;
    criarElementosDeTexto(tamanhoFonteAplicado);
}

function criarElementosDeTexto(tamanhoFonteAtual) {
    if (!textContainerDOMElement) return;
    textContainer.html(''); 
    spansDasLinhas = [];
    if (textosDasLinhas.length === 0) return;

    for (let i = 0; i < textosDasLinhas.length; i++) {
        let linhaDiv = createDiv('');
        linhaDiv.parent(textContainer);
        linhaDiv.class('text-line');
        linhaDiv.style('line-height', fatorEntrelinha.toString());
        let spansNestaLinha = [];
        let textoDaLinha = textosDasLinhas[i];
        if (textoDaLinha && typeof textoDaLinha === 'string') {
            for (let j = 0; j < textoDaLinha.length; j++) {
                let char = textoDaLinha[j];
                let charSpan = createSpan(char === ' ' ? '&nbsp;' : char);
                charSpan.parent(linhaDiv);
                charSpan.class('char-span');
                charSpan.style('font-size', `${tamanhoFonteAtual}px`);
                charSpan.style('color', `rgb(${textColor.join(',')})`);
                let fontFamilyToApply = currentFontConfig ? currentFontConfig.fontFamily : "'Chivo', sans-serif";
                charSpan.style('font-family', fontFamilyToApply);
                spansNestaLinha.push(charSpan);
            }
        }
        spansDasLinhas.push(spansNestaLinha);
    }
}

function aplicarCorTextoAtual() {
    if (spansDasLinhas) {
        spansDasLinhas.forEach(linha => {
            linha.forEach(span => {
                if (span && span.elt) span.style('color', `rgb(${textColor.join(',')})`);
            });
        });
    }
}

// =====================================================================================
// # FUNÇÕES DE GERENCIAMENTO DE CENA (TEXTO vs IMAGEM)
// =====================================================================================
function showImageScene(sceneConfig) {
    if (!textContainerDOMElement) {
        console.error("Text container não encontrado para showImageScene.");
        return;
    }
    // console.log(`Ativando Cena de Imagem para nota: ${sceneConfig.note} (Elemento: ${sceneConfig.elementId})`);

    if (currentActiveImageSceneNote !== null && imageSceneElements[currentActiveImageSceneNote]) {
        imageSceneElements[currentActiveImageSceneNote].classList.remove('active-scene-image');
    }
    
    const newSceneElement = imageSceneElements[sceneConfig.note];
    if (newSceneElement) {
        newSceneElement.classList.add('active-scene-image');
        currentActiveImageSceneNote = sceneConfig.note;
        isImageSceneActive = true;
    } else {
        console.error(`Elemento DOM para cena da nota ${sceneConfig.note} (ID: ${sceneConfig.elementId}) não foi encontrado em imageSceneElements.`);
        isImageSceneActive = false; 
        currentActiveImageSceneNote = null;
        return; 
    }

    hideAllSvgBackgrounds();
    textContainerDOMElement.style.opacity = 0;
    bgColor = hexToRgbArray(sceneConfig.bgColorHex);
    // console.log(`Cena de Imagem ${sceneConfig.elementId} ativada. BG: ${sceneConfig.bgColorHex}`);
}

function activateTextScene() {
    if (!textContainerDOMElement) {
        console.error("Text container não encontrado para activateTextScene.");
        return;
    }

    if (isImageSceneActive && currentActiveImageSceneNote !== null && imageSceneElements[currentActiveImageSceneNote]) {
        imageSceneElements[currentActiveImageSceneNote].classList.remove('active-scene-image');
    }
    currentActiveImageSceneNote = null;
    isImageSceneActive = false;
    textContainerDOMElement.style.opacity = textOpacity;
}

// =====================================================================================
// # FUNÇÕES DE CALLBACK E PROCESSAMENTO MIDI
// =====================================================================================
function onMIDISuccess(midiAccess) {
    midiStatusText = "Acesso MIDI concedido!";
    const inputs = midiAccess.inputs.values();
    let inputFound = false;
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        midiInputDevice = input.value;
        midiStatusText = `Conectado: ${midiInputDevice.name}`;
        console.log(`Ouvindo o dispositivo MIDI: ${midiInputDevice.name}`);
        midiInputDevice.onmidimessage = onMIDIMessage;
        inputFound = true; break;
    }
    if (!inputFound) { midiStatusText = "Nenhum dispositivo MIDI de entrada encontrado."; console.warn(midiStatusText); }
    updateMidiStatusBoxContent();
    midiAccess.onstatechange = onMIDIStateChange;
}

function onMIDIFailure(e) {
    midiStatusText = "Falha ao acessar MIDI: " + e; console.error(midiStatusText);
    updateMidiStatusBoxContent();
}

function onMIDIStateChange(event) {
    console.log("Estado MIDI mudou:", event.port.name, event.port.type, event.port.state);
    updateMidiStatusBoxContent();
}

function onMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    const command = status & 0xF0;
    let actionProcessedThisTurn = false;

    if (command === 0x90 && data2 > 0) { // Note On
        let noteNumber = data1;
        // console.log(`MIDI Note On Recebida: ${noteNumber}`);

        const targetImageSceneConfig = imageScenesConfig.find(s => s.note === noteNumber);
        if (targetImageSceneConfig) {
            showImageScene(targetImageSceneConfig);
            actionProcessedThisTurn = true;
        } else {
            activateTextScene(); 

            if (noteNumber === notaPadParaAtivarWaveAnimation) {
                isWaveAnimationActive = true; actionProcessedThisTurn = true;
            } else if (noteNumber === notaPadParaDesativarWaveAnimation) {
                isWaveAnimationActive = false; actionProcessedThisTurn = true;
            }

            if (!actionProcessedThisTurn || (noteNumber !== notaPadParaAtivarWaveAnimation && noteNumber !== notaPadParaDesativarWaveAnimation)) {
                const selectedTextSet = textSets.find(set => set.note === noteNumber);
                if (selectedTextSet) {
                    if (isTextChanging) { return; }
                    isTextChanging = true;
                    textOpacity = 1.0; 
                    if (textContainerDOMElement) textContainerDOMElement.style.opacity = 0; 

                    setTimeout(() => {
                        textosDasLinhas = [...selectedTextSet.lines];
                        ajustarTamanhoEElementos();
                        if (textContainerDOMElement) textContainerDOMElement.style.opacity = textOpacity; 
                        isTextChanging = false;
                    }, 300);
                    actionProcessedThisTurn = true;
                }
            }

            if (!actionProcessedThisTurn) {
                if ((noteNumber >= 36 && noteNumber <= 39) || (noteNumber >= 40 && noteNumber <= 42)) {
                    applyAndLogColors(noteNumber); 
                    if (noteNumber >= 36 && noteNumber <= 39) { 
                        const svgIndex = padNotesForBackgrounds.indexOf(noteNumber);
                        if (svgIndex !== -1) showSpecificSvgBackground(svgIndex);
                    } else { 
                        hideAllSvgBackgrounds();
                    }
                    actionProcessedThisTurn = true;
                }
            }
            
            if (!actionProcessedThisTurn) {
                const fontPadIndex = padNotesForFonts.indexOf(noteNumber);
                if (fontPadIndex !== -1) {
                    textPosX = 0; textPosY = 0; joystickSpeedX = 0; joystickSpeedY = 0;
                    textOpacity = 1.0; 

                    if (textContainerDOMElement) {
                        textContainerDOMElement.style.transform = `translate(${textPosX}px, ${textPosY}px)`;
                        textContainerDOMElement.style.opacity = textOpacity;
                    }
                    if (currentFontIndex !== fontPadIndex && fontPadIndex < fontConfigurations.length) {
                        currentFontIndex = fontPadIndex;
                        currentFontConfig = fontConfigurations[currentFontIndex];
                    } else if (fontPadIndex >= fontConfigurations.length) {
                         console.warn(`Índice de fonte ${fontPadIndex} inválido.`);
                    }
                    ajustarTamanhoEElementos(); 
                    actionProcessedThisTurn = true;
                }
            }
        }
        if (noteNumber === notaDoPadParaStatusBox) {
            showMidiStatusBox = !showMidiStatusBox;
            if (midiStatusBoxElement) midiStatusBoxElement.style('display', showMidiStatusBox ? 'block' : 'none');
        }

    } else if (command === 0xB0) { // Control Change
        const ccNumber = data1;
        const ccValue = data2;
        lastCcNumber = ccNumber; lastCcValue = ccValue; 
        handleMidiCC(ccNumber, ccValue);
    }

    if (actionProcessedThisTurn || command === 0xB0) {
        updateMidiStatusBoxContent();
    }
}

function handleMidiCC(ccNumber, value) {
    let normalizedValue = value / 127.0;

    if (ccNumber === JOYSTICK_CC_X) { 
        let diffX = value - JOYSTICK_CENTER_VALUE; 
        joystickSpeedX = (Math.abs(diffX) < 5) ? 0 : (diffX / (127 - JOYSTICK_CENTER_VALUE)) * 5 * JOYSTICK_SENSITIVITY * 10;
        return; 
    }
    if (ccNumber === JOYSTICK_CC_Y) { 
        let diffY = value - JOYSTICK_CENTER_VALUE;
        joystickSpeedY = (Math.abs(diffY) < 5) ? 0 : (diffY / (127 - JOYSTICK_CENTER_VALUE)) * -5 * JOYSTICK_SENSITIVITY * 10;
        return; 
    }

    if (ccNumber === 4) { // CC#04 for SVG Rotation Speed
        svgRotationMidiValue = value; 
        updateSvgRotationSpeed();
    } else if (ccNumber === 16) { 
        tamanhoFonteDesejado = map(normalizedValue, 0, 1, TAM_FONTE_DESEJADO_MIN_MIDI, TAM_FONTE_DESEJADO_MAX_MIDI); 
        if (tamanhoFonteDesejado < 8) tamanhoFonteDesejado = 8; 
        ajustarTamanhoEElementos(); 
    } else if (ccNumber === 17) { 
        fatorEntrelinha = map(normalizedValue, 0, 1, FATOR_ENTRELINHA_MIN_MIDI, FATOR_ENTRELINHA_MAX_MIDI); 
        ajustarTamanhoEElementos(); 
    } else if (ccNumber === 18) { 
        minAxisControlado = Math.min(normalizedValue, maxAxisControlado); 
    } else if (ccNumber === 19) { 
        maxAxisControlado = Math.max(normalizedValue, minAxisControlado); 
    } else if (ccNumber === 20) { 
        velocidadeOnda = map(normalizedValue, 0, 1, VELOCIDADE_ONDA_MIN_MIDI, VELOCIDADE_ONDA_MAX_MIDI); 
    } else if (ccNumber === 21) { 
        textOpacity = normalizedValue;
        if (textContainerDOMElement && !isImageSceneActive) { 
            textContainerDOMElement.style.opacity = textOpacity;
        }
    } else if (ccNumber >= 5 && ccNumber <= 7) { 
        bgColor[ccNumber - 5] = Math.round(map(normalizedValue, 0, 1, 0, 255)); 
    } else if (ccNumber >= 1 && ccNumber <= 3) { 
        textColor[ccNumber - 1] = Math.round(map(normalizedValue, 0, 1, 0, 255));
        if (!isImageSceneActive) aplicarCorTextoAtual(); 
    }
}

// =====================================================================================
// # FUNÇÃO DRAW
// =====================================================================================
function draw() {
    document.body.style.backgroundColor = `rgb(${bgColor.join(',')})`;

    if (!isImageSceneActive && textContainerDOMElement) { 
        textPosX += joystickSpeedX;
        textPosY += joystickSpeedY;
        let maxX = windowWidth * MAX_TEXT_OFFSET_X_PERCENT;
        let maxY = windowHeight * MAX_TEXT_OFFSET_Y_PERCENT;
        textPosX = constrain(textPosX, -maxX, maxX);
        textPosY = constrain(textPosY, -maxY, maxY);
        textContainerDOMElement.style.transform = `translate(${textPosX}px, ${textPosY}px)`;

        if (spansDasLinhas && spansDasLinhas.length > 0 && currentFontConfig) {
            for (let i = 0; i < spansDasLinhas.length; i++) {
                if (spansDasLinhas[i] && spansDasLinhas[i].length > 0) {
                    for (let j = 0; j < spansDasLinhas[i].length; j++) {
                        let span = spansDasLinhas[i][j];
                        if (!span || !span.elt) continue;
                        let fvsSettingsMap = new Map();
                        if (currentFontConfig.fixedAxes) {
                            currentFontConfig.fixedAxes.forEach(axis => fvsSettingsMap.set(axis.tag, `'${axis.tag}' ${axis.value}`));
                        }
                        if (isWaveAnimationActive && currentFontConfig.animatedAxes) {
                            const fatorOndaChar = (sin(anguloOnda + j * 0.7 + i * 0.5) + 1) / 2;
                            currentFontConfig.animatedAxes.forEach(axis => {
                                const absMin = axis.min, absMax = axis.max;
                                let animMin, animMax, axisVal;
                                if (axis.useGlobalAxisRanges) {
                                    const range = absMax - absMin;
                                    animMin = absMin + (minAxisControlado * range);
                                    animMax = absMin + (maxAxisControlado * range);
                                } else { animMin = absMin; animMax = absMax; }
                                if (animMin > animMax) [animMin, animMax] = [animMax, animMin];
                                axisVal = lerp(animMin, animMax, fatorOndaChar);
                                fvsSettingsMap.set(axis.tag, `'${axis.tag}' ${axisVal.toFixed(0)}`);
                            });
                        } else if (!isWaveAnimationActive && currentFontConfig.animatedAxes) {
                            currentFontConfig.animatedAxes.forEach(axis => {
                                if (!fvsSettingsMap.has(axis.tag)) {
                                    const midVal = (axis.min + axis.max) / 2;
                                    fvsSettingsMap.set(axis.tag, `'${axis.tag}' ${midVal.toFixed(0)}`);
                                }
                            });
                        }
                        let fvsString = Array.from(fvsSettingsMap.values()).join(', ');
                        span.style('font-variation-settings', fvsString ? fvsString : 'normal');
                    }
                }
            }
        }
        if (isWaveAnimationActive) anguloOnda += velocidadeOnda;
    }
    updateMidiStatusBoxContent(); 
}

// =====================================================================================
// # FUNÇÕES DE EVENTOS DO NAVEGADOR
// =====================================================================================
function windowResized() {
    if (!setupCompleto) return;
    console.log("Janela redimensionada.");
    if (!isImageSceneActive) { 
        textPosX = 0; textPosY = 0; joystickSpeedX = 0; joystickSpeedY = 0;
        if(textContainerDOMElement) {
            textContainerDOMElement.style.transform = `translate(${textPosX}px, ${textPosY}px)`;
            textContainerDOMElement.style.opacity = textOpacity;
        }
        ajustarTamanhoEElementos();
    }
}