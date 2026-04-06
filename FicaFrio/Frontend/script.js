const API_URL = 'https://localhost:5001/api';

let services = [];
let clientes = [];
let currentScreen = 'home';
let gastos = []; // gastos do serviço sendo cadastrado

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadServices();
    loadClientes();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

// ==================== NAVEGAÇÃO ====================
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const screen = item.dataset.screen;
            changeScreen(screen);
        });
    });
}

function changeScreen(screen) {
    currentScreen = screen;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screen === 'home') {
        document.getElementById('homeScreen').classList.add('active');
        loadHomeData();
    } else if (screen === 'services') {
        document.getElementById('servicesScreen').classList.add('active');
        displayAllServices(services);
    } else if (screen === 'new') {
        document.getElementById('newServiceScreen').classList.add('active');
        limparFormularioServico();
    } else if (screen === 'clientes') {
        document.getElementById('clientesScreen').classList.add('active');
        loadClientes();
    } else if (screen === 'financial') {
        document.getElementById('financialScreen').classList.add('active');
        loadFinancialReport('daily');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.screen === screen) item.classList.add('active');
    });
}

function abrirNovoServico() { changeScreen('new'); }
function voltarInicio() { changeScreen('home'); }
function verTodosServicos() { changeScreen('services'); }

// ==================== DATA E HORA ====================
function updateDateTime() {
    const now = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dataFormatada = `${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
    document.getElementById('currentDate').innerHTML = `<i class="far fa-calendar-alt"></i> ${dataFormatada}`;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const form = document.getElementById('serviceForm');
    if (form) form.addEventListener('submit', saveService);
    
    const warrantyCheck = document.getElementById('hasWarranty');
    if (warrantyCheck) warrantyCheck.addEventListener('change', toggleWarrantyFields);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filterServices);
    
    const searchClienteInput = document.getElementById('searchClienteInput');
    if (searchClienteInput) searchClienteInput.addEventListener('input', filtrarClientes);
    
    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) clienteForm.addEventListener('submit', salvarCliente);
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => loadFinancialReport(btn.dataset.period));
    });
    
    const phoneField = document.getElementById('phone');
    if (phoneField) phoneField.addEventListener('blur', buscarClientePorTelefone);
    
    const amountField = document.getElementById('amount');
    if (amountField) amountField.addEventListener('input', calcularLucroReal);
}

// ==================== BUSCAR CLIENTE POR TELEFONE ====================
async function buscarClientePorTelefone() {
    const telefone = document.getElementById('phone').value;
    if (telefone.length < 10) return;
    try {
        const response = await fetch(`${API_URL}/Clientes/search/${telefone}`);
        const clientesEncontrados = await response.json();
        if (clientesEncontrados.length > 0) {
            const cliente = clientesEncontrados[0];
            if (confirm(`Cliente ${cliente.nome} já existe! Carregar dados?`)) {
                document.getElementById('clientName').value = cliente.nome;
                document.getElementById('address').value = cliente.endereco;
            }
        }
    } catch (error) {
        console.error('Erro na busca do cliente:', error);
    }
}

// ==================== SERVIÇOS ====================
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/Services`);
        services = await response.json();
        displayAllServices(services);
        updateRecentServices();
        updateStats();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        services = [];
        updateRecentServices();
        updateStats();
    }
}

function updateStats() {
    const totalServicos = services.length;
    const totalClientesUnicos = new Set(services.map(s => s.telefoneCliente)).size;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekServices = services.filter(s => {
        const serviceDate = new Date(s.dataServico);
        return serviceDate >= startOfWeek && serviceDate <= endOfWeek && s.status === 'Completo';
    });
    const weekRevenue = weekServices.reduce((sum, s) => sum + s.valor, 0);
    
    document.getElementById('weekRevenue').innerHTML = formatCurrency(weekRevenue);
    document.getElementById('weekExpenses').innerHTML = totalClientesUnicos;
    document.getElementById('weekProfit').innerHTML = totalServicos;
    document.getElementById('completedCount').innerHTML = weekServices.length;
}

