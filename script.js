// Canvas Configuration
var canvas = document.getElementById("mainCanvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext("2d");
c.lineWidth = 10;
c.shadowColor = "black";

// Utilities
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function vectorSize(x, y) {
    return Math.sqrt(x * x + y * y);
}
        
function unitVector(x, y) {
const magnitude = vectorSize(x, y);
    // We need to return a vector here, so we return an array of coordinates:
    return [x / magnitude, y / magnitude]; 
}

function getDistancePoints(x0, y0, x1, y1) {
    let diffX = x1-x0;
    let diffY = y1-y0;
    return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
}

function detectCricleCircleCollision(x0, y0, x1, y1, radius0, radius1) {
    let diffX = x1-x0;
    let diffY = y1-y0;
    let distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    return distance < radius0+radius1;
}

function detectCircleLineCollision(x0, y0, x1, y1, px, py, radius) {
    // Vector de la línea
    const dx = x1 - x0;
    const dy = y1 - y0;

    // Longitud del segmento de la línea
    const segmentLength = Math.sqrt(dx ** 2 + dy ** 2);
    if (segmentLength === 0) {
        // El segmento es solo un punto
        const distanceToPoint = Math.sqrt((px - x0) ** 2 + (py - y0) ** 2);
        return {
            collision: distanceToPoint <= radius,
            vertexCollision: true
        };
    }

    // Proyección del punto sobre la línea (parámetro t)
    let t = ((px - x0) * dx + (py - y0) * dy) / (segmentLength ** 2);
    t = Math.max(0, Math.min(1, t)); // Restringir t entre 0 y 1 para asegurarse de que estamos dentro del segmento

    // Coordenadas del punto proyectado
    const closestX = x0 + t * dx;
    const closestY = y0 + t * dy;

    // Calcular la distancia desde el punto al círculo
    const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

    // Verificar si la distancia es menor o igual al radio del círculo
    const collision = distance <= radius;

    // Verificar si el punto más cercano coincide con uno de los extremos
    const vertexCollision = (closestX === x0 && closestY === y0) || (closestX === x1 && closestY === y1);

    return {
        collision,
        vertexCollision
    };
}

// Classes
class CordsPoint {
    static MAX_SPEED = 1;
    static ACCELERATION = 0.001;
    constructor(element) {
        this.x = 50; 
        this.y = 50;
        this.dx = 0;
        this.dy = 0;
        this.ele = element;
        this.updatePosition();
    }
    move() {
        let moveX = false;
        let moveY = false;
        // Get direction
        let varX = keyController.right-keyController.left;
        let varY = keyController.down-keyController.up;

        // Aply friction
        this.dx*=FRICTION;
        this.dy*=FRICTION;

        // Set speed to 0 if speed is very low
        if (Math.abs(this.dx) < MIN_SPEED) this.dx = 0;
        if (Math.abs(this.dy) < MIN_SPEED) this.dy = 0;

        // Increase speed
        if (Math.abs(this.dx) < MAX_SPEED) {
            this.dx += ACCELERATION*varX;
        }
        if (Math.abs(this.dy) < MAX_SPEED) {
            this.dy += ACCELERATION*varY;
        }
        // Move if is possible
        if (this.canMoveX(this.dx)) {
            moveX = true;
            this.x += this.dx;
        }
        if (this.canMoveY(this.dy)) {
            moveY = true;
            this.y += this.dy;
        }
        this.updatePosition();
        return {MOVEX: moveX, MOVEY: moveY, DXR: this.dx, DYR: this.dy};
    }

    unmove(dxu, dyu, revx, revy) {
        this.x -= dxu;
        this.y -= dyu;
        this.dx *= revx;
        this.dy *= revy;
    }

    canMoveX(xVar) {
        if (this.x < 100 && this.x > 0) return true;
        else if (this.x >= 100 && xVar < 0) return true;
        else if (this.x <= 0 && xVar > 0) return true;
        else return false;
    }
    canMoveY(yVar) {
        if (this.y < 100 && this.y > 0) return true;
        else if (this.y >= 100 && yVar < 0) return true;
        else if (this.y <= 0 && yVar > 0) return true;
        else return false;
    }
    updatePosition() {
        this.ele.style.left = this.x+"%";
        this.ele.style.top = this.y+"%";
    }
}

class Wall{
    constructor(x0, y0, x1, y1, horizontal) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.horizontal = horizontal;
        this.lives = 10;
    }

    move(dx, dy) {
        this.x0 += dx;
        this.y0 += dy;
        this.x1 += dx;
        this.y1 += dy;
        if (this.inScreen()) {
            this.printInScreen()
        }
    }

    inScreen() {
        if ((this.x0 > pos00x && this.x0 < window.innerWidth+pos00x && this.y0 > pos00y && this.y0 < window.innerHeight+pos00y)
            || (this.x1 > pos00x && this.x1 < window.innerWidth+pos00x && this.y1 > pos00y && this.y1 < window.innerHeight+pos00y)
            || (this.x0 > pos00x && this.x0 < window.innerWidth+pos00x && this.y0 < pos00y && this.y1 > window.innerHeight+pos00y)
            || (this.x0 < pos00x && this.x1 > window.innerWidth+pos00x && this.y0 > pos00y && this.y0 < window.innerHeight+pos00y)) {
                return true;
            }
        else {
            return false;
        }
    }

    printInScreen() {
        c.beginPath();
        c.moveTo(this.x0-pos00x, this.y0-pos00y);
        c.lineTo(this.x1-pos00x, this.y1-pos00y);
        c.stroke();
    }
}

