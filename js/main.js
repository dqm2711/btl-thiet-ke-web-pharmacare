function capNhatDongHo() {
    var dongHo = document.getElementById("clock-display");
    if (!dongHo) return;

    var bayGio = new Date();
    dongHo.innerText = bayGio.toLocaleTimeString() + " - " + bayGio.toLocaleDateString();
}

setInterval(capNhatDongHo, 1000);
capNhatDongHo();

var tenTrang = window.location.pathname.split("/").pop() || "index.html";
var menuLinks = document.querySelectorAll("nav a");

menuLinks.forEach(function(link) {
    if (link.getAttribute("href") === tenTrang) {
        link.classList.add("active");
    }
});