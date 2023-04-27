{/* <script src="https://pixijs.download/release/pixi.js"></script> */}

// define variables for tuning game

// window
const gameWidth = 1000; //800
const gameHeight = 750; //600
// movement
const maxYVel = 5;
const jumpVel = 5;
const obstacleSpeed = 2;
// audio
const failSound = "M3"
const successSound = "m2"
let playSound = true;
// game length
const timeLimitSec = 60
const totalFrames = timeLimitSec*60
const totalGames = 1
// game difficulty
let verticalGap = 150
let gateDistance = 100
const MAXGAP = 250
const MINGAP = 50
const gapIncrements = 5 // increments of gap changing
const gapROC = 1 // how many score to change gap by 1*gapIncrements
const gapGatesToChange = 1

// define other game variables
let app;
let player
const groundLevel = 500;
const graphics = new PIXI.Graphics();
let keys = {};
let obstacles = [];
let frameCounter = 0;
let collided = false
let sounds = {}
let score = 0
let highScore
let scoreText
let progressText
let easyLabel
let hardLabel
let gameNumber = 1
let bar
let progressBar
let barOutline
let textureNormal
let textureHurt
let collisionPoint
const BIRDIMAGESIZE = 40
const BIRDIMAGEOFFSET = 6
let hurtBool = false
let flapBool = false
let gateNumber = 0
let oldScore = 0

// setup game on window load
window.onload = function() {
    gameSetup()
}

// function to set up game
function gameSetup() {
    // define new PIXI application
    app = new PIXI.Application(
        {
            width: gameWidth,
            height: gameHeight,
            backgroundColor: 0xB0B0DD
        }
    );

    // add to body
    document.body.appendChild(app.view);
    
    getSounds()
    
    // create game loop function
    app.ticker.add(gameLoop)
    
    // add listeners for keyboard events
    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);
    
    // get manipulation for whether sound should ebe played or not
    soundManipulation = "1" // gorilla.manipulation("soundOn")
    if (soundManipulation == "1") {
        playSound = true;
    } else {
        playSound = false;
    }
    
    // add graphics to app
    app.stage.addChild(graphics)
    
    // create player
    createPlayer()
    // draw ground
    drawGround()
    
    verticalGap = verticalGap // gorilla.retrieve("gateGap", verticalGap, true)
    highScore = 0 // gorilla.retrieve("highScore", 0, true)
    createBar()
    createScore()
}


function reset() {
    app.destroy(true)
    score = 0
    obstacles = []
    frameCounter = 0
    collided = false
    gameSetup()
}


// ---------- drawing functions ----------
function drawGround() {
    // draw ground
    graphics.beginFill(0x007700);
    graphics.drawRect(0, groundLevel, gameWidth, gameHeight-groundLevel);
    graphics.endFill();
}

// ---------- generation functions ----------
function createPlayer() {
    // define new player and set anchor to middle
    textureNormal1 = PIXI.Texture.from("media/basic_sprite1_big.png") // gorilla.stimuliURL("basic_sprite1_big.png"))
    textureHurt1 = PIXI.Texture.from("media/basic_sprite1_hurt_big.png") // gorilla.stimuliURL("basic_sprite1_hurt_big.png"))
    textureNormal2 = PIXI.Texture.from("media/basic_sprite2_big.png") // gorilla.stimuliURL("basic_sprite2_big.png"))
    textureHurt2 = PIXI.Texture.from("media/basic_sprite2_hurt_big.png") // gorilla.stimuliURL("basic_sprite2_hurt_big.png"))
    player = new PIXI.Sprite(textureNormal);
    player.anchor.set(1);
    // set starting position
    player.x = 200;
    player.y = 400;
    player.maxSpeed = 5
    player.xVel = 0
    player.yVel = 0
    // add to app stage
    app.stage.addChild(player);
}

function createObstacle(y1, y2) {
    // define new player and set anchor to middle
    let bottom = PIXI.Sprite.from("media/obstacle.png") // gorilla.stimuliURL("obstacle.png"));
    let top = PIXI.Sprite.from("media/obstacle.png") // gorilla.stimuliURL("obstacle.png"));
    top.anchor.set(0);
    bottom.anchor.set(0);
    
    // set top position
    top.x = gameWidth+20;
    top.y = 0;
    top.height = y1;
    
    // set bottom position
    bottom.x = gameWidth+20;
    bottom.y = y2;
    bottom.height = groundLevel-y2;
    
    // add to app stage
    app.stage.addChild(top);
    app.stage.addChild(bottom);
    obstacles.push([top, bottom])
}

