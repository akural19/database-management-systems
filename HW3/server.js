const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');

const app = express();

// Enable CORS
app.use(cors());

// Configure body-parser to handle POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '415gk4cmz',
  database: 'world',
});

function contains(val, col_name, table_name, callback){
  const sql = `SELECT COUNT(*) AS Count FROM ${table_name} 
  WHERE ${col_name} = "${val}"`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    callback(result[0].Count > 0);
  })
}

function diff_lang(country1, country2, callback){
  const sql = `SELECT Language FROM CountryLanguage, Country 
  WHERE Name = "${country1}" AND Code = CountryCode EXCEPT (
  SELECT Language FROM CountryLanguage, Country
  WHERE Name = "${country2}" AND Code = CountryCode)`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    callback(result);
  })
}

function diff_lang_join(country1, country2, callback){
  const sql = `SELECT C1.Language
  FROM (CountryLanguage AS C1 JOIN Country AS CO1 ON C1.CountryCode = CO1.Code)
  LEFT JOIN ((CountryLanguage AS C2 JOIN Country AS CO2 ON C2.CountryCode = CO2.Code)  
  ) ON C1.Language = C2.Language AND CO2.Name = "${country2}"
  WHERE CO1.Name = "${country1}" AND C2.Language IS NULL;`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    callback(result);
  })
}

function aggregate_countries(agg_type, country_name, callback) {
  const sql = `SELECT Name, LifeExpectancy, GovernmentForm, Language
  FROM Country, CountryLanguage WHERE LifeExpectancy > (
  SELECT ${agg_type}(LifeExpectancy) FROM Country) AND LifeExpectancy < (
  SELECT LifeExpectancy FROM Country WHERE Name = "${country_name}")
  AND IsOfficial = "T" AND Code = CountryCode`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    callback(result);
  })
}

function find_min_max_continent() {
  const sql = `SELECT Name, Continent, LifeExpectancy FROM Country WHERE 
  (Continent, LifeExpectancy)IN (SELECT Continent, MAX(LifeExpectancy) 
  FROM Country GROUP BY Continent UNION SELECT Continent, 
  MIN(LifeExpectancy)FROM Country GROUP BY Continent)`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log("\nfind_min_max_continent results: ");
    for (let ii = 0; ii < result.length; ii++) {
      console.log(`${result[ii].Name.padEnd(20)} ${result[ii].Continent.padEnd(20)}\
      ${result[ii].LifeExpectancy}`);
    }
  })
}

function find_country_languages(percentage, language) {
  const sql = `SELECT Name, Language, Percentage FROM Country, CountryLanguage
  WHERE Language = "${language}" AND Percentage > ${percentage} AND Code = CountryCode`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log("\nfind_country_languages results: ");
    for (let ii = 0; ii < result.length; ii++) {
      console.log(`${result[ii].Name.padEnd(20)} ${result[ii].Language.padEnd(20)}\
      ${result[ii].Percentage}`);
    }
  })
}

function find_country_count(amount) {
  const sql = `SELECT Name, LifeExpectancy, Continent FROM Country WHERE 
  (LifeExpectancy, Continent) IN ( SELECT Max(LifeExpectancy), Continent 
  FROM Country WHERE Code IN ( SELECT CountryCode FROM City GROUP BY 
  CountryCode HAVING COUNT(*) > 100) GROUP BY Continent)`
  pool.query(sql, (err, result) => {
    if (err) {
      console.log(err);
    }
    console.log("\nfind_country_count results: ");
    for (let ii = 0; ii < result.length; ii++) {
      console.log(`${result[ii].Name.padEnd(20)} ${result[ii].LifeExpectancy}\
      ${result[ii].Continent}`);
    }
  })
}

app.get('/getDiffLang', (req, res) => {
    var country1 = req.query.country1;
    var country2 = req.query.country2;
    diff_lang(country1, country2 , (result) => {
      const jsonResult = JSON.stringify(result);
      res.send(jsonResult);
    });
});


app.get('/getDiffLangJoin', (req, res) => {
    var country1 = req.query.country1;
    var country2 = req.query.country2;
    diff_lang_join(country1, country2 , (result) => {
      const jsonResult = JSON.stringify(result);
      res.send(jsonResult);
    });
});


app.get('/aggregateCountries', (req, res) => {
  var agg_type = req.query.agg_type;
  var country_name = req.query.country_name;
  aggregate_countries(agg_type, country_name , (result) => {
    const jsonResult = JSON.stringify(result);
    res.send(jsonResult);
  });
});

contains("AFK", "countryCode", "city", (result) => {
  console.log("\ncontains results 01: ");
  console.log(result);
});
contains("AFG", "countryCode", "city", (result) => {
  console.log("\ncontains results 02: ");
  console.log(result);
});

find_min_max_continent();
find_country_languages(85, "Turkish");
find_country_count(100);

diff_lang("Turkey", "United Arab Emirates", (result) => {
  console.log("\ndiff_lang results 01: ");
  for (let ii = 0; ii < result.length; ii++) {
    console.log(`${result[ii].Language}`);
  }
});

diff_lang("Turkey", "United Kingdom", (result) => {
  console.log("\ndiff_lang results 02: ");
  for (let ii = 0; ii < result.length; ii++) {
    console.log(`${result[ii].Language}`);
  }
});

diff_lang_join("Turkey", "United Arab Emirates", (result) => {
  console.log("\ndiff_lang_join results 01: ");
  for (let ii = 0; ii < result.length; ii++) {
    console.log(`${result[ii].Language}`);
  }
});

diff_lang_join("Turkey", "United Kingdom", (result) => {
  console.log("\ndiff_lang_join results 02: ");
  for (let ii = 0; ii < result.length; ii++) {
    console.log(`${result[ii].Language}`);
  }
});

aggregate_countries("AVG", "Turkey", (result) => {
  console.log("\naggregate_countries results 01: ");
  console.log("printing up to 5 rows... ");
  let bound = 0;
  if (result.length >=  5) {
    bound = 5;
  } 
  else {
    bound = result.length;
  }
  for (let ii = 0; ii < bound; ii++) {
    console.log(`${result[ii].Name.padEnd(50)} ${result[ii].LifeExpectancy}
${result[ii].GovernmentForm.padEnd(50)} ${result[ii].Language.padEnd(10)}`);
  }
})

aggregate_countries("MIN", "France", (result) => {
  console.log("\naggregate_countries results 02: ");
  console.log("printing up to 5 rows... ");
  let bound = 0;
  if (result.length >=  5) {
    bound = 5;
  } 
  else {
    bound = result.length;
  }
  for (let ii = 0; ii < bound; ii++) {
    console.log(`${result[ii].Name.padEnd(50)} ${result[ii].LifeExpectancy}
${result[ii].GovernmentForm.padEnd(50)} ${result[ii].Language.padEnd(10)}`);
  }
})

app.listen('3000', () => {
  console.log('Server started on port 3000');
});