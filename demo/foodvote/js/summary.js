const firebaseConfig = {
    apiKey: "demo",
    authDomain: "demo.invalid",
    databaseURL: "https://demo.invalid",
    projectId: "demo",
    storageBucket: "demo.invalid",
    messagingSenderId: "0",
    appId: "demo",
    measurementId: "demo"
  };
  

let userId;
let currentDate;
let today;
let menuItems = {};
let currentMode = 'all';

function getTodayDate() {
    if (typeof luxon !== 'undefined') {
        return luxon.DateTime.now().setZone('Asia/Bangkok').toISODate();
    } else {
        const date = new Date();
        const offset = 7 * 60; // Asia/Bangkok offset = UTC+7
        const localOffset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() + (offset + localOffset) * 60 * 1000);
        return adjustedDate.toISOString().split('T')[0];
    }
}

function updateDateDisplay(date) {
    const dateDisplayElement = document.querySelector('#date-display');
    if (dateDisplayElement) {
        if (typeof luxon !== 'undefined') {
            const dateLuxon = luxon.DateTime.fromISO(date).setZone('Asia/Bangkok');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplayElement.textContent = dateLuxon.toLocaleString(options, { locale: 'th' });
        } else {
            const jsDate = new Date(date);
            dateDisplayElement.textContent = jsDate.toLocaleDateString('th-TH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }
}

function setupDateNavigation() {
    const prevDateBtn = document.querySelector('#prev-date-btn');
    const nextDateBtn = document.querySelector('#next-date-btn');
    const datePicker = document.querySelector('#date-picker');
    const dateDisplayContainer = document.querySelector('.relative');

    if (!datePicker || !dateDisplayContainer) {
        console.error('ไม่พบ #date-picker หรือ .relative ใน DOM');
        return;
    }

    today = getTodayDate();

    const urlParams = new URLSearchParams(window.location.search);
    let urlDate = urlParams.get('date');
    if (urlDate && typeof luxon !== 'undefined') {
        urlDate = luxon.DateTime.fromISO(urlDate, { zone: 'Asia/Bangkok' }).toISODate();
    }
    currentDate = urlDate || today;
    updateDateDisplay(currentDate);

    datePicker.max = today;
    datePicker.value = currentDate;

    function updateNextButtonState() {
        nextDateBtn.disabled = currentDate === today;
        nextDateBtn.classList.toggle('opacity-50', currentDate === today);
        nextDateBtn.classList.toggle('cursor-not-allowed', currentDate === today);
    }

    updateNextButtonState();

    prevDateBtn.addEventListener('click', () => {
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).minus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        datePicker.value = currentDate;
        updateDateDisplay(currentDate);
        loadSummary();
        updateNextButtonState();
    });

    nextDateBtn.addEventListener('click', () => {
        if (currentDate === today) return;
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).plus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        datePicker.value = currentDate;
        updateDateDisplay(currentDate);
        loadSummary();
        updateNextButtonState();
    });

    datePicker.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            currentDate = selectedDate;
            updateDateDisplay(currentDate);
            loadSummary();
            updateNextButtonState();
        }
    });

    dateDisplayContainer.addEventListener('click', (e) => {
        if (e.target !== prevDateBtn && e.target !== nextDateBtn) {
            try {
                datePicker.showPicker();
            } catch (error) {
                console.warn('showPicker() ไม่รองรับ, ใช้ fallback');
                datePicker.click();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่ามีการกลับมาจากการล็อกอินหรือไม่
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('liff.state')) {
        // รีเฟรชหน้าเพื่อโหลดข้อมูลใหม่
        window.location.href = window.location.pathname + '?date=' + currentDate;
    }

    document.getElementById('mode-switch').addEventListener('change', function() {
        currentMode = this.value;
        loadSummary();
    });

    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = `results.html?date=${currentDate}`;
    });

    document.getElementById('refresh-btn').addEventListener('click', function() {
        loadSummary();
    });

    document.getElementById('copy-btn').addEventListener('click', copySummary);

    try {
        firebase.initializeApp(firebaseConfig);
        initializeLiff();
        setupDateNavigation();
    } catch (error) {
        showError('เริ่มต้น Firebase ล้มเหลว: ' + error.message);
    }
});