async function loadHomeData() {
    await loadServices();
}

function updateRecentServices() {
    const container = document.getElementById('recentServicesList');
    if (!services.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-tools" style="font-size:64px;margin-bottom:20px;color:#ddd;"></i>
            <h4>Nenhum serviço cadastrado ainda</h4>
            <p>Clique no botão "Novo Serviço" para começar</p>
        </div>`;
        return;
    }
    const recent = [...services].sort((a, b) => new Date(b.dataServico) - new Date(a.dataServico)).slice(0, 5);
    container.innerHTML = recent.map(service => `
        <div class="service-item" onclick="showServiceDetails(${service.id})">
            <div class="service-info">
                <h4>${service.nomeCliente}</h4>
                <p>${service.descricaoServico.substring(0, 40)}${service.descricaoServico.length > 40 ? '...' : ''}</p>
                <small>📅 ${new Date(service.dataServico).toLocaleDateString()}</small>
            </div>
            <div class="service-value">
                <div class="amount">${formatCurrency(service.valor)}</div>
                <div class="status" style="background:${getStatusColor(service.status)};color:white;padding:4px 8px;border-radius:10px;">${getStatusText(service.status)}</div>
            </div>
        </div>
    `).join('');
}

function displayAllServices(servicesArray) {
    const container = document.getElementById('allServicesList');
    if (!servicesArray.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-tools" style="font-size:64px;margin-bottom:20px;"></i>
            <h4>Nenhum serviço cadastrado</h4>
            <p>Clique em "Novo" para adicionar</p>
        </div>`;
        return;
    }
    container.innerHTML = servicesArray.map(service => `
        <div class="service-item" onclick="showServiceDetails(${service.id})">
            <div class="service-info">
                <h4>${service.nomeCliente}</h4>
                <p>📞 ${service.telefoneCliente}</p>
                <p>📅 ${new Date(service.dataServico).toLocaleDateString()}</p>
            </div>
            <div class="service-value">
                <div class="amount">${formatCurrency(service.valor)}</div>
                <div class="status" style="background:${getStatusColor(service.status)};color:white;padding:4px 8px;border-radius:10px;">${getStatusText(service.status)}</div>
            </div>
        </div>
    `).join('');
}

function filterServices() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = services.filter(s => s.nomeCliente.toLowerCase().includes(term));
    displayAllServices(filtered);
}

function limparFormularioServico() {
    document.getElementById('serviceForm')?.reset();
    gastos = [];
    atualizarListaGastos();
    document.getElementById('warrantyFields').style.display = 'none';
}

