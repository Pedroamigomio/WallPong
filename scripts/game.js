

window.onload = createGameParts;

window.requestAnimFrame = (function(callback) 
							{return 	window.requestAnimationFrame || 
										window.webkitRequestAnimationFrame || 
										window.mozRequestAnimationFrame || 
										window.oRequestAnimationFrame || 
										window.msRequestAnimationFrame ||
										function(callback) {
											window.setTimeout(callback, 1000 / 60);
										};
							})();
							

function createGameParts(){
    var canvas = document.getElementById("gameCanvas");
    canvas.width = window.innerWidth * 0.85;
    canvas.height = canvas.width * (9 / 16);
    var context = canvas.getContext('2d');

    var BU = canvas.width / 1400;

    var fieldUpperLeftX = 10*BU;
    var fieldUpperLeftY = 20 * BU;
    var fieldWidth = canvas.width - 20 * BU;
    var fieldHeight = canvas.height - 40 * BU;
    var fieldLineWidth = 10 * BU;
    var paddleWidth = 140 * BU;
    var paddleHeight = 20 * BU;
    var paddleSpeed = 35 * BU;
    var ballRadius = 10 * BU;
    var ballSpeed = 45 * BU;
    var ballDir = getRand(6, 9) * Math.PI / 5;

    var field = new Field(fieldUpperLeftX, fieldUpperLeftY, fieldWidth, fieldHeight, fieldLineWidth);
    var paddle = new Paddle(canvas.width / 2, fieldUpperLeftY + fieldHeight, paddleWidth, paddleHeight, paddleSpeed, fieldUpperLeftX, fieldUpperLeftX + fieldWidth, 0.2 * paddleWidth, 0.1 * paddleWidth, Math.PI / 10);
    var ball = new Ball(canvas.width / 2, canvas.height / 2, ballRadius, ballSpeed, ballDir);

	setTimeout(function () {
	    animate(field, paddle, ball, canvas, context, (new Date()).getTime());
	}, 1000);
};


function animate(field, paddle, ball, canvas, context, previoustime) {
    var now = (new Date()).getTime();
    var timediff = (now - previoustime)/100;

    if (field.bounceBall(ball) == false) {
        if (paddle.bounceBall(ball) == false) {
            // fail - reset ball, update score
        }
    }

    paddle.move(timediff);
    ball.move(timediff);

    context.clearRect(0, 0, canvas.width, canvas.height);
    field.draw(context);
    paddle.draw(context);
    ball.draw(context);

    requestAnimFrame(function () {
        animate(field, paddle, ball, canvas, context, now);
    });
	
};



// **********  Ball  **********

function Ball(x, y, r, v, ro) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.v = v; // px/sec
    this.ro = ro; // rad - 0 is 3 o'clock - clockwise+
}

Ball.prototype.move = function (timediff) {
    this.x += this.v * timediff * Math.cos(this.ro);
    this.y += this.v * timediff * Math.sin(this.ro);

};

Ball.prototype.draw = function (context) {
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'orange';
    context.stroke();

};
// **********  End of Ball  **********


// **********  Paddle  **********

function Paddle(upperLeftX, upperLeftY, width, height, v, leftBoundary, rightBoundary, chamferX, chamferY, delta) {
    this.upperLeftX = upperLeftX;
    this.upperLeftY = upperLeftY;
    this.width = width;
    this.height = height;
    this.v = v; // px/sec
    this.leftBoundary = leftBoundary;
    this.rightBoundary = rightBoundary;
    this.chX = chamferX;
    this.chY = chamferY;
    this.beta = chamferX != 0 ? Math.atan(this.chY / this.chX) : 0; // +- beta angle added at the chamfered part to the bounce angle
    this.delta = delta; // +- delta angle added if the paddle is moving
}

Paddle.prototype.move = function (timediff) {
    if (Key.isDown(Key.A) && this.upperLeftX >= this.leftBoundary) {
        this.upperLeftX -= this.v * timediff;
    }
    if (Key.isDown(Key.D) && this.upperLeftX + this.width <= this.rightBoundary) {
        this.upperLeftX += this.v * timediff;
    }
};

