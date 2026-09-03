const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W, H;

function resize() {
	W = canvas.width = window.innerWidth;
	H = canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

const keys = {};

let running = false;
let paused = false;

let score = 0;
let highScore =
Number(localStorage.getItem("cellRunnerHighScore")) || 0;

let glucose = 0;
let oxygen = 0;
let atp = 0;

let health = 100;
let energy = 100;

let elapsed = 0;
let lastTime = 0;
let spawnTimer = 0;
let messageTimer = 0;

let immuneActive = false;
let immuneTime = 0;
let immuneCooldown = 15;
let immuneSpawnTimer = 0;

const player = {
	x: 0,
	y: 0,
	r: 23,
	speed: 200,
	angle: 0
};

let resources = [];
let viruses = [];
let particles = [];
let floatingTexts = [];
let immuneOrb = null;

document.getElementById("highScore").textContent = highScore;
document.getElementById("startHighScore").textContent = highScore;

function randomPosition() {

	return {
		x: 50 + Math.random() * (W - 100),
		y: 120 + Math.random() * (H - 170)
	};

}

function createResource(type) {

	let p = randomPosition();

	resources.push({
		x: p.x,
		y: p.y,
		r: 12,
		type,
		pulse: Math.random() * 6
	});

}

function createVirus() {

	let side = Math.floor(Math.random() * 4);

	let x, y;

	if (side === 0) {
		x = -40;
		y = Math.random() * H;
	}

	if (side === 1) {
		x = W + 40;
		y = Math.random() * H;
	}

	if (side === 2) {
		x = Math.random() * W;
		y = -40;
	}

	if (side === 3) {
		x = Math.random() * W;
		y = H + 40;
	}

	viruses.push({
		x,
		y,
		r: 18,
		speed: 80 + Math.random() * 25 + elapsed * .65,
		angle: 0
	});

}

function spawnImmuneOrb() {

	let p = randomPosition();

	immuneOrb = {
		x: p.x,
		y: p.y,
		r: 18,
		pulse: 0,
		life: 8
	};

	showMessage("🛡️ IMMUNE ORB APPEARED!");

}

function activateImmuneMode() {

	immuneActive = true;
	immuneTime = 5;

	immuneOrb = null;

	showMessage("🛡️ IMMUNE MODE ACTIVE!");

	particlesAt(
		player.x,
		player.y
	);

}

function endImmuneMode() {

	immuneActive = false;
	immuneTime = 0;

	showMessage("IMMUNE MODE ENDED");

}

function resetGame() {

	score = 0;
	glucose = 0;
	oxygen = 0;
	atp = 0;

	health = 100;
	energy = 100;

	elapsed = 0;
	spawnTimer = 0;
	immuneCooldown = 15;
	immuneSpawnTimer = 0;

	immuneActive = false;
	immuneTime = 0;

	resources = [];
	viruses = [];
	particles = [];
	floatingTexts = [];
	immuneOrb = null;

	player.x = W / 2;
	player.y = H / 2;

	for (let i = 0; i < 5; i++) {
		createResource("glucose");
		createResource("oxygen");
	}

	for (let i = 0; i < 3; i++) {
		createVirus();
	}

	updateHUD();

}

function startGame() {

	resetGame();

	running = true;
	paused = false;

	document.getElementById("startScreen").classList.add("hidden");
	document.getElementById("gameOver").classList.add("hidden");
	document.getElementById("pauseScreen").classList.add("hidden");

	lastTime = performance.now();

	requestAnimationFrame(gameLoop);

}

function endGame() {

	running = false;

	let finalPoints = Math.floor(score);

	if (finalPoints > highScore) {

		highScore = finalPoints;

		localStorage.setItem(
			"cellRunnerHighScore",
			highScore
		);

	}

	document.getElementById("finalScore").textContent =
		finalPoints;

	document.getElementById("finalHighScore").textContent =
		highScore;

	document.getElementById("highScore").textContent =
		highScore;

	document.getElementById("startHighScore").textContent =
		highScore;

	document.getElementById("gameOver").classList.remove("hidden");

}

function updateHUD() {

	document.getElementById("score").textContent =
		Math.floor(score);

	document.getElementById("highScore").textContent =
		highScore;

	document.getElementById("health").style.width =
		Math.max(0, health) + "%";

	document.getElementById("energy").style.width =
		Math.max(0, energy) + "%";

	const timer = document.getElementById("immuneTimer");

	if (immuneActive) {

		timer.style.opacity = 1;

		document.getElementById("immuneTime").textContent =
			Math.ceil(immuneTime);

	} else {

		timer.style.opacity = 0;

	}

}

function showMessage(text) {

	const el = document.getElementById("message");

	el.textContent = text;
	el.style.opacity = 1;

	messageTimer = 1.4;

}

function addText(x, y, text) {

	floatingTexts.push({
		x,
		y,
		text,
		life: 1
	});

}

function particlesAt(x, y) {

	for (let i = 0; i < 10; i++) {

		particles.push({
			x,
			y,
			vx: (Math.random() - .5) * 140,
			vy: (Math.random() - .5) * 140,
			life: 1,
			r: Math.random() * 4 + 2
		});

	}

}

function update(dt) {

	elapsed += dt;

	let dx = 0;
	let dy = 0;

	if (keys["w"] || keys["ArrowUp"]) dy--;
	if (keys["s"] || keys["ArrowDown"]) dy++;
	if (keys["a"] || keys["ArrowLeft"]) dx--;
	if (keys["d"] || keys["ArrowRight"]) dx++;

	if (dx || dy) {

		let length = Math.hypot(dx, dy);

		dx /= length;
		dy /= length;

		let boost = 1;

		if (keys[" "] && energy > 0) {

			boost = 1.8;
			energy -= 38 * dt;

		} else {

			energy += 15 * dt;

		}

		player.x += dx * player.speed * boost * dt;
		player.y += dy * player.speed * boost * dt;

		player.angle = Math.atan2(dy, dx);

	} else {

		energy += 20 * dt;

	}

	energy = Math.min(100, energy);

	player.x = Math.max(
		player.r,
		Math.min(W - player.r, player.x)
	);

	player.y = Math.max(
		90 + player.r,
		Math.min(H - player.r, player.y)
	);

	score += 5 * dt;

	spawnTimer += dt;

	if (spawnTimer > 1.2) {

		spawnTimer = 0;

		createResource(
			Math.random() < .5 ? "glucose" : "oxygen"
		);

	}

	immuneSpawnTimer += dt;

	if (
		!immuneOrb &&
		!immuneActive &&
		immuneSpawnTimer >= immuneCooldown
	) {

		immuneSpawnTimer = 0;
		spawnImmuneOrb();

	}

	if (immuneOrb) {

		immuneOrb.pulse += dt * 5;
		immuneOrb.life -= dt;

		if (immuneOrb.life <= 0) {

			immuneOrb = null;

			showMessage("The immune orb disappeared.");

		}

	}

	if (immuneOrb) {

		let distance = Math.hypot(
			player.x - immuneOrb.x,
			player.y - immuneOrb.y
		);

		if (distance < player.r + immuneOrb.r) {

			activateImmuneMode();

		}

	}

	if (immuneActive) {

		immuneTime -= dt;

		if (immuneTime <= 0) {

			endImmuneMode();

		}

	}

	let interval = Math.max(
		.3,
		1.5 - elapsed * .015
	);

	if (Math.random() < dt / interval) {

		createVirus();

	}

	for (let i = resources.length - 1; i >= 0; i--) {

		let r = resources[i];

		r.pulse += dt * 4;

		let distance = Math.hypot(
			player.x - r.x,
			player.y - r.y
		);

		if (distance < player.r + r.r) {

			if (r.type === "glucose") {

				glucose++;
				energy = Math.min(100, energy + 12);
				score += 10;

				addText(r.x, r.y, "+10");

			} else {

				oxygen++;
				energy = Math.min(100, energy + 8);
				score += 10;

				addText(r.x, r.y, "+10");

			}

			particlesAt(r.x, r.y);

			resources.splice(i, 1);

		}

	}

	if (glucose >= 5 && oxygen >= 5) {

		glucose -= 5;
		oxygen -= 5;

		atp += 10;

		score += 100;

		showMessage("⚡ ATP PRODUCED +100");

	}

	for (let i = viruses.length - 1; i >= 0; i--) {

		let v = viruses[i];

		let dx = player.x - v.x;
		let dy = player.y - v.y;

		let distance = Math.hypot(dx, dy);

		if (distance > 0) {

			dx /= distance;
			dy /= distance;

		}

		v.x += dx * v.speed * dt;
		v.y += dy * v.speed * dt;

		v.angle = Math.atan2(dy, dx);

		if (
			immuneActive &&
			distance < player.r + v.r + 5
		) {

			score += 100;

			addText(v.x, v.y, "+100");

			particlesAt(v.x, v.y);

			viruses.splice(i, 1);

			continue;

		}

		if (
			!immuneActive &&
			distance < player.r + v.r
		) {

			health -= 25 * dt;

			particlesAt(
				player.x,
				player.y
			);

		}

	}

	for (let i = particles.length - 1; i >= 0; i--) {

		let p = particles[i];

		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.life -= dt * 2;

		if (p.life <= 0) {
			particles.splice(i, 1);
		}

	}

	for (let i = floatingTexts.length - 1; i >= 0; i--) {

		let f = floatingTexts[i];

		f.y -= 35 * dt;
		f.life -= dt;

		if (f.life <= 0) {
			floatingTexts.splice(i, 1);
		}

	}

	if (messageTimer > 0) {

		messageTimer -= dt;

		if (messageTimer <= 0) {

			document.getElementById("message").style.opacity = 0;

		}

	}

	if (health <= 0) {

		health = 0;
		endGame();

	}

	updateHUD();

}

function drawBackground() {

	ctx.fillStyle = "#07131f";
	ctx.fillRect(0, 0, W, H);

	for (let i = 0; i < 20; i++) {

		let x = (i * 173) % W;
		let y = 100 + (i * 113) % (H - 100);
		let r = 25 + (i % 5) * 9;

		ctx.beginPath();

		ctx.arc(
			x,
			y,
			r,
			0,
			Math.PI * 2
		);

		ctx.strokeStyle = "rgba(120,220,255,.035)";
		ctx.lineWidth = 2;

		ctx.stroke();

	}

}

function drawResource(r) {

	let pulse = Math.sin(r.pulse) * 2;

	ctx.beginPath();

	ctx.arc(
		r.x,
		r.y,
		r.r + pulse,
		0,
		Math.PI * 2
	);

	ctx.fillStyle =
		r.type === "glucose"
			? "rgba(250,204,21,.18)"
			: "rgba(96,210,255,.18)";

	ctx.fill();

	ctx.beginPath();

	ctx.arc(
		r.x,
		r.y,
		r.r,
		0,
		Math.PI * 2
	);

	ctx.fillStyle =
		r.type === "glucose"
			? "#facc15"
			: "#60d5ff";

	ctx.fill();

	ctx.fillStyle = "#07131f";
	ctx.font = "bold 11px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillText(
		r.type === "glucose" ? "G" : "O",
		r.x,
		r.y
	);

}

