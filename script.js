const STORAGE = {
  barbearias: "barberverse_barbearias",
  usuario: "barberverse_usuario",
  favoritos: "barberverse_favoritos",
  agendamentos: "barberverse_agendamentos"
};

function ler(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
}

function salvar(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

let barbearias = ler(STORAGE.barbearias, []);
let usuario = ler(STORAGE.usuario, null);
let favoritos = ler(STORAGE.favoritos, []);
let agendamentos = ler(STORAGE.agendamentos, []);
let mapa = null;
let marcadores = [];

const cidades = {
  "Mirandiba": [-8.122, -38.728],
  "Carnaubeira da Penha": [-8.318, -38.748],
  "Cachoeirinha": [-8.486, -37.235]
};

function escapar(valor = "") {
  return String(valor).replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caractere]);
}

function abrirModal(id) {
  document.getElementById(id).classList.add("active");
  document.body.style.overflow = "hidden";
}

function fecharModais() {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

function abrirLogin() {
  if (usuario) {
    document.getElementById("tituloLogin").textContent = "Seu perfil";
    document.getElementById("nomeUsuario").value = usuario.nome;
    document.getElementById("telefoneUsuario").value = usuario.telefone;

    const botao = document.querySelector("#formLogin button");
    botao.textContent = "Atualizar perfil";

    let sair = document.getElementById("sairConta");
    if (!sair) {
      sair = document.createElement("button");
      sair.id = "sairConta";
      sair.type = "button";
      sair.className = "outline-btn full";
      sair.textContent = "Sair da conta";
      sair.onclick = sairDaConta;
      document.getElementById("formLogin").appendChild(sair);
    }
  } else {
    document.getElementById("tituloLogin").textContent = "Entre no Barberverse";
    document.getElementById("formLogin").reset();
    document.querySelector("#formLogin button").textContent = "Continuar";
    document.getElementById("sairConta")?.remove();
  }

  abrirModal("loginModal");
}

function sairDaConta() {
  usuario = null;
  salvar(STORAGE.usuario, null);
  document.getElementById("sairConta")?.remove();
  fecharModais();
  atualizarTudo();
}

function abrirCadastro() {
  if (!usuario) {
    alert("Entre com seu nome e telefone antes de cadastrar uma barbearia.");
    abrirLogin();
    return;
  }
  abrirModal("cadastroModal");
}

document.getElementById("formLogin").addEventListener("submit", evento => {
  evento.preventDefault();

  usuario = {
    nome: document.getElementById("nomeUsuario").value.trim(),
    telefone: document.getElementById("telefoneUsuario").value.trim()
  };

  if (!usuario.nome || !usuario.telefone) {
    alert("Preencha seu nome e telefone.");
    return;
  }

  salvar(STORAGE.usuario, usuario);
  fecharModais();
  atualizarTudo();
  alert("Perfil salvo neste navegador!");
});

document.getElementById("formBarbearia").addEventListener("submit", evento => {
  evento.preventDefault();

  if (!usuario) {
    alert("Entre na sua conta primeiro.");
    return;
  }

  const nome = document.getElementById("barberNome").value.trim();
  const cidade = document.getElementById("barberCidade").value;
  const endereco = document.getElementById("barberEndereco").value.trim();
  const telefone = document.getElementById("barberTelefone").value.trim();

  if (!nome || !cidade || !endereco || !telefone) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  const foto = document.getElementById("barberFoto").value.trim();

  if (foto && !/^https?:\/\//i.test(foto)) {
    alert("Informe um link de foto válido começando com https:// ou http://.");
    return;
  }

  const novaBarbearia = {
    id: Date.now().toString(),
    nome,
    cidade,
    endereco,
    bairro: document.getElementById("barberBairro").value.trim(),
    telefone,
    responsavel: document.getElementById("barberResponsavel").value.trim(),
    horario: document.getElementById("barberHorario").value.trim(),
    preco: document.getElementById("barberPreco").value,
    servicos: document.getElementById("barberServicos").value.trim(),
    descricao: document.getElementById("barberDescricao").value.trim(),
    equipe: document.getElementById("barberEquipe").value.trim(),
    foto,
    proprietario: usuario.telefone,
    avaliacoes: [],
    criadoEm: new Date().toISOString()
  };

  barbearias.unshift(novaBarbearia);
  salvar(STORAGE.barbearias, barbearias);

  document.getElementById("formBarbearia").reset();
  fecharModais();
  atualizarTudo();

  alert("Barbearia cadastrada com sucesso!");
});

function mediaAvaliacoes(barbearia) {
  const avaliacoes = barbearia.avaliacoes || [];
  if (!avaliacoes.length) return 0;

  const total = avaliacoes.reduce((soma, item) => soma + Number(item.nota), 0);
  return total / avaliacoes.length;
}

function estrelas(nota) {
  const arredondada = Math.round(nota);
  return "★".repeat(arredondada) + "☆".repeat(5 - arredondada);
}

function cardBarbearia(b) {
  const media = mediaAvaliacoes(b);
  const quantidade = (b.avaliacoes || []).length;
  const foto = b.foto && /^https?:\/\//i.test(b.foto);

  return `
    <article class="barber-card">
      <div class="card-image">
        ${foto
          ? `<img src="${escapar(b.foto)}" alt="Foto de ${escapar(b.nome)}" loading="lazy">`
          : `<div class="image-placeholder">BV</div>`}
        <span class="city-tag">${escapar(b.cidade)}</span>
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3>${escapar(b.nome)}</h3>
          <span class="rating">${media ? estrelas(media) : "☆☆☆☆☆"}</span>
        </div>

        <p class="card-address">⌖ ${escapar(b.bairro ? b.bairro + ", " : "")}${escapar(b.endereco)}</p>

        <p class="card-description">
          ${escapar(b.descricao || "Conheça este estabelecimento e descubra os serviços disponíveis.")}
        </p>

        <div class="card-meta">
          <span>★ ${media ? media.toFixed(1) : "Novo"} (${quantidade})</span>
          <span>${b.preco ? "A partir de R$ " + escapar(b.preco) : "Consulte preços"}</span>
        </div>

        <div class="card-actions">
          <button onclick="verDetalhes('${b.id}')">Ver detalhes</button>
          <button class="favorite" onclick="alternarFavorito('${b.id}')">
            ${favoritos.includes(b.id) ? "♥ Salvo" : "♡ Favoritar"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderizarBarbearias() {
  const busca = document.getElementById("busca").value.toLowerCase().trim();
  const cidade = document.getElementById("filtroCidade").value;
  const ordem = document.getElementById("filtroOrdem").value;

  let lista = barbearias.filter(b => {
    const texto = [
      b.nome, b.cidade, b.bairro, b.endereco,
      b.equipe, b.servicos, b.descricao
    ].join(" ").toLowerCase();

    return texto.includes(busca) && (!cidade || b.cidade === cidade);
  });

  if (ordem === "avaliacao") {
    lista.sort((a, b) => mediaAvaliacoes(b) - mediaAvaliacoes(a));
  } else if (ordem === "nome") {
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
  } else {
    lista.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }

  const container = document.getElementById("listaBarbearias");

  document.getElementById("resultadoTexto").textContent =
    `${lista.length} estabelecimento(s) encontrado(s)`;

  if (!lista.length) {
    container.innerHTML = `
      <div class="empty">
        <h3>Nenhuma barbearia encontrada</h3>
        <p>Experimente mudar sua busca ou cadastre o primeiro estabelecimento.</p>
      </div>`;
  } else {
    container.innerHTML = lista.map(cardBarbearia).join("");
  }
}

function verDetalhes(id) {
  const b = barbearias.find(item => item.id === id);
  if (!b) return;

  const media = mediaAvaliacoes(b);
  const avaliacoes = b.avaliacoes || [];
  const equipe = b.equipe
    ? b.equipe.split(",").map(nome => nome.trim()).filter(Boolean)
    : [];

  const foto = b.foto && /^https?:\/\//i.test(b.foto);

  document.getElementById("detalheConteudo").innerHTML = `
    <span class="eyebrow">PERFIL DO ESTABELECIMENTO</span>
    <h2>${escapar(b.nome)}</h2>

    <div class="detail-cover">
      ${foto ? `<img src="${escapar(b.foto)}" alt="${escapar(b.nome)}">` : ""}
    </div>

    <p>${escapar(b.descricao || "Bem-vindo ao perfil desta barbearia no Barberverse.")}</p>

    <div class="detail-info">
      <div><strong>Localização</strong>${escapar(b.endereco)}, ${escapar(b.cidade)}</div>
      <div><strong>Telefone</strong>${escapar(b.telefone)}</div>
      <div><strong>Funcionamento</strong>${escapar(b.horario || "Consulte o estabelecimento")}</div>
      <div><strong>Preço inicial</strong>${b.preco ? "R$ " + escapar(b.preco) : "Consulte"}</div>
      <div><strong>Serviços</strong>${escapar(b.servicos || "Consulte os serviços")}</div>
      <div><strong>Avaliação</strong>${media ? media.toFixed(1) + " / 5" : "Ainda sem avaliações"}</div>
    </div>

    ${equipe.length ? `
      <h3>Profissionais</h3>
      <p>${equipe.map(escapar).join(" • ")}</p>
    ` : ""}

    <div class="card-actions" style="margin:20px 0">
      <button onclick="agendar('${b.id}')">Agendar horário</button>
      <button onclick="abrirAvaliacao('${b.id}')">Avaliar</button>
      <button onclick="abrirWhatsApp('${b.id}')">WhatsApp</button>
    </div>

    <h3>Avaliações dos clientes (${avaliacoes.length})</h3>
    ${avaliacoes.length ? avaliacoes.map(a => `
      <div class="review">
        <strong>${escapar(a.nome)}</strong>
        <div class="review-stars">${estrelas(Number(a.nota))}</div>
        <p>${escapar(a.texto)}</p>
      </div>
    `).join("") : `<p class="small-note">Esta barbearia ainda não recebeu avaliações.</p>`}
  `;

  abrirModal("detalheModal");
}

function abrirWhatsApp(id) {
  const b = barbearias.find(item => item.id === id);
  if (!b) return;

  const numero = b.telefone.replace(/\D/g, "");
  if (numero.length < 10) {
    alert("O telefone cadastrado não parece ter um número válido.");
    return;
  }

  const numeroCompleto = numero.startsWith("55") ? numero : "55" + numero;
  window.open(`https://wa.me/${numeroCompleto}`, "_blank");
}

function abrirAvaliacao(id) {
  if (!usuario) {
    alert("Entre no seu perfil para avaliar uma barbearia.");
    abrirLogin();
    return;
  }

  document.getElementById("avaliacaoId").value = id;
  document.getElementById("avaliacaoNome").value = usuario.nome;
  document.getElementById("avaliacaoTexto").value = "";
  abrirModal("avaliacaoModal");
}

document.getElementById("formAvaliacao").addEventListener("submit", evento => {
  evento.preventDefault();

  const id = document.getElementById("avaliacaoId").value;
  const b = barbearias.find(item => item.id === id);
  if (!b) return;

  const texto = document.getElementById("avaliacaoTexto").value.trim();
  if (!texto) return;

  b.avaliacoes = b.avaliacoes || [];

  // Evita mais de uma avaliação por telefone nesta demonstração.
  const jaAvaliou = b.avaliacoes.some(a => a.telefone === usuario.telefone);
  if (jaAvaliou) {
    alert("Este telefone já avaliou esta barbearia nesta demonstração.");
    return;
  }

  b.avaliacoes.push({
    nome: usuario.nome,
    telefone: usuario.telefone,
    nota: Number(document.getElementById("avaliacaoNota").value),
    texto,
    data: new Date().toISOString()
  });

  salvar(STORAGE.barbearias, barbearias);
  fecharModais();
  atualizarTudo();
  alert("Avaliação registrada!");
});

function alternarFavorito(id) {
  if (!usuario) {
    alert("Entre no seu perfil para salvar favoritos.");
    abrirLogin();
    return;
  }

  favoritos = favoritos.includes(id)
    ? favoritos.filter(item => item !== id)
    : [...favoritos, id];

  salvar(STORAGE.favoritos, favoritos);
  renderizarBarbearias();
}

function agendar(id) {
  if (!usuario) {
    alert("Entre no seu perfil antes de agendar.");
    abrirLogin();
    return;
  }

  const b = barbearias.find(item => item.id === id);
  if (!b) return;

  const data = prompt("Qual a data desejada? Use o formato DD/MM/AAAA:");
  if (!data) return;

  const horario = prompt("Qual horário você prefere? Ex.: 14:30:");
  if (!horario) return;

  const servico = prompt("Qual serviço deseja? Ex.: corte, barba:");
  if (!servico) return;

  const confirmacao = confirm(
    `Confirmar pedido de agendamento?\n\n` +
    `${b.nome}\n${data} às ${horario}\nServiço: ${servico}\n\n` +
    `Este pedido ainda precisa ser confirmado diretamente com a barbearia.`
  );

  if (!confirmacao) return;

  agendamentos.push({
    id: Date.now().toString(),
    barbeariaId: id,
    barbearia: b.nome,
    cliente: usuario.nome,
    telefone: usuario.telefone,
    data,
    horario,
    servico,
    status: "Aguardando confirmação"
  });

  salvar(STORAGE.agendamentos, agendamentos);
  alert("Pedido salvo! Entre em contato com a barbearia para confirmar o horário.");
}

function inicializarMapa() {
  if (!window.L) {
    document.getElementById("map").innerHTML =
      "<p style='padding:25px'>Não foi possível carregar o mapa. Verifique sua conexão com a internet.</p>";
    return;
  }

  mapa = L.map("map").setView([-8.25, -38.1], 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  atualizarMapa();
}

function atualizarMapa() {
  if (!mapa) return;

  marcadores.forEach(marcador => mapa.removeLayer(marcador));
  marcadores = [];

  barbearias.forEach(b => {
    const coordenadas = cidades[b.cidade];
    if (!coordenadas) return;

    const marcador = L.marker(coordenadas).addTo(mapa);

    marcador.bindPopup(`
      <strong>${escapar(b.nome)}</strong><br>
      ${escapar(b.cidade)}<br>
      <button onclick="verDetalhes('${b.id}')">Ver perfil</button>
    `);

    marcadores.push(marcador);
  });
}

function atualizarTudo() {
  renderizarBarbearias();
  atualizarMapa();

  document.getElementById("totalBarbearias").textContent = barbearias.length;

  const total = barbearias.reduce(
    (soma, b) => soma + (b.avaliacoes || []).length, 0
  );

  document.getElementById("totalAvaliacoes").textContent = total;
}

document.getElementById("busca").addEventListener("input", renderizarBarbearias);
document.getElementById("filtroCidade").addEventListener("change", renderizarBarbearias);
document.getElementById("filtroOrdem").addEventListener("change", renderizarBarbearias);

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("open");
});

document.querySelectorAll("#nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("nav").classList.remove("open");
  });
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", evento => {
    if (evento.target === modal) fecharModais();
  });
});

document.getElementById("ano").textContent = new Date().getFullYear();

inicializarMapa();
atualizarTudo();
