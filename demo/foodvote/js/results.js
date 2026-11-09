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

let currentDate;
let userId;
let userName;
let userPictureUrl;
let today;
let menuItems = {};
let isAdmin = false;
let selectedMenuIds = {};
let previousVoterOrder = [];
let isMenuActive = false;

const backBtn = document.querySelector('#back-btn');
const refreshResultsBtn = document.querySelector('#refresh-results-btn');
const voterListContainer = document.querySelector('#voter-list');
const totalItemsElement = document.querySelector('#total-items');
const totalCostElement = document.querySelector('#total-cost');
const totalVotersElement = document.querySelector('#total-voters');
const resultsErrorElement = document.querySelector('#results-error');

function getTodayDate() {
    if (typeof luxon !== 'undefined') {
        return luxon.DateTime.now().setZone('Asia/Bangkok').toISODate();
    } else {
        const date = new Date();
        const offset = 7 * 60;
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

    const todayDate = getTodayDate();
    today = todayDate;

    const urlParams = new URLSearchParams(window.location.search);
    let urlDate = urlParams.get('date');
    if (urlDate && typeof luxon !== 'undefined') {
        urlDate = luxon.DateTime.fromISO(urlDate, { zone: 'Asia/Bangkok' }).toISODate();
    }
    currentDate = urlDate || todayDate;
    updateDateDisplay(currentDate);

    const summaryBtn = document.querySelector('#summary-btn');
    if (summaryBtn) {
        summaryBtn.href = `summary.html?date=${currentDate}`;
    }

    datePicker.max = todayDate;
    datePicker.value = currentDate;

    function updateNextButtonState() {
        nextDateBtn.disabled = currentDate === todayDate;
        nextDateBtn.classList.toggle('opacity-50', currentDate === todayDate);
        nextDateBtn.classList.toggle('cursor-not-allowed', currentDate === todayDate);
    }

    updateNextButtonState();

    prevDateBtn.addEventListener('click', () => {
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).minus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        datePicker.value = currentDate;
        updateDateDisplay(currentDate);
        loadResults();
        updateNextButtonState();
        if (summaryBtn) {
            summaryBtn.href = `summary.html?date=${currentDate}`;
        }
    });

    nextDateBtn.addEventListener('click', () => {
        if (currentDate === todayDate) return;
        const currentLuxonDate = luxon.DateTime.fromISO(currentDate).plus({ days: 1 });
        currentDate = currentLuxonDate.toISODate();
        datePicker.value = currentDate;
        updateDateDisplay(currentDate);
        loadResults();
        updateNextButtonState();
        if (summaryBtn) {
            summaryBtn.href = `summary.html?date=${currentDate}`;
        }
    });

    datePicker.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            currentDate = selectedDate;
            updateDateDisplay(currentDate);
            loadResults();
            updateNextButtonState();
            if (summaryBtn) {
                summaryBtn.href = `summary.html?date=${currentDate}`;
            }
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
    const infoBtn = document.querySelector('#info-btn');
    const infoTooltip = document.querySelector('#info-tooltip');
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    if (infoBtn && infoTooltip) {
        infoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            infoTooltip.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if (!infoBtn.contains(e.target) && !infoTooltip.contains(e.target)) {
                infoTooltip.classList.remove('show');
            }
        });
    } else {
        console.log('ไม่พบปุ่ม Info หรือ Tooltip');
    }

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
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: 'index.html' });
            return;
        }
        return liff.getProfile();
    })
    .then(profile => {
        if (!profile) {
            showError('ไม่สามารถดึงโปรไฟล์ผู้ใช้ได้');
            return;
        }
        
        userId = profile.userId;
        userName = profile.displayName;
        userPictureUrl = profile.pictureUrl;
        
        checkAdminPermission().then(() => {
            loadResults();
        });
    })
    .catch(error => {
        showError('เกิดข้อผิดพลาดในการเริ่มต้น LIFF: ' + error.message);
    });
}

function checkAdminPermission() {
    isAdmin = true;
    return Promise.resolve();
}