function drawImmuneOrb() {

	if (!immuneOrb) return;

	let pulse = Math.sin(immuneOrb.pulse) * 4;

	ctx.save();

	ctx.shadowBlur = 25;
	ctx.shadowColor = "#8b5cf6";

	ctx.beginPath();

	ctx.arc(
		immuneOrb.x,
		immuneOrb.y,
		immuneOrb.r + 8 + pulse,
		0,
		Math.PI * 2
	);

	ctx.fillStyle = "rgba(139,92,246,.18)";
	ctx.fill();

	ctx.beginPath();

	ctx.arc(
		immuneOrb.x,
		immuneOrb.y,
		immuneOrb.r + pulse,
		0,
		Math.PI * 2
	);

	ctx.fillStyle = "#8b5cf6";
	ctx.fill();

	ctx.strokeStyle = "#ddd6fe";
	ctx.lineWidth = 3;
	ctx.stroke();

	ctx.shadowBlur = 0;

	ctx.fillStyle = "white";
	ctx.font = "bold 18px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	ctx.fillText(
		"✚",
		immuneOrb.x,
		immuneOrb.y
	);

	ctx.restore();

}

function drawVirus(v) {

	ctx.save();

	ctx.translate(v.x, v.y);
	ctx.rotate(v.angle);

	ctx.beginPath();

	ctx.arc(
		0,
		0,
		v.r,
		0,
		Math.PI * 2
	);

	ctx.fillStyle = "#e05270";

	ctx.fill();

	for (let i = 0; i < 8; i++) {

		let a = i * Math.PI / 4;

		ctx.beginPath();

		ctx.moveTo(
			Math.cos(a) * v.r,
			Math.sin(a) * v.r
		);

		ctx.lineTo(
			Math.cos(a) * (v.r + 7),
			Math.sin(a) * (v.r + 7)
		);

		ctx.strokeStyle = "#ff7890";
		ctx.lineWidth = 4;

		ctx.stroke();

	}

	ctx.fillStyle = "#541827";

	ctx.beginPath();

	ctx.arc(-6, -3, 3, 0, Math.PI * 2);
	ctx.arc(6, -3, 3, 0, Math.PI * 2);

	ctx.fill();

	ctx.restore();

}

