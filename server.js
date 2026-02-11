const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// JSON 路徑
const CODES_FILE = path.join(__dirname, 'data', 'codes.json');
const PRIZES_FILE = path.join(__dirname, 'data', 'prizes.json');

// 初始化獎項數量
if (!fs.existsSync(PRIZES_FILE)) {
    fs.writeFileSync(PRIZES_FILE, JSON.stringify({
        A: 3,
        B: 20,
        C: 35,
        D: 42
    }, null, 2));
}

// 初始化驗證碼檔案
if (!fs.existsSync(CODES_FILE)) fs.writeFileSync(CODES_FILE, JSON.stringify([]));

// 生成新驗證碼
app.get('/admin/new-code', (req, res) => {
    const codes = JSON.parse(fs.readFileSync(CODES_FILE));
    let newCode;
    do {
        newCode = Math.floor(1000 + Math.random() * 9000).toString();
    } while (codes.find(c => c.code === newCode));
    
    codes.push({ code: newCode, used: false, history: [] });
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
    res.json({ code: newCode });
});

// 後台查看驗證碼與抽獎歷史
app.get('/admin/codes', (req, res) => {
    const codes = JSON.parse(fs.readFileSync(CODES_FILE));
    res.json(codes);
});

// 驗證碼驗證
app.post('/verify', (req, res) => {
    const { code } = req.body;
    const codes = JSON.parse(fs.readFileSync(CODES_FILE));
    const found = codes.find(c => c.code === code && !c.used);
    if (found) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "驗證碼不存在或已使用" });
    }
});

// 抽獎
app.post('/draw', (req, res) => {
    const { code } = req.body;
    let codes = JSON.parse(fs.readFileSync(CODES_FILE));
    let prizesData = JSON.parse(fs.readFileSync(PRIZES_FILE));

    const user = codes.find(c => c.code === code && !c.used);
    if (!user) return res.json({ success: false, message: "驗證碼無效" });

    // 建立權重列表
    let weightedList = [];
    Object.keys(prizesData).forEach(key => {
        if (prizesData[key] > 0) {
            let weight = (key === "A" || key === "B") ? 15 : 85;
            for (let i = 0; i < weight; i++) weightedList.push(key);
        }
    });

    if (weightedList.length === 0) return res.json({ success: false, message: "獎項已抽完" });

    const prize = weightedList[Math.floor(Math.random() * weightedList.length)];
    prizesData[prize]--;
    user.history.push(prize);

    fs.writeFileSync(PRIZES_FILE, JSON.stringify(prizesData, null, 2));
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));

    res.json({ success: true, prize, remaining: prizesData });
});

// 啟動伺服器
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
