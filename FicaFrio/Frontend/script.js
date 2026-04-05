const API_URL = 'https://localhost:5001/api';

let services = [];
let currentScreen = 'home';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadServices();
    setupEventListeners();
    
    // Atualizar data a cada minuto
    updateDateTime();
    setInterval(updateDateTime, 60000);
});

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
    
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Mostrar tela selecionada
    if (screen === 'home') {
        document.getElementById('homeScreen').classList.add('active');
        loadHomeData(); // Recarrega os dados da home
    } else if (screen === 'services') {
        document.getElementById('servicesScreen').classList.add('active');
        displayAllServices(services);
    } else if (screen === 'new') {
        document.getElementById('newServiceScreen').classList.add('active');
    }  else if (screen === 'clientes') {
    document.getElementById('clientesScreen').classList.add('active');
    loadClientes();
} 
    else if (screen === 'financial') {
        document.getElementById('financialScreen').classList.add('active');
        loadFinancialReport('daily');
    }
    
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.screen === screen) {
            item.classList.add('active');
        }
    });
}

function abrirNovoServico() {
    changeScreen('new');
}

function voltarInicio() {
    changeScreen('home');
}

function verTodosServicos() {
    changeScreen('services');
}

function updateDateTime() {
    const now = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const dataFormatada = `${diasSemana[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
    document.getElementById('currentDate').innerHTML = `<i class="far fa-calendar-alt"></i> ${dataFormatada}`;
}

function setupEventListeners() {
    document.getElementById('serviceForm').addEventListener('submit', saveService);
    document.getElementById('hasWarranty').addEventListener('change', toggleWarrantyFields);
    document.getElementById('searchInput').addEventListener('input', filterServices);
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => loadFinancialReport(btn.dataset.period));
    });
}

async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/Services`);
        services = await response.json();
        console.log('Serviços carregados:', services.length); // Para debug
        displayAllServices(services);
        updateRecentServices(); // Atualiza a lista da home
        updateStats(); // Atualiza as estatísticas
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        services = [];
        updateRecentServices(); // Mostra mensagem mesmo com erro
        updateStats();
    }
}

function updateStats() {
    // Calcular totais
    const totalServicos = services.length;
    const totalClientes = services.length;
    
    // Calcular faturamento total da semana
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
    const weekExpenses = 0; // Placeholder - você pode implementar gastos depois
    const weekProfit = weekRevenue - weekExpenses;
    
    // Atualizar os cards
    document.getElementById('weekRevenue').innerHTML = formatCurrency(weekRevenue);
    document.getElementById('weekExpenses').innerHTML = totalClientes; // Mostra total de clientes
    document.getElementById('weekProfit').innerHTML = totalServicos; // Mostra total de serviços
    
    // Atualizar serviços concluídos da semana
    const completedCount = weekServices.length;
    document.getElementById('completedCount').innerHTML = completedCount;
}

async function loadHomeData() {
    // Força a atualização dos dados da home
    await loadServices();
}

