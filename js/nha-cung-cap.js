document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('nccSearchInput');
    const cardsContainer = document.getElementById('nccCardsContainer');
    const addForm = document.getElementById('nccAddForm');

    // 1. Chức năng Live-search lọc thẻ theo tên công ty
    if (searchInput) {
        searchInput.addEventListener('keyup', function (e) {
            const keyword = e.target.value.toLowerCase().trim();
            const cards = cardsContainer.getElementsByClassName('ncc-card-item');

            Array.from(cards).forEach(function (card) {
                const companyName = card.getAttribute('data-name').toLowerCase();
                if (companyName.includes(keyword)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 2. Validation Form và thêm mới Thẻ đối tác
    if (addForm) {
        addForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('nccCompanyName');
            const contactInput = document.getElementById('nccContactPerson');
            const phoneInput = document.getElementById('nccPhone');
            const emailInput = document.getElementById('nccEmail');

            let isValid = true;

            // Kiểm tra tên công ty không để trống
            const errCompanyName = document.getElementById('errCompanyName');
            if (!nameInput.value.trim()) {
                errCompanyName.textContent = 'Vui lòng nhập tên công ty dược.';
                nameInput.classList.add('error-input');
                isValid = false;
            } else {
                errCompanyName.textContent = '';
                nameInput.classList.remove('error-input');
            }

            // Kiểm tra người liên hệ
            const errContactPerson = document.getElementById('errContactPerson');
            if (!contactInput.value.trim()) {
                errContactPerson.textContent = 'Vui lòng nhập tên người liên hệ.';
                contactInput.classList.add('error-input');
                isValid = false;
            } else {
                errContactPerson.textContent = '';
                contactInput.classList.remove('error-input');
            }

            // Kiểm tra số điện thoại cơ bản
            const errPhone = document.getElementById('errPhone');
            if (!phoneInput.value.trim() || phoneInput.value.length < 10) {
                errPhone.textContent = 'Số điện thoại không hợp lệ (tối thiểu 10 số).';
                phoneInput.classList.add('error-input');
                isValid = false;
            } else {
                errPhone.textContent = '';
                phoneInput.classList.remove('error-input');
            }

            // Kiểm tra định dạng Email chuẩn Regex (phải có @ và dấu .)
            const errEmail = document.getElementById('errEmail');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                errEmail.textContent = 'Email không hợp lệ (ví dụ: name@domain.com).';
                emailInput.classList.add('error-input');
                isValid = false;
            } else {
                errEmail.textContent = '';
                emailInput.classList.remove('error-input');
            }

            // Nếu dữ liệu hợp lệ -> Tạo thẻ card mới chèn vào DOM
            if (isValid) {
                const newCard = document.createElement('div');
                newCard.className = 'ncc-card-item';
                newCard.setAttribute('data-name', nameInput.value.trim());
                newCard.innerHTML = `
                    <h3>${escapeHtml(nameInput.value.trim())}</h3>
                    <p><strong>Người liên hệ:</strong> ${escapeHtml(contactInput.value.trim())}</p>
                    <p><strong>SĐT:</strong> <a href="tel:${escapeHtml(phoneInput.value.trim())}">${escapeHtml(phoneInput.value.trim())}</a></p>
                    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(emailInput.value.trim())}">${escapeHtml(emailInput.value.trim())}</a></p>
                `;

                cardsContainer.appendChild(newCard);
                alert('Thêm nhà cung cấp thành công!');
                addForm.reset();
            }
        });
    }

    // Hàm chống XSS đơn giản khi render dữ liệu động
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
});