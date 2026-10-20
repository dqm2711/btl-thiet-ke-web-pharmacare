(function () {
    "use strict";

    // ---------- Cấu hình khóa localStorage (tiền tố riêng) ----------
    var STORAGE_PREFIX = "nhapkho_";
    var KEY_THUOC = STORAGE_PREFIX + "thuoc";        // Danh mục thuốc của chức năng nhập kho
    var KEY_PHIEU = STORAGE_PREFIX + "phieu";        // Lịch sử phiếu nhập
    var KEY_CHI_TIET = STORAGE_PREFIX + "chitiet";   // Chi tiết từng phiếu

    // Định dạng tiền VND
    var fmtTien = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

    // ---------- Trạng thái phiếu đang soạn ----------
    var state = {
        maPhieu: "",
        ngay: "",
        nhaCungCap: "",
        nguoiNhap: "",
        ghiChu: "",
        lines: [] // {ma, ten, donVi, soLuong, donGia, thanhTien}
    };

    // ---------- DOM elements ----------
    var els = {};
    function getEls() {
        els = {
            maPhieu: document.getElementById("ma-phieu"),
            ngayNhap: document.getElementById("ngay-nhap"),
            nhaCungCap: document.getElementById("nha-cung-cap"),
            nguoiNhap: document.getElementById("nguoi-nhap"),
            ghiChu: document.getElementById("ghi-chu"),
            errNgay: document.getElementById("err-ngay"),
            errNcc: document.getElementById("err-ncc"),
            errNguoi: document.getElementById("err-nguoi"),
            chonThuoc: document.getElementById("chon-thuoc"),
            btnTaoMoi: document.getElementById("btn-tao-moi"),
            rowThuocMoi: document.getElementById("row-thuoc-moi"),
            thuocMa: document.getElementById("thuoc-ma"),
            thuocTen: document.getElementById("thuoc-ten"),
            thuocDonVi: document.getElementById("thuoc-donvi"),
            thuocSoLuong: document.getElementById("thuoc-soluong"),
            thuocGia: document.getElementById("thuoc-gia"),
            thuocThanhTien: document.getElementById("thuoc-thanhtien"),
            errMa: document.getElementById("err-ma"),
            errTen: document.getElementById("err-ten"),
            errDonVi: document.getElementById("err-donvi"),
            errSoLuong: document.getElementById("err-soluong"),
            errGia: document.getElementById("err-gia"),
            formThuoc: document.getElementById("form-thuoc"),
            btnThemThuoc: document.getElementById("btn-them-thuoc"),
            tbodyChiTiet: document.getElementById("tbody-chitiet"),
            errRong: document.getElementById("err-rong"),
            tongMatHang: document.getElementById("tong-mat-hang"),
            tongSoLuong: document.getElementById("tong-so-luong"),
            tongTien: document.getElementById("tong-tien"),
            btnLuu: document.getElementById("btn-luu"),
            btnLamMoi: document.getElementById("btn-lam-moi"),
            btnIn: document.getElementById("btn-in"),
            btnHuy: document.getElementById("btn-huy"),
            thongBao: document.getElementById("thong-bao"),
            timKiem: document.getElementById("tim-kiem"),
            locTu: document.getElementById("loc-tu"),
            locDen: document.getElementById("loc-den"),
            btnLoc: document.getElementById("btn-loc"),
            btnLocReset: document.getElementById("btn-loc-reset"),
            tbodyLichSu: document.getElementById("tbody-lich-su"),
            errLichSu: document.getElementById("err-lich-su"),
            // Modal
            modal: document.getElementById("modal-chitiet"),
            mctMaPhieu: document.getElementById("mct-ma-phieu"),
            mctNgay: document.getElementById("mct-ngay"),
            mctNcc: document.getElementById("mct-ncc"),
            mctNguoi: document.getElementById("mct-nguoi"),
            mctGhiChu: document.getElementById("mct-ghichu"),
            mctTbody: document.getElementById("mct-tbody"),
            mctTongTien: document.getElementById("mct-tong-tien"),
            btnDongModal: document.getElementById("btn-dong-modal"),
            btnDongModal2: document.getElementById("btn-dong-modal2"),
            btnInPhieu: document.getElementById("btn-in-phieu"),
            // In
            piMaPhieu: document.getElementById("pi-ma-phieu"),
            piNgay: document.getElementById("pi-ngay"),
            piNcc: document.getElementById("pi-ncc"),
            piNguoi: document.getElementById("pi-nguoi"),
            piGhiChu: document.getElementById("pi-ghichu"),
            piTbody: document.getElementById("pi-tbody"),
            piTongSoLuong: document.getElementById("pi-tong-soluong"),
            piTongTien: document.getElementById("pi-tong-tien")
        };
    }

    // ---------- localStorage helpers ----------
    function storageAvailable(type) {
        try {
            var storage = window[type];
            var x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    }

    function lsGet(key, def) {
        if (!storageAvailable("localStorage")) return def;
        try {
            var raw = localStorage.getItem(key);
            if (raw === null || raw === undefined) return def;
            var val = JSON.parse(raw);
            return val === null || val === undefined ? def : val;
        } catch (e) {
            // Dữ liệu hỏng
            return def;
        }
    }

    function lsSet(key, value) {
        if (!storageAvailable("localStorage")) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    // ---------- Dữ liệu ----------
    function layThuocCu() {
        // Đọc danh mục thuốc hiện có của website (key danhSachThuoc), chỉ đọc, không ghi
        var ds = lsGet("danhSachThuoc", []);
        if (!Array.isArray(ds)) return [];
        return ds;
    }

    function layDanhMucThuoc() {
        var ds = lsGet(KEY_THUOC, null);
        if (!Array.isArray(ds) || ds.length === 0) {
            // Seed từ dữ liệu cũ nếu chưa có
            var cu = layThuocCu();
            ds = cu.map(function (t) {
                return {
                    ma: String(t.ma || ""),
                    ten: String(t.ten || ""),
                    donVi: String(t.donVi || "hộp"),
                    ton: parseInt(t.ton, 10) || 0,
                    giaNhap: parseInt(t.giaNhap, 10) || 0
                };
            }).filter(function (t) { return t.ma && t.ten; });
            lsSet(KEY_THUOC, ds);
        }
        return ds;
    }

    function luuDanhMucThuoc(ds) {
        lsSet(KEY_THUOC, ds);
    }

    function timThuocTheoMa(ds, ma) {
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].ma === ma) return ds[i];
        }
        return null;
    }

    function layLichSu() {
        var ds = lsGet(KEY_PHIEU, []);
        return Array.isArray(ds) ? ds : [];
    }

    function luuLichSu(ds) {
        lsSet(KEY_PHIEU, ds);
    }

    function layChiTiet() {
        var obj = lsGet(KEY_CHI_TIET, {});
        return obj && typeof obj === "object" ? obj : {};
    }

    function luuChiTiet(obj) {
        lsSet(KEY_CHI_TIET, obj);
    }

    // ---------- Mã phiếu ----------
    function taoMaPhieu() {
        var lichSu = layLichSu();
        var so = 1;
        var ma;
        do {
            ma = "NK" + String(so).padStart(4, "0");
            so++;
        } while (lichSu.some(function (p) { return p.maPhieu === ma; }));
        return ma;
    }

    // ---------- Tính tiền ----------
    function toSoNguyen(val) {
        var n = parseFloat(String(val).replace(/[^0-9.,-]/g, "").replace(",", "."));
        if (isNaN(n)) return 0;
        return Math.round(n);
    }

    function tinhTong(lines) {
        var tongTien = 0;
        var tongSL = 0;
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            var sl = parseInt(l.soLuong, 10) || 0;
            var gia = parseInt(l.donGia, 10) || 0;
            if (sl < 0) sl = 0;
            if (gia < 0) gia = 0;
            l.soLuong = sl;
            l.donGia = gia;
            l.thanhTien = sl * gia;
            tongSL += sl;
            tongTien += l.thanhTien;
        }
        return { tongSL: tongSL, tongTien: tongTien, soMatHang: lines.length };
    }

    function formatTien(n) {
        return fmtTien.format(n || 0);
    }

    // ---------- Khởi tạo ----------
    function khoiTaoNgay() {
        var now = new Date();
        var yyyy = now.getFullYear();
        var mm = String(now.getMonth() + 1).padStart(2, "0");
        var dd = String(now.getDate()).padStart(2, "0");
        var val = yyyy + "-" + mm + "-" + dd;
        els.ngayNhap.value = val;
        state.ngay = val;
    }

    function hienThiThongBao(msg, loai) {
        if (!els.thongBao) return;
        els.thongBao.textContent = msg;
        els.thongBao.className = "nhapkho-thongbao";
        if (loai === "success") els.thongBao.classList.add("nhapkho-thongbao-success");
        if (loai === "error") els.thongBao.classList.add("nhapkho-thongbao-error");
        setTimeout(function () {
            els.thongBao.style.display = "none";
            els.thongBao.className = "nhapkho-thongbao";
        }, 5000);
    }

    function anThongBao() {
        if (els.thongBao) els.thongBao.style.display = "none";
    }

    // ---------- Render dropdown thuốc ----------
    function renderChonThuoc() {
        var ds = layDanhMucThuoc();
        var sel = els.chonThuoc;
        // Giữ lựa chọn hiện tại
        var hienTai = sel.value;
        // Xóa các option cũ trừ option đầu
        while (sel.options.length > 1) {
            sel.remove(1);
        }
        for (var i = 0; i < ds.length; i++) {
            var opt = document.createElement("option");
            opt.value = ds[i].ma;
            opt.textContent = ds[i].ma + " - " + ds[i].ten + " (tồn: " + ds[i].ton + ")";
            sel.appendChild(opt);
        }
        if (hienTai) sel.value = hienTai;
    }

    function chonThuoc() {
        var ma = els.chonThuoc.value;
        if (!ma) return;
        var ds = layDanhMucThuoc();
        var t = timThuocTheoMa(ds, ma);
        if (!t) return;
        els.thuocMa.value = t.ma;
        els.thuocTen.value = t.ten;
        els.thuocDonVi.value = t.donVi;
        els.rowThuocMoi.style.display = "none";
        els.thuocSoLuong.focus();
        capNhatThanhTienLine();
    }

    function toggleThuocMoi() {
        var chon = els.chonThuoc.value;
        if (chon === "") {
            els.rowThuocMoi.style.display = "flex";
            els.thuocMa.value = "";
            els.thuocTen.value = "";
            els.thuocDonVi.value = "";
            els.thuocMa.focus();
        } else {
            els.rowThuocMoi.style.display = "none";
            chonThuoc();
        }
    }

    // ---------- Line validation ----------
    function validateLine() {
        var ok = true;
        [els.errMa, els.errTen, els.errDonVi, els.errSoLuong, els.errGia].forEach(function (e) { e.textContent = ""; });

        var ma = els.thuocMa.value.trim();
        var ten = els.thuocTen.value.trim();
        var donVi = els.thuocDonVi.value.trim();
        var sl = parseInt(els.thuocSoLuong.value, 10);
        var gia = toSoNguyen(els.thuocGia.value);

        if (!ma) { els.errMa.textContent = "Vui lòng nhập mã thuốc."; ok = false; }
        if (!ten) { els.errTen.textContent = "Vui lòng nhập tên thuốc."; ok = false; }
        if (!donVi) { els.errDonVi.textContent = "Vui lòng nhập đơn vị tính."; ok = false; }
        if (isNaN(sl) || sl <= 0) { els.errSoLuong.textContent = "Số lượng phải lớn hơn 0."; ok = false; }
        if (isNaN(gia) || gia < 0) { els.errGia.textContent = "Giá nhập không được âm."; ok = false; }

        // Kiểm tra trùng mã trong phiếu hiện tại (khi thêm thuốc mới)
        if (ma && state.lines.some(function (l) { return l.ma === ma; })) {
            els.errMa.textContent = "Mã thuốc đã có trong phiếu.";
            ok = false;
        }

        return ok;
    }

    function capNhatThanhTienLine() {
        var sl = parseInt(els.thuocSoLuong.value, 10) || 0;
        var gia = toSoNguyen(els.thuocGia.value);
        if (sl < 0) sl = 0;
        if (gia < 0) gia = 0;
        els.thuocSoLuong.value = sl;
        els.thuocGia.value = gia;
        els.thuocThanhTien.value = formatTien(sl * gia);
    }

    // ---------- Render bảng chi tiết ----------
    function renderChiTiet() {
        var tbody = els.tbodyChiTiet;
        tbody.textContent = "";
        var tong = tinhTong(state.lines);

        if (state.lines.length === 0) {
            els.errRong.style.display = "block";
        } else {
            els.errRong.style.display = "none";
            for (var i = 0; i < state.lines.length; i++) {
                var l = state.lines[i];
                var tr = document.createElement("tr");

                var tdStt = document.createElement("td");
                tdStt.textContent = i + 1;
                tr.appendChild(tdStt);

                var tdMa = document.createElement("td");
                tdMa.textContent = l.ma;
                tr.appendChild(tdMa);

                var tdTen = document.createElement("td");
                tdTen.textContent = l.ten;
                tr.appendChild(tdTen);

                var tdDv = document.createElement("td");
                tdDv.textContent = l.donVi;
                tr.appendChild(tdDv);

                var tdSl = document.createElement("td");
                tdSl.textContent = l.soLuong;
                tr.appendChild(tdSl);

                var tdGia = document.createElement("td");
                tdGia.textContent = formatTien(l.donGia);
                tr.appendChild(tdGia);

                var tdTt = document.createElement("td");
                tdTt.textContent = formatTien(l.thanhTien);
                tr.appendChild(tdTt);

                var tdAction = document.createElement("td");
                // Nút sửa
                var btnSua = document.createElement("button");
                btnSua.type = "button";
                btnSua.textContent = "Sửa";
                btnSua.className = "nhapkho-btn nhapkho-btn-outline";
                btnSua.style.fontSize = "12px";
                btnSua.style.padding = "5px 10px";
                btnSua.addEventListener("click", (function (idx) { return function () { suaLine(idx); }; })(i));
                tdAction.appendChild(btnSua);

                var btnXoa = document.createElement("button");
                btnXoa.type = "button";
                btnXoa.textContent = "Xóa";
                btnXoa.className = "nhapkho-btn nhapkho-btn-danger";
                btnXoa.style.fontSize = "12px";
                btnXoa.style.padding = "5px 10px";
                btnXoa.style.marginLeft = "6px";
                btnXoa.addEventListener("click", (function (idx) { return function () { xoaLine(idx); }; })(i));
                tdAction.appendChild(btnXoa);

                tr.appendChild(tdAction);
                tbody.appendChild(tr);
            }
        }

        els.tongMatHang.textContent = tong.soMatHang;
        els.tongSoLuong.textContent = tong.tongSL;
        els.tongTien.textContent = formatTien(tong.tongTien);
    }

    function themLine() {
        anThongBao();
        if (!validateLine()) return;

        var ma = els.thuocMa.value.trim();
        var ten = els.thuocTen.value.trim();
        var donVi = els.thuocDonVi.value.trim();
        var sl = parseInt(els.thuocSoLuong.value, 10);
        var gia = toSoNguyen(els.thuocGia.value);

        state.lines.push({
            ma: ma,
            ten: ten,
            donVi: donVi,
            soLuong: sl,
            donGia: gia,
            thanhTien: sl * gia
        });

        // Reset form thuốc
        els.chonThuoc.value = "";
        els.thuocMa.value = "";
        els.thuocTen.value = "";
        els.thuocDonVi.value = "";
        els.thuocSoLuong.value = "";
        els.thuocGia.value = "";
        els.thuocThanhTien.value = "";
        els.rowThuocMoi.style.display = "none";

        renderChiTiet();
        hienThiThongBao("Đã thêm thuốc vào phiếu.", "success");
    }

    function suaLine(idx) {
        var l = state.lines[idx];
        if (!l) return;
        var slMoi = prompt("Số lượng mới cho " + l.ten + ":", l.soLuong);
        if (slMoi === null) return;
        var sl = parseInt(slMoi, 10);
        if (isNaN(sl) || sl <= 0) {
            alert("Số lượng không hợp lệ.");
            return;
        }
        var giaMoi = prompt("Giá nhập mới (đ):", l.donGia);
        if (giaMoi === null) return;
        var gia = toSoNguyen(giaMoi);
        if (gia < 0) {
            alert("Giá nhập không được âm.");
            return;
        }
        state.lines[idx].soLuong = sl;
        state.lines[idx].donGia = gia;
        state.lines[idx].thanhTien = sl * gia;
        renderChiTiet();
    }

    function xoaLine(idx) {
        var l = state.lines[idx];
        if (!l) return;
        if (!confirm("Xóa thuốc \"" + l.ten + "\" khỏi phiếu?")) return;
        state.lines.splice(idx, 1);
        renderChiTiet();
    }

    // ---------- Làm mới / Hủy phiếu ----------
    function lamMoiPhieu() {
        if (state.lines.length > 0 || els.nhaCungCap.value.trim() || els.nguoiNhap.value.trim() || els.ghiChu.value.trim()) {
            if (!confirm("Làm mới sẽ xóa toàn bộ dữ liệu đang soạn. Bạn chắc chắn?")) return;
        }
        state.lines = [];
        state.maPhieu = taoMaPhieu();
        state.ngay = els.ngayNhap.value;
        state.nhaCungCap = "";
        state.nguoiNhap = "";
        state.ghiChu = "";

        els.maPhieu.value = state.maPhieu;
        els.nhaCungCap.value = "";
        els.nguoiNhap.value = "";
        els.ghiChu.value = "";
        renderChiTiet();
        anThongBao();
        hienThiThongBao("Đã làm mới phiếu. Mã phiếu: " + state.maPhieu, "success");
    }

    function huyPhieu() {
        if (state.lines.length === 0 && !els.nhaCungCap.value.trim() && !els.nguoiNhap.value.trim() && !els.ghiChu.value.trim()) {
            return;
        }
        if (!confirm("Hủy phiếu sẽ xóa dữ liệu đang soạn. Bạn chắc chắn?")) return;
        lamMoiPhieu();
    }

    // ---------- Kiểm tra ngày ----------
    function validateNgay() {
        els.errNgay.textContent = "";
        var val = els.ngayNhap.value.trim();
        if (!val) {
            els.errNgay.textContent = "Vui lòng chọn ngày nhập.";
            return false;
        }
        var d = new Date(val + "T00:00:00");
        if (isNaN(d.getTime())) {
            els.errNgay.textContent = "Ngày nhập không hợp lệ.";
            return false;
        }
        // Kiểm tra ngày tồn tại thực sự (tránh ngày như 2024-02-30 được chuyển)
        var parts = val.split("-");
        if (d.getFullYear() != parts[0] || d.getMonth() + 1 != parts[1] || d.getDate() != parts[2]) {
            els.errNgay.textContent = "Ngày nhập không tồn tại.";
            return false;
        }
        var homNay = new Date();
        homNay.setHours(0, 0, 0, 0);
        if (d > homNay) {
            els.errNgay.textContent = "Không được nhập ngày trong tương lai.";
            return false;
        }
        state.ngay = val;
        return true;
    }

    // ---------- Lưu phiếu ----------
    var isSaving = false;

    function luuPhieu() {
        anThongBao();
        if (isSaving) {
            hienThiThongBao("Đang lưu phiếu, vui lòng đợi...", "error");
            return;
        }

        // 1. Kiểm tra thông tin phiếu
        if (!validateNgay()) {
            els.ngayNhap.focus();
            return;
        }
        if (!els.nhaCungCap.value.trim()) {
            els.errNcc.textContent = "Vui lòng nhập nhà cung cấp.";
            els.nhaCungCap.focus();
            return;
        }
        if (!els.nguoiNhap.value.trim()) {
            els.errNguoi.textContent = "Vui lòng nhập người nhập.";
            els.nguoiNhap.focus();
            return;
        }
        state.nhaCungCap = els.nhaCungCap.value.trim();
        state.nguoiNhap = els.nguoiNhap.value.trim();
        state.ghiChu = els.ghiChu.value.trim();

        // 2. Kiểm tra từng dòng
        if (state.lines.length === 0) {
            hienThiThongBao("Phiếu phải có ít nhất một dòng thuốc.", "error");
            return;
        }

        // 3. Kiểm tra số lượng, giá, tổng tiền (tính từ dữ liệu thực, không tin giao diện)
        var tong = tinhTong(state.lines);
        if (tong.tongTien <= 0) {
            hienThiThongBao("Tổng tiền phiếu không hợp lệ.", "error");
            return;
        }
        for (var i = 0; i < state.lines.length; i++) {
            var l = state.lines[i];
            if (!l.ma || !l.ten || !l.donVi) {
                hienThiThongBao("Dòng thuốc thứ " + (i + 1) + " thiếu thông tin.", "error");
                return;
            }
            if (l.soLuong <= 0) {
                hienThiThongBao("Số lượng của \"" + l.ten + "\" phải lớn hơn 0.", "error");
                return;
            }
            if (l.donGia < 0) {
                hienThiThongBao("Giá nhập của \"" + l.ten + "\" không được âm.", "error");
                return;
            }
        }

        // 4. Mã phiếu duy nhất
        if (!state.maPhieu) state.maPhieu = taoMaPhieu();

        // Chuẩn bị dữ liệu (không cập nhật tồn kho trước khi lưu thành công)
        var maPhieu = state.maPhieu;
        var ngay = state.ngay;
        var ncc = state.nhaCungCap;
        var nguoi = state.nguoiNhap;
        var ghichu = state.ghiChu;
        var linesCopy = JSON.parse(JSON.stringify(state.lines));
        var tongTien = tong.tongTien;
        var tongSL = tong.tongSL;

        // Sao lưu trạng thái cũ để khôi phục nếu thất bại
        var dsThuocCu = JSON.parse(JSON.stringify(layDanhMucThuoc()));
        var lichSuCu = JSON.parse(JSON.stringify(layLichSu()));
        var chiTietCu = JSON.parse(JSON.stringify(layChiTiet()));

        isSaving = true;
        els.btnLuu.disabled = true;

        try {
            // 5 & 6. Lưu phiếu + chi tiết
            var lichSu = layLichSu();
            var phieu = {
                maPhieu: maPhieu,
                ngay: ngay,
                nhaCungCap: ncc,
                nguoiNhap: nguoi,
                ghiChu: ghichu,
                tongTien: tongTien,
                tongSoLuong: tongSL,
                soMatHang: tong.soMatHang,
                ngayLap: new Date().toISOString()
            };
            lichSu.push(phieu);
            luuLichSu(lichSu);

            var chiTiet = layChiTiet();
            chiTiet[maPhieu] = linesCopy;
            luuChiTiet(chiTiet);

            // 7 & 8. Cập nhật tồn kho + danh mục (cộng vào tồn cũ, không ghi đè)
            var dsThuoc = layDanhMucThuoc();
            for (var k = 0; k < linesCopy.length; k++) {
                var l = linesCopy[k];
                var t = timThuocTheoMa(dsThuoc, l.ma);
                if (t) {
                    t.ton = (t.ton || 0) + l.soLuong;
                    // Cập nhật giá nhập gần nhất nếu có
                    if (l.donGia > 0) t.giaNhap = l.donGia;
                } else {
                    dsThuoc.push({
                        ma: l.ma,
                        ten: l.ten,
                        donVi: l.donVi,
                        ton: l.soLuong,
                        giaNhap: l.donGia > 0 ? l.donGia : 0
                    });
                }
            }
            luuDanhMucThuoc(dsThuoc);

            // 9. Thông báo thành công
            hienThiThongBao("Lưu phiếu nhập thành công: " + maPhieu, "success");

            // 10. Cập nhật giao diện
            renderLichSu();
            renderChonThuoc();

            // Làm mới phiếu sau khi lưu
            lamMoiPhieu();

        } catch (e) {
            // Khôi phục nếu thất bại
            luuDanhMucThuoc(dsThuocCu);
            luuLichSu(lichSuCu);
            luuChiTiet(chiTietCu);
            hienThiThongBao("Lưu thất bại: " + (e && e.message ? e.message : String(e)), "error");
        } finally {
            isSaving = false;
            els.btnLuu.disabled = false;
        }
    }

    // ---------- Lịch sử ----------
    function renderLichSu() {
        var tbody = els.tbodyLichSu;
        tbody.textContent = "";
        var lichSu = layLichSu();

        // Lọc
        var tk = (els.timKiem.value || "").toLowerCase().trim();
        var tu = els.locTu.value;
        var den = els.locDen.value;

        var filtered = lichSu.filter(function (p) {
            if (tk) {
                var match = (p.maPhieu || "").toLowerCase().indexOf(tk) >= 0
                    || (p.nhaCungCap || "").toLowerCase().indexOf(tk) >= 0;
                // Tìm theo tên thuốc cần vào chi tiết
                if (!match) {
                    var ct = layChiTiet()[p.maPhieu] || [];
                    match = ct.some(function (l) { return (l.ten || "").toLowerCase().indexOf(tk) >= 0; });
                }
                if (!match) return false;
            }
            if (tu || den) {
                var d = new Date(p.ngay + "T00:00:00");
                if (isNaN(d.getTime())) return false;
                if (tu) {
                    var dt = new Date(tu + "T00:00:00");
                    if (d < dt) return false;
                }
                if (den) {
                    var dd = new Date(den + "T00:00:00");
                    if (d > dd) return false;
                }
            }
            return true;
        });

        // Sắp xếp mới nhất trước
        filtered.sort(function (a, b) {
            return new Date(b.ngayLap || b.ngay) - new Date(a.ngayLap || a.ngay);
        });

        if (filtered.length === 0) {
            els.errLichSu.style.display = "block";
        } else {
            els.errLichSu.style.display = "none";
            for (var i = 0; i < filtered.length; i++) {
                var p = filtered[i];
                var tr = document.createElement("tr");

                var tdMa = document.createElement("td");
                tdMa.textContent = p.maPhieu;
                tr.appendChild(tdMa);

                var tdNgay = document.createElement("td");
                tdNgay.textContent = p.ngay;
                tr.appendChild(tdNgay);

                var tdNcc = document.createElement("td");
                tdNcc.textContent = p.nhaCungCap;
                tr.appendChild(tdNcc);

                var tdNguoi = document.createElement("td");
                tdNguoi.textContent = p.nguoiNhap;
                tr.appendChild(tdNguoi);

                var tdSo = document.createElement("td");
                tdSo.textContent = p.soMatHang;
                tr.appendChild(tdSo);

                var tdSl = document.createElement("td");
                tdSl.textContent = p.tongSoLuong;
                tr.appendChild(tdSl);

                var tdTien = document.createElement("td");
                tdTien.textContent = formatTien(p.tongTien);
                tr.appendChild(tdTien);

                var tdAction = document.createElement("td");
                var btnXem = document.createElement("button");
                btnXem.type = "button";
                btnXem.textContent = "Xem";
                btnXem.className = "nhapkho-btn nhapkho-btn-outline";
                btnXem.style.fontSize = "12px";
                btnXem.style.padding = "5px 10px";
                btnXem.addEventListener("click", (function (maP) { return function () { xemChiTiet(maP); }; })(p.maPhieu));
                tdAction.appendChild(btnXem);

                var btnIn = document.createElement("button");
                btnIn.type = "button";
                btnIn.textContent = "In";
                btnIn.className = "nhapkho-btn nhapkho-btn-outline";
                btnIn.style.fontSize = "12px";
                btnIn.style.padding = "5px 10px";
                btnIn.style.marginLeft = "6px";
                btnIn.addEventListener("click", (function (maP) { return function () { inPhieuLuu(maP); }; })(p.maPhieu));
                tdAction.appendChild(btnIn);

                // Xóa: chỉ xóa bản ghi phiếu, KHÔNG tự động trừ tồn kho (quy tắc nghiệp vụ chưa xác định)
                var btnXoa = document.createElement("button");
                btnXoa.type = "button";
                btnXoa.textContent = "Xóa";
                btnXoa.className = "nhapkho-btn nhapkho-btn-danger";
                btnXoa.style.fontSize = "12px";
                btnXoa.style.padding = "5px 10px";
                btnXoa.style.marginLeft = "6px";
                btnXoa.addEventListener("click", (function (maP, pObj) { return function () { xoaPhieu(maP, pObj); }; })(p.maPhieu, p));
                tdAction.appendChild(btnXoa);

                tr.appendChild(tdAction);
                tbody.appendChild(tr);
            }
        }
    }

    // ---------- Xem chi tiết ----------
    function xemChiTiet(maPhieu) {
        var lichSu = layLichSu();
        var p = null;
        for (var i = 0; i < lichSu.length; i++) {
            if (lichSu[i].maPhieu === maPhieu) { p = lichSu[i]; break; }
        }
        if (!p) return;

        var chiTiet = layChiTiet()[maPhieu] || [];

        els.mctMaPhieu.textContent = p.maPhieu;
        els.mctNgay.textContent = p.ngay;
        els.mctNcc.textContent = p.nhaCungCap;
        els.mctNguoi.textContent = p.nguoiNhap;
        els.mctGhiChu.textContent = p.ghiChu || "-";
        els.mctTongTien.textContent = formatTien(p.tongTien);

        els.mctTbody.textContent = "";
        for (var j = 0; j < chiTiet.length; j++) {
            var l = chiTiet[j];
            var tr = document.createElement("tr");
            ["ma", "ten", "donVi", "soLuong", "donGia", "thanhTien"].forEach(function (key) {
                var td = document.createElement("td");
                if (key === "donGia" || key === "thanhTien") td.textContent = formatTien(l[key]);
                else td.textContent = l[key];
                tr.appendChild(td);
            });
            els.mctTbody.appendChild(tr);
        }

        els.modal.style.display = "flex";
    }

    function dongModal() {
        els.modal.style.display = "none";
    }

    // ---------- In phiếu đang soạn ----------
    function inPhieuDangSoan() {
        if (state.lines.length === 0) {
            hienThiThongBao("Chưa có thuốc để in.", "error");
            return;
        }
        var tong = tinhTong(state.lines);
        els.piMaPhieu.textContent = state.maPhieu;
        els.piNgay.textContent = state.ngay;
        els.piNcc.textContent = state.nhaCungCap || "-";
        els.piNguoi.textContent = state.nguoiNhap || "-";
        els.piGhiChu.textContent = state.ghiChu || "-";

        els.piTbody.textContent = "";
        for (var i = 0; i < state.lines.length; i++) {
            var l = state.lines[i];
            var tr = document.createElement("tr");
            var maTd = document.createElement("td"); maTd.textContent = l.ma; tr.appendChild(maTd);
            var tenTd = document.createElement("td"); tenTd.textContent = l.ten; tr.appendChild(tenTd);
            var dvTd = document.createElement("td"); dvTd.textContent = l.donVi; tr.appendChild(dvTd);
            var slTd = document.createElement("td"); slTd.textContent = l.soLuong; tr.appendChild(slTd);
            var giaTd = document.createElement("td"); giaTd.textContent = formatTien(l.donGia); tr.appendChild(giaTd);
            var ttTd = document.createElement("td"); ttTd.textContent = formatTien(l.thanhTien); tr.appendChild(ttTd);
            els.piTbody.appendChild(tr);
        }
        els.piTongSoLuong.textContent = tong.tongSL;
        els.piTongTien.textContent = formatTien(tong.tongTien);

        window.print();
    }

    // ---------- In phiếu đã lưu ----------
    function inPhieuLuu(maPhieu) {
        var lichSu = layLichSu();
        var p = null;
        for (var i = 0; i < lichSu.length; i++) {
            if (lichSu[i].maPhieu === maPhieu) { p = lichSu[i]; break; }
        }
        if (!p) return;

        var chiTiet = layChiTiet()[maPhieu] || [];

        els.piMaPhieu.textContent = p.maPhieu;
        els.piNgay.textContent = p.ngay;
        els.piNcc.textContent = p.nhaCungCap;
        els.piNguoi.textContent = p.nguoiNhap;
        els.piGhiChu.textContent = p.ghiChu || "-";

        els.piTbody.textContent = "";
        var tongSL = 0;
        for (var j = 0; j < chiTiet.length; j++) {
            var l = chiTiet[j];
            tongSL += parseInt(l.soLuong, 10) || 0;
            var tr = document.createElement("tr");
            var maTd = document.createElement("td"); maTd.textContent = l.ma; tr.appendChild(maTd);
            var tenTd = document.createElement("td"); tenTd.textContent = l.ten; tr.appendChild(tenTd);
            var dvTd = document.createElement("td"); dvTd.textContent = l.donVi; tr.appendChild(dvTd);
            var slTd = document.createElement("td"); slTd.textContent = l.soLuong; tr.appendChild(slTd);
            var giaTd = document.createElement("td"); giaTd.textContent = formatTien(l.donGia); tr.appendChild(giaTd);
            var ttTd = document.createElement("td"); ttTd.textContent = formatTien(l.thanhTien); tr.appendChild(ttTd);
            els.piTbody.appendChild(tr);
        }
        els.piTongSoLuong.textContent = tongSL;
        els.piTongTien.textContent = formatTien(p.tongTien);

        window.print();
    }

    // ---------- Xóa phiếu ----------
    function xoaPhieu(maPhieu, pObj) {
        if (!confirm("Xóa phiếu nhập " + maPhieu + "?\n\nLưu ý: Thao tác này chỉ xóa bản ghi lịch sử. Tồn kho của các thuốc trong phiếu KHÔNG được tự động hoàn lại (quy tắc nghiệp vụ về hoàn tồn khi xóa chưa được xác định). Bạn vẫn muốn xóa?")) {
            return;
        }
        try {
            var lichSu = layLichSu();
            var idx = -1;
            for (var i = 0; i < lichSu.length; i++) {
                if (lichSu[i].maPhieu === maPhieu) { idx = i; break; }
            }
            if (idx === -1) return;
            lichSu.splice(idx, 1);
            luuLichSu(lichSu);

            var chiTiet = layChiTiet();
            delete chiTiet[maPhieu];
            luuChiTiet(chiTiet);

            renderLichSu();
            hienThiThongBao("Đã xóa phiếu " + maPhieu, "success");
        } catch (e) {
            hienThiThongBao("Xóa thất bại: " + (e && e.message ? e.message : String(e)), "error");
        }
    }

    // ---------- Sự kiện ----------
    function suKien() {
        getEls();

        els.ngayNhap.addEventListener("change", validateNgay);
        els.ngayNhap.addEventListener("blur", validateNgay);

        els.nhaCungCap.addEventListener("input", function () { els.errNcc.textContent = ""; });
        els.nguoiNhap.addEventListener("input", function () { els.errNguoi.textContent = ""; });

        els.chonThuoc.addEventListener("change", toggleThuocMoi);

        els.thuocMa.addEventListener("input", function () { els.errMa.textContent = ""; });
        els.thuocTen.addEventListener("input", function () { els.errTen.textContent = ""; });
        els.thuocDonVi.addEventListener("input", function () { els.errDonVi.textContent = ""; });
        els.thuocSoLuong.addEventListener("input", function () {
            els.errSoLuong.textContent = "";
            capNhatThanhTienLine();
        });
        els.thuocGia.addEventListener("input", function () {
            els.errGia.textContent = "";
            capNhatThanhTienLine();
        });
        // Enter trên các input số -> thêm
        els.thuocSoLuong.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); themLine(); } });
        els.thuocGia.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); themLine(); } });

        els.formThuoc.addEventListener("submit", function (e) {
            e.preventDefault();
            themLine();
        });

        els.btnTaoMoi.addEventListener("click", toggleThuocMoi);

        els.btnLuu.addEventListener("click", luuPhieu);
        els.btnLamMoi.addEventListener("click", lamMoiPhieu);
        els.btnIn.addEventListener("click", inPhieuDangSoan);
        els.btnHuy.addEventListener("click", huyPhieu);

        els.btnLoc.addEventListener("click", renderLichSu);
        els.btnLocReset.addEventListener("click", function () {
            els.timKiem.value = "";
            els.locTu.value = "";
            els.locDen.value = "";
            renderLichSu();
        });
        els.timKiem.addEventListener("input", renderLichSu);
        els.locTu.addEventListener("change", renderLichSu);
        els.locDen.addEventListener("change", renderLichSu);

        // Modal
        els.btnDongModal.addEventListener("click", dongModal);
        els.btnDongModal2.addEventListener("click", dongModal);
        els.btnInPhieu.addEventListener("click", function () {
            dongModal();
            // Lấy mã phiếu từ modal hiện tại
            var ma = els.mctMaPhieu.textContent;
            if (ma) inPhieuLuu(ma);
        });
        els.modal.addEventListener("click", function (e) {
            if (e.target === els.modal) dongModal();
        });
    }

    // ---------- Entry ----------
    function init() {
        if (!document.getElementById("ma-phieu")) return; // Tránh chạy khi không phải trang này
        getEls();
        state.maPhieu = taoMaPhieu();
        els.maPhieu.value = state.maPhieu;
        khoiTaoNgay();
        renderChonThuoc();
        renderChiTiet();
        renderLichSu();
        suKien();
        hienThiThongBao("Chào mừng đến với trang Nhập kho. Dữ liệu lưu trên trình duyệt (localStorage).", "success");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Expose cho mục đích kiểm thử (không ảnh hưởng hệ thống cũ)
    window.NhapKho = {
        layDanhMucThuoc: layDanhMucThuoc,
        layLichSu: layLichSu,
        layChiTiet: layChiTiet,
        state: state
    };

})();
