
// Components are bags of data with no behaviour, they are operated on by the different systems.

class SeekerComponent {
    constructor(x, y){
        this.destination = {x:x, y:y};
    }
}

class RectangleComponent {
    constructor(width, height){
        this.width = width;
        this.height = height;
    }
}

class DirectionComponent {
    constructor(){
        this.angle = 0;
        this.name = "RIGHT";
    }
}

class CircleComponent {
    constructor(radius, startAngle, finishAngle) {
        this.radius = radius;
        this.startAngle = startAngle || 0;
        this.finishAngle = finishAngle || 2 * Math.PI;
    }
}

class ColourComponent {
    constructor(fillStyle, strokeStyle){
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
    }
}

class PlayerControlledComponent {
    constructor(){

    }
}

class PositionComponent {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}

class SpeedComponent {
    constructor(dx, dy){
        this.dx = dx;
        this.dy = dy;
    }
}


// Systems take in entities and operate directly on their components.

class VelocitySystem {
    
    constructor(){
        this.entities = [];
        this.requirements = [
            "PositionComponent",
            "SpeedComponent"
        ];
    }

    add(entity) {
        this.entities.push(entity);
    }

    remove(entity) {
        removeFromArray(entity, this.entities);
    }

    update() {
        this.entities.forEach(function(entity){
            var speed = entity.getComponent("SpeedComponent");
            var position = entity.getComponent("PositionComponent");
            position.x += speed.dx;
            position.y += speed.dy;
        });
    }
}

class SeekerSystem {
    
    constructor(){
        this.entities = [];
        this.requirements = [
            "PositionComponent",
            "SpeedComponent",
            "SeekerComponent"
        ];
        this.time = 0;
    }

    add(entity) {
        this.entities.push(entity);
    }

    remove(entity) {
        removeFromArray(entity, this.entities);
    }

    update() {
        this.time++;
        if(!(this.time % 30 == 0)){ // don't want to calculate the path every cycle.
            return;
        }

        for(var i = 0; i < this.entities.length; i++){
            
            // TODO make them go towards pacman if they're close!


            var entity = this.entities[i];
            var seeker = entity.getComponent("SeekerComponent");
            var position = entity.getComponent("PositionComponent");
            var speed = entity.getComponent("SpeedComponent");


            var dest = seeker.destination; // this is where the ghost is trying to go.
            var destinationPoint = level.get(dest.x, dest.y); // get the corresponding node in the level.

            var x = Math.floor(position.x / tileSize);
            var y = Math.floor(position.y / tileSize);

            var currentPoint = level.get(x, y); // where the ghost currently is.
            var path = constructPathBFS(currentPoint, destinationPoint);

            var target;
            if(path.length >= 2){ // there's more path to go
                target = path[1];
            } else {
                var newPoint = getRandomPoint();
                seeker.destination = {x:newPoint.x, y:newPoint.y}; // ghost will now try and move here.
                target = newPoint;
            }
    
            if(currentPoint !== target){ // haven't reached the target yet
                if (target.x > currentPoint.x){
                    speed.dx = 1; // go right
                    speed.dy = 0;
                } else if (target.x < currentPoint.x){
                    speed.dx = -1; // go left
                    speed.dy = 0;
                } else if(target.y < currentPoint.y){
                    speed.dx = 0;
                    speed.dy = -1; // go up
                } else if (target.y > currentPoint.y){
                    speed.dx = 0;
                    speed.dy = 1; // go down
                }
            }
        }

    }
}


class RenderSystem {
    constructor(){
        this.requirements = ["RenderComponent"]
        this.entities = [];
    }

    add(entity){
        this.entities.push(entity);
    }

    remove(entity){
        removeFromArray(entity, this.entities);
    }

    update(){
        this.entities.forEach(function(entity){
            // "RenderComponent" can be any type of component that can be rendered. E.g. "Circle"/"Rectangle"/"Pacman"
            var renderComponent = entity.getComponent("RenderComponent");
            renderComponent.render();
        });
    }
}

class RenderComponent {

    constructor(renderable){
        this.renderable = renderable;
    }

    render(){
        this.renderable.render();
    }
}


class CircleRenderer {

    constructor(entity) {
        this.entity = entity;
    }

    render(){
        var position = this.entity.getComponent("PositionComponent");
        var colour = this.entity.getComponent("ColourComponent");
        var circle = this.entity.getComponent("CircleComponent");

        ctx.beginPath();
        ctx.fillStyle = colour.fillStyle;
        ctx.arc(position.x, position.y, circle.radius, circle.startAngle, circle.finishAngle);
        ctx.fill();
        ctx.strokeStyle = colour.strokeStyle;
        ctx.stroke();
    }
}

