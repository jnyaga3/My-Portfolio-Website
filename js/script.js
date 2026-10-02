// =========================================
// MOBILE NAVIGATION
// =========================================

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});


// =========================================
// CLOSE MOBILE MENU AFTER CLICKING A LINK
// =========================================

const navigationLinks = document.querySelectorAll(".nav-links a");

navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});


// =========================================
// NAVIGATION SHADOW ON SCROLL
// =========================================

const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 20) {
        header.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.25)";
    } else {
        header.style.boxShadow = "none";
    }

});