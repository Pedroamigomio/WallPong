
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

    var scoreLeftX = 10 * BU;
    var scoreLeftY = 25 * BU;
    var ballNumber = 3;
    var fieldUpperLeftX = 10 * BU;
    var fieldUpperLeftY = 50 * BU;
    var fieldWidth = canvas.width - 20 * BU;
    var fieldHeight = canvas.height - 70 * BU;
    var fieldLineWidth = 2 * BU;
    var fieldMaxSpecialBricks = 4;
    var brickWidth = 60 * BU;
    var brickHeight = 20 * BU;
    var paddleWidth = 140 * BU;
    var paddleHeight = 20 * BU;
    var paddleSpeed = 45 * BU;
    var ballRadius = 10 * BU;
    var ballSpeed = 30 * BU;
    var ballDir = Math.PI / 2;

    var score = new Score(scoreLeftX, scoreLeftY, scoreLeftX + fieldWidth, scoreLeftY, 2.5 * ballRadius, ballRadius, ballNumber);
    var field = new Field(score, new BrickLayoutStore(), fieldUpperLeftX, fieldUpperLeftY, fieldWidth, fieldHeight, fieldLineWidth, brickWidth, brickHeight, fieldMaxSpecialBricks);
    field.loadLayout();
    var paddle = new Paddle(canvas.width / 2 - paddleWidth / 2, fieldUpperLeftY + fieldHeight, paddleWidth, paddleHeight, paddleSpeed, fieldUpperLeftX, fieldUpperLeftX + fieldWidth, 0.2 * paddleWidth, 0.1 * paddleWidth, Math.PI / 15);
    var ball = new Ball(canvas.width / 2, field.upperLeftY + field.height * 0.70, ballRadius, ballSpeed, ballDir);
    ball.pause = true;

    animate(field, paddle, ball, canvas, context, Date.now(), Date.now());
};


function animate(field, paddle, ball, canvas, context, previoustime, ballDelay) {
    var now = Date.now();
    var timediff = (now - previoustime) / 100;  // 0.1 sec

    if (field.score.remainingBricks == 0) {
        field.loadLayout();
        ballDelay = now;
        ball.x = canvas.width / 2;
        ball.y = field.upperLeftY + field.height * 0.70;
        ball.ro = Math.PI / 2;
        ball.pause = true;
    }

    if (field.bounceBall(ball, paddle) == false) {
        if (field.score.balls == 0) {
            //game over animation
            context.clearRect(0, 0, canvas.width, canvas.height);
            requestAnimFrame(function () {
                createGameParts();
            });
            return;
        }
        ballDelay = now;
        ball.x = canvas.width / 2;
        ball.y = field.upperLeftY + field.height * 0.70;
        ball.ro = Math.PI / 2;
        ball.pause = true;
        --field.score.balls;
    }

    paddle.move(timediff);
    ball.move(timediff);

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (ballDelay != 0 && now - ballDelay > 1500) {
        ball.pause = false;
        ballDelay = 0;
    }

    field.score.draw(context);
    field.draw(context);
    paddle.draw(context);
    ball.draw(context);

    requestAnimFrame(function () {
        animate(field, paddle, ball, canvas, context, now, ballDelay);
    });
	
};


// **********  Ball  **********

function Ball(x, y, r, v, ro) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.v = v; // px/sec
    this.ro = ro; // rad - 0 is 3 o'clock - clockwise+
    this.pause = false;
}

Ball.prototype.move = function (timediff) {
    if (this.pause == true) {
        return;
    }
    this.x += this.v * timediff * Math.cos(this.ro);
    this.y += this.v * timediff * Math.sin(this.ro);

};