function loadResults() {
    voterListContainer.innerHTML = '<div class="loader"></div>';
    
    getMenuData()
    .then(() => {
        const votesRef = firebase.database().ref(`/votes/${currentDate}`);
        const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}`);
        
        firebase.database().ref('/groups').once('value')
        .then(groupsSnapshot => {
            const groups = groupsSnapshot.val() || {};
            const activeGroupIds = Object.keys(groups).filter(groupId => 
                groups[groupId].status === 'active'
            );
            
            if (activeGroupIds.length === 0) {
                showError('ขออภัยกลุ่มของคุณยังไม่ได้ลงทะเบียนกรุณาลงทะเบียนก่อน');
                voterListContainer.innerHTML = '<p class="text-center text-gray-500">ขออภัยกลุ่มของคุณยังไม่ได้ลงทะเบียนกรุณาลงทะเบียนก่อน</p>';
                return;
            }
            
            Promise.all(activeGroupIds.map(groupId => 
                firebase.database().ref(`/groups/${groupId}/users`).once('value')
            ))
            .then(groupSnapshots => {
                let groupUsers = {};
                groupSnapshots.forEach(snapshot => {
                    const users = snapshot.val() || {};
                    groupUsers = { ...groupUsers, ...users };
                });
                
                votesRef.on('value', (votesSnapshot) => {
                    const votes = votesSnapshot.val() || {};
                    
                    additionalVotesRef.on('value', (additionalVotesSnapshot) => {
                        const additionalVotes = additionalVotesSnapshot.val() || {};
                        displayResults(votes, additionalVotes, groupUsers);
                    }, (error) => {
                        showError('เกิดข้อผิดพลาดในการโหลดโหวตเพิ่มเติม: ' + error.message);
                    });
                }, (error) => {
                    showError('เกิดข้อผิดพลาดในการโหลดผลโหวต: ' + error.message);
                });
            })
            .catch(error => {
                showError('เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม: ' + error.message);
            });
        })
        .catch(error => {
            showError('เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม: ' + error.message);
        });
    })
    .catch(error => {
        if (error.message !== 'No menu data available') {
            showError('ขออภัยกลุ่มของคุณยังไม่ได้ลงทะเบียนกรุณาลงทะเบียนก่อน');
        }
    });
}

function getMenuData() {
    return firebase.database().ref('/groups').once('value')
    .then(groupsSnapshot => {
        const groups = groupsSnapshot.val() || {};
        const activeGroupIds = Object.keys(groups).filter(groupId => 
            groups[groupId].status === 'active'
        );
        
        if (activeGroupIds.length === 0) {
            throw new Error('No active groups found');
        }
        
        return Promise.all(activeGroupIds.map(groupId => 
            firebase.database().ref(`/groups/${groupId}/users`).once('value')
        ))
        .then(groupSnapshots => {
            let groupUsers = {};
            groupSnapshots.forEach(snapshot => {
                const users = snapshot.val() || {};
                groupUsers = { ...groupUsers, ...users };
            });
            
            totalVotersElement.textContent = `0/${Object.keys(groupUsers).length}`;

            return new Promise((resolve, reject) => {
                firebase.database().ref(`/menus/${currentDate}`).once('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && data.items) {
                        isMenuActive = data.status === 'active';
                        menuItems = Object.keys(data.items).reduce((acc, key) => {
                            if (data.items[key] && data.items[key].id) {
                                acc[data.items[key].id] = data.items[key];
                            }
                            return acc;
                        }, {});
                        resolve();
                    } else {
                        isMenuActive = false;
                        menuItems = {};
                        voterListContainer.innerHTML = `
                            <p class="text-center text-gray-500 py-4">
                                ยังไม่มีรายการเมนูอาหารสำหรับวันนี้ (${currentDate})
                            </p>
                        `;
                        totalItemsElement.textContent = 0;
                        totalCostElement.textContent = '0 บาท';
                        reject(new Error('No menu data available'));
                    }
                }, (error) => {
                    isMenuActive = false;
                    reject(error);
                });
            });
        });
    })
    .catch(error => {
        if (error.message !== 'No menu data available') {
            showError('เกิดข้อผิดพลาดในการดึงข้อมูลเมนูอาหาร: ' + error.message);
        }
        throw error;
    });
}

function displayResults(votes, additionalVotes, groupUsers) {
    let totalItems = 0;
    let totalCost = 0;
    const userVotes = {};

    Object.entries(votes).forEach(([userId, vote]) => {
        const userData = groupUsers[userId] || {};
        if (!userVotes[userId]) {
            const pictureUrl = userData.profile ? `${userData.profile}?t=${Date.now()}` : null;
            userVotes[userId] = { 
                items: {}, 
                total: 0, 
                name: userData.username || vote.userName || 'ไม่ทราบชื่อ',
                picture: pictureUrl
            };
        }
        
        const price = menuItems[vote.menuId]?.price || 20;
        const quantity = vote.quantity || 1;
        userVotes[userId].items[vote.menuId] = (userVotes[userId].items[vote.menuId] || 0) + quantity;
        userVotes[userId].total += quantity * price;
        totalItems += quantity;
        totalCost += quantity * price;
    });

    Object.entries(additionalVotes).forEach(([userId, userAdditionalVotes]) => {
        const userData = groupUsers[userId] || {};
        let userNameForAdditional = userData.username || 'ไม่ทราบชื่อ';

        Object.values(userAdditionalVotes).forEach(vote => {
            if (vote.userName) {
                userNameForAdditional = vote.userName;
            }
        });

        if (!userVotes[userId]) {
            const pictureUrl = userData.profile ? `${userData.profile}?t=${Date.now()}` : null;
            userVotes[userId] = { 
                items: {}, 
                total: 0, 
                name: userNameForAdditional,
                picture: pictureUrl
            };
        } else {
            if (userVotes[userId].name === 'ไม่ทราบชื่อ') {
                userVotes[userId].name = userNameForAdditional;
            }
        }
        
        Object.entries(userAdditionalVotes).forEach(([menuId, vote]) => {
            if (vote && vote.quantity && menuId !== 'userName') {
                const price = menuItems[menuId]?.price || 20;
                userVotes[userId].items[menuId] = (userVotes[userId].items[menuId] || 0) + vote.quantity;
                userVotes[userId].total += vote.quantity * price;
                totalItems += vote.quantity;
                totalCost += vote.quantity * price;
            }
        });
    });

    Object.entries(groupUsers).forEach(([userId, user]) => {
        if (!userVotes[userId]) {
            const pictureUrl = user.profile ? `${user.profile}?t=${Date.now()}` : null;
            userVotes[userId] = { 
                items: {}, 
                total: 0, 
                name: user.username || 'ไม่ทราบชื่อ',
                picture: pictureUrl
            };
        }
    });

    const totalGroupMembers = Object.keys(groupUsers).length;
    const totalVoters = Object.keys(userVotes).filter(userId => 
        Object.keys(userVotes[userId].items).length > 0
    ).length;

    totalItemsElement.textContent = totalItems;
    totalCostElement.textContent = `${totalCost} บาท`;
    totalVotersElement.textContent = `${totalVoters}/${totalGroupMembers}`;

    displayVoterDetails(userVotes);
}

function displayVoterDetails(userVotes) {
    const sortedVoters = Object.entries(userVotes)
        .sort((a, b) => b[1].total - a[1].total);
    
    if (sortedVoters.length === 0) {
        voterListContainer.innerHTML = '<p class="text-center text-gray-500">ไม่พบข้อมูลผู้โหวต</p>';
        previousVoterOrder = [];
        return;
    }
    
    if (Object.keys(menuItems).length === 0) {
        previousVoterOrder = [];
        return;
    }
    
    const oldPositions = {};
    const currentCards = voterListContainer.querySelectorAll('.vote-card');
    currentCards.forEach(card => {
        const userId = card.dataset.userId;
        if (userId) {
            oldPositions[userId] = card.getBoundingClientRect();
        }
    });

    let html = '';
    sortedVoters.forEach(([userId, data]) => {
        const itemCount = Object.values(data.items).reduce((sum, qty) => sum + qty, 0);
        const initials = data.name.charAt(0).toUpperCase();
        
        let menuListHtml = '';
        if (Object.keys(data.items).length > 0) {
            menuListHtml = Object.entries(data.items)
                .map(([menuId, qty]) => {
                    const menuName = menuItems[menuId]?.name || 'ไม่ทราบชื่อ';
                    return `<span class="inline-flex items-center bg-primary-light px-2 rounded-full text-sm mr-2 mb-2 respon">
                        ${menuName} <span class="ml-1 mb-2 text-xs font-semibold bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">${qty}</span>
                    </span>`;
                })
                .join('');
        } else {
            menuListHtml = '<span class="text-gray-500 text-sm">ยังไม่ได้โหวต</span>';
        }
        
        const menuOptions = Object.entries(menuItems)
            .filter(([menuId]) => menuId !== '0')
            .map(([menuId, item]) => {
                const quantity = data.items[menuId] || 0;
                const isSelected = selectedMenuIds[userId] === menuId ? 'selected' : '';
                return `<option value="${menuId}" data-quantity="${quantity}" ${isSelected}>${item.name}${quantity > 0 ? ` (${quantity})` : ''}</option>`;
            })
            .join('');

        const isToday = currentDate === getTodayDate();
        const adminControls = isAdmin && isToday && isMenuActive ? `
            <button class="toggle-vote-controls absolute top-2 right-2 text-primary hover:text-primary-dark focus:outline-none" data-user="${userId}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
            </button>
            <div class="vote-controls hidden mt-3" data-user="${userId}">
                <div class="flex items-center space-x-2">
                    <select class="vote-menu-select p-1 border rounded text-sm" data-user="${userId}">
                        ${menuOptions}
                    </select>
                    <div class="vote-buttons">
                        <button class="decrease-vote bg-gray-200 text-gray-700 w-10 h-10 rounded-full text-lg font-bold" data-user="${userId}">-</button>
                        <span class="vote-quantity text-center" data-user="${userId}">${data.items[selectedMenuIds[userId] || Object.keys(menuItems).find(id => id !== '0')] || 0}</span>
                        <button class="increase-vote bg-gray-200 text-gray-700 w-10 h-10 rounded-full text-lg font-bold" data-user="${userId}">+</button>
                    </div>
                </div>
            </div>
        ` : '';

        const profileDisplay = data.picture 
            ? `<img src="${data.picture}" alt="${data.name}" class="h-12 rounded-full object-cover" onerror="console.error('Failed to load image for ${data.name}: ${data.picture}');this.style.display='none';this.nextSibling.style.display='flex';">`
            : '';
        const fallbackDisplay = `<div class="initials-circle w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-gray-600 text-lg font-medium" style="display: ${data.picture ? 'none' : 'flex'}">${initials}</div>`;
        
        html += `
        <div class="vote-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative" data-user-id="${userId}">
            <div class="flex items-center space-x-4">
                ${profileDisplay}
                ${fallbackDisplay}
                <div class="flex-1">
                    <h3 class="font-medium">${data.name}</h3>
                    <div class="flex flex-wrap items-center text-sm text-gray-600">
                        <span class="mr-3">รายการ: ${itemCount}</span>
                        <span>รวม: ${data.total} บาท</span>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap">
                ${menuListHtml}
            </div>
            ${adminControls}
        </div>
        `;
    });
    
    voterListContainer.innerHTML = html;

    const newCards = voterListContainer.querySelectorAll('.vote-card');
    newCards.forEach(card => {
        const userId = card.dataset.userId;
        const oldPos = oldPositions[userId];
        if (oldPos) {
            const newPos = card.getBoundingClientRect();
            const deltaY = oldPos.top - newPos.top;
            
            if (deltaY !== 0) {
                card.style.transition = 'none';
                card.style.transform = `translateY(${deltaY}px)`;
                card.style.opacity = '0.7';
                
                card.offsetHeight;
                
                card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                card.style.transform = 'translateY(0)';
                card.style.opacity = '1';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease';
                    card.style.transform = '';
                    card.style.opacity = '';
                }, 300);
            }
        }
    });
    
    previousVoterOrder = sortedVoters.map(([userId]) => userId);
    
    if (isAdmin && currentDate === getTodayDate() && isMenuActive) {
        voterListContainer.querySelectorAll('.toggle-vote-controls').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('.toggle-vote-controls').dataset.user;
                const voteControls = voterListContainer.querySelector(`.vote-controls[data-user="${userId}"]`);
                voteControls.classList.toggle('hidden');
                const svg = btn.querySelector('svg');
                if (voteControls.classList.contains('hidden')) {
                    svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`;
                } else {
                    svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
                }
            });
        });

        voterListContainer.querySelectorAll('.increase-vote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.user;
                const menuSelect = e.target.parentElement.parentElement.querySelector('.vote-menu-select');
                const menuId = menuSelect.value;
                selectedMenuIds[userId] = menuId;
                modifyUserVote(userId, 1, menuId);
            });
        });

        voterListContainer.querySelectorAll('.decrease-vote').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.user;
                const menuSelect = e.target.parentElement.parentElement.querySelector('.vote-menu-select');
                const menuId = menuSelect.value;
                selectedMenuIds[userId] = menuId;
                modifyUserVote(userId, -1, menuId);
            });
        });

        voterListContainer.querySelectorAll('.vote-menu-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const userId = e.target.dataset.user;
                const menuId = e.target.value;
                selectedMenuIds[userId] = menuId;
                const voteQuantity = voterListContainer.querySelector(`.vote-quantity[data-user="${userId}"]`);
                const quantity = e.target.selectedOptions[0].dataset.quantity || 0;
                voteQuantity.textContent = quantity;
            });
        });
    }
}