function drawPlayer() {

	ctx.save();

	ctx.translate(player.x, player.y);

	let pulse = Math.sin(elapsed * 5) * 2;

	if (immuneActive) {

		ctx.beginPath();

		ctx.arc(
			0,
			0,
			player.r + 13 + pulse,
			0,
			Math.PI * 2
		);

		ctx.fillStyle = "rgba(139,92,246,.18)";
		ctx.fill();

		ctx.beginPath();

		ctx.arc(
			0,
			0,
			player.r + 8 + pulse,
			0,
			Math.PI * 2
		);

		ctx.strokeStyle = "#a78bfa";
		ctx.lineWidth = 3;

		ctx.stroke();

	}

	if (!immuneActive) {

		ctx.beginPath();

		ctx.arc(
			0,
			0,
			player.r + 7 + pulse,
			0,
			Math.PI * 2
		);

		ctx.fillStyle = "rgba(70,220,255,.1)";
		ctx.fill();

	}

	ctx.beginPath();

	ctx.arc(
		0,
		0,
		player.r,
		0,
		Math.PI * 2
	);

	ctx.fillStyle =
		immuneActive
			? "#a78bfa"
			: "#38c8df";

	ctx.fill();

	ctx.strokeStyle =
		immuneActive
			? "#ede9fe"
			: "#a5f3fc";

	ctx.lineWidth = 3;

	ctx.stroke();

	ctx.fillStyle =
		immuneActive
			? "#6d28d9"
			: "#087ea4";

	ctx.beginPath();

	ctx.arc(-6, -4, 5, 0, Math.PI * 2);
	ctx.arc(7, -3, 4, 0, Math.PI * 2);

	ctx.fill();

	if (immuneActive) {

		ctx.fillStyle = "white";
		ctx.font = "bold 13px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		ctx.fillText(
			"✚",
			0,
			7
		);

	} else {

		ctx.beginPath();

		ctx.arc(
			0,
			6,
			8,
			0,
			Math.PI
		);

		ctx.strokeStyle = "#075b75";
		ctx.lineWidth = 3;
		ctx.stroke();

	}

	ctx.restore();

}