function initializeLiff() {
    const liffId = "demo";

    liff.init({ liffId })
        .then(() => {
            // ตรวจสอบสถานะการล็อกอินและความถูกต้องของ token
            if (!liff.isLoggedIn()) {
                // หากไม่ได้ล็อกอิน ให้ล็อกอินใหม่
                liff.login({ redirectUri: 'index.html' });
                return;
            }

            // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
            return liff.getProfile()
                .catch(error => {
                    if (error.status === 401 || error.message.includes('token expired')) {
                        // หาก token หมดอายุ ให้ล็อกอินใหม่
                        liff.logout();
                        liff.login({ redirectUri: 'index.html' });
                        throw new Error('Token expired, re-login initiated');
                    }
                    throw error;
                });
        })
        .then(profile => {
            if (!profile) {
                showError('ไม่สามารถดึงโปรไฟล์ผู้ใช้ได้');
                return;
            }

            userId = profile.userId;
            loadSummary();
        })
        .catch(error => {
            showError('เกิดข้อผิดพลาดในการเริ่มต้น LIFF: ' + error.message);
        });
}

function showLoading() {
    document.getElementById('loading-container').style.display = 'block';
    document.getElementById('content-container').style.display = 'none';
    document.getElementById('summary-error').classList.add('hidden');
    document.getElementById('summary-success').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('content-container').style.display = 'block';
}

function showSuccess(message) {
    const successElement = document.getElementById('summary-success');
    successElement.querySelector('span').textContent = message; // อัปเดตข้อความ
    successElement.classList.remove('hidden');
    successElement.classList.add('show'); // เพิ่มคลาสสำหรับอนิเมชัน

    // รีเซ็ต stroke-dashoffset เพื่อให้อนิเมชันเล่นใหม่ทุกครั้ง
    const checkmarkPath = successElement.querySelector('.checkmark__path');
    checkmarkPath.style.strokeDashoffset = 100;

    setTimeout(() => {
        successElement.classList.remove('show');
        successElement.classList.add('hidden');
    }, 3000);
}

function showError(message) {
    const errorElement = document.getElementById('summary-error');
    if (message.includes('token expired')) {
        errorElement.innerHTML = 'เซสชันหมดอายุ กรุณาเปิดลิงก์นี้อีกครั้งใน LINE หรือรีเฟรชหน้า';
    } else {
        errorElement.textContent = message;
    }
    errorElement.classList.remove('hidden');
    hideLoading();
}

