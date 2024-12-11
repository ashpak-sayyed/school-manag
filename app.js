require('dotenv').config()
const express = require("express");
const app = express();
const path = require("path");
app.use(express.urlencoded({ extended: true }));
const mysql = require("mysql2");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const port = process.env.PORT || 4000;

// create connection.
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,      
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME 
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL:", err.message);
        return;
    }
    console.log("Connected to MySQL database!");
});


// Configure the views directory and view engine
app.set("views", path.join(__dirname, "views")); // The "views" directory is set here
app.set("view engine", "ejs");


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

app.get("/addSchool", (req, res) => {
    res.render("listing.ejs");
});

app.post("/school" , (req,res) => { 
    let {name , address , latitude , longitude} = req.body;
    const query = "INSERT INTO schools (name , address , latitude , longitude) VALUES (? , ? , ? , ?)";
    connection.query(query, [name, address , latitude , longitude], (err, results) => {
        if (err) {
            console.error("Error inserting data:", err.message);
            res.status(500).send("Failed to insert data");
            return;
        }
        res.status(200).send("Data added successfully!");
    });
});



app.get("/listSchools" , (req,res) => { 
    let {latitude , longitude} = req.query;

    if (!latitude || !longitude) {
        return res.status(400).send('Latitude and longitude are required');
    }

    const query = 'SELECT * FROM schools';

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching schools');
        }

        const schoolsWithDistance = results.map((school) => {
            const distance = calculateDistance(
                latitude,
                longitude,
                school.latitude,
                school.longitude
            );
            return { ...school, distance };
        });

        const sortedSchools = schoolsWithDistance.sort((a, b) => a.distance - b.distance);
        res.render('listSchools', { schools: sortedSchools });
    });

});



app.get('/showSchool', (req, res) => {
    const sqlQuery = 'SELECT * FROM schools';

    connection.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return res.status(500).send('Server Error');
        }
        res.json(results);
    });
});

// Start the server
app.listen(port, () => {
    console.log("Server is running on port 3000");
});