class Canon{
    constructor(){
        this.bulletSize = 15;
        this.bulletArray = [];
        this.bulletRange = 60;
        this.bulletSpeed = 7;
        this.intervalShooting = 1000; // in milliseconds
        this.lastShoot = performance.now()-this.intervalShooting;
    }
    shoot(ex, ey) {
        if (performance.now()-this.lastShoot > this.intervalShooting) {
            let varXPos = ex - window.innerWidth/2;
            let varYPos = ey - window.innerHeight/2;
            let unitaryVect = unitVector(varXPos, varYPos);
            this.bulletArray.push(new Bullet(unitaryVect[0], unitaryVect[1], this.bulletSize, this.bulletSpeed, window.innerWidth/2, window.innerHeight/2, this.bulletRange));
            this.lastShoot = performance.now();
        }
    }
}

class Bullet{
    constructor(dirX, dirY, radius, bulletSpeed, iniX, iniY, rangeBullet) {
        this.x = iniX;
        this.y = iniY;
        this.radius = radius;
        this.directionX = dirX*bulletSpeed;
        this.directionY = dirY*bulletSpeed;
        this.counterIterations = rangeBullet;
    }
    update() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        c.fill();
    }
    move(extraX, extraY){
        this.x += (this.directionX+extraX);
        this.y += (this.directionY+extraY);
        --this.counterIterations;
        this.update();
    }
}

class Enemy{
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.config = enemyConfiguration[type];
        this.lives = this.config.lives;
        this.iniLives = this.config.lives;
        this.lastShoot = performance.now();
        this.baseImage = new Image();
        this.baseImage.src = this.config.imgSrc;
    }
    inScreen(){
        if (this.x-pos00x > -this.config.radius
            && this.x-pos00x < window.innerWidth+this.config.radius
            && this.y-pos00y > -this.config.radius
            && this.y-pos00y < window.innerHeight+this.config.radius
        ) {
            return true;
        }
        else {
            return false;
        }
    }
    printInScreen(){
        // print enemy
        c.drawImage(this.baseImage, this.x-pos00x-this.config.radius, this.y-pos00y-this.config.radius,
            this.config.radius*2, this.config.radius*2);
        // print lives rectangle
        let startX = this.x-pos00x-this.config.radius;
        let startY = this.y-pos00y+this.config.radius+5; // the +5px is a small margin between the enemy and the lives rectangle
        c.beginPath();
        c.rect(startX, startY, 2*this.config.radius, 10); // 20 is the height of the lives rectangle
        c.stroke();

        // lives
        c.beginPath();
        c.rect(startX, startY, 2*this.config.radius*(this.lives/this.iniLives), 10); // 10 is the height of the lives rectangle
        c.fill();
    }
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        if (this.inScreen()) {
            this.printInScreen();
        }
    }
    shootEnemy() {
        let varX = window.innerWidth/2 - (this.x - pos00x);
        let varY = window.innerHeight/2 - (this.y - pos00y);
        let unitaryVect = unitVector(varX, varY);
        bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                        this.x - pos00x, this.y - pos00y, this.config.bRange));
        this.lastShoot = performance.now();
    }
    tryShoot() {
        if (getDistancePoints(this.x-pos00x, this.y-pos00y, window.innerWidth/2, window.innerHeight/2) < 1500
            && performance.now() - this.lastShoot > this.config.intervalShooting) {
            this.shootEnemy();
        }
    }
}