function loadSummary() {
    showLoading();
    document.getElementById('total-items-label').textContent = 'จำนวนรายการทั้งหมด:';
    document.getElementById('total-items').textContent = '0';
    document.getElementById('total-cost-label').textContent = 'ยอดรวมทั้งหมด:';
    document.getElementById('total-cost').textContent = '0 บาท';
    document.getElementById('menu-list').value = '';
    menuItems = {};

    getMenuData()
    .then(() => {
        const votesRef = firebase.database().ref(`/votes/${currentDate}`);
        const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}`);

        votesRef.on('value', (votesSnapshot) => {
            const votes = votesSnapshot.val() || {};
            
            additionalVotesRef.on('value', (additionalVotesSnapshot) => {
                const additionalVotes = additionalVotesSnapshot.val() || {};
                displaySummary(votes, additionalVotes);
                hideLoading();
                showSuccess('ข้อมูลอัปเดตแล้ว');
            }, (error) => {
                showError('เกิดข้อผิดพลาดในการโหลดโหวตเพิ่มเติม: ' + error.message);
                hideLoading();
            });
        }, (error) => {
            showError('เกิดข้อผิดพลาดในการโหลดผลโหวต: ' + error.message);
            hideLoading();
        });
    })
    .catch(error => {
        if (error.message !== 'No menu data available') {
            showError('เกิดข้อผิดพลาดในการโหลดข้อมูลเมนู: ' + error.message);
        }
        hideLoading();
    });
}

function getMenuData() {
    return new Promise((resolve, reject) => {
        firebase.database().ref(`/menus/${currentDate}`).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.items) {
                menuItems = data.items;
                resolve();
            } else {
                menuItems = {};
                const menuListContainer = document.getElementById('menu-list');
                menuListContainer.value = `ยังไม่มีรายการเมนูอาหารสำหรับวันที่ ${currentDate}`;
                document.getElementById('total-items').textContent = '0';
                document.getElementById('total-cost').textContent = '0 บาท';
                reject(new Error('No menu data available'));
            }
        }, (error) => {
            reject(error);
        });
    });
}

function displaySummary(votes, additionalVotes) {
    let totalItemsAll = 0;
    let totalCostAll = 0;
    let freeItems = 0;
    let paidItems = 0;
    let paidCost = 0;
    const menuVotes = {};
    const freeVotes = {};
    const paidVotes = {};
    const paidUsers = {};

    Object.entries(votes).forEach(([userId, vote]) => {
        const menuId = vote.menuId;
        const quantity = vote.quantity || 1;
        const userName = vote.userName || 'ไม่ระบุชื่อ';

        freeVotes[menuId] = freeVotes[menuId] || { quantity: 0, users: [] };
        freeVotes[menuId].quantity += quantity;
        freeVotes[menuId].users.push(userName);

        freeItems += quantity;

        menuVotes[menuId] = (menuVotes[menuId] || 0) + quantity;
        totalItemsAll += quantity;
        const price = menuItems[menuId]?.price || 20;
        totalCostAll += quantity * price;
    });

    Object.entries(additionalVotes).forEach(([userId, userAdditionalVotes]) => {
        Object.entries(userAdditionalVotes).forEach(([menuId, vote]) => {
            if (vote && vote.quantity && menuId !== 'userName') {
                const quantity = vote.quantity;
                const userName = vote.userName || 'ไม่ระบุชื่อ';
                const price = menuItems[menuId]?.price || 20;

                paidVotes[menuId] = paidVotes[menuId] || { totalQuantity: 0, userVotes: {} };
                paidVotes[menuId].totalQuantity += quantity;
                paidVotes[menuId].userVotes[userName] = (paidVotes[menuId].userVotes[userName] || 0) + quantity;

                paidUsers[userName] = paidUsers[userName] || { totalQuantity: 0, totalCost: 0 };
                paidUsers[userName].totalQuantity += quantity;
                paidUsers[userName].totalCost += quantity * price;

                paidItems += quantity;
                paidCost += quantity * price;

                menuVotes[menuId] = (menuVotes[menuId] || 0) + quantity;
                totalItemsAll += quantity;
                totalCostAll += quantity * price;
            }
        });
    });

    const menuListContainer = document.getElementById('menu-list');
    let summaryText = `📋 สรุปผลโหวตอาหาร\n`;

    summaryText += `วันที่: ${document.getElementById('date-display').textContent}\n\n`;

    if (currentMode === 'free') {
        document.getElementById('total-items-label').textContent = 'จำนวนรายการ(ฟรี)ทั้งหมด:';
        document.getElementById('total-items').textContent = freeItems;
        document.getElementById('total-cost-label').textContent = 'ยอดรวมทั้งหมด:';

        summaryText += `จำนวนรายการ(ฟรี)ทั้งหมด: ${freeItems} รายการ\n`;
        summaryText += `📋 รายการที่ถูกโหวต (ฟรี):\n`;
        const totalFreeMenus = Object.keys(freeVotes).length;
        if (totalFreeMenus === 0) {
            summaryText += 'ยังไม่มีรายการที่ถูกโหวต (ฟรี)\n';
        } else {
            Object.entries(freeVotes).forEach(([menuId, data]) => {
                const menuName = menuItems[menuId]?.name || 'ไม่ทราบชื่อ';
                const quantity = data.quantity;
                const users = data.users.join(', ');
                summaryText += `- ${menuName}: ${quantity} รายการ (${users})\n`;
            });
        }
    } else if (currentMode === 'paid') {
        document.getElementById('total-items-label').textContent = 'จำนวนรายการ(เสียเงิน)ทั้งหมด:';
        document.getElementById('total-items').textContent = paidItems;
        document.getElementById('total-cost-label').textContent = 'ยอดรวมทั้งหมด:';
        document.getElementById('total-cost').textContent = `${paidCost} บาท`;

        summaryText += `จำนวนรายการ(เสียเงิน)ทั้งหมด: ${paidItems} รายการ\n`;
        summaryText += `ยอดรวมทั้งหมด: ${paidCost} บาท\n\n`;
        summaryText += `📋 รายการที่ถูกโหวต (เสียเงิน):\n`;
        const totalPaidMenus = Object.keys(paidVotes).length;
        if (totalPaidMenus === 0) {
            summaryText += 'ยังไม่มีรายการที่ถูกโหวต (เสียเงิน)\n';
        } else {
            Object.entries(paidVotes).forEach(([menuId, data]) => {
                const menuName = menuItems[menuId]?.name || 'ไม่ทราบชื่อ';
                const totalQuantity = data.totalQuantity;
                const userVotes = Object.entries(data.userVotes)
                    .map(([userName, quantity]) => `${userName}: ${quantity}`)
                    .join(', ');
                summaryText += `- ${menuName}: ${totalQuantity} รายการ (${userVotes})\n`;
            });
        }

        summaryText += `\n📋 รายชื่อและรายการของผู้เสียเงิน\n`;
        const totalPaidUsers = Object.keys(paidUsers).length;
        if (totalPaidUsers === 0) {
            summaryText += 'ยังไม่มีผู้เสียเงิน\n';
        } else {
            Object.entries(paidUsers).forEach(([userName, data]) => {
                const totalQuantity = data.totalQuantity;
                const totalCost = data.totalCost;
                summaryText += `- ${userName}: ${totalQuantity} รายการ (${totalCost} บาท)\n`;
            });
        }
    } else {
        document.getElementById('total-items-label').textContent = 'จำนวนรายการทั้งหมด:';
        document.getElementById('total-items').textContent = totalItemsAll;
        document.getElementById('total-cost-label').textContent = 'ยอดรวมทั้งหมด:';
        document.getElementById('total-cost').textContent = `${totalCostAll} บาท`;

        summaryText += `จำนวนรายการทั้งหมด: ${totalItemsAll} รายการ\n`;
        summaryText += `ยอดรวมทั้งหมด: ${totalCostAll} บาท\n\n`;
        summaryText += `📋 รายการที่ถูกโหวต (รวม):\n`;
        const totalMenus = Object.keys(menuVotes).length;
        if (totalMenus === 0) {
            summaryText += 'ยังไม่มีรายการที่ถูกโหวต\n';
        } else {
            Object.entries(menuVotes).forEach(([menuId, quantity]) => {
                const menuName = menuItems[menuId]?.name || 'ไม่ทราบชื่อ';
                summaryText += `- ${menuName}: ${quantity} รายการ\n`;
            });
        }
    }

    menuListContainer.value = summaryText;
    document.getElementById('copy-btn').setAttribute('data-summary', summaryText);
}

function copySummary() {
    const copyBtn = document.getElementById('copy-btn');
    const summaryText = copyBtn.getAttribute('data-summary');
    
    navigator.clipboard.writeText(summaryText)
    .then(() => {
        copyBtn.textContent = 'คัดลอกสำเร็จ!';
        copyBtn.style.backgroundColor = '#45a049';
        setTimeout(() => {
            copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                คัดลอกผลสรุป
            `;
            copyBtn.style.backgroundColor = '#4caf50';
        }, 2000);
    })
    .catch(error => {
        showError('เกิดข้อผิดพลาดในการคัดลอก: ' + error.message);
    });
}