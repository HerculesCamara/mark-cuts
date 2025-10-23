chrome.commands.onCommand.addListener((command) => {
  // DEBUG: Mostra no console do background se o comando foi ouvido
  console.log(`Comando recebido: ${command}`);

  if (command === "mark-time") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id) {
        // DEBUG: Mostra para qual aba estamos tentando enviar
        console.log(`Enviando mensagem "MARK_TIME" para a aba: ${tab.id} (URL: ${tab.url})`);

        chrome.tabs.sendMessage(tab.id, {
          action: "MARK_TIME"
        }, (response) => {
          // DEBUG: Esta parte é CRUCIAL. Ela nos diz se o content.js respondeu.
          if (chrome.runtime.lastError) {
            console.error(`Erro ao enviar mensagem: ${chrome.runtime.lastError.message}`);
          } else {
            console.log("Mensagem enviada com sucesso. Resposta do content.js:", response);
          }
        });

      } else {
        console.error("Não foi possível encontrar a aba ativa.");
      }
    });
  }
});