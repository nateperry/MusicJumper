/*
Music Song and Dance Apps Project 2
*/

'use strict'

var app, Events, Music, Graphics, Character, KeyHandler;

app = {
	init : function () {
		Events.init();
		Music.init();
		Graphics.init();
		KeyHandler.init();
		Character.init();
	}
};

Events = {
	$tracklist : null,
	init : function () {
		this.$tracklist = $('#tracklist-container');
		this.connectEvents();
	},
	connectEvents : function () {
		this.$tracklist.on('mouseenter', this.openTracklist);
		this.$tracklist.on('mouseleave', this.closeTrackList);
	},
	disconnectEvents : function () {
		$(this.$tracklist).off();
	},
	closeTrackList : function (e) {
		Events.onAnimationBegin();
		$(e.currentTarget).animate({top: -170}, 600, Events.onAnimationComplete);
	},
	openTracklist : function (e) {
		Events.onAnimationBegin();
		$(e.currentTarget).animate({top: 0}, 600, Events.onAnimationComplete);
	},
	onAnimationComplete : function () {
		Events.connectEvents();
	},
	onAnimationBegin : function () {
		this.disconnectEvents();
	}
}; //end Events

Music = {
	$player : null,
	$instructions : null,
	volume : 0.6,
	dancer : new Dancer(), // from Dancer.js - code source: https://github.com/jsantell/dancer.js/
	kick : null,
	doc : document,
	isPlaying: function (AudEle) {
		return AudEle.paused;
	},
	init : function () {
		this.$player = this.doc.getElementById ('audio');
		this.$instructions = $('.instruction-cta');

		// Set volume to avoid explosion of noise
		this.$player.volume = this.volume;
		this.setupDancer();

		this.addListeners();
	},
	setupDancer : function () {
		this.dancer.load(this.$player);
		window.dancer = this.dancer; //for debug

		this.kick = this.dancer.createKick ({
			onKick: function ( mag ) {
				Graphics.triggerPulse = true;
			},
			offKick: function ( mag ) {
				Graphics.triggerPulse = false;
			}
		});
	},
	changeSong : function (e) {
		e.preventDefault();
		Music.dancer.pause();
		Music.kick.off();

		Graphics.endAnimation();

		// Adjust class for styling
		var $ele = $(e.currentTarget);
		$('.playing').removeClass('playing');
		$ele.addClass('playing');

		if ( Music.$instructions.hasClass('open') ) {
			Music.$instructions.removeClass('open');
		};

		// Loads the file
		var song = $ele.data('track-name');
		Music.$player.src = 'music/' + song + '.mp3';

		// Plays the new song
		Music.dancer.play();
		Music.kick.on();
		Graphics.startAnimation();
	},
	addListeners : function () {
		$('.track').on('click', this.changeSong)
	}
}; // end Music

