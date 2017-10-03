var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var angle = 0

document.addEventListener("keydown", function(event){
    pacman.move(event.keyCode);
}, false); 

function Pacman(x, y, radius, speed){
    this.speed = speed || {
        dx : 0,
        dy : 0
    },
    this.x = x;
    this.y = y;
    this.radius = radius;
    angle = 0;
    this.draw = function(){
        ctx.save();
        ctx.translate(this.x, this.y); // translates the entire co-ordinate system, x, y are our new 0,0
        ctx.rotate(angle); // rotate the entire canvas
        ctx.translate(-this.x, -this.y); // offset based on the initial translation            
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI / 4, Math.PI * 1.75);
        ctx.lineTo(this.x, this.y);

        // can calculate the final position using co-ordinate transformation

        // requires x offset since the default starting point is the origin point of the canvas
        var newX = this.radius * Math.cos(Math.PI / 4) + this.x; 
        var newY = this.radius * Math.sin(Math.PI / 4) + this.y;
        ctx.lineTo(newX, newY);

        // can also use built method to return to the starting point of the path
        // (when you use ctx.beginPath()) 
        // ctx.closePath();

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
    }
    this.move = function(keyCode){
        switch(keyCode){
            case 38: // UP
                this.speed.dy = -1;
                this.speed.dx = 0;
                angle = Math.PI * (3/2);
                break;
            case 37: // LEFT
                angle = Math.PI;
                this.speed.dx = -1;
                this.speed.dy = 0;
                break;
            case 40: // DOWN
                angle = Math.PI / 2;
                this.speed.dx = 0;
                this.speed.dy = 1;
                break;
            case 39: // RIGHT
                angle = 0;
                this.speed.dx = 1;
                this.speed.dy = 0;
        }
    }
}

var pacman = new Pacman(100, 100, 50);

function start(){

    ctx.clearRect(0,0,canvas.height, canvas.width);
    pacman.draw();
    pacman.update();
    window.requestAnimationFrame(start);
}
start();