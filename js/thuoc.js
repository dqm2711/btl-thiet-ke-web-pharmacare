/* =========================================
   PharmaCare - Kho thuốc (thuoc.js)
   Form + Validate + Thêm/Sửa/Xóa dòng bảng
   Đồng bộ localStorage key: danhSachThuoc
   ========================================= */

(function () {
    "use strict";

    var STORAGE_KEY = "danhSachThuoc";
    var editingMa = null; // mã đang sửa (null = đang thêm mới)

    // Dữ liệu mặc định (giống index.js)
    var dsMacDinh = [
        { ma: "TH01", ten: "Augmentin 1g", quyCach: "Hộp 14 viên", donVi: "hộp", ton: 12, giaBan: 185000, hanDung: "2026-10-25", nhaSx: "GSK", ghiChu: "" },
        { ma: "TH02", ten: "Klacid 500mg", quyCach: "Hộp 14 viên", donVi: "hộp", ton: 8, giaBan: 210000, hanDung: "2026-11-02", nhaSx: "Abbott", ghiChu: "" },
        { ma: "TH03", ten: "Zinnat 500mg", quyCach: "Hộp 10 viên", donVi: "hộp", ton: 15, giaBan: 165000, hanDung: "2026-11-10", nhaSx: "GSK", ghiChu: "" },
        { ma: "TH04", ten: "Panadol Extra", quyCach: "Hộp 15 vỉ", donVi: "hộp", ton: 120, giaBan: 45000, hanDung: "2027-05-20", nhaSx: "GSK", ghiChu: "" },
        { ma: "TH05", ten: "Berberin Mộc Hương", quyCach: "Lọ 100 viên", donVi: "lọ", ton: 95, giaBan: 28000, hanDung: "2027-08-15", nhaSx: "DHG Pharma", ghiChu: "" }
    ];

    // ---------- Helpers ----------
    function lay(id) {
        return document.getElementById(id);
    }

    function formatTien(so) {
        if (so === null || so === undefined || isNaN(so)) return "0 ₫";
        return Number(so).toLocaleString("vi-VN") + " ₫";
    }

    function soNgayConLai(hanDung) {
        if (!hanDung) return null;
        var homNay = new Date();
        homNay.setHours(0, 0, 0, 0);
        var ngayHet = new Date(hanDung);
        ngayHet.setHours(0, 0, 0, 0);
        return Math.ceil((ngayHet - homNay) / (1000 * 60 * 60 * 24));
    }

    function tinhTrangThai(thuoc) {
        if (thuoc.ton <= 0) return { key: "hethang", text: "Hết hàng" };
        var soNgay = soNgayConLai(thuoc.hanDung);
        if (soNgay === null) return { key: "ok", text: "Còn hạn" };
        if (soNgay < 0) return { key: "hethan", text: "Hết hạn" };
        if (soNgay <= 30) return { key: "canhan", text: "Còn " + soNgay + " ngày" };
        return { key: "ok", text: "Còn hạn" };
    }

    // ---------- localStorage ----------
    function loadDanhSach() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dsMacDinh));
                return dsMacDinh.slice();
            }
            var ds = JSON.parse(raw);
            if (!Array.isArray(ds) || ds.length === 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dsMacDinh));
                return dsMacDinh.slice();
            }
            // Chuẩn hóa dữ liệu cũ (thiếu field)
            return ds.map(function (t) {
                return {
                    ma: String(t.ma || "").trim(),
                    ten: String(t.ten || "").trim(),
                    quyCach: String(t.quyCach || ""),
                    donVi: String(t.donVi || "hộp"),
                    ton: parseInt(t.ton, 10) || 0,
                    giaBan: parseInt(t.giaBan, 10) || 0,
                    hanDung: String(t.hanDung || ""),
                    nhaSx: String(t.nhaSx || ""),
                    ghiChu: String(t.ghiChu || "")
                };
            });
        } catch (e) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dsMacDinh));
            return dsMacDinh.slice();
        }
    }

    function saveDanhSach(ds) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ds));
    }

    // ---------- Validate form ----------
    function clearErrors() {
        ["err-ma", "err-ten", "err-quycach", "err-donvi", "err-soluong", "err-gia", "err-handung", "err-nhasx"].forEach(function (id) {
            var el = lay(id);
            if (el) el.textContent = "";
        });
        ["ma-thuoc", "ten-thuoc", "so-luong", "han-dung"].forEach(function (id) {
            var el = lay(id);
            if (el) el.classList.remove("invalid");
        });
    }

    function setError(inputId, errId, msg) {
        var input = lay(inputId);
        var err = lay(errId);
        if (input) input.classList.add("invalid");
        if (err) err.textContent = msg;
    }

    function validateForm() {
        clearErrors();
        var ok = true;

        var ma = lay("ma-thuoc").value.trim();
        var ten = lay("ten-thuoc").value.trim();
        var soLuong = lay("so-luong").value;
        var hanDung = lay("han-dung").value;
        var giaBan = lay("gia-ban").value;

        // Mã thuốc
        if (!ma) {
            setError("ma-thuoc", "err-ma", "Vui lòng nhập mã thuốc.");
            ok = false;
        } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(ma)) {
            setError("ma-thuoc", "err-ma", "Mã chỉ gồm chữ, số, _ hoặc - (2-20 ký tự).");
            ok = false;
        } else {
            // Kiểm tra trùng mã (khi thêm mới hoặc sửa mã khác)
            var ds = loadDanhSach();
            var trung = ds.some(function (t) {
                return t.ma.toLowerCase() === ma.toLowerCase() && t.ma !== editingMa;
            });
            if (trung) {
                setError("ma-thuoc", "err-ma", "Mã thuốc đã tồn tại.");
                ok = false;
            }
        }

        // Tên
        if (!ten) {
            setError("ten-thuoc", "err-ten", "Vui lòng nhập tên biệt dược.");
            ok = false;
        } else if (ten.length < 2) {
            setError("ten-thuoc", "err-ten", "Tên thuốc quá ngắn.");
            ok = false;
        }

        // Số lượng tồn
        if (soLuong === "" || soLuong === null) {
            setError("so-luong", "err-soluong", "Vui lòng nhập số lượng tồn.");
            ok = false;
        } else {
            var sl = Number(soLuong);
            if (isNaN(sl) || sl < 0 || sl % 1 !== 0) {
                setError("so-luong", "err-soluong", "Số lượng phải là số nguyên ≥ 0.");
                ok = false;
            }
        }

        // Hạn dùng
        if (!hanDung) {
            setError("han-dung", "err-handung", "Vui lòng chọn hạn dùng.");
            ok = false;
        }

        // Giá bán (không bắt buộc nhưng nếu nhập thì phải hợp lệ)
        if (giaBan !== "" && giaBan !== null) {
            var gia = Number(giaBan);
            if (isNaN(gia) || gia < 0) {
                setError("gia-ban", "err-gia", "Giá bán không được âm.");
                ok = false;
            }
        }

        return ok;
    }

    // ---------- Lấy dữ liệu từ form ----------
    function getFormData() {
        return {
            ma: lay("ma-thuoc").value.trim(),
            ten: lay("ten-thuoc").value.trim(),
            quyCach: lay("quy-cach").value.trim(),
            donVi: lay("don-vi").value.trim() || "hộp",
            ton: parseInt(lay("so-luong").value, 10) || 0,
            giaBan: parseInt(lay("gia-ban").value, 10) || 0,
            hanDung: lay("han-dung").value,
            nhaSx: lay("nha-sx").value.trim(),
            ghiChu: lay("ghi-chu").value.trim()
        };
    }

    // ---------- Reset form ----------
    function resetForm() {
        lay("form-thuoc").reset();
        lay("don-vi").value = "hộp";
        clearErrors();
        editingMa = null;
        lay("btn-them").style.display = "inline-flex";
        lay("btn-capnhat").style.display = "none";
        lay("ma-thuoc").readOnly = false;
        showMessage("", "");
    }

    function showMessage(msg, type) {
        var el = lay("form-message");
        el.textContent = msg;
        el.className = "thuoc-message" + (type ? " " + type : "");
    }

    // ---------- Render bảng ----------
    function renderBang() {
        var ds = loadDanhSach();
        var keyword = (lay("tim-kiem").value || "").trim().toLowerCase();
        var loc = lay("loc-trangthai").value;

        var filtered = ds.filter(function (t) {
            var matchKw = !keyword ||
                t.ma.toLowerCase().indexOf(keyword) !== -1 ||
                t.ten.toLowerCase().indexOf(keyword) !== -1;

            if (!matchKw) return false;

            var st = tinhTrangThai(t);
            if (loc === "all") return true;
            if (loc === "ok") return st.key === "ok";
            if (loc === "canhan") return st.key === "canhan";
            if (loc === "hethan") return st.key === "hethan";
            if (loc === "hethang") return st.key === "hethang";
            return true;
        });

        var tbody = lay("tbody-thuoc");
        tbody.innerHTML = "";

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="thuoc-empty">Không có thuốc nào phù hợp.</td></tr>';
        } else {
            filtered.forEach(function (t, idx) {
                var st = tinhTrangThai(t);
                var tr = document.createElement("tr");

                tr.innerHTML =
                    "<td>" + (idx + 1) + "</td>" +
                    "<td><strong>" + escapeHtml(t.ma) + "</strong></td>" +
                    "<td>" + escapeHtml(t.ten) + "</td>" +
                    "<td>" + escapeHtml(t.quyCach || "—") + "</td>" +
                    "<td>" + escapeHtml(t.donVi) + "</td>" +
                    "<td>" + t.ton + "</td>" +
                    "<td>" + formatTien(t.giaBan) + "</td>" +
                    "<td>" + (t.hanDung || "—") + "</td>" +
                    "<td class=\"status-" + st.key + "\">" + st.text + "</td>" +
                    "<td>" +
                        "<button type=\"button\" class=\"thuoc-btn thuoc-btn-edit\" data-ma=\"" + escapeAttr(t.ma) + "\">Sửa</button> " +
                        "<button type=\"button\" class=\"thuoc-btn thuoc-btn-danger\" data-ma=\"" + escapeAttr(t.ma) + "\">Xóa</button>" +
                    "</td>";

                tbody.appendChild(tr);
            });
        }

        // Gắn sự kiện Sửa / Xóa
        tbody.querySelectorAll(".thuoc-btn-edit").forEach(function (btn) {
            btn.addEventListener("click", function () {
                batDauSua(btn.getAttribute("data-ma"));
            });
        });
        tbody.querySelectorAll(".thuoc-btn-danger").forEach(function (btn) {
            btn.addEventListener("click", function () {
                xoaThuoc(btn.getAttribute("data-ma"));
            });
        });

        // Summary
        var tongTon = 0;
        var demCanHan = 0;
        ds.forEach(function (t) {
            tongTon += t.ton;
            var st = tinhTrangThai(t);
            if (st.key === "canhan" || st.key === "hethan") demCanHan++;
        });
        lay("tong-loai").textContent = ds.length;
        lay("tong-ton").textContent = tongTon;
        lay("tong-canhan").textContent = demCanHan;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeAttr(str) {
        return String(str).replace(/"/g, "&quot;");
    }

    // ---------- Thêm / Cập nhật ----------
    function themThuoc(e) {
        if (e) e.preventDefault();
        if (!validateForm()) {
            showMessage("Vui lòng kiểm tra lại các trường bắt buộc.", "error");
            return;
        }

        var data = getFormData();
        var ds = loadDanhSach();

        if (editingMa) {
            // Cập nhật
            for (var i = 0; i < ds.length; i++) {
                if (ds[i].ma === editingMa) {
                    // Nếu đổi mã
                    if (data.ma !== editingMa) {
                        // đã check trùng trong validate
                    }
                    ds[i] = data;
                    break;
                }
            }
            saveDanhSach(ds);
            showMessage("Đã cập nhật thuốc \"" + data.ten + "\".", "success");
            resetForm();
        } else {
            // Thêm mới
            ds.push(data);
            saveDanhSach(ds);
            showMessage("Đã thêm thuốc \"" + data.ten + "\" vào kho.", "success");
            // Chỉ clear form, giữ mode thêm
            lay("form-thuoc").reset();
            lay("don-vi").value = "hộp";
            clearErrors();
        }

        renderBang();
    }

    function batDauSua(ma) {
        var ds = loadDanhSach();
        var thuoc = null;
        for (var i = 0; i < ds.length; i++) {
            if (ds[i].ma === ma) {
                thuoc = ds[i];
                break;
            }
        }
        if (!thuoc) return;

        editingMa = ma;
        lay("ma-thuoc").value = thuoc.ma;
        lay("ten-thuoc").value = thuoc.ten;
        lay("quy-cach").value = thuoc.quyCach || "";
        lay("don-vi").value = thuoc.donVi || "hộp";
        lay("so-luong").value = thuoc.ton;
        lay("gia-ban").value = thuoc.giaBan || "";
        lay("han-dung").value = thuoc.hanDung || "";
        lay("nha-sx").value = thuoc.nhaSx || "";
        lay("ghi-chu").value = thuoc.ghiChu || "";

        lay("ma-thuoc").readOnly = true; // không cho đổi mã khi sửa (tránh phức tạp)
        lay("btn-them").style.display = "none";
        lay("btn-capnhat").style.display = "inline-flex";
        clearErrors();
        showMessage("Đang sửa thuốc: " + thuoc.ten, "");
        lay("ten-thuoc").focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function xoaThuoc(ma) {
        if (!confirm("Bạn có chắc muốn xóa thuốc mã \"" + ma + "\"?")) return;
        var ds = loadDanhSach();
        ds = ds.filter(function (t) { return t.ma !== ma; });
        saveDanhSach(ds);
        if (editingMa === ma) resetForm();
        showMessage("Đã xóa thuốc mã \"" + ma + "\".", "success");
        renderBang();
    }

    // ---------- Sự kiện ----------
    function khoiTao() {
        lay("form-thuoc").addEventListener("submit", themThuoc);
        lay("btn-capnhat").addEventListener("click", themThuoc);
        lay("btn-huy").addEventListener("click", function () {
            resetForm();
        });
        lay("tim-kiem").addEventListener("input", renderBang);
        lay("loc-trangthai").addEventListener("change", renderBang);

        // Load lần đầu
        renderBang();
    }

    // Chạy khi DOM sẵn sàng
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", khoiTao);
    } else {
        khoiTao();
    }
})();
