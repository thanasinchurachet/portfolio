// Shared demo helpers: navbar dropdowns, like buttons, demo notices, chat FAB
(function () {
  function toggleDropdown(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var wasHidden = el.classList.contains('hidden');
    document.querySelectorAll('#notificationDropdown,#profileDropdown')
      .forEach(function (d) { d.classList.add('hidden'); });
    if (wasHidden) el.classList.remove('hidden');
  }
  window.toggleNotifications = function () { toggleDropdown('notificationDropdown'); };
  window.toggleProfile = function () { toggleDropdown('profileDropdown'); };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#notificationDropdown') && !e.target.closest('#profileDropdown')
        && !e.target.closest('[onclick*="toggle"]')) {
      document.querySelectorAll('#notificationDropdown,#profileDropdown')
        .forEach(function (d) { d.classList.add('hidden'); });
    }
  });

  // Like button toggle (demo)
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.like-button');
    if (!b) return;
    e.preventDefault();
    b.classList.toggle('active');
    var s = b.querySelector('.likes-count');
    if (s) {
      var n = parseInt(s.textContent, 10) || 0;
      s.textContent = b.classList.contains('active') ? n + 1 : Math.max(0, n - 1);
    }
  });

  // Elements with data-demo show a demo notice instead of real action
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-demo]');
    if (!b) return;
    e.preventDefault();
    if (window.Swal) {
      Swal.fire({
        icon: 'info',
        title: 'โหมดเดโม',
        text: b.getAttribute('data-demo') || 'ฟีเจอร์นี้เป็นเพียงตัวอย่างสำหรับเดโม',
        confirmButtonColor: '#10b981'
      });
    }
  });

  // Floating AI chat button (decorative demo)
  document.addEventListener('DOMContentLoaded', function () {
    var fab = document.createElement('button');
    fab.id = 'chatFab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'แชทกับ AI');
    fab.innerHTML = '<i class="fas fa-robot"></i>';
    fab.addEventListener('click', function () {
      if (window.Swal) {
        Swal.fire({
          icon: 'info',
          title: 'BinBuddy AI',
          text: 'นี่คือเดโมการแชทกับ AI — ในระบบจริงคุณสามารถถามเกี่ยวกับการจัดการขยะได้ที่นี่',
          confirmButtonColor: '#10b981'
        });
      }
    });
    document.body.appendChild(fab);
  });
})();