function modifyUserVote(userId, change, menuId) {
    if (!isMenuActive) {
        showError('ไม่สามารถแก้ไขโหวตได้ เนื่องจากเมนูอยู่ในสถานะ inactive');
        return;
    }

    if (currentDate !== getTodayDate()) {
        showError('ไม่สามารถแก้ไขโหวตในวันย้อนหลังได้');
        return;
    }

    const votesRef = firebase.database().ref(`/votes/${currentDate}/${userId}`);
    const additionalVotesRef = firebase.database().ref(`/additional_votes/${currentDate}/${userId}`);
    
    Promise.all([
        votesRef.once('value'),
        additionalVotesRef.once('value')
    ]).then(([voteSnapshot, additionalVoteSnapshot]) => {
        let currentVote = voteSnapshot.val() || null;
        let additionalVotes = additionalVoteSnapshot.val() || {};
        
        let currentQuantity = 0;
        if (currentVote && currentVote.menuId === menuId) {
            currentQuantity += currentVote.quantity || 1;
        }
        if (additionalVotes[menuId]) {
            currentQuantity += additionalVotes[menuId].quantity || 0;
        }
        
        const newQuantity = Math.max(0, currentQuantity + change);
        
        const price = menuItems[menuId]?.price || 20;
        const updates = {};
        
        if (newQuantity === 0) {
            if (currentVote && currentVote.menuId === menuId) {
                updates[`/votes/${currentDate}/${userId}`] = null;
            }
            if (additionalVotes[menuId]) {
                updates[`/additional_votes/${currentDate}/${userId}/${menuId}`] = null;
            }
        } else {
            let firstVoteProcessed = false;
            
            if (currentVote && currentVote.menuId === menuId) {
                if (newQuantity >= 1) {
                    updates[`/votes/${currentDate}/${userId}`] = {
                        menuId: menuId,
                        quantity: 1,
                        cost: price,
                        userName: additionalVotes.userName || userName || 'ไม่ทราบชื่อ',
                        userPictureUrl: additionalVotes.userPictureUrl || userPictureUrl || ''
                    };
                    firstVoteProcessed = true;
                } else {
                    updates[`/votes/${currentDate}/${userId}`] = null;
                }
            } else if (!currentVote && newQuantity >= 1) {
                updates[`/votes/${currentDate}/${userId}`] = {
                    menuId: menuId,
                    quantity: 1,
                    cost: price,
                    userName: additionalVotes.userName || userName || 'ไม่ทราบชื่อ',
                    userPictureUrl: additionalVotes.userPictureUrl || userPictureUrl || ''
                };
                firstVoteProcessed = true;
            }
            
            if (newQuantity > 1) {
                updates[`/additional_votes/${currentDate}/${userId}/${menuId}`] = {
                    quantity: newQuantity - 1,
                    cost: (newQuantity - 1) * price,
                    userName: additionalVotes.userName || userName || 'ไม่ทราบชื่อ',
                    userPictureUrl: additionalVotes.userPictureUrl || userPictureUrl || ''
                };
            } else if (additionalVotes[menuId]) {
                updates[`/additional_votes/${currentDate}/${userId}/${menuId}`] = null;
            }
        }
        
        if (Object.keys(updates).length > 0) {
            firebase.database().ref().update(updates)
                .then(() => {
                    const voteQuantity = voterListContainer.querySelector(`.vote-quantity[data-user="${userId}"]`);
                    if (voteQuantity) {
                        voteQuantity.textContent = newQuantity;
                    }
                })
                .catch(error => {
                    showError('เกิดข้อผิดพลาดในการอัปเดตโหวต: ' + error.message);
                });
        }
    }).catch(error => {
        showError('เกิดข้อผิดพลาดในการดึงข้อมูลโหวต: ' + error.message);
    });
}

function showError(message) {
    if (resultsErrorElement) {
        resultsErrorElement.textContent = message;
        resultsErrorElement.style.display = 'block';
        setTimeout(() => {
            resultsErrorElement.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}