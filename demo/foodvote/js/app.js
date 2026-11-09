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

let isLiffInitialized = false;
let userId;
let userName;
let userPictureUrl;
let selectedMenus = new Map();
let today;
let currentDate; // วันที่ที่กำลังแสดง (อาจไม่ใช่วันปัจจุบัน)
let menuItems = {};
let additionalCost = 0;
let cachedVotes = {};
let cachedAdditionalVotes = {};
let isInitialLoad = true;
let editingMenuIds = new Set();
let isMenuActive = false; // ตัวแปรเพื่อเก็บสถานะของเมนู

let loadingStates = { profile: false, menu: false, votes: false };

function checkLoadingComplete() {
    const allLoaded = Object.values(loadingStates).every(state => state);
    const loadingElement = document.querySelector('#loading');
    if (allLoaded && loadingElement) {
        loadingElement.style.display = 'none';
    }
}

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
    const todayDateElement = document.querySelector('#today-date');
    if (todayDateElement) {
        if (typeof luxon !== 'undefined') {
            const dateLuxon = luxon.DateTime.fromISO(date).setZone('Asia/Bangkok');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            todayDateElement.textContent = dateLuxon.toLocaleString(options, { locale: 'th' });
        } else {
            const jsDate = new Date(date);
            todayDateElement.textContent = jsDate.toLocaleDateString('th-TH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }
}

function setupDateNavigation() {
    const prevDateBtn = document.querySelector('#prev-date-btn');
    const nextDateBtn = document.querySelector('#next-date-btn');
    const datePicker = document.querySelector('#date-picker');
    const todayDateElement = document.querySelector('#today-date');

    today = getTodayDate();
    currentDate = today; // เริ่มต้นที่วันปัจจุบัน
    updateDateDisplay(currentDate);

    // ตั้งค่า max ของ date picker เป็นวันปัจจุบัน
    datePicker.max = today;

    // อัปเดตสถานะปุ่ม next
    function updateNextButtonState() {
        nextDateBtn.disabled = currentDate === today;
        nextDateBtn.classList.toggle('opacity-50', currentDate === today);
        nextDateBtn.classList.toggle('cursor-not-allowed', currentDate === today);
    }

    updateNextButtonState();

    prevDateBtn.addEventListener('click', () => {
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).minus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        updateDateDisplay(currentDate);
        getMenuDataForDate(currentDate);
        updateNextButtonState();
    });

    nextDateBtn.addEventListener('click', () => {
        if (currentDate === today) return;
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).plus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        updateDateDisplay(currentDate);
        getMenuDataForDate(currentDate);
        updateNextButtonState();
    });

    datePicker.addEventListener('change', (e) => {
        const selectedDate = e.target.value; // รูปแบบ YYYY-MM-DD
        if (selectedDate) {
            currentDate = selectedDate;
            updateDateDisplay(currentDate);
            getMenuDataForDate(currentDate);
            updateNextButtonState();
        }
    });

    todayDateElement.addEventListener('click', () => {
        datePicker.showPicker(); // เปิดปฏิทิน
    });
}

function getMenuDataForDate(date) {
    menuItems = {}; // รีเซ็ตเมนู
    selectedMenus.clear(); // รีเซ็ตการเลือกของผู้ใช้
    cachedVotes = {}; // รีเซ็ตข้อมูลโหวต
    cachedAdditionalVotes = {}; // รีเซ็ตข้อมูลโหวตเพิ่มเติม
    isMenuActive = false; // รีเซ็ตสถานะ

    // ดึงข้อมูลเมนู
    firebase.database().ref(`/menus/${date}`).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // ตรวจสอบสถานะ
            isMenuActive = data.status === 'active';
            if (data.items) {
                data.items.forEach((item, index) => {
                    if (item && item.id) {
                        menuItems[item.id] = {
                            id: item.id,
                            name: item.name,
                            price: item.price || 20
                        };
                    }
                });
            }
        }
        displayMenuItems();
        loadingStates.menu = true;
        checkLoadingComplete();
    }, (error) => {
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลเมนูอาหาร: ' + error.message);
        displayMenuItems();
        loadingStates.menu = true;
        checkLoadingComplete();
    });

    // ดึงข้อมูลโหวต
    firebase.database().ref(`/votes/${date}`).once('value', (snapshot) => {
        cachedVotes = snapshot.val() || {};
        checkIfUserVoted();
    }, (error) => {
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้โหวต (votes): ' + error.message);
    });

    firebase.database().ref(`/additional_votes/${date}`).once('value', (snapshot) => {
        cachedAdditionalVotes = snapshot.val() || {};
        checkIfUserVoted();
    }, (error) => {
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้โหวต (additional_votes): ' + error.message);
    });
}