class RectangleRenderer {

    constructor(entity){
        this.entity = entity;
    }

    render(){
        // this system draws every entity that can is a circle.
        var position = this.entity.getComponent("PositionComponent");
        var colour = this.entity.getComponent("ColourComponent");
        var rect = this.entity.getComponent("RectangleComponent");

        ctx.beginPath();
        ctx.fillStyle = colour.fillStyle;
        ctx.strokeStyle = colour.strokeStyle;
        ctx.rect(position.x, position.y, rect.width, rect.height);
        ctx.fill();
        ctx.stroke();
    }
}

class PlayerControlSystem {
    constructor() {
        this.entities = [];
        this.requirements = [
            "PlayerControlledComponent",
            "SpeedComponent"
        ];
    }
    update() {
        this.entities.forEach(function(entity){
            var position = entity.getComponent("PositionComponent");
            var speed = entity.getComponent("SpeedComponent");
        });

    }
}

class Entity {

    constructor() {
        this.components = new Map(); // entity is just a bag of components. No logic.
    }

    add(component) {
        var componentType = component.constructor.name;
        this.components.set(componentType, component);
        return this;
    }

    removeComponent(type){
        // update all systems.
        var component = this.components.get(type);
        this.components.delete(type);
        return component;
    }

    getComponent(type) {
        return this.components.get(type);
    }
}


class Engine {

    constructor() {
        this.entities = [];
        this.systems = [];
    }

    reset(){ // remove all entities from the game.
        wipeArray(this.entities);
        this.systems.forEach(function(sys){
            wipeArray(sys.entities); 
        });
    }

    removeEntity(entity) {
        for(var i = 0; i < this.systems.length; i++){
            if(this.systemHasEntity(entity)){
                this.removeEntityFromSystem(entity);
            }
        }
        removeFromArray(entity, this.entities);
    }
    
    systemHasEntity(system, entity){
        return contains(entity, system.entities);
    }

    removeEntityFromSystem(entity, system){
        removeFromArray(entity, system.entities);
    }

    addSystem(system) {
        this.systems.push(system);
    }

    addEntity(entity) {
        for(var i = 0; i < this.systems.length; i++){
            if(this.entityMeetsRequirementsFor(entity, this.systems[i])){
                this.systems[i].add(entity);
            }
        }
        this.entities.push(entity);
    }

    entityMeetsRequirementsFor(entity, system) {
        var requirements = system.requirements;
        for(var i = 0; i < requirements.length; i++){
            if(entity.getComponent(requirements[i]) === undefined){
                return false;
            }
        }
        return true;
    }

    update() {
        this.systems.forEach(function(sys){
            sys.update();
        });
    }
}

var engine = new Engine();
engine.addSystem(new SeekerSystem()); // seeker system handles any entity that has a "target", e.g. a ghost looking for pacman
engine.addSystem(new VelocitySystem()); // handles all movement.
engine.addSystem(new RenderSystem()); // handles drawing of entities that can be drawn.
// engine.addSystem(new PlayerControlSystem());

// functions to create different entities in the game.
function makeDot(x, y, radius){
    var dot = new Entity();
    dot.add(new PositionComponent(x, y)); // dot consists of a position
    dot.add(new CircleComponent(radius)); // a radius
    dot.add(new ColourComponent("yellow", "black")); // and colour.
    dot.add(new RenderComponent(new CircleRenderer(dot)));
    // TODO add collidable component.
    return dot;
}

function makeWall(x, y, width, height){
    var wall = new Entity();
    wall.add(new PositionComponent(x, y));
    wall.add(new RectangleComponent(width, height));
    wall.add(new ColourComponent("black", "blue"));
    wall.add(new RenderComponent(new RectangleRenderer(wall)));
    // add collidable component.
    return wall;
}

function makeGhost(x, y, width, height, tileSize) {
    var ghost = new Entity();
    ghost.name = "GHOST";
    return ghost.add(new PositionComponent(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2))
            .add(new RectangleComponent(width * (tileSize / 2), height * (tileSize / 2)))
            .add(new ColourComponent("purple", "green"))
            .add(new SeekerComponent(1, 1))
            .add(new SpeedComponent(0,0))
            .add(new RenderComponent(new RectangleRenderer(ghost)))
}

var pacmanDir = new DirectionComponent();
var pacmanSpeed = new SpeedComponent(0,0);