// Salvar serviço com gastos
async function saveService(event) {
    event.preventDefault();
    
    const service = {
        nomeCliente: document.getElementById('clientName').value,
        telefoneCliente: document.getElementById('phone').value,
        endereco: document.getElementById('address').value,
        descricaoServico: document.getElementById('problemDesc').value,
        valor: parseFloat(document.getElementById('amount').value),
        dataServico: document.getElementById('serviceDate').value,
        status: document.getElementById('status').value,
        temGarantia: document.getElementById('hasWarranty').checked,
        comecoGarantia: document.getElementById('warrantyStart').value || null,
        fimGarantia: document.getElementById('warrantyEnd').value || null
    };
    
    const btnSubmit = event.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btnSubmit.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/Services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });
        
        if (!response.ok) throw new Error('Erro ao salvar serviço');
        const savedService = await response.json();
        
        if (gastos.length > 0) {
            for (const gasto of gastos) {
                const gastoData = {
                    serviceId: savedService.id,
                    descricacao: gasto.descricao,
                    valor: gasto.valor,
                    dataGasto: new Date().toISOString()
                };
                await fetch(`${API_URL}/Gastos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gastoData)
                });
            }
        }
        
        alert('✅ Serviço e gastos salvos com sucesso!');
        document.getElementById('serviceForm').reset();
        limparGastos();
        await loadServices();
        await loadClientes();
        changeScreen('home');
    } catch (error) {
        console.error(error);
        alert('❌ Erro ao salvar: ' + error.message);
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}

// Exibir detalhes do serviço
async function showServiceDetails(id) {
    try {
        const [serviceRes, gastosRes] = await Promise.all([
            fetch(`${API_URL}/Services/${id}`),
            fetch(`${API_URL}/Gastos/service/${id}`)
        ]);
        const service = await serviceRes.json();
        const gastosLista = await gastosRes.json();
        
        const totalGastos = gastosLista.reduce((sum, g) => sum + g.valor, 0);
        const lucroReal = service.valor - totalGastos;
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h6>📋 Informações do Cliente</h6>
            <p><strong>Nome:</strong> ${service.nomeCliente}<br>
            <strong>Telefone:</strong> ${service.telefoneCliente}<br>
            <strong>Endereço:</strong> ${service.endereco}</p>
            
            <h6>🔧 Detalhes do Serviço</h6>
            <p><strong>Problema:</strong> ${service.descricaoServico}<br>
            <strong>Valor:</strong> ${formatCurrency(service.valor)}<br>
            <strong>Data:</strong> ${new Date(service.dataServico).toLocaleDateString()}<br>
            <strong>Status:</strong> ${getStatusText(service.status)}</p>
            
            <h6>💰 Gastos do Serviço</h6>
            ${gastosLista.length ? gastosLista.map(g => `
                <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;">
                    <span>${g.descricacao}</span>
                    <span style="color:#dc3545;">${formatCurrency(g.valor)}</span>
                </div>
            `).join('') : '<p>Nenhum gasto registrado</p>'}
            <div style="margin-top:10px;padding-top:10px;border-top:2px solid #ddd;font-weight:bold;">
                <div style="display:flex;justify-content:space-between;">
                    <span>Total de gastos:</span>
                    <span style="color:#dc3545;">${formatCurrency(totalGastos)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:5px;">
                    <span>💰 Lucro real:</span>
                    <span style="color:${lucroReal >= 0 ? '#28a745' : '#dc3545'};">${formatCurrency(lucroReal)}</span>
                </div>
            </div>
            
            ${service.temGarantia ? `
            <h6>🛡️ Garantia</h6>
            <p><strong>Início:</strong> ${service.comecoGarantia ? new Date(service.comecoGarantia).toLocaleDateString() : '-'}<br>
            <strong>Fim:</strong> ${service.fimGarantia ? new Date(service.fimGarantia).toLocaleDateString() : '-'}<br>
            <strong>Status:</strong> ${isInWarranty(service) ? '✅ Dentro da garantia' : '⚠️ Garantia expirada'}</p>
            ` : '<p>❌ Sem garantia</p>'}
            
            <hr>
            <div class="d-grid gap-2">
                <button class="btn btn-danger" onclick="deletarServico(${service.id})">🗑️ Excluir Serviço</button>
            </div>
        `;
        new bootstrap.Modal(document.getElementById('serviceModal')).show();
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do serviço');
    }
}

async function deletarServico(id) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
        const response = await fetch(`${API_URL}/Services/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Serviço excluído com sucesso!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
            if (modal) modal.hide();
            await loadServices();
            await loadClientes();
            if (currentScreen === 'services') displayAllServices(services);
        } else {
            alert('❌ Erro ao excluir serviço');
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    }
}

// ==================== GASTOS DO FORMULÁRIO ====================
function adicionarGasto() {
    const descricao = document.getElementById('gastoDesc').value.trim();
    const valor = parseFloat(document.getElementById('gastoValor').value);
    if (!descricao) { alert('Digite a descrição do gasto (ex: Peça, Gasolina)'); return; }
    if (isNaN(valor) || valor <= 0) { alert('Digite um valor válido'); return; }
    gastos.push({ descricao, valor });
    document.getElementById('gastoDesc').value = '';
    document.getElementById('gastoValor').value = '';
    atualizarListaGastos();
}

function atualizarListaGastos() {
    const container = document.getElementById('gastosList');
    const totalElement = document.getElementById('totalGastos');
    if (!container) return;
    
    if (!gastos.length) {
        container.innerHTML = '<p style="color:#999;text-align:center;padding:10px;">Nenhum gasto adicionado</p>';
        totalElement.innerHTML = '💰 Total de gastos: R$ 0,00';
    } else {
        container.innerHTML = gastos.map((g, idx) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:white;padding:10px;border-radius:10px;margin-bottom:8px;border:1px solid #e0e0e0;">
                <div><strong>${g.descricao}</strong> <span style="color:#dc3545;">R$ ${g.valor.toFixed(2)}</span></div>
                <button type="button" class="btn btn-sm btn-danger" onclick="removerGasto(${idx})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
        const total = gastos.reduce((s, g) => s + g.valor, 0);
        totalElement.innerHTML = `💰 Total de gastos: R$ ${total.toFixed(2)}`;
    }
    calcularLucroReal();
}

function removerGasto(index) {
    gastos.splice(index, 1);
    atualizarListaGastos();
}

function calcularLucroReal() {
    const valorServico = parseFloat(document.getElementById('amount')?.value) || 0;
    const totalGastos = gastos.reduce((s, g) => s + g.valor, 0);
    const lucro = valorServico - totalGastos;
    const preview = document.getElementById('lucroRealPreview');
    if (preview) {
        if (lucro < 0) {
            preview.innerHTML = `⚠️ PREJUÍZO: R$ ${lucro.toFixed(2)} ⚠️`;
            preview.style.background = '#f8d7da';
            preview.style.color = '#721c24';
        } else {
            preview.innerHTML = `✅ LUCRO REAL: R$ ${lucro.toFixed(2)} ✅`;
            preview.style.background = '#d4edda';
            preview.style.color = '#155724';
        }
    }
}

function limparGastos() {
    gastos = [];
    atualizarListaGastos();
    document.getElementById('gastoDesc').value = '';
    document.getElementById('gastoValor').value = '';
}

function toggleWarrantyFields() {
    const show = document.getElementById('hasWarranty').checked;
    document.getElementById('warrantyFields').style.display = show ? 'block' : 'none';
}

// ==================== CLIENTES ====================
async function loadClientes() {
    try {
        const response = await fetch(`${API_URL}/Clientes`);
        clientes = await response.json();
        displayClientes(clientes);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        clientes = [];
    }
}

function displayClientes(clientesList) {
    const container = document.getElementById('clientesList');
    if (!clientesList.length) {
        container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
            <i class="fas fa-users" style="font-size:64px;margin-bottom:20px;color:#ddd;"></i>
            <h4>Nenhum cliente cadastrado</h4>
            <p>Clique em "Novo Cliente" para adicionar</p>
        </div>`;
        return;
    }
    container.innerHTML = clientesList.map(cli => `
        <div class="cliente-card" onclick="verDetalhesCliente(${cli.id})">
            <h4>${cli.nome}</h4>
            <div class="cliente-info"><i class="fas fa-phone"></i> ${cli.telefone}</div>
            <div class="cliente-info"><i class="fas fa-map-marker-alt"></i> ${cli.endereco}</div>
            <div class="servicos-count"><i class="fas fa-tools"></i> ${cli.servicos?.length || 0} serviços</div>
        </div>
    `).join('');
}

