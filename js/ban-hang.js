const thuoc = [
    { id: 1, ten: "Paracetamol 500mg", gia: 1500 },
    { id: 2, ten: "Vitamin C 500mg", gia: 2000 },
    { id: 3, ten: "Oresol", gia: 5000 },
    { id: 4, ten: "Dau gio", gia: 18000 },
    { id: 5, ten: "Bang ca nhan", gia: 3000 }
];

let hoaDon = [];

function lay(id) {
    return document.getElementById(id);
}

function dinhDangTien(so) {
    return so.toLocaleString("vi-VN") + " ₫";
}

function timThuoc(id) {
    for (let i = 0; i < thuoc.length; i++) {
        if (thuoc[i].id == id) {
            return thuoc[i];
        }
    }
    return null;
}

for (let i = 0; i < thuoc.length; i++) {
    let luaChon = document.createElement("option");
    luaChon.value = thuoc[i].id;
    luaChon.textContent = thuoc[i].ten;
    lay("medicine-select").appendChild(luaChon);
}

function hienGia() {
    let item = timThuoc(lay("medicine-select").value);
    if (item) {
        lay("medicine-price").textContent = dinhDangTien(item.gia);
    } else {
        lay("medicine-price").textContent = "0 ₫";
    }
}

function hienHoaDon() {
    let bang = lay("invoice-items");
    bang.innerHTML = "";
    let tong = 0;

    if (hoaDon.length == 0) {
        bang.innerHTML = '<tr><td colspan="5" class="bh-empty">Chua co thuoc trong hoa don</td></tr>';
    }

    for (let i = 0; i < hoaDon.length; i++) {
        let item = hoaDon[i];
        let thanhTien = item.gia * item.soLuong;
        tong += thanhTien;

        let dong = bang.insertRow();
        dong.insertCell().textContent = item.ten;
        dong.insertCell().textContent = item.soLuong;
        dong.insertCell().textContent = dinhDangTien(item.gia);
        dong.insertCell().textContent = dinhDangTien(thanhTien);

        let oXoa = dong.insertCell();
        oXoa.className = "bh-no-print";
        let nutXoa = document.createElement("button");
        nutXoa.textContent = "Xoa";
        nutXoa.className = "bh-delete";
        nutXoa.onclick = function () {
            hoaDon.splice(i, 1);
            hienHoaDon();
        };
        oXoa.appendChild(nutXoa);
    }

    lay("invoice-total").textContent = dinhDangTien(tong);
    lay("invoice-customer").textContent = lay("customer-name").value || "Chua nhap";
    lay("invoice-phone").textContent = lay("customer-phone").value || "Chua nhap";
}

function themThuoc() {
    let item = timThuoc(lay("medicine-select").value);
    let soLuong = Number(lay("medicine-quantity").value);

    if (!item) {
        lay("form-message").textContent = "Hay chon thuoc.";
        return;
    }
    if (soLuong < 1 || soLuong % 1 != 0) {
        lay("form-message").textContent = "So luong phai la so nguyen tu 1 tro len.";
        return;
    }

    let daCo = false;
    for (let i = 0; i < hoaDon.length; i++) {
        if (hoaDon[i].id == item.id) {
            hoaDon[i].soLuong += soLuong;
            daCo = true;
        }
    }

    if (!daCo) {
        hoaDon.push({
            id: item.id,
            ten: item.ten,
            gia: item.gia,
            soLuong: soLuong
        });
    }

    lay("form-message").textContent = "Da them thuoc.";
    hienHoaDon();
}

function lamMoi() {
    if (confirm("Ban co muon xoa hoa don khong?")) {
        hoaDon = [];
        lay("customer-form").reset();
        lay("medicine-quantity").value = 1;
        lay("form-message").textContent = "";
        lay("invoice-message").textContent = "";
        lay("invoice-message").className = "bh-message bh-no-print";
        hienGia();
        hienHoaDon();
    }
}

lay("medicine-select").onchange = hienGia;
lay("add-medicine").onclick = themThuoc;
lay("customer-name").oninput = hienHoaDon;
lay("customer-phone").oninput = hienHoaDon;
lay("reset-invoice").onclick = lamMoi;

lay("print-invoice").onclick = function () {
    if (hoaDon.length == 0) {
        lay("invoice-message").textContent = "Hay them thuoc truoc khi in.";
    } else {
        window.print();
    }
};

lay("confirm-sale").onclick = function () {
    let ten = lay("customer-name").value.trim();
    let sdt = lay("customer-phone").value.trim();

    if (ten == "") {
        lay("invoice-message").textContent = "Hay nhap ten khach hang.";
    } else if (!/^\d{10}$/.test(sdt)) {
        lay("invoice-message").textContent = "So dien thoai phai co 10 chu so.";
    } else if (hoaDon.length == 0) {
        lay("invoice-message").textContent = "Hay them thuoc vao hoa don.";
    } else {
        lay("invoice-message").className = "bh-message bh-no-print success";
        lay("invoice-message").textContent = "Thong tin hop le. Day la ban demo.";
    }
};

lay("invoice-date").textContent = new Date().toLocaleDateString("vi-VN");
hienGia();
hienHoaDon();


var dsHD = JSON.parse(localStorage.getItem("danhSachHoaDon")) || [];

dsHD.push({
    maHD: "HD" + (dsHD.length + 1),
    thoiGian: new Date().toLocaleTimeString()
});

localStorage.setItem("danhSachHoaDon", JSON.stringify(dsHD));