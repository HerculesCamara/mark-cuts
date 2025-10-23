// 1. O "Espião" fica ouvindo mensagens (cartas) do "Ouvinte" (background.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // 2. Verifica qual ação deve tomar
  if (request.action === "MARK_TIME") {
    // --- LÓGICA ANTIGA (MARCAR O TEMPO) ---
    const videoElement = document.querySelector('video');

    if (videoElement) {
      const currentTimeInSeconds = videoElement.currentTime;
      const oneMinuteBefore = Math.max(0, currentTimeInSeconds - 60);
      const oneMinuteAfter = currentTimeInSeconds + 60;
      const timestampData = {
        current: formatTime(currentTimeInSeconds),
        before: formatTime(oneMinuteBefore),
        after: formatTime(oneMinuteAfter)
      };
      saveTimestamp(timestampData, sendResponse);

    } else {
      console.error("Marcador de Tempos: Player de vídeo não encontrado.");
      sendResponse({ success: false, error: "Vídeo não encontrado" });
    }
    
    // Retorna 'true' para resposta assíncrona
    return true; 
    // --- FIM DA LÓGICA ANTIGA ---

  } else if (request.action === "JUMP_TO_TIME") {
    // --- LÓGICA NOVA (PULAR PARA O TEMPO) ---
    jumpToTime(request.time);
    sendResponse({ success: true, message: `Pulando para ${request.time}` });
    // Não precisa de 'return true' pois a resposta é síncrona
    // --- FIM DA LÓGICA NOVA ---
  }
});


// --- FUNÇÃO NOVA ---
/**
 * Pula o vídeo para um tempo específico.
 * @param {string} timeString - O tempo no formato "HH:MM:SS"
 */
function jumpToTime(timeString) {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    // Converte o tempo "HH:MM:SS" de volta para segundos
    const timeInSeconds = formatTimeToSeconds(timeString);
    
    // Define o tempo do vídeo
    videoElement.currentTime = timeInSeconds;
    
    // Opcional: dá play no vídeo caso ele esteja pausado
    videoElement.play(); 
  }
}
// --- FIM DA FUNÇÃO NOVA ---


/**
 * Salva o objeto de timestamp no chrome.storage.local
 * (Esta função permanece exatamente igual)
 */
function saveTimestamp(timestampData, sendResponse) {
  // 1. Pega o ID do vídeo (ex: "d6MlKLB2A18") pela URL da página
  const videoId = new URLSearchParams(window.location.search).get('v');

  if (!videoId) {
    console.error("Marcador de Tempos: ID do vídeo não encontrado na URL.");
    sendResponse({ success: false, error: "ID do vídeo não encontrado" });
    return;
  }

  // 2. Pede ao "Cofre" a lista de tempos que já salvamos para ESTE vídeo
  chrome.storage.local.get([videoId], (result) => {
    // 3. Pega a lista antiga ou cria uma nova lista vazia
    const existingTimestamps = result[videoId] || [];

    // 4. Adiciona o novo tempo na lista
    existingTimestamps.push(timestampData);

    // 5. Salva a lista atualizada de volta no "Cofre"
    chrome.storage.local.set({ [videoId]: existingTimestamps }, () => {
      console.log(`Marcador de Tempos: Tempo salvo para ${videoId} -> ${timestampData.current}`);
      // 6. Responde à mensagem dizendo que deu tudo certo
      sendResponse({ success: true, timestamp: timestampData.current });
    });
  });
}

/**
 * Converte segundos para um formato HH:MM:SS
 * (Esta função permanece exatamente igual)
 */
function formatTime(totalSeconds) {
  // Multiplica por 1000 para converter segundos em milissegundos
  const date = new Date(totalSeconds * 1000);
  // Extrai o tempo no formato "HH:mm:ss"
  return date.toISOString().substr(11, 8);
}


// --- FUNÇÃO NOVA ---
/**
 * Converte um formato "HH:MM:SS" de volta para segundos.
 * @param {string} timeString - O tempo no formato "HH:MM:SS"
 */
function formatTimeToSeconds(timeString) {
  const parts = timeString.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    // Calcula o total de segundos
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  return 0; // Retorna 0 se o formato for inválido
}
// --- FIM DA FUNÇÃO NOVA ---