function setupVotersListener() {
    firebase.database().ref(`/votes/${currentDate}`).on('value', (snapshot) => {
        cachedVotes = snapshot.val() || {};
        if (!isInitialLoad) {
            checkIfUserVoted();
        }
    }, (error) => {
        showError('เกิดข้อผิดพลาดในการฟังข้อมูลผู้โหวต (votes): ' + error.message);
    });

    firebase.database().ref(`/additional_votes/${currentDate}`).on('value', (snapshot) => {
        cachedAdditionalVotes = snapshot.val() || {};
        if (!isInitialLoad) {
            checkIfUserVoted();
        }
    }, (error) => {
        showError('เกิดข้อผิดพลาดในการฟังข้อมูลผู้โหวต (additional_votes): ' + error.message);
    });
}

function showGreeting(userName, hasMenu = false) {
    const greetingElement = document.querySelector('#greeting-message');
    if (!greetingElement) return;
    if (hasMenu) {
        if (currentDate === today && isMenuActive) {
            greetingElement.textContent = `สวัสดี ${userName} เลือกอาหารเลย! 😊`;
        } else if (currentDate === today && !isMenuActive) {
            greetingElement.textContent = `สวัสดี ${userName} เมนูนี้ไม่สามารถโหวตได้ 😔`;
        } else {
            greetingElement.textContent = `สวัสดี ${userName} นี่คือเมนูย้อนหลัง`;
        }
    } else {
        greetingElement.textContent = `สวัสดี ${userName} รอเมนูอาหารก่อนนะ~ 😊`;
    }
    greetingElement.classList.remove('hidden');
}

function updateVotersCache() {
    return Promise.all([
        firebase.database().ref(`/votes/${currentDate}`).once('value'),
        firebase.database().ref(`/additional_votes/${currentDate}`).once('value')
    ])
    .then(([votesSnapshot, additionalVotesSnapshot]) => {
        cachedVotes = votesSnapshot.val() || {};
        cachedAdditionalVotes = additionalVotesSnapshot.val() || {};
    })
    .catch(error => {
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้โหวต: ' + error.message);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        'profile-section': document.querySelector('#profile-section'),
        'loading': document.querySelector('#loading'),
        'menu-container': document.querySelector('#menu-container'),
        'already-voted': document.querySelector('#already-voted'),
        'error-message': document.querySelector('#error-message'),
        'cost-display': document.querySelector('#cost-display'),
        'cost-amount': document.querySelector('#cost-amount'),
        'add-menu-btn': document.querySelector('#add-menu-btn'),
        'add-menu-form': document.querySelector('#add-menu-form'),
        'new-menu-name': document.querySelector('#new-menu-name'),
        'new-menu-price': document.querySelector('#new-menu-price'),
        'save-new-menu-btn': document.querySelector('#save-new-menu-btn'),
        'cancel-new-menu-btn': document.querySelector('#cancel-new-menu-btn')
    };

    let allElementsExist = true;
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            allElementsExist = false;
        }
    }

    if (!allElementsExist) {
        alert("พบปัญหาในการโหลด DOM elements บางส่วนอาจไม่ทำงาน");
    }

    if (typeof liff === 'undefined' || typeof firebase === 'undefined') {
        showError(`ไม่สามารถโหลดไลบรารีที่จำเป็น: ${typeof liff === 'undefined' ? 'LIFF' : ''} ${typeof firebase === 'undefined' ? 'Firebase' : ''}`);
        return;
    }

    try {
        firebase.initializeApp(firebaseConfig);
        initializeLiff().then(() => {
            setupDateNavigation();
            getMenuDataForDate(currentDate);
            setupAddMenuForm(elements);
            updateCostDisplay();
        });
    } catch (error) {
        showError('เริ่มต้น Firebase ล้มเหลว: ' + error.message);
    }

    const refreshBtn = document.querySelector('#refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });
    }
});