function makePacman(x, y, radius, tileSize) {
    var pacman = new Entity();
    pacman.name = "PACMAN"; // mainly for debugging purposes to identify the pacman entity.
    pacmanSpeed = new SpeedComponent(0,0);
    return pacman.add(new PositionComponent(Math.floor(x * tileSize + tileSize / 2), Math.floor(y * tileSize + tileSize / 2)))
        .add(new ColourComponent("yellow", "black"))
        .add(pacmanSpeed)
        .add(new CircleComponent(radius))
        .add(pacmanDir)
        .add(new RenderComponent(new PacmanRenderer(pacman)));
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var angle = 0

// when a keydown event occurs, operate directly on pacmans
// direction and speed components to make him move.

document.addEventListener("keydown", function(event){
    switch(event.keyCode){
        case 38: // UP
            pacmanDir.name = "UP";
            pacmanDir.angle = Math.PI * (3 / 2);
            pacmanSpeed.dy = -3;
            pacmanSpeed.dx = 0;
            break;
        case 37: // LEFT
            pacmanDir.name = "LEFT";
            pacmanDir.angle = Math.PI;
            pacmanSpeed.dx = -3;
            pacmanSpeed.dy = 0;
            break;
        case 40: // DOWN
            pacmanDir.name = "DOWN";
            pacmanDir.angle = Math.PI / 2;
            pacmanSpeed.dx = 0;
            pacmanSpeed.dy = 3;
            break;
        case 39: // RIGHT
            pacmanDir.name = "RIGHT";
            pacmanDir.angle = 0;
            pacmanSpeed.dx = 3;
            pacmanSpeed.dy = 0;
            break;
    }

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
document.getElementById("fileinput").addEventListener("change", function(event){
    showPath = false;
    gameOver = false;
    ghostsScared = false;
    //pacman.lives = 2;
    playerScore = 0;
    var f = event.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        // content is a string containing the contents of the file.
        var content = e.target.result;  
        level = new Level(content);
        level.build();
        tileSize = level.tileSize;
        var sound = new Audio("res/sounds/beginning.wav");
        //sound.play();

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
            return; // early exit.
        }
    }
}

function contains(obj, arr){
    return arr.indexOf(obj) > -1;
}

// function to clear the contents of an existing array
function wipeArray(arr){
    arr.splice(0, arr.length);
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

// returns a random point on the level. That is also traversable.
function getRandomPoint(){
    var point;
    do {
        var x = Math.random() * (canvas.width / level.tileSize); // number within the correct x/y range
        var y = Math.random() * (canvas.height / level.tileSize);
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
    pacmanPosition = pacman.getComponent("PositionComponent");
    return getPoint(pacmanPosition.x, pacmanPosition.y);
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
        engine.reset();
        var rows = this.levelAsString.split("\n");    
        this.tileSize = canvas.width / (rows[0].length - 1);
        for(var i = 0; i < rows.length; i++){
            for(var j = 0; j < rows[0].length; j++){        
                var char = rows[i][j];
                

                // determine if the node is passable.
                var passable = char != "#" // walls are NOT passable. Every other tile is.
                var node = new Node(passable, j, i);

                // add the node to the graph, map keys are dynamically generated.
                this.graph.set(String(j) + " " + String(i), node);
                
                if(char == "S"){
                    this.start = node;
                    // this is the starting position for pacman
                    // move him to the starting location.
                    //pacman.resize((this.tileSize / 2) * 0.8); // tilesize/ 2 to fit in one tile
                    // x 0.8 to make it fill up 80% of the tile instead of the whole space.
                    //pacman.stop(); // so velocity from previous level doesn't carry over.
                    //pacman.reposition(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2);
                    // pacman.reposition(j, i)
                    var pacman = makePacman(j , i, (this.tileSize / 2 ) * 0.8, this.tileSize);
                    engine.addEntity(pacman);
                }
                if(char == "."){ // put a dot there, but in the middle of the tile not on the edge.
                    var dot = makeDot(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.15);
                    engine.addEntity(dot);
                }

                if(char == "#"){ // it's wall, add a new wall to be rendered each cycle.
                    var wall = makeWall(j * this.tileSize, i * this.tileSize, this.tileSize, this.tileSize);
                    engine.addEntity(wall);
                }  

                if(char == "G"){
                    var ghost = makeGhost(j, i, 0.5, 0.5, this.tileSize);
                    engine.addEntity(ghost);
                }

                if(char == "H"){
                    //pellets.push(new PathPellet(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.40));
                }

                if(char == "P"){
                    //pellets.push(new PowerPellet(j * this.tileSize + this.tileSize / 2, i * this.tileSize + this.tileSize / 2, (this.tileSize / 2) * 0.40));
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



class Ghost {
    die(){
        var g = new Ghost(this.x, this.y, this.width, this.height);
        g.destination = getRandomPoint();
        g.currentPoint = getPoint(g.x, g.y);
        playerScore += 200;
        removeFromArray(this, ghosts);
        setTimeout(function(){
            ghosts.push(g);
        }, 5000);

    }
}

// the things pacman eats to make the ghosts vulnerable/scared of pacman
class PowerPellet {
    onCollected(){
        ghostsScared = true; // ghosts can now be eaten by pacman.
        setTimeout(function(){
            ghostsScared = false; // lasts for 15 seconds.
        },15000);
    }
}

class PathPellet {
    onCollected(){
        showPath = true; // AI ghost paths will now be displayed
        setTimeout(function(){
            showPath = false // lasts for 15 seconds, then sets it back to false.
        },15000);
    }
}


/*
class Pacman {
    asRect(){
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            height : 2 * this.radius,
            width : 2 * this.radius
        }
    }
    
    die(){
        if(this.lives-- == 0){
            gameOver = true;
        }
        this.stop();
        // send back to the starting point.
        var startingPoint = level.getStartPoint();
        this.reposition(startingPoint.x * tileSize + tileSize / 2, startingPoint.y * tileSize + tileSize / 2);
    }
   
*/
class PacmanRenderer {
    constructor(pacman){
        this.pacman = pacman;
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
    }

    render(){
        
        var position = this.pacman.getComponent("PositionComponent");
        var colour = this.pacman.getComponent("ColourComponent");
        var direction = this.pacman.getComponent("DirectionComponent");
        var circle = this.pacman.getComponent("CircleComponent");
        
        ctx.save();
        ctx.translate(position.x, position.y); // translates the entire co-ordinate system, x, y are our new 0,0
        // want to flip only if going left, otherwise, the eye is on the bottom left of pacman.
        // We want it on the top left. So a mirror image of facing right is perfect for this.
        if(direction.name == "LEFT"){  
            ctx.scale(1,-1);
        }
        ctx.rotate(direction.angle); // rotate the entire canvas
        ctx.translate(-position.x, -position.y); // offset based on the initial translation            
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, circle.radius, Math.PI / 4 - this.mouthAnimation.angle, Math.PI * 1.75 + this.mouthAnimation.angle);
        ctx.lineTo(position.x, position.y);

        // can calculate the final position using co-ordinate transformation

        // requires x offset since the default starting point is the origin point of the canvas
        var newX = circle.radius * Math.cos(Math.PI / 4 - this.mouthAnimation.angle) + position.x; 
        var newY = circle.radius * Math.sin(Math.PI / 4 - this.mouthAnimation.angle) + position.y;
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
            position.x, position.y - circle.radius / 2, // go halfway up from the midpoint
            circle.radius * 0.15, // the eye will have 15% the radius size of the pacman itself
            0, 2 * Math.PI // it will be a full circle
        );

        ctx.fillStyle = "black";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.restore();

        this.mouthAnimation.update(); // makes the mouth animation update to adjust the opening and closing mouth position.
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
        for(var i = 0; i < pellets.length; i++){
            if(cirlcesIntersect(pacman, pellets[i])){
                pellets[i].onCollected();
                pellets.splice(i, 1); // remove the pellet from the game
            }
        }

        ghosts.forEach(function(ghost){
            if(rectanglesCollide(pacman.asRect(), ghost)){
                var victim = ghostsScared ? ghost : pacman;
                victim.die();
            }
        });
    }
}

function rectanglesCollide(rect1, rect2){
    var dx = (rect1.x  + rect1.width / 2) - (rect2.x + rect2.width / 2);
    var dy = (rect1.y + rect1.height / 2) - (rect2.y + rect2.height /2)
    var width = (rect1.width + rect2.width) / 2;
    var height = (rect1.height + rect2.height) /2;
    return Math.abs(dx) <= width && Math.abs(dy) <= height;

}

function handleWallCollisions(pacman, wall){
    // I found this algorithm on this SO post
    // https://stackoverflow.com/questions/29861096/detect-which-side-of-a-rectangle-is-colliding-with-another-rectangle
    
    // handle collisions between pacman and wall as a rectangle to avoid corner issues.
    // no need to treat pacman as a circle here.
    var pacmanRect = pacman.asRect();

    var dx = (pacmanRect.x  + pacmanRect.width / 2) - (wall.x + wall.width / 2);
    var dy = (pacmanRect.y + pacmanRect.height / 2) - (wall.y + wall.height /2)
    var width = (pacmanRect.width + wall.width) / 2;
    var height = (pacmanRect.height + wall.height) /2;
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

function clear(colour){
    ctx.fillStyle = colour || "black";
    ctx.fillRect(0, 0, canvas.height, canvas.width);
}

function start(){
    clear();
    engine.update();
    window.requestAnimationFrame(start);
}

start();