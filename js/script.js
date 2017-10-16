var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var angle = 0

document.addEventListener("keydown", function(event){
    pacman.move(event.keyCode); // the pacman move function can take an event code to act as signal
}, false); 

// keep track of "score", meaningless value to display during and at the end of the game.
var playerScore = 0;
var levelString = "";
var level;
var graph;
var tileSize;
var time = 0;

// read in a file based on what the user provides.
document.getElementById("fileinput").addEventListener("change", function(event){
    var f = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        // content is a string containing the contents of the file.
        var content = e.target.result;  
        levelString = content;
        level = new Level(levelString);
        //graph = new Graph(levelString);
        //graph.build();
        level.build();
        tileSize = level.tileSize;
        var sound = new Audio("res/sounds/beginning.wav");
        //sound.play();

    }
    reader.readAsText(f);
}, false);

function Node(isPassable, x, y){
    this.isPassable = isPassable; // if it can be traversed.
    this.neighbours = []; // the connected nodes.
    this.x = x;
    this.y = y;
}

/*
Helper functions
*/

// function to clear the contents of an existing array
function wipeArray(arr){
    arr.splice(0, arr.length);
}

function wipeArrays(arrays){
    arrays.forEach(function(arr){
        wipeArray(arr);
    });
}

function exists(obj){
    return typeof obj !== "undefined";
}

function cirlcesIntersect(obj1, obj2){
    var dx = obj1.x - obj2.x; // distance in x co-ord
    var dy = obj1.y - obj2.y; // distance in y co-ord
    var distance = Math.sqrt((dx * dx) + (dy * dy)); // pythagoras' theorem
    return distance < (obj1.radius + obj2.radius);
}

// returns a random point on the level.
function getRandomPoint(){
    var point;
    do {
        var x = Math.random() * (canvas.width / level.tileSize); // number within the correct x/y range
        var y = Math.random() * (canvas.height / level.tileSize);
        point = level.get(Math.floor(x),Math.floor(y));
    } while(!exists(point) || !point.isPassable); // ensure point is passable.
    return point;
}

function getPoint(x, y){
    return level.get(Math.floor(x / tileSize), Math.floor(y / tileSize));
}

function getPacmanPoint(){
    return getPoint(pacman.x, pacman.y);
}

/*
Function that performs a Breadth First Search (BFS)
on a starting "from" point and constructs a list of Node
objects that represent a path to the "to" point.
*/
function constructPathBFS(from, to){
    var visited = new Set(); // keep track of the visited nodes
    // using a set to get constant time element search to speed things up.
    var queue = [from]; // the current node to be visited, starts off at the "from" starting point.
    while(queue.length > 0){ // until there are no more nodes left
        var element = queue.pop(); // examine the current node
        visited.add(element); // we have now visited it.

        if(element === to){ // if we've reached the destination
            var path = []; // begin path construction
            var current = element; 
            while(current !== from){
                path.push(current);
                current = current.prev;
            }
            path.push(from);
            path.reverse();// change from dest - start, to start - dest
            return path; // the fully constructed path
        }

        element.neighbours.forEach(function(n){
            // only care about a node if we haven't seen it
            // and it isn't a wall
            if(n.isPassable && !visited.has(n)){
               n.prev = element;
               queue.unshift(n); // add to the queue
            }
        });
    }
    return [] // no path found
}

