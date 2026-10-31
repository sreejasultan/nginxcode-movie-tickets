
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const bookings = new Map();

function getBooked(key) {
    if (!bookings.has(key)) {
        bookings.set(key, new Set());
    }
    return bookings.get(key);
}

function broadcastSeats(key) {
    io.emit("seats", {
        key,
        booked: [...getBooked(key)]
    });
}

io.on("connection", (socket) => {

    socket.on("getSeats", (key) => {
        socket.emit("seats", {
            key,
            booked: [...getBooked(key)]
        });
    });

    socket.on("bookSeats", (data) => {
        const { key, seats } = data || {};

        if (
            typeof key !== "string" ||
            !Array.isArray(seats) ||
            seats.length === 0 ||
            seats.length > 40 ||
            !seats.every(s => /^S([1-9]|[1-3][0-9]|40)$/.test(s)) ||
            new Set(seats).size !== seats.length
        ) {
            socket.emit("bookingResult", {
                success: false,
                message: "Invalid booking request."
            });
            return;
        }

        const booked = getBooked(key);

        if (seats.some(seat => booked.has(seat))) {
            socket.emit("bookingResult", {
                success: false,
                message: "Some seats are already booked. Please select again."
            });
            broadcastSeats(key);
            return;
        }

        seats.forEach(seat => booked.add(seat));

        socket.emit("bookingResult", {
            success: true,
            seats
        });

        broadcastSeats(key);
    });

});

app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});

server.listen(3000, "0.0.0.0", () => {
    console.log("Movie booking server running on port 3000");
});
