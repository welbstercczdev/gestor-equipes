// ATENÇÃO: Cole a URL do App da Web que você copiou na Etapa 1.3
//???
const API_URL = "https://script.google.com/macros/s/AKfycbzymKAe1ztOMqAMoH35MGcIUA85IKav5oqXt9lyiz9OXbyVoEZylA6gr8ADMHOPUtdfBQ/exec";

const loadingIndicator = document.getElementById('loading');
const unallocatedContainer = document.querySelector('#unallocated .person-list');
const teamsGrid = document.getElementById('teams-grid');

// Mostra/Esconde o indicador de "carregando"
const toggleLoading = (show) => {
    loadingIndicator.style.display = show ? 'block' : 'none';
};

// Função para buscar dados da nossa API (Apps Script)
async function fetchData(action) {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}?action=${action}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar ${action}:`, error);
        alert(`Não foi possível carregar os dados. Verifique o console para detalhes.`);
        return [];
    } finally {
        toggleLoading(false);
    }
}

// Função para enviar atualizações para a API
async function updatePersonTeam(personId, newTeamId) {
    toggleLoading(true);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Necessário para POST em Apps Script de implantação simples
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ personId, newTeamId }),
        });
        console.log("Atualização enviada. O modo 'no-cors' impede a leitura da resposta.");
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        alert('Falha ao salvar a alteração.');
    } finally {
        toggleLoading(false);
    }
}

// Cria os cards HTML para as pessoas
function createPersonCard(person) {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.draggable = true;
    card.id = `person-${person.ID}`;
    card.innerHTML = `
        <strong>${person.Nome}</strong>
        <span>${person.Cargo}</span>
    `;
    // Adiciona os eventos de arrastar
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    return card;
}

// Cria os cards para as equipes
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.dataset.teamId = team.EquipeID;
    card.innerHTML = `<h3>${team.NomeDaEquipe} (${team.Data})</h3>`;
    // Adiciona os eventos de soltar
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
    return card;
}

// Carrega e exibe todos os dados iniciais
async function initialize() {
    const [pessoas, equipes] = await Promise.all([
        fetchData('getPessoas'),
        fetchData('getEquipes')
    ]);

    // Limpa containers
    unallocatedContainer.innerHTML = '';
    teamsGrid.innerHTML = '';
    
    // Cria os cards das equipes
    equipes.forEach(team => {
        const teamCard = createTeamCard(team);
        teamsGrid.appendChild(teamCard);
    });

    // Distribui as pessoas nas equipes corretas ou na lista de não alocados
    pessoas.forEach(person => {
        const personCard = createPersonCard(person);
        const teamContainer = document.querySelector(`.team-card[data-team-id="${person.EquipeID}"]`) || unallocatedContainer;
        teamContainer.appendChild(personCard);
    });

    // Adiciona eventos de soltar também na lista de não alocados
    unallocatedContainer.addEventListener('dragover', handleDragOver);
    unallocatedContainer.addEventListener('dragleave', handleDragLeave);
    unallocatedContainer.addEventListener('drop', handleDrop);
}

// --- Lógica do Drag and Drop ---
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); // Necessário para permitir o drop
    const targetContainer = e.target.closest('.team-card, .person-list');
    if (targetContainer) {
        targetContainer.classList.add('over');
    }
}

function handleDragLeave(e) {
    const targetContainer = e.target.closest('.team-card, .person-list');
     if (targetContainer) {
        targetContainer.classList.remove('over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetContainer = e.target.closest('.team-card, .person-list');
    if (targetContainer && draggedItem) {
        targetContainer.classList.remove('over');
        targetContainer.appendChild(draggedItem);

        const personId = draggedItem.id.split('-')[1];
        const newTeamId = targetContainer.dataset.teamId || ""; // "" para não alocados

        // Envia a atualização para o Google Sheets
        updatePersonTeam(personId, newTeamId);
    }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', initialize);
