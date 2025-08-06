// Enhanced Configuration
        const GOOGLE_SHEETS_CONFIG = {
            SHEET_ID: '1XqOc2FAH5VvlyzhdTL2vs7T1jgS45U5W4zDCn03rZ1g',
            API_KEY: 'AIzaSyCfnSym_wpPtzWL0P3-kslY1Y14B7nD-34',
            RANGE: 'INBOUND!A:Z',
            WRITE_RANGE: 'INBOUND!A2:Z'
        };

        // Enhanced State Management
        let currentUser = null;
        let isAuthenticated = false;
        let sampleData = [];
        let filteredData = [];
        let displayedData = [];
        let selectedItems = new Set();
        let currentPage = 1;
        let itemsPerPage = 25;
        let sortColumn = 'tanggal';
        let sortDirection = 'desc';
        let isOnline = navigator.onLine;
        let connectionRetryCount = 0;
        let maxRetries = 3;

        // Enhanced User Management
        const validUsers = {
            'admin': { password: 'password123', role: 'admin', name: 'Administrator' },
            'user1': { password: 'user123', role: 'user', name: 'User 1' },
            'manager': { password: 'manager123', role: 'manager', name: 'Manager' },
            'supervisor': { password: 'super123', role: 'supervisor', name: 'Supervisor' }
        };

        // Enhanced Google Sheets API
        class GoogleSheetsAPI {
            constructor(config) {
                this.config = config;
                this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
                this.retryDelay = 1000;
            }

            async readData() {
                try {
                    showConnectionStatus('syncing', 'Memuat data...');
                    const url = `${this.baseUrl}/${this.config.SHEET_ID}/values/${this.config.RANGE}?key=${this.config.API_KEY}`;
                    
                    const response = await this.fetchWithRetry(url);
                    const data = await response.json();
                    
                    showConnectionStatus('online', 'Terhubung');
                    return this.parseSheetData(data.values || []);
                } catch (error) {
                    console.error('Error reading from Google Sheets:', error);
                    showConnectionStatus('offline', 'Offline');
                    return this.getLocalData();
                }
            }

            async fetchWithRetry(url, options = {}, retries = 0) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    connectionRetryCount = 0;
                    return response;
                } catch (error) {
                    if (retries < maxRetries) {
                        console.log(`Retry attempt ${retries + 1}/${maxRetries}`);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
                        return this.fetchWithRetry(url, options, retries + 1);
                    }
                    throw error;
                }
            }

            parseSheetData(values) {
                if (values.length <= 1) return [];
                
                const headers = values[0];
                const dataRows = values.slice(1);
                
                return dataRows.map((row, index) => {
                    return {
                        no: parseInt(row[0]) || index + 1,
                        tanggal: row[1] || new Date().toISOString().split('T')[0],
                        produk: row[2] || '',
                        size: row[3] || '',
                        packing: row[4] || '',
                        brand: row[5] || '',
                        po: row[6] || '',
                        qty: parseInt(row[7]) || 0,
                        noPlat: row[8] || '',
                        supplier: row[9] || '',
                        driver: row[10] || '',
                        status: row[11] || 'pending',
                        catatan: row[12] || '',
                        waktuMasuk: row[13] || '',
                        petugas: row[14] || '',
                        kondisi: row[15] || ''
                    };
                }).filter(item => item.produk || item.po || item.noPlat);
            }

            async updateStatusAndNotes(rowIndex, item) {
                try {
                    const statusRange = `INBOUND!L${rowIndex + 2}:O${rowIndex + 2}`;
                    const values = [[
                        item.status,
                        item.catatan,
                        new Date().toLocaleString('id-ID'),
                        currentUser
                    ]];

                    const url = `${this.baseUrl}/${this.config.SHEET_ID}/values/${statusRange}?valueInputOption=RAW&key=${this.config.API_KEY}`;
                    
                    const response = await this.fetchWithRetry(url, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ values })
                    });

                    return await response.json();
                } catch (error) {
                    console.error('Error updating status in Google Sheets:', error);
                    throw error;
                }
            }

            getLocalData() {
                return [
                    {
                        no: 1, tanggal: '2024-01-15', produk: 'Beras Premium', size: '5kg', packing: 'Karung',
                        brand: 'Brand A', po: 'PO001', qty: 100, noPlat: 'B 1234 CD', status: 'pending', catatan: ''
                    },
                    {
                        no: 2, tanggal: '2024-01-16', produk: 'Beras Organik', size: '10kg', packing: 'Karung',
                        brand: 'Brand B', po: 'PO002', qty: 50, noPlat: 'B 5678 EF', status: 'valid', catatan: 'Kondisi baik'
                    },
                    {
                        no: 3, tanggal: '2024-01-17', produk: 'Tepung Terigu', size: '1kg', packing: 'Plastik',
                        brand: 'Brand C', po: 'PO003', qty: 200, noPlat: 'B 9012 GH', status: 'invalid', catatan: 'Kemasan rusak'
                    },
                    {
                        no: 4, tanggal: '2024-01-18', produk: 'Beras Premium', size: '25kg', packing: 'Karung',
                        brand: 'Brand A', po: 'PO004', qty: 75, noPlat: 'B 3456 IJ', status: 'pending', catatan: ''
                    },
                    {
                        no: 5, tanggal: '2024-01-19', produk: 'Beras Organik', size: '5kg', packing: 'Karung',
                        brand: 'Brand B', po: 'PO005', qty: 120, noPlat: 'B 7890 KL', status: 'valid', catatan: 'Sesuai jadwal'
                    }
                ];
            }
        }

        const sheetsAPI = new GoogleSheetsAPI(GOOGLE_SHEETS_CONFIG);

        // Enhanced Authentication
        async function login(username, password) {
            const loginSpinner = document.getElementById('loginSpinner');
            const loginButton = document.getElementById('loginButton');
            
            loginSpinner.classList.remove('hidden');
            loginButton.classList.add('btn-loading');
            loginButton.disabled = true;

            await new Promise(resolve => setTimeout(resolve, 1000));

            const user = validUsers[username];
            if (user && user.password === password) {
                currentUser = username;
                isAuthenticated = true;
                
                const rememberMe = document.getElementById('rememberMe').checked;
                if (rememberMe) {
                    localStorage.setItem('kroscekUser', username);
                    localStorage.setItem('kroscekAuth', 'true');
                }
                
                document.getElementById('currentUser').textContent = user.name;
                hideLoginModal();
                await initializeAfterLogin();
                showSyncStatus('✅ Login berhasil! Selamat datang ' + user.name, 'success');
                return true;
            } else {
                showLoginError('❌ Username atau password salah');
                return false;
            }
        }

        function showLoginError(message) {
            let errorDiv = document.getElementById('loginError');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'loginError';
                errorDiv.className = 'error-message';
                document.getElementById('loginForm').appendChild(errorDiv);
            }
            
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                if (errorDiv) errorDiv.style.display = 'none';
            }, 3000);
        }

        // Enhanced Data Management
        async function loadDataFromSheets() {
            if (!isAuthenticated) return;

            showLoadingState(true);
            
            try {
                const cachedData = localStorage.getItem('kroscekData');
                if (cachedData && !isOnline) {
                    sampleData = JSON.parse(cachedData);
                    filteredData = [...sampleData];
                    renderTable();
                    showSyncStatus('📱 Data dimuat dari cache (offline)', 'warning');
                    return;
                }

                sampleData = await sheetsAPI.readData();
                filteredData = [...sampleData];
                localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                
                applyFilters();
                showSyncStatus('✅ Data berhasil dimuat dari Google Sheets', 'success');
                
            } catch (error) {
                console.error('Failed to load data:', error);
                const cachedData = localStorage.getItem('kroscekData');
                if (cachedData) {
                    sampleData = JSON.parse(cachedData);
                    filteredData = [...sampleData];
                    applyFilters();
                    showSyncStatus('📱 Data dimuat dari cache lokal', 'warning');
                } else {
                    sampleData = sheetsAPI.getLocalData();
                    filteredData = [...sampleData];
                    applyFilters();
                    showSyncStatus('❌ Menggunakan data demo', 'error');
                }
            } finally {
                showLoadingState(false);
            }
        }

        // Enhanced UI Functions
        function showLoadingState(show) {
            const loadingState = document.getElementById('loadingState');
            const dataTable = document.getElementById('dataTable');
            const mobileCards = document.getElementById('mobileCards');
            
            if (show) {
                loadingState.classList.remove('hidden');
                dataTable.innerHTML = '';
                mobileCards.innerHTML = '';
            } else {
                loadingState.classList.add('hidden');
            }
        }

        function showEmptyState(show) {
            const emptyState = document.getElementById('emptyState');
            emptyState.classList.toggle('hidden', !show);
        }

        function showConnectionStatus(status, message) {
            const indicator = document.getElementById('connectionStatus');
            indicator.className = `connection-indicator connection-${status}`;
            indicator.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-white rounded-full ${status === 'syncing' ? 'pulse' : ''}"></div>
                    <span>${message}</span>
                </div>
            `;
            indicator.classList.remove('hidden');
        }

        // Enhanced Filtering and Sorting
        function applyFilters() {
            const dateFilter = document.getElementById('filterDate').value;
            const produkFilter = document.getElementById('filterProduk').value;
            const brandFilter = document.getElementById('filterBrand').value;
            const statusFilter = document.getElementById('filterStatus').value;
            const searchQuery = document.getElementById('searchBox').value.toLowerCase();

            filteredData = sampleData.filter(item => {
                const matchDate = !dateFilter || item.tanggal === dateFilter;
                const matchProduk = !produkFilter || item.produk === produkFilter;
                const matchBrand = !brandFilter || item.brand === brandFilter;
                const matchStatus = !statusFilter || item.status === statusFilter;
                const matchSearch = !searchQuery || 
                    item.produk.toLowerCase().includes(searchQuery) ||
                    item.brand.toLowerCase().includes(searchQuery) ||
                    item.noPlat.toLowerCase().includes(searchQuery) ||
                    item.packing.toLowerCase().includes(searchQuery) ||
                    item.po.toLowerCase().includes(searchQuery);

                return matchDate && matchProduk && matchBrand && matchStatus && matchSearch;
            });

            // Apply sorting
            sortData();
            
            // Reset to first page
            currentPage = 1;
            
            renderTable();
        }

        function sortData() {
            filteredData.sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                
                // Handle different data types
                if (sortColumn === 'tanggal') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                } else if (sortColumn === 'no' || sortColumn === 'qty') {
                    aVal = parseInt(aVal) || 0;
                    bVal = parseInt(bVal) || 0;
                } else {
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
                }
                
                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        function sortTable(column) {
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            
            // Update sort indicators
            document.querySelectorAll('[id^="sort-"]').forEach(el => {
                el.textContent = '↕️';
            });
            
            const indicator = document.getElementById(`sort-${column}`);
            if (indicator) {
                indicator.textContent = sortDirection === 'asc' ? '↑' : '↓';
            }
            
            applyFilters();
        }

        // Enhanced Pagination
        function paginateData() {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            displayedData = filteredData.slice(startIndex, endIndex);
            
            updatePaginationControls();
            updateDisplayCount();
        }

        function updatePaginationControls() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const prevButton = document.getElementById('prevPage');
            const nextButton = document.getElementById('nextPage');
            const pageNumbers = document.getElementById('pageNumbers');
            
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
            
            // Generate page numbers
            pageNumbers.innerHTML = '';
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageButton = document.createElement('button');
                pageButton.textContent = i;
                pageButton.className = `px-3 py-1 text-sm border rounded-md ${
                    i === currentPage 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`;
                pageButton.onclick = () => goToPage(i);
                pageNumbers.appendChild(pageButton);
            }
        }

        function goToPage(page) {
            currentPage = page;
            renderTable();
        }

        function updateDisplayCount() {
            const startIndex = (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);
            
            document.getElementById('displayCount').textContent = `${startIndex}-${endIndex}`;
            document.getElementById('totalCount').textContent = filteredData.length;
        }

        // Enhanced Rendering
        function renderTable() {
            paginateData();
            
            if (filteredData.length === 0) {
                showEmptyState(true);
                document.getElementById('dataTable').innerHTML = '';
                document.getElementById('mobileCards').innerHTML = '';
                updateStatistics();
                return;
            }
            
            showEmptyState(false);
            renderDesktopTable();
            renderMobileCards();
            updateStatistics();
            populateFilterOptions();
        }

        function renderDesktopTable() {
            const tableBody = document.getElementById('dataTable');
            tableBody.innerHTML = '';

            displayedData.forEach((item, index) => {
                const row = document.createElement('tr');
                let rowClass = 'table-row fade-in';
                if (item.status === 'valid') rowClass += ' valid';
                else if (item.status === 'invalid') rowClass += ' invalid';
                row.className = rowClass;
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" class="item-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                               value="${item.no}" onchange="toggleItemSelection(${item.no})">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.no}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.tanggal}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.produk}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.size}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.packing}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">${item.brand}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.po}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${item.qty}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800">${item.noPlat}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex space-x-2">
                            <button onclick="setStatus(${item.no}, 'valid')" 
                                    class="${item.status === 'valid' ? 'btn-success' : 'px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-green-50 transition-all duration-300'}">
                                ✓ Valid
                            </button>
                            <button onclick="setStatus(${item.no}, 'invalid')" 
                                    class="${item.status === 'invalid' ? 'btn-danger' : 'px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 transition-all duration-300'}">
                                ✗ Invalid
                            </button>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="notes-container-${item.no}">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-2">
                                    <label class="text-xs font-semibold text-gray-600">📝 Catatan</label>
                                    ${item.catatan ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                                </div>
                                <button onclick="toggleNotes(${item.no})" 
                                        class="notes-toggle-${item.no} text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded hover:bg-gray-100">
                                    <svg class="w-4 h-4 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="notes-content-${item.no} notes-minimized transition-all duration-300">
                                <textarea onchange="updateCatatan(${item.no}, this.value)"
                                       oninput="updateCatatan(${item.no}, this.value)"
                                       placeholder="Tambah catatan verifikasi..."
                                       rows="2"
                                       class="modern-input w-full text-xs resize-none">${item.catatan}</textarea>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="saveRow(${item.no})" 
                                class="btn-primary text-xs">
                            <span class="loading-${item.no} hidden">
                                <div class="loading-spinner mr-2"></div>
                            </span>
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z"/>
                            </svg>
                            Simpan
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }

        function renderMobileCards() {
            const mobileContainer = document.getElementById('mobileCards');
            mobileContainer.innerHTML = '';

            // Sort by date (newest first) for mobile cards
            const sortedData = [...displayedData].sort((a, b) => {
                return new Date(b.tanggal) - new Date(a.tanggal);
            });

            sortedData.forEach((item, index) => {
                const card = document.createElement('div');
                let cardClass = 'mobile-card fade-in';
                if (item.status === 'valid') cardClass += ' valid';
                else if (item.status === 'invalid') cardClass += ' invalid';
                card.className = cardClass;
                
                card.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" class="item-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                   value="${item.no}" onchange="toggleItemSelection(${item.no})">
                            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-sm">${item.no}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="${
                                    item.status === 'valid' ? 'status-valid' :
                                    item.status === 'invalid' ? 'status-invalid' :
                                    'status-pending'
                                }">
                                    ${item.status === 'valid' ? '✓ Valid' : item.status === 'invalid' ? '✗ Invalid' : '⏳ Pending'}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold text-gray-500">📅 ${item.tanggal}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Produk</p>
                            <p class="text-sm font-bold text-gray-900">${item.produk}</p>
                        </div>
                        <div class="bg-gradient-to-r from-green-50 to-blue-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brand</p>
                            <p class="text-sm font-semibold text-gray-900">${item.brand}</p>
                        </div>
                        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Size</p>
                            <p class="text-sm font-semibold text-gray-900">${item.size}</p>
                        </div>
                        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Packing</p>
                            <p class="text-sm font-semibold text-gray-900">${item.packing}</p>
                        </div>
                        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PO</p>
                            <p class="text-sm font-semibold text-gray-900">${item.po}</p>
                        </div>
                        <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-2 rounded-lg">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Qty</p>
                            <p class="text-sm font-bold text-gray-900">${item.qty}</p>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-bold text-gray-700 mb-3">🔍 Status Verifikasi</label>
                        <div class="flex space-x-3">
                            <button onclick="setStatus(${item.no}, 'valid')" 
                                    class="flex-1 ${item.status === 'valid' ? 'btn-success' : 'px-4 py-3 text-sm font-semibold rounded-xl bg-gray-100 text-gray-600 hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 transition-all duration-300'}">
                                ✓ Valid
                            </button>
                            <button onclick="setStatus(${item.no}, 'invalid')" 
                                    class="flex-1 ${item.status === 'invalid' ? 'btn-danger' : 'px-4 py-3 text-sm font-semibold rounded-xl bg-gray-100 text-gray-600 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300 transition-all duration-300'}">
                                ✗ Invalid
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <div class="mobile-notes-container-${item.no}">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-2">
                                    <label class="block text-sm font-bold text-gray-700">📝 Catatan</label>
                                    ${item.catatan ? '<span class="w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                                </div>
                                <button onclick="toggleMobileNotes(${item.no})" 
                                        class="mobile-notes-toggle-${item.no} text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 rounded-lg hover:bg-gray-100">
                                    <svg class="w-5 h-5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="mobile-notes-content-${item.no} notes-minimized transition-all duration-300">
                                <textarea onchange="updateCatatan(${item.no}, this.value)"
                                          oninput="updateCatatan(${item.no}, this.value)"
                                          placeholder="Tambah catatan verifikasi..."
                                          rows="3"
                                          class="modern-input w-full text-sm resize-none">${item.catatan}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button onclick="saveRow(${item.no})" 
                                class="btn-primary">
                            <span class="loading-${item.no} hidden">
                                <div class="loading-spinner mr-2"></div>
                            </span>
                            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z"/>
                            </svg>
                            Simpan Data
                        </button>
                    </div>
                `;
                
                mobileContainer.appendChild(card);
            });
        }

        // Enhanced Selection Management
        function toggleItemSelection(no) {
            if (selectedItems.has(no)) {
                selectedItems.delete(no);
            } else {
                selectedItems.add(no);
            }
            updateSelectAllCheckbox();
            updateSelectedCount();
        }

        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAll');
            const itemCheckboxes = document.querySelectorAll('.item-checkbox');
            
            if (selectAllCheckbox.checked) {
                displayedData.forEach(item => selectedItems.add(item.no));
                itemCheckboxes.forEach(checkbox => checkbox.checked = true);
            } else {
                displayedData.forEach(item => selectedItems.delete(item.no));
                itemCheckboxes.forEach(checkbox => checkbox.checked = false);
            }
            updateSelectedCount();
        }

        function updateSelectAllCheckbox() {
            const selectAllCheckbox = document.getElementById('selectAll');
            const displayedItemNos = displayedData.map(item => item.no);
            const selectedDisplayedItems = displayedItemNos.filter(no => selectedItems.has(no));
            
            if (selectedDisplayedItems.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (selectedDisplayedItems.length === displayedItemNos.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        }

        function updateSelectedCount() {
            const count = selectedItems.size;
            const selectedCountElement = document.getElementById('selectedCount');
            if (selectedCountElement) {
                selectedCountElement.textContent = `${count} item terpilih`;
            }
        }

        // Enhanced Bulk Actions
        function openBulkModal() {
            if (selectedItems.size === 0) {
                showSyncStatus('⚠️ Pilih item terlebih dahulu', 'warning');
                return;
            }
            document.getElementById('bulkModal').classList.remove('hidden');
            updateSelectedCount();
        }

        function closeBulkModal() {
            document.getElementById('bulkModal').classList.add('hidden');
        }

        async function bulkSetStatus(status) {
            if (selectedItems.size === 0) return;
            
            const itemsToUpdate = Array.from(selectedItems);
            let successCount = 0;
            
            showSyncStatus(`🔄 Memperbarui ${itemsToUpdate.length} item...`, 'loading');
            
            for (const no of itemsToUpdate) {
                const item = sampleData.find(item => item.no === no);
                if (item) {
                    item.status = status;
                    item.petugas = currentUser;
                    item.waktuMasuk = new Date().toLocaleString('id-ID');
                    
                    try {
                        await saveRowToSheets(no);
                        successCount++;
                    } catch (error) {
                        console.error(`Failed to update item ${no}:`, error);
                    }
                }
            }
            
            renderTable();
            selectedItems.clear();
            closeBulkModal();
            
            showSyncStatus(`✅ ${successCount}/${itemsToUpdate.length} item berhasil diperbarui`, 'success');
        }

        function bulkExport() {
            if (selectedItems.size === 0) return;
            
            const selectedData = sampleData.filter(item => selectedItems.has(item.no));
            exportDataToExcel(selectedData, 'selected_items');
            closeBulkModal();
        }

        // Enhanced Export Function
        function exportDataToExcel(data = filteredData, filename = 'kroscek_inbound') {
            try {
                const excelData = data.map(item => ({
                    'No': item.no,
                    'Tanggal': item.tanggal,
                    'Produk': item.produk,
                    'Size': item.size,
                    'Packing': item.packing,
                    'Brand': item.brand,
                    'PO': item.po,
                    'Qty': item.qty,
                    'No Plat': item.noPlat,
                    'Status': item.status === 'valid' ? 'Valid' : item.status === 'invalid' ? 'Invalid' : 'Pending',
                    'Catatan': item.catatan || '',
                    'Waktu Masuk': item.waktuMasuk || '',
                    'Petugas': item.petugas || '',
                    'Kondisi': item.kondisi || ''
                }));

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(excelData);

                const colWidths = [
                    { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 12 },
                    { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
                    { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }
                ];
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, "Data Kroscek");
                const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(wb, fullFilename);
                
                showSyncStatus(`📊 Data berhasil diekspor: ${fullFilename}`, 'success');
                
            } catch (error) {
                console.error('Export error:', error);
                showSyncStatus('❌ Gagal mengekspor data ke Excel', 'error');
            }
        }

        // Core Functions (Enhanced)
        function setStatus(no, status) {
            const item = sampleData.find(item => item.no === no);
            if (item) {
                item.status = status;
                item.petugas = currentUser;
                item.waktuMasuk = new Date().toLocaleString('id-ID');
                
                renderTable();
                showSyncStatus(`✅ Status ${status === 'valid' ? 'Valid' : 'Invalid'} - Diperbarui oleh ${currentUser}`, 'success');
                
                setTimeout(async () => {
                    await saveRow(no);
                }, 300);
            }
        }

        function updateCatatan(no, value) {
            const item = sampleData.find(item => item.no === no);
            if (item) {
                item.catatan = value;
                item.petugas = currentUser;
                item.waktuMasuk = new Date().toLocaleString('id-ID');
                
                // Update localStorage immediately
                localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                
                // Clear existing timeout for this specific item
                if (window.catatanTimeouts) {
                    clearTimeout(window.catatanTimeouts[no]);
                } else {
                    window.catatanTimeouts = {};
                }
                
                // Set new timeout for auto-save
                window.catatanTimeouts[no] = setTimeout(async () => {
                    await saveRow(no);
                    delete window.catatanTimeouts[no];
                }, 2000);
                
                // Show immediate feedback
                showSyncStatus(`📝 Catatan diperbarui untuk item #${no}`, 'success');
            }
        }

        async function saveRow(no) {
            const loadingSpinner = document.querySelector(`.loading-${no}`);
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            
            try {
                const success = await saveRowToSheets(no);
                if (success) {
                    showSyncStatus('✅ Data berhasil disimpan ke Google Sheets', 'success');
                } else {
                    localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                    showSyncStatus('💾 Data disimpan lokal (akan sync saat online)', 'warning');
                }
            } catch (error) {
                console.error('Save error:', error);
                localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                showSyncStatus('💾 Data disimpan lokal (akan sync saat online)', 'warning');
            } finally {
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            }
        }

        async function saveRowToSheets(no) {
            if (!isAuthenticated) return false;

            const item = sampleData.find(item => item.no === no);
            const rowIndex = sampleData.findIndex(item => item.no === no);
            
            if (!item || rowIndex === -1) return false;

            localStorage.setItem('kroscekData', JSON.stringify(sampleData));

            if (!isOnline) {
                localStorage.setItem('kroscekPendingSync', 'true');
                return false;
            }

            try {
                await sheetsAPI.updateStatusAndNotes(rowIndex, item);
                return true;
            } catch (error) {
                console.error('Failed to save row:', error);
                localStorage.setItem('kroscekPendingSync', 'true');
                return false;
            }
        }

        // Enhanced Statistics
        function updateStatistics() {
            const total = filteredData.length;
            const valid = filteredData.filter(item => item.status === 'valid').length;
            const invalid = filteredData.filter(item => item.status === 'invalid').length;
            const pending = filteredData.filter(item => item.status === 'pending').length;
            const progress = total > 0 ? Math.round(((valid + invalid) / total) * 100) : 0;

            document.getElementById('totalData').textContent = total;
            document.getElementById('checkedData').textContent = valid;
            document.getElementById('invalidData').textContent = invalid;
            document.getElementById('uncheckedData').textContent = pending;
            document.getElementById('progressPercent').textContent = progress + '%';
        }

        function populateFilterOptions() {
            // Populate Produk filter
            const produkSet = new Set(sampleData.map(item => item.produk).filter(Boolean));
            const produkSelect = document.getElementById('filterProduk');
            const currentProduk = produkSelect.value;
            produkSelect.innerHTML = '<option value="">Semua Produk</option>';
            produkSet.forEach(produk => {
                const option = document.createElement('option');
                option.value = produk;
                option.textContent = produk;
                if (produk === currentProduk) option.selected = true;
                produkSelect.appendChild(option);
            });

            // Populate Brand filter
            const brandSet = new Set(sampleData.map(item => item.brand).filter(Boolean));
            const brandSelect = document.getElementById('filterBrand');
            const currentBrand = brandSelect.value;
            brandSelect.innerHTML = '<option value="">Semua Brand</option>';
            brandSet.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                if (brand === currentBrand) option.selected = true;
                brandSelect.appendChild(option);
            });
        }

        // Utility Functions
        function clearFilters() {
            document.getElementById('filterDate').value = '';
            document.getElementById('filterProduk').value = '';
            document.getElementById('filterBrand').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('searchBox').value = '';
            
            filteredData = [...sampleData];
            currentPage = 1;
            renderTable();
        }

        function clearSearch() {
            document.getElementById('searchBox').value = '';
            document.getElementById('clearSearch').classList.add('hidden');
            applyFilters();
        }

        function toggleNotes(no) {
            const notesContent = document.querySelector(`.notes-content-${no}`);
            const toggleButton = document.querySelector(`.notes-toggle-${no} svg`);
            
            if (notesContent && toggleButton) {
                if (notesContent.classList.contains('notes-minimized')) {
                    notesContent.classList.remove('notes-minimized');
                    notesContent.classList.add('notes-expanded');
                    toggleButton.style.transform = 'rotate(180deg)';
                    
                    // Focus on textarea when expanded
                    const textarea = notesContent.querySelector('textarea');
                    if (textarea) {
                        setTimeout(() => textarea.focus(), 100);
                    }
                } else {
                    notesContent.classList.add('notes-minimized');
                    notesContent.classList.remove('notes-expanded');
                    toggleButton.style.transform = 'rotate(0deg)';
                }
            }
        }

        function toggleMobileNotes(no) {
            const notesContent = document.querySelector(`.mobile-notes-content-${no}`);
            const toggleButton = document.querySelector(`.mobile-notes-toggle-${no} svg`);
            
            if (notesContent && toggleButton) {
                if (notesContent.classList.contains('notes-minimized')) {
                    notesContent.classList.remove('notes-minimized');
                    notesContent.classList.add('notes-expanded');
                    toggleButton.style.transform = 'rotate(180deg)';
                    
                    // Focus on textarea when expanded
                    const textarea = notesContent.querySelector('textarea');
                    if (textarea) {
                        setTimeout(() => textarea.focus(), 100);
                    }
                } else {
                    notesContent.classList.add('notes-minimized');
                    notesContent.classList.remove('notes-expanded');
                    toggleButton.style.transform = 'rotate(0deg)';
                }
            }
        }

        function toggleMobileFilters() {
            const filterOptions = document.getElementById('filterOptions');
            const toggleButton = document.getElementById('toggleFilters');
            
            if (filterOptions.classList.contains('hidden')) {
                filterOptions.classList.remove('hidden');
                filterOptions.classList.add('block');
                toggleButton.textContent = '📱 Tutup';
            } else {
                filterOptions.classList.add('hidden');
                filterOptions.classList.remove('block');
                toggleButton.textContent = '📱 Filter';
            }
        }

        function showSyncStatus(message, type) {
            const statusElement = document.getElementById('syncStatus');
            const iconClass = type === 'loading' ? 'pulse' : '';
            const iconColor = type === 'success' ? 'bg-green-400' : type === 'error' ? 'bg-red-400' : 'bg-yellow-400';
            
            statusElement.innerHTML = `
                <div class="w-2 h-2 ${iconColor} rounded-full ${iconClass}"></div>
                <span class="text-white font-medium text-sm">${message}</span>
            `;
            
            if (type === 'error') {
                setTimeout(() => {
                    statusElement.innerHTML = `
                        <div class="w-2 h-2 bg-green-400 rounded-full pulse"></div>
                        <span class="text-white font-medium text-sm">Terhubung ke Google Sheets</span>
                    `;
                }, 3000);
            }
        }

        // Enhanced Authentication Functions
        function hideLoginModal() {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('mainHeader').classList.remove('hidden');
        }

        function showLoginModal() {
            document.getElementById('loginModal').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('hidden');
            document.getElementById('mainHeader').classList.add('hidden');
        }

        function logout() {
            currentUser = null;
            isAuthenticated = false;
            selectedItems.clear();
            
            localStorage.removeItem('kroscekUser');
            localStorage.removeItem('kroscekAuth');
            localStorage.removeItem('kroscekData');
            
            document.getElementById('loginForm').reset();
            showLoginModal();
            showSyncStatus('👋 Anda telah logout', 'success');
        }

        function checkSavedLogin() {
            const savedUser = localStorage.getItem('kroscekUser');
            const savedAuth = localStorage.getItem('kroscekAuth');
            
            if (savedUser && savedAuth === 'true' && validUsers[savedUser]) {
                currentUser = savedUser;
                isAuthenticated = true;
                document.getElementById('currentUser').textContent = validUsers[savedUser].name;
                hideLoginModal();
                return true;
            }
            return false;
        }

        async function initializeAfterLogin() {
            setupNetworkMonitoring();
            showSyncStatus('🔄 Menghubungkan ke Google Sheets...', 'loading');
            showConnectionStatus('syncing', 'Menghubungkan...');
            
            try {
                await loadDataFromSheets();
                startAutoSync();
                showConnectionStatus('online', 'Online');
            } catch (error) {
                console.error('Initialization error:', error);
                showConnectionStatus('offline', 'Offline');
            }
        }

        function setupNetworkMonitoring() {
            window.addEventListener('online', async () => {
                isOnline = true;
                showConnectionStatus('online', 'Online');
                showSyncStatus('🌐 Koneksi internet tersambung', 'success');
                
                if (localStorage.getItem('kroscekPendingSync') === 'true' && isAuthenticated) {
                    setTimeout(async () => {
                        await saveDataToSheets();
                    }, 1000);
                }
                
                if (isAuthenticated) {
                    setTimeout(async () => {
                        await loadDataFromSheets();
                    }, 2000);
                }
            });

            window.addEventListener('offline', () => {
                isOnline = false;
                showConnectionStatus('offline', 'Offline');
                showSyncStatus('📱 Mode offline - data akan disimpan lokal', 'warning');
            });
        }

        function startAutoSync() {
            if (localStorage.getItem('kroscekPendingSync') === 'true' && isOnline) {
                setTimeout(() => {
                    saveDataToSheets();
                }, 2000);
            }
            
            setInterval(async () => {
                if (isOnline && isAuthenticated && hasUnsavedChanges()) {
                    await saveDataToSheets();
                }
            }, 30000);
        }

        function hasUnsavedChanges() {
            return sampleData.some(item => item.status !== 'pending' || item.catatan !== '');
        }

        async function saveDataToSheets() {
            if (!isAuthenticated || !isOnline) return false;

            showSyncStatus('🔄 Menyimpan data ke Google Sheets...', 'loading');
            
            try {
                await sheetsAPI.writeData(sampleData);
                localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                localStorage.removeItem('kroscekPendingSync');
                showSyncStatus('✅ Data berhasil disimpan ke Google Sheets', 'success');
                return true;
            } catch (error) {
                console.error('Failed to save data:', error);
                showSyncStatus('❌ Gagal menyimpan data ke Google Sheets', 'error');
                localStorage.setItem('kroscekData', JSON.stringify(sampleData));
                localStorage.setItem('kroscekPendingSync', 'true');
                return false;
            }
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Login form
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                
                const errorDiv = document.getElementById('loginError');
                if (errorDiv) errorDiv.style.display = 'none';
                
                const success = await login(username, password);
                
                const loginSpinner = document.getElementById('loginSpinner');
                const loginButton = document.getElementById('loginButton');
                
                loginSpinner.classList.add('hidden');
                loginButton.classList.remove('btn-loading');
                loginButton.disabled = false;
                
                if (!success) {
                    const loginModal = document.querySelector('#loginModal .glass-card');
                    loginModal.style.animation = 'shake 0.5s';
                    setTimeout(() => loginModal.style.animation = '', 500);
                }
            });

            // Password toggle
            document.getElementById('togglePassword').addEventListener('click', function() {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                this.innerHTML = type === 'password' 
                    ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>'
                    : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>';
            });

            // Filter and search events
            document.getElementById('filterDate').addEventListener('change', applyFilters);
            document.getElementById('filterProduk').addEventListener('change', applyFilters);
            document.getElementById('filterBrand').addEventListener('change', applyFilters);
            document.getElementById('filterStatus').addEventListener('change', applyFilters);
            
            // Search with clear button
            document.getElementById('searchBox').addEventListener('input', function(e) {
                const clearButton = document.getElementById('clearSearch');
                if (e.target.value.length > 0) {
                    clearButton.classList.remove('hidden');
                } else {
                    clearButton.classList.add('hidden');
                }
                applyFilters();
            });
            
            document.getElementById('clearSearch').addEventListener('click', clearSearch);
            document.getElementById('clearFilters').addEventListener('click', clearFilters);
            
            // Action buttons
            document.getElementById('syncData').addEventListener('click', async () => {
                showSyncStatus('🔄 Melakukan sinkronisasi manual...', 'loading');
                await loadDataFromSheets();
                
                if (localStorage.getItem('kroscekPendingSync') === 'true') {
                    await saveDataToSheets();
                }
            });
            
            document.getElementById('exportData').addEventListener('click', () => exportDataToExcel());
            document.getElementById('bulkActions').addEventListener('click', openBulkModal);
            document.getElementById('toggleFilters').addEventListener('click', toggleMobileFilters);
            
            // Pagination events
            document.getElementById('itemsPerPage').addEventListener('change', function(e) {
                itemsPerPage = parseInt(e.target.value);
                currentPage = 1;
                renderTable();
            });
            
            document.getElementById('prevPage').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                }
            });
            
            document.getElementById('nextPage').addEventListener('click', () => {
                const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable();
                }
            });
            
            // Select all checkbox
            document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
        });

        // Add shake animation
        const shakeKeyframes = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = shakeKeyframes;
        document.head.appendChild(style);

        // Initialize application
        async function initialize() {
            
            const hasValidLogin = checkSavedLogin();
            
            if (hasValidLogin) {
                await initializeAfterLogin();
            } else {
                showLoginModal();
            }
        }

        // Start the application
        initialize();