function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    const overlay = document.getElementById("menuOverlay");

    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}
