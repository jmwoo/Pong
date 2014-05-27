$(function () {

  // screen sizes
  var macbook = {
    width: 1250,
    height: 665
  };
  var pcFull = {
    width: 1850,
    height: 1025

  };
  var pcHalf = {
    width: 925,
    height: 1025
  };
  var myScreen = pcHalf;

  var game = new Game({
    player1: new Player('player1', 'blue', 0, 'bottom'),
    player2: new Player('player2', 'black', 0, 'top')
  });

  game.canvas = document.getElementById('canvas');
  game.canvas.style.cssText = "border: 1px solid black;";
  game.context = game.canvas.getContext('2d');

  game.canvas.width = myScreen.width;
  game.canvas.height = myScreen.height;

  // create actual game objects
  var ball = new Ball(myScreen.width / 2, myScreen.width / 2, 6, 3, 30, 'red', 2, '#black');
  game.childObjs.push(ball);

  var playerPad1 = new PlayerPad(myScreen.width / 2, 0, 100, 20, 5, 'black');
  game.childObjs.push(playerPad1);

  var playerPad2 = new PlayerPad(myScreen.width / 2, myScreen.height - 20, 100, 20, 5, 'black');
  game.childObjs.push(playerPad2);

  var collisionManager = new CollisionManager(ball, playerPad1, playerPad2);
  game.childObjs.push(collisionManager);

  function Player (name, color, score, location) {
    this.name = name;
    this.color = color;
    this.score = score;
    this.location = location;
  }

  Player.prototype.addPoints = function (points) {
    this.score += points;
  };

  function Game(players, canvas, context) {
    this.players = players;
    this.isBallOutTop = false;
    this.isBallOutBottom = false;
    this.childObjs = [];
    this.totalUpdates = 0;
    this.totalDraws = 0;

    this.writeScore = function () {
      var text = this.players.player1.name + ': ' + this.players.player1.score + '\n' + this.players.player2.name + ': ' + this.players.player2.score + '\n';
      game.msg = {text: text, time: FPS * 2};
    };
  }

  Game.prototype.update = function () {
    this.totalUpdates += 1;
    this.childObjs.forEach(function(gameObject) {
      gameObject.update();
    });
  };

  Game.prototype.draw = function () {
    this.totalDraws += 1;
    game.context.clearRect(0, 0, myScreen.width, myScreen.height); // clear screen

    if (this.msg) {
      if (this.msg.time === 0)
        this.msg = undefined;
      else {
        this.context.fillStyle = 'blue';
        this.context.font = '40px sans-serif';
        this.context.textBaseline = 'middle';
        this.context.fillText(this.msg.text, myScreen.width / 2, myScreen.height / 2);
        this.msg.time -= 1;
      }
    }

    this.childObjs.forEach(function(gameObject) {
      gameObject.draw();
    });
  };

  function Ball (centerX, centerY, deltaX, deltaY, radius, color, lineWidth, strokeStyle) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.radius = radius;
    this.color = color;
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
  }

  Ball.prototype.update = function () {
    this.centerX += this.deltaX;
    this.centerY += this.deltaY;
  };

  Ball.prototype.draw = function () {
    game.context.beginPath();
    game.context.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI, false);
    game.context.fillStyle = this.color;
    game.context.fill();
    game.context.lineWidth = this.lineWidth;
    game.context.strokeStyle = this.strokeStyle;
    game.context.stroke();
  };

  Ball.prototype.sendLeft = function () {
    if (this.deltaX > 0)
      this.deltaX *= -1;
  };

  Ball.prototype.sendRight = function () {
    if (this.deltaX < 0)
      this.deltaX *= -1;
  };

  Ball.prototype.sendDown = function () {
    if (this.deltaY < 0)
      this.deltaY *= -1;
  };

  Ball.prototype.sendUp = function () {
    if (this.deltaY > 0)
      this.deltaY *= -1;
  };

  function PlayerPad (centerX, centerY, width, height, lineWidth, strokeStyle) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.width = width;
    this.height = height;
    this.moveIncr = 25;
  }

  PlayerPad.prototype.update = function () {};

  PlayerPad.prototype.draw = function () {
    game.context.beginPath();
    game.context.fillStyle = 'black';
    game.context.lineWidth = this.lineWidth;
    game.context.strokeStyle = this.strokeStyle;
    game.context.fillRect(this.centerX, this.centerY, this.width, this.height);
    game.context.stroke();
  };

  PlayerPad.prototype.moveLeft = function () {
    if (this.centerX > 0) {
      this.centerX -= this.moveIncr;
    }
  };

  PlayerPad.prototype.moveRight = function () {
    if (this.centerX < myScreen.width - this.width) {
      this.centerX += this.moveIncr;
    }
  };

  function CollisionManager (ball, playerPad1, playerPad2) {
    this.ball = ball;
    this.playerPad1 = playerPad1;
    this.playerPad2 = playerPad2;
  }

  CollisionManager.prototype.update = function () {

    // ball collides with left wall
    if (this.ball.centerX - this.ball.radius <= 0) {
      this.ball.sendRight();
    }
    // ball collides with right wall
    else if (this.ball.centerX + this.ball.radius >= myScreen.width) {
      this.ball.sendLeft();
    }

    // if bottom of ball collides with top of playerPad2
    var bottomZone = this.ball.centerY + this.ball.radius >= this.playerPad2.centerY;
    var bottomLeftZone = (this.ball.centerX <= this.playerPad2.centerX + this.playerPad2.width);
    var bottomRightZone = (this.ball.centerX >= this.playerPad2.centerX);

    if (bottomZone && bottomLeftZone && bottomRightZone) // if hitting face of pad
      this.ball.sendUp();
    else if (this.ball.centerY + this.ball.radius >= myScreen.height) { // is below goal line
      if (!game.isBallOutBottom) {
        game.isBallOutBottom = true;
        game.players.player1.addPoints(1);
        game.writeScore();
        console.log(game.players.player1.name + ': ' + game.players.player1.score);
      }
    } 
    else {
      game.isBallOutBottom = false;
    }

    // if top of ball collides with bottom of playerPad1
    var topZone = this.ball.centerY - this.ball.radius <= this.playerPad1.centerY + this.playerPad1.height;
    var topLeftZone = (this.ball.centerX <= this.playerPad1.centerX + this.playerPad1.width);
    var topRightZone = (this.ball.centerX >= this.playerPad1.centerX);

    if (topZone && topLeftZone && topRightZone)
      this.ball.sendDown();
    else if (this.ball.centerY - this.ball.radius <= this.playerPad1.centerY) {
      if (!game.isBallOutTop) {
        game.isBallOutTop = true;
        game.players.player2.addPoints(1);
        game.writeScore();
        console.log(game.players.player2.name + ': ' + game.players.player2.score);
      }
    } 
    else {
      game.isBallOutTop = false;
    }
  };

  CollisionManager.prototype.draw = function () {
    // nothing to draw...
  };

  // keyboard events
  $(window).on('keydown',  function (ev) {
    var c = String.fromCharCode(ev.which)
    if (ev.keyCode === 37) {
      playerPad1.moveLeft();
    } else if (ev.keyCode === 39) {
      playerPad1.moveRight();
    } else if (ev.keyCode === 65) {
      playerPad2.moveLeft();
    } else if (ev.keyCode === 68) {
      playerPad2.moveRight();
    }
  });

  // game loop
  var FPS = 60;
  setInterval(function () {
    game.update();
    game.draw();
  }, 1000 / FPS);

});