Graphics = {
	canvas : null,
	ctx : null,
	doc : document,
	constants : {	canvasWidth : window.innerWidth, canvasHeight : window.innerHeight, numBars : 30, barFallSpeed : 3, defaultHeight : 10},
	colors : [
		//lightblue
		'#6D9BFF',
		//darkblue
		'#3A60B2',
		//red
		'#FF5720',
		//lightgreen
		'#82CC43',
		//darkgreen
		'#70A840'
	],
	bars : [],
	init: function () {
		this.setupCanvas();
		this.reset (); //set to default view
		this.createAllBars( this.constants.numBars);
	}, //end init
	setupCanvas : function () {
		this.canvas = this.doc.getElementById ('canvas');
		this.canvas.width = this.constants.canvasWidth;
		this.canvas.height =this.constants.canvasHeight;
		this.ctx = this.canvas.getContext ('2d');
		this.ctx.font = "10px Helvetica";
	}, //end setupCanvas
	drawRectangle : function (x, y, width, height, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect ( x, y, width, height);
	}, //end drawRectangle
	drawArc : function (x, y, radius, start, stop, color, style) {
		this.ctx.beginPath();
		this.ctx.arc( x,y,radius,start,stop);
		if (style === 'fill') {
			this.ctx.fillStyle = color;
			this.ctx.fill();
		}
		else if (style === 'stroke') {
			this.ctx.strokeStyle = color;
			this.ctx.stroke();
		}
		else {}
	}, //end drawCirlce
	createAllBars : function (number) {
		for (var i = 0; i < number; i++) {
			this.bars.push(this.generateBar(i));
		}
		this.drawAllRectangles();
	}, //end createBars
	changeBarColors : function () {
		for (var i = 0; i < this.bars.length; i++) {
			this.bars[i].color = this.colors[ Math.floor((Math.random()*Graphics.colors.length)) ];
		}
	},
	generateBar : function (number) {
		var bar = {
			id : number,
			height: this.constants.defaultHeight,
			color : this.colors[ Math.floor((Math.random()*Graphics.colors.length)) ],
			width: this.constants.canvasWidth / this.constants.numBars,
			x : null
		};
		bar.x = bar.width * bar.id;
		return bar;
	}, //end generateBar
	clearCanvas : function () {
		this.ctx.clearRect(0, 0, this.constants.canvasWidth, this.constants.canvasHeight);
	},
	angle : 0,
	shootPulse : function () {
		var that = Graphics;
		var radius = 100 + 150 * Math.abs(Math.cos(that.angle));
		that.drawArc(that.constants.canvasWidth /2, that.constants.canvasHeight /2, radius, 0, 2*Math.PI, 'rgba(120,120,120,0.1)', 'fill' );
		that.angle += Math.PI / 64;
	},
	drawAllRectangles : function () {
		var that = Graphics;
		for (var c = 0; c < that.bars.length; c++) {
			var currBar = that.bars[c];
			that.drawRectangle (c * currBar.width, that.constants.canvasHeight - currBar.height, currBar.width, currBar.height, currBar.color);
		}
	}, //end drawAllRectangles
	reset : function () {
		for (var c = 0; c < this.bars.length; c++) {
			var currBar = this.bars[c];
			this.drawRectangle (c * currBar.width, this.constants.canvasHeight - currBar.height, currBar.width, currBar.height, currBar.color);
		}
	}, //end reset
	startAnimation : function () {
		this.animationFrameID = window.requestAnimationFrame(this.update);
	}, //end StartAnimation
	animationFrameID : null, //ID of frame for cancelling animation
	update : function (timestamp) {
		/*
		This is the main draw function
		This gets called roughly 60fps

		NOTE: Back layers need to be drawn first
		*/
		Graphics.clearCanvas();

		if (Graphics.triggerPulse === true) {
			Graphics.shootPulse();
		}

		for (var c = 0; c < Graphics.bars.length; c++) {
			var freq = Music.dancer.getSpectrum();
			var currBar = Graphics.bars[c];
			var newValue = (freq[c] * 1000)  + Graphics.constants.defaultHeight;
			if (newValue > currBar.height) {
				currBar.height = newValue;
			} else {
				currBar.height -= Graphics.constants.barFallSpeed;
			}
			if (currBar.height < Graphics.constants.defaultHeight) {
				currBar.height = Graphics.constants.defaultHeight;
			}
		}
		Graphics.drawAllRectangles();

		// Character Movement
		if (!Music.isPlaying(Music.$player)) {
			if (Character.isJumping) {
				Character.jump();
			}
			if (Character.isMoving) {
				Character.move(Character.direction);
			}
			if (!Character.isFalling && !Character.isJumping) {
				Character.checkBarCollision();
			}
			Character.checkBounds();
		} else {
			Character.isFalling = true;
		}
		if (Character.isFalling) {
			Character.fall();
			Character.checkBarCollision();
		}

		Graphics.updateScore();
		Character.draw();
		Graphics.animationFrameID = window.requestAnimationFrame(Graphics.update);
	},
	updateScore : function () {
		this.ctx.fillStyle = "#888";
		this.ctx.fillText('Points : ' + Character.score, 20, 150);
	},
	endAnimation : function () {
		this.reset();
		window.cancelAnimationFrame(Graphics.animationFrameID);
	},
}; // end Graphics

