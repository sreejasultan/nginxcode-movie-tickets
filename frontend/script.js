
const socket = io();

const seatContainer = document.getElementById("seats");
const movie = document.getElementById("movie");
const show = document.getElementById("show");
const count = document.getElementById("count");
const total = document.getElementById("total");
const message = document.getElementById("message");
const bookBtn = document.getElementById("bookBtn");

const price = 150;
let selectedSeats = new Set();
let bookedSeats = new Set();
let currentKey = "";

function getKey() {
    return `${movie.value}_${show.value}`;
}

function loadSeats() {
    currentKey = getKey();
    selectedSeats.clear();
    count.textContent = 0;
    total.textContent = 0;
    message.textContent = "";
    socket.emit("getSeats", currentKey);
}

function renderSeats() {
    seatContainer.innerHTML = "";

    for (let i = 1; i <= 40; i++) {
        const seat = "S" + i;
        const button = document.createElement("button");

        button.textContent = seat;
        button.className = "seat";

        if (bookedSeats.has(seat)) {
            button.classList.add("booked");
            button.disabled = true;
        } else if (selectedSeats.has(seat)) {
            button.classList.add("selected");
        }

        button.onclick = () => {
            if (selectedSeats.has(seat)) {
                selectedSeats.delete(seat);
            } else {
                selectedSeats.add(seat);
            }
            renderSeats();
            updateSummary();
        };

        seatContainer.appendChild(button);
    }
}

function updateSummary() {
    count.textContent = selectedSeats.size;
    total.textContent = selectedSeats.size * price;
}

socket.on("connect", () => {
    document.getElementById("connection").textContent =
        "🟢 Live connection active";
    loadSeats();
});

socket.on("disconnect", () => {
    document.getElementById("connection").textContent =
        "🔴 Disconnected - reconnecting...";
});

socket.on("seats", (data) => {
    if (data.key !== currentKey) return;
    bookedSeats = new Set(data.booked);
    selectedSeats.forEach(seat => {
        if (bookedSeats.has(seat)) selectedSeats.delete(seat);
    });
    renderSeats();
    updateSummary();
});

socket.on("bookingResult", (result) => {
    if (!result.success) {
        message.textContent = result.message;
        return;
    }

    message.textContent = "Booking successful! Seats: " +
        result.seats.join(", ");

    selectedSeats.clear();
    socket.emit("getSeats", currentKey);
});

bookBtn.onclick = () => {
    if (selectedSeats.size === 0) {
        message.textContent = "Please select at least one seat.";
        return;
    }

    bookBtn.disabled = true;

    socket.emit("bookSeats", {
        key: currentKey,
        seats: [...selectedSeats]
    });

    setTimeout(() => {
        bookBtn.disabled = false;
    }, 1000);
};

movie.addEventListener("change", loadSeats);
show.addEventListener("change", loadSeats);
