// В main.js или отдельный файл sync.js
function loadMenuFromAdminPanel() {
  const adminData = localStorage.getItem('admin_menu_sync');
  if (adminData) {
    const menuItems = JSON.parse(adminData);

    // Обновляем данные меню
    localStorage.setItem('brewAndCoCart', JSON.stringify(menuItems));

    // Обновляем UI
    if (window.menu && window.menu.menuItems) {
      window.menu.menuItems = menuItems;
      window.menu.filteredItems = [...menuItems];
      window.menu.renderMenu();
    }

    // Обновляем featured items на главной
    if (window.initFeaturedItems) {
      window.initFeaturedItems();
    }

    console.log('Menu updated from admin panel');
  }
}

// Проверяем обновления при загрузке
document.addEventListener('DOMContentLoaded', loadMenuFromAdminPanel);

// Или слушаем события обновлений
window.addEventListener('storage', (e) => {
  if (e.key === 'admin_menu_sync') {
    loadMenuFromAdminPanel();
  }
});