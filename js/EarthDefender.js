/**
 * Created by Michel Llorens [@Michotastico] on 10-10-2016.
 */

var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Graphics = PIXI.Graphics;

var global_height = 512, global_width = 512;
var stage = new Container();
var renderer = autoDetectRenderer(global_width, global_height);

document.body.appendChild(renderer.view);

loader
    .add("images/images.json")
    .load(setup);
var BreakException = {};
var state, ship, planet, meteors, lasers, images, message, gameScene, gameOverScene;
var ticks = 0, meteor_ticks = 100, points = 0;
var meteors_skins = ["m1.png", "m2.png", "m3.png", "m4.png", "m5.png", "m6.png"];
var lives = 6;

var background_music = new Howl({
    src: ['audio/background.mp3'],
    autoplay: true,
    loop: true
});

var pew_sound = new Howl({
    src: ['audio/laser.wav']
});

function setup() {

    gameScene = new Container();
    stage.addChild(gameScene);

    images = resources["images/images.json"].textures;

    planet = new Sprite(images["planet.png"]);
    planet.scale.x = planet.scale.y = global_width/planet.width;
    planet.x = (global_width - global_height)/2;
    planet.y = global_height * 3/4;
    gameScene.addChild(planet);

    ship = new Sprite(images["ship.png"]);
    ship.x = global_width/2;
    ship.y = global_height * 3/4;
    ship.vx = 0;
    gameScene.addChild(ship);

    meteors = [];
    lasers = [];

    gameOverScene = new Container();
    stage.addChild(gameOverScene);
    gameOverScene.visible = false;

    message = new Text(
        "Game Over!\nPoints: ",
        {font: "64px Futura", fill: "white"}
    );
    message.x = (global_width - message.width) / 2;
    message.y = (global_height - message.height) / 2;
    gameOverScene.addChild(message);

    var left = keyboard(37),
        right = keyboard(39),
        space = keyboard(32);

    left.press = function(){
        ship.vx = -10;
    };
    left.release = function(){
        if(!right.isDown){
            ship.vx = 0;
        }
    };

    right.press = function(){
        ship.vx = 10;
    };
    right.release = function() {
        if (!left.isDown) {
            ship.vx = 0;
        }
    };

    space.press = function(){
        if(lives > 0) {
            var laser = new Graphics();
            laser.beginFill(0xffff00);
            laser.drawRect(0, 0, 5, 10);
            laser.endFill();
            laser.x = ship.x + ship.width / 2;
            laser.y = ship.y;
            laser.vy = -5;
            laser.collision = false;
            lasers.push(laser);
            gameScene.addChild(laser);
            pew_sound.play();
        }
    };

    state = play;

    mainLoop();
}

function mainLoop() {
    requestAnimationFrame(mainLoop);

    state();
    renderer.render(stage);
}

function play() {
    ship.x += ship.vx;

    if (ship.x <= 0){
        ship.x = 0;
    }
    else if(ship.x >= global_width - ship.width){
        ship.x = global_width - ship.width;
    }

    if(ticks >= meteor_ticks){
        ticks = 0;
        var meteor_sprite = meteors_skins[random(0, meteors_skins.length - 1)];
        var meteor = new Sprite(images[meteor_sprite]);
        meteor.x = random(0, global_width - meteor.width);
        meteor.y = 0;
        meteor.vy = random(1, 3);
        meteor.collision = false;
        meteors.push(meteor);
        gameScene.addChild(meteor);

    }
    else{
        ticks += 1;
    }

    var lasersToRemove = [];
    lasers.forEach(function(laser){
        laser.y += laser.vy;
        if (laser.y <= 0 || laser.collision){
            lasersToRemove.push(laser);
        }
    });
    lasersToRemove.forEach(function(laser){
       var i = lasers.indexOf(laser);
        if(i != -1){
            lasers.splice(i, 1);
        }
        gameScene.removeChild(laser);
    });


    var meteorsToRemove = [];
    meteors.forEach(function(meteor){
        meteor.y += meteor.vy;

        try {
            lasers.forEach(function (laser) {
                if(meteor.x <= laser.x && laser.x <= meteor.x + meteor.width
                    && meteor.y <= laser.y && laser.y <= meteor.y + meteor.height){
                    laser.collision = true;
                    meteor.collision = true;
                    points += 1;
                    throw BreakException;
                }
            });
        } catch(e){
            if (e !== BreakException) throw e;
        }

        if (!meteor.collision && meteor.y >= ship.y) {
            lives -= 1;
            meteor.collision = true;
        }
        if (meteor.y >= global_height || meteor.collision){
            meteorsToRemove.push(meteor);
        }
    });
    meteorsToRemove.forEach(function(meteor){
        var i = meteors.indexOf(meteor);
        if(i != -1){
            meteors.splice(i, 1);
        }
        gameScene.removeChild(meteor);
    });

    if (lives <= 0){
        state = end;
        message.text += points;
    }
}

function end(){
    gameScene.visible = false;
    gameOverScene.visible = true;
    background_music.stop();
}

function random(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = function(event) {
        if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}