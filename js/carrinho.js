let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarContador();
}

function atualizarContador() {
  const contador = document.getElementById("contador-carrinho");
  if (contador) {
    const total = carrinho.reduce((soma, item) => soma + item.qtd, 0);
    contador.innerText = total;
  }
}

function adicionarAoCarrinho(produto) {
  const existente = carrinho.find(item => item.id === produto.id);

  if (existente) {
    existente.qtd += 1;
  } else {
    carrinho.push({ ...produto, qtd: 1 });
  }

  salvarCarrinho();
}

document.addEventListener("DOMContentLoaded", () => {
  const listaProdutos = document.getElementById("lista-produtos");

  produtos.forEach(produto => {
    const card = document.createElement("div");
    card.className = "produto-card";

    card.innerHTML = `
      <div>
        <strong>${produto.nome}</strong><br>
        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
      </div>
      <button class="btn-adicionar">Adicionar</button>
    `;

    card.querySelector(".btn-adicionar").onclick = () => {
      adicionarAoCarrinho(produto);
    };

    listaProdutos.appendChild(card);
  });

  atualizarContador();
});
