window.onload = function() {
   best_score = 0;
   inicializar();
}

// PREVINE ALTERAR A SCROLLBAR COM AS SETAS DO TECLADO!
window.addEventListener("keydown", function(e) {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);


// *******************
// *  ESCOPO GLOBAL  *
// *******************

const TELA_INICIAL       = 0;
const TELA_JOGO          = 1;
const TELA_FINAL         = 2;

var NUMERO_DE_INIMIGOS   = 15;
var NUMERO_DE_MOEDAS     = 15;
var NUMERO_DE_VIDAS      = 3;

var gameState = TELA_INICIAL;

var inimigos = [];
var moedas   = [];
var jogador  = [0, 0, 0, 0, 0];
var vidas    = [true, true, true];
var keys     = [];
var speed    = 3;
var dash     = 10;
var atrito   = 0.98;
var vidas_i  = NUMERO_DE_VIDAS - 1;
var best_score = 0;

var gcanvas;
var gcontext;

// SPRITES
var coinImage = new Image();
coinImage.src = "img/moeda.png";

var heartImage = new Image();
heartImage.src = "img/heart.png";

var inimigoImage = new Image();
inimigoImage.src = "img/inimigo2.png";

// AUDIO
var audio_moeda = new Audio('sound/moeda.wav');
var audio_dano = new Audio('sound/dano.wav');
var audio_morte = new Audio('sound/morte.wav');
var audio_vitoria = new Audio('sound/vitoria.wav');

var audio_abertura = new Audio('sound/abertura2.mp3');
var audio_jogo = new Audio('sound/jogo.mp3');


// ***********************
// *   FUNÇÕES DO JOGO   *
// ***********************

function inicializar()
{
   canvas = document.getElementById("canvas");
   context = canvas.getContext("2d");

   gcanvas = canvas;
   gcontext = context;

   context.fillStyle = "#FFFFFF";
   context.font      = "16pt silkscreen";
   context.textAlign = "center";

   inicializarObjetos(canvas, context);
   setInterval(function() { mainLoop(canvas, context); }, 30);

   // --- REGISTRANDO FUNÇÕES PARA EVENTOS ---
   document.addEventListener('keydown', tecladoDown);
   document.addEventListener('keyup', tecladoUp);
}


function mainLoop(canvas, context)
{
   context.clearRect(0, 0, canvas.width, canvas.height);

   switch(gameState)
   {
   case TELA_INICIAL: // TELA INICIAL
      inicio(canvas, context);
      break;

   case TELA_JOGO: // JOGO
      jogo(canvas, context);
      break;

   case TELA_FINAL: // TELA FINAL
      final(canvas, context);
      break;
   }
}

// --- FUNÇÃO RESPONSÁVEL POR DESENHAR A TELA INICIAL ---
function inicio(canvas, context)
{
   NUMERO_DE_MOEDAS = 5;
   audio_abertura.play();

   atualizaMoedas(canvas, context);

   for(var i = 0; i < NUMERO_DE_MOEDAS; i++)  
   {
      desenhaMoeda(context, moedas[i][4], moedas[i][0], moedas[i][1]);

      if(moedas[i][4] < 9)
         moedas[i][4]++;
      else
         moedas[i][4] = 0;
   }

   context.fillStyle = "#FFFFFF";
   //context.fillStyle = "#FF4489";

   context.fillText("Colete o maximo de moedas que conseguir!", canvas.width / 2, canvas.height / 2 - 155);
   context.fillText("Mas nao deixe o alien te comer! :)", canvas.width / 2, canvas.height / 2 - 125);
   context.fillText("utilize as setas do teclado", canvas.width / 2, canvas.height / 2 - 15);
   context.fillText("para jogar", canvas.width / 2, canvas.height / 2 + 15);

   context.fillStyle = "#FF4489";
   context.fillText("Pressione <ENTER>", canvas.width / 2, canvas.height / 2 + 125);
}

// --- FUNÇÃO RESPONSÁVEL POR DESENHAR O JOGO (JOGADOR, INIMIGOS, ETC) ---
function jogo(canvas, context)
{
   atualizaJogador(canvas, context);
   atualizaMoedas(canvas, context);
   atualizaInimigos(canvas, context);
   testeColisao(canvas, context);
   desenhaTudo(canvas, context);
}

// --- FUNÇÃO  RESPONSÁVEL POR EXIBIR A TELA DE PONTUAÇÃO ---
function final(canvas, context)
{
   context.textAlign = "center";
   context.fillStyle = "#FFFFFF";

   if(vidas_i == 0)
   {
      NUMERO_DE_INIMIGOS = 15;
      atualizaInimigos(canvas, context);

      for(var i = 0; i < NUMERO_DE_INIMIGOS; i++)  
      {
         desenhaInimigo1(context, inimigos[i][4], inimigos[i][0], inimigos[i][1]);

         if(inimigos[i][4] < 2)
            inimigos[i][4]++;
         else
            inimigos[i][4] = 0;
      }

      context.fillText("Xiii... Infelizmente voce", canvas.width / 2, canvas.height / 2 - 125);
      context.fillText("nao coletou moedas suficientes. =/", canvas.width / 2, canvas.height / 2 - 100);
   }
   else
   {
      NUMERO_DE_MOEDAS = 15;
      atualizaMoedas(canvas, context);

      for(var i = 0; i < NUMERO_DE_MOEDAS; i++)  
      {
         desenhaMoeda(context, moedas[i][4], moedas[i][0], moedas[i][1]);

         if(moedas[i][4] < 9)
            moedas[i][4]++;
         else
            moedas[i][4] = 0;
      }

      context.fillText("PARABENS!!!", canvas.width / 2, canvas.height / 2 - 125);
      context.fillText("VOCE COLETOU TODAS AS MOEDAS !!! =D", canvas.width / 2, canvas.height / 2 - 100);
   }

   context.fillStyle = "#FF4489";
   context.fillText("Suas moedas", canvas.width / 2, canvas.height / 2);
   context.fillText(jogador[4], canvas.width / 2, canvas.height / 2 + 25);
   context.fillStyle = "#FFFFFF";
   context.fillText("Fim de jogo!", canvas.width / 2, canvas.height / 2 + 145);
}


// **********************************************
// *  FUNÇÃO DE TRATAMENTO DOS OBJETOS DO JOGO  *
// **********************************************

function inicializarObjetos(canvas, context)
{
   // INICILIANDO DADOS DAS MOEDAS !!!
   for(var i = 0; i < NUMERO_DE_MOEDAS; i++)
   {
      var data = [0, 0, 0, 0, 0];

      data[0] = Math.floor(Math.random() * (canvas.width - 44)); // POSIÇÃO NO EIXO X
      data[1] = -40; // POSIÇÃO NO EIXO Y
      data[2] = Math.floor(Math.random() * 2 - 2); // VELOCIDADE NO EIXO X
      data[3] = Math.floor(Math.random() * 3 + 1); // VELOCIDADE NO EIXO Y
      data[4] = 0; // ÍNDICE DO QUADRO ATUAL

      moedas.push(data);
   }

   // INICIALIZANDO DADOS DOS INIMIGOS !!!
   for(var i = 0; i < NUMERO_DE_INIMIGOS; i++)
   {
      var data = [0, 0, 0, 0, 0];

      data[0] = Math.floor(Math.random() * (canvas.width - 44));
      data[1] = -40;
      data[2] = Math.floor(Math.random() * 2 - 2);
      data[3] = Math.floor(Math.random() * 3 + 1);
      data[4] = 0;

      inimigos.push(data);
   }

   // INICIALIZANDO DADOS DO JOGADOR !
   jogador[0] = canvas.width / 2 - 45;
   jogador[1] = canvas.height - 25;
   jogador[2] = 0;
   jogador[5] = 0;
}

function desenhaMoeda(context, frameIndex, x, y)
{
   context.drawImage(coinImage, frameIndex * 440 / 10, 0, 44, 40, x, y, 44, 40); 
}

function desenhaInimigo1(context, frameIndex, x, y)
{
   context.drawImage(inimigoImage, frameIndex * 201 / 3, 0, 67, 58, x, y, 67, 58);
}

function desenhaInimigo(canvas, context, x, y, color)
{
   context.fillStyle = color;
   context.strokeRect(x, y, 44, 40)
}

function desenhaJogador(canvas, context, x, y, color)
{
   context.fillStyle = color;
   context.fillRect(x, y, 90, 15);
}

function desenhaCoracao(frameIndex, x, y)
{
   context.drawImage(heartImage, x, y); 
}

function desenhaTudo(canvas, context)
{
   // DESENHA TODAS AS MOEDAS !
   for(var i = 0; i < NUMERO_DE_MOEDAS; i++)
   {
      desenhaMoeda(context, moedas[i][4], moedas[i][0], moedas[i][1]);

      if(moedas[i][4] < 9)
         moedas[i][4]++;
      else
         moedas[i][4] = 0;
   }

   // DESENHA TODOS OS INIMIGOS !
   for(var i = 0; i < NUMERO_DE_INIMIGOS; i++)
   {
      var red = Math.floor(Math.random() * 255);
      var green = Math.floor(Math.random() * 255);
      var blue = Math.floor(Math.random() * 255);
      color = "rgb(" + red + ", " + green + ", " + blue + ")";

      //desenhaInimigo(canvas, context, inimigos[i][0], inimigos[i][1], color);
      desenhaInimigo1(context, inimigos[i][4], inimigos[i][0], inimigos[i][1]);

      if(inimigos[i][4] < 2)
         inimigos[i][4]++;
      else
         inimigos[i][4] = 0;
   }

   // DESENHA VIDAS !
   var vida_x = 550;
   for(var i = 0; i < NUMERO_DE_VIDAS; i++)
   {
      if(vidas[i])
      {
         desenhaCoracao(0, vida_x, 10);
         vida_x += 25;
      }
   }

   desenhaJogador(canvas, context, jogador[0], jogador[1], "#FFFFFF");

   context.textAlign = "left";
   context.fillText("moedas: " + jogador[4], 5, 20);

   context.fillText("best score: " + best_score, 205, 20);
}

// *****************************************************
// *  FUNÇÃO DE TRATAMENTO DA FÍSICA ENTRE OS OBJETOS  *
// *****************************************************

function atualizaMoedas(canvas, context)
{
   for(var i = 0; i < NUMERO_DE_MOEDAS; i++)
   {
      // ATUALIZA POSIÇÃO VERTICAL
      if(moedas[i][1] > canvas.height)  
      {
         moedas[i][0] = Math.floor(Math.random() * (canvas.width - 44));
         moedas[i][2] = Math.floor(Math.random() * 2 + 1);
         moedas[i][3] = Math.floor(Math.random() * 3 + 1);
         moedas[i][1] = -40;
      }
      else
      {
         moedas[i][1] += moedas[i][3];
      }

      // ATUALIZA POSIÇÃO HORIZONTAL
      // COLISÃO COM A PAREDE DIREITA
      if(moedas[i][0] > canvas.width - 44)
      {
         moedas[i][0] = canvas.width - 44;
         moedas[i][2] = Math.floor(Math.random() * 3 + 1);
         moedas[i][3] = Math.floor(Math.random() * 3 + 1);
         moedas[i][2] = moedas[i][2] * -1;
      }
      else
         moedas[i][0] += moedas[i][2];

      // COLISÃO COM A PAREDE ESQUERDA
      if(moedas[i][0] < 0)
      {
         moedas[i][2] = Math.floor(Math.random() * 2 + 1);
         moedas[i][3] = Math.floor(Math.random() * 3 + 1);
         moedas[i][0] = 0;
      }
      else
         moedas[i][0] += moedas[i][2];
   }
}

function atualizaInimigos(canvas, context)
{
   for(var i = 0; i < NUMERO_DE_INIMIGOS; i++)
   {
      // ATUALIZA POSIÇÃO VERTICAL
      if(inimigos[i][1] > canvas.height)  
      {
         inimigos[i][0] = Math.floor(Math.random() * (canvas.width - 44));
         inimigos[i][2] = Math.floor(Math.random() * 2 + 1);
         inimigos[i][3] = Math.floor(Math.random() * 3 + 1);
         inimigos[i][1] = -40;
      }
      else
      {
         inimigos[i][1] += inimigos[i][3];
      }

      // ATUALIZA POSIÇÃO HORIZONTAL
      // COLISÃO COM A PAREDE DIREITA
      if(inimigos[i][0] > canvas.width - 44)
      {
         inimigos[i][0] = canvas.width - 44;
         inimigos[i][2] = Math.floor(Math.random() * 6 + 1);
         inimigos[i][3] = Math.floor(Math.random() * 6 + 1);
         inimigos[i][2] = inimigos[i][2] * -1;
      }
      else
         inimigos[i][0] += inimigos[i][2];

      // COLISÃO COM A PAREDE ESQUERDA
      if(inimigos[i][0] < 0)
      {
         inimigos[i][2] = Math.floor(Math.random() * 6 + 1);
         inimigos[i][3] = Math.floor(Math.random() * 6 + 1);
         inimigos[i][0] = 0;
      }
      else
         inimigos[i][0] += inimigos[i][2];
   }
}

function atualizaJogador()
{
   var d = 0;

   if(keys[37])
   {
      // CALCULA VELOCIDADE NO EIXO X - ESQUERDO
      if(jogador[2] > -speed)
         jogador[2]--;
   }

   if(keys[38])
   {
      // CALCULA VELOCIDADE NO EIXO Y - CIMA
      if(jogador[3] > -speed)
         jogador[3]--;
   }

   if(keys[39])
   {
      // CALCULA VELOCIDADE NO EIXO X - DIREITO
      if(jogador[2] < speed)
         jogador[2]++;
   }

   if(keys[40])
   {
      // CALCULA VELOCIDADE NO EIXO Y - BAIXO
      if(jogador[3] < speed)
         jogador[3]++;
   }

   if(keys[32])
   {
      d = dash;
   }

   // APLICA ATRITO NA VELOCIDADE DO EIXO Y
   jogador[3] *= atrito;

   if(jogador[3] >= 0)
      jogador[1] += jogador[3] + d;
   else
      jogador[1] += jogador[3] - d;

   // APLICA ATRITO NA VELOCIDADE DO EIXO X
   jogador[2] *= atrito;

   if(jogador[2] >= 0)
      jogador[0] += jogador[2] + d;
   else
      jogador[0] += jogador[2] - d;

   // CHECAGEM DE COLISÃO
   if(jogador[0] >= canvas.width - 90)
   {
      jogador[0] = canvas.width - 90;
   }
   else if(jogador[0] <= 0)
   {
      jogador[0] = 0;
   }

   if(jogador[1] > canvas.height - 15)
   {
      jogador[1] = canvas.height - 15;
   }
   else if (jogador[1] <= 0)
   {
      jogador[1] = 0;
   }
}

function testeColisao(canvas, context)
{
   // TESTE DE COLISÃO COM AS MOEDAS
   for(var i = 0; i < NUMERO_DE_MOEDAS; i++)
   {
      if(moedas[i][1] + 40 >= jogador[1] &&
         moedas[i][0] + 44 >= jogador[0] &&
         moedas[i][0] <= jogador[0] + 90 &&
         moedas[i][1] <= jogador[1] + 15)
      {
         jogador[4]++;
         audio_moeda.currentTime = 0;
         audio_moeda.play();

         // LIMPA A MOEDA
         moedas[i][0] = Math.floor(Math.random() * (canvas.width - 44));
         moedas[i][2] = Math.floor(Math.random() * 3 + 1);
         moedas[i][3] = Math.floor(Math.random() * 5 + 1);
         moedas[i][1] = -40;

         if(jogador[4] == 15)
         {
            NUMERO_DE_MOEDAS = 6;
            resetMoedas(3);
         }

         if(jogador[4] == 25)
         {
            NUMERO_DE_INIMIGOS = 7;
            NUMERO_DE_MOEDAS = 9;
            resetMoedas(6);
            resetInimigos(5);
         }

         if(jogador[4] == 50)
         {
            audio_jogo.pause();
            audio_jogo.currentTime = 0;
            audio_vitoria.loop = false;
            audio_vitoria.play();
            gameState = TELA_FINAL;
         }  
      }
   }

   // TESTE DE COLISÃO COM OS INIMIGOS
   for(var i = 0; i < NUMERO_DE_INIMIGOS; i++)
   {
      if(inimigos[i][1] + 40 >= jogador[1] &&
         inimigos[i][0] + 44 >= jogador[0] &&
         inimigos[i][0] <= jogador[0] + 90 &&
         inimigos[i][1] <= jogador[1] + 15)
      {
         if(vidas_i > 0)
         {
            audio_dano.currentTime = 0;
            audio_dano.play();
            vidas[vidas_i] = false;
            vidas_i--;
         }
         else
         {
            audio_jogo.pause();
            audio_jogo.currentTime = 0;
            audio_morte.loop = false;
            audio_morte.play();
            gameState = TELA_FINAL;
         }

         inimigos[i][0] = Math.floor(Math.random() * (canvas.width - 44));
         inimigos[i][2] = Math.floor(Math.random() * 3 + 1);
         inimigos[i][3] = Math.floor(Math.random() * 5 + 1);
         inimigos[i][1] = -40;
      }
   }
}

function resetMoedas(x)
{
   for(var i = x; i < NUMERO_DE_MOEDAS; i++)
   {
      moedas[i][0] = Math.floor(Math.random() * (canvas.width - 44)); // POSIÇÃO NO EIXO X
      moedas[i][1] = -40; // POSIÇÃO NO EIXO Y
      moedas[i][2] = Math.floor(Math.random() * 2 - 2); // VELOCIDADE NO EIXO X
      moedas[i][3] = Math.floor(Math.random() * 3 + 1); // VELOCIDADE NO EIXO Y
      moedas[i][4] = 0; // ÍNDICE DO QUADRO ATUAL
   }
}

function resetInimigos(x)
{
   for(var i = x; i < NUMERO_DE_INIMIGOS; i++)
   {
      inimigos[i][0] = Math.floor(Math.random() * (canvas.width - 44));
      inimigos[i][1] = -40;
      inimigos[i][2] = Math.floor(Math.random() * 2 - 2);
      inimigos[i][3] = Math.floor(Math.random() * 3 + 1);
      inimigos[i][4] = 0;
   }
}

// **************************************
// *  FUNÇÕES DE CALLBACK PARA EVENTOS  *
// **************************************

function tecladoDown(e)
{
   // ENTER
   if(e.keyCode == 13)
   {
      if(gameState == TELA_INICIAL)
      {
         audio_abertura.pause();
         audio_abertura.currentTime = 0;
         audio_jogo.play();

         NUMERO_DE_MOEDAS = 3;
         NUMERO_DE_INIMIGOS = 5;
         gameState = TELA_JOGO;
      }
      else if(gameState == TELA_FINAL)
      {
         if(jogador[4] > best_score)
            best_score = jogador[4];

         inimigos  = [];
         moedas    = [];
         jogador   = [0, 0, 0, 0, 0];
         vidas     = [true, true, true];
         vidas_i   = NUMERO_DE_VIDAS - 1;
         gameState = TELA_INICIAL;

         NUMERO_DE_MOEDAS = 15;
         NUMERO_DE_INIMIGOS = 15;

         inicializarObjetos(gcanvas, gcontext);
      }
   }

   // SETA CIMA
   if(e.keyCode == 38)
   {
      keys[e.keyCode] = true;
   }

   // SETA BAIXO
   if(e.keyCode == 40)
   {
      keys[e.keyCode] = true;
   }

   // SETA DIREITO
   if(e.keyCode == 39)
   {
      keys[e.keyCode] = true;
   }

   // SETA ESQUERDO
   if(e.keyCode == 37)
   {
      keys[e.keyCode] = true;
   }

   // ESPAÇO - BACKSPACE
   if(e.keyCode == 32)
   {
      keys[e.keyCode] = true;
   }
}

function tecladoUp(e)
{
   // SETA CIMA
   if(e.keyCode == 38)
   {
      keys[e.keyCode] = false;
   }

   // SETA BAIXO
   if(e.keyCode == 40)
   {
      keys[e.keyCode] = false;
   }

   // SETA DIREITO
   if(e.keyCode == 39)
   {
      keys[e.keyCode] = false;
   }

   // SETA ESQUERDO
   if(e.keyCode == 37)
   {
      keys[e.keyCode] = false;
   }

   // ESPAÇO - BACKSPACE
   if(e.keyCode == 32)
   {
      keys[e.keyCode] = false;
   }
}