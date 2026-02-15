// ========================================
//    FEE RECEIPT PORTAL - JAVASCRIPT
// ========================================

// ========== GOOGLE APPS SCRIPT CONFIGURATION ==========
/**
 * ⚠️ CRITICAL: Replace this with YOUR Google Apps Script Web App URL
 * 
 * HOW TO GET YOUR URL:
 * 1. Open your Google Apps Script project (the one with doPost function)
 * 2. Click "Deploy" button (top right) → "New deployment"
 * 3. Click gear icon next to "Select type" → Choose "Web app"
 * 4. Fill in:
 *    - Description: "Receipt Portal API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone"
 * 5. Click "Deploy"
 * 6. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/ABC123.../exec)
 * 7. Paste it below, replacing the placeholder
 */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwEpQ5o51A8Le8uM2NeckFSRjlDtdKaxCnQ-VATRHZId9ByfxpXYpWdceuGPUvNd9iq/exec';

// ========== INITIALIZE ON PAGE LOAD ==========
window.onload = function() {
    loadCurrentReceiptNumber();
    setCurrentDate();
    attachEventListeners();
};

// ========== LOAD CURRENT RECEIPT NUMBER ==========
/**
 * Loads the current receipt number without incrementing
 * This is called on page load to show the current number
 * 
 * TO RESET TO NVA001: Open browser console and type: resetToNVA001()
 */
function loadCurrentReceiptNumber() {
    // Get the last receipt number from localStorage
    let lastReceiptNum = localStorage.getItem('lastReceiptNumber');
    
    // If no receipt number exists, start with NVA001
    if (!lastReceiptNum) {
        lastReceiptNum = 'NVA001';
        localStorage.setItem('lastReceiptNumber', lastReceiptNum);
    }
    
    // Set the receipt number in the form (don't increment yet)
    document.getElementById('receiptNumber').value = lastReceiptNum;
}

/**
 * Quick reset function to start from NVA001
 * Run this in browser console: resetToNVA001()
 */
function resetToNVA001() {
    localStorage.setItem('lastReceiptNumber', 'NVA001');
    document.getElementById('receiptNumber').value = 'NVA001';
    alert('Receipt number has been reset to NVA001');
}

// ========== GENERATE SEQUENTIAL RECEIPT NUMBER ==========
/**
 * Generates the NEXT sequential receipt number
 * This should only be called when creating a new receipt
 * Format: NVA001, NVA002... NVA999, then NVB001, NVB002... NVB999, then NVC001...
 */
function generateReceiptNumber() {
    // Get the last receipt number from localStorage
    let lastReceiptNum = localStorage.getItem('lastReceiptNumber');
    
    let newReceiptNum;
    
    if (lastReceiptNum) {
        // Extract the series letter (A, B, C, etc.) and numeric part
        const match = lastReceiptNum.match(/NV([A-Z])(\d+)/);
        
        if (match) {
            const seriesLetter = match[1];
            const numericPart = parseInt(match[2]);
            
            // Check if we need to move to next series (after 999)
            if (numericPart >= 999) {
                // Move to next letter (A -> B, B -> C, etc.)
                const nextLetter = String.fromCharCode(seriesLetter.charCodeAt(0) + 1);
                newReceiptNum = 'NV' + nextLetter + '001';
            } else {
                // Increment within same series
                const nextNum = numericPart + 1;
                newReceiptNum = 'NV' + seriesLetter + String(nextNum).padStart(3, '0');
            }
        } else {
            // Invalid format, start fresh
            newReceiptNum = 'NVA001';
        }
    } else {
        // First time - start with NVA001
        newReceiptNum = 'NVA001';
    }
    
    // Save the new receipt number to localStorage
    localStorage.setItem('lastReceiptNumber', newReceiptNum);
    
    // Set the receipt number in the form
    document.getElementById('receiptNumber').value = newReceiptNum;
}

