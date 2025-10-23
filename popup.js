// 1. Espera o HTML do popup (popup.html) terminar de carregar
document.addEventListener('DOMContentLoaded', () => {

  // 2. Pega os elementos do HTML que vamos usar
  const listElement = document.getElementById('timestampList');
  const titleElement = document.getElementById('videoTitle');
  const placeholderElement = document.getElementById('placeholder');
  let activeTab; // Guarda a aba ativa para enviar mensagens depois

  // 3. Pergunta ao Chrome: "Qual é a aba que o usuário está vendo?"
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    activeTab = tabs[0]; // Guarda a aba atual

    // 4. Se não houver aba, não faz nada
    if (!activeTab || !activeTab.url) return;

    // 5. Verifica se é uma página de vídeo do YouTube
    if (activeTab.url.includes("youtube.com/watch")) {
      // 6. Extrai o ID do vídeo da URL
      const urlParams = new URLSearchParams(activeTab.url.split('?')[1]);
      const videoId = urlParams.get('v');

      // 7. Atualiza o título no popup
      const videoTitle = activeTab.title.replace(' - YouTube', '');
      titleElement.textContent = videoTitle;

      if (videoId) {
        // 8. Pede ao "Cofre" a lista de tempos salva para ESTE vídeo
        chrome.storage.local.get([videoId], (result) => {
          const timestamps = result[videoId] || [];

          // 9. Verifica se a lista tem alguma coisa
          if (timestamps.length > 0) {
            // Se tem, esconde a mensagem "Nenhuma marcação"
            placeholderElement.style.display = 'none';
            listElement.innerHTML = ''; // Limpa a lista antes de preencher

            // 10. Cria um item <li> para cada tempo salvo
            timestamps.forEach(ts => {
              const listItem = document.createElement('li');

              // --- NOVO ---
              // Monta o HTML com o texto e o botão "Ir para"
              // Adiciona o tempo 'ts.current' no atributo 'data-time' do botão
              listItem.innerHTML = `
                <div class="time-details">
                  <span class="time-range">De: ${ts.before} | Até: ${ts.after}</span>
                  <span class="time-marked">Marcado em: ${ts.current}</span>
                </div>
                <button class="jump-button" data-time="${ts.current}">
                  Ir para
                </button>
              `;
              // --- FIM DO NOVO ---

              // 11. Adiciona o item na lista do popup
              listElement.appendChild(listItem);
            });

            // --- NOVO ---
            // 12. Chama a função para adicionar os cliques nos botões criados
            addClickListenersToButtons();
            // --- FIM DO NOVO ---

          } else {
            // Se a lista está vazia, mostra a mensagem "Nenhuma marcação"
            placeholderElement.style.display = 'block';
          }
        });
      } else {
        // Caso não consiga extrair o videoId da URL
        titleElement.textContent = "Não foi possível identificar o vídeo.";
        placeholderElement.textContent = "Verifique se a URL do YouTube é válida.";
        placeholderElement.style.display = 'block';
      }
    } else {
      // 12. Se não estiver em uma página de vídeo do YouTube
      titleElement.textContent = "Isto não é um vídeo do YouTube.";
      placeholderElement.textContent = "Abra um vídeo no YouTube para ver suas marcações.";
      placeholderElement.style.display = 'block';
    }
  });

  // --- FUNÇÃO NOVA ---
  /**
   * Procura todos os botões com a classe 'jump-button' e adiciona
   * um evento de clique para enviar a mensagem 'JUMP_TO_TIME'.
   */
  function addClickListenersToButtons() {
    // Pega todos os botões que acabamos de criar
    const buttons = document.querySelectorAll('.jump-button');

    // Para cada botão...
    buttons.forEach(button => {
      // Adiciona um "escutador" de clique
      button.addEventListener('click', () => {
        // Pega o tempo que guardamos no 'data-time' (ex: "00:05:30")
        const timeString = button.dataset.time;

        // Se a aba ativa existe...
        if (activeTab && activeTab.id) {
          // Envia a mensagem para o "Espião" (content.js) naquela aba
          chrome.tabs.sendMessage(activeTab.id, {
            action: "JUMP_TO_TIME", // A nova ação que criamos no content.js
            time: timeString        // O tempo para onde pular
          });
        }
      });
    });
  }
  // --- FIM DA FUNÇÃO NOVA ---
});