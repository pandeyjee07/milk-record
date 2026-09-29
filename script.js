let records = JSON.parse(localStorage.getItem("milkRecords")) || [];

const form = document.getElementById("milkForm");
const dateInput = document.getElementById("date");
const milkInput = document.getElementById("milk");
const rateInput = document.getElementById("rate");
const setRateBtn = document.getElementById("setRateBtn");
const rateStatus = document.getElementById("rateStatus");
const setRateBtn = document.getElementById("setRateBtn");
const rateStatus = document.getElementById("rateStatus");
const todayMilk = document.getElementById("todayMilk");
const todayAmount = document.getElementById("todayAmount");
const monthMilk = document.getElementById("monthMilk");
const monthAmount = document.getElementById("monthAmount");
const monthSelect = document.getElementById("monthSelect");
const selectedMilk = document.getElementById("selectedMilk");
const selectedAmount = document.getElementById("selectedAmount");
const selectedDays = document.getElementById("selectedDays");
const averageMilk = document.getElementById("averageMilk");
const historyMonth = document.getElementById("historyMonth");
const recordsTable = document.getElementById("recordsTable");

function getToday(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
dateInput.value = getToday();

// Fixed milk rate: set only once and reuse every day
let fixedRate = parseFloat(localStorage.getItem("fixedMilkRate")) || 0;

function updateRateUI(){
    if(fixedRate > 0){
        rateInput.value = fixedRate;
        rateInput.readOnly = true;
        rateStatus.textContent = "Fixed Rate: ₹" + fixedRate.toFixed(2) + " / Liter";
        setRateBtn.textContent = "Change Rate";
    }else{
        rateInput.readOnly = false;
        rateStatus.textContent = "Pehle milk ka rate ek baar set karein.";
        setRateBtn.textContent = "Set Fixed Rate";
    }
}

setRateBtn.addEventListener("click", function(){
    if(fixedRate > 0){
        const newRate = prompt("Naya milk rate enter karein:", fixedRate);
        if(newRate === null) return;
        const value = parseFloat(newRate);
        if(isNaN(value) || value <= 0){
            alert("Valid rate enter karein.");
            return;
        }
        fixedRate = value;
    }else{
        const value = parseFloat(rateInput.value);
        if(isNaN(value) || value <= 0){
            alert("Pehle valid milk rate enter karein.");
            return;
        }
        fixedRate = value;
    }

    localStorage.setItem("fixedMilkRate", fixedRate);
    updateRateUI();
});

updateRateUI();

function saveData(){
    localStorage.setItem("milkRecords", JSON.stringify(records));
}

form.addEventListener("submit", function(e){
    e.preventDefault();
    const date = dateInput.value;
    const milk = parseFloat(milkInput.value);
    const rate = fixedRate;

    if(!date || isNaN(milk) || milk < 0){
        alert("Please enter valid milk quantity.");
        return;
    }

    if(rate <= 0){
        alert("Pehle milk ka fixed rate set karein.");
        return;
    }

    const amount = milk * rate;
    const existing = records.find(x => x.date === date);

    if(existing){
        if(!confirm("Is date ka record already hai. Kya aap ise update karna chahte hain?")) return;
        existing.milk = milk;
        existing.rate = rate;
        existing.amount = amount;
    }else{
        records.push({id:Date.now(),date,milk,rate,amount});
    }

    saveData();
    milkInput.value = "";
    dateInput.value = getToday();
    updateRateUI();
    render();
    alert("✅ Milk record saved!");
});

function deleteRecord(id){
    if(!confirm("Kya aap ye record delete karna chahte hain?")) return;
    records = records.filter(x => x.id !== id);
    saveData();
    render();
}

function editRecord(id){
    const r = records.find(x => x.id === id);
    if(!r) return;
    dateInput.value = r.date;
    milkInput.value = r.milk;
    rateInput.value = r.rate;
    window.scrollTo({top:0,behavior:"smooth"});
}

function getCurrentMonth(){
    return getToday().substring(0,7);
}

function monthName(month){
    return new Date(month+"-01").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
}

function calculateMonth(month){
    const data = records.filter(x => x.date.startsWith(month));
    return {
        records:data,
        totalMilk:data.reduce((s,x)=>s+Number(x.milk),0),
        totalAmount:data.reduce((s,x)=>s+Number(x.amount),0),
        days:data.length
    };
}

function updateDashboard(){
    const today = getToday();
    const todayData = records.filter(x => x.date === today);
    const tm = todayData.reduce((s,x)=>s+Number(x.milk),0);
    const ta = todayData.reduce((s,x)=>s+Number(x.amount),0);

    todayMilk.textContent = tm.toFixed(2)+" L";
    todayAmount.textContent = "₹"+ta.toFixed(2);

    const data = calculateMonth(getCurrentMonth());
    monthMilk.textContent = data.totalMilk.toFixed(2)+" L";
    monthAmount.textContent = "₹"+data.totalAmount.toFixed(2);
}

function updateMonthList(){
    let months = [...new Set(records.map(x=>x.date.substring(0,7)))];
    const current = getCurrentMonth();
    if(!months.includes(current)) months.push(current);
    months.sort().reverse();

    monthSelect.innerHTML = "";
    months.forEach(m=>{
        const option = document.createElement("option");
        option.value = m;
        option.textContent = monthName(m);
        monthSelect.appendChild(option);
    });

    monthSelect.value = current;
    updateMonthlySummary();
}

function updateMonthlySummary(){
    const month = monthSelect.value;
    if(!month) return;
    const data = calculateMonth(month);

    selectedMilk.textContent = data.totalMilk.toFixed(2)+" L";
    selectedAmount.textContent = "₹"+data.totalAmount.toFixed(2);
    selectedDays.textContent = data.days;
    averageMilk.textContent = (data.days ? data.totalMilk/data.days : 0).toFixed(2)+" L";
}

function displayRecords(){
    let data = [...records];

    if(historyMonth.value){
        data = data.filter(x=>x.date.startsWith(historyMonth.value));
    }

    data.sort((a,b)=>new Date(b.date)-new Date(a.date));
    recordsTable.innerHTML = "";

    if(!data.length){
        recordsTable.innerHTML = '<tr><td colspan="5">No records found</td></tr>';
        return;
    }

    data.forEach(item=>{
        const parts = item.date.split("-");
        const displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${displayDate}</td>
            <td>${Number(item.milk).toFixed(2)} L</td>
            <td>₹${Number(item.rate).toFixed(2)}</td>
            <td>₹${Number(item.amount).toFixed(2)}</td>
            <td>
                <button class="edit-btn" onclick="editRecord(${item.id})">Edit</button>
                <button class="delete-btn" onclick="deleteRecord(${item.id})">Delete</button>
            </td>`;
        recordsTable.appendChild(row);
    });
}

monthSelect.addEventListener("change", updateMonthlySummary);
historyMonth.addEventListener("change", displayRecords);

function render(){
    updateDashboard();
    updateMonthList();
    displayRecords();
}

render();