function drawParticles() {

	for (let p of particles) {

		ctx.globalAlpha = Math.max(0, p.life);

		ctx.beginPath();

		ctx.arc(
			p.x,
			p.y,
			p.r,
			0,
			Math.PI * 2
		);

		ctx.fillStyle =
			immuneActive
				? "#c4b5fd"
				: "#7dd3fc";

		ctx.fill();

	}

	ctx.globalAlpha = 1;

}

function drawFloatingTexts() {

	ctx.font = "bold 14px Arial";
	ctx.textAlign = "center";

	for (let f of floatingTexts) {

		ctx.globalAlpha = Math.max(0, f.life);

		ctx.fillStyle = "white";

		ctx.fillText(
			f.text,
			f.x,
			f.y
		);

	}

	ctx.globalAlpha = 1;

}

function draw() {

	drawBackground();

	for (let r of resources) {
		drawResource(r);
	}

	drawImmuneOrb();

	for (let v of viruses) {
		drawVirus(v);
	}

	drawParticles();
	drawPlayer();
	drawFloatingTexts();

	ctx.fillStyle = "rgba(255,255,255,.4)";
	ctx.font = "12px Arial";
	ctx.textAlign = "left";

	ctx.fillText(
		Math.floor(elapsed) + "s",
		15,
		95
	);

}

function gameLoop(time) {

	if (!running) return;

	if (paused) {

		lastTime = time;

		requestAnimationFrame(gameLoop);

		return;

	}

	let dt = (time - lastTime) / 1000;

	lastTime = time;

	dt = Math.min(dt, .05);

	update(dt);
	draw();

	if (running) {
		requestAnimationFrame(gameLoop);
	}

}

function togglePause() {

	if (!running) return;

	paused = !paused;

	document
		.getElementById("pauseScreen")
		.classList.toggle("hidden", !paused);

}

window.addEventListener("keydown", e => {

	keys[e.key] = true;

	if (e.key === "p" || e.key === "P") {
		togglePause();
	}

	if (
		[
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight",
			" "
		].includes(e.key)
	) {
		e.preventDefault();
	}

});

window.addEventListener("keyup", e => {
	keys[e.key] = false;
});

document
	.querySelectorAll(".mobileButton")
	.forEach(button => {

		let key = button.dataset.key;

		button.addEventListener("touchstart", e => {
			e.preventDefault();
			keys[key] = true;
		});

		button.addEventListener("touchend", e => {
			e.preventDefault();
			keys[key] = false;
		});

		button.addEventListener("mousedown", () => {
			keys[key] = true;
		});

		button.addEventListener("mouseup", () => {
			keys[key] = false;
		});

		button.addEventListener("mouseleave", () => {
			keys[key] = false;
		});

	});

document
	.getElementById("startButton")
	.addEventListener("click", startGame);

document
	.getElementById("restartButton")
	.addEventListener("click", startGame);

document
	.getElementById("pauseButton")
	.addEventListener("click", togglePause);

document
	.getElementById("resumeButton")
	.addEventListener("click", togglePause);

updateHUD();