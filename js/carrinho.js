document.addEventListener("DOMContentLoaded", () => {
  const listaProdutos = document.getElementById("lista-produtos");

  if (!listaProdutos) {
    console.error("Div lista-produtos não encontrada");
    return;
  }

  produtos.forEach(produto => {
    const card = document.createElement("div");

    card.style.background = "#111";
    card.style.color = "#fff";
    card.style.padding = "15px";
    card.style.marginBottom = "10px";
    card.style.borderRadius = "10px";
    card.style.display = "flex";
    card.style.justifyContent = "space-between";
    card.style.alignItems = "center";

    card.innerHTML = `
      <div>
        <strong>${produto.nome}</strong><br>
        <span style="color:#00ff7f">R$ ${produto.preco.toFixed(2)}</span>
      </div>
      <button class="btn-adicionar">Adicionar</button>
    `;

    listaProdutos.appendChild(card);
  });
});