class RectangleLives{
    constructor(lives) {
        this.lives = lives;
        this.iniLives = lives;
    }
    printLives(){
        c.save();
        c.lineWidth = 4;
        c.strokeStyle = "rgb(128, 247, 128)";
        c.fillStyle = "rgb(128, 247, 128)";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 20, window.innerWidth*2/16, 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.stroke();
        c.lineWidth = "0";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 20, (window.innerWidth*2/16)*(this.lives/this.iniLives), 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.fill();
        c.restore();
    }
    reduceLives(amount){
        this.lives-=amount;
        if (this.lives <= 0) {
            endGame = true;
            alert("Game Over!");
        }
    }
    increaseLives(amount){
        if (this.lives+amount <= this.iniLives) {
            this.lives += amount;
        }
        else {
            this.lives = this.iniLives;
        }
    }
}


// General Configuration

var enemyConfiguration = {
    "basic":{
        lives: 5,
        intervalShooting: 1000,
        bulletSize: 15,
        bRange: 200,
        radius: 40,
        radiusBullets: 15,
        bulletEnemySpeed: 5,
        imgSrc: "basicEnemy.png"
    }
}

var enemies = [];
var bulletsEnemies = [];

const MAX_SPEED = 0.075;
const ACCELERATION = 0.0075;
const FRICTION = 0.98;
const MIN_SPEED = 0.001;

const RADIUS_TANK = 40; // in pixels
// do not change this value, it's an aproximation of the radius of image baseTank.png

const SCREEN_CENTER = {
    x: window.innerWidth/2,
    y: window.innerHeight/2
}

// Global variables

var endGame = false;

const myPoint = new CordsPoint(document.getElementById("point"));

const centerUser = document.getElementById("centerUser");

var rectLives = new RectangleLives(5);

var mouseX = window.innerWidth/2;
var mouseY = window.innerHeight/2;

var keyController = {
    up: false,
    down: false,
    right: false,
    left: false
}

const OPTIONS = {
    MAP_SIZE: 100, // map size in pixels = 100*MAP_SIZE
    NUM_WALLS: 250,
    WALL_SIZE: 1000
}

const ENEMY_OPTIONS = {
    NUM_ENEMIES: 20
}

var mainCanon = new Canon();

var pos00x = (OPTIONS.MAP_SIZE*100-window.innerWidth)/2;
var pos00y = (OPTIONS.MAP_SIZE*100-window.innerHeight)/2;

// Main event Listeners
window.addEventListener("mousemove", function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
})

window.addEventListener("keydown", e => {
    if (e.key == "ArrowUp" || e.key == "w") keyController.up = true;
    else if (e.key == "ArrowDown" || e.key == "s") keyController.down = true;
    else if (e.key == "ArrowRight" || e.key == "d") keyController.right = true;
    else if (e.key == "ArrowLeft" || e.key == "a") keyController.left = true;
    console.log(e.key)
})
window.addEventListener("keyup", e => {
    if (e.key == "ArrowUp" || e.key == "w") keyController.up = false;
    else if (e.key == "ArrowDown" || e.key == "s") keyController.down = false;
    else if (e.key == "ArrowRight" || e.key == "d") keyController.right = false;
    else if (e.key == "ArrowLeft" || e.key == "a") keyController.left = false;
})

window.addEventListener("mousedown", (e) => {
    mainCanon.shoot(e.clientX, e.clientY);
})

// Create Walls

var walls = [];
for (let i = 0; i < OPTIONS.NUM_WALLS; ++i) {
    let magnitude = 100*OPTIONS.MAP_SIZE;
    let posX0 = (randomIntFromInterval(0, 20)/20)*magnitude;
    let posY0 = (randomIntFromInterval(0, 20)/20)*magnitude;
    // half vertical half horizontal
    if (i < OPTIONS.NUM_WALLS/2) { // vertical
        if (detectCircleLineCollision(posX0, posY0, posX0, posY0+OPTIONS.WALL_SIZE, window.innerWidth / 2 + pos00x, window.innerHeight / 2 + pos00y, RADIUS_TANK).collision) --i;
        else {
            walls.push(new Wall(posX0, posY0, posX0, posY0+OPTIONS.WALL_SIZE, false));
        }
    }
    else { // horizontal
        if (detectCircleLineCollision(posX0, posY0, posX0+OPTIONS.WALL_SIZE, posY0, window.innerWidth / 2 + pos00x, window.innerHeight / 2 + pos00y, RADIUS_TANK).collision) --i;
        else {
            walls.push(new Wall(posX0, posY0, posX0+OPTIONS.WALL_SIZE, posY0, true));
        }
    }
}

// Create Enemies
for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES; ++i) {
    let posX0 = (randomIntFromInterval(0, 100*OPTIONS.MAP_SIZE));
    let posY0 = (randomIntFromInterval(0, 100*OPTIONS.MAP_SIZE));
    let typeE = "basic";
    let collisionDetected = false;
    for (let j = 0; j < walls.length; ++j) {
        if (detectCircleLineCollision(walls[j].x0, walls[j].y0, walls[j].x1, walls[j].y1, posX0, posY0, enemyConfiguration[typeE].radius).collision) {
            --i;
            collisionDetected = true;
            break;
        }
    }
    if (!collisionDetected) {
        enemies.push(new Enemy(posX0, posY0, typeE));
    }
}