// Função para atualizar a lista de últimos serviços na home
function updateRecentServices() {
    const container = document.getElementById('recentServicesList');
    
    console.log('Atualizando lista na home. Total de serviços:', services.length); // Para debug
    
    if (!services || services.length === 0) {
        // 🔧 MOSTRA A MENSAGEM NA HOME
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-tools" style="font-size: 64px; margin-bottom: 20px; display: block; color: #ddd;"></i>
                <h4 style="font-size: 18px; margin-bottom: 10px; color: #666;">Nenhum serviço cadastrado ainda</h4>
                <p style="font-size: 14px; color: #999;">Clique no botão "Novo Serviço" para começar</p>
                <small style="display: block; margin-top: 15px; font-size: 12px; color: #bbb;">Seus últimos serviços aparecerão aqui 📋</small>
            </div>
        `;
        return;
    }
    
    // Pegar os últimos 5 serviços (mais recentes primeiro)
    const recentServices = [...services]
        .sort((a, b) => new Date(b.dataServico) - new Date(a.dataServico))
        .slice(0, 5);
    
    if (recentServices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-tools" style="font-size: 64px; margin-bottom: 20px; display: block; color: #ddd;"></i>
                <h4 style="font-size: 18px; margin-bottom: 10px; color: #666;">Nenhum serviço cadastrado ainda</h4>
                <p style="font-size: 14px; color: #999;">Clique no botão "Novo Serviço" para começar</p>
                <small style="display: block; margin-top: 15px; font-size: 12px; color: #bbb;">Seus últimos serviços aparecerão aqui 📋</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentServices.map(service => `
        <div class="service-item" onclick="showServiceDetails(${service.id})">
            <div class="service-info">
                <h4>${service.nomeCliente}</h4>
                <p>${service.descricaoServico.substring(0, 40)}${service.descricaoServico.length > 40 ? '...' : ''}</p>
                <small style="color: #999;">📅 ${new Date(service.dataServico).toLocaleDateString()}</small>
            </div>
            <div class="service-value">
                <div class="amount">${formatCurrency(service.valor)}</div>
                <div class="status" style="background: ${getStatusColor(service.status)}; color: white; padding: 4px 8px; border-radius: 10px; font-size: 11px;">
                    ${getStatusText(service.status)}
                </div>
            </div>
        </div>
    `).join('');
}

function displayAllServices(services) {
    const container = document.getElementById('allServicesList');
    
    if (!services || services.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-tools" style="font-size: 64px; margin-bottom: 20px; display: block;"></i>
                <h4>Nenhum serviço cadastrado</h4>
                <p>Clique em "Novo" para adicionar seu primeiro serviço</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = services.map(service => `
        <div class="service-item" onclick="showServiceDetails(${service.id})">
            <div class="service-info">
                <h4>${service.nomeCliente}</h4>
                <p>📞 ${service.telefoneCliente}</p>
                <p>📅 ${new Date(service.dataServico).toLocaleDateString()}</p>
            </div>
            <div class="service-value">
                <div class="amount">${formatCurrency(service.valor)}</div>
                <div class="status" style="background: ${getStatusColor(service.status)}; color: white; padding: 4px 8px; border-radius: 10px; font-size: 11px; margin-top: 5px;">
                    ${getStatusText(service.status)}
                </div>
            </div>
        </div>
    `).join('');
}

function filterServices() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = services.filter(s => 
        s.nomeCliente.toLowerCase().includes(searchTerm)
    );
    displayAllServices(filtered);
}

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
        fimGarantia: document.getElementById('warrantyEnd').value || null,
        fotoServico: servicePhotoBase64,
        fotoCliente: clientPhotoBase64
    };
    
    try {
        const response = await fetch(`${API_URL}/Services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });
        
        if (response.ok) {
            alert('✅ Serviço salvo com sucesso!');
            document.getElementById('serviceForm').reset();
            await loadServices(); // Recarrega todos os dados
            changeScreen('home'); // Volta para a home
        } else {
            const error = await response.json();
            alert('❌ Erro ao salvar serviço: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro de conexão. Verifique se o backend está rodando.');
    }
}

function toggleWarrantyFields() {
    const hasWarranty = document.getElementById('hasWarranty').checked;
    document.getElementById('warrantyFields').style.display = hasWarranty ? 'block' : 'none';
}

