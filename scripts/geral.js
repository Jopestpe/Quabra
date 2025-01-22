const canvas = document.getElementById("quadro");
const larguraInput = document.getElementById("largura_imagem");
const alturaInput = document.getElementById("altura_imagem");
const areaQuadro = document.getElementById("area_quadro");
const zoom_span = document.getElementById("zoom_span");
const botao_borracha = document.getElementById("BotaoBorracha");
const botao_zoom = document.getElementById("BotaoZoom");
const BotaoCorFundo = document.getElementById("alterar_cor_pincel");
const CorFundo = document.getElementById("CorFundo");
const selecionar_baixar = document.getElementById("selecionar_baixar");
const selecionar_estilo = document.getElementById("selecionar_estilo");
const selecionar_pincel = document.getElementById("selecionar_pincel");
const entrada_tamanho_pincel = document.getElementById("entrada_tamanho_pincel");
const EntradaDeArquivo = document.getElementById('EntradaDeArquivo');
const soltar_arquivos = document.getElementById('area_quadro');
const criar_aba = document.getElementById('criar_aba');
const div_abas = document.getElementById('abas');
const abas = document.querySelectorAll('.aba');
const ctx = canvas.getContext("2d");
const salvo = { abas: [{ nome: "Nova aba", conteudo: obter_quadro_vazio() }] };
let aba_atual = 0;
let desenhando = false;
let estilo_selecionado = "normal";
let pincel_selecionado = "pixel";
let cor = "black";
let borda_pincel = "square";
let tamanho_pincel = 1;
let ultima_posicao = null;
let borracha = false;

redimensionar_canvas();
modo_pixel(true);

larguraInput.addEventListener("input", redimensionar_canvas);
alturaInput.addEventListener("input", redimensionar_canvas);

function redimensionar_canvas() {
  const largura = parseInt(larguraInput.value, 10) || canvas.width;
  const altura = parseInt(alturaInput.value, 10) || canvas.height;
  canvas.width = largura;
  canvas.height = altura;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  reajustar_zoom(largura, altura);
}

areaQuadro.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (event.deltaY < 0) {
    definir_zoom((zoom_span.value *= 1.1) / 100, zoom_span.value);
  } else if (event.deltaY > 0) {
    definir_zoom((zoom_span.value *= 0.9) / 100, zoom_span.value);
  }
});

zoom_span.addEventListener("input", (evento) => {
  definir_zoom((zoom_span.value / 100));
});

function definir_zoom(zoom, definir_input = false) {
  canvas.style.transform = `scale(${zoom})`;
  if (definir_input) {
    zoom_span.value = parseInt(definir_input).toFixed(0);
  }
}

function reajustar_zoom(largura, altura) {
  const baseZoom = 2300;
  const minZoom = 40;
  const maxDimension = Math.max(largura, altura);
  const referenceSize = 32;
  let zoomLevel = baseZoom * (referenceSize / maxDimension);
  zoomLevel = Math.max(minZoom, Math.min(baseZoom, zoomLevel));
  zoomLevel = Math.round(zoomLevel);
  const scaledWidth = (largura * zoomLevel) / 100;
  const scaledHeight = (altura * zoomLevel) / 100;
  if (scaledWidth > areaQuadro.offsetWidth || scaledHeight > areaQuadro.offsetHeight) {
    const widthRatio = areaQuadro.offsetWidth / largura;
    const heightRatio = areaQuadro.offsetHeight / altura;
    const fitRatio = Math.min(widthRatio, heightRatio);
    zoomLevel = Math.floor(fitRatio * 95);
  }
  definir_zoom((zoomLevel / 100), zoomLevel);
  reajustar_quadriculado(largura, altura);
}

function reajustar_quadriculado(largura, altura) {
  const n = 8;
  const valor = largura < altura ? parseInt(largura / n) : parseInt(altura / n);
  canvas.style.backgroundSize = `${valor}px ${valor}px`;
}

canvas.addEventListener("mousedown", (evento) => {
  if (evento.button === 0) {
    desenhando = true;
    desenhar(evento);
  }
});
canvas.addEventListener("mouseup", () => {
  desenhando = false;
  ctx.beginPath();
  ultima_posicao = null;
});
canvas.addEventListener("mousemove", (evento) => {
  desenhar(evento);
});

