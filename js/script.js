const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var angle = 0

document.addEventListener("keydown", function(event){
    pacman.move(event.keyCode); // the pacman move function can take an event code to act as signal
}, false); 

// keep track of "score", meaningless value to display during and at the end of the game.
var playerScore = 0;
var level;
var graph;
var tileSize;
var time = 0;
var showPath = false;
var ghostsScared = false;
var gameOver = false;

// read in a file based on what the user provides.
document.getElementById("fileinput").addEventListener("change", event => {
    playedVictorySound = false;
    showPath = false;
    gameOver = false;
    ghostsScared = false;
    pacman.lives = 2;
    playerScore = 0;
    var f = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        // content is a string containing the contents of the file.
        var content = e.target.result;  
        level = new Level(content);
        level.build();
        tileSize = level.tileSize;
        const sound = new Audio("res/sounds/beginning.wav");
        sound.play();

    }
    reader.readAsText(f);
}, false);



/*
Helper functions
*/

function removeFromArray(obj, arr) {
    for(var i = 0; i < arr.length; i++){
        if(arr[i] === obj){
            arr.splice(i, 1)
            return;
        }
    }
}

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
    const dx = obj1.x - obj2.x; // distance in x co-ord
    const dy = obj1.y - obj2.y; // distance in y co-ord
    const distance = Math.sqrt((dx * dx) + (dy * dy)); // pythagoras' theorem
    return distance < (obj1.radius + obj2.radius);
}

// returns a random point on the level. That is also traversable.
function getRandomPoint(){
    let point;
    do {
        const x = Math.random() * (canvas.width / level.tileSize); // number within the correct x/y range
        const y = Math.random() * (canvas.height / level.tileSize);
        point = level.get(Math.floor(x),Math.floor(y));
    } while(!exists(point) || !point.isPassable); // ensure point is passable.
    return point;
}

// gets the corrseponding point on the graph.
function getPoint(x, y){
    return level.get(Math.floor(x / tileSize), Math.floor(y / tileSize));
}

// easy access to pacman's location.
function getPacmanPoint(){
    return getPoint(pacman.x, pacman.y);
}

