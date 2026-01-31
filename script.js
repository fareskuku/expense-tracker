let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editingId = null;

const expenseForm = document.getElementById('expense-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const typeInputs = document.querySelectorAll('input[name="type"]');
const dateInput = document.getElementById('date');
const transactionsList = document.getElementById('transactions-list');
const totalBalance = document.getElementById('total-balance');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');
const clearAllBtn = document.getElementById('clear-all');
const exportBtn = document.getElementById('export-data');
const currentYear = document.getElementById('current-year');

dateInput.valueAsDate = new Date();
currentYear.textContent = new Date().getFullYear();

function initApp() {
    updateSummary();
    renderTransactions();
    setupEventListeners();
}

function setupEventListeners() {
    expenseForm.addEventListener('submit', handleFormSubmit);
    filterCategory.addEventListener('change', renderTransactions);
    filterType.addEventListener('change', renderTransactions);
    clearAllBtn.addEventListener('click', handleClearAll);
    exportBtn.addEventListener('click', handleExportData);
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const date = dateInput.value;
    
    if (!description || !amount || !category || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    if (editingId) {
        const index = transactions.findIndex(t => t.id === editingId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                description,
                amount,
                category,
                type,
                date
            };
        }
        editingId = null;
        expenseForm.querySelector('.btn-submit').innerHTML = '<i class="fas fa-plus"></i> Add Transaction';
    } else {
        const transaction = {
            id: Date.now().toString(),
            description,
            amount,
            category,
            type,
            date: new Date(date).toISOString().split('T')[0]
        };
        
        transactions.push(transaction);
    }
    
    saveTransactions();
    updateSummary();
    renderTransactions();
    expenseForm.reset();
    dateInput.valueAsDate = new Date();
    descriptionInput.focus();
}

function handleDelete(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateSummary();
        renderTransactions();
    }
}

function handleEdit(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    
    document.querySelectorAll('input[name="type"]').forEach(input => {
        input.checked = input.value === transaction.type;
    });
    
    dateInput.value = transaction.date;
    editingId = id;
    expenseForm.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Update Transaction';
    
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function handleClearAll() {
    if (transactions.length === 0) {
        alert('No transactions to clear');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
        transactions = [];
        saveTransactions();
        updateSummary();
        renderTransactions();
    }
}

function handleExportData() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function updateSummary() {
    const incomeTotal = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenseTotal = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = incomeTotal - expenseTotal;
    
    totalIncome.textContent = formatCurrency(incomeTotal);
    totalExpenses.textContent = formatCurrency(expenseTotal);
    totalBalance.textContent = formatCurrency(balance);
    
    totalBalance.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';
}

function renderTransactions() {
    const categoryFilter = filterCategory.value;
    const typeFilter = filterType.value;
    
    let filteredTransactions = transactions;
    
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    transactionsList.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-receipt"></i>
            <p>No transactions found. ${categoryFilter !== 'all' || typeFilter !== 'all' ? 'Try changing filters.' : 'Add your first transaction!'}</p>
        `;
        transactionsList.appendChild(emptyState);
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const categoryNames = {
            food: 'Food & Dining',
            transport: 'Transportation',
            shopping: 'Shopping',
            housing: 'Housing',
            entertainment: 'Entertainment',
            health: 'Health',
            education: 'Education',
            other: 'Other'
        };
        
        transactionItem.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-meta">
                    <span class="transaction-date">${formattedDate}</span>
                    <span class="transaction-category">${categoryNames[transaction.category] || transaction.category}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-action edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        transactionItem.querySelector('.edit').addEventListener('click', () => handleEdit(transaction.id));
        transactionItem.querySelector('.delete').addEventListener('click', () => handleDelete(transaction.id));
        
        transactionsList.appendChild(transactionItem);
    });
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

document.addEventListener('DOMContentLoaded', initApp);
