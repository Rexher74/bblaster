// Canvas Configuration
var canvas = document.getElementById("mainCanvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext("2d");
c.lineWidth = 10;
c.shadowColor = "black";

// Utilities

// Función para convertir grados a radianes
function gradosARadianes(grados) {
    return grados * (Math.PI / 180);
}

// Función para rotar un vector (x, y) por un ángulo theta en radianes
function rotarVector(x, y, theta) {
    let xRotado = x * Math.cos(theta) - y * Math.sin(theta);
    let yRotado = x * Math.sin(theta) + y * Math.cos(theta);
    return [xRotado, yRotado];
}

// Función que rota un vector unitario en ángulos especificados hacia la derecha y la izquierda
function rotarVectorGrados(vector, grados) {
    // Convertir los grados a radianes
    let angulo = gradosARadianes(grados);

    // Rotar en sentido horario (derecha, usando ángulo negativo)
    let vectorDerecha = rotarVector(vector[0], vector[1], -angulo);

    // Rotar en sentido antihorario (izquierda, usando ángulo positivo)
    let vectorIzquierda = rotarVector(vector[0], vector[1], angulo);

    // Devolver ambos vectores
    return {
        derecha: vectorDerecha,
        izquierda: vectorIzquierda
    };
}

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
    constructor(x0, y0, x1, y1, horizontal, limit) {
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.horizontal = horizontal;
        this.lives = 10;
        this.limit = limit;
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
        if (this.limit) {
            c.save();
            c.shadowBlur = 20;
            c.beginPath();
            c.moveTo(this.x0-pos00x, this.y0-pos00y);
            c.lineTo(this.x1-pos00x, this.y1-pos00y);
            c.stroke();
            c.restore();
        }
        else {
            c.beginPath();
            c.moveTo(this.x0-pos00x, this.y0-pos00y);
            c.lineTo(this.x1-pos00x, this.y1-pos00y);
            c.stroke();
        }
    }
}

class Canon{
    constructor(){
        this.bulletSize = 15;
        this.bulletArray = [];
        this.bulletRange = 60;
        this.bulletSpeed = 7;
        this.intervalShooting = 300; // in milliseconds
        this.lastShoot = performance.now()-this.intervalShooting;
    }
    shoot(ex, ey) {
        if (performance.now()-this.lastShoot > this.intervalShooting) {
            let varXPos = ex - window.innerWidth/2;
            let varYPos = ey - window.innerHeight/2;
            let unitaryVect = unitVector(varXPos, varYPos);
            this.bulletArray.push(new Bullet(unitaryVect[0], unitaryVect[1], this.bulletSize, this.bulletSpeed, window.innerWidth/2, window.innerHeight/2, this.bulletRange, "black", undefined));
            this.lastShoot = performance.now();
        }
    }
}