Character = {
	image : new Image(),
	imgSrcX : 0,
	imgSrcY : 0,
	imgWidth : 113,
	imgHeight : 160,
	height: 51,
	width: 30,
	horzSpeed : 3,
	jumpHeight : 100,
	jumpForce: 10,
	jumpNextMaxHeight: 0,
	gravity : 4,
	position : {x: Graphics.constants.canvasWidth - 30, y : 400},
	isMoving :  false,
	isJumping : false,
	isFalling : false,
	direction: null,
	prevY : null,
	currentY : null,
	score : 0,
	init : function () {
		this.image.src = "character_sheet.png";
	},
	draw : function () {
		Graphics.ctx.drawImage(Character.image, Character.imgSrcX, Character.imgSrcY, Character.imgWidth, Character.imgHeight, Character.position.x, Character.position.y, Character.width, Character.height);
	},
	move : function (direction) {
		switch (direction) {
			case 'LEFT':
				this.imgSrcX = parseInt(this.imgWidth + 2);
				this.position.x -= this.horzSpeed;
				break;
			case 'RIGHT':
				this.imgSrcX = 0;
				this.position.x += this.horzSpeed;
				break;
		}
	},
	jump : function () {
		if ( this.isJumping && !this.isFalling ) {
			//set jump max height for current jump
			if (this.jumpNextMaxHeight == 0) {
				this.jumpNextMaxHeight = this.position.y - this.jumpHeight;
			}
			this.position.y = this.position.y - this.jumpForce;
			//check if reached jump peak
			if (this.position.y <= this.jumpNextMaxHeight) {
				this.isFalling = true;
				this.isJumping = false;
				this.jumpNextMaxHeight = 0;
			} else {
				this.isFalling = false;
				this.isJumping = true;
			}
		}
	},
	fall : function () {
		if ( this.isFalling ) {
			//falls based on gravity
			this.position.y += this.gravity;
		}
	},
	checkBounds : function () {
		if ( (this.position.x + this.width) > Graphics.constants.canvasWidth ) {
			// Right Bounds
			this.isMoving = false;
			this.position.x = Graphics.constants.canvasWidth - this.width;
		}
		if (this.position.x < 0) {
			// Left Bounds
			this.isMoving = false;
			this.position.x = Graphics.constants.canvasWidth - Character.width;
			this.score += 10;
		}
		if ( this.position.y < 0 ) {
			// Top Bounds
			this.isMoving = false;
			this.isFalling = true;
			this.position.y = 0;
		}
		if ( this.position.y > Graphics.constants.canvasHeight) {
			this.position.y = 0;
			this.isFalling = true;
		}
	},
	checkBarCollision : function () {
		var barsInContact = [];
		Graphics.bars.forEach( function (bar) {
			// inline with bar
			if ( (Character.position.x + Character.width) > bar.x  && (Character.position.x < (bar.x + bar.width) ) ) {
				barsInContact.push(bar);
			}
		});
		var tallestBar = 0;
		barsInContact.forEach(function (bar) {
			if (tallestBar < bar.height) {
				tallestBar = bar.height;
			}
		});
		var onBar = (Graphics.constants.canvasHeight - tallestBar) - Character.height;
		var isCharacterOnBar = false;
		var isBumpingIntoBar = false;
		var bumpedBar = null;

		if (Character.isFalling) {
			if (onBar <= Character.position.y) {
				isCharacterOnBar = true;
			}
		} else {
			isCharacterOnBar = true;
		}

		for (var i = 0; i < barsInContact.length; i++) {
			var bar = barsInContact[i];

			var barY = Graphics.constants.canvasHeight - bar.height;

			if (Character.direction === 'LEFT') {
				var barRightSide = bar.x + bar.width;
				var characterRightSide = Character.position.x + Character.width;
				if (Character.position.x < barRightSide && characterRightSide > barRightSide) {
					if ( barY < (Character.position.y + Character.height) - 10) {
						Character.position.x = barRightSide;
						isCharacterOnBar = false;
						isBumpingIntoBar = true;
						bumpedBar = bar.id;
					}
				}
			}
			else if (Character.direction === 'RIGHT') {
				var barLeftSide = bar.x;
				var characterRightSide = Character.position.x + Character.width;

				if (Character.position.x < barLeftSide && characterRightSide > barLeftSide) {
					if ( barY < (Character.position.y + Character.height) - 10) {
						Character.position.x = barLeftSide - Character.width;
						isCharacterOnBar = false;
						isBumpingIntoBar = true;
						bumpedBar = bar.id;

					}
				}
			}
		}//end for

		if (isCharacterOnBar) {
			Character.position.y = onBar;
			Character.isFalling = false;
		} else if (isBumpingIntoBar) {
			barsInContact.forEach(function (bar) {
				if (bar.id === bumpedBar + 1 && Character.direction === 'LEFT') {
					Character.position.y = (Graphics.constants.canvasHeight - bar.height) - Character.height;
				} else if (bar.id === bumpedBar - 1 && Character.direction === 'RIGHT') {
					Character.position.y = (Graphics.constants.canvasHeight - bar.height) - Character.height;
				}
			});
		}
	} //end checkBarCollision

};

KeyHandler = {
	init : function () {
		$(window).on('keydown', KeyHandler.onKeyDown);
		$(window).on('keyup', KeyHandler.onKeyUp);
	},
	onKeyDown : function (key) {
		if (!Music.isPlaying(Music.$player) ) {
			if (key.keyCode === 87 || key.keyCode === 38) {
				// W or UP_ARROW
				key.preventDefault();
				key.stopPropagation();
				if (!Character.isJumping && !Character.isFalling) {
					Character.isJumping = true;
				}
			} else if (key.keyCode === 65 || key.keyCode === 37) {
				// A or LEFT_ARROW
				key.preventDefault();
				key.stopPropagation();
				Character.direction = 'LEFT';
				Character.isMoving = true;

			} else if (key.keyCode === 68 || key.keyCode === 39) {
				// D or RIGHT_ARROW
				key.preventDefault();
				key.stopPropagation();
				Character.direction = 'RIGHT';
				Character.isMoving = true;
			}
		}
	},
	onKeyUp : function (key) {

		if (key.keyCode === 65 || key.keyCode === 37 || key.keyCode === 68 || key.keyCode === 39) {
			// A or LEFT_ARROW or D or RIGHT_ARROW
			Character.isMoving = false;
			Character.direction = null;
		}
		else if (key.keyCode === 87 || key.keyCode === 38) {
			// W or UP_ARROW
			//Character.isJumping = false;
		}
		else if (key.keyCode === 32) {
			// SPACEBAR
			key.preventDefault();
			key.stopPropagation();
			if (Music.isPlaying(Music.$player) ) {
				//Make sure the audio is queued before trying to play
				if (Music.$player.src != "") {
					Music.$player.play();
					Music.$instructions.removeClass('open');
				}
			} else {
				Music.$player.pause();
				Music.$instructions.addClass('open');
			}
		}
	}
}; // end KeyHandler

window.onload = app.init;