Paddle.prototype.bounceBall = function (ball) {

    if (ball.x >= this.upperLeftX + this.chX && ball.x <= this.upperLeftX + this.width - this.chX && ball.ro < Math.PI) {
        ball.ro = 2 * Math.PI - ball.ro; // bouncing from the horizontal part
        if (Key.isDown(Key.A)) {
            ball.ro -= this.delta;
        } else if (Key.isDown(Key.D)) {
            ball.ro += this.delta;
        }
        return true;
    } else if (ball.x >= this.upperLeftX && ball.x < this.upperLeftX + this.chX && ball.ro < Math.PI) {
        ball.ro = 2 * Math.PI - ball.ro - this.beta;    //bouncing from the left chamfer
        return true;
    } else if (ball.x > this.upperLeftX + this.width - this.chX && ball.x <= this.upperLeftX + this.width && ball.ro < Math.PI) {
        ball.ro = 2 * Math.PI - ball.ro + this.beta;    //bouncing from the right chamfer
        return true;
    }

    return false;
};

Paddle.prototype.draw = function (context) {
    context.beginPath();
    context.moveTo(this.upperLeftX, this.upperLeftY + this.height);
    context.lineTo(this.upperLeftX, this.upperLeftY + this.chY);
    context.lineTo(this.upperLeftX + this.chX, this.upperLeftY);
    context.lineTo(this.upperLeftX + this.width - this.chX, this.upperLeftY);
    context.lineTo(this.upperLeftX + this.width, this.upperLeftY + this.chY);
    context.lineTo(this.upperLeftX + this.width, this.upperLeftY + this.height);
    context.closePath();
    context.lineWidth = 1;
    context.fillStyle = 'white';
    context.fill();
    context.strokeStyle = 'white';
    context.stroke();
};
// **********  End of Paddle  **********


// **********  Field  **********

function Field (upperLeftX, upperLeftY, width, height, lineWidth) {
    this.upperLeftX = upperLeftX;
    this.upperLeftY = upperLeftY;
    this.width = width;
    this.height = height;
    this.lineWidth = lineWidth;
    this.colors = ["White", "Red", "Blue", "Yellow", "Magenta", "Green"];
    this.leftWallColor = 0;
    this.rightWallColor = 0;
    this.topWallColor = 0;
}

Field.prototype.draw = function(context) {
    context.lineWidth = this.lineWidth;
    context.lineCap = "round";

    context.beginPath();
    context.moveTo(this.upperLeftX, this.upperLeftY + this.height);
    context.lineTo(this.upperLeftX, this.upperLeftY);
    context.strokeStyle = this.colors[this.leftWallColor];
    context.stroke();

    context.beginPath();
    context.moveTo(this.upperLeftX, this.upperLeftY);
    context.lineTo(this.upperLeftX + this.width, this.upperLeftY);
    context.strokeStyle = this.colors[this.topWallColor];
    context.stroke();

    context.beginPath();
    context.moveTo(this.upperLeftX + this.width, this.upperLeftY);
    context.lineTo(this.upperLeftX + this.width, this.upperLeftY + this.height);
    context.strokeStyle = this.colors[this.rightWallColor];
    context.stroke();
    

};

Field.prototype.bounceBall = function(ball) {

    if (ball.y >= this.upperLeftY + this.height - ball.r && ball.ro < Math.PI) {    // bottom
        return false;
    }
   
    if (ball.x <= this.upperLeftX + this.lineWidth/2 + ball.r && ball.ro > Math.PI / 2 && ball.ro < 3 * Math.PI / 2) {  //left wall
        ball.ro = Math.PI - ball.ro;
        if (ball.ro < 0) {
            ball.ro += 2 * Math.PI;
        }
        this.leftWallColor < this.colors.length - 1 ? ++this.leftWallColor : this.leftWallColor = 0;
    }

    if (ball.x >= this.upperLeftX + this.width - this.lineWidth / 2 - ball.r && (ball.ro < Math.PI / 2 || ball.ro > 3 * Math.PI / 2)) { //right wall
        ball.ro = Math.PI - ball.ro;
        if (ball.ro < 0) {
            ball.ro += 2 * Math.PI;
        }
        this.rightWallColor < this.colors.length - 1 ? ++this.rightWallColor : this.rightWallColor = 0;
    }

    if (ball.y <= this.upperLeftY + ball.r && ball.ro > Math.PI) {  // top wall
        ball.ro = 2 * Math.PI - ball.ro;
        this.topWallColor < this.colors.length - 1 ? ++this.topWallColor : this.topWallColor = 0;
    }

    return true;
};
// **********  End of Paddle  **********


