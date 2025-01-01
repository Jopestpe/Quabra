const canvas = document.getElementById('quadro');
const ctx = canvas.getContext('2d');
const inputLargura = document.getElementById('inputLargura');
const inputAltura = document.getElementById('inputAltura');
const btnAtualizar = document.getElementById('btnAtualizar');

let desenhando = false;

function ajustarCanvas() {
    canvas.width = parseInt(inputLargura.value);
    canvas.height = parseInt(inputAltura.value);
}

canvas.addEventListener('mousedown', () => { desenhando = true; });
canvas.addEventListener('mouseup', () => { desenhando = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', desenhar);

function desenhar(evento) {
    if (!desenhando) return;

    const rect = canvas.getBoundingClientRect();
    const x = evento.clientX - rect.left;
    const y = evento.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

btnAtualizar.addEventListener('click', ajustarCanvas);

ajustarCanvas();