/**
 * Ella Rises - Portal JavaScript
 * Handles sidebar, data tables, and portal-specific interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // Sidebar Toggle (Mobile)
  // ============================================
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.portal-sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('active');
        }
      }
    });
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        sidebarToggle.focus();
      }
    });
  }
  
  // ============================================
  // Confirm Delete Actions
  // ============================================
  const deleteForms = document.querySelectorAll('form[action*="/delete"]');
  
  deleteForms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        e.preventDefault();
      }
    });
  });
  
  // ============================================
  // Table Row Click to View
  // ============================================
  const tableRows = document.querySelectorAll('.data-table tbody tr');
  
  tableRows.forEach(function(row) {
    const viewLink = row.querySelector('a[title="View"]');
    if (viewLink) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', function(e) {
        // Don't navigate if clicking on action buttons or links
        if (e.target.closest('.action-buttons') || e.target.closest('a') || e.target.closest('button') || e.target.closest('select')) {
          return;
        }
        viewLink.click();
      });
    }
  });
  
  // ============================================
  // Form Auto-save Draft (localStorage)
  // ============================================
  const crudForm = document.querySelector('.crud-form');
  
  if (crudForm) {
    const formId = crudForm.action || window.location.pathname;
    const storageKey = 'form-draft-' + formId.replace(/[^a-z0-9]/gi, '-');
    
    // Load saved draft
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const shouldRestore = confirm('A saved draft was found. Would you like to restore it?');
        if (shouldRestore) {
          Object.keys(draft).forEach(function(name) {
            const field = crudForm.querySelector('[name="' + name + '"]');
            if (field) {
              if (field.type === 'checkbox') {
                field.checked = draft[name];
              } else {
                field.value = draft[name];
              }
            }
          });
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
    
    // Save draft on input
    let saveTimeout;
    crudForm.addEventListener('input', function() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(function() {
        const formData = new FormData(crudForm);
        const draft = {};
        formData.forEach(function(value, key) {
          draft[key] = value;
        });
        // Also save checkbox states
        crudForm.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
          draft[cb.name] = cb.checked;
        });
        localStorage.setItem(storageKey, JSON.stringify(draft));
      }, 1000);
    });
    
    // Clear draft on successful submit
    crudForm.addEventListener('submit', function() {
      localStorage.removeItem(storageKey);
    });
  }
  
  // ============================================
  // Filter Form Auto-submit
  // ============================================
  const filterSelects = document.querySelectorAll('.filters-form select');
  
  filterSelects.forEach(function(select) {
    select.addEventListener('change', function() {
      // Optional: Auto-submit on filter change
      // Uncomment if desired:
      // this.closest('form').submit();
    });
  });
  
  // ============================================
  // Search Input Debounce
  // ============================================
  const searchInputs = document.querySelectorAll('.filters-form input[type="text"]');
  
  searchInputs.forEach(function(input) {
    let debounceTimeout;
    input.addEventListener('input', function() {
      clearTimeout(debounceTimeout);
      // Optional: Auto-submit after delay
      // Uncomment if desired:
      // debounceTimeout = setTimeout(() => {
      //   this.closest('form').submit();
      // }, 500);
    });
  });
  
  // ============================================
  // Score Range Inputs
  // ============================================
  const rangeInputs = document.querySelectorAll('.score-input input[type="range"]');
  
  rangeInputs.forEach(function(input) {
    const display = input.nextElementSibling;
    if (display && display.classList.contains('score-display')) {
      input.addEventListener('input', function() {
        display.textContent = this.value;
      });
    }
  });
  
  // ============================================
  // Inline Status Select Auto-submit
  // ============================================
  const statusSelects = document.querySelectorAll('.inline-form select[name="status"]');
  
  statusSelects.forEach(function(select) {
    select.addEventListener('change', function() {
      const form = this.closest('form');
      if (form) {
        form.submit();
      }
    });
  });
  
  // ============================================
  // Table Sorting (Basic)
  // ============================================
  const sortableHeaders = document.querySelectorAll('.data-table th[data-sort]');
  
  sortableHeaders.forEach(function(header) {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function() {
      const table = this.closest('table');
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      const sortKey = this.dataset.sort;
      const columnIndex = Array.from(this.parentElement.children).indexOf(this);
      const isAsc = this.classList.contains('sort-asc');
      
      // Remove sort classes from all headers
      sortableHeaders.forEach(function(h) {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      // Sort rows
      rows.sort(function(a, b) {
        const aValue = a.children[columnIndex]?.textContent.trim() || '';
        const bValue = b.children[columnIndex]?.textContent.trim() || '';
        
        // Try numeric sort
        const aNum = parseFloat(aValue.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bValue.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return isAsc ? bNum - aNum : aNum - bNum;
        }
        
        // String sort
        return isAsc 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      });
      
      // Update class
      this.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
      
      // Re-append rows
      rows.forEach(function(row) {
        tbody.appendChild(row);
      });
    });
  });
  
  // ============================================
  // Print Functionality
  // ============================================
  const printButtons = document.querySelectorAll('[data-print]');
  
  printButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      window.print();
    });
  });
  
  // ============================================
  // Export to CSV (Basic)
  // ============================================
  const exportButtons = document.querySelectorAll('[data-export="csv"]');
  
  exportButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const table = document.querySelector('.data-table');
      if (!table) return;
      
      let csv = [];
      const rows = table.querySelectorAll('tr');
      
      rows.forEach(function(row) {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];
        cells.forEach(function(cell) {
          // Skip action columns
          if (!cell.classList.contains('actions-col')) {
            let text = cell.textContent.trim().replace(/"/g, '""');
            rowData.push('"' + text + '"');
          }
        });
        csv.push(rowData.join(','));
      });
      
      const csvContent = csv.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
  
  // ============================================
  // Keyboard Navigation Enhancement
  // ============================================
  document.addEventListener('keydown', function(e) {
    // Quick navigation with keyboard shortcuts
    if (e.altKey) {
      switch(e.key) {
        case 'd':
          e.preventDefault();
          window.location.href = '/portal/dashboard';
          break;
        case 'p':
          e.preventDefault();
          window.location.href = '/portal/participants';
          break;
        case 'e':
          e.preventDefault();
          window.location.href = '/portal/events';
          break;
      }
    }
  });
});