function desenhar(evento) {
  if (!desenhando) return;
  if (borracha) {
    apagar(evento);
  } else {
    switch (pincel_selecionado) {
      case "pixel":
        desenhar_pixel(evento);
        break;
      case "normal":
        desenhar_normal(evento);
        break;
      default:
        return;
    }
  }
  salvar_quadro_atual();
}

function apagar(evento) {
  const { x, y } = posicao_mouse(evento);
  switch (pincel_selecionado) {
    case "pixel":
      ctx.clearRect(parseInt(x), parseInt(y), tamanho_pincel, tamanho_pincel);
      break;
    case "normal":
      ctx.clearRect(x, y, tamanho_pincel, tamanho_pincel);
      break;
    default:
      return;
  }
}

function posicao_mouse(evento) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evento.clientX - rect.left) / (zoom_span.value / 100),
    y: (evento.clientY - rect.top) / (zoom_span.value / 100),
  };
}

function desenhar_normal(evento) {
  ctx.lineWidth = tamanho_pincel;
  ctx.lineCap = borda_pincel;
  ctx.strokeStyle = cor;
  const { x, y } = posicao_mouse(evento);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

function desenhar_pixel(evento) {
  const { x, y } = posicao_mouse(evento);
  ctx.fillStyle = cor;
  if (ultima_posicao) {
    const deltaX = x - ultima_posicao.x;
    const deltaY = y - ultima_posicao.y;
    const distancia = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const passos = Math.ceil(distancia);
    for (let i = 0; i <= passos; i++) {
      const interpolarX = ultima_posicao.x + (deltaX * i) / passos;
      const interpolarY = ultima_posicao.y + (deltaY * i) / passos;
      ctx.fillRect(
        Math.floor(interpolarX),
        Math.floor(interpolarY),
        tamanho_pincel,
        tamanho_pincel,
      );
    }
  }
  ultima_posicao = { x, y };
}

function modo_pixel(ativar) {
  ctx.imageSmoothingEnabled = !ativar;
  ctx.msImageSmoothingEnabled = !ativar;
  if (ativar) {
    canvas.style.imageRendering = "pixelated";
  } else {
    canvas.style.imageRendering = "auto";
  }
}

selecionar_estilo.addEventListener("change", (evento) => {
  estilo_selecionado = evento.target.value;
  evento.target.selectedIndex = 0;
  if (estilo_selecionado == "pixel") {
    modo_pixel(true);
  } else {
    modo_pixel(false);
  }
});

selecionar_pincel.addEventListener("change", (evento) => { // borda_pincel: butt, round, square
  pincel_selecionado = evento.target.value;
  evento.target.selectedIndex = 0;
});

selecionar_baixar.addEventListener("change", (evento) => {
  const tipo_selecionado = evento.target.value;
  evento.target.selectedIndex = 0;
  const link = document.createElement("a");
  switch (tipo_selecionado) {
    case "png":
      baixarComoPNG(link);
      break;
    case "jpg":
      baixarComoJPG(link);
      break;
    case "svg":
      baixarComoSVG(link);
      break;
    default:
      return;
  }
});

function baixarComoPNG(link) {
  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = canvas.width;
  canvasTemp.height = canvas.height;
  const ctxTemp = canvasTemp.getContext("2d");
  ctxTemp.drawImage(canvas, 0, 0);
  link.href = canvasTemp.toDataURL("image/png");
  link.download = "desenho.png";
  link.click();
}

function baixarComoJPG(link) {
  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = canvas.width;
  canvasTemp.height = canvas.height;
  const ctxTemp = canvasTemp.getContext("2d");
  ctxTemp.fillStyle = "white";
  ctxTemp.fillRect(0, 0, canvasTemp.width, canvasTemp.height);
  ctxTemp.drawImage(canvas, 0, 0);
  link.href = canvasTemp.toDataURL("image/jpeg", 1.0);
  link.download = "desenho.jpg";
  link.click();
}

function baixarComoSVG(link) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", canvas.width);
  svg.setAttribute("height", canvas.height);
  const image = document.createElementNS(svgNS, "image");
  image.setAttribute("href", canvas.toDataURL("image/png"));
  image.setAttribute("width", canvas.width);
  image.setAttribute("height", canvas.height);
  svg.appendChild(image);
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  link.href = URL.createObjectURL(svgBlob);
  link.download = "desenho.svg";
  link.click();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "z" || e.key === "z") {
    botao_zoom.click();
  } if (e.key === "e" || e.key === "E") {
    botao_borracha.click();
  } if (e.key === "c" || e.key === "C") {
    CorFundo.click();
  } if (e.key === "[" && parseInt(entrada_tamanho_pincel.value) > 0) {
    entrada_tamanho_pincel.value = parseInt(entrada_tamanho_pincel.value) - 1;
    tamanho_pincel = entrada_tamanho_pincel.value;
  } if (e.key === "]") {
    entrada_tamanho_pincel.value = parseInt(entrada_tamanho_pincel.value) + 1;
    tamanho_pincel = entrada_tamanho_pincel.value;
  }
});
botao_borracha.addEventListener("click", () => {
  borracha = !borracha;
  if (borracha) {
    botao_borracha.style.color = "var(--cor-azul)";
  } else {
    botao_borracha.style.color = "var(--cor-borda)";
  }
});

