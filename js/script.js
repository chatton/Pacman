var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var angle = 0

document.addEventListener("keydown", function(event){
    pacman.move(event.keyCode);
}, false); 

// keep track of "score", meaningless value to display during and at the end of the game.
var playerScore = 0;
var levelString = "";
var level;

// read in a file based on what the user provides.
document.getElementById("fileinput").addEventListener("change", function(event){
    var f = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        // content is a string containing the contents of the file.
        var content = e.target.result;  
        levelString = content;
        //console.log(levelString);
        level = new Level(levelString);
        level.build();

    }
    reader.readAsText(f);
}, false);

// class that represents a level
function Level(levelString){
    this.levelString = levelString;
    this.grid = [];
    this.tileSize = 0;
    this.build = function(){
        dots.splice(0, dots.length);
        walls.splice(0, walls.length);
        var rows = this.levelString.split("\n");
        //console.log(rows);
        this.tileSize = canvas.width / rows[0].length;
        for(var row = 0; row < rows.length; row++){
            var list = []
            this.grid.push(list);
            for(var col = 0; col < rows[0].length; col++){
                var char = rows[row][col];
                
                if(char == "S"){
                    // this is the starting position for pacman
                    // move him to the starting location.
                    pacman.resize((this.tileSize / 2) * 0.8); // tilesize/ 2 to fit in one tile
                    // x 0.8 to make it fill up 80% of the tile instead of the whole space.
                    pacman.stop(); // so velocity from previous level doesn't carry over.
                    pacman.reposition(col * this.tileSize + this.tileSize / 2, row * this.tileSize + this.tileSize / 2);
                }
                if(char == "."){ // put a dot there, but in the middle of the tile not on the edge.
                    dots.push(new Dot(col * this.tileSize + this.tileSize / 2, row * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.15));
                }

                if(char == "#"){ // it's wall, add a new wall to be rendered each cycle.
                    walls.push(new Wall(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize));
                }  

                list.push(char);
            }

        }

    }
}

function Wall(x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.draw = function(){
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y , this.width, this.height);
    }
}


function cirlcesIntersect(obj1, obj2){
    var dx = obj1.x - obj2.x; // distance in x co-ord
    var dy = obj1.y - obj2.y; // distance in y co-ord
    var distance = Math.sqrt((dx * dx) + (dy * dy)); // pythagoras' theorem
    return distance < (obj1.radius + obj2.radius);
}

function Ghost(){

}


// the things pacman eats to get points and progress
function Dot(x, y, radius){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    },
    this.update = function(){}
}


// the things pacman eats to make the ghosts vulnerable/scared of pacman
function PowerPellet(){

}

