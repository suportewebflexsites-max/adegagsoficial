const listaProdutos = document.getElementById("lista-produtos");

function carregarProdutos() {
  listaProdutos.innerHTML = "";

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
      <button style="
        background:#00c853;
        border:none;
        padding:10px 15px;
        border-radius:8px;
        cursor:pointer;
      ">
        Adicionar
      </button>
    `;

    listaProdutos.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", carregarProdutos);

