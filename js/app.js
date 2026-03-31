
const POSTERS = {
    // 'Título do Filme': 'img/nome-do-arquivo.jpg',
};

// ── UTILITÁRIOS ──────────────────────────────────────────────

// Função para exibir alertas temporários na interface
function mostrarAlerta(idAlerta, mensagem, tipo) {
    const el = document.getElementById(idAlerta);
    if (!el) return;
    el.className = 'alert alert-' + tipo;
    el.textContent = mensagem;
    setTimeout(() => { el.className = 'alert d-none'; }, 3500);
}

// Gera um ID único baseado no timestamp e um número aleatório
function gerarId() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

// Formata data e hora para exibição em português brasileiro
function formatarDataHora(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Formata valores monetários em reais brasileiros
function formatarMoeda(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Aplica máscara de CPF no campo de entrada
function mascaraCPF(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 9)      v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
    input.value = v;
}


// ============================================================
//  FILMES — chave localStorage: 'filmes'
// ============================================================

// Salva um novo filme ou edita um existente baseado no campo 'filme-id'
function salvarFilme() {
    const id            = document.getElementById('filme-id').value;
    const titulo        = document.getElementById('filme-titulo').value.trim();
    const genero        = document.getElementById('filme-genero').value.trim();
    const descricao     = document.getElementById('filme-descricao').value.trim();
    const classificacao = document.getElementById('filme-classificacao').value;
    const duracao       = document.getElementById('filme-duracao').value;
    const estreia       = document.getElementById('filme-estreia').value;

    // Validações dos campos obrigatórios
    if (!titulo)                          { mostrarAlerta('alerta-filmes', 'Informe o título do filme.', 'danger'); return; }
    if (!genero)                          { mostrarAlerta('alerta-filmes', 'Informe o gênero do filme.', 'danger'); return; }
    if (!classificacao)                   { mostrarAlerta('alerta-filmes', 'Selecione a classificação.', 'danger'); return; }
    if (!duracao || Number(duracao) <= 0) { mostrarAlerta('alerta-filmes', 'Informe a duração em minutos.', 'danger'); return; }

    const filmes = JSON.parse(localStorage.getItem('filmes') || '[]');
    if (id) {
        // Editar filme existente
        const index = filmes.findIndex(f => f.id === id);
        if (index !== -1) {
            filmes[index] = { id, titulo, genero, descricao, classificacao, duracao: Number(duracao), estreia };
            mostrarAlerta('alerta-filmes', 'Filme "' + titulo + '" atualizado com sucesso!', 'success');
        }
    } else {
        // Adicionar novo filme
        filmes.push({
            id: gerarId(),
            titulo,
            genero,
            descricao,
            classificacao,
            duracao: Number(duracao),
            estreia
        });
        mostrarAlerta('alerta-filmes', 'Filme "' + titulo + '" salvo com sucesso!', 'success');
    }
    localStorage.setItem('filmes', JSON.stringify(filmes));

    limparFormFilme();
    renderFilmes();
}

// Limpa todos os campos do formulário de filmes
function limparFormFilme() {
    document.getElementById('filme-id').value           = '';
    document.getElementById('filme-titulo').value        = '';
    document.getElementById('filme-genero').value        = '';
    document.getElementById('filme-descricao').value     = '';
    document.getElementById('filme-classificacao').value = '';
    document.getElementById('filme-duracao').value       = '';
    document.getElementById('filme-estreia').value       = '';
}

// Preenche o formulário com os dados do filme para edição
function editarFilme(id) {
    const filmes = JSON.parse(localStorage.getItem('filmes') || '[]');
    const filme = filmes.find(f => f.id === id);
    if (!filme) return;

    document.getElementById('filme-id').value           = filme.id;
    document.getElementById('filme-titulo').value        = filme.titulo;
    document.getElementById('filme-genero').value        = filme.genero;
    document.getElementById('filme-descricao').value     = filme.descricao;
    document.getElementById('filme-classificacao').value = filme.classificacao;
    document.getElementById('filme-duracao').value       = filme.duracao;
    document.getElementById('filme-estreia').value       = filme.estreia;
}

// Exclui um filme e suas sessões e ingressos relacionados
function excluirFilme(id) {
    const sessoes   = JSON.parse(localStorage.getItem('sessoes')   || '[]');
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    const sessaoIds = sessoes.filter(s => s.filmeId === id).map(s => s.id);
    const nIng      = ingressos.filter(i => sessaoIds.includes(i.sessaoId)).length;

    let msg = 'Excluir este filme?';
    if (sessaoIds.length > 0) {
        msg += '\n\nIsso também removerá:\n• ' + sessaoIds.length + ' sessão(ões)';
        if (nIng > 0) msg += '\n• ' + nIng + ' ingresso(s) vendido(s)';
    }
    if (!confirm(msg)) return;

    localStorage.setItem('filmes',    JSON.stringify(JSON.parse(localStorage.getItem('filmes') || '[]').filter(f => f.id !== id)));
    localStorage.setItem('sessoes',   JSON.stringify(sessoes.filter(s   => s.filmeId !== id)));
    localStorage.setItem('ingressos', JSON.stringify(ingressos.filter(i => !sessaoIds.includes(i.sessaoId))));
    localStorage.removeItem('poster_' + id);

    let resumo = 'Filme removido';
    if (sessaoIds.length > 0) resumo += ' junto com ' + sessaoIds.length + ' sessão(ões)';
    if (nIng > 0) resumo += ' e ' + nIng + ' ingresso(s)';
    mostrarAlerta('alerta-filmes', resumo + '.', 'warning');
    renderFilmes();
}

// Renderiza a tabela de filmes na página
function renderFilmes() {
    const lista = document.getElementById('lista-filmes');
    const count = document.getElementById('filmes-count');
    if (!lista) return;

    const filmes = JSON.parse(localStorage.getItem('filmes') || '[]');
    if (count) count.textContent = filmes.length;

    if (filmes.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-4">Nenhum filme cadastrado.</p>';
        return;
    }

    let html = '<table class="table table-dark table-hover table-sm mb-0"><thead class="table-secondary"><tr>';
    html += '<th>Título</th><th>Gênero</th><th>Classificação</th><th>Duração</th><th>Estreia</th><th></th>';
    html += '</tr></thead><tbody>';

    for (const f of filmes) {
        const estreia = f.estreia ? new Date(f.estreia + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
        html += '<tr>';
        html += '<td><strong>' + f.titulo + '</strong></td>';
        html += '<td>' + f.genero + '</td>';
        html += '<td><span class="badge bg-warning text-dark">' + f.classificacao + '</span></td>';
        html += '<td>' + f.duracao + ' min</td>';
        html += '<td>' + estreia + '</td>';
        html += '<td>';
        html += '<button class="btn btn-warning btn-sm me-1" onclick="editarFilme(\'' + f.id + '\')">Editar</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="excluirFilme(\'' + f.id + '\')">Excluir</button>';
        html += '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    lista.innerHTML = html;
}


// ============================================================
//  SALAS — chave localStorage: 'salas'
// ============================================================

// Salva uma nova sala ou edita uma existente baseado no campo 'sala-id'
function salvarSala() {
    const id         = document.getElementById('sala-id').value;
    const nome       = document.getElementById('sala-nome').value.trim();
    const capacidade = document.getElementById('sala-capacidade').value;
    const tipo       = document.getElementById('sala-tipo').value;

    // Validações dos campos obrigatórios
    if (!nome)                                  { mostrarAlerta('alerta-salas', 'Informe o nome da sala.', 'danger'); return; }
    if (!capacidade || Number(capacidade) <= 0) { mostrarAlerta('alerta-salas', 'Informe a capacidade.', 'danger'); return; }
    if (!tipo)                                  { mostrarAlerta('alerta-salas', 'Selecione o tipo da sala.', 'danger'); return; }

    const salas = JSON.parse(localStorage.getItem('salas') || '[]');
    if (id) {
        // Editar sala existente
        const index = salas.findIndex(s => s.id === id);
        if (index !== -1) {
            salas[index] = { id, nome, capacidade: Number(capacidade), tipo };
            mostrarAlerta('alerta-salas', 'Sala "' + nome + '" atualizada com sucesso!', 'success');
        }
    } else {
        // Adicionar nova sala
        salas.push({ id: gerarId(), nome, capacidade: Number(capacidade), tipo });
        mostrarAlerta('alerta-salas', 'Sala "' + nome + '" salva com sucesso!', 'success');
    }
    localStorage.setItem('salas', JSON.stringify(salas));

    limparFormSala();
    renderSalas();
}

// Limpa todos os campos do formulário de salas
function limparFormSala() {
    document.getElementById('sala-id').value         = '';
    document.getElementById('sala-nome').value       = '';
    document.getElementById('sala-capacidade').value = '';
    document.getElementById('sala-tipo').value       = '';
}

// Preenche o formulário com os dados da sala para edição
function editarSala(id) {
    const salas = JSON.parse(localStorage.getItem('salas') || '[]');
    const sala = salas.find(s => s.id === id);
    if (!sala) return;

    document.getElementById('sala-id').value         = sala.id;
    document.getElementById('sala-nome').value       = sala.nome;
    document.getElementById('sala-capacidade').value = sala.capacidade;
    document.getElementById('sala-tipo').value       = sala.tipo;
}

// Exclui uma sala e suas sessões e ingressos relacionados
function excluirSala(id) {
    const sessoes   = JSON.parse(localStorage.getItem('sessoes')   || '[]');
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    const sessaoIds = sessoes.filter(s => s.salaId === id).map(s => s.id);
    const nIng      = ingressos.filter(i => sessaoIds.includes(i.sessaoId)).length;

    let msg = 'Excluir esta sala?';
    if (sessaoIds.length > 0) {
        msg += '\n\nIsso também removerá:\n• ' + sessaoIds.length + ' sessão(ões)';
        if (nIng > 0) msg += '\n• ' + nIng + ' ingresso(s) vendido(s)';
    }
    if (!confirm(msg)) return;

    localStorage.setItem('salas',     JSON.stringify(JSON.parse(localStorage.getItem('salas') || '[]').filter(s => s.id !== id)));
    localStorage.setItem('sessoes',   JSON.stringify(sessoes.filter(s   => s.salaId !== id)));
    localStorage.setItem('ingressos', JSON.stringify(ingressos.filter(i => !sessaoIds.includes(i.sessaoId))));

    let resumo = 'Sala removida';
    if (sessaoIds.length > 0) resumo += ' junto com ' + sessaoIds.length + ' sessão(ões)';
    if (nIng > 0) resumo += ' e ' + nIng + ' ingresso(s)';
    mostrarAlerta('alerta-salas', resumo + '.', 'warning');
    renderSalas();
}

// Renderiza a tabela de salas na página
function renderSalas() {
    const lista = document.getElementById('lista-salas');
    const count = document.getElementById('salas-count');
    if (!lista) return;

    const salas = JSON.parse(localStorage.getItem('salas') || '[]');
    if (count) count.textContent = salas.length;

    if (salas.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-4">Nenhuma sala cadastrada.</p>';
        return;
    }

    let html = '<table class="table table-dark table-hover table-sm mb-0"><thead class="table-secondary"><tr>';
    html += '<th>Nome</th><th>Capacidade</th><th>Tipo</th><th></th>';
    html += '</tr></thead><tbody>';

    for (const s of salas) {
        const cor = s.tipo === 'IMAX' ? 'bg-warning text-dark' : s.tipo === '3D' ? 'bg-success' : 'bg-info text-dark';
        html += '<tr>';
        html += '<td><strong>' + s.nome + '</strong></td>';
        html += '<td>' + s.capacidade + ' lugares</td>';
        html += '<td><span class="badge ' + cor + '">' + s.tipo + '</span></td>';
        html += '<td>';
        html += '<button class="btn btn-warning btn-sm me-1" onclick="editarSala(\'' + s.id + '\')">Editar</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="excluirSala(\'' + s.id + '\')">Excluir</button>';
        html += '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    lista.innerHTML = html;
}


// ============================================================
//  SESSÕES — chave localStorage: 'sessoes'
// ============================================================

// Carrega opções de filmes no select especificado
function carregarSelectFilmes(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const filmes = JSON.parse(localStorage.getItem('filmes') || '[]');
    sel.innerHTML = '<option value="">Selecione um filme</option>';
    for (const f of filmes) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.titulo;
        sel.appendChild(opt);
    }
}

// Carrega opções de salas no select especificado
function carregarSelectSalas(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const salas = JSON.parse(localStorage.getItem('salas') || '[]');
    sel.innerHTML = '<option value="">Selecione uma sala</option>';
    for (const s of salas) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nome + ' (' + s.tipo + ' — ' + s.capacidade + ' lugares)';
        sel.appendChild(opt);
    }
}

// Carrega opções de sessões no select especificado
function carregarSelectSessoes(selectId) {
    const sel     = document.getElementById(selectId);
    if (!sel) return;
    const sessoes = JSON.parse(localStorage.getItem('sessoes') || '[]');
    const filmes  = JSON.parse(localStorage.getItem('filmes')  || '[]');
    const salas   = JSON.parse(localStorage.getItem('salas')   || '[]');

    sel.innerHTML = '<option value="">Selecione uma sessão</option>';
    for (const s of sessoes) {
        const filme = filmes.find(f  => f.id  === s.filmeId) || null;
        const sala  = salas.find(sl  => sl.id === s.salaId)  || null;
        const opt   = document.createElement('option');
        opt.value = s.id;
        opt.textContent = (filme ? filme.titulo : '?') + ' — ' + (sala ? sala.nome : '?') + ' — ' + formatarDataHora(s.dataHora) + ' — ' + formatarMoeda(s.preco);
        sel.appendChild(opt);
    }
}

// Salva uma nova sessão ou edita uma existente baseado no campo 'sessao-id'
function salvarSessao() {
    const id       = document.getElementById('sessao-id').value;
    const filmeId  = document.getElementById('sessao-filme').value;
    const salaId   = document.getElementById('sessao-sala').value;
    const dataHora = document.getElementById('sessao-datahora').value;
    const preco    = document.getElementById('sessao-preco').value;
    const idioma   = document.getElementById('sessao-idioma').value;
    const formato  = document.getElementById('sessao-formato').value;

    // Validações dos campos obrigatórios
    if (!filmeId)                          { mostrarAlerta('alerta-sessoes', 'Selecione um filme.', 'danger'); return; }
    if (!salaId)                           { mostrarAlerta('alerta-sessoes', 'Selecione uma sala.', 'danger'); return; }
    if (!dataHora)                         { mostrarAlerta('alerta-sessoes', 'Informe a data e hora.', 'danger'); return; }
    if (preco === '' || Number(preco) < 0) { mostrarAlerta('alerta-sessoes', 'Informe o preço.', 'danger'); return; }
    if (!idioma)                           { mostrarAlerta('alerta-sessoes', 'Selecione o idioma.', 'danger'); return; }
    if (!formato)                          { mostrarAlerta('alerta-sessoes', 'Selecione o formato.', 'danger'); return; }

    const sessoes = JSON.parse(localStorage.getItem('sessoes') || '[]');
    if (id) {
        // Editar sessão existente
        const index = sessoes.findIndex(s => s.id === id);
        if (index !== -1) {
            sessoes[index] = { id, filmeId, salaId, dataHora, preco: Number(preco), idioma, formato };
            mostrarAlerta('alerta-sessoes', 'Sessão atualizada com sucesso!', 'success');
        }
    } else {
        // Adicionar nova sessão
        sessoes.push({ id: gerarId(), filmeId, salaId, dataHora, preco: Number(preco), idioma, formato });
        mostrarAlerta('alerta-sessoes', 'Sessão salva com sucesso!', 'success');
    }
    localStorage.setItem('sessoes', JSON.stringify(sessoes));

    limparFormSessao();
    renderSessoes();
}

// Limpa todos os campos do formulário de sessões
function limparFormSessao() {
    document.getElementById('sessao-id').value       = '';
    document.getElementById('sessao-filme').value    = '';
    document.getElementById('sessao-sala').value     = '';
    document.getElementById('sessao-datahora').value = '';
    document.getElementById('sessao-preco').value    = '';
    document.getElementById('sessao-idioma').value   = '';
    document.getElementById('sessao-formato').value  = '';
}

// Preenche o formulário com os dados da sessão para edição
function editarSessao(id) {
    const sessoes = JSON.parse(localStorage.getItem('sessoes') || '[]');
    const sessao = sessoes.find(s => s.id === id);
    if (!sessao) return;

    document.getElementById('sessao-id').value       = sessao.id;
    document.getElementById('sessao-filme').value    = sessao.filmeId;
    document.getElementById('sessao-sala').value     = sessao.salaId;
    document.getElementById('sessao-datahora').value = sessao.dataHora;
    document.getElementById('sessao-preco').value    = sessao.preco;
    document.getElementById('sessao-idioma').value   = sessao.idioma;
    document.getElementById('sessao-formato').value  = sessao.formato;
}

// Exclui uma sessão e seus ingressos relacionados
function excluirSessao(id) {
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    const nIng = ingressos.filter(i => i.sessaoId === id).length;
    const msg  = 'Excluir esta sessão?' + (nIng > 0 ? '\n\nIsso também removerá ' + nIng + ' ingresso(s).' : '');
    if (!confirm(msg)) return;

    localStorage.setItem('sessoes',   JSON.stringify(JSON.parse(localStorage.getItem('sessoes') || '[]').filter(s => s.id !== id)));
    localStorage.setItem('ingressos', JSON.stringify(ingressos.filter(i => i.sessaoId !== id)));

    mostrarAlerta('alerta-sessoes', 'Sessão removida' + (nIng > 0 ? ' junto com ' + nIng + ' ingresso(s)' : '') + '.', 'warning');
    renderSessoes();
}

// Renderiza a tabela de sessões na página
function renderSessoes() {
    const lista = document.getElementById('lista-sessoes');
    const count = document.getElementById('sessoes-count');
    if (!lista) return;

    const sessoes = JSON.parse(localStorage.getItem('sessoes') || '[]');
    const filmes  = JSON.parse(localStorage.getItem('filmes')  || '[]');
    const salas   = JSON.parse(localStorage.getItem('salas')   || '[]');
    if (count) count.textContent = sessoes.length;

    if (sessoes.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-4">Nenhuma sessão cadastrada.</p>';
        return;
    }

    let html = '<table class="table table-dark table-hover table-sm mb-0"><thead class="table-secondary"><tr>';
    html += '<th>Filme</th><th>Sala</th><th>Data / Hora</th><th>Preço</th><th>Idioma</th><th>Formato</th><th></th>';
    html += '</tr></thead><tbody>';

    for (const s of sessoes) {
        const filme = filmes.find(f  => f.id  === s.filmeId) || null;
        const sala  = salas.find(sl  => sl.id === s.salaId)  || null;
        html += '<tr>';
        html += '<td><strong>' + (filme ? filme.titulo : '<span class="text-danger">Removido</span>') + '</strong></td>';
        html += '<td>' + (sala ? sala.nome : '<span class="text-danger">Removida</span>') + '</td>';
        html += '<td>' + formatarDataHora(s.dataHora) + '</td>';
        html += '<td>' + formatarMoeda(s.preco) + '</td>';
        html += '<td><span class="badge bg-secondary">' + s.idioma + '</span></td>';
        html += '<td><span class="badge bg-info text-dark">' + s.formato + '</span></td>';
        html += '<td>';
        html += '<button class="btn btn-warning btn-sm me-1" onclick="editarSessao(\'' + s.id + '\')">Editar</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="excluirSessao(\'' + s.id + '\')">Excluir</button>';
        html += '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    lista.innerHTML = html;
}


// ============================================================
//  INGRESSOS — chave localStorage: 'ingressos'
// ============================================================

// Limpa o campo de assento quando a sessão muda
function onSessaoChange() {
    document.getElementById('ingresso-assento').value = '';
}

// Salva um novo ingresso ou edita um existente baseado no campo 'ingresso-id'
function salvarIngresso() {
    const id        = document.getElementById('ingresso-id').value;
    const sessaoId  = document.getElementById('ingresso-sessao').value;
    const nome      = document.getElementById('ingresso-nome').value.trim();
    const cpf       = document.getElementById('ingresso-cpf').value.trim();
    const assento   = document.getElementById('ingresso-assento').value.trim().toUpperCase();
    const pagamento = document.getElementById('ingresso-pagamento').value;
    const tipoEl    = document.querySelector('input[name="ingresso-tipo"]:checked');
    const tipo      = tipoEl ? tipoEl.value : 'Inteira';

    // Validações dos campos obrigatórios
    if (!sessaoId)  { mostrarAlerta('alerta-ingressos', 'Selecione uma sessão.', 'danger'); return; }
    if (!nome)      { mostrarAlerta('alerta-ingressos', 'Informe o nome do cliente.', 'danger'); return; }
    if (!cpf)       { mostrarAlerta('alerta-ingressos', 'Informe o CPF.', 'danger'); return; }
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) { mostrarAlerta('alerta-ingressos', 'CPF inválido. Use o formato 000.000.000-00.', 'danger'); return; }
    if (!assento)   { mostrarAlerta('alerta-ingressos', 'Informe o assento (ex: A10).', 'danger'); return; }
    if (!pagamento) { mostrarAlerta('alerta-ingressos', 'Selecione o tipo de pagamento.', 'danger'); return; }

    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');

    // Verifica se o assento já está ocupado
    if (ingressos.some(i => i.id !== id && i.sessaoId === sessaoId && i.assento === assento)) {
        mostrarAlerta('alerta-ingressos', 'Assento ' + assento + ' já está ocupado nesta sessão.', 'danger');
        return;
    }

    const sessoes   = JSON.parse(localStorage.getItem('sessoes') || '[]');
    const sessao    = sessoes.find(s => s.id === sessaoId) || null;
    const precoBase = sessao ? sessao.preco : 0;
    const valorPago = tipo === 'Meia' ? precoBase / 2 : precoBase;

    if (id) {
        // Editar ingresso existente
        const index = ingressos.findIndex(i => i.id === id);
        if (index !== -1) {
            ingressos[index] = {
                id,
                sessaoId,
                nome,
                cpf,
                assento,
                tipo,
                valorPago,
                pagamento,
                vendaEm: ingressos[index].vendaEm // Manter a data original
            };
            mostrarAlerta('alerta-ingressos', 'Ingresso atualizado para ' + nome + ' — Assento ' + assento + '.', 'success');
        }
    } else {
        // Adicionar novo ingresso
        ingressos.push({
            id: gerarId(),
            sessaoId,
            nome,
            cpf,
            assento,
            tipo,
            valorPago,
            pagamento,
            vendaEm: new Date().toISOString()
        });
        mostrarAlerta('alerta-ingressos', 'Ingresso vendido para ' + nome + ' — Assento ' + assento + ' (' + tipo + ' — ' + formatarMoeda(valorPago) + ').', 'success');
    }

    localStorage.setItem('ingressos', JSON.stringify(ingressos));
    limparFormIngresso();
    renderIngressos();
}

// Limpa todos os campos do formulário de ingressos
function limparFormIngresso() {
    document.getElementById('ingresso-id').value       = '';
    document.getElementById('ingresso-sessao').value    = '';
    document.getElementById('ingresso-nome').value      = '';
    document.getElementById('ingresso-cpf').value       = '';
    document.getElementById('ingresso-assento').value   = '';
    document.getElementById('ingresso-pagamento').value = '';
    const inteira = document.getElementById('tipo-inteira');
    if (inteira) inteira.checked = true;
}

// Preenche o formulário com os dados do ingresso para edição
function editarIngresso(id) {
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    const ingresso = ingressos.find(i => i.id === id);
    if (!ingresso) return;

    document.getElementById('ingresso-id').value       = ingresso.id;
    document.getElementById('ingresso-sessao').value    = ingresso.sessaoId;
    document.getElementById('ingresso-nome').value      = ingresso.nome;
    document.getElementById('ingresso-cpf').value       = ingresso.cpf;
    document.getElementById('ingresso-assento').value   = ingresso.assento;
    document.getElementById('ingresso-pagamento').value = ingresso.pagamento;
    const tipoRadio = document.querySelector('input[name="ingresso-tipo"][value="' + ingresso.tipo + '"]');
    if (tipoRadio) tipoRadio.checked = true;
}

// Cancela um ingresso (exclusão)
function excluirIngresso(id) {
    if (!confirm('Cancelar este ingresso?')) return;
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    localStorage.setItem('ingressos', JSON.stringify(ingressos.filter(i => i.id !== id)));
    mostrarAlerta('alerta-ingressos', 'Ingresso cancelado.', 'warning');
    renderIngressos();
}

// Renderiza a tabela de ingressos na página
function renderIngressos() {
    const lista = document.getElementById('lista-ingressos');
    const count = document.getElementById('ingressos-count');
    if (!lista) return;

    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');
    const sessoes   = JSON.parse(localStorage.getItem('sessoes')   || '[]');
    const filmes    = JSON.parse(localStorage.getItem('filmes')    || '[]');
    if (count) count.textContent = ingressos.length;

    if (ingressos.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-3">Nenhum ingresso vendido.</p>';
        return;
    }

    let html = '<table class="table table-dark table-hover table-sm mb-0"><thead class="table-secondary"><tr>';
    html += '<th>Cliente</th><th>CPF</th><th>Filme / Sessão</th><th>Assento</th><th>Tipo</th><th>Valor</th><th>Pagamento</th><th></th>';
    html += '</tr></thead><tbody>';

    for (const ing of ingressos) {
        const sessao  = sessoes.find(s => s.id === ing.sessaoId) || null;
        const filme   = sessao ? (filmes.find(f => f.id === sessao.filmeId) || null) : null;
        const tipoCor = ing.tipo === 'Meia' ? 'bg-warning text-dark' : 'bg-success';

        html += '<tr>';
        html += '<td><strong>' + ing.nome + '</strong></td>';
        html += '<td><small>' + ing.cpf + '</small></td>';
        html += '<td><small>' + (filme ? filme.titulo : '—') + '<br><span class="text-muted">' + (sessao ? formatarDataHora(sessao.dataHora) : '—') + '</span></small></td>';
        html += '<td><span class="badge bg-primary">' + ing.assento + '</span></td>';
        html += '<td><span class="badge ' + tipoCor + '">' + ing.tipo + '</span></td>';
        html += '<td><small>' + formatarMoeda(ing.valorPago) + '</small></td>';
        html += '<td><small>' + ing.pagamento + '</small></td>';
        html += '<td>';
        html += '<button class="btn btn-warning btn-sm me-1" onclick="editarIngresso(\'' + ing.id + '\')">Editar</button>';
        html += '<button class="btn btn-danger btn-sm" onclick="excluirIngresso(\'' + ing.id + '\')">Cancelar</button>';
        html += '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    lista.innerHTML = html;
}


// ============================================================
//  SESSÕES DISPONÍVEIS (sessoes-disponiveis.html)
// ============================================================

// Obtém a fonte do poster do filme (padrão ou salvo)
function getPosterSrc(filme) {
    if (POSTERS[filme.titulo]) return POSTERS[filme.titulo];
    const salvo = localStorage.getItem('poster_' + filme.id);
    return salvo || null;
}

// Faz upload de um poster para um filme específico
function uploadPosterCard(input, filmeId) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try { localStorage.setItem('poster_' + filmeId, e.target.result); }
        catch (err) { alert('Imagem muito grande. Use uma abaixo de 300 KB.'); return; }
        const imgEl = document.getElementById('poster-img-' + filmeId);
        const phEl  = document.getElementById('poster-ph-'  + filmeId);
        const btnEl = document.getElementById('poster-btn-' + filmeId);
        if (imgEl) { imgEl.src = e.target.result; imgEl.style.display = 'block'; }
        if (phEl)  phEl.style.display = 'none';
        if (btnEl) btnEl.firstChild.nodeValue = '🖼️ Trocar foto';
    };
    reader.readAsDataURL(input.files[0]);
}

// Renderiza as sessões disponíveis agrupadas por filme
function renderSessoesDisponiveis() {
    const lista   = document.getElementById('lista-sessoes-disp');
    const spinner = document.getElementById('spinner-filmes');
    if (!lista) return;

    // Esconde o spinner (não há requisições assíncronas)
    if (spinner) spinner.style.display = 'none';

    const sessoes   = JSON.parse(localStorage.getItem('sessoes')   || '[]');
    const filmes    = JSON.parse(localStorage.getItem('filmes')    || '[]');
    const salas     = JSON.parse(localStorage.getItem('salas')     || '[]');
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');

    if (sessoes.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-4 col-12">Nenhuma sessão disponível.</p>';
        return;
    }

    // Agrupa sessões por filmeId
    const grupos = {};
    for (const s of sessoes) {
        if (!grupos[s.filmeId]) grupos[s.filmeId] = [];
        grupos[s.filmeId].push(s);
    }

    lista.innerHTML = '';

    for (const filmeId of Object.keys(grupos)) {
        const filme = filmes.find(f => f.id === filmeId) || null;
        if (!filme) continue;

        const posterSrc  = getPosterSrc(filme);
        const posterHtml =
            '<img id="poster-img-' + filme.id + '" src="' + (posterSrc || '') + '" ' +
                'class="card-img-top" style="aspect-ratio:2/3;object-fit:cover;' + (posterSrc ? '' : 'display:none') + '" ' +
                'onerror="this.style.display=\'none\';document.getElementById(\'poster-ph-' + filme.id + '\').style.display=\'flex\'">' +
            '<div id="poster-ph-' + filme.id + '" style="aspect-ratio:2/3;background:#2b2d42;display:' + (posterSrc ? 'none' : 'flex') + ';align-items:center;justify-content:center;font-size:4rem;">🎬</div>';

        const uploadHtml =
            '<label id="poster-btn-' + filme.id + '" class="btn btn-sm btn-outline-secondary w-100 mt-2" style="cursor:pointer;font-size:0.75rem;">' +
                (posterSrc ? '🖼️ Trocar foto' : '📁 Adicionar foto') +
                '<input type="file" accept="image/*" style="display:none" onchange="uploadPosterCard(this,\'' + filme.id + '\')">' +
            '</label>';

        let sessoesHtml = '';
        for (const s of grupos[filmeId]) {
            const sala     = salas.find(sl => sl.id === s.salaId) || null;
            const vendidos = ingressos.filter(i => i.sessaoId === s.id).length;
            const vagas    = (sala ? sala.capacidade : 0) - vendidos;
            const esgotado = vagas <= 0;
            const badgeCor = esgotado ? 'bg-danger' : vagas <= 10 ? 'bg-warning text-dark' : 'bg-success';

            sessoesHtml += '<a href="./ingressos.html?sessao=' + s.id + '" class="d-block text-decoration-none rounded p-2 mb-2 ' + (esgotado ? 'bg-secondary bg-opacity-25 pe-none' : 'bg-primary bg-opacity-10 border border-primary') + '">';
            sessoesHtml += '<div class="d-flex justify-content-between">';
            sessoesHtml +=   '<div><div class="fw-bold text-white small">' + formatarDataHora(s.dataHora) + '</div>';
            sessoesHtml +=   '<div class="text-muted" style="font-size:.75rem">' + (sala ? sala.nome : '—') + ' · ' + s.idioma + ' · ' + s.formato + '</div></div>';
            sessoesHtml +=   '<div class="text-end"><div class="text-warning fw-bold small">' + formatarMoeda(s.preco) + '</div>';
            sessoesHtml +=   '<span class="badge ' + badgeCor + '" style="font-size:.65rem">' + (esgotado ? 'Esgotado' : vagas + ' vagas') + '</span></div>';
            sessoesHtml += '</div></a>';
        }

        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-xl-3';
        col.innerHTML =
            '<div class="card bg-dark text-white h-100 border-secondary">' +
                '<div class="position-relative">' + posterHtml +
                    '<span class="position-absolute top-0 end-0 m-2 badge" style="background:#212529;color:#ffc107;border:1px solid #ffc107;font-size:.7rem">' + filme.classificacao + '</span>' +
                '</div>' +
                '<div class="card-body d-flex flex-column">' +
                    '<h5 class="card-title fw-bold">' + filme.titulo + '</h5>' +
                    '<p class="card-text text-muted mb-1" style="font-size:.75rem">' + filme.genero + ' · ' + filme.duracao + ' min</p>' +
                    '<p class="card-text small text-secondary mb-2" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">' + (filme.descricao || 'Sem sinopse.') + '</p>' +
                    uploadHtml +
                    '<div class="mt-3 border-top border-secondary pt-2">' +
                        '<p class="small fw-bold mb-2 text-white opacity-75">📅 Sessões</p>' +
                        sessoesHtml +
                    '</div>' +
                '</div>' +
            '</div>';
        lista.appendChild(col);
    }
}


// ============================================================
//  PÁGINA INICIAL (cinema.html)
// ============================================================

// Renderiza o resumo de contadores na página inicial
function renderResumoHome() {
    const chaves = { filmes: 'count-filmes', salas: 'count-salas', sessoes: 'count-sessoes', ingressos: 'count-ingressos' };
    for (const key in chaves) {
        const el = document.getElementById(chaves[key]);
        if (el) el.textContent = JSON.parse(localStorage.getItem(key) || '[]').length;
    }
}

// Renderiza a tabela de sessões na página inicial
function renderSessoesHome() {
    const lista = document.getElementById('lista-sessoes-home');
    if (!lista) return;

    const sessoes   = JSON.parse(localStorage.getItem('sessoes')   || '[]');
    const filmes    = JSON.parse(localStorage.getItem('filmes')    || '[]');
    const salas     = JSON.parse(localStorage.getItem('salas')     || '[]');
    const ingressos = JSON.parse(localStorage.getItem('ingressos') || '[]');

    if (sessoes.length === 0) {
        lista.innerHTML = '<p class="text-center text-muted p-4">Nenhuma sessão cadastrada.</p>';
        return;
    }

    let html = '<table class="table table-dark table-hover table-sm mb-0"><thead class="table-secondary"><tr>';
    html += '<th>Filme</th><th>Sala</th><th>Data / Hora</th><th>Idioma</th><th>Formato</th><th>Preço</th><th>Vagas</th><th></th>';
    html += '</tr></thead><tbody>';

    for (const s of sessoes) {
        const filme    = filmes.find(f  => f.id  === s.filmeId) || null;
        const sala     = salas.find(sl  => sl.id === s.salaId)  || null;
        const vendidos = ingressos.filter(i => i.sessaoId === s.id).length;
        const vagas    = (sala ? sala.capacidade : 0) - vendidos;
        const cor      = vagas <= 0 ? 'bg-danger' : vagas <= 10 ? 'bg-warning text-dark' : 'bg-success';

        html += '<tr>';
        html += '<td><strong>' + (filme ? filme.titulo : '—') + '</strong></td>';
        html += '<td>' + (sala ? sala.nome : '—') + '</td>';
        html += '<td><small>' + formatarDataHora(s.dataHora) + '</small></td>';
        html += '<td><span class="badge bg-secondary">' + s.idioma + '</span></td>';
        html += '<td><span class="badge bg-info text-dark">' + s.formato + '</span></td>';
        html += '<td>' + formatarMoeda(s.preco) + '</td>';
        html += '<td><span class="badge ' + cor + '">' + (vagas <= 0 ? 'Esgotado' : vagas + ' vagas') + '</span></td>';
        html += '<td><a href="./ingressos.html?sessao=' + s.id + '" class="btn btn-success btn-sm' + (vagas <= 0 ? ' disabled' : '') + '">Comprar</a></td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    lista.innerHTML = html;
}


// ============================================================
//  INICIALIZAÇÃO
// ============================================================

// Evento onload da janela para inicializar as páginas conforme necessário
window.onload = () => {

    // Inicializa a página de filmes
    if (document.getElementById('lista-filmes')) {
        renderFilmes();
    }

    // Inicializa a página de salas
    if (document.getElementById('lista-salas')) {
        renderSalas();
    }

    // Inicializa a página de sessões
    if (document.getElementById('lista-sessoes')) {
        carregarSelectFilmes('sessao-filme');
        carregarSelectSalas('sessao-sala');
        renderSessoes();
    }

    // Inicializa a página de ingressos
    if (document.getElementById('lista-ingressos')) {
        carregarSelectSessoes('ingresso-sessao');
        renderIngressos();
        const sessaoParam = new URLSearchParams(window.location.search).get('sessao');
        if (sessaoParam) {
            const sel = document.getElementById('ingresso-sessao');
            if (sel) sel.value = sessaoParam;
        }
    }

    // Inicializa a página de sessões disponíveis
    if (document.getElementById('lista-sessoes-disp')) {
        renderSessoesDisponiveis();
    }

    // Inicializa a página inicial (cinema.html)
    if (document.getElementById('count-filmes')) {
        renderResumoHome();
        renderSessoesHome();
    }
};