async function loadFinancialReport(period) {
    try {
        const response = await fetch(`${API_URL}/Services/financial/${period}`);
        const data = await response.json();
        
        // Atualizar os cards principais
        document.getElementById('financeRevenue').innerHTML = formatCurrency(data.revenue);
        document.getElementById('financeExpenses').innerHTML = formatCurrency(data.expenses);
        document.getElementById('financeProfit').innerHTML = formatCurrency(data.profit);
        
        // Adicionar detalhes adicionais
        const detailsContainer = document.getElementById('financialDetails');
        detailsContainer.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">📊 Total de Serviços</span>
                <span class="detail-value">${data.totalServices || 0}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">✅ Serviços Concluídos</span>
                <span class="detail-value completed">${data.completedServices || 0}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">⏳ Serviços Pendentes</span>
                <span class="detail-value pending">${(data.totalServices || 0) - (data.completedServices || 0)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">📅 Período</span>
                <span class="detail-value">${getPeriodText(period)}</span>
            </div>
        `;
        
        // Marcar botão ativo
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
            }
        });
        
        // Se for diário, mostrar a data específica
        if (period === 'daily') {
            const today = new Date();
            const dateText = `${today.toLocaleDateString('pt-BR')}`;
            detailsContainer.innerHTML += `
                <div class="detail-item">
                    <span class="detail-label">📆 Data</span>
                    <span class="detail-value">${dateText}</span>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('financeRevenue').innerHTML = formatCurrency(0);
        document.getElementById('financeExpenses').innerHTML = formatCurrency(0);
        document.getElementById('financeProfit').innerHTML = formatCurrency(0);
        document.getElementById('financialDetails').innerHTML = '<div class="alert alert-danger">Erro ao carregar dados financeiros</div>';
    }
}

function getPeriodText(period) {
    const periodMap = {
        'daily': 'Hoje',
        'weekly': 'Esta Semana',
        'monthly': 'Este Mês',
        'yearly': 'Este Ano'
    };
    return periodMap[period] || period;
}

async function showServiceDetails(id) {
    try {
        const response = await fetch(`${API_URL}/Services/${id}`);
        const service = await response.json();
        
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
        
        const modal = new bootstrap.Modal(document.getElementById('serviceModal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do serviço');
    }
}

async function deletarServico(id) {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
        try {
            const response = await fetch(`${API_URL}/Services/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('✅ Serviço excluído com sucesso!');
                const modal = bootstrap.Modal.getInstance(document.getElementById('serviceModal'));
                modal.hide();
                await loadServices(); // Recarrega todos os dados
                if (currentScreen === 'services') {
                    displayAllServices(services);
                }
            } else {
                alert('❌ Erro ao excluir serviço');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro de conexão');
        }
    }
}

function isInWarranty(service) {
    if (!service.temGarantia) return false;
    if (!service.fimGarantia) return false;
    const hoje = new Date();
    const fimGarantia = new Date(service.fimGarantia);
    return hoje <= fimGarantia;
}

function getStatusText(status) {
    const statusMap = {
        'Pendente': '⏳ Pendente',
        'EmProgresso': '⚙️ Em Andamento',
        'Completo': '✅ Concluído'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colorMap = {
        'Pendente': '#ffc107',
        'EmProgresso': '#17a2b8',
        'Completo': '#28a745'
    };
    return colorMap[status] || '#666';
}

function getPeriodName(period) {
    const periodMap = {
        'daily': 'Diário',
        'weekly': 'Semanal',
        'monthly': 'Mensal',
        'yearly': 'Anual'
    };
    return periodMap[period] || period;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}


// ============== CLIENTES ==============
let clientes = [];

async function loadClientes() {
    try {
        const response = await fetch(`${API_URL}/Clientes`);
        clientes = await response.json();
        displayClientes(clientes);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

function displayClientes(clientesList) {
    const container = document.getElementById('clientesList');
    
    if (!clientesList || clientesList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <i class="fas fa-users" style="font-size: 64px; margin-bottom: 20px; display: block; color: #ddd;"></i>
                <h4>Nenhum cliente cadastrado</h4>
                <p>Clique em "Novo Cliente" para adicionar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = clientesList.map(cliente => `
        <div class="cliente-card" onclick="verDetalhesCliente(${cliente.id})">
            <h4>${cliente.nome}</h4>
            <div class="cliente-info">
                <i class="fas fa-phone"></i> ${cliente.telefone}
            </div>
            <div class="cliente-info">
                <i class="fas fa-map-marker-alt"></i> ${cliente.endereco}
            </div>
            <div class="servicos-count">
                <i class="fas fa-tools"></i> ${cliente.servicos?.length || 0} serviços
            </div>
        </div>
    `).join('');
}

function abrirFormCliente(cliente = null) {
    if (cliente) {
        document.getElementById('clienteModalTitle').innerText = 'Editar Cliente';
        document.getElementById('clienteId').value = cliente.id;
        document.getElementById('clienteNome').value = cliente.nome;
        document.getElementById('clienteTelefone').value = cliente.telefone;
        document.getElementById('clienteEndereco').value = cliente.endereco;
        document.getElementById('clienteEmail').value = cliente.email || '';
    } else {
        document.getElementById('clienteModalTitle').innerText = 'Novo Cliente';
        document.getElementById('clienteForm').reset();
        document.getElementById('clienteId').value = '';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('clienteModal'));
    modal.show();
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
            const modal = bootstrap.Modal.getInstance(document.getElementById('clienteModal'));
            modal.hide();
            await loadClientes();
        } else {
            alert('❌ Erro ao salvar cliente');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão');
    }
}

async function verDetalhesCliente(id) {
    try {
        const response = await fetch(`${API_URL}/Clientes/${id}`);
        const cliente = await response.json();
        
        const servicosHtml = cliente.servicos && cliente.servicos.length > 0 
            ? cliente.servicos.map(servico => `
                <div class="servico-item-cliente" onclick="verServicoCliente(${servico.id})">
                    <strong>📅 ${new Date(servico.dataServico).toLocaleDateString()}</strong>
                    <p>${servico.descricaoServico.substring(0, 80)}</p>
                    <div class="d-flex justify-content-between">
                        <span>Valor: ${formatCurrency(servico.valor)}</span>
                        <span class="status-badge status-${servico.status}">${getStatusText(servico.status)}</span>
                    </div>
                </div>
            `).join('')
            : '<p style="text-align: center; color: #999;">Nenhum serviço realizado para este cliente</p>';
        
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
        
        const modal = new bootstrap.Modal(document.getElementById('clienteDetalhesModal'));
        modal.show();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar detalhes do cliente');
    }
}

function novoServicoParaCliente(clienteId) {
    // Fechar modal e abrir tela de novo serviço com cliente pré-selecionado
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    modal.hide();
    
    // Buscar dados do cliente para pré-preencher
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
        modal.hide();
        abrirFormCliente(cliente);
    }
}

async function deletarCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente? Se ele tiver serviços, não será possível excluir.')) {
        try {
            const response = await fetch(`${API_URL}/Clientes/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('✅ Cliente excluído com sucesso!');
                const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
                modal.hide();
                await loadClientes();
            } else {
                alert('❌ Não é possível excluir cliente que possui serviços');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao excluir cliente');
        }
    }
}

function verServicoCliente(servicoId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('clienteDetalhesModal'));
    modal.hide();
    showServiceDetails(servicoId);
}

function filtrarClientes() {
    const term = document.getElementById('searchClienteInput').value.toLowerCase();
    const filtered = clientes.filter(c => 
        c.nome.toLowerCase().includes(term) || 
        c.telefone.includes(term)
    );
    displayClientes(filtered);
}

// Variáveis para armazenar as fotos em Base64
let servicePhotoBase64 = null;
let clientPhotoBase64 = null;

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            servicePhotoBase64 = e.target.result;
            document.getElementById('photoPreviewImg').src = servicePhotoBase64;
            document.getElementById('photoPreview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewClientPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            clientPhotoBase64 = e.target.result;
            document.getElementById('clientPhotoPreviewImg').src = clientPhotoBase64;
            document.getElementById('clientPhotoPreview').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removerFoto() {
    servicePhotoBase64 = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('servicePhoto').value = '';
}

function removerFotoCliente() {
    clientPhotoBase64 = null;
    document.getElementById('clientPhotoPreview').style.display = 'none';
    document.getElementById('clientPhoto').value = '';
}



// ============== GASTOS SIMPLIFICADOS ==============
let gastos = [];

function adicionarGasto() {
    const descricao = document.getElementById('gastoDesc').value.trim();
    const valor = parseFloat(document.getElementById('gastoValor').value);
    
    // Validar campos
    if (!descricao) {
        alert('⚠️ Digite a descrição do gasto (ex: Peça, Gasolina)');
        return;
    }
    
    if (isNaN(valor) || valor <= 0) {
        alert('⚠️ Digite um valor válido');
        return;
    }
    
    // Adicionar gasto
    gastos.push({
        descricao: descricao,
        valor: valor
    });
    
    // Limpar campos
    document.getElementById('gastoDesc').value = '';
    document.getElementById('gastoValor').value = '';
    
    // Atualizar lista
    atualizarListaGastos();
}

function atualizarListaGastos() {
    const container = document.getElementById('gastosList');
    const totalGastosElement = document.getElementById('totalGastos');
    
    if (gastos.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Nenhum gasto adicionado</p>';
        totalGastosElement.innerHTML = '💰 Total de gastos: R$ 0,00';
    } else {
        container.innerHTML = gastos.map((gasto, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #e0e0e0;">
                <div>
                    <strong>${gasto.descricao}</strong>
                    <span style="color: #dc3545; margin-left: 10px;">R$ ${gasto.valor.toFixed(2)}</span>
                </div>
                <button type="button" class="btn btn-sm btn-danger" onclick="removerGasto(${index})" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        const total = gastos.reduce((sum, g) => sum + g.valor, 0);
        totalGastosElement.innerHTML = `💰 Total de gastos: R$ ${total.toFixed(2)}`;
    }
    
    // Atualizar lucro real
    calcularLucroReal();
}

function removerGasto(index) {
    gastos.splice(index, 1);
    atualizarListaGastos();
}

function calcularLucroReal() {
    const valorServico = parseFloat(document.getElementById('amount')?.value) || 0;
    const totalGastos = gastos.reduce((sum, g) => sum + g.valor, 0);
    const lucroReal = valorServico - totalGastos;
    
    const lucroElement = document.getElementById('lucroRealPreview');
    if (lucroElement) {
        if (lucroReal < 0) {
            lucroElement.innerHTML = `⚠️ PREJUÍZO: R$ ${lucroReal.toFixed(2)} ⚠️`;
            lucroElement.style.background = '#f8d7da';
            lucroElement.style.color = '#721c24';
        } else {
            lucroElement.innerHTML = `✅ LUCRO REAL: R$ ${lucroReal.toFixed(2)} ✅`;
            lucroElement.style.background = '#d4edda';
            lucroElement.style.color = '#155724';
        }
    }
}

// Limpar gastos ao resetar o formulário
function limparGastos() {
    gastos = [];
    atualizarListaGastos();
    document.getElementById('gastoDesc').value = '';
    document.getElementById('gastoValor').value = '';
}

// Adicionar evento para recalcular lucro quando digitar o valor
document.addEventListener('DOMContentLoaded', function() {
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', calcularLucroReal);
    }
});

// Modificar a função saveService para incluir os gastos
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
        fimGarantia: document.getElementById('warrantyEnd').value || null,
        gastos: gastos // 🔧 Incluir os gastos
    };
    
    // Mostrar loading
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
        
        if (response.ok) {
            alert('✅ Serviço salvo com sucesso!');
            document.getElementById('serviceForm').reset();
            limparGastos(); // Limpar gastos após salvar
            await loadServices();
            await loadHomeData();
            changeScreen('home');
        } else {
            const error = await response.json();
            alert('❌ Erro ao salvar serviço: ' + (error.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro de conexão. Verifique se o backend está rodando.');
    } finally {
        btnSubmit.innerHTML = originalText;
        btnSubmit.disabled = false;
    }
}


// Na tela de Novo Serviço, ao digitar o telefone
document.getElementById('phone')?.addEventListener('blur', async function() {
    const telefone = this.value;
    if (telefone.length >= 10) {
        try {
            const response = await fetch(`${API_URL}/Clientes/search/${telefone}`);
            const clientes = await response.json();
            
            if (clientes.length > 0) {
                const cliente = clientes[0];
                const confirmar = confirm(`Cliente ${cliente.nome} já existe! Carregar dados?`);
                if (confirmar) {
                    document.getElementById('clientName').value = cliente.nome;
                    document.getElementById('address').value = cliente.endereco;
                    // Carregar foto do cliente se tiver
                    if (cliente.fotoCliente) {
                        clientPhotoBase64 = cliente.fotoCliente;
                        document.getElementById('clientPhotoPreviewImg').src = clientPhotoBase64;
                        document.getElementById('clientPhotoPreview').style.display = 'block';
                    }
                }
            }
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }
});


// No card do serviço, mostrar alerta visual
function isInWarranty(service) {
    if (!service.temGarantia) return false;
    if (!service.fimGarantia) return false;
    
    const hoje = new Date();
    const fimGarantia = new Date(service.fimGarantia);
    const diasRestantes = Math.ceil((fimGarantia - hoje) / (1000 * 60 * 60 * 24));
    
    if (hoje <= fimGarantia) {
        return { status: true, dias: diasRestantes };
    }
    return { status: false, dias: 0 };
}

// No HTML do card
if (garantia.status) {
    badge = `<span class="warranty-badge warranty-active">
        🛡️ Garantia (${garantia.dias} dias)
    </span>`;
} else if (service.temGarantia) {
    badge = `<span class="warranty-badge warranty-expired">
        ⚠️ Garantia Expirada
    </span>`;
}