class Bullet{
    constructor(dirX, dirY, radius, bulletSpeed, iniX, iniY, rangeBullet, color, eConfig) {
        this.x = iniX;
        this.y = iniY;
        this.color = color;
        this.radius = radius;
        this.bulletSpeed = bulletSpeed;
        this.directionX = dirX*bulletSpeed;
        this.directionY = dirY*bulletSpeed;
        this.counterIterations = rangeBullet;
        this.enemyConfig = eConfig;
    }
    update() {
        c.save();
        c.fillStyle = this.color;
        c.shadowBlur = 10;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        c.fill();
        c.restore();
    }
    move(extraX, extraY){
        if (this.enemyConfig && this.enemyConfig.presuit) {
            let unitaryVect = unitVector(window.innerWidth/2-this.x, window.innerHeight/2-this.y);
            this.directionX = unitaryVect[0]*this.bulletSpeed;
            this.directionY = unitaryVect[1]*this.bulletSpeed;
        }
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
        this.iterationAlterner = 0; // just useful if predefinedIt feature of this.config is true
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
    shootEnemyPredefined(desviation){ // function just for predefined4 and predefinedIt features
        if (desviation) {
            bulletsEnemies.push(new Bullet(1, 0, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(0, 1, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(-1, 0, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(0, -1, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
        }
        else {
            bulletsEnemies.push(new Bullet(Math.sqrt(2)/2, Math.sqrt(2)/2, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(-Math.sqrt(2)/2, Math.sqrt(2)/2, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(Math.sqrt(2)/2, -Math.sqrt(2)/2, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(-Math.sqrt(2)/2, -Math.sqrt(2)/2, this.config.radiusBullets, this.config.bulletEnemySpeed,
            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
        }
    }
    shootEnemy() {
        if (this.config.bConfig.predefined4) {
            this.shootEnemyPredefined(false);
        }
        else if (this.config.bConfig.predefinedIt) {
            if (this.iterationAlterner == 0) {
                this.shootEnemyPredefined(false);
                this.iterationAlterner = 1;
            }
            else {
                this.shootEnemyPredefined(true);
                this.iterationAlterner = 0;
            }
        }
        else if (this.config.bConfig.doubleBullet) {
            let varX = window.innerWidth/2 - (this.x - pos00x);
            let varY = window.innerHeight/2 - (this.y - pos00y);
            let unitaryVect = unitVector(varX, varY);
            let normalVect1 = [-unitaryVect[1]*this.config.radiusBullets, unitaryVect[0]*this.config.radiusBullets];
            let normalVect2 = [unitaryVect[1]*this.config.radiusBullets, -unitaryVect[0]*this.config.radiusBullets];
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x + normalVect1[0], this.y - pos00y + normalVect1[1], this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x + normalVect2[0], this.y - pos00y + normalVect2[1], this.config.bRange, this.config.color, this.config.bConfig));
        }
        else if (this.config.bConfig.tripleBullet) {
            let varX = window.innerWidth/2 - (this.x - pos00x);
            let varY = window.innerHeight/2 - (this.y - pos00y);
            let unitaryVect = unitVector(varX, varY);
            let vectorRightLeftRorated = rotarVectorGrados(unitaryVect, 30);
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(vectorRightLeftRorated.derecha[0], vectorRightLeftRorated.derecha[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(vectorRightLeftRorated.izquierda[0], vectorRightLeftRorated.izquierda[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
        }
        else if (this.config.bConfig.multi) {
            let varX = window.innerWidth/2 - (this.x - pos00x);
            let varY = window.innerHeight/2 - (this.y - pos00y);
            let unitaryVect = unitVector(varX, varY);
            let normalVect1 = [-unitaryVect[1]*this.config.radiusBullets, unitaryVect[0]*this.config.radiusBullets];
            let normalVect2 = [unitaryVect[1]*this.config.radiusBullets, -unitaryVect[0]*this.config.radiusBullets];
            // center
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x + normalVect1[0], this.y - pos00y + normalVect1[1], this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x + normalVect2[0], this.y - pos00y + normalVect2[1], this.config.bRange, this.config.color, this.config.bConfig));
            // laterals
            let vectorRightLeftRorated = rotarVectorGrados(unitaryVect, 20);
            bulletsEnemies.push(new Bullet(vectorRightLeftRorated.derecha[0], vectorRightLeftRorated.derecha[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
            bulletsEnemies.push(new Bullet(vectorRightLeftRorated.izquierda[0], vectorRightLeftRorated.izquierda[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                    this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
        }
        else {
            let varX = window.innerWidth/2 - (this.x - pos00x);
            let varY = window.innerHeight/2 - (this.y - pos00y);
            let unitaryVect = unitVector(varX, varY);
            bulletsEnemies.push(new Bullet(unitaryVect[0], unitaryVect[1], this.config.radiusBullets, this.config.bulletEnemySpeed,
                                            this.x - pos00x, this.y - pos00y, this.config.bRange, this.config.color, this.config.bConfig));
        }
        this.lastShoot = performance.now();
    }
    tryShoot() {
        if (getDistancePoints(this.x-pos00x, this.y-pos00y, window.innerWidth/2, window.innerHeight/2) < 1500
            && performance.now() - this.lastShoot > this.config.intervalShooting) {
            this.shootEnemy();
        }
    }
}

class UserGame{
    constructor(lives, base_shield, eTotal) {
        this.lives = lives;
        this.shield = 0;
        this.baseLives = lives;
        this.baseShield = base_shield;
        this.XP = 0;
        this.eRemaining = eTotal;
    }
    printData(){
        this.printLives();
        this.printShield();
        this.printXP();
        this.printEnemiesRemaining();
    }
    printEnemiesRemaining(){
        c.save();
        c.font = "bold 15px Raleway"
        c.fillText(`Enemies Remaining: ${this.eRemaining}`, 10, 20); // position (20, 20) px
        c.restore();
    }
    printLives(){
        c.save();
        c.lineWidth = 4;
        c.strokeStyle = "rgb(128, 247, 128)";
        c.fillStyle = "rgb(128, 247, 128)";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 40, window.innerWidth*2/16, 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.stroke();
        c.lineWidth = "0";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 40, (window.innerWidth*2/16)*(this.lives/this.baseLives), 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.fill();
        c.restore();
    }
    printShield(){
        c.save();
        c.lineWidth = 4;
        c.strokeStyle = "rgb(75, 147, 255)";
        c.fillStyle = "rgb(75, 147, 255)";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 20, window.innerWidth*2/16, 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.stroke();
        c.lineWidth = "0";
        c.beginPath();
        c.rect(window.innerWidth*7/16, 20, (window.innerWidth*2/16)*(this.shield/this.baseShield), 10); // 20 is the margin to the top of the screen. 15 is the height of the bar
        c.fill();
        c.restore();
    }
    printXP(){
        c.save();
        c.font = "bold 30px Raleway"
        c.textAlign = "center";
        c.fillText(`${this.XP} xp`, window.innerWidth/2, window.innerHeight-20); // 20 is a margin
        c.restore();
    }
    makeDamage(amount) {
        if (this.shield >= amount) {
            this.reduceShield(amount);
        }
        else {
            let remaining = amount-this.shield;
            this.reduceShield(this.shield);
            this.reduceLives(remaining);
        }
    }
    reduceLives(amount){
        this.lives-=amount;
        if (this.lives <= 0) {
            endGame = true;
            alert('Game Over!');
        }
    }
    reduceShield(amount){
        this.shield-=amount;
    }
    increaseLives(amount){
        if (this.lives+amount <= this.baseLives) {
            this.lives += amount;
        }
        else {
            this.lives = this.baseLives;
        }
    }
    increaseShield(amount){
        if (this.shield+amount <= this.baseShield) {
            this.shield += amount;
        }
        else {
            this.shield = this.baseShield;
        }
    }
    increaseXP(amount){
        this.XP+=amount;
    }
    reduceXP(amount){
        this.XP-=amount;
    }
    decreaseNumEnemies(){
        --this.eRemaining;
        if (this.eRemaining == 0) {
            endGame = true;
            alert('You Win!');
        }
    }
}


// General Configuration

var enemyConfiguration = {
    "basicElementary":{
        lives: 5, // enemy lives
        intervalShooting: 1500, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 5, // speed of the bullets (in px / iteration)
        awardXP: 100, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 0, // shield given when killed
        color: "#52B26A", // color of the bullet
        imgSrc: "./enemies/basicEnemy1.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "basicPredefined4":{
        lives: 5, // enemy lives
        intervalShooting: 1000, // millisecond between every shoot
        bRange: 150, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 4, // speed of the bullets (in px / iteration)
        awardXP: 100, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 0, // shield given when killed
        color: "#52B26A", // color of the bullet
        imgSrc: "./enemies/basicEnemy2.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: true, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "basicBigBalls":{
        lives: 5, // enemy lives
        intervalShooting: 2000, // millisecond between every shoot
        bRange: 150, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 35, // size of the bullet
        bulletEnemySpeed: 6, // speed of the bullets (in px / iteration)
        awardXP: 100, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 0, // shield given when killed
        color: "#52B26A", // color of the bullet
        imgSrc: "./enemies/basicEnemy3.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "rareElementary":{
        lives: 10, // enemy lives
        intervalShooting: 750, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 7, // speed of the bullets (in px / iteration)
        awardXP: 300, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 1, // shield given when killed
        color: "#005DAD", // color of the bullet
        imgSrc: "./enemies/rareEnemy1.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "rarePredefinedIt":{
        lives: 10, // enemy lives
        intervalShooting: 1250, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 7, // speed of the bullets (in px / iteration)
        awardXP: 300, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 1, // shield given when killed
        color: "#005DAD", // color of the bullet
        imgSrc: "./enemies/rareEnemy2.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: true, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "rareDouble":{
        lives: 10, // enemy lives
        intervalShooting: 900, // millisecond between every shoot
        bRange: 150, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 9, // speed of the bullets (in px / iteration)
        awardXP: 300, // xp given when enemy killed
        awardLives: 1, // lives given when enemy killed
        awardShield: 1, // shield given when killed
        color: "#005DAD", // color of the bullet
        imgSrc: "./enemies/rareEnemy3.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: true, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "epicElementary":{
        lives: 25, // enemy lives
        intervalShooting: 400, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 10, // speed of the bullets (in px / iteration)
        awardXP: 500, // xp given when enemy killed
        awardLives: 2, // lives given when enemy killed
        awardShield: 3, // shield given when killed
        color: "#9847FE", // color of the bullet
        imgSrc: "./enemies/epicEnemy1.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "epicTriple":{
        lives: 25, // enemy lives
        intervalShooting: 600, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 10, // speed of the bullets (in px / iteration)
        awardXP: 500, // xp given when enemy killed
        awardLives: 2, // lives given when enemy killed
        awardShield: 3, // shield given when killed
        color: "#9847FE", // color of the bullet
        imgSrc: "./enemies/epicEnemy2.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: true, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "epicWalltravesser":{
        lives: 25, // enemy lives
        intervalShooting: 500, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 10, // speed of the bullets (in px / iteration)
        awardXP: 500, // xp given when enemy killed
        awardLives: 2, // lives given when enemy killed
        awardShield: 3, // shield given when killed
        color: "#9847FE", // color of the bullet
        imgSrc: "./enemies/epicEnemy3.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: true, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "legendaryElementary":{
        lives: 50, // enemy lives
        intervalShooting: 150, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 15, // speed of the bullets (in px / iteration)
        awardXP: 1000, // xp given when enemy killed
        awardLives: 10, // lives given when enemy killed
        awardShield: 10, // shield given when killed
        color: "#FFD658", // color of the bullet
        imgSrc: "./enemies/legendaryEnemy1.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "legendaryMulti":{
        lives: 50, // enemy lives
        intervalShooting: 500, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 15, // speed of the bullets (in px / iteration)
        awardXP: 1000, // xp given when enemy killed
        awardLives: 10, // lives given when enemy killed
        awardShield: 10, // shield given when killed
        color: "#FFD658", // color of the bullet
        imgSrc: "./enemies/legendaryEnemy2.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: true, // shoots 4 bullets
            presuit: false // bullets presuit canon
        }
    },
    "legendaryPresuit":{
        lives: 50, // enemy lives
        intervalShooting: 750, // millisecond between every shoot
        bRange: 200, // iterations of the bullet
        radius: 40, // radius of the enemy
        radiusBullets: 15, // size of the bullet
        bulletEnemySpeed: 10, // speed of the bullets (in px / iteration)
        awardXP: 1000, // xp given when enemy killed
        awardLives: 10, // lives given when enemy killed
        awardShield: 10, // shield given when killed
        color: "#FFD658", // color of the bullet
        imgSrc: "./enemies/legendaryEnemy3.png", // path to enemy image

        // habilities
        bConfig: {
            predefined4: false, // bullets don't go to canon, just throw one with 0deg, 90deg, 180deg and 270deg
            predefinedIt: false, // shoots bullets like predefined 4 but every change angles to +45deg every shoot
            doubleBullet: false, // shoots double balls in same direction but paralel
            tripleBullet: false, // shoots triple bullet in main direction and +- a certain angle (see implementation to know this angle)
            wallTravesser: false, // bullets can go through walls
            multi: false,
            presuit: true // bullets presuit canon
        }
    },
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

const USER_BASE_LIVES = 10;
const USER_BASE_SHIELD = 10;

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
    NUM_WALLS: 500,
    WALL_SIZE: 500,
    MINIMUM_SPAWN_DISTANCE: 1500
}

const ENEMY_OPTIONS = {
    NUM_ENEMIES_BASIC_ELEMENTARY: 20,
    NUM_ENEMIES_BASIC_PREDEFINED4: 20,
    NUM_ENEMIES_BASIC_BIGBALL: 20,
    NUM_ENEMIES_RARE_ELEMENTARY: 15,
    NUM_ENEMIES_RARE_DOUBLE: 15,
    NUM_ENEMIES_RARE_PREDEFINEDIT: 15,
    NUM_ENEMIES_EPIC_ELEMENTARY: 4,
    NUM_ENEMIES_EPIC_WALLTRAVESSER: 4,
    NUM_ENEMIES_EPIC_TRIPLE: 4,
    NUM_ENEMIES_LEGENDARY_ELEMENTARY: 1,
    NUM_ENEMIES_LEGENDARY_PRESUIT: 1,
    NUM_ENEMIES_LEGENDARY_MULTI: 1,
}

const numEnemies = Object.values(ENEMY_OPTIONS) // Obtiene los valores del objeto
    .reduce((acc, value) => acc + value, 0); // Suma todos los valores

var mainCanon = new Canon();

var User = new UserGame(USER_BASE_LIVES, USER_BASE_SHIELD, numEnemies);


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
})
window.addEventListener("keyup", e => {
    if (e.key == "ArrowUp" || e.key == "w") keyController.up = false;
    else if (e.key == "ArrowDown" || e.key == "s") keyController.down = false;
    else if (e.key == "ArrowRight" || e.key == "d") keyController.right = false;
    else if (e.key == "ArrowLeft" || e.key == "a") keyController.left = false;
})

window.addEventListener("contextmenu", e => e.preventDefault()); // hace que no se genere el contextmenu
                                                                // al hacer click derecho, cosa que hace que
                                                                // keyController funcione correctamente
                                                                // (sin esto, si tienes clickado una tecla y 
                                                                // haces doble click derecho y levantas la tecla
                                                                // keyController sigue a true)

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
            walls.push(new Wall(posX0, posY0, posX0, posY0+OPTIONS.WALL_SIZE, false, false));
        }
    }
    else { // horizontal
        if (detectCircleLineCollision(posX0, posY0, posX0+OPTIONS.WALL_SIZE, posY0, window.innerWidth / 2 + pos00x, window.innerHeight / 2 + pos00y, RADIUS_TANK).collision) --i;
        else {
            walls.push(new Wall(posX0, posY0, posX0+OPTIONS.WALL_SIZE, posY0, true, false));
        }
    }
}

// Create map limit walls
c.save();
c.strokeStyle = "#6e6e6e";
let numWallsOneSide = 100*OPTIONS.MAP_SIZE/OPTIONS.WALL_SIZE;
let mapSizePX = 100*OPTIONS.MAP_SIZE;
for (let i = 0; i < mapSizePX; i+=OPTIONS.WALL_SIZE) {
    walls.push(new Wall(i, 0, i+OPTIONS.WALL_SIZE, 0, true, true));
}
for (let i = 0; i < mapSizePX; i+=OPTIONS.WALL_SIZE) {
    walls.push(new Wall(i, 100*OPTIONS.MAP_SIZE, i+OPTIONS.WALL_SIZE, 100*OPTIONS.MAP_SIZE, true, true));
}
for (let i = 0; i < mapSizePX; i+=OPTIONS.WALL_SIZE) {
    walls.push(new Wall(0, i, 0, i+OPTIONS.WALL_SIZE, false, true));
}
for (let i = 0; i < mapSizePX; i+=OPTIONS.WALL_SIZE) {
    walls.push(new Wall(100*OPTIONS.MAP_SIZE, i, 100*OPTIONS.MAP_SIZE, i+OPTIONS.WALL_SIZE, false, true));
}
c.restore();

// Create Enemies
function spawnNewEnemy(typeE){
    spawned = false;
    while (!spawned) {
        let posX0 = (randomIntFromInterval(0, 100*OPTIONS.MAP_SIZE));
        let posY0 = (randomIntFromInterval(0, 100*OPTIONS.MAP_SIZE));
        let collisionDetected = false;
        for (let j = 0; j < walls.length; ++j) {
            if (detectCircleLineCollision(walls[j].x0, walls[j].y0, walls[j].x1, walls[j].y1, posX0, posY0, enemyConfiguration[typeE].radius).collision) {
                collisionDetected = true;
                break;
            }
        }
        if (!collisionDetected
            && !detectCricleCircleCollision(posX0, posY0, pos00x+window.innerWidth/2, pos00y+window.innerHeight/2, enemyConfiguration[typeE].radius, OPTIONS.MINIMUM_SPAWN_DISTANCE)) {
            enemies.push(new Enemy(posX0, posY0, typeE));
            spawned = true;
        }
    }
}
function iniEnemies() {
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_BASIC_ELEMENTARY; ++i) {
        spawnNewEnemy("basicElementary");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_BASIC_PREDEFINED4; ++i) {
        spawnNewEnemy("basicPredefined4");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_BASIC_BIGBALL; ++i) {
        spawnNewEnemy("basicBigBalls");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_RARE_ELEMENTARY; ++i) {
        spawnNewEnemy("rareElementary");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_RARE_PREDEFINEDIT; ++i) {
        spawnNewEnemy("rarePredefinedIt");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_RARE_DOUBLE; ++i) {
        spawnNewEnemy("rareDouble");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_EPIC_ELEMENTARY; ++i) {
        spawnNewEnemy("epicElementary");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_EPIC_TRIPLE; ++i) {
        spawnNewEnemy("epicTriple");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_EPIC_WALLTRAVESSER; ++i) {
        spawnNewEnemy("epicWalltravesser");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_LEGENDARY_ELEMENTARY; ++i) {
        spawnNewEnemy("legendaryElementary");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_LEGENDARY_MULTI; ++i) {
        spawnNewEnemy("legendaryMulti");
    }
    for (let i = 0; i < ENEMY_OPTIONS.NUM_ENEMIES_LEGENDARY_PRESUIT; ++i) {
        spawnNewEnemy("legendaryPresuit");
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
        for (let j = 0; j < bulletsEnemies.length; ++j) {
            if (!bulletsEnemies[j].enemyConfig.wallTravesser && detectCircleLineCollision(walls[i].x0, walls[i].y0, walls[i].x1, walls[i].y1, bulletsEnemies[j].x+pos00x, bulletsEnemies[j].y+pos00y, bulletsEnemies[j].radius).collision) {
                // remove enemy bullet
                bulletsEnemies.splice(j, 1);
                --j;
            }
        }
    }
    c.shadowBlur = 10;
    for (let i = 0; i < mainCanon.bulletArray.length; ++i) {
        mainCanon.bulletArray[i].move(mx, my);
        let removed = false;
        for (let j = 0; j < walls.length; ++j) {
            if (detectCircleLineCollision(walls[j].x0, walls[j].y0, walls[j].x1, walls[j].y1, mainCanon.bulletArray[i].x+pos00x, mainCanon.bulletArray[i].y+pos00y, mainCanon.bulletArray[i].radius).collision) {
                if (!walls[j].limit) --walls[j].lives;
                if (walls[j].lives == 0) {
                    // remove wall
                    walls.splice(j, 1);
                    --j;
                }
                // remove bullet
                mainCanon.bulletArray.splice(i, 1);
                --i;
                removed = true;
                break;
            }
        }
        if (!removed) {
            if (mainCanon.bulletArray[i].counterIterations == 0) {
                // remove bullet
                mainCanon.bulletArray.splice(i, 1);
                --i;
            }
            else {
                for (let j = 0; j < enemies.length; ++j) {
                    if (detectCricleCircleCollision(enemies[j].x, enemies[j].y, mainCanon.bulletArray[i].x+pos00x, mainCanon.bulletArray[i].y+pos00y,
                                                    enemies[j].config.radius, mainCanon.bulletArray[i].radius)) {
                        --enemies[j].lives;
                        if (enemies[j].lives == 0) {
                            User.increaseLives(enemies[j].config.awardLives);
                            User.increaseShield(enemies[j].config.awardShield);
                            User.increaseXP(enemies[j].config.awardXP);
                            // remove enemy
                            User.decreaseNumEnemies();
                            enemies.splice(j, 1);
                            --j;
                        }
                        // remove bullet
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
        bulletsEnemies[i].move(mx, my);
        if (detectCricleCircleCollision(window.innerWidth/2, window.innerHeight/2, bulletsEnemies[i].x, bulletsEnemies[i].y, RADIUS_TANK, bulletsEnemies[i].radius)) {
            // remove enemy bullet
            bulletsEnemies.splice(i, 1);
            --i;
            User.makeDamage(1);
            User.reduceXP(10);
        }
        else if (bulletsEnemies[i].counterIterations == 0) {
            // remove enemy bullet
            bulletsEnemies.splice(i, 1);
            --i;
        }
    }

    User.printData();
    if (!endGame) {
        requestAnimationFrame(movePoint);
    }
}

// Start game config

window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

document.getElementById("playDiv").addEventListener("click", () => {
    if (mobileAndTabletCheck) {
        document.getElementById("playDivBckg").style.display = "none";
        document.getElementById("centerUser").style.display = "block";
        var keepShooting;
var mousePressed = false;

    window.addEventListener("mousedown", (e) => {
        if (!mousePressed) {
            mainCanon.shoot(e.clientX, e.clientY);
            mousePressed = true;
            keepShooting = setInterval(function(){
                mainCanon.shoot(mouseX, mouseY);
            })
        }
    })

    window.addEventListener("mouseup", function() {
        if (mousePressed) {
            clearInterval(keepShooting);
            mousePressed = false;
        }
    })
        iniEnemies();
        movePoint();
    }
    else {
        alert("Sorry but unfourtunatelly our game isn't available for smartphones or tablets.\nConect via laptot/computer to play.")
    }
}) 