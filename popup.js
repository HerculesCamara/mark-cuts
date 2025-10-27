// 1. Espera o HTML do popup (popup.html) terminar de carregar
document.addEventListener('DOMContentLoaded', () => {

  // 2. Pega os elementos do HTML que vamos usar
  const listElement = document.getElementById('timestampList');
  const titleElement = document.getElementById('videoTitle');
  const placeholderElement = document.getElementById('placeholder');
  let activeTab; // Guarda a aba ativa

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
            placeholderElement.style.display = 'none';
            listElement.innerHTML = ''; // Limpa a lista antes de preencher

            // 10. Cria um item <li> para cada tempo salvo
            timestamps.forEach(ts => {
              const listItem = document.createElement('li');

              // --- MODIFICADO ---
              // Monta o HTML com o texto e os DOIS botões
              // Os tempos 'ts.before' e 'ts.after' são adicionados como 'data-start' e 'data-end'
              listItem.innerHTML = `
                <div class="time-details">
                  <span class="time-range">De: ${ts.before} | Até: ${ts.after}</span>
                  <span class="time-marked">Marcado em: ${ts.current}</span>
                </div>
                <div class="button-group">
                  <button class="jump-button" data-time="${ts.current}">
                    Ir para
                  </button>
                  <button class="download-button" data-start="${ts.before}" data-end="${ts.after}" data-videoid="${videoId}">
                    Baixar Clipe
                  </button>
                </div>
              `;
              // --- FIM DA MODIFICAÇÃO ---

              listElement.appendChild(listItem);
            });

            // 11. Chama as funções para adicionar os cliques nos botões
            addClickListenersToButtons();

          } else {
            placeholderElement.style.display = 'block';
          }
        });
      } else {
        titleElement.textContent = "Não foi possível identificar o vídeo.";
        placeholderElement.textContent = "Verifique se a URL do YouTube é válida.";
        placeholderElement.style.display = 'block';
      }
    } else {
      titleElement.textContent = "Isto não é um vídeo do YouTube.";
      placeholderElement.textContent = "Abra um vídeo no YouTube para ver suas marcações.";
      placeholderElement.style.display = 'block';
    }
  });

  /**
   * Procura todos os botões e adiciona os eventos de clique.
   */
  function addClickListenersToButtons() {
    const jumpButtons = document.querySelectorAll('.jump-button');
    const downloadButtons = document.querySelectorAll('.download-button');

    // Listener para o botão "Ir para" (continua igual)
    jumpButtons.forEach(button => {
      button.addEventListener('click', () => {
        const timeString = button.dataset.time;
        if (activeTab && activeTab.id) {
          chrome.tabs.sendMessage(activeTab.id, {
            action: "JUMP_TO_TIME",
            time: timeString
          });
        }
      });
    });

    // --- NOVO LISTENER PARA O BOTÃO "BAIXAR CLIPE" ---
    downloadButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Pega os tempos e o ID do vídeo dos atributos 'data-'
        const startTime = button.dataset.start;
        const endTime = button.dataset.end;
        const videoId = button.dataset.videoid;

        // Monta a URL para o seu site na Vercel com os parâmetros
        // Certifique-se de que a URL base está correta
        const downloadPageUrl = new URL('https://baixarvideosfree.vercel.app/download-clip'); // Use /download-clip ou o nome da sua nova página

        // Adiciona os parâmetros à URL
        downloadPageUrl.searchParams.append('v', videoId);
        downloadPageUrl.searchParams.append('start', startTime);
        downloadPageUrl.searchParams.append('end', endTime);

        // Abre a URL montada em uma nova aba do navegador
        chrome.tabs.create({ url: downloadPageUrl.toString() });
      });
    });
    // --- FIM DO NOVO LISTENER ---
  }
});