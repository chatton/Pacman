var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var angle = 0

document.addEventListener("keydown", function(event){
    pacman.move(event.keyCode);
}, false); 



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
        dy : 0
    },
    this.x = x;
    this.y = y;
    this.radius = radius;
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
    this.move = function(keyCode){
        switch(keyCode){
            case 38: // UP
                this.direction = {
                    name : "UP",
                    angle : Math.PI * (3/2)
                };
                this.speed.dy = -1;
                this.speed.dx = 0;
                break;
            case 37: // LEFT
                this.direction = {
                    name : "LEFT",
                    angle : Math.PI
                };
                this.speed.dx = -1;
                this.speed.dy = 0;
                break;
            case 40: // DOWN
                this.direction = {
                    name: "DOWN",
                    angle : Math.PI / 2
                };
                this.speed.dx = 0;
                this.speed.dy = 1;
                break;
            case 39: // RIGHT
                this.direction = {
                    name : "RIGHT",
                    angle : 0
                };
                this.speed.dx = 1;
                this.speed.dy = 0;
        }
    }
}

var pacman = new Pacman(100, 100, 25);

function start(){
    ctx.clearRect(0,0,canvas.height, canvas.width);
    pacman.draw();
    pacman.update();
    window.requestAnimationFrame(start);
}
start();