Ball.prototype.draw = function (context) {
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'white';
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
    } else if (ball.x >= this.upperLeftX - ball.r && ball.x < this.upperLeftX + this.chX && ball.ro < Math.PI) {
        if (distanceOfPointAndLine(ball.x, ball.y, this.upperLeftX, this.upperLeftY + this.chY, this.upperLeftX + this.chX, this.upperLeftY) < ball.r) {    
            ball.ro = 2 * Math.PI - ball.ro - this.beta;    //bouncing from the left chamfer
        }
    } else if (ball.x > this.upperLeftX + this.width - this.chX && ball.x <= this.upperLeftX + ball.r + this.width && ball.ro < Math.PI) {
        if (distanceOfPointAndLine(ball.x, ball.y, this.upperLeftX + this.width - this.chX, this.upperLeftY, this.upperLeftX + this.width, this.upperLeftY + this.chY) < ball.r) {
            ball.ro = 2 * Math.PI - ball.ro + this.beta;    //bouncing from the right chamfer
        }
    }
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


// **********  Score  **********

function Score(leftX, leftY, rightX, rightY, height, ballRadius, ballNumber) {
    this.leftX = leftX;
    this.leftY = leftY;
    this.rightX = rightX;
    this.rightY = rightY;
    this.height = height;
    this.ballRadius = ballRadius;
    this.balls = ballNumber;
    this.points = 0;
    this.remainingBricks = 0;
}

Score.prototype.draw = function (ctx) {
    var fontText = "italic " + this.height + "px Arial";
    ctx.font = fontText;
    ctx.fillText(this.points, this.leftX, this.leftY + this.height / 2);

    for (var i = 1; i <= this.balls; ++i) {
        ctx.beginPath();
        ctx.arc(this.rightX - 3 * i * this.ballRadius, this.rightY, this.ballRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
    
};

Score.prototype.update = function (points) {
    this.points += points;
};

// **********  End of Score  **********


// **********  Field  **********

function Field(score, layoutStore, upperLeftX, upperLeftY, width, height, lineWidth, brickWidth, brickHeight, maxSpecialBricks) {
    this.score = score;
    this.layoutStore = layoutStore;
    this.upperLeftX = upperLeftX;
    this.upperLeftY = upperLeftY;
    this.width = width;
    this.height = height;
    this.lineWidth = lineWidth;
    this.brickWidth = brickWidth;
    this.brickHeight = brickHeight;
    this.colors = ["White", "Red"];
    this.leftWallColor = 0;
    this.rightWallColor = 0;
    this.topWallColor = 0;
    this.maxSpecialBricks = maxSpecialBricks;
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
            this.bricks[i].draw(context, this.score);                    //draw the bricks as well
        }
    }
    

};

Field.prototype.loadLayout = function () {
    var layout = this.layoutStore.getNextLayout();
    var midFieldX = this.upperLeftX + this.width / 2;
    var midFieldY = this.upperLeftY + this.height * 0.45;
    var dX = 0;
    var dY = 0;

    layout.reset();

    var imgs = this.layoutStore.brickImages;

    var specialBricks = 0;

    while (midFieldY - dY > this.upperLeftY + 4 * this.brickHeight) {
        var cond1 = midFieldY - dY;
        var cond2 = this.upperLeftY + 4 * this.brickHeight;
        while (midFieldX - dX > this.upperLeftX + 2 * this.brickWidth) {
            var cond3 = midFieldX - dX;
            var cond4 = this.upperLeftX + 2 * this.brickWidth;
            var brickData = layout.giveNextBrickInRow();
            if (brickData.type != 'void') {
                this.bricks.push(new Brick(midFieldX + dX, midFieldY - dY, this.brickWidth, this.brickHeight, brickData.type, imgs[brickData.type]));
                ++this.score.remainingBricks;
                if (dX != 0) {
                    this.bricks.push(new Brick(midFieldX - dX, midFieldY - dY, this.brickWidth, this.brickHeight, brickData.type, imgs[brickData.type]));
                    ++this.score.remainingBricks;
                }
            }
            dX += this.brickWidth / 2;
        }
        layout.stepToNextRow();
        dX = 0;
        dY += 3 * this.brickHeight;
    }

    for (var i = 0; i < this.maxSpecialBricks; ++i) {
        var j = getRandInt(0, this.bricks.length - 1);
        var type = 'twoball'
        if (i < this.maxSpecialBricks / 2) {
            type = 'speedball';
        }
        this.bricks[j].type = type;
        this.bricks[j].image = imgs[type];
    }
    
};