function Pacman(x, y, radius, speed){
    // mout animation object in charge of providing the "angle"
    // variable to add/remove to the ctx.arc of drawing pacman
    // to make the mouth open and close.
    this.direction = {
        name : "RIGHT",
        angle : 0
    };
    this.mouthAnimation = {
        speed : 0.05,
        gap : 0.3,
        angle : 0,
        direction : 1,
        update : function(){
            // depending on direction, the mouth will open or close.
            if(this.direction == 1){
                this.angle += this.speed; 
            } else{
                this.angle -= this.speed;   
            }
            
            // stop it on the way back so it doesn't go back around the full circle.
            if(this.angle > (1 - this.gap) || this.angle < 0) {
                this.direction *= -1; // switch direction
            }
        } 
    },
    this.speed = speed || {
        dx : 0,
        dy : 0,
        magnitude : 1
    },
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.resize = function(radius){
        this.radius = radius;
    },
    this.stop = function(){
        this.speed.dx = 0;
        this.speed.dy = 0;
    },
    this.reposition = function(x, y){
        this.x = x;
        this.y = y;
    }
    this.draw = function(){
        ctx.save();
        ctx.translate(this.x, this.y); // translates the entire co-ordinate system, x, y are our new 0,0
        // want to flip only if going left, otherwise, the eye is on the bottom left of pacman.
        // We want it on the top left. So a mirror image of facing right is perfect for this.
        if(this.direction.name == "LEFT"){  
            ctx.scale(1,-1);
        }
        ctx.rotate(this.direction.angle); // rotate the entire canvas
        ctx.translate(-this.x, -this.y); // offset based on the initial translation            
        
 

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI / 4 - this.mouthAnimation.angle, Math.PI * 1.75 + this.mouthAnimation.angle);
        ctx.lineTo(this.x, this.y);

        // can calculate the final position using co-ordinate transformation

        // requires x offset since the default starting point is the origin point of the canvas
        var newX = this.radius * Math.cos(Math.PI / 4 - this.mouthAnimation.angle) + this.x; 
        var newY = this.radius * Math.sin(Math.PI / 4 - this.mouthAnimation.angle) + this.y;
        ctx.lineTo(newX, newY);

        // can also use built method to return to the starting point of the path
        // (when you use ctx.beginPath()) 
        //ctx.closePath(); 

        ctx.fillStyle = "yellow"
        ctx.fill();

        // draw a border around it
        ctx.strokeStyle = "black";
        ctx.stroke();
            
        // draw the eye.
        ctx.beginPath(); // this is a completely new shape 
            
        ctx.arc(
            this.x, this.y - this.radius / 2, // go halfway up from the midpoint
            this.radius * 0.15, // the eye will have 15% the radius size of the pacman itself
            0, 2 * Math.PI // it will be a full circle
        );

        ctx.fillStyle = "black";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();

        ctx.restore();
    },
    this.update = function(){
        this.x += this.speed.dx;
        this.y += this.speed.dy;
        this.mouthAnimation.update();
        this.lockToScreen();

    },
    this.lockToScreen = function(){
        // if pacman every goes offscreen, he'll be locked back into the canvas.
        if(this.x + this.radius >= canvas.width){
            this.x = canvas.width - this.radius;
        }

        if(this.x - this.radius <= 0){
            this.x = this.radius;
        }

        if(this.y + this.radius >= canvas.height){
            this.y = canvas.height - this.radius;
        }

        if(this.y - this.radius <= 0){
            this.y = this.radius;
        }
    },
    this.move = function(signal){

        if(signal == 38 || signal == "UP"){
                this.direction = {
                    name : "UP",
                    angle : Math.PI * (3/2)
                };
                this.speed.dy = -this.speed.magnitude;
                this.speed.dx = 0;
        } else if (signal == 37 || signal == "LEFT"){
                this.direction = {
                    name : "LEFT",
                    angle : Math.PI
                };
                this.speed.dx = -this.speed.magnitude;
                this.speed.dy = 0;
        } else if (signal == 40 || signal == "DOWN"){
                this.direction = {
                    name: "DOWN",
                    angle : Math.PI / 2
                };
                this.speed.dx = 0;
                this.speed.dy = this.speed.magnitude;
        } else if (signal == 39 || signal == "RIGHT"){
                this.direction = {
                    name : "RIGHT",
                    angle : 0
                };
                this.speed.dx = this.speed.magnitude;
                this.speed.dy = 0;
        }
    }
}

// checks for collisions with JUST pacman into other objects.
// Ghosts don't collide with the dots, just pacman and the walls.
function CollisionChecker(pacman, dots, walls){
    this.update = function(){
        for(var i = 0; i < dots.length; i++){
            if(cirlcesIntersect(pacman, dots[i])){
                dots.splice(i, 1); // remove the doct from the game
            }
        }
        for(var i = 0; i < walls.length; i++){
            // check wall collisions
        }
    }
}

var pacman = new Pacman(500, 500, 20);

var dots = []
var walls = []
var checker = new CollisionChecker(pacman, dots, walls);

function start(){
    ctx.clearRect(0,0,canvas.height, canvas.width);
    pacman.draw();
    pacman.update();
    dots.forEach(function(obj){
        obj.draw();
        obj.update();
    });
    walls.forEach(function(wall){
        wall.draw();
    });
    checker.update();
    window.requestAnimationFrame(start);
}

start();