function Level(levelAsString){
    this.levelAsString = levelAsString;
    this.graph = new Map();
    this.get = function(x, y){
        return this.graph.get(String(x) + " " + String(y));
    }
    this.build = function(){
        wipeArrays([ghosts, dots, walls, pellets]);
        var rows = this.levelAsString.split("\n");    
        this.tileSize = canvas.width / (rows[0].length - 1);
        for(var i = 0; i < rows.length; i++){
            for(var j = 0; j < rows[0].length; j++){        
                var char = rows[i][j];
                var node;

                // determine if the node is passable.
                if(char == "#"){
                    node = new Node(false,j, i);
                } else {
                    node = new Node(true, j, i);
                }  
                // add the node to the graph
                this.graph.set(String(j) + " " + String(i), node);
                
                if(char == "S"){
                    // this is the starting position for pacman
                    // move him to the starting location.
                    pacman.resize((this.tileSize / 2) * 0.8); // tilesize/ 2 to fit in one tile
                    // x 0.8 to make it fill up 80% of the tile instead of the whole space.
                    pacman.stop(); // so velocity from previous level doesn't carry over.
                    pacman.reposition(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2);
                }
                if(char == "."){ // put a dot there, but in the middle of the tile not on the edge.
                    dots.push(new Dot(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.15));
                }

                if(char == "#"){ // it's wall, add a new wall to be rendered each cycle.
                    walls.push(new Wall(j * this.tileSize, i * this.tileSize, this.tileSize, this.tileSize));
                }  

                if(char == "G"){
                    var g = new Ghost(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize/2) * 0.5, (this.tileSize/2) * 0.5);
                    g.destination = getRandomPoint();
                    ghosts.push(g);
                }

                if(char == "H"){
                    pellets.push(new PathPellet(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.40));
                }

                if(char == "P"){
                    pellets.push(new PowerPellet(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.40));
                }
            } // inner for
        } // outer for
        // second iteration to connect up all the nodes.
        for(var i = 0; i  < rows.length; i++){
            for(var j = 0; j < rows[0].length; j++){
                var node = this.get(j,i);
                var aboveNode = this.get(j, i-1);
                var leftNode = this.get(j - 1, i);
                var rightNode = this.get(j + 1, i);
                var downNode = this.get(j, i+1);
                
                // add the 4 surrounding nodes if they exist.
                var neighbours = [aboveNode, leftNode, rightNode, downNode];
                neighbours.forEach(function(n){
                    if(exists(n)){
                        node.neighbours.push(n);
                    }
                });
            }
        }
    }
} // Level

function Wall(x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.draw = function(){
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y , this.width, this.height);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y , this.width, this.height);
    }
}


function Ghost(x, y, width, height){
    this.speed =  {
        dx : 0,
        dy : 0,
        magnitude : 0.8
    },
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.path = [];
    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x , this.y, this.width, Math.PI, 2* Math.PI);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.arc(this.x + this.width /2 , this.y + this.height, this.width * 0.5, 0, Math.PI);
        ctx.arc(this.x + this.width /2 - this.width , this.y + this.height, this.width * 0.5, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    /*
    providing an x/y co-ordinate to the setDestination method
    will make that ghost navigate towards that point on the board.
    */
    this.setDestination = function(x, y){ 
        this.destination = level.get(Math.floor(x / tileSize), Math.floor(y / tileSize));
    },
    this.update = function(){
        this.x += this.speed.dx;
        this.y += this.speed.dy;
        // gets the corresponding Node from the graph
        //this.currentPoint = level.get(Math.floor(this.x / tileSize), Math.floor(this.y / tileSize));
        this.currentPoint = getPoint(this.x, this.y);
        if(time % 40 == 0){ // don't need to calculate path for every ghost on every tick
            var pacmanPoint = getPacmanPoint();
            var pathToPacman = constructPathBFS(this.currentPoint, pacmanPoint);
            if(pathToPacman.length <= 5){ // close to pacman
                this.destination = pacmanPoint; // the ghost now moves towards him
            }

            var path = constructPathBFS(this.currentPoint, this.destination);
            if(path.length >= 2){ // there's more path to go, so go to the next node
                this.currentTarget = path[1];
            } else { // already at the target.
                this.currentTarget = path[0];
                this.destination = getRandomPoint(); // pick a new point and go there
            } 

            if(this.currentTarget !== this.currentPoint){                
                if(this.currentTarget.x > this.currentPoint.x){
                    this.move("RIGHT");
                } else if(this.currentTarget.x < this.currentPoint.x){
                    this.move("LEFT");
                } else if(this.currentTarget.y < this.currentPoint.y){
                    this.move("UP");
                } else if(this.currentTarget.y > this.currentPoint.y){
                    this.move("DOWN")
                }
            
            }            
        }
    },
     this.move = function(signal){
        if(signal == "UP"){
                this.speed.dy = -this.speed.magnitude;
                this.speed.dx = 0;
        } else if (signal == "LEFT"){
                this.speed.dx = -this.speed.magnitude;
                this.speed.dy = 0;
        } else if (signal == "DOWN"){
                this.speed.dx = 0;
                this.speed.dy = this.speed.magnitude;
        } else if (signal == "RIGHT"){
                this.speed.dx = this.speed.magnitude;
                this.speed.dy = 0;
        }
    }
}