function abrirFormCliente(cliente = null) {
    document.getElementById('clienteId').value = cliente?.id || '';
    document.getElementById('clienteNome').value = cliente?.nome || '';
    document.getElementById('clienteTelefone').value = cliente?.telefone || '';
    document.getElementById('clienteEndereco').value = cliente?.endereco || '';
    document.getElementById('clienteEmail').value = cliente?.email || '';
    document.getElementById('clienteModalTitle').innerText = cliente ? 'Editar Cliente' : 'Novo Cliente';
    new bootstrap.Modal(document.getElementById('clienteModal')).show();
}

async function salvarCliente(event) {
    event.preventDefault();
    const cliente = {
        id: parseInt(document.getElementById('clienteId').value) || 0,
        nome: document.getElementById('clienteNome').value,
        telefone: document.getElementById('clienteTelefone').value,
        endereco: document.getElementById('clienteEndereco').value,
        email: document.getElementById('clienteEmail').value
    };
    
    const btn = event.target.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;
    
    try {
        let response;
        if (cliente.id === 0) {
            response = await fetch(`${API_URL}/Clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
        } else {
            response = await fetch(`${API_URL}/Clientes/${cliente.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
        }
        if (response.ok || response.status === 204) {
            alert('✅ Cliente salvo com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
            await loadClientes();
        } else {
            alert('❌ Erro ao salvar cliente');
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão');
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
    }
}

async function verDetalhesCliente(id) {
    try {
        const response = await fetch(`${API_URL}/Clientes/${id}`);
        const cliente = await response.json();
        const servicosHtml = cliente.servicos?.length ? cliente.servicos.map(s => `
            <div class="servico-item-cliente" onclick="verServicoCliente(${s.id})" style="cursor:pointer;background:#f8f9fa;padding:10px;border-radius:10px;margin-bottom:10px;">
                <strong>📅 ${new Date(s.dataServico).toLocaleDateString()}</strong>
                <p>${s.descricaoServico.substring(0, 80)}</p>
                <div class="d-flex justify-content-between">
                    <span>Valor: ${formatCurrency(s.valor)}</span>
                    <span class="status-badge" style="background:${getStatusColor(s.status)};color:white;padding:2px 8px;border-radius:10px;">${getStatusText(s.status)}</span>
                </div>
            </div>
        `).join('') : '<p>Nenhum serviço realizado para este cliente</p>';
        
        document.getElementById('clienteDetalhesBody').innerHTML = `
            <div class="mb-3">
                <h6>📋 Informações</h6>
                <p><strong>Nome:</strong> ${cliente.nome}<br>
                <strong>Telefone:</strong> ${cliente.telefone}<br>
                <strong>Endereço:</strong> ${cliente.endereco}<br>
                <strong>Email:</strong> ${cliente.email || 'Não informado'}<br>
                <strong>Cliente desde:</strong> ${new Date(cliente.dataCadastro).toLocaleDateString()}</p>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6>🔧 Serviços Realizados (${cliente.servicos?.length || 0})</h6>
                    <button class="btn btn-sm btn-primary" onclick="novoServicoParaCliente(${cliente.id})">
                        <i class="fas fa-plus"></i> Novo Serviço
                    </button>
                </div>
                ${servicosHtml}
            </div>
            
            <div class="d-grid gap-2">
                <button class="btn btn-warning" onclick="editarCliente(${cliente.id})">
                    <i class="fas fa-edit"></i> Editar Cliente
                </button>
                <button class="btn btn-danger" onclick="deletarCliente(${cliente.id})">
                    <i class="fas fa-trash"></i> Excluir Cliente
                </button>
            </div>
        `;
        new bootstrap.Modal(document.getElementById('clienteDetalhesModal')).show();
    } catch (error) {
        console.error(error);
        alert('Erro ao carregar detalhes do cliente');
    }
}

function novoServicoParaCliente(clienteId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    if (modal) modal.hide();
    fetch(`${API_URL}/Clientes/${clienteId}`)
        .then(res => res.json())
        .then(cliente => {
            document.getElementById('clientName').value = cliente.nome;
            document.getElementById('phone').value = cliente.telefone;
            document.getElementById('address').value = cliente.endereco;
            changeScreen('new');
        });
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
        if (modal) modal.hide();
        abrirFormCliente(cliente);
    }
}

async function deletarCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Se ele tiver serviços, não será possível.')) return;
    try {
        const response = await fetch(`${API_URL}/Clientes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Cliente excluído com sucesso!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
            if (modal) modal.hide();
            await loadClientes();
        } else {
            alert('❌ Não é possível excluir cliente que possui serviços');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao excluir cliente');
    }
}

function verServicoCliente(servicoId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    if (modal) modal.hide();
    showServiceDetails(servicoId);
}

function filtrarClientes() {
    const term = document.getElementById('searchClienteInput').value.toLowerCase();
    const filtered = clientes.filter(c => c.nome.toLowerCase().includes(term) || c.telefone.includes(term));
    displayClientes(filtered);
}

// ==================== FINANCEIRO ====================
async function loadFinancialReport(period) {
    try {
        const response = await fetch(`${API_URL}/Services/financial/${period}`);
        const data = await response.json();
        
        document.getElementById('financeRevenue').innerHTML = formatCurrency(data.revenue);
        document.getElementById('financeExpenses').innerHTML = formatCurrency(data.expenses);
        document.getElementById('financeProfit').innerHTML = formatCurrency(data.profit);
        
        const details = document.getElementById('financialDetails');
        details.innerHTML = `
            <div class="detail-item"><span>📊 Total de Serviços</span><span>${data.totalServices || 0}</span></div>
            <div class="detail-item"><span>✅ Serviços Concluídos</span><span class="completed">${data.completedServices || 0}</span></div>
            <div class="detail-item"><span>⏳ Serviços Pendentes</span><span class="pending">${(data.totalServices || 0) - (data.completedServices || 0)}</span></div>
            <div class="detail-item"><span>📅 Período</span><span>${getPeriodText(period)}</span></div>
        `;
        if (period === 'daily') {
            details.innerHTML += `<div class="detail-item"><span>📆 Data</span><span>${new Date().toLocaleDateString()}</span></div>`;
        }
        
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('financeRevenue').innerHTML = formatCurrency(0);
        document.getElementById('financeExpenses').innerHTML = formatCurrency(0);
        document.getElementById('financeProfit').innerHTML = formatCurrency(0);
        document.getElementById('financialDetails').innerHTML = '<div class="alert alert-danger">Erro ao carregar dados financeiros</div>';
    }
}

// ==================== UTILITÁRIOS ====================
function isInWarranty(service) {
    if (!service.temGarantia || !service.fimGarantia) return false;
    return new Date() <= new Date(service.fimGarantia);
}

function getStatusText(status) {
    const map = { 'Pendente': '⏳ Pendente', 'EmProgresso': '⚙️ Em Andamento', 'Completo': '✅ Concluído' };
    return map[status] || status;
}

function getStatusColor(status) {
    const map = { 'Pendente': '#ffc107', 'EmProgresso': '#17a2b8', 'Completo': '#28a745' };
    return map[status] || '#666';
}

function getPeriodText(period) {
    const map = { 'daily': 'Hoje', 'weekly': 'Esta Semana', 'monthly': 'Este Mês', 'yearly': 'Este Ano' };
    return map[period] || period;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}


// Função para definir o status
function setStatus(statusValue) {
    document.getElementById('status').value = statusValue;
    
    // Atualizar aparência dos botões
    const btnPendente = document.getElementById('statusPendente');
    const btnConcluido = document.getElementById('statusConcluido');
    
    if (statusValue === 'Pendente') {
        btnPendente.classList.add('active');
        btnConcluido.classList.remove('active');
    } else {
        btnConcluido.classList.add('active');
        btnPendente.classList.remove('active');
    }
}

// Inicializar status ao carregar a tela
function initStatusButtons() {
    const statusAtual = document.getElementById('status').value;
    setStatus(statusAtual);
}

// Chamar initStatusButtons quando abrir a tela Novo Serviço
// Adicione esta linha dentro da função limparFormularioServico():
function limparFormularioServico() {
    document.getElementById('serviceForm')?.reset();
    gastos = [];
    atualizarListaGastos();
    document.getElementById('warrantyFields').style.display = 'none';
    initStatusButtons(); // Adicione esta linha
}