botao_zoom.addEventListener("click", () => {
  reajustar_zoom(canvas.width, canvas.height);
});

function configurarBotaoCor(botao, input, callback) {
  botao.addEventListener("click", () => input.click());
  input.addEventListener("input", callback);
}
configurarBotaoCor(BotaoCorFundo, CorFundo, () => {
  cor = CorFundo.value;
  BotaoCorFundo.style.backgroundColor = CorFundo.value;
});

entrada_tamanho_pincel.addEventListener("input", () => {
  tamanho_pincel = entrada_tamanho_pincel.value;
});

function obter_quadro_vazio() {
  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = 32;
  canvasTemp.height = 32;
  return canvasTemp.toDataURL();
}

function obter_quadro_atual() {
  return canvas.toDataURL();
}

function salvar_quadro_atual() {
  salvo.abas[aba_atual].conteudo = obter_quadro_atual();
}

function carregar_quadro(aba) {
  const img = new Image();
  img.src = aba.conteudo;
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    reajustar_zoom(canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
}

criar_aba.addEventListener('click', () => {
    const nome_padrao = `Nova Aba ${salvo.abas.length + 1}`;
    salvo.abas.push({
        nome: nome_padrao,
        conteudo: obter_quadro_vazio()
    });
    recarregar_abas();
    const abas = document.querySelectorAll('.aba');
    abas[abas.length - 1].click();
});

recarregar_abas();
document.querySelector('.aba').click();
function recarregar_abas() {
    div_abas.innerHTML = '';
    const fragmento = document.createDocumentFragment();
    salvo.abas.forEach((aba, indice) => {
        const divAba = document.createElement('div');
        divAba.className = 'aba';
        divAba.textContent = aba.nome;
        divAba.addEventListener('click', () => {
            aba_atual = indice;
            carregar_quadro(aba);
            document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('aba_atual'));
            divAba.classList.add('aba_atual');
        });
        fragmento.appendChild(divAba);
    });
    div_abas.appendChild(fragmento);
}

document.getElementById('BotaoEntradaDeArquivo').addEventListener('click', () => {
    EntradaDeArquivo.click();
});

EntradaDeArquivo.addEventListener('change', () => {
    const arquivos = Array.from(EntradaDeArquivo.files);
    carregar_arquivos(arquivos);
});

soltar_arquivos.addEventListener('dragover', (e) => {
  e.preventDefault();
  soltar_arquivos.style.border = '20px solid var(--cor-azul)';
});

soltar_arquivos.addEventListener('dragleave', () => {
  soltar_arquivos.style.border = 'none';
});

soltar_arquivos.addEventListener('drop', (e) => {
    e.preventDefault();
    soltar_arquivos.style.border = 'none';
    const arquivos = Array.from(e.dataTransfer.files);
    carregar_arquivos(arquivos);
});

const formatosSuportados = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/svg+xml"
];

function carregar_arquivos(arquivos){
  arquivos.forEach((arquivo, indice) => {
    if (formatosSuportados.includes(arquivo.type)) {
      const leitor = new FileReader();
      leitor.onload = (evento) => {
        salvo.abas.push({
          nome: arquivo.name,
          conteudo: evento.target.result,
          tipo: arquivo.type
        });
        recarregar_abas();
        if (indice === arquivos.length - 1) {
          const abas = document.querySelectorAll('.aba');
          abas[abas.length - 1].click();
        }
      };
      leitor.readAsDataURL(arquivo);
    }
  });
}


