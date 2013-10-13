

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

    var BU = canvas.width / 1400;       //canvas.width = 1400 * BU      -       canvas.height = 787 * BU

    var fieldUpperLeftX = 10 * BU;
    var fieldUpperLeftY = 20 * BU;
    var fieldWidth = canvas.width - 20 * BU;
    var fieldHeight = canvas.height - 40 * BU;
    var fieldLineWidth = 10 * BU;
    var brickWidth = 60 * BU;
    var brickHeight = 20 * BU;
    var paddleWidth = 140 * BU;
    var paddleHeight = 20 * BU;
    var paddleSpeed = 45 * BU;
    var ballRadius = 10 * BU;
    var ballSpeed = 30 * BU;
    var ballDir = getRand(6, 9) * Math.PI / 5;

    var field = new Field(fieldUpperLeftX, fieldUpperLeftY, fieldWidth, fieldHeight, fieldLineWidth, brickWidth, brickHeight);
    field.loadLayout(new BrickLayout);
    var paddle = new Paddle(canvas.width / 2, fieldUpperLeftY + fieldHeight, paddleWidth, paddleHeight, paddleSpeed, fieldUpperLeftX, fieldUpperLeftX + fieldWidth, 0.2 * paddleWidth, 0.1 * paddleWidth, Math.PI / 15);
    var ball = new Ball(canvas.width / 2, fieldUpperLeftY + fieldHeight, ballRadius, ballSpeed, ballDir);

	setTimeout(function () {
	    animate(field, paddle, ball, canvas, context, Date.now());
	}, 3000);
};


function animate(field, paddle, ball, canvas, context, previoustime) {
    var now = Date.now();
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
    if (Key.isLeft() && this.upperLeftX >= this.leftBoundary) {
        this.upperLeftX -= this.v * timediff;
    }
    if (Key.isRight() && this.upperLeftX + this.width <= this.rightBoundary) {
        this.upperLeftX += this.v * timediff;
    }
};

Paddle.prototype.bounceBall = function (ball) {

    if (ball.x >= this.upperLeftX + this.chX && ball.x <= this.upperLeftX + this.width - this.chX && ball.ro < Math.PI) {
        ball.ro = 2 * Math.PI - ball.ro; // bouncing from the horizontal part
        if (ball.ro > Math.PI + 2 * this.delta && ball.ro < 2 * Math.PI - 2 * this.delta) { // we add delta only if its not too close to horizontal
            if (Key.isLeft()) {
                ball.ro -= this.delta;
            } else if (Key.isRight()) {
                ball.ro += this.delta;
            }
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

function Field (upperLeftX, upperLeftY, width, height, lineWidth, brickWidth, brickHeight) {
    this.upperLeftX = upperLeftX;
    this.upperLeftY = upperLeftY;
    this.width = width;
    this.height = height;
    this.lineWidth = lineWidth;
    this.brickWidth = brickWidth;
    this.brickHeight = brickHeight;
    this.colors = ["White", "Red", "Blue", "Yellow", "Magenta", "Green"];
    this.leftWallColor = 0;
    this.rightWallColor = 0;
    this.topWallColor = 0;
    this.bricks = new Array();
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

    for (var i = 0; i < this.bricks.length; ++i) {
        if (!this.bricks[i].exploded) {
            this.bricks[i].draw(context);                    //draw the bricks as well
        }
    }
    

};

Field.prototype.loadLayout = function (layout) {
    var midFieldX = this.upperLeftX + this.width / 2;
    var midFieldY = this.upperLeftY + this.height * 0.45;
    var dX = 0;
    var dY = 0;

    layout.reset();

    while (midFieldY - dY > this.upperLeftY + 4 * this.brickHeight) {
        var cond1 = midFieldY - dY;
        var cond2 = this.upperLeftY + 4 * this.brickHeight;
        while (midFieldX - dX > this.upperLeftX + 2 * this.brickWidth) {
            var cond3 = midFieldX - dX;
            var cond4 = this.upperLeftX + 2 * this.brickWidth;
            var brickData = layout.giveNextBrickInRow();
            if (brickData.type != 'void') {
                this.bricks.push(new Brick(midFieldX + dX, midFieldY - dY, this.brickWidth, this.brickHeight, brickData.type, brickData.color));
                if (dX != 0) {
                    this.bricks.push(new Brick(midFieldX - dX, midFieldY - dY, this.brickWidth, this.brickHeight, brickData.type, brickData.color));
                }
            }
            dX += this.brickWidth / 2;
        }
        layout.stepToNextRow();
        dX = 0;
        dY += 3 * this.brickHeight;
    }

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

    for (var i = 0; i < this.bricks.length; ++i) {
        if (this.bricks[i].exploding == false) {
            this.bricks[i].bounceBall(ball);                  //check the bricks against the ball
        }
    }

    return true;
};
// **********  End of Paddle  **********


// **********  BrickLAyout  **********

function BrickLayout() {
    this.row = 0;
    this.col = 0;
    this.pattern = [[ {type: 'void' }, {type: 'void' }, { type: 'basic', color: 'blue' } ],  //first row
                    [{ type: 'basic', color: 'red' }, { type: 'void' }, { type: 'void' }]];  // second row
}

BrickLayout.prototype.giveNextBrickInRow = function () {

    var result = this.pattern[this.row][this.col];

    if (this.col == this.pattern[this.row].length - 1) {
        this.col = 0;
    } else {
        ++this.col;
    }

    return result;
};

BrickLayout.prototype.stepToNextRow = function () {
    this.col = 0;
    ++this.row;
    if (this.row == this.pattern.length) {
        this.row = 0;
    }
};

BrickLayout.prototype.reset = function () {
    this.rowPos = 0;
    this.colPos = 0;
};



// **********  End of BrickLAyout  **********


// **********  Brick  **********

function Brick(middleX, middleY, width, height, type, color) {
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

    this.type = type;
    this.color = color;
    this.exploding = false;
    this.exploded = false;
}

Brick.prototype.draw = function(ctx) {
    if (this.exploding == false) {
        ctx.beginPath();
        ctx.rect (this.middleX - this.width /2, this.middleY - this.height/2, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.stroke();
    } else {
        var timeDelta = Date.now() - this.explosionTime;
        if (timeDelta > 3000) {
            this.exploded = true;
            return;
        }
        ctx.save();
        ctx.scale(1- timeDelta/3000, 1- timeDelta/3000);
        ctx.globalAlpha = 1 - timeDelta / 3000;
        ctx.beginPath();
        ctx.rect (this.middleX - this.width /2, this.middleY - this.height/2, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.restore();
    }

};

Brick.prototype.bounceBall = function(ball) {   
    if (ball.x > this.p1X - ball.r &&
        ball.x < this.p2X + ball.r &&
        ball.y > this.p1Y - ball.r &&
        ball.y < this.p3Y + ball.r) 
    {
        this.exploding = true;
        this.explosionTime = Date.now();

        if (ball.x >= this.p1X - ball.r && ball.x <= this.p2X + ball.r && ball.y < this.p1Y && ball.ro < Math.PI) { // ball coming from above
            ball.ro = 2 * Math.PI - ball.ro;
        }
        if (ball.x >= this.p1X - ball.r && ball.x <= this.p2X + ball.r && ball.y > this.p3Y && ball.ro > Math.PI) {    // ball coming from below
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
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,

    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },

    isLeft: function () {
        return (this._pressed[this.A] || this._pressed[this.Left]);
    },

    isRight: function () {
        return (this._pressed[this.D] || this._pressed[this.Right]);
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