/**
 * Reset receipt numbering (optional - for admin use)
 * Call this function from browser console if you need to reset: resetReceiptNumbering()
 */
function resetReceiptNumbering() {
    if (confirm('Are you sure you want to reset receipt numbering back to NVA001?')) {
        localStorage.removeItem('lastReceiptNumber');
        generateReceiptNumber();
        alert('Receipt numbering has been reset to NVA001');
    }
}

/**
 * Set a specific receipt number (admin use)
 * Example: setReceiptNumber('NVB500') - next receipt will be NVB501
 */
function setReceiptNumber(receiptNum) {
    if (receiptNum.match(/NV[A-Z]\d{3}/)) {
        localStorage.setItem('lastReceiptNumber', receiptNum);
        generateReceiptNumber();
        alert('Receipt number set to: ' + document.getElementById('receiptNumber').value);
    } else {
        alert('Invalid format! Use format like: NVA001, NVB500, NVC999');
    }
}

// ========== SET CURRENT DATE ==========
/**
 * Sets current date to receipt date and payment date fields
 */
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('receiptDate').value = today;
    document.getElementById('paymentDate').value = today;
}

// ========== ATTACH EVENT LISTENERS ==========
/**
 * Attaches all necessary event listeners for the application
 */
function attachEventListeners() {
    // Student photo upload
    document.getElementById('studentPhoto').addEventListener('change', function(e) {
        previewImage(e, 'studentPhotoPreview');
    });

    // Amount calculation listeners
    attachAmountListeners();
}

// ========== IMAGE PREVIEW HANDLER ==========
/**
 * Previews uploaded image in the specified container
 * @param {Event} event - File input change event
 * @param {string} previewId - ID of the preview container
 */
function previewImage(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// ========== FEE TABLE MANAGEMENT ==========
/**
 * Adds a new fee row to the fee table
 */
function addFeeRow() {
    const tbody = document.getElementById('feeTableBody');
    const newRow = tbody.rows[0].cloneNode(true);
    
    // Clear values in new row
    const inputs = newRow.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    
    const select = newRow.querySelector('select');
    select.selectedIndex = 0;
    
    tbody.appendChild(newRow);
    
    // Add event listener for amount calculation
    attachAmountListeners();
}

/**
 * Removes a fee row from the fee table
 * @param {HTMLElement} button - The remove button that was clicked
 */
function removeRow(button) {
    const tbody = document.getElementById('feeTableBody');
    if (tbody.rows.length > 1) {
        button.closest('tr').remove();
        calculateTotal();
    } else {
        alert('At least one fee row is required!');
    }
}

/**
 * Attach event listeners to amount inputs for auto-calculation
 */
function attachAmountListeners() {
    const amounts = document.querySelectorAll('.fee-amount');
    amounts.forEach(input => {
        input.removeEventListener('input', calculateTotal);
        input.addEventListener('input', calculateTotal);
    });
}

/**
 * Calculates the total fee amount
 * @returns {number} Total fee amount
 */
function calculateTotal() {
    const amounts = document.querySelectorAll('.fee-amount');
    let total = 0;
    amounts.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    return total;
}

// ========== NUMBER TO WORDS CONVERSION ==========
/**
 * Converts a number to Indian words format
 * @param {number} num - The number to convert
 * @returns {string} Number in words
 */
function numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    function convertLessThanThousand(n) {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }
    
    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        return convertLessThanThousand(thousands) + ' Thousand' + (remainder !== 0 ? ' ' + convertLessThanThousand(remainder) : '');
    }
    if (num < 10000000) {
        const lakhs = Math.floor(num / 100000);
        const remainder = num % 100000;
        return convertLessThanThousand(lakhs) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return convertLessThanThousand(crores) + ' Crore' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
}

/**
 * Formats date to dd/mm/yyyy format
 * @param {string} dateString - Date in yyyy-mm-dd format
 * @returns {string} Date in dd/mm/yyyy format
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ========== GENERATE RECEIPT ==========
/**
 * Generates and displays the receipt preview
 */
