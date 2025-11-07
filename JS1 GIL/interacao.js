let palavras = [];
let ordem = [];
let idx = -1;
let palavraAtual = "";
let exibicao = [];
let vidas = 6;
let pontos = 0;
let jogoRodando = false;
let historico = [];
let dicaUsada = false;

const img = document.getElementById("img-menino");
const lblPalavra = document.getElementById("palavra");
const lblVidas = document.getElementById("vidas");
const lblPontos = document.getElementById("pontos");
const lblCategoria = document.getElementById("categoria");
const lblProgresso = document.getElementById("progresso");
const btnIniciar = document.getElementById("btn_iniciar");
const btnDica = document.getElementById("btn_dica");
const boxTeclado = document.getElementById("box-teclado");
const ulHistorico = document.getElementById("lista-historico");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalMsg = document.getElementById("modal-msg");
const btnContinuar = document.getElementById("btn_continuar");
const btnReiniciar = document.getElementById("btn_reiniciar");

boot();

async function boot(){
  try{
    const resp = await fetch("fases.json");
    const data = await resp.json();
    palavras = (data.frutas || []).map(s => String(s).toUpperCase());
  }catch{
    palavras = ["BANANA","UVA","MANGA","MORANGO","ABACAXI"];
  }
  lblCategoria.textContent = "Categoria: Frutas";
  lblProgresso.textContent = `Palavra 0 de ${palavras.length}`;
  btnIniciar.disabled = false;
  montarTeclado();
  wire();
}

function wire(){
  btnIniciar.addEventListener("click", iniciar);
  btnDica.addEventListener("click", darDica);
  btnContinuar.addEventListener("click", ()=>{ fecharModal(); proxima(); });
  btnReiniciar.addEventListener("click", ()=>{ fecharModal(); iniciar(); });
  window.addEventListener("keydown", (e)=>{
    if(!jogoRodando) return;
    const k = e.key?.toUpperCase();
    if(/^[A-Z]$/.test(k)){
      const b = [...boxTeclado.querySelectorAll("button")].find(x => x.textContent===k);
      if(b && !b.disabled) b.click();
    }
  });
}

function iniciar(){
  jogoRodando = true;
  btnIniciar.disabled = true;
  btnDica.disabled = false;
  pontos = 0;
  ordem = embaralhar([...Array(palavras.length).keys()]);
  idx = -1;
  proxima();
}

function proxima(){
  idx++;
  lblProgresso.textContent = `Palavra ${Math.min(idx+1, palavras.length)} de ${palavras.length}`;
  if(idx >= ordem.length){
    fimDeJogo();
    return;
  }
  vidas = 6;
  dicaUsada = false;
  atualizarHUD();
  palavraAtual = palavras[ordem[idx]];
  exibicao = Array.from({length: palavraAtual.length}, () => "_");
  lblPalavra.textContent = exibicao.join(" ");
  img.src = "assets/menino1.png";
  historico = []; renderHistorico();
  habilitarTeclado(true);
  btnDica.disabled = false;
}

function montarTeclado(){
  boxTeclado.innerHTML = "";
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(const ch of letras){
    const b = document.createElement("button");
    b.textContent = ch;
    b.addEventListener("click", ()=> tentar(ch, b));
    boxTeclado.appendChild(b);
  }
  habilitarTeclado(false);
}

function habilitarTeclado(on){
  boxTeclado.querySelectorAll("button").forEach(b => b.disabled = !on);
}

function tentar(letra, botao){
  botao.disabled = true;
  let acertou = false;

  for(let i=0;i<palavraAtual.length;i++){
    if(palavraAtual[i] === letra){
      exibicao[i] = letra;
      acertou = true;
    }
  }

  lblPalavra.textContent = exibicao.join(" ");
  historico.push({ letra, ok: acertou });
  renderHistorico();

  if(!acertou){
    vidas--;
    pontos = Math.max(0, pontos - 25); // 🔹 perde pontos por erro
    atualizarHUD();
    const passo = Math.min(7, 7 - vidas);
    img.src = `assets/menino${passo}.png`;
  }else{
    pontos += 50; // acerto normal
    atualizarHUD();
  }

  if(vidas <= 0){
    habilitarTeclado(false);
    // 🔹 Remove botão Continuar no modal de derrota
    btnContinuar.style.display = "none";
    btnReiniciar.style.display = "inline-block";
    abrirModal("😢 Fim de jogo", `A palavra era: <strong>${palavraAtual}</strong>`);
    jogoRodando = false;
    btnIniciar.disabled = false;
    btnDica.disabled = true;
    return;
  }

  if(!exibicao.includes("_")){
    pontos += 100;
    atualizarHUD();
    habilitarTeclado(false);
    btnDica.disabled = true;
    // 🔹 Exibe Continuar apenas se ainda houver palavras
    btnContinuar.style.display = "inline-block";
    btnReiniciar.style.display = "inline-block";
    abrirModal("🎉 Parabéns!", `Você acertou: <strong>${palavraAtual}</strong>`);
  }
}

function darDica(){
  if(dicaUsada) return;
  const faltas = [];
  for(let i=0;i<exibicao.length;i++) if(exibicao[i]==="_") faltas.push(i);
  if(!faltas.length) return;
  const pos = faltas[Math.floor(Math.random()*faltas.length)];
  const letra = palavraAtual[pos];
  exibicao[pos] = letra;
  lblPalavra.textContent = exibicao.join(" ");
  historico.push({ letra, ok:true, fromHint:true });
  renderHistorico();
  dicaUsada = true;
  btnDica.disabled = true;
  if(!exibicao.includes("_")){
    pontos += 100;
    atualizarHUD();
    habilitarTeclado(false);
    btnContinuar.style.display = "inline-block";
    btnReiniciar.style.display = "inline-block";
    abrirModal("🎉 Parabéns!", `Você acertou: <strong>${palavraAtual}</strong>`);
  }
}

function atualizarHUD(){
  lblVidas.textContent = `Vidas: ${vidas}`;
  lblPontos.textContent = `Pontos: ${pontos}`;
}

function renderHistorico(){
  ulHistorico.innerHTML = historico.map(h => 
    `<li class="${h.ok ? "hit" : "miss"}">${h.letra}${h.fromHint ? " ⭐" : ""}</li>`
  ).join("");
}

function fimDeJogo(){
  btnContinuar.style.display = "none"; // 🔹 apenas Reiniciar
  btnReiniciar.style.display = "inline-block";
  abrirModal("🏁 Fim!", `Você concluiu todas as palavras.<br><strong>Pontuação: ${pontos}</strong>`);
  jogoRodando = false;
  btnIniciar.disabled = false;
  btnDica.disabled = true;
}

function abrirModal(t, html){
  modalTitle.textContent = t;
  modalMsg.innerHTML = html;
  try{ modal.showModal(); }catch{ modal.setAttribute("open",""); }
}
function fecharModal(){
  try{ modal.close(); }catch{ modal.removeAttribute("open"); }
}

function embaralhar(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
