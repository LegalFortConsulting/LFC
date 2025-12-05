document.getElementById("contactForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const status = document.getElementById("form-status");
    const formData = new FormData(this);

    fetch("https://script.google.com/macros/s/AKfycbz0YibnEhifXUu0_FeTF_6va0ve2RtwO2QAMsE5rrPQ7JkbAH3CYg675Ht8wEikZj--Eg/exec", {
        method: "POST",
        body: formData
    })
    .then(() => {
        status.innerText = "Заявка успешно отправлена!";
        this.reset();
    })
    .catch(() => {
        status.innerText = "Ошибка отправки, попробуйте позже.";
    });
});
