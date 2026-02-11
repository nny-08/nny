// 驗證碼頁
async function verifyCode() {
    const code = document.getElementById('codeInput').value;
    const res = await fetch('/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.success) {
        localStorage.setItem('gachaCode', code);
        window.location.href = "gacha.html";
    } else {
        alert(data.message);
    }
}

// 扭蛋抽獎
async function drawGacha() {
    const code = localStorage.getItem('gachaCode');
    if (!code) return alert("驗證碼失效");

    const res = await fetch('/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (data.success) {
        document.getElementById('prizeImg').src = `images/prize_${data.prize}.png`;
        document.getElementById('prizePopup').style.display = 'block';
        new Audio('audio/prize_sound.mp3').play();

        const total = Object.values(data.remaining).reduce((a,b)=>a+b,0);
        document.getElementById('remaining').innerText = `剩餘抽獎數：${total}`;
    } else {
        alert(data.message);
    }
}

// 關閉獎品彈窗
function closePopup() {
    document.getElementById('prizePopup').style.display = 'none';
}