// requestAnimationFrame recursive function

function movePoint(){
    centerUser.style.transform = `translate(-50%, -50%) rotate(${90+(180/Math.PI)*Math.atan2(mouseY - SCREEN_CENTER.y, mouseX - SCREEN_CENTER.x)}deg)`;

    let moves = myPoint.move();
    let mx = 0;
    let my = 0;
    if (moves.MOVEX) mx = -moves.DXR*100;
    if (moves.MOVEY) my = -moves.DYR*100;

    c.clearRect(0, 0, innerWidth, innerHeight);
    let px = window.innerWidth / 2 + pos00x;
    let py = window.innerHeight / 2 + pos00y;
    for (let i = 0; i < walls.length; ++i) {
        let resultCollision = detectCircleLineCollision(walls[i].x0+mx, walls[i].y0+my, walls[i].x1+mx, walls[i].y1+my, px, py, RADIUS_TANK);
        if (resultCollision.collision) {
            mx = 0;
            my = 0;
            let revx, revy;
            if (!resultCollision.vertexCollision) {
                if (walls[i].horizontal) {
                    revx = 1;
                    revy = -1;
                }
                else {
                    revx = -1;
                    revy = 1;
                }
            }
            else {
                revx = -1;
                revy = -1;
            }
            myPoint.unmove(moves.DXR, moves.DYR, revx, revy);
        }
    }
    for (let i = 0; i < walls.length; ++i) {
        walls[i].move(mx, my);
    }
    c.shadowBlur = 10;
    for (let i = 0; i < mainCanon.bulletArray.length; ++i) {
        mainCanon.bulletArray[i].move(mx, my);
        let removed = false;
        for (let j = 0; j < walls.length; ++j) {
            if (detectCircleLineCollision(walls[j].x0, walls[j].y0, walls[j].x1, walls[j].y1, mainCanon.bulletArray[i].x+pos00x, mainCanon.bulletArray[i].y+pos00y, mainCanon.bulletArray[i].radius).collision) {
                --walls[j].lives;
                if (walls[j].lives == 0) {
                    walls.splice(j, 1);
                    --j;
                }
                mainCanon.bulletArray.splice(i, 1);
                --i;
                removed = true;
                break;
            }
        }
        if (!removed) {
            if (mainCanon.bulletArray[i].counterIterations == 0) {
                mainCanon.bulletArray.splice(i, 1);
                --i;
            }
            else {
                for (let j = 0; j < enemies.length; ++j) {
                    if (detectCricleCircleCollision(enemies[j].x, enemies[j].y, mainCanon.bulletArray[i].x+pos00x, mainCanon.bulletArray[i].y+pos00y,
                                                    enemies[j].config.radius, mainCanon.bulletArray[i].radius)) {
                                                        --enemies[j].lives;
                                                        if (enemies[j].lives == 0) {
                                                            enemies.splice(j, 1);
                                                            --j;
                                                            rectLives.increaseLives(1);
                                                        }
                                                        mainCanon.bulletArray.splice(i, 1);
                                                        --i;
                                                        break;
                                                    }
                }
            }
        } 
    }
    c.shadowBlur = 0;

    for (let i = 0; i < enemies.length; ++i) {
        c.save();
        // canvas configuration of rectange of lives of enemies
        c.lineWidth = 1;
        c.strokeStyle = "rgba(0, 0, 0, 0.1)";
        c.fillStyle = "rgba(0, 0, 0, 0.1)";
        enemies[i].move(mx, my);
        c.restore();

        enemies[i].tryShoot();
    }

    for (let i = 0; i < bulletsEnemies.length; ++i) {
        c.save();
        c.fillStyle = "red";
        c.shadowBlur = 10;
        c.shadowColor = "red";
        bulletsEnemies[i].move(mx, my);
        c.restore();
        let removedBullet = false;
        if (detectCricleCircleCollision(window.innerWidth/2, window.innerHeight/2, bulletsEnemies[i].x, bulletsEnemies[i].y, RADIUS_TANK, bulletsEnemies[i].radius)) {
            bulletsEnemies.splice(i, 1);
            --i;
            rectLives.reduceLives(1);
            removedBullet = true;
        }
        if (!removedBullet && bulletsEnemies[i].counterIterations == 0) {
            bulletsEnemies.splice(i, 1);
            --i;
        }
    }

    rectLives.printLives();
    if (!endGame) {
        requestAnimationFrame(movePoint);
    }
}

movePoint();