// **********  Brick  **********

function Brick(middleX, middleY, width, height, color) {
    this.middleX = middleX;
    this.middleY = middleY;
    this.width = width;
    this.height = height;
    // p1*****p2
    // *      *
    // *      *
    // p4*****p3
    this.p1X = middleX - width/2;
    this.p1Y = middleY - height/2;
    this.p2X = this.p1X + width;
    this.p2Y = this.p1Y;
    this.p3X = this.p2X;
    this.p3Y = this.p2Y + height;
    this.p4X = this.p1X;
    this.p4Y = this.p3Y;

    this.ro = rotation;
    this.color = color;
    this.exploding = false;
    this.explosionTime;
    this.exploded = false;
}

Brick.prototype.draw = function(ctx) {
    if (this.exploding == false) {
        ctx.beginPath();
        ctx.rect (this.middleX - this.width /2, this.middleY - this.height/2, width, height);
        var grd = ctx.createRadialGradient(this.middleX, this.middleY, this.width/7, this.middleX, this.middleY, this.width/5,);
        grd.addColorStop(0, "white");
        grd.addColorStop(1, color);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.stroke();
    } else {
        var timeDelta = new Date().getTime() - this.explosionTime;
        if (timeDelta > 3000) {
            this.exploded = true;
            return;
        }
        ctx.save();
        ctx.scale(1- 3000/timeDelta, 1- 3000/timeDelta);
        ctx.globalAlpha = 1 - 3000/timeDelta;
        ctx.beginPath();
        ctx.rect (this.middleX - this.width /2, this.middleY - this.height/2, width, height);
        var grd = ctx.createRadialGradient(this.middleX, this.middleY, this.width/7, this.middleX, this.middleY, this.width/5,);
        grd.addColorStop(0, "white");
        grd.addColorStop(1, color);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    }

};

Brick.prototype.checkBall = function(ball) {   
    if (ball.x > this.p1X - ball.r &&
        ball.x < this.p2X + ball.r &&
        ball.y > this.p1Y - ball.r &&
        ball.y < this.p3Y + ball.r) 
    {
        this.exploding = true;
        this.explosionTime = new Date().getTime();

        if (ball.x >= this.p1X && ball.x <= this.p2X && ball.y < this.p1Y && ball.ro < Math.PI) { // ball coming from above
            ball.ro = 2 * Math.PI - ball.ro;
        }
        if (ball.x >= this.p1X && ball.x <= this.p2X && ball.y > this.p3Y && ball.ro > Math.PI) {    // ball coming from below
            ball.ro = 2 * Math.PI - ball.ro;
        }
        if (ball.y >= this.p2Y && ball.y <= this.p3Y && ball.x < this.p1X && (ball.ro < Math.PI / 2 || ball.ro > 3 * Math.PI / 2)) {    // ball coming from left
            ball.ro = Math.PI - ball.ro;
            if (ball.ro < 0) {
                ball.ro += 2 * Math.PI;
            }
        }
        if (ball.y >= this.p2Y && ball.y <= this.p3Y && ball.x > this.p2X && ball.ro > Math.PI / 2 && ball.ro < 3 * Math.PI / 2) {        // ball coming from right
            ball.ro = Math.PI - ball.ro;
            if (ball.ro < 0) {
                ball.ro += 2 * Math.PI;
            }
        }
    }
};

// **********  End Of Brick  **********


// **********  Keyboard  **********

window.addEventListener('keyup', function (event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function (event) { Key.onKeydown(event); }, false);

var Key = {
    _pressed: {},

    A: 65,
    W: 87,
    D: 68,
    S: 83,
    SPACE: 32,

    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },

    onKeydown: function (event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function (event) {
        delete this._pressed[event.keyCode];
    }
};
// **********  End of Keyboard  **********

// **********  Utilities  **********
function getRand(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// **********  End of Utilities  **********