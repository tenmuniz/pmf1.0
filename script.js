// Script for Sistema PMF
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema PMF loaded');

    // Data model
    const app = {
        // State
        militares: [],
        schedules: [],
        currentMonth: new Date(),
        activeView: 'relatorios-view',
        selectedDate: null,
        MAX_PMS_PER_DAY: 3,
        // Referência de quando começou o ciclo de guarnição (uma quinta-feira passada)
        guarnicaoStartDate: new Date(2025, 0, 2), // 02/01/2025 - uma quinta-feira de referência
        
        // Initialization
        init() {
            console.log("%c Sistema PMF Initializing...", "background: #0a1929; color: white; font-size: 14px; padding: 5px;");
            console.log("Reference garrison date:", this.guarnicaoStartDate);
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Carregar dados do banco de dados e atualizar a interface
            this.carregarDadosDoBanco().then(() => {
                console.log('[SUCCESS] Sistema PMF inicializado com sucesso!');
            }).catch(error => {
                console.error('[ERROR] Erro ao carregar dados do banco:', error);
                this.showToast('Erro ao carregar dados do banco de dados. Tente recarregar a página.', 'error');
                
                // Mesmo com erro, tentar renderizar com dados locais
                this.renderMilitares();
                this.renderCalendars();
                this.updateDashboardMetrics();
                this.populatePMDropdown();
            });
        },
        
        // Função para carregar dados do banco de dados
        async carregarDadosDoBanco() {
            console.log('[INFO] Iniciando carregamento de dados do banco...');
            
            try {
                // Limpar arrays existentes para garantir que não haja duplicação
                this.militares = [];
                this.schedules = [];
                
                // Carregar militares
                console.log('[INFO] Buscando militares do banco...');
                const responseMilitares = await fetch('/api/militares');
                
                if (!responseMilitares.ok) {
                    console.error(`[ERROR] Falha ao carregar militares: ${responseMilitares.status} ${responseMilitares.statusText}`);
                    throw new Error('Falha ao carregar militares');
                }
                
                const dataMilitares = await responseMilitares.json();
                console.log('[INFO] Resposta da API de militares:', dataMilitares);
                
                if (dataMilitares && dataMilitares.militares && dataMilitares.militares.length > 0) {
                    // Converter formato do banco para o formato da aplicação
                    this.militares = dataMilitares.militares.map(militar => ({
                        id: 'pm_' + militar.id,
                        name: militar.nome,
                        rank: this.convertRankFromDB(militar.posto),
                        id_number: militar.numero_identificacao
                    }));
                    console.log('[SUCCESS] Militares carregados do banco:', this.militares);
                } else {
                    console.log('[INFO] Nenhum militar encontrado no banco de dados.');
                    this.militares = [];
                }
                
                // Carregar escalas
                console.log('[INFO] Buscando escalas do banco...');
                const responseEscalas = await fetch('/api/escalas');
                
                if (!responseEscalas.ok) {
                    console.error(`[ERROR] Falha ao carregar escalas: ${responseEscalas.status} ${responseEscalas.statusText}`);
                    throw new Error('Falha ao carregar escalas');
                }
                
                const dataEscalas = await responseEscalas.json();
                console.log('[INFO] Resposta da API de escalas:', dataEscalas);
                
                if (dataEscalas && dataEscalas.escalas && dataEscalas.escalas.length > 0) {
                    // Para cada escala, carregar seus detalhes
                    for (const escala of dataEscalas.escalas) {
                        console.log(`[INFO] Buscando detalhes da escala ID ${escala.id}...`);
                        
                        try {
                            const responseDetalhes = await fetch(`/api/escalas/${escala.id}/detalhes`);
                            
                            if (!responseDetalhes.ok) {
                                console.error(`[ERROR] Falha ao carregar detalhes da escala ${escala.id}: ${responseDetalhes.status} ${responseDetalhes.statusText}`);
                                continue;
                            }
                            
                            const dataDetalhes = await responseDetalhes.json();
                            console.log(`[INFO] Resposta dos detalhes da escala ${escala.id}:`, dataDetalhes);
                            
                            if (dataDetalhes && dataDetalhes.detalhes && dataDetalhes.detalhes.length > 0) {
                                // Converter detalhes para o formato de schedules da aplicação
                                dataDetalhes.detalhes.forEach(detalhe => {
                                    this.schedules.push({
                                        id: 'schedule_' + detalhe.id,
                                        date: detalhe.data_servico.split('T')[0], // Garantir formato YYYY-MM-DD
                                        pmId: 'pm_' + detalhe.militar_id
                                    });
                                });
                            } else {
                                console.log(`[INFO] Nenhum detalhe encontrado para a escala ${escala.id}.`);
                            }
                        } catch (detalhesError) {
                            console.error(`[ERROR] Erro ao processar detalhes da escala ${escala.id}:`, detalhesError);
                        }
                    }
                    console.log('[SUCCESS] Escalas carregadas do banco:', this.schedules);
                } else {
                    console.log('[INFO] Nenhuma escala encontrada no banco de dados.');
                }
                
                // Atualizar UI após carregar dados
                this.renderMilitares();
                this.renderCalendars();
                this.updateDashboardMetrics();
                this.populatePMDropdown();
                this.updateReportData();
                this.detectConflicts();
                
                console.log('[SUCCESS] Carregamento e renderização de dados concluídos com sucesso!');
                return true;
            } catch (error) {
                console.error('[ERROR] Erro ao carregar dados do banco:', error);
                console.error('[ERROR] Stack trace:', error.stack);
                return false;
            }
        },
        
        // Função para recarregar dados após operações de escrita
        async recarregarDados() {
            console.log('[INFO] Recarregando dados do banco após operação...');
            
            try {
                await this.carregarDadosDoBanco();
                console.log('[SUCCESS] Dados recarregados com sucesso!');
                return true;
            } catch (error) {
                console.error('[ERROR] Falha ao recarregar dados:', error);
                return false;
            }
        },
        
        // Converter posto do banco para o formato da aplicação
        convertRankFromDB(posto) {
            const rankMap = {
                'Alfa': 'soldier',
                'Bravo': 'officer',
                'Charlie': 'captain',
                'Expediente': 'expedient'
            };
            return rankMap[posto] || 'soldier';
        },
        
        // Converter posto da aplicação para o formato do banco
        convertRankToDB(rank) {
            const rankMap = {
                'soldier': 'Alfa',
                'officer': 'Bravo',
                'captain': 'Charlie',
                'expedient': 'Expediente'
            };
            return rankMap[rank] || 'Alfa';
        },
        
        // Event listeners
        setupEventListeners() {
            // Sidebar navigation
            document.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.changeView(item.dataset.view);
                });
            });
            
            // Dashboard cards
            document.querySelectorAll('.card').forEach(card => {
                card.addEventListener('click', () => {
                    this.showToast(`Detalhes de ${card.querySelector('.card-title').textContent.trim()}`, 'success');
                });
            });
            
            // Calendar navigation
            document.getElementById('prev-month-btn').addEventListener('click', () => {
                this.navigateMonth(-1);
            });
            
            document.getElementById('next-month-btn').addEventListener('click', () => {
                this.navigateMonth(1);
            });
            
            document.getElementById('prev-month-btn-2').addEventListener('click', () => {
                this.navigateMonth(-1);
            });
            
            document.getElementById('next-month-btn-2').addEventListener('click', () => {
                this.navigateMonth(1);
            });
            
            // Add PM buttons
            document.getElementById('add-pm-btn').addEventListener('click', () => {
                this.openModal('add-pm-modal');
            });
            
            document.getElementById('add-pm-btn-2').addEventListener('click', () => {
                this.openModal('add-pm-modal');
            });
            
            // Modal close buttons
            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.closeModal(e.target.closest('.modal-overlay').id);
                });
            });
            
            // Cancel buttons
            document.getElementById('cancel-add-pm').addEventListener('click', () => {
                this.closeModal('add-pm-modal');
            });
            
            document.getElementById('cancel-add-schedule').addEventListener('click', () => {
                this.closeModal('add-schedule-modal');
            });
            
            document.getElementById('cancel-day-details').addEventListener('click', () => {
                this.closeModal('day-details-modal');
            });
            
            // Confirm buttons
            document.getElementById('confirm-add-pm').addEventListener('click', () => {
                this.addPM();
            });
            
            document.getElementById('confirm-add-schedule').addEventListener('click', () => {
                this.addSchedule();
            });
            
            // Add PM to day button
            document.getElementById('add-pm-to-day').addEventListener('click', () => {
                this.addPMToSelectedDay();
            });
            
            // Search and filter for PMs
            document.getElementById('search-pm').addEventListener('input', () => {
                this.renderMilitares();
            });
            
            document.getElementById('filter-rank').addEventListener('change', () => {
                this.renderMilitares();
            });
            
            document.getElementById('search-pm-2').addEventListener('input', () => {
                const value = document.getElementById('search-pm-2').value;
                document.getElementById('search-pm').value = value;
                this.renderMilitares();
            });
            
            document.getElementById('filter-rank-2').addEventListener('change', () => {
                const value = document.getElementById('filter-rank-2').value;
                document.getElementById('filter-rank').value = value;
                this.renderMilitares();
            });
            
            // Reports period change
            document.getElementById('report-period').addEventListener('change', () => {
                this.updateReportData();
                this.showToast('Período do relatório atualizado', 'success');
            });

            // Conflicts period change
            document.getElementById('conflict-period').addEventListener('change', () => {
                this.detectConflicts();
                this.showToast('Período de detecção atualizado', 'success');
            });
            
            // Search functionality
            document.getElementById('search-btn').addEventListener('click', () => {
                this.searchPM();
            });
            
            // Allow searching by pressing Enter
            document.getElementById('search-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPM();
                }
            });
        },
        
        // View management
        changeView(viewId) {
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(viewId).classList.add('active');
            
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.menu-item[data-view="${viewId}"]`).classList.add('active');
            
            this.activeView = viewId;
            
            // Sync views when needed
            if (viewId === 'militares-view') {
                document.getElementById('search-pm-2').value = document.getElementById('search-pm').value;
                document.getElementById('filter-rank-2').value = document.getElementById('filter-rank').value;
                this.renderMilitares();
            }
            
            if (viewId === 'escalas-view') {
                this.renderCalendars(true);
            }
            
            // Update reports data when switching to that view
            if (viewId === 'relatorios-view') {
                this.updateReportData();
            }
            
            // Detect conflicts when switching to conflicts view
            if (viewId === 'conflitos-view') {
                this.detectConflicts();
            }
        },
        
        // Calendar functions
        formatMonthName(date) {
            const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            return `${months[date.getMonth()]} ${date.getFullYear()}`;
        },
        
        navigateMonth(offset) {
            const newMonth = new Date(this.currentMonth);
            newMonth.setMonth(newMonth.getMonth() + offset);
            this.currentMonth = newMonth;
            
            document.getElementById('current-month').textContent = this.formatMonthName(this.currentMonth);
            document.getElementById('current-month-2').textContent = this.formatMonthName(this.currentMonth);
            
            this.renderCalendars();
        },
        
        renderCalendars(forceEscalasView = false) {
            this.renderCalendar('main-calendar-grid');
            
            // Render the calendar for escalas view if on escalas view or if forced
            if (this.activeView === 'escalas-view' || forceEscalasView) {
                this.renderCalendar('calendar-grid-2');
            }
        },
        
        // Determina qual guarnição está de serviço em uma data específica
        getGuarnicaoForDate(date) {
            // Converter para data se for string
            if (typeof date === 'string') {
                const parts = date.split('-').map(num => parseInt(num));
                date = new Date(parts[0], parts[1] - 1, parts[2]);
            }
            
            // Ensure date has no time component for consistent calculations
            const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const cleanRef = new Date(this.guarnicaoStartDate.getFullYear(), 
                                      this.guarnicaoStartDate.getMonth(), 
                                      this.guarnicaoStartDate.getDate());
            
            // Calcular a diferença em dias da data de referência
            const diffTime = cleanDate - cleanRef; // No need for Math.abs, we want the actual direction
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // Usar o resto da divisão por 4 para determinar a guarnição
            // Ensure we have a positive result for the modulo operation
            const adjDiffDays = diffDays >= 0 ? diffDays : ((diffDays % 4) + 4) % 4;
            const guarnicaoIndex = adjDiffDays % 4;
            
            const guarnicoes = {
                0: { name: 'Alfa', class: 'soldier' },
                1: { name: 'Bravo', class: 'officer' },
                2: { name: 'Charlie', class: 'captain' },
                3: { name: 'Expediente', class: 'expedient' }
            };
            
            console.log(`Date: ${date.toISOString().split('T')[0]}, DiffDays: ${diffDays}, AdjDiffDays: ${adjDiffDays}, Index: ${guarnicaoIndex}, Assigned: ${guarnicoes[guarnicaoIndex].name}`);
            return guarnicoes[guarnicaoIndex];
        },
        
        renderCalendar(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Clear container except for headers if they exist
            if (containerId === 'main-calendar-grid') {
                // For the main calendar, we want to keep the day headers
                const headers = container.querySelectorAll('.calendar-day-header');
                container.innerHTML = '';
                headers.forEach(header => container.appendChild(header));
            } else {
                // For the other calendar view, rebuild everything including headers
                container.innerHTML = '';
                
                const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                dayHeaders.forEach(day => {
                    const headerEl = document.createElement('div');
                    headerEl.className = 'calendar-day-header';
                    headerEl.textContent = day;
                    container.appendChild(headerEl);
                });
            }
            
            // Get first day of month
            const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
            const startingDay = firstDay.getDay(); // 0 = Sunday
            
            // Add empty days for proper alignment
            for (let i = 0; i < startingDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                emptyDay.style.visibility = 'hidden';
                container.appendChild(emptyDay);
            }
            
            // Get number of days in month
            const year = this.currentMonth.getFullYear();
            const month = this.currentMonth.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Add days
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateString = this.formatDateForDatabase(date);
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                
                // Add date to top of cell
                const dayNumber = document.createElement('div');
                dayNumber.textContent = day;
                dayEl.appendChild(dayNumber);
                
                // Determine which guard is on duty for this day
                const guarnicao = this.getGuarnicaoForDate(date);
                dayEl.classList.add(`guarnicao-${guarnicao.class}`);
                
                // Add count of PMs assigned to this date
                const pmsForDate = this.schedules.filter(s => s.date === dateString);
                
                if (pmsForDate.length > 0) {
                    const countEl = document.createElement('div');
                    countEl.className = 'calendar-day-count';
                    countEl.textContent = `${pmsForDate.length} ${pmsForDate.length === 1 ? 'PM' : 'PMs'}`;
                    dayEl.appendChild(countEl);
                    
                    // Add PM names if there are any
                    const namesContainer = document.createElement('div');
                    namesContainer.className = 'calendar-pm-names';
                    
                    pmsForDate.forEach(schedule => {
                        const pm = this.militares.find(m => m.id === schedule.pmId);
                        if (pm) {
                            const pmEl = document.createElement('div');
                            pmEl.className = `calendar-pm-item ${pm.rank}`;
                            pmEl.textContent = pm.name.split(' ')[0]; // Just the first name to save space
                            namesContainer.appendChild(pmEl);
                        }
                    });
                    
                    dayEl.appendChild(namesContainer);
                    dayEl.classList.add('has-events');
                }
                
                // Add click event to open day details
                dayEl.addEventListener('click', () => {
                    this.selectedDate = dateString;
                    this.openDayDetails(dateString);
                });
                
                container.appendChild(dayEl);
            }
        },
        
        formatDateForDatabase(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        
        formatDateForDisplay(dateString) {
            if (!dateString) return 'Nunca';
            
            const [year, month, day] = dateString.split('-').map(num => parseInt(num));
            return `${day}/${month}/${year}`;
        },
        
        // Modal functions
        openModal(modalId) {
            const modalOverlay = document.getElementById(modalId);
            modalOverlay.classList.add('active');
            
            // Add click event to close modal when clicking outside
            modalOverlay.addEventListener('click', (e) => {
                // Check if the click is on the overlay itself, not on modal content
                if (e.target === modalOverlay) {
                    this.closeModal(modalId);
                }
            });
            
            if (modalId === 'add-schedule-modal') {
                document.getElementById('schedule-date').value = this.formatDateForDatabase(new Date());
                this.populatePMDropdown();
            }
        },
        
        closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        },
        
        // Day details modal
        openDayDetails(dateString) {
            const date = new Date(`${dateString}T00:00:00`);
            const formattedDate = this.formatDateForDisplay(dateString);
            document.getElementById('day-details-title').textContent = `Escalas para ${formattedDate}`;
            
            // Get PMs for this date
            const pmsForDate = this.schedules.filter(s => s.date === dateString);
            
            // Populate list of assigned PMs
            const listEl = document.getElementById('day-details-pm-list');
            listEl.innerHTML = '';
            
            if (pmsForDate.length > 0) {
                pmsForDate.forEach(schedule => {
                    const pm = this.militares.find(m => m.id === schedule.pmId);
                    if (pm) {
                        const pmEl = document.createElement('div');
                        pmEl.className = 'day-details-pm-item';
                        
                        pmEl.innerHTML = `
                            <div class="day-details-pm-name">
                                <span class="rank-badge ${pm.rank}">${this.getRankName(pm.rank)}</span>
                                ${pm.name}
                            </div>
                            <button class="action-btn delete" data-schedule-id="${schedule.id}" title="Remover da escala">❌</button>
                        `;
                        
                        // Add remove button functionality
                        pmEl.querySelector('.action-btn.delete').addEventListener('click', (e) => {
                            const scheduleId = e.target.dataset.scheduleId;
                            this.removeSchedule(scheduleId);
                        });
                        
                        listEl.appendChild(pmEl);
                    }
                });
            } else {
                // Show message if no PMs assigned
                const emptyEl = document.createElement('div');
                emptyEl.textContent = 'Não há militares escalados para esta data.';
                emptyEl.style.padding = '10px';
                emptyEl.style.color = 'var(--text-secondary)';
                listEl.appendChild(emptyEl);
            }
            
            // Show warning if max PMs reached
            const warningEl = document.getElementById('day-details-limit-warning');
            const addForm = document.getElementById('day-add-pm-form');
            
            if (pmsForDate.length >= this.MAX_PMS_PER_DAY) {
                warningEl.style.display = 'block';
                addForm.style.display = 'none';
                document.getElementById('add-pm-to-day').style.display = 'none';
            } else {
                warningEl.style.display = 'none';
                addForm.style.display = 'block';
                document.getElementById('add-pm-to-day').style.display = 'inline-flex';
                
                // Populate dropdown with available PMs
                this.populateDayDetailsPMDropdown(dateString);
            }
            
            this.openModal('day-details-modal');
        },
        
        // Dropdown functions
        populatePMDropdown() {
            const dropdown = document.getElementById('schedule-pm');
            dropdown.innerHTML = '';
            
            this.militares.forEach(pm => {
                const option = document.createElement('option');
                option.value = pm.id;
                option.textContent = `${pm.name} (${this.getRankName(pm.rank)})`;
                dropdown.appendChild(option);
            });
        },
        
        populateDayDetailsPMDropdown(dateString) {
            const dropdown = document.getElementById('day-details-pm-select');
            dropdown.innerHTML = '';
            
            // Get PMs already assigned to this date
            const assignedPmIds = this.schedules
                .filter(s => s.date === dateString)
                .map(s => s.pmId);
            
            // Filter to only show unassigned PMs
            const availablePMs = this.militares.filter(pm => !assignedPmIds.includes(pm.id));
            
            if (availablePMs.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Todos os militares já estão escalados';
                option.disabled = true;
                dropdown.appendChild(option);
                document.getElementById('add-pm-to-day').disabled = true;
            } else {
                availablePMs.forEach(pm => {
                    const option = document.createElement('option');
                    option.value = pm.id;
                    option.textContent = `${pm.name} (${this.getRankName(pm.rank)})`;
                    dropdown.appendChild(option);
                });
                document.getElementById('add-pm-to-day').disabled = false;
            }
        },
        
        // CRUD Operations
        addPM() {
            const nameInput = document.getElementById('pm-name');
            const rankSelect = document.getElementById('pm-rank');
            const idInput = document.getElementById('pm-id');
            
            if (!nameInput.value || !rankSelect.value || !idInput.value) {
                this.showToast('Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Verificar se já existe PM com esse ID
            const existingPM = this.militares.find(pm => pm.name.toLowerCase() === nameInput.value.toLowerCase() || 
                                               idInput.value === pm.id_number);
            if (existingPM) {
                this.showToast('Já existe um militar com esse nome ou identificação', 'error');
                return;
            }

            // Mostrar feedback visual
            const addButton = document.getElementById('confirm-add-pm');
            const originalText = addButton.textContent;
            addButton.disabled = true;
            addButton.textContent = 'Salvando...';
            
            // Preparar dados para enviar para a API
            const novoMilitar = {
                nome: nameInput.value,
                posto: this.convertRankToDB(rankSelect.value),
                numero_identificacao: idInput.value,
                unidade: 'PMF', // Valor padrão
                status: 'ativo'
            };
            
            console.log('[INFO] Enviando novo militar para a API:', JSON.stringify(novoMilitar));
            
            // Enviar para a API
            fetch('/api/militares', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoMilitar)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao adicionar militar: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('[SUCCESS] Militar adicionado com sucesso:', data);
                
                // Adicionar à lista local
                const newPM = {
                    id: 'pm_' + data.militar.id,
                    name: data.militar.nome,
                    rank: this.convertRankFromDB(data.militar.posto),
                    id_number: data.militar.numero_identificacao
                };
                
                this.militares.push(newPM);
                console.log("[INFO] Atualizada lista local de militares:", this.militares);
                
                // Reset form
                nameInput.value = '';
                rankSelect.selectedIndex = 0;
                idInput.value = '';
                
                // Close modal
                this.closeModal('add-pm-modal');
                
                // Recarregar dados do banco de dados
                await this.recarregarDados();
                
                this.showToast('Militar adicionado com sucesso', 'success');
            })
            .catch(error => {
                console.error('[ERROR] Erro ao adicionar militar:', error);
                this.showToast(`Erro ao adicionar militar: ${error.message}`, 'error');
            })
            .finally(() => {
                // Restaurar botão
                addButton.disabled = false;
                addButton.textContent = originalText;
            });
        },
        
        editPM(id) {
            // Functionality to edit a PM
            const pm = this.militares.find(p => p.id === id);
            if (!pm) return;
            
            // Just a placeholder - would open a modal to edit
            this.showToast('Edição de PM será implementada em breve', 'info');
        },
        
        deletePM(id) {
            // Functionality to delete a PM
            const index = this.militares.findIndex(p => p.id === id);
            if (index === -1) return;
            
            // Remove the PM
            this.militares.splice(index, 1);
            
            // Also remove any schedules for this PM
            this.schedules = this.schedules.filter(s => s.pmId !== id);
            
            // Update UI
            this.renderMilitares();
            this.renderCalendars();
            this.updateDashboardMetrics();
            this.showToast('PM removido com sucesso', 'success');
        },
        
        addSchedule() {
            const dateInput = document.getElementById('schedule-date');
            const pmSelect = document.getElementById('schedule-pm');
            
            const date = dateInput.value;
            const pmId = pmSelect.value;
            
            if (!date || !pmId) {
                this.showToast('Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Check if this PM is already scheduled for this date
            const existingSchedule = this.schedules.find(s => s.date === date && s.pmId === pmId);
            if (existingSchedule) {
                this.showToast('Este PM já está escalado para esta data', 'error');
                return;
            }
            
            // Check if max PMs for this day reached
            const pmsForDate = this.schedules.filter(s => s.date === date);
            if (pmsForDate.length >= this.MAX_PMS_PER_DAY) {
                this.showToast(`Máximo de ${this.MAX_PMS_PER_DAY} PMs por dia atingido`, 'error');
                return;
            }
            
            // Check if this PM is available for this date
            const pm = this.militares.find(m => m.id === pmId);
            if (!pm) {
                this.showToast('Militar não encontrado', 'error');
                return;
            }
            
            // Mostrar feedback visual
            const addButton = document.getElementById('confirm-add-schedule');
            const originalText = addButton.textContent;
            addButton.disabled = true;
            addButton.textContent = 'Salvando...';
            
            console.log(`[INFO] Adicionando PM à escala: ${pm.name} (${pm.rank}) em ${date}`);
            
            // Extrair o ID numérico do militar (remover o prefixo 'pm_')
            const militarId = parseInt(pmId.replace('pm_', ''));
            
            // Primeiro, criar uma escala se não existir para o mês atual
            const currentMonth = new Date(date).toISOString().slice(0, 7); // YYYY-MM
            const escalaData = {
                titulo: `Escala ${currentMonth}`,
                data_inicio: `${currentMonth}-01`, // Primeiro dia do mês
                data_fim: new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0).toISOString().slice(0, 10), // Último dia do mês
                tipo: 'ordinaria',
                status: 'ativa'
            };
            
            console.log('[INFO] Dados da escala:', escalaData);
            
            // Verificar se já existe uma escala para este mês
            fetch('/api/escalas')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao buscar escalas: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('[INFO] Escalas existentes:', data);
                
                let escalaId;
                const escalasDoMes = data.escalas.filter(e => e.data_inicio.startsWith(currentMonth));
                
                if (escalasDoMes.length > 0) {
                    // Usar a escala existente
                    escalaId = escalasDoMes[0].id;
                    console.log(`[INFO] Usando escala existente com ID ${escalaId}`);
                    return escalaId;
                } else {
                    // Criar nova escala
                    console.log('[INFO] Criando nova escala para o mês');
                    
                    return fetch('/api/escalas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(escalaData)
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Falha ao criar escala: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('[SUCCESS] Nova escala criada:', data);
                        return data.escala.id;
                    });
                }
            })
            .then(escalaId => {
                // Agora adicionar o militar à escala com todos os campos obrigatórios
                const detalheEscala = {
                    escala_id: escalaId,
                    militar_id: militarId,
                    data_servico: date,
                    horario_inicio: '08:00:00', // Garantir formato correto para TIME
                    horario_fim: '18:00:00',    // Garantir formato correto para TIME
                    funcao: 'Patrulhamento',
                    observacoes: ''
                };
                
                console.log('[INFO] Enviando detalhe de escala para a API:', JSON.stringify(detalheEscala));
                
                return fetch(`/api/escalas/${escalaId}/detalhes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(detalheEscala)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao adicionar militar à escala: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('[SUCCESS] Militar adicionado à escala com sucesso:', data);
                
                // Reset form and close modal
                dateInput.value = '';
                pmSelect.selectedIndex = 0;
                this.closeModal('add-schedule-modal');
                
                // Recarregar dados do banco de dados
                await this.recarregarDados();
                
                this.showToast('Escala adicionada com sucesso', 'success');
            })
            .catch(error => {
                console.error('[ERROR] Erro ao adicionar escala:', error);
                this.showToast(`Erro ao adicionar escala: ${error.message}`, 'error');
            })
            .finally(() => {
                // Restaurar botão
                addButton.disabled = false;
                addButton.textContent = originalText;
            });
        },
        
        addPMToSelectedDay() {
            if (!this.selectedDate) return;
            
            const pmSelect = document.getElementById('day-details-pm-select');
            const pmId = pmSelect.value;
            
            if (!pmId) {
                this.showToast('Por favor, selecione um PM', 'error');
                return;
            }
            
            // Check if this PM is available for this date
            const pm = this.militares.find(m => m.id === pmId);
            if (!pm) {
                this.showToast('Militar não encontrado', 'error');
                return;
            }
            
            // Mostrar feedback visual
            const addButton = document.getElementById('add-pm-to-day');
            const originalText = addButton.textContent;
            addButton.disabled = true;
            addButton.textContent = 'Salvando...';
            
            // Log for debugging
            console.log(`[INFO] Adicionando PM à escala: ${pm.name} (${pm.rank}) em ${this.selectedDate}`);
            
            // Extrair o ID numérico do militar (remover o prefixo 'pm_')
            const militarId = parseInt(pmId.replace('pm_', ''));
            
            // Primeiro, criar uma escala se não existir para o mês atual
            const currentMonth = new Date(this.selectedDate).toISOString().slice(0, 7); // YYYY-MM
            const escalaData = {
                titulo: `Escala ${currentMonth}`,
                data_inicio: `${currentMonth}-01`, // Primeiro dia do mês
                data_fim: new Date(new Date(this.selectedDate).getFullYear(), new Date(this.selectedDate).getMonth() + 1, 0).toISOString().slice(0, 10), // Último dia do mês
                tipo: 'ordinaria',
                status: 'ativa'
            };
            
            // Verificar se já existe uma escala para este mês
            fetch('/api/escalas')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao buscar escalas: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                let escalaId;
                const escalasDoMes = data.escalas.filter(e => e.data_inicio.startsWith(currentMonth));
                
                if (escalasDoMes.length > 0) {
                    // Usar a escala existente
                    escalaId = escalasDoMes[0].id;
                    console.log(`[INFO] Usando escala existente com ID ${escalaId}`);
                    return escalaId;
                } else {
                    // Criar nova escala
                    console.log('[INFO] Criando nova escala para o mês');
                    
                    return fetch('/api/escalas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(escalaData)
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Falha ao criar escala: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('[SUCCESS] Nova escala criada:', data);
                        return data.escala.id;
                    });
                }
            })
            .then(escalaId => {
                // Agora adicionar o militar à escala com todos os campos obrigatórios
                const detalheEscala = {
                    escala_id: escalaId,
                    militar_id: militarId,
                    data_servico: this.selectedDate,
                    horario_inicio: '08:00:00', // Garantir formato correto para TIME
                    horario_fim: '18:00:00',    // Garantir formato correto para TIME
                    funcao: 'Patrulhamento',
                    observacoes: ''
                };
                
                console.log('[INFO] Enviando dados para a API:', JSON.stringify(detalheEscala));
                
                return fetch(`/api/escalas/${escalaId}/detalhes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(detalheEscala)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao adicionar militar à escala: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('[SUCCESS] Militar adicionado à escala com sucesso:', data);
                
                // Fechar modal
                this.closeModal('day-details-modal');
                
                // Recarregar dados do banco de dados
                await this.recarregarDados();
                
                this.showToast('PM adicionado à escala com sucesso', 'success');
            })
            .catch(error => {
                console.error('[ERROR] Erro ao adicionar escala:', error);
                this.showToast(`Erro ao adicionar escala: ${error.message}`, 'error');
            })
            .finally(() => {
                // Restaurar botão
                addButton.disabled = false;
                addButton.textContent = originalText;
            });
        },
        
        removeSchedule(id) {
            const index = this.schedules.findIndex(s => s.id === id);
            if (index === -1) return;
            
            // Mostrar feedback visual - desabilitar botão de remoção
            const deleteBtn = document.querySelector(`[data-schedule-id="${id}"]`);
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '⏳';
            }
            
            // Extrair o ID numérico do detalhe da escala (remover o prefixo 'schedule_')
            const detalheId = parseInt(id.replace('schedule_', ''));
            
            // Remover do banco de dados
            fetch(`/api/escalas/detalhes/${detalheId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Falha ao remover escala do banco de dados: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(async data => {
                console.log('[SUCCESS] Detalhe de escala removido com sucesso:', data);
                
                // Recarregar dados do banco de dados para atualizar a interface
                await this.recarregarDados();
                
                // Se o modal de detalhes do dia estiver aberto, reabrimos com dados atualizados
                if (this.selectedDate) {
                    this.openDayDetails(this.selectedDate);
                }
                
                this.showToast('PM removido da escala', 'success');
            })
            .catch(error => {
                console.error('[ERROR] Erro ao remover escala:', error);
                this.showToast(`Erro ao remover escala: ${error.message}`, 'error');
                
                // Restaurar o botão em caso de erro
                if (deleteBtn) {
                    deleteBtn.disabled = false;
                    deleteBtn.innerHTML = '❌';
                }
            });
        },
        
        // Search functionality
        searchPM() {
            const searchInput = document.getElementById('search-input');
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            if (!searchTerm) {
                this.showToast('Digite um termo para busca', 'info');
                return;
            }
            
            // Find PMs matching search term
            const results = this.militares.filter(pm => 
                pm.name.toLowerCase().includes(searchTerm));
            
            const resultsContainer = document.getElementById('search-results');
            const noResultsContainer = document.getElementById('no-results');
            const initialMessage = document.getElementById('initial-message');
            const resultsList = document.getElementById('search-results-list');
            const searchCount = document.getElementById('search-count');
            
            // Clear previous results
            resultsList.innerHTML = '';
            
            if (results.length > 0) {
                // Show results
                resultsContainer.style.display = 'block';
                noResultsContainer.style.display = 'none';
                initialMessage.style.display = 'none';
                searchCount.textContent = `${results.length} ${results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
                
                // Create result cards
                const template = document.getElementById('pm-result-template');
                
                results.forEach(pm => {
                    // Clone the template
                    const card = document.importNode(template.content, true);
                    
                    // Fill in PM details
                    card.querySelector('.pm-result-name').textContent = pm.name;
                    
                    const rankBadge = card.querySelector('.rank-badge');
                    rankBadge.textContent = this.getRankName(pm.rank);
                    rankBadge.className = `rank-badge rank-${pm.rank}`;
                    
                    // Count schedules
                    const pmSchedules = this.schedules.filter(s => s.pmId === pm.id);
                    card.querySelector('.pm-stat-value').textContent = pmSchedules.length;
                    
                    // Last schedule
                    let lastScheduleDate = 'Nunca';
                    if (pmSchedules.length > 0) {
                        const dates = pmSchedules.map(s => s.date).sort().reverse();
                        lastScheduleDate = this.formatDateForDisplay(dates[0]);
                    }
                    card.querySelectorAll('.pm-stat-value')[1].textContent = lastScheduleDate;
                    
                    // Add dates to list
                    const datesList = card.querySelector('.pm-dates-list');
                    datesList.innerHTML = '';
                    
                    if (pmSchedules.length > 0) {
                        pmSchedules
                            .map(s => s.date)
                            .sort()
                            .forEach(date => {
                                const dateItem = document.createElement('div');
                                dateItem.className = 'pm-date-item';
                                dateItem.textContent = this.formatDateForDisplay(date);
                                datesList.appendChild(dateItem);
                            });
                    } else {
                        const noDateItem = document.createElement('div');
                        noDateItem.textContent = 'Nenhuma data de escala encontrada';
                        noDateItem.style.color = 'var(--text-secondary)';
                        datesList.appendChild(noDateItem);
                    }
                    
                    // Add event to delete button
                    const deleteBtn = card.querySelector('.action-btn.delete');
                    deleteBtn.addEventListener('click', (e) => {
                        const resultCard = e.target.closest('.pm-result-card');
                        resultCard.remove();
                        
                        // Update count
                        const remainingResults = document.querySelectorAll('.pm-result-card').length;
                        searchCount.textContent = `${remainingResults} ${remainingResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
                        
                        if (remainingResults === 0) {
                            resultsContainer.style.display = 'none';
                            initialMessage.style.display = 'block';
                        }
                    });
                    
                    resultsList.appendChild(card);
                });
            } else {
                // Show no results message
                resultsContainer.style.display = 'none';
                noResultsContainer.style.display = 'block';
                initialMessage.style.display = 'none';
            }
        },
        
        // Utility functions
        getRankName(rank) {
            const ranks = {
                'soldier': 'Alfa',
                'officer': 'Bravo',
                'captain': 'Charlie',
                'expedient': 'Expediente'
            };
            return ranks[rank] || rank;
        },
        
        getLastScheduleDate(pmId) {
            const pmSchedules = this.schedules.filter(s => s.pmId === pmId);
            if (pmSchedules.length === 0) return 'Nunca';
            
            const dates = pmSchedules.map(s => s.date);
            const latestDate = dates.sort().reverse()[0];
            return this.formatDateForDisplay(latestDate);
        },
        
        getScheduleCount(pmId) {
            return this.schedules.filter(s => s.pmId === pmId).length;
        },
        
        showToast(message, type = 'info') {
            const toast = document.getElementById('toast-notification');
            toast.textContent = message;
            toast.className = 'toast';
            
            if (type === 'success') toast.classList.add('success');
            if (type === 'error') toast.classList.add('error');
            
            toast.classList.add('visible');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                toast.classList.remove('visible');
            }, 3000);
        },
        
        // Dashboard metrics
        updateDashboardMetrics() {
            // Total days with schedules
            const uniqueDates = [...new Set(this.schedules.map(s => s.date))];
            document.getElementById('total-days-value').textContent = uniqueDates.length;
            
            // Total PMs
            document.getElementById('pms-value').textContent = this.militares.length;
            
            // Average schedules per PM
            let average = 0;
            if (this.militares.length > 0) {
                average = this.schedules.length / this.militares.length;
                average = Math.round(average * 10) / 10; // Round to 1 decimal
            }
            document.getElementById('average-value').textContent = average;
            
            // Monthly occupation percentage
            const totalDaysInMonth = new Date(
                this.currentMonth.getFullYear(),
                this.currentMonth.getMonth() + 1,
                0
            ).getDate();
            
            const currentMonthStr = `${this.currentMonth.getFullYear()}-${String(this.currentMonth.getMonth() + 1).padStart(2, '0')}`;
            const daysThisMonth = uniqueDates.filter(date => date.startsWith(currentMonthStr)).length;
            
            const occupation = Math.round(daysThisMonth / totalDaysInMonth * 100);
            document.getElementById('occupation-value').textContent = `${occupation}%`;
        },
        
        // Reports data
        updateReportData() {
            console.log("%c Updating report data...", "background: #2196f3; color: white; font-weight: bold");
            
            // Get data for the current period
            const reportPeriod = document.getElementById('report-period').value;
            const currentDate = new Date();
            let startDate, endDate;
            
            // Determine date range based on selected period
            if (reportPeriod === 'month') {
                // Current month
                startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
                endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
            } else if (reportPeriod === 'quarter') {
                // Last 3 months
                startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 2, 1);
                endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
            } else if (reportPeriod === 'year') {
                // Year
                startDate = new Date(this.currentMonth.getFullYear(), 0, 1);
                endDate = new Date(this.currentMonth.getFullYear(), 11, 31);
            } else {
                // Default to current month
                startDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
                endDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
            }
            
            const startDateStr = this.formatDateForDatabase(startDate);
            const endDateStr = this.formatDateForDatabase(endDate);
            
            console.log(`Report period: ${startDateStr} to ${endDateStr}`);
            
            // Dump all schedules for debugging
            console.log("All schedules to process:", JSON.stringify(this.schedules, null, 2));
            
            // Count schedules for each garrison type
            let alfaSchedules = 0;
            let bravoSchedules = 0; 
            let charlieSchedules = 0;
            let expedienteSchedules = 0;
            
            // Debug each schedule's date comparisons
            for (const schedule of this.schedules) {
                console.log(`Checking schedule: ${schedule.id}, Date: ${schedule.date}`);
                console.log(` - is >= ${startDateStr}? ${schedule.date >= startDateStr}`);
                console.log(` - is <= ${endDateStr}? ${schedule.date <= endDateStr}`);
            }
            
            // Filter schedules in the date range - using string comparison to be more accurate
            const schedulesInPeriod = this.schedules.filter(s => {
                // Convert to string format for reliable comparison
                const sDate = s.date; // Already in YYYY-MM-DD format
                return (
                    sDate >= startDateStr && 
                    sDate <= endDateStr
                );
            });
            
            console.log(`Total schedules in period: ${schedulesInPeriod.length}`);
            console.log("Schedules in period:", JSON.stringify(schedulesInPeriod, null, 2));
            
            // Count schedules by garrison type
            schedulesInPeriod.forEach(schedule => {
                const pm = this.militares.find(m => m.id === schedule.pmId);
                if (!pm) return;
                
                if (pm.rank === 'soldier') alfaSchedules++;
                if (pm.rank === 'officer') bravoSchedules++;
                if (pm.rank === 'captain') charlieSchedules++;
                if (pm.rank === 'expedient') expedienteSchedules++;
            });
            
            // Update "Total de Extras" metric
            document.querySelector('.report-metric .metric-value').textContent = schedulesInPeriod.length;
            
            // Update DOM with schedule counts
            document.getElementById('alfa-count').querySelector('.rank-count').textContent = alfaSchedules;
            document.getElementById('bravo-count').querySelector('.rank-count').textContent = bravoSchedules;
            document.getElementById('charlie-count').querySelector('.rank-count').textContent = charlieSchedules;
            document.getElementById('expediente-count').querySelector('.rank-count').textContent = expedienteSchedules;

            // Update chart bars
            const totalSchedules = schedulesInPeriod.length;
            if (totalSchedules > 0) {
                const chartBars = document.querySelectorAll('.bar-chart .chart-bar');
                
                // Set chart-bar heights based on percentage of schedules
                chartBars[0].style.height = `${Math.round(alfaSchedules / totalSchedules * 100)}%`;
                chartBars[1].style.height = `${Math.round(bravoSchedules / totalSchedules * 100)}%`;
                chartBars[2].style.height = `${Math.round(charlieSchedules / totalSchedules * 100)}%`;
                chartBars[3].style.height = `${Math.round(expedienteSchedules / totalSchedules * 100)}%`;
            } else {
                // If no schedules, set heights to 0
                const chartBars = document.querySelectorAll('.bar-chart .chart-bar');
                chartBars.forEach(bar => {
                    bar.style.height = '0%';
                });
            }
            
            // Update ranking table with actual data
            this.updateRankingTable(schedulesInPeriod);
        },
        
        // Update the ranking table with actual schedule data
        updateRankingTable(schedules) {
            const rankingTable = document.querySelector('.report-card:nth-child(2) .report-table tbody');
            if (!rankingTable) return;
            
            rankingTable.innerHTML = '';
            
            // Count schedules per PM
            const pmScheduleCounts = {};
            schedules.forEach(schedule => {
                if (!pmScheduleCounts[schedule.pmId]) {
                    pmScheduleCounts[schedule.pmId] = 0;
                }
                pmScheduleCounts[schedule.pmId]++;
            });
            
            // Convert to array and sort by count (descending)
            const sortedPMs = Object.entries(pmScheduleCounts)
                .map(([pmId, count]) => {
                    const pm = this.militares.find(m => m.id === pmId);
                    return {
                        id: pmId,
                        name: pm ? pm.name : 'Desconhecido',
                        rank: pm ? pm.rank : '',
                        count: count
                    };
                })
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Get top 5
            
            // Add rows to table
            if (sortedPMs.length === 0) {
                const emptyRow = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 3;
                cell.textContent = 'Nenhum militar escalado no período';
                cell.style.textAlign = 'center';
                emptyRow.appendChild(cell);
                rankingTable.appendChild(emptyRow);
                return;
            }
            
            sortedPMs.forEach(pm => {
                const row = document.createElement('tr');
                
                // Name cell
                const nameCell = document.createElement('td');
                nameCell.textContent = pm.name;
                row.appendChild(nameCell);
                
                // Garrison cell
                const rankCell = document.createElement('td');
                rankCell.textContent = this.getRankName(pm.rank);
                row.appendChild(rankCell);
                
                // Count cell
                const countCell = document.createElement('td');
                countCell.textContent = pm.count;
                row.appendChild(countCell);
                
                rankingTable.appendChild(row);
            });
        },
        
        // Render militares list
        renderMilitares() {
            const searchTerm1 = document.getElementById('search-pm').value.toLowerCase();
            const rankFilter1 = document.getElementById('filter-rank').value;
            
            // Filter militares
            const filteredMilitares = this.militares.filter(pm => {
                // Apply search term filter
                const nameMatch = pm.name.toLowerCase().includes(searchTerm1);
                // Apply rank filter if set
                const rankMatch = rankFilter1 ? pm.rank === rankFilter1 : true;
                return nameMatch && rankMatch;
            });
            
            // Sort by name
            filteredMilitares.sort((a, b) => a.name.localeCompare(b.name));
            
            // Render to both tables
            const tableIds = ['pm-table-body', 'pm-table-body-2'];
            
            tableIds.forEach(tableId => {
                const tableBody = document.getElementById(tableId);
                tableBody.innerHTML = '';
                
                if (filteredMilitares.length === 0) {
                    const emptyRow = document.createElement('tr');
                    const emptyCell = document.createElement('td');
                    emptyCell.colSpan = 5;
                    emptyCell.className = 'table-empty';
                    
                    if (searchTerm1 || rankFilter1) {
                        emptyCell.textContent = 'Nenhum militar encontrado com estes filtros.';
                    } else {
                        emptyCell.textContent = 'Nenhum militar adicionado ainda. Clique em "Adicionar PM".';
                    }
                    
                    emptyRow.appendChild(emptyCell);
                    tableBody.appendChild(emptyRow);
                    return;
                }
                
                // Add rows
                filteredMilitares.forEach(pm => {
                    const row = document.createElement('tr');
                    
                    // Name cell
                    const nameCell = document.createElement('td');
                    nameCell.textContent = pm.name;
                    row.appendChild(nameCell);
                    
                    // Rank cell
                    const rankCell = document.createElement('td');
                    const rankBadge = document.createElement('span');
                    rankBadge.className = `rank-badge rank-${pm.rank}`;
                    rankBadge.textContent = this.getRankName(pm.rank);
                    rankCell.appendChild(rankBadge);
                    row.appendChild(rankCell);
                    
                    // Total schedules cell
                    const totalCell = document.createElement('td');
                    totalCell.textContent = this.getScheduleCount(pm.id);
                    row.appendChild(totalCell);
                    
                    // Last schedule cell
                    const lastCell = document.createElement('td');
                    lastCell.textContent = this.getLastScheduleDate(pm.id);
                    row.appendChild(lastCell);
                    
                    // Actions cell
                    const actionsCell = document.createElement('td');
                    
                    const editBtn = document.createElement('button');
                    editBtn.className = 'action-btn edit';
                    editBtn.innerHTML = '✏️';
                    editBtn.addEventListener('click', () => this.editPM(pm.id));
                    actionsCell.appendChild(editBtn);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'action-btn delete';
                    deleteBtn.innerHTML = '❌';
                    deleteBtn.addEventListener('click', () => this.deletePM(pm.id));
                    actionsCell.appendChild(deleteBtn);
                    
                    row.appendChild(actionsCell);
                    
                    tableBody.appendChild(row);
                });
            });
        },
        
        // Conflict detection
        detectConflicts() {
            console.log("%c Running conflict detection... ", "background: #f39c12; color: white; font-weight: bold");
            const conflictsTableBody = document.getElementById('conflicts-table-body');
            conflictsTableBody.innerHTML = '';
            
            // Dump all schedules for debugging
            console.log("All schedules in system:", JSON.stringify(this.schedules, null, 2));
            
            // Use the currently displayed month in the UI instead of system date
            // This ensures we're checking the month the user is viewing
            const year = this.currentMonth.getFullYear();
            const month = this.currentMonth.getMonth();
            console.log(`Checking for conflicts in: ${month+1}/${year}`);
            
            // Get days in the month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            // Force check specific dates where we know there are issues
            console.log("%c Specifically checking May 1 and May 15", "background: #e74c3c; color: white; font-weight: bold");
            const specificDates = [
                new Date(2025, 4, 1),  // May 1, 2025
                new Date(2025, 4, 15)  // May 15, 2025
            ];
            
            for (const testDate of specificDates) {
                const testDateStr = this.formatDateForDatabase(testDate);
                const testGarrison = this.getGuarnicaoForDate(testDate);
                
                console.log(`TEST DATE: ${testDateStr}, Garrison: ${testGarrison.name} (${testGarrison.class})`);
                
                // Find schedules for this date
                const testSchedules = this.schedules.filter(s => s.date === testDateStr);
                console.log(`Schedules for ${testDateStr}:`, testSchedules.length);
                
                testSchedules.forEach(schedule => {
                    const pm = this.militares.find(m => m.id === schedule.pmId);
                    if (pm) {
                        console.log(`PM on ${testDateStr}: ${pm.name}, Rank: ${pm.rank} vs Garrison: ${testGarrison.class}`);
                        
                        if (pm.rank === testGarrison.class) {
                            console.log(`%c SHOULD BE A CONFLICT: ${pm.name} on ${testDateStr}`, "background: red; color: white");
                        }
                    }
                });
            }
            
            let conflicts = [];
            
            // Check each day of the month and all schedules regardless of month
            for (let scheduleIndex = 0; scheduleIndex < this.schedules.length; scheduleIndex++) {
                const schedule = this.schedules[scheduleIndex];
                const dateString = schedule.date;
                
                // Parse the date to get the components
                const [dateYear, dateMonth, dateDay] = dateString.split('-').map(num => parseInt(num));
                
                // Check if this date is in our current month view (optional filter)
                if (dateMonth - 1 !== month || dateYear !== year) {
                    continue; // Skip if not in current month view
                }
                
                // Get the PM for this schedule
                const pm = this.militares.find(m => m.id === schedule.pmId);
                if (!pm) continue; // Skip if PM not found
                
                // Get the ordinary garrison for this date
                const date = new Date(dateYear, dateMonth - 1, dateDay);
                const guarnicao = this.getGuarnicaoForDate(date);
                
                console.log(`Checking schedule: ${pm.name} on ${dateString}, PM Rank: ${pm.rank}, Duty: ${guarnicao.class}`);
                
                // Direct check if PM's rank/garrison matches the on-duty garrison
                if (pm.rank === guarnicao.class) {
                    console.log(`CONFLICT DETECTED: ${pm.name} on ${dateString}`);
                    
                    // Check if this conflict is already in the array
                    const existingConflict = conflicts.find(c => 
                        c.date === dateString && c.pmName === pm.name
                    );
                    
                    if (!existingConflict) {
                        conflicts.push({
                            date: dateString,
                            formattedDate: this.formatDateForDisplay(dateString),
                            pmName: pm.name,
                            ordinaryGuarnicao: this.getRankName(pm.rank),
                            pmRank: pm.rank,
                            extraOperation: 'PMF'
                        });
                    }
                }
            }
            
            // Display conflicts
            console.log(`Total conflicts found: ${conflicts.length}`);
            if (conflicts.length > 0) {
                conflicts.forEach(conflict => {
                    const row = document.createElement('tr');
                    
                    // Date cell
                    const dateCell = document.createElement('td');
                    dateCell.textContent = conflict.formattedDate;
                    row.appendChild(dateCell);
                    
                    // PM Name cell
                    const nameCell = document.createElement('td');
                    nameCell.textContent = conflict.pmName;
                    row.appendChild(nameCell);
                    
                    // Ordinary Garrison cell
                    const garrisonCell = document.createElement('td');
                    const rankBadge = document.createElement('span');
                    rankBadge.className = `rank-badge rank-${conflict.pmRank}`;
                    rankBadge.textContent = conflict.ordinaryGuarnicao;
                    garrisonCell.appendChild(rankBadge);
                    row.appendChild(garrisonCell);
                    
                    // Extra Operation cell
                    const operationCell = document.createElement('td');
                    operationCell.textContent = conflict.extraOperation;
                    row.appendChild(operationCell);
                    
                    // Status cell
                    const statusCell = document.createElement('td');
                    const statusBadge = document.createElement('div');
                    statusBadge.className = 'conflict-status';
                    statusBadge.innerHTML = '⚠️ Conflito';
                    statusCell.appendChild(statusBadge);
                    row.appendChild(statusCell);
                    
                    conflictsTableBody.appendChild(row);
                });
            } else {
                // No conflicts found
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 5;
                emptyCell.innerHTML = '<div class="no-conflicts-message">✓ Nenhum conflito de escala detectado</div>';
                emptyRow.appendChild(emptyCell);
                conflictsTableBody.appendChild(emptyRow);
            }
        }
    };

    // Initialize the app
    app.init();
});