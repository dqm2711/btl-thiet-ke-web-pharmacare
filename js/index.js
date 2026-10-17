var dsMacDinh = [
    { ma: "TH01", ten: "Augmentin 1g", hanDung: "2026-10-25", ton: 12 },
    { ma: "TH02", ten: "Klacid 500mg", hanDung: "2026-11-02", ton: 8 },
    { ma: "TH03", ten: "Zinnat 500mg", hanDung: "2026-11-10", ton: 15 },
    { ma: "TH04", ten: "Panadol Extra", hanDung: "2027-05-20", ton: 120 },
    { ma: "TH05", ten: "Berberin Mộc Hương", hanDung: "2027-08-15", ton: 95 }
];

var dsBanChay = [
    { hang: "#1", ten: "Panadol Extra", quyCach: "Hộp 15 vỉ", ban: 145 },
    { hang: "#2", ten: "Paracetamol 500mg", quyCach: "Hộp 10 vỉ", ban: 112 },
    { hang: "#3", ten: "Berberin Mộc Hương", quyCach: "Lọ 100 viên", ban: 98 }
];

window.onload = function () {
    tinhToanDashboard();
    hienThiTopBanChay();
};

function tinhToanDashboard() {
    var dsThuoc = JSON.parse(localStorage.getItem("danhSachThuoc"));

    if (!dsThuoc || dsThuoc.length === 0) {
        dsThuoc = dsMacDinh;
        localStorage.setItem("danhSachThuoc", JSON.stringify(dsThuoc));
    }

    // 1. Cập nhật số liệu các Card
    document.getElementById("stat-tong-thuoc").innerText = dsThuoc.length + " loại";
    document.getElementById("stat-hoa-don").innerText = "28 đơn";
    document.getElementById("stat-doanh-thu").innerText = "4.650.000 đ";

    // 2. Quét tìm thuốc cận hạn (< 30 ngày) và nạp vào bảng
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

function hienThiTopBanChay() {
    var tbody = document.getElementById("tbody-ban-chay");
    tbody.innerHTML = "";
    for (var i = 0; i < dsBanChay.length; i++) {
        var item = dsBanChay[i];
        tbody.innerHTML += "<tr>" +
            "<td><strong>" + item.hang + "</strong></td>" +
            "<td>" + item.ten + "</td>" +
            "<td>" + item.quyCach + "</td>" +
            "<td>" + item.ban + " hộp</td>" +
        "</tr>";
    }
}