// the things pacman eats to get points and progress
function Dot(x, y, radius){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = "yellow";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}


// the things pacman eats to make the ghosts vulnerable/scared of pacman
function PowerPellet(x, y, radius){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function PathPellet(x, y, radius){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
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
        magnitude : 3
    },
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.resize = function(radius){
        this.radius = radius;
    },
    // halts all movement on pacman
    this.stop = function(){
        this.speed.dx = 0;
        this.speed.dy = 0;
    },
    // provide a new location for pacman to spawn
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
    }
    this.move = function(signal){
        // signal can be a string or an event keyCode
        if(signal == 38 || signal == "UP"){
                this.direction = {
                    name : "UP",
                    angle : Math.PI * (3/2) // angle pacman should be facing when he is in this direction
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
function CollisionChecker(pacman, dots, walls, ghosts){
    // we don't want to heard multiple instances of the sound each time.
    // so make it a class variable and re-use so there's no overlap.
    this.sound = new Audio("res/sounds/chomp.wav");
    this.update = function(){
        for(var i = 0; i < dots.length; i++){
            if(cirlcesIntersect(pacman, dots[i])){
                dots.splice(i, 1); // remove the dot from the game
                //this.sound.play();
                playerScore += 100;
            }
        }
        for(var i = 0; i < walls.length; i++){
            handleWallCollisions(pacman, walls[i]);
        }
    }
}


function handleWallCollisions(pacman, wall){
    // I found this algorithm on this SO post
    // https://stackoverflow.com/questions/29861096/detect-which-side-of-a-rectangle-is-colliding-with-another-rectangle
    
    // handle collisions between pacman and wall as a rectangle to avoid corner issues.
    // no need to treat pacman as a circle here.
    pacmanRect = {
        x: pacman.x - pacman.radius,
        y: pacman.y - pacman.radius,
        size : 2 * pacman.radius
    }

    var dx = (pacmanRect.x  + pacmanRect.size / 2) - (wall.x + wall.width / 2);
    var dy = (pacmanRect.y + pacmanRect.size / 2) - (wall.y + wall.height /2)
    var width = (pacmanRect.size + wall.width) / 2;
    var height = (pacmanRect.size + wall.height) /2;
    var crossWidth = width * dy;
    var crossHeight = height * dx;

    if(Math.abs(dx) <= width && Math.abs(dy) <= height){ // collision
        if(crossWidth > crossHeight){ // pacman is below or to the left
            if(crossWidth > - crossHeight){ // pacman is below
                pacman.y = wall.y + wall.height + pacman.radius + 1;
            } else{ // pacman is to the left
                pacman.x = wall.x - pacman.radius - 1;
            }
        }else { // pacman is above or to the right
            if(crossWidth > -crossHeight){ // pacman is to the right
                pacman.x = wall.x + wall.width + pacman.radius + 1;
            } else{ // pacman is above
                pacman.y = wall.y - pacman.radius - 1;
            }
        }
    }
}

var pacman = new Pacman(500, 500, 20);

var dots = [];
var walls = [];
var ghosts = [];
var pellets = [];
var checker = new CollisionChecker(pacman, dots, walls, ghosts);

function clear(colour){
    ctx.fillStyle = colour || "black";
    ctx.fillRect(0, 0, canvas.height, canvas.width);
}

function start(){
    clear();
    time++;
    if(time > 100000){
        time = 0;
    }
    pacman.draw();
    pacman.update();
    ghosts.forEach(function(ghost){
        ghost.draw();
        ghost.update();
    });
    dots.forEach(function(dot){
        dot.draw();
    });
    walls.forEach(function(wall){
        wall.draw();
    });
    pellets.forEach(function(pellet){
        pellet.draw();
    });

    checker.update();
    window.requestAnimationFrame(start);
}

start();