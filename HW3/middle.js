async function submitRequest01(argument, callback) {
    var firstCountry = document.getElementById("first-country").value;
    var secondCountry = document.getElementById("second-country").value;
    let url;
    if (argument = "diff_lang") {
    url = `http://localhost:3000/getDiffLang?country1=
${firstCountry}&country2=${secondCountry}`; 
    }
    else {
    url = `http://localhost:3000/getDiffLangJoin?country1=
${firstCountry}&country2=${secondCountry}`;
    }
    const response = await fetch(url);
    const jsonData = await response.json();
    callback(jsonData);
}

function updateTable01(argument) {
    var tableBody = document.getElementById("differences-body");
    tableBody.innerHTML = "";
    submitRequest01(argument, (jsonData) => {
        for (let ii = 0; ii < jsonData.length; ii++) {
          const row = tableBody.insertRow(-1);
          const cell = row.insertCell(0);
          cell.innerHTML = jsonData[ii].Language;
        }
    });
}

async function submitRequest02(callback) {
    var agg_type = document.getElementById("operation-type").value;
    var country_name = document.getElementById("country-name").value;
    url = `http://localhost:3000/aggregateCountries?agg_type=
${agg_type}&country_name=${country_name}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    callback(jsonData);
}

function updateTable02() {
    var tableBody = document.getElementById("differences-body");
    tableBody.innerHTML = "";
    submitRequest02((jsonData) => {
        for (let ii = 0; ii < jsonData.length; ii++) {
            const row = tableBody.insertRow(-1);
            const cell0 = row.insertCell(0);
            const cell1 = row.insertCell(1);
            const cell2 = row.insertCell(2);
            const cell3 = row.insertCell(3);
            cell0.innerHTML = jsonData[ii].Name;
            cell1.innerHTML = jsonData[ii].LifeExpectancy;
            cell2.innerHTML = jsonData[ii].GovernmentForm;
            cell3.innerHTML = jsonData[ii].Language;
          }
    });
}