function createScore() {
    scoreText = new PIXI.Text(("Score: " + score), {
        fontFamily: "Impact",
        fontWeight: "bolder",
        fontSize: 64,
        fill: 0xeeeeee,
        align: 'left',
    });
    scoreText.anchor.set(0)
    scoreText.x = 10
    scoreText.y = groundLevel+10
    app.stage.addChild(scoreText)
    
    gameDifficultyText = new PIXI.Text("Game Difficulty", {
        fontFamily: "Impact",
        fontSize: 20,
        fill: 0xeeeeee,
        align: 'left',
    });
    gameDifficultyText.anchor.set(0)
    gameDifficultyText.x = 537
    gameDifficultyText.y = 536
    app.stage.addChild(gameDifficultyText)
    
    easyLabel = new PIXI.Text("Easy", {
        fontFamily: "Impact",
        fontSize: 15,
        fill: 0xeeeeee,
        align: 'left',
    });
    easyLabel.anchor.set(0)
    easyLabel.x = 445
    easyLabel.y = 565
    app.stage.addChild(easyLabel)
    
    hardLabel = new PIXI.Text("Hard", {
        fontFamily: "Impact",
        fontSize: 15,
        fill: 0xeeeeee,
        align: 'left',
    });
    hardLabel.anchor.set(1, 0)
    hardLabel.x = 445+310
    hardLabel.y = 565
    app.stage.addChild(hardLabel)
    
    progressText = new PIXI.Text("Game Progress", {
        fontFamily: "Impact",
        fontSize: 15,
        fill: 0xeeeeee,
        align: 'left',
    });
    progressText.anchor.set(0.5, 1)
    progressText.x = 500
    progressText.y = 730
    app.stage.addChild(progressText)
}

function createBar() {
    barOutline = PIXI.Sprite.from("media/difficulty_level_outline.png") // gorilla.stimuliURL("difficulty_level_outline.png"));
    barOutline.anchor.set(0);
    barOutline.x = 445;
    barOutline.y = 535;
    app.stage.addChild(barOutline);
    
    bar = PIXI.Sprite.from("media/difficulty_level_bar.png") // gorilla.stimuliURL("difficulty_level_bar.png"));
    bar.anchor.set(0);
    bar.x = 450;
    bar.y = 540;
    bar.width = 300-(300*((verticalGap-MINGAP)/(MAXGAP-MINGAP)))
    app.stage.addChild(bar);
    
    progressBar = PIXI.Sprite.from("media/difficulty_level_bar.png") // gorilla.stimuliURL("difficulty_level_bar.png"));
    progressBar.anchor.set(0);
    progressBar.x = 0;
    progressBar.y = 730;
    progressBar.width = 0
    app.stage.addChild(progressBar);
}

// ---------- get sounds ----------
function getSounds() {
    sounds = {
        P5: new Audio("media/P5.mp3"), // gorilla.stimuliURL("P5.mp3")),
        M3: new Audio("media/M3.mp3"), // gorilla.stimuliURL("M3.mp3")),
        m2: new Audio("media/m2.mp3") // gorilla.stimuliURL("m2.mp3"))
    }
}

// ---------- functions for keyboard events ----------
function keysDown(e) {
    keys[e.keyCode] = true
}
function keysUp(e) {
    keys[e.keyCode] = false
}

// ---------- control functions ----------
function movePlayer() {
    if (player.y >= groundLevel) {
        player.y = groundLevel

        player.yVel = 0
    } else if (player.y < 40) {
        player.y = 40
        
        player.yVel = 0
    }

    if (keys["32"]) {
        // gorilla.metric({
        //     keyTime: frameCounter,
        //     pos: player.y
        // })
        // increase upwards speed to maximum of 30
        
        if (player.yVel > jumpVel-maxYVel) {
            player.yVel -= jumpVel
        } else {
            player.yVel = -1*maxYVel
        }
        flapBool = true
    } else {
        flapBool = false
    }

    changeTexture()

    player.y += player.yVel
    if (player.yVel < maxYVel) {
        player.yVel += 1
    }
}