Field.prototype.bounceBall = function(ball, paddle) {

    if (ball.y >= this.upperLeftY + this.height - ball.r && ball.ro < Math.PI) {    // bottom

        paddle.bounceBall(ball);

        if (ball.y > this.upperLeftY + this.height + paddle.chY && ball.ro < Math.PI) {
            return false;
        }
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


// **********  BrickLayoutStore  **********

function BrickLayoutStore() {
    this.counter = 0;
    this.brickImages = new Array();

    this.brickImages['basic'] = new Image();
    this.brickImages['basic'].src = './img/brick_basic.png';
    this.brickImages['twoball'] = new Image();
    this.brickImages['twoball'].src = './img/brick_twoball.png';
    this.brickImages['speedball'] = new Image();
    this.brickImages['speedball'].src = './img/brick_speedball.png';


    this.brickLayouts = new Array();

    this.brickLayouts[0] = new BrickLayout();
    this.brickLayouts[0].pattern = [
                                    [{ type: 'void' }, { type: 'void' }, { type: 'basic' }],    //first row
                                    [{ type: 'basic' }, { type: 'void' }, { type: 'void' }]     //second row
                                   ];  

    this.brickLayouts[1] = new BrickLayout();
    this.brickLayouts[1].pattern = [
                                    [{ type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'basic' }],      //first row
                                    [{ type: 'basic' }, { type: 'void' }, { type: 'void' }]                         //second row
                                   ];

    this.brickLayouts[2] = new BrickLayout();
    this.brickLayouts[2].pattern = [
                                    [{ type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'basic' }],      //first row
                                    [{ type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'basic' }],                        //second row
                                    [{ type: 'void' }, { type: 'void' }, { type: 'void' }, { type: 'basic' }]                                           //third row
                                   ];                                     

}

BrickLayoutStore.prototype.getNextLayout = function() {
    var layout = this.brickLayouts[this.counter];
    ++this.counter;
    if (this.counter == this.brickLayouts.length) {
        this.counter = 0;
    }

    return layout;
}

// **********  End of BrickLayoutStore  **********


// **********  BrickLayout  **********

function BrickLayout() {
    this.row = 0;
    this.col = 0;
    this.pattern;
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


// **********  End of BrickLayout  **********


// **********  Brick  **********

function Brick(middleX, middleY, width, height, type, image) {
    this.middleX = middleX;
    this.middleY = middleY;
    this.width = width;
    this.height = height;
    this.image = image;
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
    this.exploding = false;
    this.exploded = false;
}

Brick.prototype.draw = function(ctx, score) {
    if (this.exploding == false) {
        ctx.drawImage(this.image, this.middleX - this.width / 2, this.middleY - this.height / 2, this.width, this.height);
    } else {
        var timeDelta = Date.now() - this.explosionTime;
        if (timeDelta > 3000) {
            this.exploded = true;
            score.update(100);
            --score.remainingBricks;
            return;
        }
        ctx.save();
        ctx.scale(1- timeDelta/3000, 1- timeDelta/3000);
        ctx.globalAlpha = 1 - timeDelta / 3000;
        ctx.drawImage(this.image, this.middleX - this.width / 2, this.middleY - this.height / 2, this.width, this.height);
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

function getRandBool(probability) {
    return probability > getRandInt(1, 100);
}

function distanceOfPointAndLine(px, py, ax, ay, bx, by) {

    // distance (x=a+t*n , p) = ||(a-p) - ((a-p)*n)*n ||

    var dist_ab = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
    var nx = (bx - ax) / dist_ab;
    var ny = (by - ay) / dist_ab;

    var a_min_p_x = ax - px;
    var a_min_p_y = ay - py;
    var a_min_p_proj = a_min_p_x * nx + a_min_p_y * ny;

    var dist_x = a_min_p_x - a_min_p_proj * nx;
    var dist_y = a_min_p_y - a_min_p_proj * ny;

    return Math.sqrt(dist_x * dist_x + dist_y * dist_y);
}

// **********  End of Utilities  **********