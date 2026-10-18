var dsMacDinh = [
    { ma: "TH01", ten: "Augmentin 1g", hanDung: "2026-10-25", ton: 12 },
    { ma: "TH02", ten: "Klacid 500mg", hanDung: "2026-11-02", ton: 8 },
    { ma: "TH03", ten: "Zinnat 500mg", hanDung: "2026-11-10", ton: 15 },
    { ma: "TH04", ten: "Panadol Extra", hanDung: "2027-05-20", ton: 120 },
    { ma: "TH05", ten: "Berberin Mộc Hương", hanDung: "2027-08-15", ton: 95 }
];

var dsHoaDonMacDinh = [
    { maHD: "HD01", thoiGian: "08:30" },
    { maHD: "HD02", thoiGian: "09:15" },
    { maHD: "HD03", thoiGian: "10:45" }
];

window.onload = function () {
    tinhToanDashboard();
};

function tinhToanDashboard() {
    var dsThuoc = JSON.parse(localStorage.getItem("danhSachThuoc"));
    if (!dsThuoc || dsThuoc.length === 0) {
        dsThuoc = dsMacDinh;
        localStorage.setItem("danhSachThuoc", JSON.stringify(dsThuoc));
    }
    document.getElementById("stat-tong-thuoc").innerText = dsThuoc.length + " loại";

    var dsHoaDon = JSON.parse(localStorage.getItem("danhSachHoaDon"));
    if (!dsHoaDon) {
        dsHoaDon = dsHoaDonMacDinh;
        localStorage.setItem("danhSachHoaDon", JSON.stringify(dsHoaDon));
    }
    document.getElementById("stat-hoa-don").innerText = dsHoaDon.length + " đơn";

    var homNay = new Date();
    var demCanHan = 0;
    var tbodyCanHan = document.getElementById("tbody-can-han");
    tbodyCanHan.innerHTML = "";

    for (var i = 0; i < dsThuoc.length; i++) {
        var thuoc = dsThuoc[i];
        var ngayHet = new Date(thuoc.hanDung);
        var soNgay = Math.ceil((ngayHet - homNay) / (1000 * 60 * 60 * 24));

        if (soNgay <= 30) {
            demCanHan++;
            tbodyCanHan.innerHTML += "<tr>" +
                "<td>" + thuoc.ma + "</td>" +
                "<td><strong>" + thuoc.ten + "</strong></td>" +
                "<td>" + thuoc.hanDung + "</td>" +
                "<td>" + thuoc.ton + " hộp</td>" +
                "<td class='status-urgent'>Còn " + soNgay + " ngày</td>" +
            "</tr>";
        }
    }
    document.getElementById("stat-can-han").innerText = demCanHan + " loại";
}