function changeTexture() {
    if (hurtBool) {
        if (flapBool) {
            player.texture = textureHurt1
        } else {
            player.texture = textureHurt2
        }
    } else {
        if (flapBool) {
            player.texture = textureNormal1
        } else {
            player.texture = textureNormal2
        }
    }
}

// ---------- obstacle functions ----------
function moveObstacles() {
    remove = false
    
    // move all obstacles according to speed
    for (i = 0; i < obstacles.length; i++) {
        obstacles[i][0].x -= obstacleSpeed
        obstacles[i][1].x -= obstacleSpeed
        
        // if objects moce off screen to left
        if (obstacles[i][0].x < -20) {
            app.stage.removeChild(obstacles[i][0])
            app.stage.removeChild(obstacles[i][1])
            remove = true
        }
    }
    
    if (remove) {
        obstacles.shift()
    }
}

function obstacleCollision() {
    for (i = 0; i < obstacles.length; i++) {
        // if player did not collide
        if (obstacles[i][0].x == 128 & collided == false) {
            miss()
            
        // if in collision window
        } else if (obstacles[i][0].x <= 200 & obstacles[i][0].x >= 130) {
            // if colliding
            checkCollision()
            
        // just before next obstacle
        } else if (obstacles[i][0].x == 4) {
            resetCollision()
        
        // remove hurt sprite
        } else if (obstacles[i][0].x == 50) {
            hurtBool = false
        }
    }
}

function checkCollision() {
    if (player.y+BIRDIMAGEOFFSET < (obstacles[i][0].height+BIRDIMAGESIZE) | player.y-BIRDIMAGEOFFSET > obstacles[i][1].y) {
        // if player hits object and loses life
        if (playSound) {
            sounds[failSound].play();
        }
        
        if (collided == false) {
            score -= 100
            scoreText.text = ("Score: " + score)
            
            collisionPoint = obstacles[i][0].x
            hurtBool = true
        }
        
        collided = true
    }
}

function resetCollision() {
    if (collided) {
        if (playSound) {
            sounds[failSound].pause();
            sounds[failSound].currentTime = 0;
        }
        collided = false
        // gorilla.metric({
        //     pass: 0,
        //     width: verticalGap
        // })
    } else {
        if (playSound) {
            sounds[successSound].pause();
            sounds[successSound].currentTime = 0;
        }
        // gorilla.metric({
        //     pass: 1,
        //     width: verticalGap
        // })
    }
}

function miss() {
    // if player avoids object and gets point
    if (playSound) {
        sounds[successSound].play();
    }
            
    score += 100
    scoreText.text = ("Score: " + score)
    
    if (score > highScore) {
        highScore = score
        // highScoreText.text = ("High Score: " + highScore)
    }
}


function changeGap() {
    // calculate new gap
    newDiff = Math.floor(((score-oldScore)/(100*gapROC))*gapIncrements)
    newGap = verticalGap - newDiff
    
    if (newGap < MINGAP) {
        newGap = MINGAP
    } else if (newGap > MAXGAP) {
        newGap = MAXGAP
    }
    
    oldScore = score
    bar.width = 300-(300*((verticalGap-MINGAP)/(MAXGAP-MINGAP)))
    return newGap
}


// ---------- main loop function ----------
function gameLoop() {
    movePlayer();
    moveObstacles();
    obstacleCollision();
    
    if (frameCounter % gateDistance == 0) {
        newY1 = Math.floor(Math.random() * (groundLevel-(100+verticalGap)) ) + 50;
        createObstacle(newY1, newY1+verticalGap);
        
        gateNumber += 1
        if (gateNumber % gapGatesToChange == 0) {
            verticalGap = changeGap()
        }
        
    } else if (frameCounter > totalFrames) {
        gameEnd()
    }
    
    frameCounter += 1;
    
    progressBar.width = Math.floor(gameWidth * (frameCounter/totalFrames))
}

// function for end of game
function gameEnd() {
    // gorilla.store("highScore", highScore, true)
    
    newGap = changeGap()
    
    // gorilla.store("gateGap", newGap, true)
    
    // if (playSound) {
    //     gamesPlayed = gorilla.retrieve("gamesPlayed", 0, true)
    //     gamesPlayed += 1
    //     gorilla.store("gamesPlayed", gamesPlayed, true)
    // }
    
    // exit if end of last game
    if (gameNumber < totalGames) {
        gameNumber += 1
        reset()
    } else {
        app.destroy(true)
        // gorilla.finish()
    }
}