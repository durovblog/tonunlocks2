// TON Token Unlock Tracker - Main Application
class TONUnlockTracker {
    constructor() {
        this.appData = null;
        this.chart = null;
        this.currentSort = { field: 'rank', direction: 'asc' };
        this.init();
    }

    async init() {
        this.initTheme();
        this.setupThemeToggle();
        await this.loadAppData();
        await this.loadLiveMetrics();
        this.renderChart();
        this.renderTable();
        this.setupTableSorting();
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemTheme;
        
        this.applyTheme(theme);
        this.updateThemeIcon(theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-toggle-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Data Loading
    async loadAppData() {
        try {
            const response = await fetch('https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/cc2d77caed52778a07af0e0929f44f57/31fd8a6c-8675-411e-8f3f-3afe59f1826c/2fe0df27.json');
            if (!response.ok) throw new Error('Failed to load app data');
            
            this.appData = await response.json();
            
            // Update footer data
            const dataDateElement = document.getElementById('data-date');
            const totalWalletsElement = document.getElementById('total-wallets');
            const methodologyElement = document.getElementById('methodology-text');
            
            if (dataDateElement) dataDateElement.textContent = this.appData.data_date;
            if (totalWalletsElement) totalWalletsElement.textContent = this.appData.total_wallets;
            if (methodologyElement) methodologyElement.textContent = this.appData.methodology;
            
        } catch (error) {
            console.error('Error loading app data:', error);
            this.showError('Failed to load application data');
        }
    }

    // Live Metrics
    async loadLiveMetrics() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/the-open-network?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
            
            if (!response.ok) throw new Error('Failed to fetch TON metrics');
            
            const data = await response.json();
            const marketData = data.market_data;
            
            // Update metrics display
            const priceElement = document.getElementById('ton-price');
            const marketCapElement = document.getElementById('ton-market-cap');
            const volumeElement = document.getElementById('ton-volume');
            const rankElement = document.getElementById('ton-rank');
            
            if (priceElement) priceElement.textContent = `$${marketData.current_price.usd.toFixed(2)}`;
            if (marketCapElement) marketCapElement.textContent = this.formatLargeNumber(marketData.market_cap.usd);
            if (volumeElement) volumeElement.textContent = this.formatLargeNumber(marketData.total_volume.usd);
            if (rankElement) rankElement.textContent = `#${marketData.market_cap_rank}`;
            
        } catch (error) {
            console.error('Error loading live metrics:', error);
            this.showMetricsError();
        }
    }

    formatLargeNumber(num) {
        if (num >= 1e9) {
            return `$${(num / 1e9).toFixed(1)}B`;
        } else if (num >= 1e6) {
            return `$${(num / 1e6).toFixed(1)}M`;
        } else if (num >= 1e3) {
            return `$${(num / 1e3).toFixed(1)}K`;
        }
        return `$${num.toFixed(2)}`;
    }

    showMetricsError() {
        const metricElements = ['ton-price', 'ton-market-cap', 'ton-volume', 'ton-rank'];
        metricElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error loading';
                element.classList.add('error');
            }
        });
    }

    // Chart Rendering
    renderChart() {
        if (!this.appData?.chart_data) return;

        const ctx = document.getElementById('unlock-chart');
        if (!ctx) return;
        
        const chartData = this.appData.chart_data;
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Cumulative TON Unlocks (Billions)',
                    data: chartData.datasets[0].data,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(1)}B TON unlocked`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Cumulative Unlocks (Billions)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + 'B';
                            }
                        }
                    }
                }
            }
        });
    }

    // Table Sorting Setup
    setupTableSorting() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const sortField = header.getAttribute('data-sort');
                this.handleTableSort(sortField);
            });
        });
    }

    handleTableSort(field) {
        if (!this.appData?.wallet_table_data) return;
        
        // Toggle sort direction if same field
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }

        // Update header visual indicators
        this.updateSortHeaders();
        
        // Re-render table with new sort
        this.renderTable();
    }

    updateSortHeaders() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });

        const activeHeader = document.querySelector(`[data-sort="${this.currentSort.field}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${this.currentSort.direction}`);
        }
    }

    // Table Rendering
    renderTable() {
        if (!this.appData?.wallet_table_data) return;

        const tableBody = document.getElementById('wallet-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';

        const sortedData = this.getSortedData();

        sortedData.forEach(wallet => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${wallet.rank}</td>
                <td class="wallet-address">${this.truncateAddress(wallet.address)}</td>
                <td class="amount-cell">${this.formatAmount(wallet.total_amount)}</td>
                <td class="amount-cell">${this.formatAmount(wallet.unlocked_amount)}</td>
                <td class="amount-cell">${this.formatAmount(wallet.locked_amount)}</td>
                <td class="date-cell">${wallet.start_date}</td>
                <td class="date-cell">${wallet.end_date}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    getSortedData() {
        const data = [...this.appData.wallet_table_data];
        
        return data.sort((a, b) => {
            let aVal = a[this.currentSort.field];
            let bVal = b[this.currentSort.field];
            
            // Handle different data types
            if (this.currentSort.field === 'address') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
                return this.currentSort.direction === 'asc' ? 
                    aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            
            // Handle date fields
            if (this.currentSort.field === 'start_date' || this.currentSort.field === 'end_date') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }
            
            // Handle numeric fields
            if (typeof aVal === 'number' || !isNaN(aVal)) {
                aVal = Number(aVal);
                bVal = Number(bVal);
            }
            
            if (this.currentSort.direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }

    truncateAddress(address) {
        return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
    }

    formatAmount(amount) {
        if (amount >= 1e6) {
            return `${(amount / 1e6).toFixed(2)}M`;
        } else if (amount >= 1e3) {
            return `${(amount / 1e3).toFixed(1)}K`;
        }
        return amount.toFixed(2);
    }

    // Error Handling
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-error);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TONUnlockTracker();
});

// Handle theme changes from system
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', theme);
        document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    }
});