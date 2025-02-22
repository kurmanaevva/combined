import express from "express";
import path from "path";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import qr from "qr-image";
import fs from "fs";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { UserCollection, BlogCollection } from "./config.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 50055;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect("/login");
});

// Signup Page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Signup Logic
app.post("/signup", async (req, res) => {
    const data = { name: req.body.username, password: req.body.password };

    const existingUser = await UserCollection.findOne({ name: data.name });
    if (existingUser) {
        return res.send("User already exists. Please choose another username.");
    }

    data.password = await bcrypt.hash(data.password, 10);
    await UserCollection.create(data);

    console.log("User registered:", data);
    res.redirect("/login");
});

// Login Page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login Logic
app.post("/login", async (req, res) => {
    try {
        const user = await UserCollection.findOne({ name: req.body.username });
        if (!user) return res.send("Username not found");

        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
        if (isPasswordMatch) res.redirect("/home");
        else res.send("Wrong password");
    } catch {
        res.send("Invalid Details");
    }
});

// Home Page
app.get("/home", (req, res) => {
    res.render("home");
});

// BMI Page
app.get("/bmi", (req, res) => {
    res.render("bmi", { bmi: null, category: null });
});

// BMI Calculation Logic
app.post("/calculate-bmi", (req, res) => {
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);

    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
        return res.render("bmi", { bmi: "Invalid input", category: "Please enter positive numbers." });
    }

    const bmi = weight / (height * height);
    let category = '';

    if (bmi < 18.5) {
        category = 'Underweight';
    } else if (bmi >= 18.5 && bmi < 24.9) {
        category = 'Normal weight';
    } else if (bmi >= 25 && bmi < 29.9) {
        category = 'Overweight';
    } else {
        category = 'Obese';
    }

    res.render("bmi", { bmi: bmi.toFixed(2), category });
});

// QR Code Page
app.get("/qr", (req, res) => {
    res.render("qr", { qrImage: null });
});

// QR Code Generator
app.post("/generate-qr", (req, res) => {
    const url = req.body.url;

    if (!url) {
        return res.render("qr", { qrImage: null });
    }

    const qrImage = qr.imageSync(url, { type: 'png' });
    const qrBase64 = qrImage.toString('base64');

    res.render("qr", { qrImage: qrBase64 });
});

app.get("/nodemailer", (req, res) => {
    res.render("nodemailer", { message: null });
});

// Email Sending Logic
app.post("/send-email", async (req, res) => {
    const { recipient, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,  
        secure: true, 
        auth: { 
            user: 'kurmanaeva27@gmail.com',  
            pass: 'pxhf mmeu qbna jvds',    
        },
    });

    const mailOptions = {
        from: 'kurmanaeva27@gmail.com',
        to: recipient,
        subject: subject,
        text: message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.render("nodemailer", { message: "Email sent successfully!" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.render("nodemailer", { message: "Error sending email. Please try again." });
    }
});

// CRUD Blog Routes 
app.get("/crud", (req, res) => {
    res.render("crud");
});

app.post('/blogs', async (req, res) => res.json(await BlogCollection.create(req.body)));
app.get('/blogs', async (req, res) => res.json(await BlogCollection.find()));
app.get('/blogs/:id', async (req, res) => res.json(await BlogCollection.findById(req.params.id) || { error: "Blog not found" }));
app.put('/blogs/:id', async (req, res) => res.json(await BlogCollection.findByIdAndUpdate(req.params.id, req.body, { new: true }) || { error: "Blog not found" }));
app.delete('/blogs/:id', async (req, res) => res.json(await BlogCollection.findByIdAndDelete(req.params.id) || { error: "Blog not found" }));


// Weather API Page
app.get("/weather", (req, res) => {
    res.render("weather", { weatherData: null });
});

// Weather API Route
app.get("/weather-data", async (req, res) => {
    const place = req.query.place || "Unknown";
    const openWeatherApiKey = "62cd3dd6b4b3782fbe2cd03837b17264";
    const weatherApiKey = "74649c0d1c4840d99a9173513251501";
    const weatherbitApiKey = "439314b0636a43d4be0b662b4243e1e4";

    const openWeatherAPIUrl = `https://api.openweathermap.org/data/2.5/weather?q=${place}&units=metric&appid=${openWeatherApiKey}`;
    const weatherAPIUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${place}`;

    try {
        const weatherResponse = await fetch(openWeatherAPIUrl);
        if (!weatherResponse.ok) throw new Error("City not found or OpenWeather API error");
        const weatherData = await weatherResponse.json();

        const timeResponse = await fetch(weatherAPIUrl);
        if (!timeResponse.ok) throw new Error("City not found or WeatherAPI error");
        const timeData = await timeResponse.json();

        const { lat, lon } = weatherData.coord;
        const weatherbitAPIUrl = `https://api.weatherbit.io/v2.0/current/airquality?lat=${lat}&lon=${lon}&key=${weatherbitApiKey}`;

        const airQualityResponse = await fetch(weatherbitAPIUrl);
        if (!airQualityResponse.ok) throw new Error("Air Quality data not available");
        const airQualityData = await airQualityResponse.json();

        const iconUrl = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

        res.json({
            place: place.toUpperCase(),
            temperature: weatherData.main.temp,
            feels_like: weatherData.main.feels_like,
            description: weatherData.weather[0].description,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            wind_speed: weatherData.wind.speed,
            country: weatherData.sys.country,
            rain: weatherData.rain ? weatherData.rain["3h"] : "No data",
            local_time: timeData.location.localtime,
            air_quality: {
                pm25: airQualityData.data[0].pm25,
                pm10: airQualityData.data[0].pm10,
                o3: airQualityData.data[0].o3,
                no2: airQualityData.data[0].no2,
                so2: airQualityData.data[0].so2,
                co: airQualityData.data[0].co,
            },
            icon_url: iconUrl,
            coordinates: {
                lat: lat,
                lon: lon,
            },
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