function setupAddMenuForm(elements) {
    elements['add-menu-btn'].addEventListener('click', () => {
        if (currentDate !== today) {
            showError('ไม่สามารถเพิ่มเมนูในวันย้อนหลังได้');
            return;
        }
        if (!isMenuActive) {
            showError('ไม่สามารถเพิ่มเมนูได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
            return;
        }
        elements['add-menu-form'].classList.toggle('hidden');
        elements['new-menu-name'].focus();
    });

    elements['save-new-menu-btn'].addEventListener('click', () => {
        const name = elements['new-menu-name'].value.trim();
        const price = parseFloat(elements['new-menu-price'].value) || 20;

        if (!name) {
            alert('กรุณากรอกชื่อเมนู');
            return;
        }

        if (price < 0) {
            alert('ราคาต้องไม่เป็นค่าลบ');
            return;
        }

        addNewMenuItem(name, price).then(() => {
            elements['add-menu-form'].classList.add('hidden');
            elements['new-menu-name'].value = '';
            elements['new-menu-price'].value = '20';
        }).catch(error => {
            showError('เกิดข้อผิดพลาดในการเพิ่มเมนู: ' + error.message);
        });
    });

    elements['cancel-new-menu-btn'].addEventListener('click', () => {
        elements['add-menu-form'].classList.add('hidden');
        elements['new-menu-name'].value = '';
        elements['new-menu-price'].value = '20';
    });
}

function addNewMenuItem(name, price) {
    if (!isMenuActive) {
        showError('ไม่สามารถเพิ่มเมนูได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return Promise.reject(new Error('Menu is inactive'));
    }

    const newMenuId = Math.max(...Object.keys(menuItems).map(id => parseInt(id)), 0) + 1;
    const newMenu = {
        id: newMenuId.toString(),
        name: name,
        price: price
    };

    return firebase.database().ref(`/menus/${currentDate}/items/${newMenuId}`).set(newMenu)
        .then(() => {
            menuItems[newMenuId] = newMenu;
            debouncedDisplayMenuItems();
        });
}

function initializeLiff() {
    const liffId = document.querySelector('#liffId')?.value;
    if (!liffId) {
        showError('ไม่พบ LIFF ID');
        return Promise.reject(new Error('LIFF ID not found'));
    }

    const profileSection = document.querySelector('#profile-section');
    if (profileSection) profileSection.style.display = 'none';

    if (isLiffInitialized) {
        if (liff.isLoggedIn()) {
            return liff.getProfile();
        }
        return Promise.resolve();
    }

    return liff.init({ liffId })
        .then(() => {
            isLiffInitialized = true;
            today = getTodayDate();
            currentDate = today;

            if (liff.isInClient() && liff.isLoggedIn()) {
                return liff.getProfile();
            }

            if (!liff.isLoggedIn()) {
                const cleanRedirectUri = 'index.html';
                liff.login({ redirectUri: cleanRedirectUri });
                return Promise.reject(new Error('User not logged in'));
            }

            return liff.getProfile();
        })
        .then(profile => {
            if (!profile) {
                userId = 'anonymous_' + Math.random().toString(36).substr(2, 9);
                userName = 'ผู้ใช้ไม่ระบุตัวตน';
                userPictureUrl = 'https://via.placeholder.com/48';

                showGreeting(userName);
                displayUserProfile();
                checkIfUserVoted();
                setupFeatures();
                if (profileSection) profileSection.style.display = 'flex';
                loadingStates.profile = true;
                checkLoadingComplete();
                return;
            }

            userId = profile.userId;
            userName = profile.displayName;
            userPictureUrl = profile.pictureUrl;

            showGreeting(userName);
            displayUserProfile();
            checkIfUserVoted();
            setupFeatures();
            if (profileSection) profileSection.style.display = 'flex';
            loadingStates.profile = true;
            checkLoadingComplete();
        })
        .catch(error => {
            showError('เกิดข้อผิดพลาดในการเริ่มต้น LIFF: ' + error.message);
            if (profileSection) profileSection.style.display = 'flex';
            loadingStates.profile = true;
            checkLoadingComplete();
        });
}

function displayUserProfile() {
    const profileContent = document.querySelector('#profile-content');
    if (!profileContent) {
        return;
    }
    profileContent.innerHTML = `
        <img src="${userPictureUrl || 'https://via.placeholder.com/48'}" alt="${userName}" class="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-sm">
        <p class="font-semibold text-base text-gray-800">${userName}</p>
    `;
    showGreeting(userName);
}

function setupFeatures() {
}

function checkIfUserVoted() {
    if (!userId) {
        loadingStates.votes = true;
        checkLoadingComplete();
        return;
    }

    Promise.all([
        firebase.database().ref(`/votes/${currentDate}/${userId}`).once('value'),
        firebase.database().ref(`/additional_votes/${currentDate}/${userId}`).once('value')
    ])
    .then(([voteSnapshot, additionalVotesSnapshot]) => {
        const vote = voteSnapshot.val();
        const additionalVotes = additionalVotesSnapshot.val();

        selectedMenus.clear();

        if (vote) {
            const quantity = vote.quantity || 1;
            const currentQuantity = selectedMenus.get(vote.menuId) || 0;
            selectedMenus.set(vote.menuId, currentQuantity + quantity);
        }

        if (additionalVotes) {
            Object.keys(additionalVotes).forEach(menuId => {
                if (menuId !== 'userName') {
                    const quantity = additionalVotes[menuId].quantity || 1;
                    const currentQuantity = selectedMenus.get(menuId) || 0;
                    selectedMenus.set(menuId, currentQuantity + quantity);
                }
            });
        }

        if (isInitialLoad) {
            setupVotersListener();
            isInitialLoad = false;
        }

        updateCostDisplay();
        debouncedDisplayMenuItems();

        const totalItems = Array.from(selectedMenus.values()).reduce((sum, qty) => sum + qty, 0);
        const alreadyVotedElement = document.querySelector('#already-voted');
        if (totalItems > 0) {
            alreadyVotedElement.style.display = 'block';
            alreadyVotedElement.textContent = `คุณได้เลือก ${totalItems} รายการ`;
        } else {
            alreadyVotedElement.style.display = 'none';
        }

        loadingStates.votes = true;
        checkLoadingComplete();
    })
    .catch(error => {
        showError('เกิดข้อผิดพลาดในการตรวจสอบการโหวต: ' + error.message);
        loadingStates.votes = true;
        checkLoadingComplete();
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded-lg py-2 px-4 shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }, 2000);
}

function updateFirebaseVotes() {
    if (!userId) {
        return Promise.reject(new Error('ไม่พบ User ID'));
    }

    if (currentDate !== today) {
        showError('ไม่สามารถโหวตในวันย้อนหลังได้');
        return Promise.reject(new Error('Cannot vote on past dates'));
    }

    if (!isMenuActive) {
        showError('ไม่สามารถโหวตได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return Promise.reject(new Error('Menu is inactive'));
    }

    const votesRef = firebase.database().ref(`/votes/${currentDate}/${userId}`);
    const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}/${userId}`);

    const selectedMenusArray = Array.from(selectedMenus.entries());
    const updates = {};

    return Promise.all([
        votesRef.remove(),
        additionalVotesRef.remove()
    ]).then(() => {
        let firstVoteProcessed = false;

        // วนลูปทุกเมนูใน selectedMenus
        selectedMenusArray.forEach(([menuId, quantity]) => {
            if (quantity <= 0) return;

            const price = menuItems[menuId]?.price || 20;

            // ถ้ายังไม่มีการบันทึกโหวตแรก
            if (!firstVoteProcessed) {
                // บันทึกโหวตแรกไปที่ votes (quantity = 1)
                updates[`/votes/${currentDate}/${userId}`] = {
                    menuId: menuId,
                    quantity: 1,
                    cost: price,
                    userName: userName,
                    userPictureUrl: userPictureUrl || ''
                };
                firstVoteProcessed = true;

                // ถ้ามี quantity มากกว่า 1 ให้บันทึกส่วนที่เหลือใน additional_votes
                if (quantity > 1) {
                    updates[`/additional_votes/${currentDate}/${userId}/${menuId}`] = {
                        quantity: quantity - 1,
                        cost: (quantity - 1) * price,
                        userName: userName,
                        userPictureUrl: userPictureUrl || ''
                    };
                }
            } else {
                // บันทึกโหวตทั้งหมดของเมนูนี้ไปที่ additional_votes
                updates[`/additional_votes/${currentDate}/${userId}/${menuId}`] = {
                    quantity: quantity,
                    cost: quantity * price,
                    userName: userName,
                    userPictureUrl: userPictureUrl || ''
                };
            }
        });

        // ถ้ามีการอัปเดต ให้บันทึกลง Firebase
        if (Object.keys(updates).length > 0) {
            return firebase.database().ref().update(updates);
        }
        return Promise.resolve();
    }).catch(error => {
        throw new Error('เกิดข้อผิดพลาดในการอัปเดตการโหวตใน Firebase: ' + error.message);
    });
}

function updateCostDisplay() {
    let totalCost = 0;
    let firstVoteDiscountApplied = false;
    const costAmount = document.querySelector('#cost-amount');
    const costDisplay = document.querySelector('#cost-display');
    
    if (!costAmount || !costDisplay) return;

    const selectedMenusArray = Array.from(selectedMenus.entries());
    
    if (selectedMenusArray.length === 0 && (!menuItems || Object.keys(menuItems).length === 0)) {
        costDisplay.classList.add('hidden');
        return;
    } else if (!isMenuActive || currentDate !== today) {
        costDisplay.classList.add('hidden');
        return;
    } else {
        costDisplay.classList.remove('hidden');
    }

    selectedMenusArray.forEach(([menuId, quantity], index) => {
        const price = menuItems[menuId]?.price || 20;
        if (index === 0 && quantity > 0 && !firstVoteDiscountApplied) {
            totalCost += (quantity - 1) * price;
            firstVoteDiscountApplied = true;
        } else {
            totalCost += quantity * price;
        }
    });
    
    costAmount.textContent = totalCost;
    costAmount.classList.toggle('text-zero', totalCost === 0);
    costAmount.classList.toggle('text-primary', totalCost > 0);
}

function showCostAnimation(element, price) {
    const animation = document.createElement('div');
    animation.className = 'cost-animation';
    animation.textContent = `+${price}`;
    element.appendChild(animation);

    animation.addEventListener('animationend', () => {
        animation.remove();
    }, { once: true });
}

function updateMenuQuantity(menuId, newQuantity) {
    if (!isMenuActive) {
        showError('ไม่สามารถโหวตได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return;
    }

    const previousQuantity = selectedMenus.get(menuId) || 0;
    const totalItemsBefore = Array.from(selectedMenus.values()).reduce((sum, qty) => sum + qty, 0);
    
    if (newQuantity <= 0) {
        selectedMenus.delete(menuId);
    } else {
        selectedMenus.set(menuId, newQuantity);
    }

    const totalItemsAfter = Array.from(selectedMenus.values()).reduce((sum, qty) => sum + qty, 0);
    const menuItem = document.querySelector(`.menu-item[data-menu-id="${menuId}"]`);
    const increaseBtn = menuItem.querySelector('.increase-btn');

    if (newQuantity > previousQuantity && (totalItemsBefore > 0 || previousQuantity > 0)) {
        const price = menuItems[menuId]?.price || 20;
        showCostAnimation(increaseBtn, price);
    }

    updateFirebaseVotes().then(() => {
        updateCostDisplay();
        debouncedDisplayMenuItems();

        const totalItems = Array.from(selectedMenus.values()).reduce((sum, qty) => sum + qty, 0);
        const alreadyVotedElement = document.querySelector('#already-voted');
        if (totalItems > 0) {
            alreadyVotedElement.style.display = 'block';
            alreadyVotedElement.textContent = `คุณได้เลือก ${totalItems} รายการ`;
        } else {
            alreadyVotedElement.style.display = 'none';
        }
    }).catch(error => {
        showError('เกิดข้อผิดพลาดในการอัปเดต UI: ' + error.message);
    });
}

function displayMenuItems() {
    const menuContainer = document.querySelector('#menu-container');
    const addMenuBtn = document.querySelector('#add-menu-btn');
    const costDisplay = document.querySelector('#cost-display');
    
    if (!menuContainer || !addMenuBtn || !costDisplay) {
        return;
    }
    
    menuContainer.innerHTML = '';

    if (!menuItems || Object.keys(menuItems).length === 0) {
        menuContainer.innerHTML = '<p class="text-center text-gray-500 py-4">ยังไม่มีรายการเมนูอาหารสำหรับวันนี้</p>';
        addMenuBtn.classList.add('hidden');
        costDisplay.classList.add('hidden');
        showGreeting(userName || 'User', false);
        return;
    }

    // แสดงปุ่มเพิ่มเมนูและ cost display เฉพาะเมื่อวันที่ปัจจุบันและสถานะ active
    if (currentDate === today && isMenuActive) {
        addMenuBtn.classList.remove('hidden');
        costDisplay.classList.remove('hidden');
    } else {
        addMenuBtn.classList.add('hidden');
        costDisplay.classList.add('hidden');
    }
    showGreeting(userName || 'User', true);

    // แสดงข้อความแจ้งเตือนถ้าเมนูเป็น inactive
    if (!isMenuActive) {
        menuContainer.innerHTML += '<p class="text-center text-red-500 py-4 font-medium">ปิดโหวตอัตโนมัติหลัง 18.30 น. (จ-พฤ) และ 20.30 น. (อา.)</p>';
    }

    document.removeEventListener('click', handleClickOutside);
    document.addEventListener('click', handleClickOutside);

    function handleClickOutside(e) {
        document.querySelectorAll('.more-options-menu.show').forEach(menu => {
            if (!menu.parentElement.contains(e.target)) {
                menu.classList.remove('show');
            }
        });

        editingMenuIds.forEach(menuId => {
            const menuItem = document.querySelector(`.menu-item[data-menu-id="${menuId}"]`);
            if (!menuItem) return;

            const editContainer = menuItem.querySelector('.edit-container');
            if (!editContainer.contains(e.target)) {
                if (!editContainer.classList.contains('hidden')) {
                    saveMenuItem(menuId);
                    editingMenuIds.delete(menuId);
                }
            }
        });
    }

    Object.keys(menuItems).forEach(menuId => {
        if (!menuItems[menuId]) return;
        const item = menuItems[menuId];
        const menuItem = document.createElement('div');
        menuItem.className = `menu-item relative p-4 rounded-lg transition duration-300 ease-in-out transform bg-gray-50 border border-gray-200 overflow-hidden`;
        menuItem.setAttribute('data-menu-id', menuId);

        const isCurrentDate = currentDate === today;
        menuItem.innerHTML = `
            <div class="menu-content flex items-center justify-between responsive-font">
                <div class="flex items-center flex-1">
                    <label class="flex-1 font-medium text-gray-800 menu-label">${item.name}</label>
                </div>
                <div class="flex items-center space-x-2">
                    ${isCurrentDate && isMenuActive ? `
                    <button class="quantity-btn decrease-btn bg-gray-200 text-gray-600" data-menu-id="${menuId}">-</button>
                    <span class="quantity-display font-medium text-gray-800">0</span>
                    <button class="quantity-btn increase-btn bg-gray-200 text-gray-600" data-menu-id="${menuId}">+</button>
                    <button class="more-options-btn">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v.01M12 12v.01M12 18v.01"></path>
                        </svg>
                    </button>
                    <div class="more-options-menu">
                        <button class="edit-option">แก้ไข</button>
                        <button class="delete-option">ลบ</button>
                    </div>
                    ` : `
                    <span class="quantity-display font-medium text-gray-800">0</span>
                    `}
                </div>
            </div>
            ${isCurrentDate && isMenuActive ? `
            <div class="edit-container hidden mt-2">
                <input type="text" class="edit-input w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value="${item.name}">
                <div class="flex items-center w-full border border-gray-300 rounded-lg mt-2">
                    <div class="pl-2 pr-2 text-gray-600 font-bold text-lg">฿</div>
                    <input type="number" class="edit-price-input flex-1 p-2 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" value="${item.price || 20}" min="0" step="1">
                </div>
                <div class="flex justify-between mt-3">
                    <button class="cancel-btn bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all" data-menu-id="${menuId}">ยกเลิก</button>
                    <button class="save-btn bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-all" data-menu-id="${menuId}">บันทึก</button>
                </div>
            </div>` : ''}
            <div class="voters-container"></div>
        `;

        const increaseBtn = menuItem.querySelector('.increase-btn');
        const decreaseBtn = menuItem.querySelector('.decrease-btn');
        let moreOptionsBtn = menuItem.querySelector('.more-options-btn');
        let moreOptionsMenu = menuItem.querySelector('.more-options-menu');
        let editOption = moreOptionsMenu?.querySelector('.edit-option');
        let deleteOption = moreOptionsMenu?.querySelector('.delete-option');
        let editContainer = menuItem.querySelector('.edit-container');
        let editInput = menuItem.querySelector('.edit-input');
        let editPriceInput = menuItem.querySelector('.edit-price-input');
        let saveBtn = menuItem.querySelector('.save-btn');
        let cancelBtn = menuItem.querySelector('.cancel-btn');

        let originalName = item.name;
        let originalPrice = item.price || 20;

        if (isCurrentDate && isMenuActive) {
            moreOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.more-options-menu.show').forEach(menu => {
                    if (menu !== moreOptionsMenu) {
                        menu.classList.remove('show');
                    }
                });
                moreOptionsMenu.classList.toggle('show');
            });

            editOption.addEventListener('click', (e) => {
                e.stopPropagation();
                if (editingMenuIds.size > 0) {
                    showToast('กรุณาบันทึกหรือยกเลิกการแก้ไขเมนูอื่นก่อน');
                    moreOptionsMenu.classList.remove('show');
                    return;
                }
                originalName = item.name;
                originalPrice = item.price || 20;
                editContainer.classList.remove('hidden');
                editInput.focus();
                editingMenuIds.add(menuId);
                moreOptionsMenu.classList.remove('show');
            });

            deleteOption.addEventListener('click', (e) => {
                e.stopPropagation();
                moreOptionsMenu.classList.remove('show');
                showConfirmationModal(
                    'ยืนยันการลบเมนู',
                    `คุณแน่ใจหรือไม่ว่าต้องการลบเมนู "${item.name}"? การดำเนินการนี้จะลบผลโหวตทั้งหมดที่เกี่ยวข้องด้วย`,
                    () => {
                        menuItem.style.animation = 'fadeIn 0.3s ease reverse';
                        menuItem.addEventListener('animationend', () => {
                            deleteMenuItem(menuId);
                        }, { once: true });
                    }
                );
            });

            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveMenuItem(menuId);
                    editingMenuIds.delete(menuId);
                }
            });

            editPriceInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveMenuItem(menuId);
                    editingMenuIds.delete(menuId);
                }
            });

            saveBtn.addEventListener('click', () => {
                saveMenuItem(menuId);
                editingMenuIds.delete(menuId);
            });

            cancelBtn.addEventListener('click', () => {
                editInput.value = originalName;
                editPriceInput.value = originalPrice;
                editContainer.classList.add('hidden');
                editingMenuIds.delete(menuId);
            });

            increaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentQuantity = selectedMenus.get(menuId) || 0;
                updateMenuQuantity(menuId, currentQuantity + 1);
            });

            decreaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentQuantity = selectedMenus.get(menuId) || 0;
                if (currentQuantity > 0) {
                    updateMenuQuantity(menuId, currentQuantity - 1);
                }
            });
        }

        menuContainer.appendChild(menuItem);
    });

    Object.keys(menuItems).forEach(menuId => {
        if (!menuItems[menuId]) return;
        const menuItem = menuContainer.querySelector(`.menu-item[data-menu-id="${menuId}"]`);
        if (!menuItem) return;

        const quantity = selectedMenus.get(menuId) || 0;
        const quantityDisplay = menuItem.querySelector('.quantity-display');
        const decreaseBtn = menuItem.querySelector('.decrease-btn');

        quantityDisplay.textContent = quantity;
        if (decreaseBtn) {
            decreaseBtn.disabled = quantity === 0 || currentDate !== today || !isMenuActive;
        }
        
        if (quantity > 0) {
            menuItem.classList.add('bg-primary-light', 'border-primary');
            menuItem.classList.remove('bg-gray-50', 'border-gray-200');
        } else {
            menuItem.classList.remove('bg-primary-light', 'border-primary');
            menuItem.classList.add('bg-gray-50', 'border-gray-200');
        }

        const votersContainer = menuItem.querySelector('.voters-container');
        const uniqueVoters = new Set();
        const voters = [];

        Object.keys(cachedVotes).forEach(voterId => {
            if (cachedVotes[voterId].menuId === menuId && !uniqueVoters.has(voterId)) {
                uniqueVoters.add(voterId);
                voters.push({
                    userId: voterId,
                    pictureUrl: cachedVotes[voterId].userPictureUrl || '',
                    userName: cachedVotes[voterId].userName || 'ไม่ทราบชื่อ'
                });
            }
        });
        
        Object.keys(cachedAdditionalVotes).forEach(voterId => {
            const userVotes = cachedAdditionalVotes[voterId] || {};
            if (userVotes[menuId] && !uniqueVoters.has(voterId)) {
                uniqueVoters.add(voterId);
                voters.push({
                    userId: voterId,
                    pictureUrl: userVotes[menuId].userPictureUrl || '',
                    userName: userVotes[menuId].userName || 'ไม่ทราบชื่อ'
                });
            }
        });

        const currentVotersCount = votersContainer.childElementCount;
        if (currentVotersCount !== voters.length) {
            while (votersContainer.firstChild) {
                votersContainer.removeChild(votersContainer.firstChild);
            }

            voters.forEach(voter => {
                const pictureUrl = voter.pictureUrl || '';
                const initials = voter.userName ? voter.userName.charAt(0).toUpperCase() : 'N/A';
            
                const voterElement = document.createElement('div');
                voterElement.className = 'voter-profile-container inline-flex relative group';
            
                const voterImg = document.createElement('img');
                voterImg.src = pictureUrl || 'https://via.placeholder.com/24';
                voterImg.alt = voter.userName;
                voterImg.className = 'voter-profile rounded-full object-cover w-6 h-6 border-2 border-white shadow-sm';
                voterImg.onerror = function() {
                    this.style.display = 'none';
                    const initialsElement = this.nextSibling;
                    if (initialsElement) {
                        initialsElement.style.display = 'flex';
                    }
                };
            
                const initialsCircle = document.createElement('div');
                initialsCircle.className = 'initials-circle rounded-full bg-blue-200 flex items-center justify-content text-gray-600 text-xs font-medium w-6 h-6 border-2 border-white shadow-sm';
                initialsCircle.style.display = pictureUrl ? 'none' : 'flex';
                initialsCircle.textContent = initials;
            
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none';
                tooltip.textContent = voter.userName;
            
                voterElement.appendChild(voterImg);
                voterElement.appendChild(initialsCircle);
                voterElement.appendChild(tooltip);
                votersContainer.appendChild(voterElement);
            });
        }
    });
}

function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');

    const confirmHandler = () => {
        onConfirm();
        modal.classList.add('hidden');
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
    };

    const cancelHandler = () => {
        modal.classList.add('hidden');
        modalConfirm.removeEventListener('click', confirmHandler);
        modalCancel.removeEventListener('click', cancelHandler);
    };

    modalConfirm.addEventListener('click', confirmHandler);
    modalCancel.addEventListener('click', cancelHandler);
}

function deleteMenuItem(menuId) {
    if (!isMenuActive) {
        showError('ไม่สามารถลบเมนูได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return;
    }

    const menuRef = firebase.database().ref(`/menus/${currentDate}/items/${menuId}`);
    const votesRef = firebase.database().ref(`/votes/${currentDate}`);
    const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}`);

    menuRef.remove()
        .then(() => {
            delete menuItems[menuId];

            votesRef.once('value').then(snapshot => {
                const votes = snapshot.val() || {};
                const voteUpdates = {};
                Object.entries(votes).forEach(([userId, vote]) => {
                    if (vote.menuId === menuId) {
                        voteUpdates[userId] = null;
                    }
                });
                if (Object.keys(voteUpdates).length > 0) {
                    return votesRef.update(voteUpdates);
                }
            }).catch(error => {
                showError('เกิดข้อผิดพลาดในการลบโหวตหลัก: ' + error.message);
            });

            additionalVotesRef.once('value').then(snapshot => {
                const additionalVotes = snapshot.val() || {};
                const additionalVoteUpdates = {};
                Object.entries(additionalVotes).forEach(([userId, userVotes]) => {
                    if (userVotes[menuId]) {
                        additionalVoteUpdates[`${userId}/${menuId}`] = null;
                    }
                });
                if (Object.keys(additionalVoteUpdates).length > 0) {
                    return additionalVotesRef.update(additionalVoteUpdates);
                }
            }).catch(error => {
                showError('เกิดข้อผิดพลาดในการลบโหวตเพิ่มเติม: ' + error.message);
            });

            if (selectedMenus.has(menuId)) {
                selectedMenus.delete(menuId);
            }

            updateCostDisplay();
            debouncedDisplayMenuItems();

            const totalItems = Array.from(selectedMenus.values()).reduce((sum, qty) => sum + qty, 0);
            const alreadyVotedElement = document.querySelector('#already-voted');
            if (totalItems > 0) {
                alreadyVotedElement.style.display = 'block';
                alreadyVotedElement.textContent = `คุณได้เลือก ${totalItems} รายการ`;
            } else {
                alreadyVotedElement.style.display = 'none';
            }
        })
        .catch(error => {
            showError('เกิดข้อผิดพลาดในการลบเมนู: ' + error.message);
        });
}

function saveMenuItem(menuId) {
    if (!isMenuActive) {
        showError('ไม่สามารถแก้ไขเมนูได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return;
    }

    const menuItem = document.querySelector(`.menu-item[data-menu-id="${menuId}"]`);
    const editInput = menuItem.querySelector('.edit-input');
    const editPriceInput = menuItem.querySelector('.edit-price-input');
    const editContainer = menuItem.querySelector('.edit-container');
    const label = menuItem.querySelector('.menu-label');
    
    const newName = editInput.value.trim();
    const newPrice = parseFloat(editPriceInput.value) || 20;
    
    if (!newName) {
        showConfirmationModal('ข้อผิดพลาด', 'กรุณากรอกชื่อเมนู', () => {});
        return;
    }
    
    if (newPrice < 0) {
        showConfirmationModal('ข้อผิดพลาด', 'ราคาต้องไม่เป็นค่าลบ', () => {});
        return;
    }

    firebase.database().ref(`/menus/${currentDate}/items/${menuId}`).update({
        name: newName,
        price: newPrice
    })
    .then(() => {
        menuItems[menuId].name = newName;
        menuItems[menuId].price = newPrice;
        label.textContent = newName;
        label.classList.remove('hidden');
        editContainer.classList.add('hidden');
        updateCostDisplay();
        updateVoteCosts(menuId, newPrice);
    })
    .catch(error => {
        showConfirmationModal('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแก้ไขเมนู: ' + error.message, () => {});
    });
}

function updateVoteCosts(menuId, newPrice) {
    const votesRef = firebase.database().ref(`/votes/${currentDate}`);
    const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}`);

    votesRef.once('value').then(snapshot => {
        const votes = snapshot.val() || {};
        const updates = {};
        Object.entries(votes).forEach(([userId, vote]) => {
            if (vote.menuId === menuId) {
                updates[`${userId}/cost`] = vote.quantity * newPrice;
            }
        });
        if (Object.keys(updates).length > 0) {
            return votesRef.update(updates);
        }
    }).catch(error => {
        // console.error('เกิดข้อผิดพลาดในการอัปเดต cost ใน votes:', error.message);
    });

    additionalVotesRef.once('value').then(snapshot => {
        const additionalVotes = snapshot.val() || {};
        const updates = {};
        Object.entries(additionalVotes).forEach(([userId, userVotes]) => {
            if (userVotes[menuId]) {
                updates[`${userId}/${menuId}/cost`] = userVotes[menuId].quantity * newPrice;
            }
        });
        if (Object.keys(updates).length > 0) {
            return additionalVotesRef.update(updates);
        }
    }).catch(error => {
        // console.error('เกิดข้อผิดพลาดในการอัปเดต cost ใน additional_votes:', error.message);
    });
}

function showError(message) {
    const errorMessage = document.querySelector('#error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const debouncedDisplayMenuItems = debounce(displayMenuItems, 100);