function distanceBetween(point1, point2){
    // use manhattan distance as metric
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
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

        element.neighbours.forEach(n => {
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

class Node {
    constructor(isPassable, x, y){
        this.isPassable = isPassable; // if it can be traversed.
        this.neighbours = []; // the connected nodes.
        this.x = x;
        this.y = y;
    }
}

class Level {
    constructor(levelAsString){
        this.levelAsString = levelAsString;
        this.graph = new Map();
        this.start;
    }
  
    get(x, y){
        return this.graph.get(String(x) + " " + String(y));
    }

    getStartPoint(){
        return this.start;
    }

    build(){
        wipeArrays([ghosts, dots, walls, pellets]);
        const rows = this.levelAsString.split("\n");    
        this.tileSize = canvas.width / (rows[0].length - 1);
        for(let i = 0; i < rows.length; i++){
            for(let j = 0; j < rows[0].length; j++){        
                const char = rows[i][j];
                

                // determine if the node is passable.
                const passable = char != "#" // walls are NOT passable.
                const node = new Node(passable, j, i);

                // add the node to the graph
                this.graph.set(String(j) + " " + String(i), node);
                
                if(char == "S"){
                    this.start = node;
                    // this is the starting position for pacman
                    // move him to the starting location.
                    pacman.resize((this.tileSize / 2) * 0.8); // tilesize/ 2 to fit in one tile
                    // x 0.8 to make it fill up 80% of the tile instead of the whole space.
                    pacman.stop(); // so velocity from previous level doesn't carry over.
                    pacman.reposition(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2);
                    // pacman.reposition(j, i)
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
        for(let i = 0; i  < rows.length; i++){
            for(let j = 0; j < rows[0].length; j++){
                const node = this.get(j,i);
                const aboveNode = this.get(j, i-1);
                const leftNode = this.get(j - 1, i);
                const rightNode = this.get(j + 1, i);
                const downNode = this.get(j, i+1);
                
                // add the 4 surrounding nodes if they exist.
                const neighbours = [aboveNode, leftNode, rightNode, downNode];
                neighbours.forEach(n => {
                    if(exists(n)){
                        node.neighbours.push(n);
                    }
                });
            }
        }
    }
} // Level

class Wall {

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
   
    draw(){
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y , this.width, this.height);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y , this.width, this.height);
    }
}


class Ghost {

    constructor(x, y, width, height){
        this.speed =  {
            dx : 0,
            dy : 0,
            magnitude : 0.8
        },
        this.borderCol = "black";
        this.bodyCol = "green";
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.path = []; 
    }
    
    draw(){
        ctx.beginPath();
        ctx.fillStyle = ghostsScared ? "blue" : this.bodyCol;
        ctx.arc(this.x , this.y, this.width, Math.PI, 2* Math.PI);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.arc(this.x + this.width / 2, this.y + this.height, this.width * 0.5, 0, Math.PI);
        ctx.arc(this.x + this.width / 2 - this.width , this.y + this.height, this.width * 0.5, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this.borderCol;
        ctx.stroke();

        if(showPath){ // have the PathPellet power up.
            ctx.beginPath();
            ctx.strokeStyle = ghostsScared ? "blue" : "red";
            ctx.moveTo(this.x, this.y);
            // draw lines all the way along the path the ghost will go
            for(var i = 1; i < this.path.length; i++){
                ctx.lineTo(this.path[i].x * tileSize + tileSize/ 2, this.path[i].y * tileSize + tileSize /2 );
            }
            var lastNode = this.path[this.path.length - 1];
            if(exists(lastNode)){
                // draw a little dot at the end of the path
                ctx.arc(lastNode.x * tileSize + tileSize / 2, lastNode.y * tileSize + tileSize/2, 2, 0, 2 * Math.PI);
            }
           ctx.stroke();
        }
    }

    die(){
        const deathSound = new Audio("res/sounds/pacman_eatghost.wav");
        deathSound.play();
        const g = new Ghost(this.x, this.y, this.width, this.height);
        g.destination = getRandomPoint();
        g.currentPoint = getPoint(g.x, g.y);
        playerScore += 200;
        removeFromArray(this, ghosts);
        setTimeout(() => {
            ghosts.push(g); // ghost respawns after 5 seconds
        }, 5000);

    }
    /*
    providing an x/y co-ordinate to the setDestination method
    will make that ghost navigate towards that point on the board.
    */
    setDestination(x, y){ 
        this.destination = getPoint(x,y);
    }

    update(){
        this.x += this.speed.dx;
        this.y += this.speed.dy;
        this.currentPoint = getPoint(this.x, this.y);
        if(time % 30 == 0){ // don't need to calculate path for every ghost on every tick
            var pacmanPoint = getPacmanPoint();
            this.borderCol = "black";
            if(!ghostsScared && distanceBetween(this.currentPoint, pacmanPoint) <= 5){ // close to pacman
                this.destination = pacmanPoint; // the ghost now moves towards him
                this.borderCol = "red"; // ghosts are drawn with a red outline.
            }

            this.path = constructPathBFS(this.currentPoint, this.destination);

            if(this.path.length >= 2){ // there's more path to go, so go to the next node
                this.currentTarget = this.path[1];
            } else { // already at the target.
                this.currentTarget = this.path[0];
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
    }

     move(signal){
        this.currentDirection = signal;
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
class Dot{
    
    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.scale = 1;
    }

    draw(){
        ctx.beginPath();
        ctx.fillStyle = "yellow";
        ctx.strokeStyle = "black";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}


// the things pacman eats to make the ghosts vulnerable/scared of pacman
class PowerPellet {
    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
   
    draw(){
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);7
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    onCollected(){
        const sound = new Audio("res/sounds/pacman_eatfruit.wav");
        sound.play();
        ghostsScared = true; // ghosts can now be eaten by pacman.
        setTimeout(() => {ghostsScared = false;}, 10000); // lasts for 10 seconds.
    }
}

class PathPellet {

    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
   
    draw(){
        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    onCollected(){
        showPath = true; // AI ghost paths will now be displayed
        setTimeout(()=>{showPath = false; },15000); // lasts for 15 seconds, then sets it back to false.
    }
}

class Pacman {

    constructor(x, y, radius, speed){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed || {
            dx : 0,
            dy : 0,
            magnitude : 3
        }
        this.lives = 2;
        this.direction = {
            name : "RIGHT",
            angle : 0
        }

        // mouth animation object in charge of providing the "angle"
        // variable to add/remove to the ctx.arc of drawing pacman
        // to make the mouth open and close.
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
        }
    } // constructor 

    resize(radius) {
        this.radius = radius;
    }

    // halts all movement on pacman
    stop(){
        this.speed.dx = 0;
        this.speed.dy = 0;
    }
    // provide a new location for pacman to spawn
    reposition(x, y){
        this.x = x;
        this.y = y;
    }
    /*
    in some cases pacman is treated as a rectangle for
    collision purposes, this method provides an easy
    way to access that.
    */
    asRect(){
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            height : 2 * this.radius,
            width : 2 * this.radius
        }
    }
    draw(){
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
        const newX = this.radius * Math.cos(Math.PI / 4 - this.mouthAnimation.angle) + this.x; 
        const newY = this.radius * Math.sin(Math.PI / 4 - this.mouthAnimation.angle) + this.y;
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
    }
    die(){
        if(this.lives-- == 0){
            // play a death sound on game over.
            const deathSound = new Audio("res/sounds/pacman_death.wav");
            deathSound.play();
            gameOver = true;
        }
        this.stop();
        // send back to the starting point.
        var startingPoint = level.getStartPoint();
        this.reposition(startingPoint.x * tileSize + tileSize / 2, startingPoint.y * tileSize + tileSize / 2);
    }
    update(){
        this.x += this.speed.dx;
        this.y += this.speed.dy;
        this.mouthAnimation.update();
    }
    move(signal){
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
class CollisionChecker {
    // we don't want to heard multiple instances of the sound each time.
    // so make it a class variable and re-use so there's no overlap.
    
    constructor(dots, walls, ghosts){
        this.sound = new Audio("res/sounds/chomp.wav");
        this.dots = dots;
        this.walls = walls;
        this.ghosts = ghosts;
    }

    update(){
        for(let i = 0; i < dots.length; i++){
            if(cirlcesIntersect(pacman, dots[i])){
                dots.splice(i, 1); // remove the dot from the game
                this.sound.play();
                playerScore += 100;
            }
        }
        for(let i = 0; i < walls.length; i++){
            handleWallCollisions(pacman, walls[i]);
        }
        for(let i = 0; i < pellets.length; i++){
            if(cirlcesIntersect(pacman, pellets[i])){
                pellets[i].onCollected();
                pellets.splice(i, 1); // remove the pellet from the game
            }
        }

        ghosts.forEach(ghost => {
            if(rectanglesCollide(pacman.asRect(), ghost)){
                const victim = ghostsScared ? ghost : pacman;
                victim.die();
            }
        });
    }
}

function rectanglesCollide(rect1, rect2){
    const dx = (rect1.x  + rect1.width / 2) - (rect2.x + rect2.width / 2);
    const dy = (rect1.y + rect1.height / 2) - (rect2.y + rect2.height /2)
    const width = (rect1.width + rect2.width) / 2;
    const height = (rect1.height + rect2.height) /2;
    return Math.abs(dx) <= width && Math.abs(dy) <= height;

}

function handleWallCollisions(pacman, wall){
    // I found this algorithm on this SO post
    // https://stackoverflow.com/questions/29861096/detect-which-side-of-a-rectangle-is-colliding-with-another-rectangle
    
    // handle collisions between pacman and wall as a rectangle to avoid corner issues.
    // no need to treat pacman as a circle here.
    const pacmanRect = pacman.asRect();

    const dx = (pacmanRect.x  + pacmanRect.width / 2) - (wall.x + wall.width / 2);
    const dy = (pacmanRect.y + pacmanRect.height / 2) - (wall.y + wall.height /2)
    const width = (pacmanRect.width + wall.width) / 2;
    const height = (pacmanRect.height + wall.height) /2;
    const crossWidth = width * dy;
    const crossHeight = height * dx;

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

function buildImage(options){
    const image = new Image();
    image.src = options.src;
    return image;
}

const background = buildImage({
    src:"res/space.jpg"
});

// let backGroundAngle = 0;
let backgroundScale = 1;
let zoomingIn = true;
let ticks = 0;
function drawBackground(){
    ctx.save();
    ticks++ // counter to indicate the zooming should happen in reverse
    if(ticks == 400){ // do 400 ticks in each direction.
        ticks = 0; // reset the counter.
        zoomingIn = !zoomingIn; // toggle direction
    }

    if(zoomingIn){
        backgroundScale += 0.001;
    } else {
        backgroundScale -= 0.001;
    }
    // scale using tansform
    ctx.transform(backgroundScale,0,0,backgroundScale,0,0);
    ctx.drawImage(background, 0, 0);
    ctx.restore();
}

const dots = [];
const walls = [];
const ghosts = [];
const pellets = [];
const checker = new CollisionChecker(pacman, dots, walls, ghosts);

function clear(colour){
    ctx.fillStyle = colour || "black";
    ctx.fillRect(0, 0, canvas.height, canvas.width);
}

var playedVictorySound  = false;
function start(){
    clear();
    drawBackground();
    time++;
    if(time > 100000){
        time = 0;
    }
    pacman.draw();
    pacman.update();
    ghosts.forEach(ghost => {
        ghost.draw();
        ghost.update();
    });
    dots.forEach(dot => {
        dot.draw();
    });
    walls.forEach(wall => {
        wall.draw();
    });
    pellets.forEach(pellet => {
        pellet.draw();
    });

    checker.update();

    if(dots.length == 0 && playerScore > 0){
        if(!playedVictorySound){
            new Audio("res/sounds/pacman_intermission.wav").play();
            playedVictorySound = true;
        }
        gameOver = true;
        
    }
    if(gameOver){
        clear();
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Game Over", canvas.width / 2 ,canvas.height / 2);
        ctx.fillText("Score: " + playerScore, canvas.width / 2, canvas.height / 2 - 100);
    }

    window.requestAnimationFrame(start);
}

start();