function generateReceipt() {
    // Validate required fields
    const studentName = document.getElementById('studentName').value.trim();
    const classSection = document.getElementById('classSection').value.trim();
    const academicSession = document.getElementById('academicSession').value.trim();
    const paymentMode = document.getElementById('paymentMode').value;

    if (!studentName) {
        alert('Please enter student name!');
        document.getElementById('studentName').focus();
        return;
    }
    if (!classSection) {
        alert('Please enter class/section!');
        document.getElementById('classSection').focus();
        return;
    }
    if (!academicSession) {
        alert('Please enter academic session!');
        document.getElementById('academicSession').focus();
        return;
    }
    if (!paymentMode) {
        alert('Please select payment mode!');
        document.getElementById('paymentMode').focus();
        return;
    }

    // Validate at least one fee entry
    const feeRows = document.querySelectorAll('#feeTableBody tr');
    let hasValidFee = false;
    feeRows.forEach(row => {
        const type = row.querySelector('.fee-type').value;
        const amount = parseFloat(row.querySelector('.fee-amount').value) || 0;
        if (type && amount > 0) hasValidFee = true;
    });

    if (!hasValidFee) {
        alert('Please add at least one fee entry with valid type and amount!');
        return;
    }

    // School information
    document.getElementById('receiptSchoolName').textContent = 'Nandini Vidyaniketan (E-Learning Vista Pvt. Ltd.)';
    document.getElementById('receiptSchoolAddress').textContent = 'Nandini Nagar, Rupaidiha Road, Nanpara (Bahraich), Uttar Pradesh';
    
    const contact = document.getElementById('schoolContact').value;
    let contactInfo = '';
    if (contact) contactInfo = 'Tel: ' + contact;
    document.getElementById('receiptSchoolContact').textContent = contactInfo;

    // School logo (use logo.png)
    const receiptLogo = document.getElementById('receiptLogo');
    receiptLogo.src = 'logo.png';
    receiptLogo.style.display = 'block';

    // Receipt meta information
    document.getElementById('receiptNo').textContent = document.getElementById('receiptNumber').value;
    document.getElementById('receiptDateDisplay').textContent = formatDate(document.getElementById('receiptDate').value);
    document.getElementById('receiptSession').textContent = academicSession;

    // Student information
    document.getElementById('receiptStudentName').textContent = studentName;
    document.getElementById('receiptDob').textContent = formatDate(document.getElementById('dob').value);
    document.getElementById('receiptGender').textContent = document.getElementById('gender').value || 'N/A';
    document.getElementById('receiptFatherName').textContent = document.getElementById('fatherName').value || 'N/A';
    document.getElementById('receiptMotherName').textContent = document.getElementById('motherName').value || 'N/A';
    document.getElementById('receiptClass').textContent = classSection;

    // Student photo
    const photoPreview = document.getElementById('studentPhotoPreview').querySelector('img');
    const receiptPhoto = document.getElementById('receiptStudentPhoto');
    const photoContainer = document.getElementById('receiptStudentPhotoContainer');
    if (photoPreview) {
        receiptPhoto.src = photoPreview.src;
        photoContainer.style.display = 'flex';
    } else {
        photoContainer.style.display = 'none';
    }

    // Fee details table
    populateFeeTable();

    // Payment information
    document.getElementById('receiptPaymentMode').textContent = paymentMode;
    document.getElementById('receiptTransactionId').textContent = document.getElementById('transactionId').value || 'N/A';
    document.getElementById('receiptPaymentDate').textContent = formatDate(document.getElementById('paymentDate').value);

    // Show receipt preview
    document.getElementById('receiptPreview').classList.add('active');
    
    // Scroll to receipt
    document.getElementById('receiptPreview').scrollIntoView({ behavior: 'smooth' });
    
    // Send data to Google Sheets
    sendDataToGoogleSheets();
}

// ========== RESET FORM FOR NEW RECEIPT ==========
/**
 * Resets the form to create a new receipt
 */
function resetForm() {
    // Confirm before resetting
    if (confirm('Are you sure you want to create a new receipt? Current data will be cleared.')) {
        // Reset all form fields
        document.getElementById('studentName').value = '';
        document.getElementById('dob').value = '';
        document.getElementById('gender').value = '';
        document.getElementById('fatherName').value = '';
        document.getElementById('motherName').value = '';
        document.getElementById('classSection').value = '';
        document.getElementById('academicSession').value = '';
        document.getElementById('transactionId').value = '';
        document.getElementById('paymentMode').value = '';
        
        // Reset student photo
        document.getElementById('studentPhoto').value = '';
        const photoPreview = document.getElementById('studentPhotoPreview');
        photoPreview.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="photo-text">Student Photo</span>
        `;
        
        // Reset fee table to one row
        const tbody = document.getElementById('feeTableBody');
        tbody.innerHTML = `
            <tr>
                <td>
                    <select class="fee-type">
                        <option value="">Select Type</option>
                        <option value="Admission Fee">Admission Fee</option>
                        <option value="Tuition Fee">Tuition Fee</option>
                        <option value="Exam Fee">Exam Fee</option>
                        <option value="Transport Fee">Transport Fee</option>
                        <option value="Hostel Fee">Hostel Fee</option>
                        <option value="Library Fee">Library Fee</option>
                        <option value="Lab Fee">Lab Fee</option>
                        <option value="Sports Fee">Sports Fee</option>
                        <option value="Other">Other</option>
                    </select>
                </td>
                <td><input type="text" class="fee-period" placeholder="e.g., January 2025"></td>
                <td><input type="number" class="fee-amount" placeholder="0" min="0" step="0.01"></td>
                <td><button class="btn-remove" onclick="removeRow(this)">Remove</button></td>
            </tr>
        `;
        
        // Reattach amount listeners
        attachAmountListeners();
        
        // Generate new receipt number and date
        generateReceiptNumber();
        setCurrentDate();
        
        // Hide receipt preview
        document.getElementById('receiptPreview').classList.remove('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ========== POPULATE FEE TABLE IN RECEIPT ==========
/**
 * Populates the fee table in the receipt preview
 */
function populateFeeTable() {
    const feeTableBody = document.getElementById('receiptFeeTableBody');
    feeTableBody.innerHTML = '';
    
    const feeRows = document.querySelectorAll('#feeTableBody tr');
    let total = 0;
    let serialNo = 1;

    feeRows.forEach(row => {
        const type = row.querySelector('.fee-type').value;
        const period = row.querySelector('.fee-period').value;
        const amount = parseFloat(row.querySelector('.fee-amount').value) || 0;

        if (type && amount > 0) {
            const newRow = feeTableBody.insertRow();
            newRow.innerHTML = `
                <td>${serialNo++}</td>
                <td>${type}</td>
                <td>${period || 'N/A'}</td>
                <td>₹ ${amount.toFixed(2)}</td>
            `;
            total += amount;
        }
    });

    // Update total and amount in words
    document.getElementById('receiptTotal').textContent = total.toFixed(2);
    document.getElementById('amountInWords').textContent = numberToWords(Math.floor(total));
}

// ========== PRINT RECEIPT ==========
/**
 * Prints the receipt preview
 */
function printReceipt() {
    const receiptPreview = document.getElementById('receiptPreview');
    if (!receiptPreview.classList.contains('active')) {
        alert('Please generate receipt first!');
        return;
    }
    window.print();
}

// ========== SEND DATA TO GOOGLE SHEETS ==========
function sendDataToGoogleSheets() {
    // Check if Google Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'PASTE_YOUR_WEB_APP_URL_HERE') {
        console.error('❌ Google Apps Script URL not configured!');
        showNotification('⚠️ Google Sheets integration not configured. Receipt generated but not saved to sheets.', 'error');
        return;
    }

    const feeRows = document.querySelectorAll('#feeTableBody tr');
    const fees = [];

    feeRows.forEach(row => {
        const type = row.querySelector('.fee-type')?.value || '';
        const period = row.querySelector('.fee-period')?.value || '';
        const amount = parseFloat(row.querySelector('.fee-amount')?.value) || 0;

        if (type && amount > 0) {
            fees.push({ type, period, amount });
        }
    });

    const data = {
        receiptNumber: document.getElementById('receiptNumber').value,
        receiptDate: document.getElementById('receiptDate').value,
        academicSession: document.getElementById('academicSession').value,
        studentName: document.getElementById('studentName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        classSection: document.getElementById('classSection').value,
        paymentMode: document.getElementById('paymentMode').value,
        transactionID: document.getElementById('transactionId').value,
        paymentDate: document.getElementById('paymentDate').value,
        fees
    };

    // Show loading indicator
    console.log('📤 Sending data to Google Sheets...');
    console.log('Data being sent:', data);

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        // Note: With no-cors mode, we can't read the response
        // But if no error is thrown, it likely succeeded
        console.log('✅ Data sent successfully');
        showNotification('✅ Receipt saved to Google Sheets!', 'success');
    })
    .catch(err => {
        console.error('❌ Error sending data:', err);
        showNotification('❌ Failed to save to Google Sheets. Check console for details.', 'error');
    });
    
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== EXCEL EXPORT FUNCTIONS ==========

/**
 * Saves receipt data to localStorage for future Excel export
 */
function saveReceiptToStorage(receiptData) {
    let receipts = JSON.parse(localStorage.getItem('allReceipts')) || [];
    receipts.push(receiptData);
    localStorage.setItem('allReceipts', JSON.stringify(receipts));
}

/**
 * Exports the current receipt to Excel immediately
 */
function exportCurrentReceiptToExcel() {
    const receiptPreview = document.getElementById('receiptPreview');
    if (!receiptPreview.classList.contains('active')) {
        alert('⚠️ Please generate receipt first!');
        return;
    }

    // Collect fee rows
    const feeRows = document.querySelectorAll('#feeTableBody tr');
    const fees = [];
    let totalAmount = 0;

    feeRows.forEach(row => {
        const type = row.querySelector('.fee-type')?.value || '';
        const period = row.querySelector('.fee-period')?.value || '';
        const amount = parseFloat(row.querySelector('.fee-amount')?.value) || 0;

        if (type && amount > 0) {
            fees.push({ type, period, amount });
            totalAmount += amount;
        }
    });

    // Create receipt data object
    const receiptData = {
        receiptNumber: document.getElementById('receiptNumber').value,
        receiptDate: formatDate(document.getElementById('receiptDate').value),
        academicSession: document.getElementById('academicSession').value,
        studentName: document.getElementById('studentName').value,
        dob: formatDate(document.getElementById('dob').value),
        gender: document.getElementById('gender').value || 'N/A',
        fatherName: document.getElementById('fatherName').value || 'N/A',
        motherName: document.getElementById('motherName').value || 'N/A',
        classSection: document.getElementById('classSection').value,
        paymentMode: document.getElementById('paymentMode').value,
        transactionId: document.getElementById('transactionId').value || 'N/A',
        paymentDate: formatDate(document.getElementById('paymentDate').value),
        fees: fees,
        totalAmount: totalAmount
    };

    // Save to localStorage
    saveReceiptToStorage(receiptData);

    // Export to Excel
    exportSingleReceiptToExcel(receiptData);
}

/**
 * Exports a single receipt to Excel file
 */
function exportSingleReceiptToExcel(receiptData) {
    // Create worksheet data
    const wsData = [];

    // Header Section
    wsData.push(['NANDINI VIDYANIKETAN (E-LEARNING VISTA PVT. LTD.)']);
    wsData.push(['Nandini Nagar, Rupaidiha Road, Nanpara (Bahraich), Uttar Pradesh']);
    wsData.push(['FEE RECEIPT']);
    wsData.push([]); // Empty row

    // Receipt Information
    wsData.push(['Receipt Number:', receiptData.receiptNumber, 'Date:', receiptData.receiptDate]);
    wsData.push(['Academic Session:', receiptData.academicSession]);
    wsData.push([]); // Empty row

    // Student Information
    wsData.push(['STUDENT INFORMATION']);
    wsData.push(['Student Name:', receiptData.studentName]);
    wsData.push(['Date of Birth:', receiptData.dob]);
    wsData.push(['Gender:', receiptData.gender]);
    wsData.push(['Father\'s Name:', receiptData.fatherName]);
    wsData.push(['Mother\'s Name:', receiptData.motherName]);
    wsData.push(['Class / Section:', receiptData.classSection]);
    wsData.push([]); // Empty row

    // Fee Details
    wsData.push(['FEE DETAILS']);
    wsData.push(['S.No', 'Fee Type', 'Month / Period', 'Amount (₹)']);
    
    let serialNo = 1;
    receiptData.fees.forEach(fee => {
        wsData.push([serialNo++, fee.type, fee.period || 'N/A', fee.amount.toFixed(2)]);
    });

    wsData.push([]); // Empty row
    wsData.push(['', '', 'Total Amount:', `₹ ${receiptData.totalAmount.toFixed(2)}`]);
    wsData.push(['Amount in Words:', numberToWords(Math.floor(receiptData.totalAmount)) + ' Rupees Only']);
    wsData.push([]); // Empty row

    // Payment Information
    wsData.push(['PAYMENT INFORMATION']);
    wsData.push(['Payment Mode:', receiptData.paymentMode]);
    wsData.push(['Transaction ID / Cheque No:', receiptData.transactionId]);
    wsData.push(['Payment Date:', receiptData.paymentDate]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        {wch: 20},  // Column A
        {wch: 25},  // Column B
        {wch: 20},  // Column C
        {wch: 15}   // Column D
    ];

    // Merge cells for header
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // School name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },  // School address
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }   // Fee Receipt title
    );

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Receipt');

    // Generate filename
    const filename = `Receipt_${receiptData.receiptNumber}_${receiptData.studentName.replace(/\s+/g, '_')}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    showNotification(`✅ Receipt exported to Excel successfully!`, 'success');
}

/**
 * Export all receipts to a single Excel file
 */
function exportAllReceiptsToExcel() {
    let receipts = JSON.parse(localStorage.getItem('allReceipts')) || [];

    if (receipts.length === 0) {
        alert('⚠️ No receipts found to export!');
        return;
    }

    // Create worksheet data
    const wsData = [];

    // Header row
    wsData.push([
        'Receipt No.',
        'Date',
        'Session',
        'Student Name',
        'DOB',
        'Gender',
        'Father Name',
        'Mother Name',
        'Class',
        'Payment Mode',
        'Transaction ID',
        'Payment Date',
        'Total Amount (₹)'
    ]);

    // Add receipt data rows
    receipts.forEach(receipt => {
        wsData.push([
            receipt.receiptNumber,
            receipt.receiptDate,
            receipt.academicSession,
            receipt.studentName,
            receipt.dob,
            receipt.gender,
            receipt.fatherName,
            receipt.motherName,
            receipt.classSection,
            receipt.paymentMode,
            receipt.transactionId,
            receipt.paymentDate,
            receipt.totalAmount.toFixed(2)
        ]);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        {wch: 12}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 12},
        {wch: 10}, {wch: 20}, {wch: 20}, {wch: 10}, {wch: 15},
        {wch: 15}, {wch: 12}, {wch: 15}
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'All Receipts');

    // Generate filename
    const today = new Date().toISOString().split('T')[0];
    const filename = `All_Receipts_${today}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    alert(`✅ ${receipts.length} receipts exported successfully!\nFile: ${filename}`);
}